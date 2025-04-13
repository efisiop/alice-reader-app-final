// src/services/sampleService.ts
import { registry } from '@services/serviceRegistry';
import { SERVICE_NAMES } from '../constants/app';
import { appLog } from '../components/LogViewer';
import { handleServiceError, AppError, ErrorCode } from '../utils/errorHandling';

/**
 * Sample Service Interface
 */
export interface SampleServiceInterface {
  getSampleData: (id: string) => Promise<any>;
  createSampleData: (data: any) => Promise<any>;
  updateSampleData: (id: string, data: any) => Promise<boolean>;
  deleteSampleData: (id: string) => Promise<boolean>;
}

/**
 * Create Sample Service
 *
 * Factory function to create the sample service implementation
 */
const createSampleService = async (): Promise<SampleServiceInterface> => {
  appLog('SampleService', 'Creating sample service', 'info');

  // Create service implementation
  const sampleService: SampleServiceInterface = {
    getSampleData: async (id: string) => {
      try {
        appLog('SampleService', `Getting sample data for ${id}`, 'info');

        // Mock implementation
        return {
          id,
          name: 'Sample Data',
          description: 'This is sample data from the sample service',
          createdAt: new Date().toISOString()
        };
      } catch (error) {
        throw handleServiceError(error, 'sampleService', 'getSampleData');
      }
    },

    createSampleData: async (data: any) => {
      try {
        appLog('SampleService', 'Creating sample data', 'info');

        // Mock implementation
        return {
          id: `sample_${Date.now()}`,
          ...data,
          createdAt: new Date().toISOString()
        };
      } catch (error) {
        throw handleServiceError(error, 'sampleService', 'createSampleData');
      }
    },

    updateSampleData: async (id: string, data: any) => {
      try {
        appLog('SampleService', `Updating sample data for ${id}`, 'info');

        // Mock implementation
        return true;
      } catch (error) {
        throw handleServiceError(error, 'sampleService', 'updateSampleData');
      }
    },

    deleteSampleData: async (id: string) => {
      try {
        appLog('SampleService', `Deleting sample data for ${id}`, 'info');

        // Mock implementation
        return true;
      } catch (error) {
        throw handleServiceError(error, 'sampleService', 'deleteSampleData');
      }
    }
  };

  return sampleService;
};

// Export the factory function
export { createSampleService };

// Create backward-compatible exports
export const getSampleData = async (id: string) => {
  const service = await registry.getService<SampleServiceInterface>(SERVICE_NAMES.SAMPLE_SERVICE);
  return service.getSampleData(id);
};

export const createSampleData = async (data: any) => {
  const service = await registry.getService<SampleServiceInterface>(SERVICE_NAMES.SAMPLE_SERVICE);
  return service.createSampleData(data);
};

export const updateSampleData = async (id: string, data: any) => {
  const service = await registry.getService<SampleServiceInterface>(SERVICE_NAMES.SAMPLE_SERVICE);
  return service.updateSampleData(id, data);
};

export const deleteSampleData = async (id: string) => {
  const service = await registry.getService<SampleServiceInterface>(SERVICE_NAMES.SAMPLE_SERVICE);
  return service.deleteSampleData(id);
};

// Default export for backward compatibility
export default {
  getSampleData,
  createSampleData,
  updateSampleData,
  deleteSampleData
};
