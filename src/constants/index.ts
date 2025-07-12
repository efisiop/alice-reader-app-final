// src/constants/index.ts
// Re-export all constants from app.ts

export * from './app';

// Legacy exports for backward compatibility
// These will be deprecated in future versions
import {
  BOOK_IDS,
  API_CONFIG,
  BACKEND_CONFIG,
  AI_MODES,
  FEEDBACK_TYPES,
  HELP_REQUEST_STATUSES,
  TRIGGER_TYPES,
  SERVICE_NAMES
} from './app';

// Legacy exports with old names
export const BookIds = BOOK_IDS;
export const ApiConfig = API_CONFIG;
export const BackendConfig = BACKEND_CONFIG;
export const AIModes = AI_MODES;
export const FeedbackTypes = FEEDBACK_TYPES;
export const HelpRequestStatuses = HELP_REQUEST_STATUSES;
export const TriggerTypes = TRIGGER_TYPES;
export const ServiceNames = SERVICE_NAMES;
