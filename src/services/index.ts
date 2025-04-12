// src/services/index.ts
// This file ensures all services are loaded and registered

import { appLog } from '../components/LogViewer';

// Export service registry and initializers
export * from './serviceRegistry';
export * from './serviceInitializers';

// Export service interfaces - commented out to avoid circular dependencies
// export * from '../types/serviceInterfaces';
// Import interfaces directly from their source files instead

// Export initialization function for backward compatibility
export const initializeServices = async () => {
  appLog('Services', 'Initializing services using new registry pattern', 'info');

  try {
    // Use the new service initializers
    const { initializeServices: initServices } = await import('./serviceInitializers');
    initServices();
    appLog('Services', 'Services initialized successfully', 'success');
    return true;
  } catch (error: any) {
    appLog('Services', `Error initializing services: ${error.message}`, 'error');
    console.error('Error initializing services:', error);
    return false;
  }
};

// For backward compatibility
import { initManager } from './initManager';
export { initManager };
