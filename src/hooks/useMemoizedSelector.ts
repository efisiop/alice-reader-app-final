// src/hooks/useMemoizedSelector.ts
import { useMemo } from 'react';

/**
 * Options for memoized selector
 */
export interface MemoizedSelectorOptions<T, R> {
  // Selector function
  selector: (state: T) => R;
  // Dependencies for memoization
  dependencies?: any[];
  // Whether to use deep comparison
  deepCompare?: boolean;
  // Custom equality function
  equalityFn?: (a: R, b: R) => boolean;
}

/**
 * Default options
 */
const defaultOptions: Partial<MemoizedSelectorOptions<any, any>> = {
  dependencies: [],
  deepCompare: false,
  equalityFn: undefined
};

/**
 * Hook for memoized selectors
 * @param state State to select from
 * @param options Selector options
 * @returns Memoized selected value
 */
export function useMemoizedSelector<T, R>(
  state: T,
  options: MemoizedSelectorOptions<T, R>
): R {
  // Merge options with defaults
  const opts = { ...defaultOptions, ...options };
  
  // Memoize the selector result
  return useMemo(() => {
    return opts.selector(state);
  }, [state, opts.selector, ...(opts.dependencies || [])]);
}

/**
 * Create a selector factory for a specific state type
 * @returns Function to create memoized selectors
 */
export function createSelectorHook<T>() {
  return <R>(
    state: T,
    selector: (state: T) => R,
    dependencies: any[] = []
  ): R => {
    return useMemoizedSelector(state, {
      selector,
      dependencies
    });
  };
}

/**
 * Create a selector factory for a specific state and component
 * @param state State to select from
 * @returns Function to create memoized selectors
 */
export function createComponentSelectors<T>(state: T) {
  return <R>(
    selector: (state: T) => R,
    dependencies: any[] = []
  ): R => {
    return useMemoizedSelector(state, {
      selector,
      dependencies
    });
  };
}
