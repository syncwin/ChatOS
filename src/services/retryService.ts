import { logger } from '../lib/logger';

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: any;
  attempts: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  retryCondition: (error: any) => {
    // Retry on network errors, 5xx server errors, and timeouts
    if (error?.name === 'NetworkError' || error?.name === 'TimeoutError') {
      return true;
    }
    if (error?.status >= 500 && error?.status < 600) {
      return true;
    }
    if (error?.code === 'NETWORK_ERROR' || error?.code === 'TIMEOUT') {
      return true;
    }
    return false;
  },
  onRetry: () => {}
};

export class RetryService {
  private static calculateDelay(attempt: number, options: Required<RetryOptions>): number {
    const delay = options.baseDelay * Math.pow(options.backoffFactor, attempt - 1);
    return Math.min(delay, options.maxDelay);
  }

  private static async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry an async operation with exponential backoff
   */
  static async retry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<RetryResult<T>> {
    const config = { ...DEFAULT_OPTIONS, ...options };
    let lastError: any;
    
    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        const result = await operation();
        
        if (attempt > 1) {
          logger.messageFlow(`Operation succeeded on attempt ${attempt}`);
        }
        
        return {
          success: true,
          data: result,
          attempts: attempt
        };
      } catch (error) {
        lastError = error;
        
        logger.warn(`Operation failed on attempt ${attempt}/${config.maxAttempts}:`, {
          error: error instanceof Error ? error.message : String(error),
          attempt,
          willRetry: attempt < config.maxAttempts && config.retryCondition(error)
        });
        
        // Check if we should retry
        if (attempt === config.maxAttempts || !config.retryCondition(error)) {
          break;
        }
        
        // Call retry callback
        config.onRetry(attempt, error);
        
        // Wait before retrying
        const delay = this.calculateDelay(attempt, config);
        await this.sleep(delay);
      }
    }
    
    return {
      success: false,
      error: lastError,
      attempts: config.maxAttempts
    };
  }

  /**
   * Retry with custom retry condition for specific error types
   */
  static async retryWithCondition<T>(
    operation: () => Promise<T>,
    retryCondition: (error: any) => boolean,
    maxAttempts: number = 3
  ): Promise<RetryResult<T>> {
    return this.retry(operation, {
      maxAttempts,
      retryCondition
    });
  }

  /**
   * Retry network operations (common use case)
   */
  static async retryNetworkOperation<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3
  ): Promise<RetryResult<T>> {
    return this.retry(operation, {
      maxAttempts,
      retryCondition: (error: any) => {
        // Network-specific retry conditions
        return (
          error?.name === 'NetworkError' ||
          error?.name === 'TimeoutError' ||
          error?.code === 'NETWORK_ERROR' ||
          error?.code === 'ECONNRESET' ||
          error?.code === 'ENOTFOUND' ||
          error?.code === 'ETIMEDOUT' ||
          (error?.status >= 500 && error?.status < 600) ||
          error?.status === 429 // Rate limiting
        );
      },
      baseDelay: 1000,
      maxDelay: 10000,
      onRetry: (attempt, error) => {
        logger.messageFlow(`Retrying network operation (attempt ${attempt}):`, {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });
  }

  /**
   * Retry database operations
   */
  static async retryDatabaseOperation<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 2
  ): Promise<RetryResult<T>> {
    return this.retry(operation, {
      maxAttempts,
      retryCondition: (error: any) => {
        // Database-specific retry conditions
        const message = error?.message?.toLowerCase() || '';
        return (
          message.includes('connection') ||
          message.includes('timeout') ||
          message.includes('deadlock') ||
          error?.code === 'PGRST301' || // PostgREST connection error
          error?.code === 'PGRST504'    // PostgREST timeout
        );
      },
      baseDelay: 500,
      maxDelay: 5000
    });
  }

  /**
   * Retry with immediate first retry, then exponential backoff
   */
  static async retryWithImmediateFirst<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<RetryResult<T>> {
    const config = { ...DEFAULT_OPTIONS, ...options };
    let lastError: any;
    
    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        const result = await operation();
        
        if (attempt > 1) {
          logger.messageFlow(`Operation succeeded on attempt ${attempt}`);
        }
        
        return {
          success: true,
          data: result,
          attempts: attempt
        };
      } catch (error) {
        lastError = error;
        
        if (attempt === config.maxAttempts || !config.retryCondition(error)) {
          break;
        }
        
        config.onRetry(attempt, error);
        
        // First retry is immediate, subsequent retries use exponential backoff
        if (attempt > 1) {
          const delay = this.calculateDelay(attempt - 1, config);
          await this.sleep(delay);
        }
      }
    }
    
    return {
      success: false,
      error: lastError,
      attempts: config.maxAttempts
    };
  }
}

// Utility function for common retry patterns
export const withRetry = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options?: RetryOptions
) => {
  return async (...args: T): Promise<R> => {
    const result = await RetryService.retry(() => fn(...args), options);
    
    if (result.success) {
      return result.data!;
    }
    
    throw result.error;
  };
};

// Decorator for class methods (if using experimental decorators)
export const Retry = (options?: RetryOptions) => {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const result = await RetryService.retry(
        () => originalMethod.apply(this, args),
        options
      );
      
      if (result.success) {
        return result.data;
      }
      
      throw result.error;
    };
    
    return descriptor;
  };
};