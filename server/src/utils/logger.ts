/**
 * Logger utility - Enhanced with structured logging
 * Logs to stderr to avoid polluting stdio transport
 * Maintains backward compatibility while adding structured logging
 */

import { getLogger, StructuredLogger, LogConfig } from '../logging/structured-logger.js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class Logger {
  private static level: LogLevel = 'info';
  private static levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  private static structuredLogger: StructuredLogger | null = null;
  private static useStructured: boolean = false;

  static init(level: LogLevel, useStructured: boolean = false, logConfig?: LogConfig): void {
    this.level = level;
    this.useStructured = useStructured;

    if (useStructured) {
      this.structuredLogger = getLogger('cof-mcp', logConfig);
    }
  }

  private static shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.level];
  }

  private static format(level: LogLevel, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const formatted = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    if (args.length > 0) {
      const additional = args.map(arg => {
        if (arg instanceof Error) {
          return `${arg.message}\n${arg.stack}`;
        }
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' ');

      return `${formatted} ${additional}`;
    }

    return formatted;
  }

  static debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      if (this.useStructured && this.structuredLogger) {
        const context = args.length > 0 ? { args } : undefined;
        this.structuredLogger.debug(message, context);
      } else {
        console.error(this.format('debug', message, ...args));
      }
    }
  }

  static info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      if (this.useStructured && this.structuredLogger) {
        const context = args.length > 0 ? { args } : undefined;
        this.structuredLogger.info(message, context);
      } else {
        console.error(this.format('info', message, ...args));
      }
    }
  }

  static warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      if (this.useStructured && this.structuredLogger) {
        const context = args.length > 0 ? { args } : undefined;
        this.structuredLogger.warn(message, context);
      } else {
        console.error(this.format('warn', message, ...args));
      }
    }
  }

  static error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      if (this.useStructured && this.structuredLogger) {
        // Handle Error objects specially
        if (args.length === 1 && args[0] instanceof Error) {
          this.structuredLogger.error(message, args[0]);
        } else {
          const context = args.length > 0 ? { args } : undefined;
          this.structuredLogger.error(message, context);
        }
      } else {
        console.error(this.format('error', message, ...args));
      }
    }
  }

  // New structured logging methods
  static getStructuredLogger(): StructuredLogger | null {
    return this.structuredLogger;
  }

  static enableStructuredLogging(logConfig?: LogConfig): void {
    this.useStructured = true;
    if (!this.structuredLogger) {
      this.structuredLogger = getLogger('cof-mcp', logConfig);
    }
  }

  static disableStructuredLogging(): void {
    this.useStructured = false;
  }
}
