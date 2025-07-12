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
  console.log('Services: Initializing services using new registry pattern');

  try {
    // Use the new service initializers
    console.log('Services: Importing serviceInitializers module');
    const serviceInitializersModule = await import('./serviceInitializers');
    console.log('Services: serviceInitializers module imported:', serviceInitializersModule);

    if (typeof serviceInitializersModule.initializeServices !== 'function') {
      console.error('Services: initializeServices is not a function in the imported module:', serviceInitializersModule);
      throw new Error('initializeServices is not a function in the serviceInitializers module');
    }

    console.log('Services: Calling initializeServices from serviceInitializers');
    serviceInitializersModule.initializeServices();

    // Manually initialize critical services
    console.log('Services: Manually initializing authService');
    const { createAuthService } = await import('./authService');
    console.log('Services: authService module imported, createAuthService:', createAuthService);

    console.log('Services: Manually initializing bookService');
    const { createBookService } = await import('./bookService');
    console.log('Services: bookService module imported, createBookService:', createBookService);

    appLog('Services', 'Services initialized successfully', 'success');
    console.log('Services: Services initialized successfully');
    return true;
  } catch (error: any) {
    appLog('Services', `Error initializing services: ${error.message}`, 'error');
    console.error('Services: Error initializing services:', error);
    return false;
  }
};

// For backward compatibility
import { initManager } from './initManager';
export { initManager };
