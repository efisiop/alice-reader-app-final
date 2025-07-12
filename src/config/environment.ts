// src/config/environment.ts
// Centralized environment configuration

import { ENV_TYPES } from '../constants/app';

// Environment configuration
export const ENV = {
  // Supabase configuration
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
  SUPABASE_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_KEY: import.meta.env.SUPABASE_SERVICE_ROLE_KEY || '',
  
  // Application environment
  APP_ENV: import.meta.env.VITE_APP_ENV || ENV_TYPES.DEVELOPMENT,
  IS_DEVELOPMENT: import.meta.env.DEV === true,
  IS_PRODUCTION: import.meta.env.PROD === true,
  IS_BETA: import.meta.env.VITE_BETA_MODE === 'true',
  BETA_VERSION: import.meta.env.VITE_BETA_VERSION || '0.0.0',
  BUILD_DATE: import.meta.env.VITE_BUILD_DATE || new Date().toISOString(),
  
  // Feature flags
  ENABLE_AI_ASSISTANT: import.meta.env.VITE_ENABLE_AI_ASSISTANT === 'true',
  ENABLE_CONSULTANT_FEATURES: import.meta.env.VITE_ENABLE_CONSULTANT_FEATURES === 'true',
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  ENABLE_PERFORMANCE_TRACKING: import.meta.env.VITE_ENABLE_PERFORMANCE_TRACKING === 'true',
  ENABLE_MOCKS: import.meta.env.VITE_ENABLE_MOCKS === 'true',
  
  // API configuration
  API_TIMEOUT: Number(import.meta.env.VITE_API_TIMEOUT || 10000),
  MAX_RETRIES: Number(import.meta.env.VITE_MAX_RETRIES || 3),
  RETRY_DELAY: Number(import.meta.env.VITE_RETRY_DELAY || 1000),
  
  // Helper to check if essential env vars are available
  isConfigured(): boolean {
    return Boolean(this.SUPABASE_URL && this.SUPABASE_KEY);
  },
  
  // Log environment status (development only)
  logStatus(): void {
    if (this.IS_DEVELOPMENT) {
      console.log('Environment Configuration:');
      console.log(`- Environment: ${this.APP_ENV}`);
      console.log(`- Supabase URL: ${this.SUPABASE_URL ? '✓ Set' : '✗ Missing'}`);
      console.log(`- Supabase Key: ${this.SUPABASE_KEY ? '✓ Set' : '✗ Missing'}`);
      console.log(`- Beta Mode: ${this.IS_BETA ? 'Enabled' : 'Disabled'}`);
      if (this.IS_BETA) {
        console.log(`- Beta Version: ${this.BETA_VERSION}`);
      }
      console.log('Feature Flags:');
      console.log(`- AI Assistant: ${this.ENABLE_AI_ASSISTANT ? 'Enabled' : 'Disabled'}`);
      console.log(`- Consultant Features: ${this.ENABLE_CONSULTANT_FEATURES ? 'Enabled' : 'Disabled'}`);
      console.log(`- Analytics: ${this.ENABLE_ANALYTICS ? 'Enabled' : 'Disabled'}`);
      console.log(`- Performance Tracking: ${this.ENABLE_PERFORMANCE_TRACKING ? 'Enabled' : 'Disabled'}`);
      console.log(`- Mocks: ${this.ENABLE_MOCKS ? 'Enabled' : 'Disabled'}`);
    }
  },
  
  // Get environment type
  getEnvironmentType(): string {
    if (this.IS_PRODUCTION) return ENV_TYPES.PRODUCTION;
    if (this.IS_BETA) return ENV_TYPES.BETA;
    if (import.meta.env.MODE === 'test') return ENV_TYPES.TEST;
    return ENV_TYPES.DEVELOPMENT;
  }
};

// Export a safe Supabase instantiation function
export async function createSupabaseClient() {
  if (!ENV.isConfigured()) {
    console.error('Environment not properly configured for Supabase');
    return null;
  }
  
  try {
    const { createClient } = await import('@supabase/supabase-js');
    return createClient(ENV.SUPABASE_URL, ENV.SUPABASE_KEY);
  } catch (err) {
    console.error('Failed to create Supabase client:', err);
    return null;
  }
}

// Initialize environment
export function initializeEnvironment() {
  ENV.logStatus();
  return ENV;
}

// Export default
export default ENV;
