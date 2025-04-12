// src/constants/app.ts
// Centralized constants for the Alice Reader application

// Book IDs
export const BOOK_IDS = {
  ALICE: 'alice-in-wonderland',
  ALICE_STRING: 'alice-in-wonderland',
  ALICE_UUID: '550e8400-e29b-41d4-a716-446655440000',
};

// API Configuration
export const API_CONFIG = {
  RETRY_DELAY: 1000,
  MAX_RETRIES: 3,
  TIMEOUT: 10000,
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
  SUPABASE_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
};

// Backend Configuration
export const BACKEND_CONFIG = {
  USE_MOCK: false, // Set to true to use mock backend, false to use real Supabase
};

// AI Modes
export const AI_MODES = {
  CHAT: 'chat',
  DEFINITION: 'definition',
  ANALYSIS: 'analysis',
  SUMMARY: 'summary',
};

// Feedback Types
export const FEEDBACK_TYPES = {
  AHA_MOMENT: 'AHA_MOMENT',
  POSITIVE_EXPERIENCE: 'POSITIVE_EXPERIENCE',
  SUGGESTION: 'SUGGESTION',
  CONFUSION: 'CONFUSION',
  GENERAL: 'GENERAL',
};

// Help Request Statuses
export const HELP_REQUEST_STATUSES = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CANCELLED: 'CANCELLED',
};

// Trigger Types
export const TRIGGER_TYPES = {
  ENGAGEMENT: 'ENGAGEMENT',
  CHECK_IN: 'CHECK_IN',
  QUIZ: 'QUIZ',
  ENCOURAGE: 'ENCOURAGE',
};

// Service Names
export const SERVICE_NAMES = {
  AUTH_SERVICE: 'authService',
  BOOK_SERVICE: 'bookService',
  AI_SERVICE: 'aiService',
  DICTIONARY_SERVICE: 'dictionaryService',
  FEEDBACK_SERVICE: 'feedbackService',
  TRIGGER_SERVICE: 'triggerService',
  STATISTICS_SERVICE: 'statisticsService',
  CONSULTANT_SERVICE: 'consultantService',
  INTERACTION_SERVICE: 'interactionService',
  MONITORING_SERVICE: 'monitoringService',
  DATABASE_SERVICE: 'databaseService',
  ANALYTICS_SERVICE: 'analyticsService',
  SAMPLE_SERVICE: 'sampleService',
};

// Database Tables
export const DB_TABLES = {
  BOOKS: 'books',
  CHAPTERS: 'chapters',
  SECTIONS: 'sections',
  PROFILES: 'profiles',
  CONSULTANT_USERS: 'consultant_users',
  VERIFICATION_CODES: 'verification_codes',
  DICTIONARY: 'dictionary',
  READING_PROGRESS: 'reading_progress',
  READING_STATS: 'reading_stats',
  READING_SESSIONS: 'reading_sessions',
  AI_INTERACTIONS: 'ai_interactions',
  AI_PROMPTS: 'ai_prompts',
  USER_PROMPT_RESPONSES: 'user_prompt_responses',
  USER_VOCABULARY: 'user_vocabulary',
  CONSULTANT_ASSIGNMENTS: 'consultant_assignments',
  CONSULTANT_TRIGGERS: 'consultant_triggers',
  HELP_REQUESTS: 'help_requests',
  USER_FEEDBACK: 'user_feedback',
  CONSULTANT_ACTIONS_LOG: 'consultant_actions_log',
  SCHEMA_VERSIONS: 'schema_versions',
};

// Animation/Transition Durations
export const TRANSITIONS = {
  SHORT: 150,
  MEDIUM: 300,
  LONG: 500,
};

// Environment Types
export const ENV_TYPES = {
  DEVELOPMENT: 'development',
  TEST: 'test',
  BETA: 'beta',
  PRODUCTION: 'production',
};

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_AI_ASSISTANT: import.meta.env.VITE_ENABLE_AI_ASSISTANT === 'true',
  ENABLE_CONSULTANT_FEATURES: import.meta.env.VITE_ENABLE_CONSULTANT_FEATURES === 'true',
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  ENABLE_PERFORMANCE_TRACKING: import.meta.env.VITE_ENABLE_PERFORMANCE_TRACKING === 'true',
  ENABLE_MOCKS: import.meta.env.VITE_ENABLE_MOCKS === 'true',
  BETA_MODE: import.meta.env.VITE_BETA_MODE === 'true',
};

// Error Types
export const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  SERVICE: 'SERVICE_ERROR',
  AUTH: 'AUTH_ERROR',
  DATA: 'DATA_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  SUPABASE: 'SUPABASE_ERROR',
  API: 'API_ERROR',
};
