// src/utils/retryUtils.ts
import { appLog } from "../components/LogViewer";

/**
 * Executes a function with retry logic
 * @param operation Function to execute
 * @param retryCount Number of retries
 * @param delayMs Delay between retries in milliseconds
 * @param backoffFactor Factor to increase delay on each retry
 * @returns Result of the operation
 */
export async function executeWithRetries<T>(
  operation: () => Promise<T>,
  retryCount: number = 3,
  delayMs: number = 1000,
  backoffFactor: number = 2
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      // Execute the operation
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Log the error
      appLog(
        "RetryUtils",
        `Operation failed (attempt ${attempt + 1}/${retryCount + 1}): ${error.message}`,
        "warning"
      );
      
      // If this was the last attempt, don't wait
      if (attempt === retryCount) {
        break;
      }
      
      // Wait before retrying
      const waitTime = delayMs * Math.pow(backoffFactor, attempt);
      appLog(
        "RetryUtils",
        `Retrying in ${waitTime}ms...`,
        "info"
      );
      
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  // If we got here, all attempts failed
  throw lastError || new Error("Operation failed after retries");
}

/**
 * Checks if an error is retryable
 * @param error Error to check
 * @returns True if the error is retryable
 */
export function isRetryableError(error: any): boolean {
  // Network errors are usually retryable
  if (error.message?.includes('network') || error.message?.includes('timeout')) {
    return true;
  }
  
  // Service unavailable errors are retryable
  if (error.status === 503 || error.statusCode === 503) {
    return true;
  }
  
  // Too many requests errors are retryable
  if (error.status === 429 || error.statusCode === 429) {
    return true;
  }
  
  return false;
}
