// src/utils/dataFetcher.ts
import { appLog } from '../components/LogViewer';
import { CacheService, createCache } from '../services/cacheService';

/**
 * Options for data fetching
 */
export interface FetchOptions<T> {
  // Cache key
  cacheKey?: string;
  // Cache instance to use
  cache?: CacheService;
  // Time-to-live for cache in milliseconds
  cacheTTL?: number;
  // Whether to bypass cache for this request
  bypassCache?: boolean;
  // Whether to update cache even if request fails (with previous data)
  cacheOnError?: boolean;
  // Number of retry attempts
  retries?: number;
  // Delay between retries in milliseconds
  retryDelay?: number;
  // Whether to use exponential backoff for retries
  exponentialBackoff?: boolean;
  // Timeout for the request in milliseconds
  timeout?: number;
  // Fallback value if request fails
  fallback?: T;
  // Whether to throw errors (otherwise returns undefined on error)
  throwErrors?: boolean;
  // Function to transform the response
  transform?: (data: any) => T;
  // Context for logging
  context?: string;
}

/**
 * Default fetch options
 */
const defaultOptions: FetchOptions<any> = {
  cacheKey: undefined,
  cache: undefined,
  cacheTTL: undefined,
  bypassCache: false,
  cacheOnError: true,
  retries: 2,
  retryDelay: 1000,
  exponentialBackoff: true,
  timeout: 10000,
  fallback: undefined,
  throwErrors: false,
  transform: undefined,
  context: 'DataFetcher'
};

/**
 * Create a timeout promise
 * @param ms Timeout in milliseconds
 * @returns Promise that rejects after the timeout
 */
function createTimeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms);
  });
}

/**
 * Fetch data with caching, retries, and error handling
 * @param fetchFn Function that returns a promise with the data
 * @param options Fetch options
 * @returns Promise with the data
 */
export async function fetchData<T>(
  fetchFn: () => Promise<T>,
  options?: Partial<FetchOptions<T>>
): Promise<T | undefined> {
  // Merge options with defaults
  const opts: FetchOptions<T> = { ...defaultOptions, ...options };
  const context = opts.context || 'DataFetcher';
  
  // Try to get from cache first if cacheKey is provided and not bypassing cache
  if (opts.cacheKey && !opts.bypassCache && opts.cache) {
    const cachedData = opts.cache.get<T>(opts.cacheKey);
    if (cachedData !== undefined) {
      appLog(context, `Cache hit for key: ${opts.cacheKey}`, 'debug');
      return cachedData;
    }
  }
  
  let lastError: Error | undefined;
  let attempts = 0;
  
  // Try fetching with retries
  while (attempts <= opts.retries!) {
    try {
      appLog(context, `Fetching data${opts.cacheKey ? ` for key: ${opts.cacheKey}` : ''} (attempt ${attempts + 1}/${opts.retries! + 1})`, 'debug');
      
      // Create a promise that resolves with the data or rejects with a timeout
      const dataPromise = fetchFn();
      let result: T;
      
      if (opts.timeout && opts.timeout > 0) {
        // Race the fetch against the timeout
        result = await Promise.race([
          dataPromise,
          createTimeoutPromise(opts.timeout)
        ]);
      } else {
        // No timeout
        result = await dataPromise;
      }
      
      // Transform the result if a transform function is provided
      if (opts.transform) {
        result = opts.transform(result);
      }
      
      // Cache the result if cacheKey is provided
      if (opts.cacheKey && opts.cache) {
        opts.cache.set(opts.cacheKey, result, opts.cacheTTL);
        appLog(context, `Cached data for key: ${opts.cacheKey}`, 'debug');
      }
      
      return result;
    } catch (error: any) {
      lastError = error;
      attempts++;
      
      appLog(context, `Error fetching data${opts.cacheKey ? ` for key: ${opts.cacheKey}` : ''}: ${error.message}`, 'error');
      
      // If we've reached the maximum number of retries, break out of the loop
      if (attempts > opts.retries!) {
        break;
      }
      
      // Calculate delay for next retry
      const delay = opts.exponentialBackoff
        ? opts.retryDelay! * Math.pow(2, attempts - 1)
        : opts.retryDelay!;
      
      appLog(context, `Retrying in ${delay}ms...`, 'debug');
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // All retries failed
  appLog(context, `All ${opts.retries! + 1} attempts failed${opts.cacheKey ? ` for key: ${opts.cacheKey}` : ''}`, 'error');
  
  // If we have a fallback, return it
  if (opts.fallback !== undefined) {
    appLog(context, 'Using fallback data', 'debug');
    
    // Cache the fallback if cacheKey is provided and cacheOnError is true
    if (opts.cacheKey && opts.cache && opts.cacheOnError) {
      opts.cache.set(opts.cacheKey, opts.fallback, opts.cacheTTL);
      appLog(context, `Cached fallback data for key: ${opts.cacheKey}`, 'debug');
    }
    
    return opts.fallback;
  }
  
  // If throwErrors is true, throw the last error
  if (opts.throwErrors && lastError) {
    throw lastError;
  }
  
  // Otherwise return undefined
  return undefined;
}

/**
 * Create a data fetcher with default options
 * @param defaultOpts Default options for all fetches
 * @returns Function to fetch data with the default options
 */
export function createFetcher<T>(defaultOpts: Partial<FetchOptions<T>> = {}) {
  return (fetchFn: () => Promise<T>, options?: Partial<FetchOptions<T>>) => {
    return fetchData<T>(fetchFn, { ...defaultOpts, ...options });
  };
}

/**
 * Create a prefetcher that can be used to prefetch data in the background
 * @param cache Cache to use for prefetched data
 * @returns Object with prefetch and get methods
 */
export function createPrefetcher(cache: CacheService = createCache()) {
  const prefetching = new Set<string>();
  
  return {
    /**
     * Prefetch data in the background
     * @param key Cache key
     * @param fetchFn Function that returns a promise with the data
     * @param options Fetch options
     */
    prefetch<T>(key: string, fetchFn: () => Promise<T>, options?: Partial<FetchOptions<T>>): void {
      // Skip if already prefetching or in cache
      if (prefetching.has(key) || cache.has(key)) {
        return;
      }
      
      // Mark as prefetching
      prefetching.add(key);
      
      // Fetch in the background
      fetchData(fetchFn, {
        cacheKey: key,
        cache,
        ...options,
        context: 'Prefetcher'
      }).finally(() => {
        // Remove from prefetching set
        prefetching.delete(key);
      });
    },
    
    /**
     * Get prefetched data
     * @param key Cache key
     * @returns Prefetched data or undefined if not in cache
     */
    get<T>(key: string): T | undefined {
      return cache.get<T>(key);
    },
    
    /**
     * Check if data is prefetched
     * @param key Cache key
     * @returns True if data is prefetched
     */
    has(key: string): boolean {
      return cache.has(key);
    },
    
    /**
     * Check if data is currently being prefetched
     * @param key Cache key
     * @returns True if data is being prefetched
     */
    isPrefetching(key: string): boolean {
      return prefetching.has(key);
    }
  };
}

// Create and export default prefetcher
export const prefetcher = createPrefetcher();
