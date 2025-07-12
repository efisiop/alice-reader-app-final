// src/hooks/useDataFetching.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { appLog } from '../components/LogViewer';
import { fetchData, FetchOptions } from '../utils/dataFetcher';
import { CacheService } from '../services/cacheService';

/**
 * Options for data fetching hook
 */
export interface DataFetchingOptions<T> extends Partial<FetchOptions<T>> {
  // Whether to fetch data immediately
  fetchOnMount?: boolean;
  // Dependencies for refetching
  dependencies?: any[];
  // Whether to keep previous data when fetching
  keepPreviousData?: boolean;
  // Whether to enable manual refresh
  enableRefresh?: boolean;
  // Whether to skip fetching
  skip?: boolean;
  // Cache instance to use
  cache?: CacheService;
}

/**
 * Default options
 */
const defaultOptions: Partial<DataFetchingOptions<any>> = {
  fetchOnMount: true,
  dependencies: [],
  keepPreviousData: true,
  enableRefresh: true,
  skip: false,
  cacheOnError: true,
  retries: 2,
  timeout: 10000,
  context: 'useDataFetching'
};

/**
 * Hook for data fetching with caching and error handling
 * @param fetchFn Function that returns a promise with the data
 * @param options Data fetching options
 * @returns Data, loading state, error, and utilities
 */
export function useDataFetching<T>(
  fetchFn: () => Promise<T>,
  options?: DataFetchingOptions<T>
) {
  // Merge options with defaults
  const opts = { ...defaultOptions, ...options };
  const context = opts.context || 'useDataFetching';
  
  // State
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(opts.fetchOnMount !== false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  // Refs
  const isMounted = useRef<boolean>(true);
  const fetchCount = useRef<number>(0);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Function to fetch data
  const fetchDataFn = useCallback(async (refresh: boolean = false) => {
    if (opts.skip) return;
    
    const currentFetchCount = ++fetchCount.current;
    
    if (!refresh && !opts.keepPreviousData) {
      setData(undefined);
    }
    
    if (!refreshing) {
      setLoading(true);
    }
    
    setError(null);
    
    try {
      appLog(context, 'Fetching data', 'info', { refresh });
      
      // Use fetchData utility with caching
      const result = await fetchData<T>(
        fetchFn,
        {
          cacheKey: opts.cacheKey,
          cache: opts.cache,
          cacheTTL: opts.cacheTTL,
          bypassCache: refresh,
          cacheOnError: opts.cacheOnError,
          retries: opts.retries,
          retryDelay: opts.retryDelay,
          exponentialBackoff: opts.exponentialBackoff,
          timeout: opts.timeout,
          fallback: opts.fallback,
          transform: opts.transform,
          context: `${context}.fetch`
        }
      );
      
      // Only update state if this is the latest fetch
      if (isMounted.current && currentFetchCount === fetchCount.current) {
        setData(result);
        setError(null);
        
        appLog(context, 'Data fetched successfully', 'success');
      }
    } catch (err: any) {
      // Only update state if this is the latest fetch
      if (isMounted.current && currentFetchCount === fetchCount.current) {
        appLog(context, 'Error fetching data', 'error', err);
        setError(err);
      }
    } finally {
      // Only update state if this is the latest fetch
      if (isMounted.current && currentFetchCount === fetchCount.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [fetchFn, opts, refreshing, context]);
  
  // Function to refresh data
  const refresh = useCallback(() => {
    if (!opts.enableRefresh) return;
    
    setRefreshing(true);
    fetchDataFn(true);
  }, [fetchDataFn, opts.enableRefresh]);
  
  // Fetch data on mount and when dependencies change
  useEffect(() => {
    if (opts.fetchOnMount !== false && !opts.skip) {
      fetchDataFn(false);
    }
  }, [fetchDataFn, ...(opts.dependencies || []), opts.fetchOnMount, opts.skip]);
  
  return {
    data,
    loading,
    error,
    refreshing,
    refresh,
    refetch: fetchDataFn
  };
}
