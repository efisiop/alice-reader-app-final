// src/services/monitoringService.ts
import { registry } from '@services/serviceRegistry';
import { initManager } from './initManager';
import { appLog } from '../components/LogViewer';
import { handleServiceError } from '../utils/errorHandling';

/**
 * Monitoring Service Interface
 */
export interface MonitoringServiceInterface {
  logEvent: (category: string, action: string, label?: string, value?: number) => void;
  logError: (error: Error, context?: Record<string, any>) => void;
  startPerformanceTimer: (operationName: string) => void;
  endPerformanceTimer: (operationName: string) => void;
  getPerformanceMetrics: () => Record<string, any>;
  clearPerformanceMetrics: () => void;
}

/**
 * Create Monitoring Service
 * 
 * Factory function to create the monitoring service implementation
 */
const createMonitoringService = async (): Promise<MonitoringServiceInterface> => {
  appLog('MonitoringService', 'Creating monitoring service', 'info');
  
  // Store performance timers
  const performanceTimers: Record<string, { start: number; end?: number; duration?: number }> = {};
  
  // Create service implementation
  const monitoringService: MonitoringServiceInterface = {
    logEvent: (category: string, action: string, label?: string, value?: number) => {
      try {
        if (import.meta.env.VITE_APP_ENV !== 'production') {
          console.log(`[EVENT] ${category} - ${action}${label ? ` - ${label}` : ''}${value !== undefined ? ` - ${value}` : ''}`);
        }
        
        appLog('MonitoringService', `Event: ${category} - ${action}${label ? ` - ${label}` : ''}`, 'info', { value });
        
        // In a real implementation, send to analytics service
        // Example: Google Analytics, Mixpanel, etc.
      } catch (error) {
        appLog('MonitoringService', 'Error logging event', 'error', error);
      }
    },
    
    logError: (error: Error, context: Record<string, any> = {}) => {
      try {
        console.error(`[ERROR] ${error.message}`, { error, context });
        
        appLog('MonitoringService', `Error: ${error.message}`, 'error', {
          ...context,
          stack: error.stack
        });
        
        // In a real implementation, send to error tracking service
        // Example: Sentry, Bugsnag, etc.
      } catch (err) {
        // Fallback to console if even our error logging fails
        console.error('Failed to log error:', err);
        console.error('Original error:', error);
      }
    },
    
    startPerformanceTimer: (operationName: string) => {
      try {
        performanceTimers[operationName] = {
          start: performance.now()
        };
        
        if (import.meta.env.VITE_APP_ENV !== 'production') {
          console.time(`[PERF] ${operationName}`);
        }
      } catch (error) {
        appLog('MonitoringService', `Error starting performance timer for ${operationName}`, 'error', error);
      }
    },
    
    endPerformanceTimer: (operationName: string) => {
      try {
        if (!performanceTimers[operationName]) {
          appLog('MonitoringService', `No timer found for ${operationName}`, 'warning');
          return;
        }
        
        const end = performance.now();
        const start = performanceTimers[operationName].start;
        const duration = end - start;
        
        performanceTimers[operationName] = {
          start,
          end,
          duration
        };
        
        if (import.meta.env.VITE_APP_ENV !== 'production') {
          console.timeEnd(`[PERF] ${operationName}`);
          console.log(`[PERF] ${operationName}: ${duration.toFixed(2)}ms`);
        }
        
        appLog('MonitoringService', `Performance: ${operationName} - ${duration.toFixed(2)}ms`, 'info');
        
        // In a real implementation, send to performance monitoring service
        // Example: New Relic, Datadog, etc.
      } catch (error) {
        appLog('MonitoringService', `Error ending performance timer for ${operationName}`, 'error', error);
      }
    },
    
    getPerformanceMetrics: () => {
      try {
        return { ...performanceTimers };
      } catch (error) {
        appLog('MonitoringService', 'Error getting performance metrics', 'error', error);
        return {};
      }
    },
    
    clearPerformanceMetrics: () => {
      try {
        Object.keys(performanceTimers).forEach(key => {
          delete performanceTimers[key];
        });
        
        appLog('MonitoringService', 'Performance metrics cleared', 'info');
      } catch (error) {
        appLog('MonitoringService', 'Error clearing performance metrics', 'error', error);
      }
    }
  };
  
  return monitoringService;
};

// Register initialization function
// The dependencies are automatically loaded from SERVICE_DEPENDENCIES
initManager.register('monitoringService', async () => {
  const service = await createMonitoringService();
  registry.register('monitoringService', service);
});

// Create backward-compatible exports
export const logEvent = (category: string, action: string, label?: string, value?: number) => {
  const service = registry.get<MonitoringServiceInterface>('monitoringService');
  return service.logEvent(category, action, label, value);
};

export const logError = (error: Error, context: Record<string, any> = {}) => {
  const service = registry.get<MonitoringServiceInterface>('monitoringService');
  return service.logError(error, context);
};

export const startPerformanceTimer = (operationName: string) => {
  const service = registry.get<MonitoringServiceInterface>('monitoringService');
  return service.startPerformanceTimer(operationName);
};

export const endPerformanceTimer = (operationName: string) => {
  const service = registry.get<MonitoringServiceInterface>('monitoringService');
  return service.endPerformanceTimer(operationName);
};

export const getPerformanceMetrics = () => {
  const service = registry.get<MonitoringServiceInterface>('monitoringService');
  return service.getPerformanceMetrics();
};

export const clearPerformanceMetrics = () => {
  const service = registry.get<MonitoringServiceInterface>('monitoringService');
  return service.clearPerformanceMetrics();
};

// Default export for backward compatibility
export default {
  logEvent,
  logError,
  startPerformanceTimer,
  endPerformanceTimer,
  getPerformanceMetrics,
  clearPerformanceMetrics
};
