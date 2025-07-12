// src/services/supabaseClient.new.ts
import { createClient } from '@supabase/supabase-js';
import { appLog } from '../components/LogViewer';
import { RETRY_DELAY, MAX_RETRIES } from '../constants';

// Define the Database type (simplified for now)
export type Database = any;

/**
 * Get a Supabase client instance
 * @returns Supabase client
 */
export const getSupabaseClient = async () => {
  // Create client if it doesn't exist
  if (!supabaseClient) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    
    if (!supabaseUrl || !supabaseKey) {
      appLog('SupabaseClient', 'Missing Supabase URL or key', 'error');
      throw new Error('Missing Supabase URL or key');
    }
    
    supabaseClient = createClient<Database>(supabaseUrl, supabaseKey);
    
    // Check connection
    try {
      await checkSupabaseConnection();
      appLog('SupabaseClient', 'Connected to Supabase', 'success');
    } catch (error: any) {
      appLog('SupabaseClient', `Failed to connect to Supabase: ${error.message}`, 'error');
      throw error;
    }
  }
  
  return supabaseClient;
};

// Create a client instance
let supabaseClient: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Check if Supabase is available
 * @returns True if Supabase is available
 */
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    if (!supabaseClient) {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
      
      if (!supabaseUrl || !supabaseKey) {
        return false;
      }
      
      supabaseClient = createClient<Database>(supabaseUrl, supabaseKey);
    }
    
    // Try a simple query to check connection
    const { error } = await supabaseClient.from('books').select('id').limit(1);
    
    return !error;
  } catch (error) {
    return false;
  }
};

/**
 * Execute a function with retry logic
 * @param operation Function to execute
 * @param retryCount Number of retries
 * @param delayMs Delay between retries in milliseconds
 * @param backoffFactor Factor to increase delay on each retry
 * @returns Result of the operation
 */
export const executeWithRetries = async <T>(
  operation: () => Promise<T>,
  retryCount: number = MAX_RETRIES,
  delayMs: number = RETRY_DELAY,
  backoffFactor: number = 2
): Promise<T> => {
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
};

/**
 * Checks if an error is retryable
 * @param error Error to check
 * @returns True if the error is retryable
 */
export const isRetryableError = (error: any): boolean => {
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
};

export default getSupabaseClient;
