/**
 * Logger utility for the application
 * Supports different log levels: info, warn, error
 * Records request information and error details
 */

export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
}

interface RequestLogContext {
  method?: string;
  path?: string;
  ip?: string;
  status?: number;
  duration?: number;
}

interface ErrorLogContext extends RequestLogContext {
  stack?: string;
  error?: string;
}

class Logger {
  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private formatLogEntry(entry: LogEntry): string {
    const { timestamp, level, message, context } = entry;
    let logMessage = `[${timestamp}] [${level}] ${message}`;
    
    if (context && Object.keys(context).length > 0) {
      logMessage += ` ${JSON.stringify(context)}`;
    }
    
    return logMessage;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level,
      message,
      context,
    };

    const formattedMessage = this.formatLogEntry(entry);

    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.INFO:
      default:
        console.log(formattedMessage);
        break;
    }
  }

  /**
   * Log informational messages
   */
  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log warning messages
   */
  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log error messages with optional stack trace
   */
  error(message: string, context?: ErrorLogContext): void {
    this.log(LogLevel.ERROR, message, context);
  }

  /**
   * Log HTTP request information
   */
  request(context: RequestLogContext): void {
    const { method, path, status, duration, ip } = context;
    const message = `${method} ${path} ${status}${duration ? ` - ${duration}ms` : ''}`;
    this.info(message, { ip });
  }
}

// Export singleton instance
export const logger = new Logger();
