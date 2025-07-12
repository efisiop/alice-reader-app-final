// src/hooks/usePaginatedData.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { appLog } from '../components/LogViewer';
import { fetchData, FetchOptions } from '../utils/dataFetcher';
import { CacheService, createCache } from '../services/cacheService';

/**
 * Options for paginated data fetching
 */
export interface PaginationOptions<T> extends Partial<FetchOptions<T[]>> {
  // Initial page to fetch
  initialPage?: number;
  // Number of items per page
  pageSize?: number;
  // Whether to prefetch the next page
  prefetchNextPage?: boolean;
  // Whether to keep previously loaded data when fetching a new page
  keepPreviousData?: boolean;
  // Whether to automatically fetch the next page when reaching the end
  infiniteScroll?: boolean;
  // Threshold for infinite scroll (0-1, percentage of page height)
  infiniteScrollThreshold?: number;
  // Whether to enable manual refresh
  enableRefresh?: boolean;
  // Cache instance to use
  cache?: CacheService;
}

/**
 * Default pagination options
 */
const defaultOptions: PaginationOptions<any> = {
  initialPage: 1,
  pageSize: 10,
  prefetchNextPage: true,
  keepPreviousData: true,
  infiniteScroll: false,
  infiniteScrollThreshold: 0.8,
  enableRefresh: true,
  cache: createCache({
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    storageNamespace: 'alice_reader_paginated_'
  }),
  cacheOnError: true,
  retries: 1,
  timeout: 10000,
  context: 'usePaginatedData'
};

/**
 * Hook for paginated data fetching
 * @param fetchFn Function that returns a promise with the data for a page
 * @param options Pagination options
 * @returns Paginated data and controls
 */
export function usePaginatedData<T>(
  fetchFn: (page: number, pageSize: number) => Promise<T[]>,
  options?: PaginationOptions<T>
) {
  // Merge options with defaults
  const opts = { ...defaultOptions, ...options };
  const context = opts.context || 'usePaginatedData';
  
  // State
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState<number>(opts.initialPage || 1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  // Refs
  const isMounted = useRef<boolean>(true);
  const loadingRef = useRef<boolean>(loading);
  const pageRef = useRef<number>(page);
  const dataRef = useRef<T[]>(data);
  
  // Update refs when state changes
  useEffect(() => {
    loadingRef.current = loading;
    pageRef.current = page;
    dataRef.current = data;
  }, [loading, page, data]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Function to fetch a page of data
  const fetchPage = useCallback(async (pageNum: number, append: boolean = false) => {
    if (loadingRef.current && !refreshing) return;
    
    setLoading(true);
    setError(null);
    
    try {
      appLog(context, `Fetching page ${pageNum}`, 'info');
      
      // Use fetchData utility with caching
      const pageData = await fetchData<T[]>(
        () => fetchFn(pageNum, opts.pageSize || 10),
        {
          cacheKey: opts.cacheKey ? `${opts.cacheKey}_page_${pageNum}` : undefined,
          cache: opts.cache,
          cacheTTL: opts.cacheTTL,
          bypassCache: refreshing,
          cacheOnError: opts.cacheOnError,
          retries: opts.retries,
          retryDelay: opts.retryDelay,
          exponentialBackoff: opts.exponentialBackoff,
          timeout: opts.timeout,
          fallback: [],
          transform: opts.transform,
          context: `${context}.fetchPage`
        }
      );
      
      if (!isMounted.current) return;
      
      // Check if we have more data
      const hasMoreData = pageData && pageData.length === (opts.pageSize || 10);
      setHasMore(hasMoreData);
      
      // Update data
      if (append) {
        setData(prev => [...prev, ...(pageData || [])]);
      } else {
        setData(pageData || []);
      }
      
      // Prefetch next page if enabled
      if (opts.prefetchNextPage && hasMoreData) {
        prefetchPage(pageNum + 1);
      }
      
      appLog(context, `Page ${pageNum} fetched successfully`, 'success', {
        itemCount: pageData?.length || 0,
        hasMore: hasMoreData
      });
    } catch (err: any) {
      if (!isMounted.current) return;
      
      appLog(context, `Error fetching page ${pageNum}`, 'error', err);
      setError(err);
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [fetchFn, opts, refreshing, context]);
  
  // Function to prefetch a page
  const prefetchPage = useCallback((pageNum: number) => {
    if (!opts.cache || !opts.cacheKey) return;
    
    const cacheKey = `${opts.cacheKey}_page_${pageNum}`;
    
    // Skip if already in cache
    if (opts.cache.has(cacheKey)) return;
    
    appLog(context, `Prefetching page ${pageNum}`, 'debug');
    
    // Fetch in the background
    fetchData<T[]>(
      () => fetchFn(pageNum, opts.pageSize || 10),
      {
        cacheKey,
        cache: opts.cache,
        cacheTTL: opts.cacheTTL,
        retries: opts.retries,
        timeout: opts.timeout,
        context: `${context}.prefetchPage`
      }
    ).catch(() => {
      // Ignore errors in prefetch
    });
  }, [fetchFn, opts, context]);
  
  // Function to load the next page
  const loadNextPage = useCallback(() => {
    if (loading || !hasMore) return;
    
    const nextPage = pageRef.current + 1;
    setPage(nextPage);
    
    fetchPage(nextPage, opts.infiniteScroll || false);
  }, [loading, hasMore, fetchPage, opts.infiniteScroll]);
  
  // Function to load the previous page
  const loadPreviousPage = useCallback(() => {
    if (loading || pageRef.current <= 1) return;
    
    const prevPage = pageRef.current - 1;
    setPage(prevPage);
    
    fetchPage(prevPage, false);
  }, [loading, fetchPage]);
  
  // Function to go to a specific page
  const goToPage = useCallback((pageNum: number) => {
    if (loading || pageNum < 1 || pageNum === pageRef.current) return;
    
    setPage(pageNum);
    fetchPage(pageNum, false);
  }, [loading, fetchPage]);
  
  // Function to refresh the current page
  const refresh = useCallback(() => {
    if (loading) return;
    
    setRefreshing(true);
    fetchPage(pageRef.current, false);
  }, [loading, fetchPage]);
  
  // Function to reset to the first page
  const reset = useCallback(() => {
    if (loading) return;
    
    setPage(opts.initialPage || 1);
    setData([]);
    fetchPage(opts.initialPage || 1, false);
  }, [loading, fetchPage, opts.initialPage]);
  
  // Initial fetch
  useEffect(() => {
    fetchPage(opts.initialPage || 1, false);
  }, [fetchPage, opts.initialPage]);
  
  // Set up infinite scroll if enabled
  useEffect(() => {
    if (!opts.infiniteScroll) return;
    
    const handleScroll = () => {
      if (loading || !hasMore) return;
      
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      const scrolledToBottom = 
        scrollTop + windowHeight >= 
        documentHeight * (opts.infiniteScrollThreshold || 0.8);
      
      if (scrolledToBottom) {
        loadNextPage();
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [loading, hasMore, loadNextPage, opts.infiniteScroll, opts.infiniteScrollThreshold]);
  
  return {
    data,
    loading,
    error,
    page,
    hasMore,
    refreshing,
    loadNextPage,
    loadPreviousPage,
    goToPage,
    refresh,
    reset
  };
}
