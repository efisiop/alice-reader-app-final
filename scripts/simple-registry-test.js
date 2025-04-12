// scripts/simple-registry-test.js
// Simple test for Service Registry pattern

console.log('Testing Service Registry pattern...');

// Create a simple registry
class ServiceRegistry {
  constructor() {
    this.services = {};
    this.initializers = new Map();
    this.initializationInProgress = new Map();
  }
  
  register(name, service) {
    this.services[name] = service;
    console.log(`Service "${name}" registered`);
  }
  
  registerInitializer(name, initializer) {
    this.initializers.set(name, initializer);
    console.log(`Initializer for service "${name}" registered`);
  }
  
  get(name) {
    if (!this.services[name]) {
      throw new Error(`Service "${name}" not registered`);
    }
    return this.services[name];
  }
  
  async getService(name) {
    // Return the service if it's already initialized
    if (this.services[name]) {
      return this.services[name];
    }

    // Check if initialization is already in progress
    if (this.initializationInProgress.has(name)) {
      console.log(`Waiting for service "${name}" initialization to complete`);
      await this.initializationInProgress.get(name);
      return this.services[name];
    }

    // Check if we have an initializer for this service
    if (!this.initializers.has(name)) {
      throw new Error(`No initializer registered for service "${name}"`);
    }

    // Initialize the service
    try {
      console.log(`Initializing service "${name}"`);
      const initializer = this.initializers.get(name);
      
      // Create a promise for the initialization and store it
      const initPromise = (async () => {
        try {
          const implementation = await initializer();
          this.register(name, implementation);
          return implementation;
        } catch (error) {
          console.error(`Failed to initialize service "${name}":`, error);
          throw error;
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
      return this.services[name];
    } catch (error) {
      // Re-throw the error
      throw error;
    }
  }
  
  has(name) {
    return !!this.services[name];
  }
  
  hasInitializer(name) {
    return this.initializers.has(name);
  }
  
  listServices() {
    return Object.keys(this.services);
  }
  
  listInitializers() {
    return Array.from(this.initializers.keys());
  }
}

// Create a registry instance
const registry = new ServiceRegistry();

// Register some services
registry.register('service1', { name: 'Service 1' });
registry.register('service2', { name: 'Service 2' });

// Register some initializers
registry.registerInitializer('service3', async () => {
  console.log('Creating Service 3...');
  // Simulate async initialization
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { name: 'Service 3' };
});

registry.registerInitializer('service4', async () => {
  console.log('Creating Service 4...');
  // This service depends on service3
  const service3 = await registry.getService('service3');
  return { name: 'Service 4', dependency: service3 };
});

// Register a service with circular dependency
registry.registerInitializer('serviceA', async () => {
  console.log('Creating Service A...');
  // Simulate async initialization
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Try to get serviceB if it exists, otherwise create without it
  let serviceB = null;
  if (registry.has('serviceB')) {
    serviceB = registry.get('serviceB');
  } else {
    console.log('ServiceB not available yet, will be linked later');
  }
  
  return { 
    name: 'Service A',
    dependency: serviceB,
    linkToB: function(b) {
      this.dependency = b;
      console.log('Service A linked to Service B');
    }
  };
});

registry.registerInitializer('serviceB', async () => {
  console.log('Creating Service B...');
  // This service depends on serviceA
  const serviceA = await registry.getService('serviceA');
  
  const serviceB = { 
    name: 'Service B',
    dependency: serviceA
  };
  
  // Link serviceA back to serviceB
  serviceA.linkToB(serviceB);
  
  return serviceB;
});

// List services and initializers
console.log('\nRegistered services:', registry.listServices());
console.log('Registered initializers:', registry.listInitializers());

// Test getting services
async function testGetServices() {
  try {
    console.log('\nGetting service1...');
    const service1 = registry.get('service1');
    console.log('Service1:', service1);
    
    console.log('\nGetting service3 (will be initialized)...');
    const service3 = await registry.getService('service3');
    console.log('Service3:', service3);
    
    console.log('\nGetting service4 (depends on service3)...');
    const service4 = await registry.getService('service4');
    console.log('Service4:', service4);
    
    console.log('\nTesting circular dependency resolution...');
    console.log('Getting serviceB (depends on serviceA)...');
    const serviceB = await registry.getService('serviceB');
    console.log('ServiceB:', serviceB);
    console.log('ServiceB.dependency:', serviceB.dependency);
    console.log('ServiceA.dependency:', serviceB.dependency.dependency);
    
    console.log('\nRegistered services after initialization:', registry.listServices());
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
testGetServices();
