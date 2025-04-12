// scripts/test-registry.js
// Simple test script for the Service Registry

console.log('Testing Service Registry implementation...');

// Create a simple registry
class ServiceRegistry {
  constructor() {
    this.services = {};
    this.initializers = new Map();
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
    return this.services[name];
  }

  async getService(name) {
    if (this.services[name]) {
      return this.services[name];
    }

    if (this.initializers.has(name)) {
      console.log(`Initializing service "${name}"...`);
      const initializer = this.initializers.get(name);
      const service = await initializer();
      this.register(name, service);
      return service;
    }

    throw new Error(`Service "${name}" not found`);
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
  return { name: 'Service 3' };
});

registry.registerInitializer('service4', async () => {
  console.log('Creating Service 4...');
  // This service depends on service3
  const service3 = await registry.getService('service3');
  return { name: 'Service 4', dependency: service3 };
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

    console.log('\nRegistered services after initialization:', registry.listServices());
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
testGetServices();