/**
 * Structured Logger Implementation
 * Comprehensive logging system with Winston backend
 */

import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';
import DailyRotateFile from 'winston-daily-rotate-file';
import { LogSanitizer } from '../security/log-sanitizer.js';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

export interface LogContext {
  correlationId?: string;
  userId?: string;
  toolName?: string;
  operation?: string;
  duration?: number;
  [key: string]: any;
}

export interface LogConfig {
  level: 'error' | 'warn' | 'info' | 'debug';
  dir: string;
}

export class StructuredLogger {
  private winston: winston.Logger;
  private correlationId: string | null = null;

  constructor(
    private serviceName: string = 'cof-mcp',
    private config?: LogConfig
  ) {
    this.winston = this.createLogger();
  }

  private createLogger(): winston.Logger {
    // Use config if provided, otherwise fall back to env vars, then defaults
    const logLevel = this.config?.level || process.env.LOG_LEVEL || 'info';
    let logDir = this.config?.dir || process.env.LOG_DIR || 'logs';

    // Make log directory absolute if it's relative
    if (!path.isAbsolute(logDir)) {
      // Find the server directory (parent of dist when running compiled code)
      const currentDir = path.dirname(new URL(import.meta.url).pathname);
      const serverDir = currentDir.includes('/dist/')
        ? path.resolve(currentDir.split('/dist/')[0])
        : path.resolve(process.cwd(), 'server');
      logDir = path.join(serverDir, logDir);
    }

    // Ensure logs directory exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Create custom format
    const customFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.metadata({
        fillExcept: ['message', 'level', 'timestamp', 'label']
      }),
      winston.format.json()
    );

    // Console transport for stderr (MCP requirement)
    const consoleTransport = new winston.transports.Console({
      level: logLevel,
      stderrLevels: ['error', 'warn', 'info', 'debug'],
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `[${timestamp}] ${level}: ${message}${metaStr}`;
        })
      )
    });

    // File transport for persistent logs
    const fileTransport = new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      format: customFormat
    });

    const combinedTransport = new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      level: logLevel,
      maxsize: 10485760, // 10MB
      maxFiles: 10,
      format: customFormat
    });

    // Create logger instance
    const logger = winston.createLogger({
      level: logLevel,
      format: customFormat,
      defaultMeta: { service: this.serviceName },
      transports: [
        consoleTransport,
        fileTransport,
        combinedTransport
      ]
    });

    // Add daily rotate transport if in production
    if (process.env.NODE_ENV === 'production') {
      try {
        const dailyTransport = new DailyRotateFile({
          filename: path.join(logDir, 'application-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          format: customFormat
        });

        logger.add(dailyTransport);
      } catch (error) {
        // Daily rotate file is optional
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn('Daily rotate file transport not available:', errorMessage);
      }
    }

    return logger;
  }

  setCorrelationId(id: string): void {
    this.correlationId = id;
  }

  clearCorrelationId(): void {
    this.correlationId = null;
  }

  error(message: string, context?: LogContext | Error): void {
    const meta = this.buildMetadata(context);

    if (context instanceof Error) {
      this.winston.error(message, {
        ...meta,
        error: {
          message: context.message,
          stack: context.stack,
          name: context.name
        }
      });
    } else {
      this.winston.error(message, meta);
    }
  }

  warn(message: string, context?: LogContext): void {
    this.winston.warn(message, this.buildMetadata(context));
  }

  info(message: string, context?: LogContext): void {
    this.winston.info(message, this.buildMetadata(context));
  }

  debug(message: string, context?: LogContext): void {
    this.winston.debug(message, this.buildMetadata(context));
  }

  // Trace is mapped to debug for simplicity (Winston doesn't have trace by default)
  trace(message: string, context?: LogContext): void {
    this.winston.debug(`[TRACE] ${message}`, this.buildMetadata(context));
  }

  private buildMetadata(context?: LogContext | Error): any {
    if (context instanceof Error) {
      return {
        correlationId: this.correlationId,
        timestamp: new Date().toISOString()
      };
    }

    // Sanitize sensitive data
    const sanitized = context ? LogSanitizer.redactSensitive(context) : {};

    return {
      correlationId: this.correlationId,
      timestamp: new Date().toISOString(),
      ...sanitized
    };
  }

  // Structured logging for specific events
  logRequest(method: string, params: any, context?: LogContext): void {
    this.info('Request received', {
      ...context,
      method,
      params: LogSanitizer.redactSensitive(params)
    });
  }

  logResponse(method: string, duration: number, success: boolean, context?: LogContext): void {
    const level = success ? 'info' : 'warn';
    this.winston.log(level, 'Request completed', {
      ...this.buildMetadata(context),
      method,
      duration,
      success
    });
  }

  logToolExecution(toolName: string, params: any, result: any, duration: number): void {
    this.info('Tool executed', {
      toolName,
      params: LogSanitizer.redactSensitive(params),
      success: !result.isError,
      duration,
      resultSize: result ? JSON.stringify(result).length : 0
    });
  }

  logAdapterCall(operation: string, duration: number, success: boolean): void {
    this.debug('Adapter call', {
      operation,
      duration,
      success,
      adapter: process.env.ADAPTER_TYPE
    });
  }

  // Performance logging
  startTimer(operation: string): () => number {
    const start = Date.now();

    return () => {
      const duration = Date.now() - start;
      this.debug(`${operation} completed`, { duration });
      return duration;
    };
  }

  // Audit logging
  audit(action: string, details: any): void {
    this.info('Audit event', {
      action,
      details: LogSanitizer.redactSensitive(details),
      timestamp: new Date().toISOString(),
      source: 'audit'
    });
  }

  // Health check logging
  logHealthCheck(component: string, status: 'healthy' | 'unhealthy', details?: any): void {
    const level = status === 'healthy' ? 'debug' : 'warn';
    this.winston.log(level, `Health check: ${component}`, {
      component,
      status,
      details: details ? LogSanitizer.redactSensitive(details) : undefined,
      timestamp: new Date().toISOString()
    });
  }

  // Metrics logging
  logMetric(name: string, value: number, unit?: string, tags?: Record<string, string>): void {
    this.debug('Metric recorded', {
      metric: name,
      value,
      unit,
      tags,
      timestamp: new Date().toISOString()
    });
  }
}

// Singleton logger instance
let loggerInstance: StructuredLogger;

export function getLogger(serviceName?: string, config?: LogConfig): StructuredLogger {
  if (!loggerInstance) {
    loggerInstance = new StructuredLogger(serviceName, config);
  }
  return loggerInstance;
}

// Reset logger (for testing)
export function resetLogger(): void {
  loggerInstance = null as any;
}
