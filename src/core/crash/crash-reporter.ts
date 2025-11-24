/**
 * Crash Reporter - T056
 * Reports and logs application crashes
 */

import { logger } from '../logging/logger';
import { app } from 'electron';
import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync, readdirSync, statSync, unlinkSync } from 'fs';

export interface CrashReport {
  timestamp: number;
  type: 'renderer' | 'main' | 'gpu';
  processId?: number;
  reason?: string;
  exitCode?: number;
  url?: string;
  errorMessage?: string;
  stack?: string;
  details?: any;
}

/**
 * Crash Reporter
 * Logs and manages crash reports
 */
export class CrashReporter {
  private static crashDir: string;
  private static maxReports = 50; // Keep last 50 crash reports

  /**
   * Initialize crash reporter
   */
  static initialize(): void {
    this.crashDir = join(app.getPath('userData'), 'crashes');

    // Create crashes directory if it doesn't exist
    if (!existsSync(this.crashDir)) {
      mkdirSync(this.crashDir, { recursive: true });
    }

    // Clean old reports
    this.cleanOldReports();

    logger.info('Crash reporter initialized', { crashDir: this.crashDir });
  }

  /**
   * Report a crash
   */
  static report(crashReport: CrashReport): void {
    logger.error('Application crash detected', new Error('Crash'), {
      type: crashReport.type,
      processId: crashReport.processId,
      reason: crashReport.reason,
      exitCode: crashReport.exitCode,
      url: crashReport.url
    });

    // Save crash report to disk
    try {
      const filename = `crash-${crashReport.timestamp}-${crashReport.type}.json`;
      const filepath = join(this.crashDir, filename);

      writeFileSync(filepath, JSON.stringify(crashReport, null, 2), 'utf-8');

      logger.info('Crash report saved', { filepath });
    } catch (error) {
      logger.error('Failed to save crash report', error as Error);
    }
  }

  /**
   * Get recent crash reports
   */
  static getRecentCrashes(limit: number = 10): CrashReport[] {
    try {
      if (!existsSync(this.crashDir)) {
        return [];
      }

      const files = readdirSync(this.crashDir)
        .filter(file => file.startsWith('crash-') && file.endsWith('.json'))
        .map(file => ({
          file,
          path: join(this.crashDir, file),
          timestamp: statSync(join(this.crashDir, file)).mtimeMs
        }))
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);

      return files.map(({ path }) => {
        try {
          const content = require('fs').readFileSync(path, 'utf-8');
          return JSON.parse(content);
        } catch (error) {
          logger.error('Failed to read crash report', error as Error, { path });
          return null;
        }
      }).filter(Boolean) as CrashReport[];
    } catch (error) {
      logger.error('Failed to get recent crashes', error as Error);
      return [];
    }
  }

  /**
   * Clean old crash reports (keep last N reports)
   */
  private static cleanOldReports(): void {
    try {
      if (!existsSync(this.crashDir)) {
        return;
      }

      const files = readdirSync(this.crashDir)
        .filter(file => file.startsWith('crash-') && file.endsWith('.json'))
        .map(file => ({
          file,
          path: join(this.crashDir, file),
          timestamp: statSync(join(this.crashDir, file)).mtimeMs
        }))
        .sort((a, b) => b.timestamp - a.timestamp);

      // Delete old reports
      if (files.length > this.maxReports) {
        const toDelete = files.slice(this.maxReports);
        let deletedCount = 0;

        toDelete.forEach(({ path }) => {
          try {
            unlinkSync(path);
            deletedCount++;
          } catch (error) {
            logger.error('Failed to delete old crash report', error as Error, { path });
          }
        });

        if (deletedCount > 0) {
          logger.info(`Cleaned ${deletedCount} old crash reports`);
        }
      }
    } catch (error) {
      logger.error('Failed to clean old crash reports', error as Error);
    }
  }

  /**
   * Get crash statistics
   */
  static getStatistics(): {
    total: number;
    byType: Record<string, number>;
    lastCrash?: number;
  } {
    const crashes = this.getRecentCrashes(this.maxReports);

    const byType: Record<string, number> = {};
    crashes.forEach(crash => {
      byType[crash.type] = (byType[crash.type] || 0) + 1;
    });

    return {
      total: crashes.length,
      byType,
      lastCrash: crashes[0]?.timestamp
    };
  }
}
