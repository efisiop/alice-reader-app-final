// src/utils/errorHandling.ts
import { appLog } from '../components/LogViewer';

/**
 * Error codes for application errors
 */
export enum ErrorCode {
  // General errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // Service errors
  SERVICE_ERROR = 'SERVICE_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  SERVICE_INITIALIZATION_ERROR = 'SERVICE_INITIALIZATION_ERROR',
  
  // Authentication errors
  AUTH_ERROR = 'AUTH_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  
  // Data errors
  DATA_ERROR = 'DATA_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  // Supabase errors
  SUPABASE_ERROR = 'SUPABASE_ERROR',
  SUPABASE_QUERY_ERROR = 'SUPABASE_QUERY_ERROR',
  SUPABASE_AUTH_ERROR = 'SUPABASE_AUTH_ERROR',
  
  // API errors
  API_ERROR = 'API_ERROR',
  API_RATE_LIMIT = 'API_RATE_LIMIT'
}

/**
 * Application error class with structured error information
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: ErrorCode | string,
    public details?: any,
    public retry?: boolean,
    public originalError?: any
  ) {
    super(message);
    this.name = 'AppError';
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
    
    // Log error
    appLog('AppError', message, 'error', {
      code,
      details,
      retry,
      stack: this.stack
    });
  }
  
  /**
   * Convert to a plain object for serialization
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      retry: this.retry,
      stack: this.stack
    };
  }
}

/**
 * Handle service errors consistently
 * 
 * @param error The original error
 * @param serviceName The name of the service
 * @param operation The operation that failed
 * @returns A standardized AppError
 */
export function handleServiceError(
  error: any,
  serviceName: string,
  operation: string
): AppError {
  console.error(`${serviceName}.${operation} error:`, error);
  
  // Already an AppError
  if (error instanceof AppError) {
    return error;
  }
  
  // Supabase error
  if (error?.code && error?.message && error?.details) {
    return new AppError(
      `${serviceName}.${operation}: ${error.message}`,
      `SUPABASE_${error.code}`,
      { serviceName, operation, details: error.details },
      isRetryableError(error),
      error
    );
  }
  
  // Network error
  if (isNetworkError(error)) {
    return new AppError(
      `${serviceName}.${operation}: Network error`,
      ErrorCode.NETWORK_ERROR,
      { serviceName, operation },
      true,
      error
    );
  }
  
  // Timeout error
  if (isTimeoutError(error)) {
    return new AppError(
      `${serviceName}.${operation}: Request timed out`,
      ErrorCode.TIMEOUT_ERROR,
      { serviceName, operation },
      true,
      error
    );
  }
  
  // Generic error
  return new AppError(
    error.message || `Error in ${serviceName}.${operation}`,
    ErrorCode.SERVICE_ERROR,
    { serviceName, operation },
    false,
    error
  );
}

/**
 * Check if an error is related to network connectivity
 */
export function isNetworkError(error: any): boolean {
  if (!error) return false;
  
  // Check error name
  if (error.name === 'NetworkError') return true;
  
  // Check error message
  const message = error.message?.toLowerCase() || '';
  return (
    message.includes('network') ||
    message.includes('internet') ||
    message.includes('offline') ||
    message.includes('connection') ||
    message.includes('unreachable')
  );
}

/**
 * Check if an error is a timeout error
 */
export function isTimeoutError(error: any): boolean {
  if (!error) return false;
  
  // Check error name
  if (error.name === 'TimeoutError') return true;
  
  // Check error message
  const message = error.message?.toLowerCase() || '';
  return (
    message.includes('timeout') ||
    message.includes('timed out')
  );
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: any): boolean {
  if (!error) return false;
  
  // Network and timeout errors are retryable
  if (isNetworkError(error) || isTimeoutError(error)) return true;
  
  // Check status code for server errors (5xx)
  if (error.status && error.status >= 500 && error.status < 600) return true;
  
  // Check Supabase error code
  if (error.code === '503') return true; // Service unavailable
  
  return false;
}

/**
 * Retry a function with exponential backoff
 * 
 * @param fn The function to retry
 * @param options Retry options
 * @returns The result of the function
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    retryCondition?: (error: any) => boolean;
    onRetry?: (error: any, attempt: number, delay: number) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    retryCondition = isRetryableError,
    onRetry = (error, attempt, delay) => {
      appLog('Retry', `Attempt ${attempt}/${maxRetries} failed, retrying in ${delay}ms`, 'warning', { error });
    }
  } = options;
  
  let attempt = 0;
  let lastError: any;
  
  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      attempt++;
      
      // Check if we should retry
      if (attempt > maxRetries || !retryCondition(error)) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(initialDelay * Math.pow(backoffFactor, attempt - 1), maxDelay);
      
      // Notify about retry
      onRetry(error, attempt, delay);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never happen, but TypeScript needs it
  throw lastError;
}
