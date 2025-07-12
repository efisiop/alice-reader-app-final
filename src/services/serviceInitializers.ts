// src/services/serviceInitializers.ts
import { appLog } from '../components/LogViewer';
import { registry, SERVICE_NAMES } from './serviceRegistry';
// SERVICE_NAMES is now imported from serviceRegistry
import { AppError, ErrorCode } from '../utils/errorHandling';

// Track initialization state
let initialized = false;

/**
 * Register all service initializers
 * This function registers initializer functions for all services
 * using dynamic imports to prevent circular dependencies
 */
export function registerServiceInitializers(): void {
  appLog('ServiceInitializers', 'Registering service initializers', 'info');

  // Auth Service
  registry.registerInitializer(SERVICE_NAMES.AUTH_SERVICE, async () => {
    try {
      console.log('ServiceInitializers: Importing authService module');
      const authModule = await import('./authService');
      console.log('ServiceInitializers: authService module imported:', authModule);

      if (typeof authModule.createAuthService !== 'function') {
        console.error('ServiceInitializers: createAuthService is not a function in the imported module');
        throw new Error('createAuthService is not a function');
      }

      console.log('ServiceInitializers: Creating auth service');
      return authModule.createAuthService();
    } catch (error) {
      console.error('ServiceInitializers: Error initializing auth service:', error);
      throw error;
    }
  });

  // Book Service
  registry.registerInitializer(SERVICE_NAMES.BOOK_SERVICE, async () => {
    try {
      console.log('ServiceInitializers: Importing bookService module');
      const bookModule = await import('./bookService');
      console.log('ServiceInitializers: bookService module imported:', bookModule);

      if (typeof bookModule.createBookService !== 'function') {
        console.error('ServiceInitializers: createBookService is not a function in the imported module');
        throw new Error('createBookService is not a function');
      }

      console.log('ServiceInitializers: Creating book service');
      return bookModule.createBookService();
    } catch (error) {
      console.error('ServiceInitializers: Error initializing book service:', error);
      throw error;
    }
  });

  // Dictionary Service
  registry.registerInitializer(SERVICE_NAMES.DICTIONARY_SERVICE, async () => {
    const { createDictionaryService } = await import('./dictionaryService');
    return createDictionaryService();
  });

  // AI Service
  registry.registerInitializer(SERVICE_NAMES.AI_SERVICE, async () => {
    const { createAIService } = await import('./aiService');
    return createAIService();
  });

  // Feedback Service
  registry.registerInitializer(SERVICE_NAMES.FEEDBACK_SERVICE, async () => {
    const { createFeedbackService } = await import('./feedbackService');
    return createFeedbackService();
  });

  // Trigger Service
  registry.registerInitializer(SERVICE_NAMES.TRIGGER_SERVICE, async () => {
    const { createTriggerService } = await import('./triggerService');
    return createTriggerService();
  });

  // Statistics Service
  registry.registerInitializer(SERVICE_NAMES.STATISTICS_SERVICE, async () => {
    const { createStatisticsService } = await import('./statisticsService');
    return createStatisticsService();
  });

  // Consultant Service
  registry.registerInitializer(SERVICE_NAMES.CONSULTANT_SERVICE, async () => {
    const { createConsultantService } = await import('./consultantService');
    return createConsultantService();
  });

  // Interaction Service
  registry.registerInitializer(SERVICE_NAMES.INTERACTION_SERVICE, async () => {
    const { createInteractionService } = await import('./interactionService');
    return createInteractionService();
  });

  // Monitoring Service
  registry.registerInitializer(SERVICE_NAMES.MONITORING_SERVICE, async () => {
    const { createMonitoringService } = await import('./monitoringService');
    return createMonitoringService();
  });

  // Database Service
  registry.registerInitializer(SERVICE_NAMES.DATABASE_SERVICE, async () => {
    const { createDatabaseService } = await import('./databaseService');
    return createDatabaseService();
  });

  // Analytics Service
  registry.registerInitializer(SERVICE_NAMES.ANALYTICS_SERVICE, async () => {
    const { createAnalyticsService } = await import('./analyticsService');
    return createAnalyticsService();
  });

  // Sample Service (for testing)
  registry.registerInitializer(SERVICE_NAMES.SAMPLE_SERVICE, async () => {
    const { createSampleService } = await import('./sampleService');
    return createSampleService();
  });

  appLog('ServiceInitializers', 'All service initializers registered successfully', 'success');
}

/**
 * Initialize all services
 * This function ensures all service initializers are registered
 * and marks the initialization as complete
 */
export function initializeServices(): void {
  console.log('ServiceInitializers: initializeServices called, initialized =', initialized);
  if (!initialized) {
    console.log('ServiceInitializers: Calling registerServiceInitializers');
    registerServiceInitializers();
    console.log('ServiceInitializers: Service initializers registered');
    initialized = true;
    console.log('ServiceInitializers: Services initialized successfully');
  } else {
    console.log('ServiceInitializers: Services already initialized');
  }
}

/**
 * Check if services are initialized
 */
export function isInitialized(): boolean {
  return initialized;
}

/**
 * Initialize a specific service and its dependencies
 * @param serviceName The name of the service to initialize
 * @returns Promise that resolves when the service is initialized
 */
export async function initializeService(serviceName: string): Promise<any> {
  try {
    // Ensure initializers are registered
    if (!initialized) {
      initializeServices();
    }

    // Initialize the service
    return await registry.getService(serviceName);
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError(
      `Failed to initialize service "${serviceName}": ${error instanceof Error ? error.message : String(error)}`,
      ErrorCode.SERVICE_INITIALIZATION_ERROR,
      { serviceName, originalError: error }
    );
    appLog('ServiceInitializers', appError.message, 'error');
    throw appError;
  }
}

/**
 * Initialize multiple services
 * @param serviceNames Array of service names to initialize
 * @returns Promise that resolves when all services are initialized
 */
export async function initializeServices2(serviceNames: string[]): Promise<void> {
  try {
    // Ensure initializers are registered
    if (!initialized) {
      initializeServices();
    }

    // Initialize all specified services
    await Promise.all(serviceNames.map(name => registry.getService(name)));
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError(
      `Failed to initialize services: ${error instanceof Error ? error.message : String(error)}`,
      ErrorCode.SERVICE_INITIALIZATION_ERROR,
      { originalError: error }
    );
    appLog('ServiceInitializers', appError.message, 'error');
    throw appError;
  }
}

// Initialize services when this module is imported
initializeServices();
