// src/services/initServices.ts
import { appLog } from '../components/LogViewer';
import { registry } from '@services/serviceRegistry';
import { initManager } from './initManager';
import { getInitializationOrder } from './initOrder';
import { logDependencyGraph, SERVICE_DEPENDENCIES } from './dependencies';
import { AppError, ErrorCode } from '../utils/errorHandling';

// Import all services to ensure they are registered
import './authService';
import './bookService';
import './aiService';
import './dictionaryService';
import './feedbackService';
import './triggerService';
import './statisticsService';
import './consultantService';
import './interactionService';
import './monitoringService';
import './databaseService';
import './analyticsService';
import './sampleService'; // Sample service for testing

// Track initialization state
let initialized = false;

/**
 * Initialize all services in the correct order
 *
 * @param options Initialization options
 * @returns Promise that resolves when all services are initialized
 */
export async function initializeAllServices(
  options: {
    forceReload?: boolean;
    requiredServices?: string[];
  } = {}
): Promise<void> {
  // Skip if already initialized and not forcing reload
  if (initialized && !options.forceReload) {
    appLog('ServiceInitializer', 'Services already initialized', 'info');
    return;
  }

  try {
    // Log dependency graph for debugging
    logDependencyGraph();

    appLog('ServiceInitializer', 'Initializing all services...', 'info');
    console.log('Initializing all services...');

    // Get initialization order
    const initOrder = getInitializationOrder();
    appLog('ServiceInitializer', `Initialization order: ${initOrder.join(', ')}`, 'info');

    // Initialize services in order
    await initManager.initializeAll({ useTopologicalOrder: true });

    // Verify required services
    if (options.requiredServices && options.requiredServices.length > 0) {
      const missingServices = options.requiredServices.filter(service => !registry.has(service));

      if (missingServices.length > 0) {
        const errorMessage = `Missing required services: ${missingServices.join(', ')}`;
        appLog('ServiceInitializer', errorMessage, 'error');
        throw new AppError(errorMessage, ErrorCode.SERVICE_INITIALIZATION_ERROR, { missingServices });
      }
    }

    // Mark as initialized
    initialized = true;

    appLog('ServiceInitializer', 'All services initialized successfully', 'success');
    console.log('All services initialized successfully');
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    appLog('ServiceInitializer', `Error initializing services: ${errorMessage}`, 'error');
    console.error('Error initializing services:', error);

    // Wrap in AppError if needed
    if (!(error instanceof AppError)) {
      throw new AppError(
        `Failed to initialize services: ${errorMessage}`,
        ErrorCode.SERVICE_INITIALIZATION_ERROR,
        { originalError: error }
      );
    }

    throw error;
  }
}

/**
 * Check if services are initialized
 */
export function isInitialized(): boolean {
  return initialized;
}

/**
 * Get the list of registered services
 */
export function getRegisteredServices(): string[] {
  return registry.listServices();
}

/**
 * Get the list of initialized services
 */
export function getInitializedServices(): string[] {
  return initManager.getInitializedServices();
}
