// src/services/dependencies.ts
import { appLog } from '../components/LogViewer';

/**
 * Service dependency configuration
 *
 * This defines the dependencies between services to ensure proper initialization order.
 * Each service lists the services it depends on.
 */
export const SERVICE_DEPENDENCIES = {
  'authService': [],
  'bookService': ['authService'],
  'dictionaryService': ['bookService'],
  'aiService': ['bookService', 'dictionaryService'],
  'feedbackService': ['authService', 'bookService'],
  'triggerService': ['authService', 'bookService'],
  'statisticsService': ['bookService', 'authService'],
  'consultantService': ['authService', 'bookService', 'feedbackService', 'triggerService'],
  'interactionService': ['authService', 'bookService'],
  'monitoringService': [], // No dependencies for monitoring service
  'databaseService': ['authService'], // Database service depends on auth service
  'analyticsService': [], // No dependencies for analytics service
  'sampleService': ['bookService'] // Sample service for testing
};

/**
 * Log the dependency graph for debugging
 */
export function logDependencyGraph(): void {
  appLog('ServiceDependencies', 'Service dependency graph:', 'info');

  Object.entries(SERVICE_DEPENDENCIES).forEach(([service, dependencies]) => {
    appLog('ServiceDependencies', `${service} depends on: ${dependencies.join(', ') || 'none'}`, 'debug');
  });
}
