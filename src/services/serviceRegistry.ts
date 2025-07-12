// src/services/ServiceRegistry.ts
import { appLog } from '../components/LogViewer';
import { SERVICE_NAMES } from '../constants/app';
import { AppError, ErrorCode } from '../utils/errorHandling';

// Re-export SERVICE_NAMES for convenience
export { SERVICE_NAMES };

/**
 * Service initializer function type
 */
export type ServiceInitializer<T> = () => Promise<T>;

/**
 * Service Registry Interface
 * This defines the shape of the service registry
 */
export interface IServiceRegistry {
  // Register a service
  register<T>(name: string, implementation: T): void;

  // Register a service initializer
  registerInitializer<T>(name: string, initializer: ServiceInitializer<T>): void;

  // Get a service by name
  get<T>(name: string): T;

  // Get a service asynchronously, initializing if needed
  getService<T>(name: string): Promise<T>;

  // Check if a service exists
  has(name: string): boolean;

  // Check if a service has an initializer
  hasInitializer(name: string): boolean;

  // Get all registered service names
  listServices(): string[];

  // Get all services with initializers
  listInitializers(): string[];

  // Execute a callback with a service
  withService<T, R>(name: string, callback: (service: T) => Promise<R>): Promise<R>;
}

/**
 * Service Registry Implementation
 * This is a singleton class that manages all services in the application
 */
class ServiceRegistry implements IServiceRegistry {
  private services: Record<string, any> = {};
  private initializers: Map<string, ServiceInitializer<any>> = new Map();
  private initializationInProgress: Map<string, Promise<any>> = new Map();
  private static instance: ServiceRegistry;

  // Private constructor to enforce singleton pattern
  private constructor() {}

  // Get the singleton instance
  public static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  /**
   * Register a service in the registry
   * @param name The name of the service
   * @param implementation The service implementation
   */
  public register<T>(name: string, implementation: T): void {
    this.services[name] = implementation;
    appLog('ServiceRegistry', `Service "${name}" registered successfully`, 'info');
  }

  /**
   * Register a service initializer function
   * @param name The name of the service
   * @param initializer The initializer function that creates the service
   */
  public registerInitializer<T>(name: string, initializer: ServiceInitializer<T>): void {
    this.initializers.set(name, initializer);
    appLog('ServiceRegistry', `Initializer for service "${name}" registered successfully`, 'info');
  }

  /**
   * Get a service from the registry
   * @param name The name of the service
   * @returns The service implementation
   * @throws Error if the service is not registered
   */
  public get<T>(name: string): T {
    if (!this.has(name)) {
      const error = new AppError(
        `Service "${name}" not registered`,
        ErrorCode.SERVICE_ERROR,
        { serviceName: name }
      );
      appLog('ServiceRegistry', error.message, 'error');
      throw error;
    }
    return this.services[name] as T;
  }

  /**
   * Get a service asynchronously, initializing it if needed
   * @param name The name of the service
   * @returns Promise resolving to the service implementation
   */
  public async getService<T>(name: string): Promise<T> {
    // Return the service if it's already initialized
    if (this.has(name)) {
      return this.get<T>(name);
    }

    // Check if initialization is already in progress
    if (this.initializationInProgress.has(name)) {
      appLog('ServiceRegistry', `Waiting for service "${name}" initialization to complete`, 'info');
      await this.initializationInProgress.get(name);
      return this.get<T>(name);
    }

    // Check if we have an initializer for this service
    if (!this.hasInitializer(name)) {
      const error = new AppError(
        `No initializer registered for service "${name}"`,
        ErrorCode.SERVICE_INITIALIZATION_ERROR,
        { serviceName: name }
      );
      appLog('ServiceRegistry', error.message, 'error');
      throw error;
    }

    // Initialize the service
    try {
      appLog('ServiceRegistry', `Initializing service "${name}"`, 'info');
      const initializer = this.initializers.get(name)!;

      // Create a promise for the initialization and store it
      const initPromise = (async () => {
        try {
          const implementation = await initializer();
          this.register(name, implementation);
          return implementation;
        } catch (error) {
          const appError = error instanceof AppError ? error : new AppError(
            `Failed to initialize service "${name}": ${error instanceof Error ? error.message : String(error)}`,
            ErrorCode.SERVICE_INITIALIZATION_ERROR,
            { serviceName: name, originalError: error }
          );
          appLog('ServiceRegistry', appError.message, 'error');
          throw appError;
        } finally {
          // Clean up the initialization promise when done
          this.initializationInProgress.delete(name);
        }
      })();

      // Store the initialization promise
      this.initializationInProgress.set(name, initPromise);

      // Wait for initialization to complete
      await initPromise;

      // Return the initialized service
      return this.get<T>(name);
    } catch (error) {
      // Re-throw the error
      throw error;
    }
  }

  /**
   * Check if a service is registered
   * @param name The name of the service
   * @returns True if the service is registered, false otherwise
   */
  public has(name: string): boolean {
    return !!this.services[name];
  }

  /**
   * Check if a service has an initializer
   * @param name The name of the service
   * @returns True if the service has an initializer, false otherwise
   */
  public hasInitializer(name: string): boolean {
    return this.initializers.has(name);
  }

  /**
   * Get a list of all registered services
   * @returns Array of service names
   */
  public listServices(): string[] {
    return Object.keys(this.services);
  }

  /**
   * Get a list of all services with initializers
   * @returns Array of service names
   */
  public listInitializers(): string[] {
    return Array.from(this.initializers.keys());
  }

  /**
   * Execute a callback with a service
   * @param name The name of the service
   * @param callback The callback to execute with the service
   * @returns The result of the callback
   */
  public async withService<T, R>(
    name: string,
    callback: (service: T) => Promise<R>
  ): Promise<R> {
    const service = await this.getService<T>(name);
    return callback(service);
  }

  /**
   * For backward compatibility with the old initManager
   * @deprecated Use getService instead
   */
  public async getOrInitialize<T>(name: string, initManager: any): Promise<T> {
    appLog('ServiceRegistry', `Warning: getOrInitialize is deprecated, use getService instead`, 'warning');
    if (this.has(name)) {
      return this.get<T>(name);
    }

    try {
      // Try to initialize using the new method first
      if (this.hasInitializer(name)) {
        return await this.getService<T>(name);
      }

      // Fall back to the old initManager if needed
      await initManager.initializeService(name);
      return this.get<T>(name);
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError(
        `Failed to initialize service "${name}": ${error instanceof Error ? error.message : String(error)}`,
        ErrorCode.SERVICE_INITIALIZATION_ERROR,
        { serviceName: name, originalError: error }
      );
      appLog('ServiceRegistry', appError.message, 'error');
      throw appError;
    }
  }
}

// Export the singleton instance
export const registry = ServiceRegistry.getInstance();

// Helper functions for common services
export const getBookService = async () =>
  registry.getService(SERVICE_NAMES.BOOK_SERVICE);

export const getFeedbackService = async () =>
  registry.getService(SERVICE_NAMES.FEEDBACK_SERVICE);

export const getAIService = async () =>
  registry.getService(SERVICE_NAMES.AI_SERVICE);

export const getTriggerService = async () =>
  registry.getService(SERVICE_NAMES.TRIGGER_SERVICE);

export const getStatisticsService = async () =>
  registry.getService(SERVICE_NAMES.STATISTICS_SERVICE);

export const getAuthService = async () =>
  registry.getService(SERVICE_NAMES.AUTH_SERVICE);

export const getDictionaryService = async () =>
  registry.getService(SERVICE_NAMES.DICTIONARY_SERVICE);

export const getConsultantService = async () =>
  registry.getService(SERVICE_NAMES.CONSULTANT_SERVICE);

export const getInteractionService = async () =>
  registry.getService(SERVICE_NAMES.INTERACTION_SERVICE);

export const getMonitoringService = async () =>
  registry.getService(SERVICE_NAMES.MONITORING_SERVICE);

export const getDatabaseService = async () =>
  registry.getService(SERVICE_NAMES.DATABASE_SERVICE);

export const getAnalyticsService = async () =>
  registry.getService(SERVICE_NAMES.ANALYTICS_SERVICE);

// For backward compatibility
export const getBookServiceLegacy = async (initManager: any) =>
  registry.getOrInitialize(SERVICE_NAMES.BOOK_SERVICE, initManager);

export const getFeedbackServiceLegacy = async (initManager: any) =>
  registry.getOrInitialize(SERVICE_NAMES.FEEDBACK_SERVICE, initManager);

export const getAIServiceLegacy = async (initManager: any) =>
  registry.getOrInitialize(SERVICE_NAMES.AI_SERVICE, initManager);

export const getTriggerServiceLegacy = async (initManager: any) =>
  registry.getOrInitialize(SERVICE_NAMES.TRIGGER_SERVICE, initManager);

export const getStatisticsServiceLegacy = async (initManager: any) =>
  registry.getOrInitialize(SERVICE_NAMES.STATISTICS_SERVICE, initManager);