// scripts/verify-service-registry.js
// Script to verify the Service Registry implementation

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Verifying Service Registry implementation...');

// Import the registry
async function verifyRegistry() {
  try {
    console.log('Importing Service Registry...');
    const { registry, SERVICE_NAMES } = await import('../src/services/ServiceRegistry.js');
    
    console.log('Service Registry imported successfully!');
    console.log('Registry methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(registry)));
    
    // Check if the registry has the expected methods
    const expectedMethods = [
      'register',
      'registerInitializer',
      'get',
      'getService',
      'has',
      'hasInitializer',
      'listServices',
      'listInitializers',
      'withService'
    ];
    
    const missingMethods = expectedMethods.filter(method => 
      !Object.getOwnPropertyNames(Object.getPrototypeOf(registry)).includes(method)
    );
    
    if (missingMethods.length === 0) {
      console.log('✅ Service Registry has all expected methods');
    } else {
      console.error('❌ Service Registry is missing methods:', missingMethods);
    }
    
    // Check if SERVICE_NAMES has the expected values
    console.log('SERVICE_NAMES:', SERVICE_NAMES);
    
    // Import service initializers
    console.log('\nImporting service initializers...');
    const { initializeServices, isInitialized } = await import('../src/services/serviceInitializers.js');
    
    console.log('Service initializers imported successfully!');
    console.log('Initialized:', isInitialized());
    
    // Initialize services
    console.log('\nInitializing services...');
    initializeServices();
    console.log('Services initialized successfully!');
    
    // Check registered initializers
    if (typeof registry.listInitializers === 'function') {
      const initializers = registry.listInitializers();
      console.log('Registered initializers:', initializers);
      
      if (initializers.length > 0) {
        console.log('✅ Service initializers registered successfully');
      } else {
        console.error('❌ No service initializers registered');
      }
    }
    
    // Try to get a service
    console.log('\nTrying to get a service...');
    try {
      const sampleService = await registry.getService(SERVICE_NAMES.SAMPLE_SERVICE);
      console.log('✅ Successfully retrieved sample service:', sampleService);
    } catch (error) {
      console.error('❌ Failed to get sample service:', error);
    }
    
    console.log('\nVerification complete!');
  } catch (error) {
    console.error('Error verifying Service Registry:', error);
  }
}

verifyRegistry();
