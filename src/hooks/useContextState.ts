// src/hooks/useContextState.ts
import { useState, useCallback, useMemo } from 'react';

/**
 * Options for context state
 */
export interface ContextStateOptions<T> {
  // Initial state
  initialState: T;
  // Whether to memoize selectors
  memoizeSelectors?: boolean;
  // Whether to batch updates
  batchUpdates?: boolean;
}

/**
 * Default options
 */
const defaultOptions: Partial<ContextStateOptions<any>> = {
  memoizeSelectors: true,
  batchUpdates: true
};

/**
 * Hook for optimized context state
 * @param options Context state options
 * @returns Context state and utilities
 */
export function useContextState<T extends Record<string, any>>(
  options: ContextStateOptions<T>
) {
  // Merge options with defaults
  const opts = { ...defaultOptions, ...options };
  
  // State
  const [state, setState] = useState<T>(opts.initialState);
  
  // Batch updates
  const batchedUpdates = useCallback((updates: Partial<T>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);
  
  // Update a single key
  const updateState = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setState(prev => ({ ...prev, [key]: value }));
  }, []);
  
  // Reset state
  const resetState = useCallback(() => {
    setState(opts.initialState);
  }, [opts.initialState]);
  
  // Create selectors
  const createSelector = useCallback(<R>(selector: (state: T) => R) => {
    return opts.memoizeSelectors
      ? useMemo(() => selector(state), [state, selector])
      : selector(state);
  }, [state, opts.memoizeSelectors]);
  
  // Create a selector for a specific key
  const createKeySelector = useCallback(<K extends keyof T>(key: K) => {
    return opts.memoizeSelectors
      ? useMemo(() => state[key], [state, key])
      : state[key];
  }, [state, opts.memoizeSelectors]);
  
  return {
    state,
    setState,
    batchedUpdates,
    updateState,
    resetState,
    createSelector,
    createKeySelector
  };
}
