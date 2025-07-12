// src/config.ts
// Application configuration

import ENV, { initializeEnvironment } from './config/environment';

// Initialize environment
initializeEnvironment();

// Export Supabase configuration
export const supabaseConfig = {
  // Using environment variables for Supabase credentials
  supabaseUrl: ENV.SUPABASE_URL,
  supabaseAnonKey: ENV.SUPABASE_KEY
};

// Fallback values for development if environment variables are not set
if (!ENV.isConfigured()) {
  console.warn('Supabase environment variables not found, using fallback values');
  supabaseConfig.supabaseUrl = "https://blwypdcobizmpidmuhvq.supabase.co";
  supabaseConfig.supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsd3lwZGNvYml6bXBpZG11aHZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyMDgzNDcsImV4cCI6MjA1OTc4NDM0N30.YP2r-CnSaM4rKclXBivanAMBQh9sMsI95F2p87zIuWM";

  if (ENV.IS_DEVELOPMENT) {
    console.log('Using fallback values:', {
      supabaseUrl: supabaseConfig.supabaseUrl,
      supabaseAnonKey: '[REDACTED]'
    });
  }
}

// Export application configuration
export const appConfig = {
  // API configuration
  api: {
    timeout: ENV.API_TIMEOUT,
    maxRetries: ENV.MAX_RETRIES,
    retryDelay: ENV.RETRY_DELAY
  },

  // Feature flags
  features: {
    enableAIAssistant: ENV.ENABLE_AI_ASSISTANT,
    enableConsultantFeatures: ENV.ENABLE_CONSULTANT_FEATURES,
    enableAnalytics: ENV.ENABLE_ANALYTICS,
    enablePerformanceTracking: ENV.ENABLE_PERFORMANCE_TRACKING,
    enableMocks: ENV.ENABLE_MOCKS
  },

  // Environment information
  environment: {
    type: ENV.getEnvironmentType(),
    isBeta: ENV.IS_BETA,
    betaVersion: ENV.BETA_VERSION,
    buildDate: ENV.BUILD_DATE
  }
};

// Export environment for convenience
export { ENV };
