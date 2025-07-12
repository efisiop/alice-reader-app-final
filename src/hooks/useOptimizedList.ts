// src/hooks/useOptimizedList.ts
import { useState, useCallback, useMemo } from 'react';

/**
 * Options for optimized list
 */
export interface OptimizedListOptions<T> {
  // Initial items
  initialItems?: T[];
  // Key function to get a unique key for each item
  keyFn?: (item: T) => string | number;
  // Sort function to sort items
  sortFn?: (a: T, b: T) => number;
  // Filter function to filter items
  filterFn?: (item: T) => boolean;
  // Whether to memoize the list
  memoize?: boolean;
}

/**
 * Default options
 */
const defaultOptions: Partial<OptimizedListOptions<any>> = {
  initialItems: [],
  keyFn: (item: any) => item.id || JSON.stringify(item),
  memoize: true
};

/**
 * Hook for optimized lists
 * @param options List options
 * @returns List state and utilities
 */
export function useOptimizedList<T>(options?: OptimizedListOptions<T>) {
  // Merge options with defaults
  const opts = { ...defaultOptions, ...options } as Required<OptimizedListOptions<T>>;
  
  // State
  const [items, setItems] = useState<T[]>(opts.initialItems || []);
  const [sortFn, setSortFn] = useState<((a: T, b: T) => number) | undefined>(opts.sortFn);
  const [filterFn, setFilterFn] = useState<((item: T) => boolean) | undefined>(opts.filterFn);
  
  // Add an item
  const addItem = useCallback((item: T) => {
    setItems(prev => {
      // Check if item already exists
      const key = opts.keyFn(item);
      const exists = prev.some(i => opts.keyFn(i) === key);
      
      if (exists) {
        // Replace existing item
        return prev.map(i => opts.keyFn(i) === key ? item : i);
      } else {
        // Add new item
        return [...prev, item];
      }
    });
  }, [opts.keyFn]);
  
  // Add multiple items
  const addItems = useCallback((newItems: T[]) => {
    setItems(prev => {
      const result = [...prev];
      const keys = new Set(prev.map(opts.keyFn));
      
      for (const item of newItems) {
        const key = opts.keyFn(item);
        
        if (keys.has(key)) {
          // Replace existing item
          const index = result.findIndex(i => opts.keyFn(i) === key);
          result[index] = item;
        } else {
          // Add new item
          result.push(item);
          keys.add(key);
        }
      }
      
      return result;
    });
  }, [opts.keyFn]);
  
  // Update an item
  const updateItem = useCallback((key: string | number, updates: Partial<T>) => {
    setItems(prev => {
      return prev.map(item => {
        if (opts.keyFn(item) === key) {
          return { ...item, ...updates };
        }
        return item;
      });
    });
  }, [opts.keyFn]);
  
  // Remove an item
  const removeItem = useCallback((key: string | number) => {
    setItems(prev => {
      return prev.filter(item => opts.keyFn(item) !== key);
    });
  }, [opts.keyFn]);
  
  // Clear all items
  const clearItems = useCallback(() => {
    setItems([]);
  }, []);
  
  // Set sort function
  const setSorting = useCallback((fn: ((a: T, b: T) => number) | undefined) => {
    setSortFn(fn);
  }, []);
  
  // Set filter function
  const setFiltering = useCallback((fn: ((item: T) => boolean) | undefined) => {
    setFilterFn(fn);
  }, []);
  
  // Get processed items (sorted and filtered)
  const processedItems = useMemo(() => {
    let result = [...items];
    
    // Apply filter
    if (filterFn) {
      result = result.filter(filterFn);
    }
    
    // Apply sort
    if (sortFn) {
      result.sort(sortFn);
    }
    
    return result;
  }, [items, sortFn, filterFn]);
  
  // Get item by key
  const getItem = useCallback((key: string | number): T | undefined => {
    return items.find(item => opts.keyFn(item) === key);
  }, [items, opts.keyFn]);
  
  // Check if item exists
  const hasItem = useCallback((key: string | number): boolean => {
    return items.some(item => opts.keyFn(item) === key);
  }, [items, opts.keyFn]);
  
  return {
    items: opts.memoize ? processedItems : processedItems,
    rawItems: items,
    addItem,
    addItems,
    updateItem,
    removeItem,
    clearItems,
    setSorting,
    setFiltering,
    getItem,
    hasItem
  };
}
