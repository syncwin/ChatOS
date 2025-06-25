/**
 * Structured logging utility for better debugging and monitoring
 * Provides categorized logging with metadata support
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogCategory = 'MESSAGE_FLOW' | 'STATE_MACHINE' | 'API_CALL' | 'CACHE_OPERATION' | 'USER_ACTION' | 'PERFORMANCE';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  action: string;
  metadata?: Record<string, unknown>;
  messageId?: string;
  chatId?: string;
  userId?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory

  private log(level: LogLevel, category: LogCategory, action: string, metadata?: Record<string, unknown>) {
    if (!this.isDevelopment && level === 'debug') return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      action,
      ...metadata
    };

    // Add to memory store
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output with formatting
    const prefix = `[${category}]`;
    const message = `${prefix} ${action}`;
    const logData = metadata ? { ...metadata } : undefined;

    switch (level) {
      case 'debug':
        console.debug(message, logData);
        break;
      case 'info':
        console.log(message, logData);
        break;
      case 'warn':
        console.warn(message, logData);
        break;
      case 'error':
        console.error(message, logData);
        break;
    }
  }

  // Message flow logging
  messageFlow(action: string, messageId: string, metadata?: Record<string, unknown>) {
    this.log('info', 'MESSAGE_FLOW', action, { messageId, ...metadata });
  }

  // State machine logging
  stateTransition(messageId: string, fromState: string, toState: string, metadata?: Record<string, unknown>) {
    this.log('debug', 'STATE_MACHINE', `State transition: ${fromState} -> ${toState}`, { messageId, fromState, toState, ...metadata });
  }

  // API call logging
  apiCall(action: string, provider: string, model: string, metadata?: Record<string, unknown>) {
    this.log('info', 'API_CALL', action, { provider, model, ...metadata });
  }

  // Cache operation logging
  cacheOperation(action: string, key: string, metadata?: Record<string, unknown>) {
    this.log('debug', 'CACHE_OPERATION', action, { cacheKey: key, ...metadata });
  }

  // User action logging
  userAction(action: string, userId?: string, metadata?: Record<string, any>) {
    this.log('info', 'USER_ACTION', action, { userId, ...metadata });
  }

  // Performance logging
  performance(action: string, duration: number, metadata?: Record<string, any>) {
    this.log('info', 'PERFORMANCE', `${action} took ${duration}ms`, { duration, ...metadata });
  }

  // Error logging
  error(action: string, error: Error | string, metadata?: Record<string, any>) {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : undefined;
    this.log('error', 'MESSAGE_FLOW', action, { error: errorMessage, stack: errorStack, ...metadata });
  }

  // Warning logging
  warn(action: string, metadata?: Record<string, any>) {
    this.log('warn', 'MESSAGE_FLOW', action, metadata);
  }

  // Get logs for debugging
  getLogs(category?: LogCategory, level?: LogLevel): LogEntry[] {
    return this.logs.filter(log => {
      if (category && log.category !== category) return false;
      if (level && log.level !== level) return false;
      return true;
    });
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
  }

  // Export logs for debugging
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Singleton instance
export const logger = new Logger();

// Performance measurement utility
export const measurePerformance = async <T>(
  action: string,
  fn: () => Promise<T> | T,
  metadata?: Record<string, any>
): Promise<T> => {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    logger.performance(action, duration, metadata);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    logger.error(`${action} failed after ${duration}ms`, error as Error, metadata);
    throw error;
  }
};