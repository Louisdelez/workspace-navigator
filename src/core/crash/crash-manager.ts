/**
 * Crash Manager - T056
 * Manages crash detection and automatic recovery
 */

import { BrowserWindow, app } from 'electron';
import { logger } from '../logging/logger';
import { CrashReporter, CrashReport } from './crash-reporter';

export interface CrashManagerConfig {
  autoRecover: boolean;
  maxRecoveryAttempts: number;
  recoveryDelay: number; // milliseconds
  notifyUser: boolean;
}

/**
 * Crash Manager
 * Detects crashes and implements automatic recovery
 */
export class CrashManager {
  private config: CrashManagerConfig;
  private recoveryAttempts: Map<number, number> = new Map();
  private mainWindow: BrowserWindow | null = null;

  constructor(config: Partial<CrashManagerConfig> = {}) {
    this.config = {
      autoRecover: true,
      maxRecoveryAttempts: 3,
      recoveryDelay: 2000,
      notifyUser: true,
      ...config
    };

    logger.info('Crash manager initialized', { config: this.config });

    // Attach app-level crash handlers
    this.attachAppHandlers();
  }

  /**
   * Attach crash handlers to the app
   */
  private attachAppHandlers(): void {
    // T056: GPU process crashed
    // Note: Using 'as any' because TypeScript doesn't have types for this event
    (app as any).on('gpu-process-crashed', (_event: any, killed: boolean) => {
      logger.error('GPU process crashed', new Error('GPU crash'), { killed });

      const crashReport: CrashReport = {
        timestamp: Date.now(),
        type: 'gpu',
        details: { killed }
      };

      CrashReporter.report(crashReport);
    });
  }

  /**
   * Set main window reference
   */
  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
    this.attachWindowHandlers(window);
  }

  /**
   * Attach crash handlers to a window
   */
  private attachWindowHandlers(window: BrowserWindow): void {
    const webContents = window.webContents;

    // T056: Renderer process crashed
    webContents.on('render-process-gone', (event, details) => {
      const processId = webContents.getOSProcessId();

      logger.error('Renderer process crashed', new Error('Renderer crash'), {
        processId,
        reason: details.reason,
        exitCode: details.exitCode
      });

      // Report crash
      const crashReport: CrashReport = {
        timestamp: Date.now(),
        type: 'renderer',
        processId,
        reason: details.reason,
        exitCode: details.exitCode,
        url: webContents.getURL(),
        details
      };

      CrashReporter.report(crashReport);

      // Attempt recovery
      if (this.config.autoRecover) {
        this.attemptRecovery(window, processId);
      }
    });

    // T056: Renderer process became unresponsive
    webContents.on('unresponsive', () => {
      logger.warn('Renderer process became unresponsive', {
        processId: webContents.getOSProcessId(),
        url: webContents.getURL()
      });

      if (this.config.notifyUser) {
        // Send notification to renderer
        window.webContents.send('app:unresponsive');
      }
    });

    // T056: Renderer process became responsive again
    webContents.on('responsive', () => {
      logger.info('Renderer process became responsive again', {
        processId: webContents.getOSProcessId()
      });

      // Send notification to renderer
      window.webContents.send('app:responsive');
    });
  }

  /**
   * Attempt to recover from crash
   */
  private attemptRecovery(window: BrowserWindow, processId: number): void {
    const attempts = this.recoveryAttempts.get(processId) || 0;

    if (attempts >= this.config.maxRecoveryAttempts) {
      logger.error('Max recovery attempts reached, giving up', new Error('Recovery failed'), {
        processId,
        attempts
      });

      if (this.config.notifyUser) {
        // Show critical error dialog
        const { dialog } = require('electron');
        dialog.showErrorBox(
          'Application Error',
          'The application has crashed multiple times and cannot recover. Please restart the application.'
        );
      }

      // Quit application
      app.quit();
      return;
    }

    this.recoveryAttempts.set(processId, attempts + 1);

    logger.info('Attempting crash recovery', {
      processId,
      attempt: attempts + 1,
      maxAttempts: this.config.maxRecoveryAttempts
    });

    // Delay recovery to avoid rapid crash loops
    setTimeout(() => {
      try {
        // Reload the window
        if (!window.isDestroyed()) {
          window.reload();
          logger.info('Window reloaded successfully', { processId });

          // Reset recovery attempts after successful reload
          setTimeout(() => {
            this.recoveryAttempts.delete(processId);
          }, 60000); // Reset after 1 minute of stability
        }
      } catch (error) {
        logger.error('Failed to recover from crash', error as Error, { processId });
      }
    }, this.config.recoveryDelay);
  }

  /**
   * Handle uncaught exception in main process
   */
  static handleUncaughtException(error: Error): void {
    logger.error('Uncaught exception in main process', error);

    // Report crash
    const crashReport: CrashReport = {
      timestamp: Date.now(),
      type: 'main',
      errorMessage: error.message,
      stack: error.stack,
      details: { error }
    };

    CrashReporter.report(crashReport);

    // Show error dialog
    const { dialog } = require('electron');
    dialog.showErrorBox(
      'Critical Error',
      `A critical error occurred:\n\n${error.message}\n\nThe application will now close.`
    );

    // Exit gracefully
    app.exit(1);
  }

  /**
   * Handle unhandled rejection in main process
   */
  static handleUnhandledRejection(reason: any): void {
    logger.error('Unhandled promise rejection in main process', new Error('Unhandled rejection'), {
      reason
    });

    // Report crash
    const crashReport: CrashReport = {
      timestamp: Date.now(),
      type: 'main',
      errorMessage: reason?.message || String(reason),
      stack: reason?.stack,
      details: { reason }
    };

    CrashReporter.report(crashReport);
  }

  /**
   * Get crash statistics
   */
  getStatistics() {
    return CrashReporter.getStatistics();
  }

  /**
   * Get recent crashes
   */
  getRecentCrashes(limit?: number) {
    return CrashReporter.getRecentCrashes(limit);
  }
}
