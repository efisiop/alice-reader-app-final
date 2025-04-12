// src/services/backendConfig.ts
// This file provides configuration for backend services

// Helper to decide whether to use mock or real backend
export const isBackendAvailable = true; // Set to true to use real Supabase, false to use mock

// Log the backend status for debugging
console.log(`Backend status: Using ${isBackendAvailable ? 'REAL Supabase' : 'MOCK'} backend`);
