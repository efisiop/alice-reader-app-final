// src/services/initManager.ts
import { appLog } from '../components/LogViewer';
import { SERVICE_DEPENDENCIES } from './dependencies';
import { getInitializationOrder } from './initOrder';

type InitFunction = () => Promise<void>;

class ServiceInitManager {
  private initFunctions: Map<string, InitFunction> = new Map();
  private dependencies: Map<string, string[]> = new Map();
  private initialized: Set<string> = new Set();
  private initializing: Set<string> = new Set();

  register(serviceName: string, initFn: InitFunction, dependencies?: string[]): void {
    console.log(`Registering initialization function for ${serviceName}`);
    this.initFunctions.set(serviceName, initFn);
    // Use dependencies from SERVICE_DEPENDENCIES if not explicitly provided
    const deps = dependencies || SERVICE_DEPENDENCIES[serviceName] || [];
    this.dependencies.set(serviceName, deps);
    appLog('ServiceInitManager', `Registered initialization function for ${serviceName}`, 'info');
    console.log(`Available services for initialization: ${Array.from(this.initFunctions.keys()).join(', ')}`);
  }

  async initializeService(name: string): Promise<void> {
    console.log(`Attempting to initialize service: ${name}`);

    // Already initialized
    if (this.initialized.has(name)) {
      appLog('ServiceInitManager', `Service ${name} already initialized`, 'info');
      console.log(`Service ${name} already initialized`);
      return;
    }

    // Currently initializing (circular dependency)
    if (this.initializing.has(name)) {
      appLog('ServiceInitManager', `Circular initialization detected for service: ${name}`, 'warning');
      console.warn(`Circular initialization detected for service: ${name}`);
      return;
    }

    // Service not registered
    if (!this.initFunctions.has(name)) {
      console.error(`No initialization function registered for service: ${name}`);
      console.error(`Available services: ${Array.from(this.initFunctions.keys()).join(', ')}`);
      appLog('ServiceInitManager', `No initialization function registered for service: ${name}`, 'error');
      throw new Error(`No initialization function registered for service: ${name}`);
    }

    // Initialize dependencies first
    appLog('ServiceInitManager', `Initializing service: ${name}`, 'info');
    console.log(`Initializing service: ${name}`);
    this.initializing.add(name);
    const deps = this.dependencies.get(name) || [];
    for (const dep of deps) {
      await this.initializeService(dep);
    }

    // Initialize the service
    try {
      console.log(`Executing initialization function for ${name}`);
      await this.initFunctions.get(name)!();
      this.initialized.add(name);
      appLog('ServiceInitManager', `Service ${name} initialized successfully`, 'success');
      console.log(`Service ${name} initialized successfully`);
    } catch (error: any) {
      appLog('ServiceInitManager', `Error initializing service ${name}: ${error.message}`, 'error');
      console.error(`Error initializing service ${name}:`, error);
      throw error;
    } finally {
      this.initializing.delete(name);
    }
  }

  async initializeAll(options: { useTopologicalOrder?: boolean } = {}): Promise<void> {
    appLog('ServiceInitManager', 'Initializing all services', 'info');
    console.log('Initializing all services');

    let services: string[];

    if (options.useTopologicalOrder) {
      // Use topological sorting for initialization order
      services = getInitializationOrder().filter(service => this.initFunctions.has(service));
      appLog('ServiceInitManager', `Using topological order: ${services.join(', ')}`, 'info');
    } else {
      // Use registration order
      services = Array.from(this.initFunctions.keys());
      appLog('ServiceInitManager', `Using registration order: ${services.join(', ')}`, 'info');
    }

    console.log(`Services to initialize: ${services.join(', ')}`);

    for (const service of services) {
      await this.initializeService(service);
    }

    appLog('ServiceInitManager', 'All services initialized successfully', 'success');
    console.log('All services initialized successfully');
  }

  isInitialized(name: string): boolean {
    return this.initialized.has(name);
  }

  getInitializedServices(): string[] {
    return Array.from(this.initialized);
  }

  hasInitFunction(name: string): boolean {
    return this.initFunctions.has(name);
  }

  getRegisteredServices(): string[] {
    return Array.from(this.initFunctions.keys());
  }
}

export const initManager = new ServiceInitManager();
