/**
 * Centralized Error Handler
 * Handles uncaught exceptions and unhandled rejections
 *
 * Features:
 * - Structured error logging
 * - Error categorization
 * - User-friendly error messages
 * - Crash recovery
 */

import { app, dialog } from 'electron';
import { logger } from './logger';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  DATABASE = 'database',
  IPC = 'ipc',
  FILE_SYSTEM = 'file_system',
  NETWORK = 'network',
  RENDERER = 'renderer',
  WINDOW = 'window',
  SESSION = 'session',
  UNKNOWN = 'unknown'
}

export interface AppError {
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  error: Error;
  recoverable: boolean;
  context?: Record<string, any>;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private isShuttingDown = false;

  private constructor() {
    this.setupGlobalHandlers();
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalHandlers(): void {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      this.handleUncaughtException(error);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any) => {
      this.handleUnhandledRejection(reason);
    });

    // Handle app-level errors
    app.on('render-process-gone', (event, webContents, details) => {
      logger.error('Renderer process crashed', undefined, {
        component: 'renderer',
        reason: details.reason,
        exitCode: details.exitCode
      });

      if (details.reason !== 'clean-exit') {
        this.showErrorDialog(
          'Application Error',
          'A rendering error occurred. The application will attempt to recover.',
          false
        );
      }
    });
  }

  /**
   * Handle uncaught exceptions
   */
  private handleUncaughtException(error: Error): void {
    logger.error('Uncaught exception', error, {
      component: 'main-process',
      severity: ErrorSeverity.CRITICAL
    });

    if (!this.isShuttingDown) {
      this.showErrorDialog(
        'Critical Error',
        'A critical error occurred. The application will now close.',
        true
      );

      // Graceful shutdown
      this.shutdown();
    }
  }

  /**
   * Handle unhandled promise rejections
   */
  private handleUnhandledRejection(reason: any): void {
    const error = reason instanceof Error ? reason : new Error(String(reason));

    logger.error('Unhandled promise rejection', error, {
      component: 'main-process',
      severity: ErrorSeverity.HIGH
    });

    // Log but don't crash for unhandled rejections
    // They're often recoverable
  }

  /**
   * Handle application errors with categorization
   */
  handleError(appError: AppError): void {
    logger.error(appError.message, appError.error, {
      category: appError.category,
      severity: appError.severity,
      recoverable: appError.recoverable,
      ...appError.context
    });

    // Show error dialog for high severity non-recoverable errors
    if (
      appError.severity === ErrorSeverity.CRITICAL ||
      (appError.severity === ErrorSeverity.HIGH && !appError.recoverable)
    ) {
      this.showErrorDialog(
        this.getErrorTitle(appError.category),
        this.getErrorMessage(appError),
        !appError.recoverable
      );

      if (!appError.recoverable) {
        this.shutdown();
      }
    }
  }

  /**
   * Get user-friendly error title
   */
  private getErrorTitle(category: ErrorCategory): string {
    switch (category) {
      case ErrorCategory.DATABASE:
        return 'Database Error';
      case ErrorCategory.IPC:
        return 'Communication Error';
      case ErrorCategory.FILE_SYSTEM:
        return 'File System Error';
      case ErrorCategory.NETWORK:
        return 'Network Error';
      case ErrorCategory.RENDERER:
        return 'Display Error';
      case ErrorCategory.WINDOW:
        return 'Window Error';
      case ErrorCategory.SESSION:
        return 'Session Error';
      default:
        return 'Application Error';
    }
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(appError: AppError): string {
    let message = appError.message;

    if (!appError.recoverable) {
      message += '\n\nThe application will now close.';
    } else {
      message += '\n\nThe application will attempt to recover.';
    }

    return message;
  }

  /**
   * Show error dialog to user
   */
  private showErrorDialog(title: string, message: string, willQuit: boolean): void {
    dialog.showErrorBox(title, message);

    if (willQuit) {
      // Give user time to read the error
      setTimeout(() => {
        app.quit();
      }, 1000);
    }
  }

  /**
   * Graceful shutdown
   */
  private shutdown(): void {
    if (this.isShuttingDown) return;

    this.isShuttingDown = true;
    logger.info('Initiating graceful shutdown due to error');

    // Close logger to flush all logs
    logger.close().then(() => {
      app.quit();
    });
  }

  /**
   * Create a categorized error
   */
  static createError(
    category: ErrorCategory,
    severity: ErrorSeverity,
    message: string,
    error: Error,
    recoverable: boolean = true,
    context?: Record<string, any>
  ): AppError {
    return {
      category,
      severity,
      message,
      error,
      recoverable,
      context
    };
  }
}

// Helper functions for common error scenarios

export function handleDatabaseError(error: Error, operation: string, recoverable: boolean = true): void {
  ErrorHandler.getInstance().handleError(
    ErrorHandler.createError(
      ErrorCategory.DATABASE,
      recoverable ? ErrorSeverity.MEDIUM : ErrorSeverity.CRITICAL,
      `Database operation failed: ${operation}`,
      error,
      recoverable,
      { operation }
    )
  );
}

export function handleIpcError(error: Error, channel: string): void {
  ErrorHandler.getInstance().handleError(
    ErrorHandler.createError(
      ErrorCategory.IPC,
      ErrorSeverity.MEDIUM,
      `IPC communication failed on channel: ${channel}`,
      error,
      true,
      { channel }
    )
  );
}

export function handleFileSystemError(error: Error, path: string, recoverable: boolean = true): void {
  ErrorHandler.getInstance().handleError(
    ErrorHandler.createError(
      ErrorCategory.FILE_SYSTEM,
      recoverable ? ErrorSeverity.MEDIUM : ErrorSeverity.HIGH,
      `File system operation failed: ${path}`,
      error,
      recoverable,
      { path }
    )
  );
}

export function handleWindowError(error: Error, recoverable: boolean = true): void {
  ErrorHandler.getInstance().handleError(
    ErrorHandler.createError(
      ErrorCategory.WINDOW,
      recoverable ? ErrorSeverity.MEDIUM : ErrorSeverity.HIGH,
      'Window management error',
      error,
      recoverable
    )
  );
}

export function handleSessionError(error: Error): void {
  ErrorHandler.getInstance().handleError(
    ErrorHandler.createError(
      ErrorCategory.SESSION,
      ErrorSeverity.LOW,
      'Session management error',
      error,
      true
    )
  );
}

// Initialize global error handler
export function initializeErrorHandler(): void {
  ErrorHandler.getInstance();
  logger.info('Error handler initialized');
}
