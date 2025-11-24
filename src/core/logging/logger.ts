/**
 * Structured Logging System
 * Uses Winston for production-grade logging with rotation
 *
 * Features:
 * - Multiple log levels (error, warn, info, debug)
 * - Separate log files for errors and combined logs
 * - Daily log rotation with compression
 * - Structured JSON logging for production
 * - Colorized console output for development
 * - Context-aware logging
 */

import winston from 'winston';
import { join } from 'path';
import { app } from 'electron';

// Log levels
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

// Log context for structured logging
export interface LogContext {
  component?: string;
  operation?: string;
  userId?: string;
  workspaceId?: string;
  itemId?: string;
  [key: string]: any;
}

class Logger {
  private logger: winston.Logger;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = !app.isPackaged;

    // Configure log directory
    const logDir = this.isDevelopment
      ? join(process.cwd(), 'logs')
      : join(app.getPath('userData'), 'logs');

    // Create Winston logger
    this.logger = winston.createLogger({
      level: this.isDevelopment ? 'debug' : 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.metadata(),
        winston.format.json()
      ),
      defaultMeta: {
        app: 'workspace-navigator',
        version: app.getVersion()
      },
      transports: [
        // Error log file
        new winston.transports.File({
          filename: join(logDir, 'error.log'),
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 10,
          tailable: true
        }),

        // Combined log file
        new winston.transports.File({
          filename: join(logDir, 'combined.log'),
          maxsize: 10485760, // 10MB
          maxFiles: 5,
          tailable: true
        })
      ]
    });

    // Console transport for development
    if (this.isDevelopment) {
      this.logger.add(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
            winston.format.printf(({ level, message, timestamp, ...meta }) => {
              const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
              return `${timestamp} [${level}]: ${message}${metaStr}`;
            })
          )
        })
      );
    }
  }

  /**
   * Log an error
   */
  error(message: string, error?: Error, context?: LogContext): void {
    this.logger.error(message, {
      ...context,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          }
        : undefined
    });
  }

  /**
   * Log a warning
   */
  warn(message: string, context?: LogContext): void {
    this.logger.warn(message, context);
  }

  /**
   * Log informational message
   */
  info(message: string, context?: LogContext): void {
    this.logger.info(message, context);
  }

  /**
   * Log debug information
   */
  debug(message: string, context?: LogContext): void {
    this.logger.debug(message, context);
  }

  /**
   * Log operation start
   */
  startOperation(operation: string, context?: LogContext): void {
    this.info(`Starting: ${operation}`, { ...context, operation, phase: 'start' });
  }

  /**
   * Log operation success
   */
  endOperation(operation: string, duration: number, context?: LogContext): void {
    this.info(`Completed: ${operation}`, {
      ...context,
      operation,
      phase: 'end',
      duration
    });
  }

  /**
   * Log operation failure
   */
  failOperation(operation: string, error: Error, duration: number, context?: LogContext): void {
    this.error(`Failed: ${operation}`, error, {
      ...context,
      operation,
      phase: 'fail',
      duration
    });
  }

  /**
   * Create a child logger with default context
   */
  child(defaultContext: LogContext): Logger {
    const childLogger = new Logger();
    const originalLogger = childLogger.logger;

    // Wrap methods to add default context
    childLogger.logger = {
      ...originalLogger,
      error: (message: string, meta?: any) =>
        originalLogger.error(message, { ...defaultContext, ...meta }),
      warn: (message: string, meta?: any) =>
        originalLogger.warn(message, { ...defaultContext, ...meta }),
      info: (message: string, meta?: any) =>
        originalLogger.info(message, { ...defaultContext, ...meta }),
      debug: (message: string, meta?: any) =>
        originalLogger.debug(message, { ...defaultContext, ...meta })
    } as any;

    return childLogger;
  }

  /**
   * Close all transports and flush logs
   */
  close(): Promise<void> {
    return new Promise((resolve) => {
      this.logger.close();
      // Give a small delay to ensure logs are flushed
      setTimeout(() => resolve(), 100);
    });
  }
}

// Global logger instance
export const logger = new Logger();

/**
 * Timing helper for operations
 */
export class OperationTimer {
  private startTime: number;
  private operation: string;
  private context?: LogContext;

  constructor(operation: string, context?: LogContext) {
    this.operation = operation;
    this.context = context;
    this.startTime = Date.now();
    logger.startOperation(operation, context);
  }

  /**
   * End operation successfully
   */
  end(): void {
    const duration = Date.now() - this.startTime;
    logger.endOperation(this.operation, duration, this.context);
  }

  /**
   * End operation with failure
   */
  fail(error: Error): void {
    const duration = Date.now() - this.startTime;
    logger.failOperation(this.operation, error, duration, this.context);
  }
}

/**
 * Decorator for automatic operation logging
 */
export function LogOperation(operation?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const operationName = operation || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      const timer = new OperationTimer(operationName);
      try {
        const result = await originalMethod.apply(this, args);
        timer.end();
        return result;
      } catch (error) {
        timer.fail(error as Error);
        throw error;
      }
    };

    return descriptor;
  };
}
