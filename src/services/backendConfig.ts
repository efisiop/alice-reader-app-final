// src/services/backendConfig.ts
// This file provides configuration for backend services

/**
 * BACKEND CONFIGURATION
 *
 * Set useMockBackend to true to use mock data (no Supabase connection required)
 * Set useMockBackend to false to use real Supabase backend (requires network connection to Supabase)
 *
 * If you're experiencing network connectivity issues with Supabase,
 * set this to true to continue development with mock data.
 */
export const useMockBackend = false;

// For backward compatibility (used in other parts of the codebase)
export const isBackendAvailable = !useMockBackend;

// Log the backend status for debugging
console.log(`Backend status: Using ${useMockBackend ? 'MOCK' : 'REAL Supabase'} backend`);
