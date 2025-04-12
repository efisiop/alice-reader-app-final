// scripts/system-check.ts
import { initializeAllServices } from '../src/services/initServices';
import { registry } from '../src/services/registry';
import { SERVICE_DEPENDENCIES } from '../src/services/dependencies';
import { AppError } from '../src/utils/errorHandling';

/**
 * Perform a system check to verify that all services are properly initialized
 * and working correctly.
 */
async function performSystemCheck() {
  console.log('Starting system check...');
  
  try {
    // 1. Initialize services
    console.log('Initializing services...');
    await initializeAllServices();
    console.log('Services initialized successfully');
    
    // 2. Verify all expected services are registered
    const expectedServices = Object.keys(SERVICE_DEPENDENCIES);
    const registeredServices = registry.listServices();
    
    console.log('Checking registered services...');
    const missingServices = expectedServices.filter(
      service => !registeredServices.includes(service)
    );
    
    if (missingServices.length > 0) {
      console.error('Missing services:', missingServices);
      return false;
    }
    
    console.log('All expected services are registered');
    
    // 3. Verify basic functionality of critical services
    console.log('Testing critical services...');
    
    // Test book service if available
    if (registry.has('bookService')) {
      const bookService = registry.get('bookService');
      try {
        const bookDetails = await bookService.getBookDetails('alice-in-wonderland');
        console.log('Book service is working:', bookDetails ? 'Book details retrieved' : 'No book details found');
      } catch (error) {
        console.error('Book service test failed:', error);
        return false;
      }
    } else {
      console.warn('Book service not available for testing');
    }
    
    // Test sample service
    if (registry.has('sampleService')) {
      const sampleService = registry.get('sampleService');
      try {
        const sampleData = await sampleService.getSampleData('test-id');
        console.log('Sample service is working:', sampleData ? 'Sample data retrieved' : 'No sample data found');
      } catch (error) {
        console.error('Sample service test failed:', error);
        return false;
      }
    } else {
      console.warn('Sample service not available for testing');
    }
    
    console.log('System check completed successfully');
    return true;
  } catch (error) {
    if (error instanceof AppError) {
      console.error('System check failed with AppError:', {
        message: error.message,
        code: error.code,
        details: error.details
      });
    } else {
      console.error('System check failed with error:', error);
    }
    return false;
  }
}

// Run the system check
performSystemCheck()
  .then(success => {
    if (success) {
      console.log('✅ System is ready for launch');
      process.exit(0);
    } else {
      console.error('❌ System check failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('System check error:', error);
    process.exit(1);
  });
