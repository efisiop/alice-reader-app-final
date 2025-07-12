// src/hooks/useDebounce.ts
import { useState, useEffect, useRef } from 'react';

/**
 * Options for debounced value
 */
export interface DebounceOptions {
  // Delay in milliseconds
  delay?: number;
  // Whether to update immediately on first change
  immediate?: boolean;
  // Maximum delay in milliseconds
  maxDelay?: number;
  // Callback when value is updated
  onUpdate?: (value: any) => void;
}

/**
 * Default options
 */
const defaultOptions: DebounceOptions = {
  delay: 500,
  immediate: false,
  maxDelay: 5000
};

/**
 * Hook for debounced values
 * @param value Value to debounce
 * @param options Debounce options
 * @returns Debounced value
 */
export function useDebounce<T>(value: T, options?: DebounceOptions): T {
  // Merge options with defaults
  const opts = { ...defaultOptions, ...options };
  
  // State
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  // Refs
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastValueRef = useRef<T>(value);
  const lastUpdateTimeRef = useRef<number>(Date.now());
  
  useEffect(() => {
    // Update immediately if this is the first change and immediate is true
    if (opts.immediate && lastValueRef.current === debouncedValue) {
      setDebouncedValue(value);
      lastValueRef.current = value;
      lastUpdateTimeRef.current = Date.now();
      
      if (opts.onUpdate) {
        opts.onUpdate(value);
      }
      
      return;
    }
    
    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set a new timeout
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
      lastValueRef.current = value;
      lastUpdateTimeRef.current = Date.now();
      
      if (opts.onUpdate) {
        opts.onUpdate(value);
      }
    }, opts.delay);
    
    // Set a max timeout if not already set
    if (opts.maxDelay && !maxTimeoutRef.current) {
      const timeSinceLastUpdate = Date.now() - lastUpdateTimeRef.current;
      const remainingTime = Math.max(0, opts.maxDelay - timeSinceLastUpdate);
      
      maxTimeoutRef.current = setTimeout(() => {
        // Only update if the value has changed
        if (lastValueRef.current !== value) {
          setDebouncedValue(value);
          lastValueRef.current = value;
          lastUpdateTimeRef.current = Date.now();
          
          if (opts.onUpdate) {
            opts.onUpdate(value);
          }
        }
        
        // Clear the max timeout
        maxTimeoutRef.current = null;
      }, remainingTime);
    }
    
    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      if (maxTimeoutRef.current) {
        clearTimeout(maxTimeoutRef.current);
        maxTimeoutRef.current = null;
      }
    };
  }, [value, opts.delay, opts.immediate, opts.maxDelay, opts.onUpdate]);
  
  return debouncedValue;
}

/**
 * Hook for debounced function
 * @param fn Function to debounce
 * @param delay Delay in milliseconds
 * @returns Debounced function
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 500
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  return (...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}
