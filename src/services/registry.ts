// src/services/registry.ts
import { appLog } from '../components/LogViewer';

type ServiceMap = Record<string, any>;

class ServiceRegistry {
  private services: ServiceMap = {};

  register<T>(name: string, implementation: T): void {
    this.services[name] = implementation;
    appLog('ServiceRegistry', `Service "${name}" registered successfully`, 'info');
    console.log(`Service "${name}" registered successfully`);
  }

  get<T>(name: string): T {
    if (!this.services[name]) {
      appLog('ServiceRegistry', `Service "${name}" not registered`, 'error');
      console.error(`Service "${name}" not registered`);
      throw new Error(`Service "${name}" not registered`);
    }
    return this.services[name] as T;
  }

  has(name: string): boolean {
    return !!this.services[name];
  }

  listServices(): string[] {
    return Object.keys(this.services);
  }
  
  async getOrInitialize<T>(name: string, initManager: any): Promise<T> {
    if (this.has(name)) {
      return this.get<T>(name);
    }
    
    // Initialize the service
    await initManager.initializeService(name);
    return this.get<T>(name);
  }
  
  async withService<T, R>(name: string, callback: (service: T) => Promise<R>, initManager: any): Promise<R> {
    const service = await this.getOrInitialize<T>(name, initManager);
    return callback(service);
  }
}

// Create singleton instance
export const registry = new ServiceRegistry();

// Service name constants
export const SERVICE_NAMES = {
  BOOK_SERVICE: 'bookService',
  FEEDBACK_SERVICE: 'feedbackService',
  AI_SERVICE: 'aiService',
  TRIGGER_SERVICE: 'triggerService',
  STATISTICS_SERVICE: 'statisticsService',
};

// Helper functions for common services
export const getBookService = async (initManager: any) => 
  registry.getOrInitialize(SERVICE_NAMES.BOOK_SERVICE, initManager);

export const getFeedbackService = async (initManager: any) => 
  registry.getOrInitialize(SERVICE_NAMES.FEEDBACK_SERVICE, initManager);

export const getAIService = async (initManager: any) => 
  registry.getOrInitialize(SERVICE_NAMES.AI_SERVICE, initManager);

export const getTriggerService = async (initManager: any) => 
  registry.getOrInitialize(SERVICE_NAMES.TRIGGER_SERVICE, initManager);

export const getStatisticsService = async (initManager: any) => 
  registry.getOrInitialize(SERVICE_NAMES.STATISTICS_SERVICE, initManager);
