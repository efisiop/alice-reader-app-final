// src/hooks/useService.ts
import { useState, useEffect } from 'react';
import { registry, SERVICE_NAMES } from '../services/serviceRegistry';
import { initializeServices, isInitialized } from '../services/serviceInitializers';
import { AppError, ErrorCode } from '../utils/errorHandling';
import { appLog } from '../components/LogViewer';
// SERVICE_NAMES is now imported from serviceRegistry

/**
 * Hook result for useService
 */
export interface UseServiceResult<T> {
  service: T | null;
  loading: boolean;
  error: Error | null;
  initialized: boolean;
}

/**
 * Custom hook to access a service from the registry
 *
 * This hook will initialize services if needed and provide
 * the requested service with loading and error states.
 *
 * @param serviceName The name of the service to access
 * @returns Object with service, loading state, and error
 */
export function useService<T>(serviceName: string): UseServiceResult<T> {
  const [service, setService] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [initialized, setInitialized] = useState(isInitialized());

  useEffect(() => {
    let mounted = true;

    const getServiceAsync = async () => {
      try {
        // Ensure initializers are registered
        if (!isInitialized()) {
          appLog('useService', `Registering service initializers for ${serviceName}`, 'info');
          initializeServices();
          if (mounted) {
            setInitialized(true);
          }
        }

        // Get service from registry (this will initialize it if needed)
        if (mounted) {
          appLog('useService', `Getting service ${serviceName}`, 'info');
          const serviceInstance = await registry.getService<T>(serviceName);
          if (mounted) {
            setService(serviceInstance);
          }
        }
      } catch (err) {
        if (mounted) {
          const error = err instanceof Error ? err : new Error(String(err));
          appLog('useService', `Error getting service ${serviceName}: ${error.message}`, 'error');
          setError(error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getServiceAsync();

    return () => {
      mounted = false;
    };
  }, [serviceName]);

  return { service, loading, error, initialized };
}

// Create specific hooks for commonly used services
// Import interfaces directly from their source files to avoid circular dependencies
import { BookServiceInterface } from '../services/bookService';
import { AIServiceInterface } from '../services/aiService';
import { FeedbackServiceInterface } from '../services/feedbackService';
import { TriggerServiceInterface } from '../services/triggerService';
import { StatisticsServiceInterface } from '../services/statisticsService';
import { SampleServiceInterface } from '../services/sampleService';
import { ConsultantServiceInterface } from '../services/consultantService';
import { InteractionServiceInterface } from '../services/interactionService';
import { MonitoringServiceInterface } from '../services/monitoringService';
import { DatabaseServiceInterface } from '../services/databaseService';
import { DictionaryServiceInterface } from '../services/dictionaryService';
import { AnalyticsServiceInterface } from '../services/analyticsService';
import { AuthServiceInterface } from '../services/authService';

export function useBookService() {
  return useService<BookServiceInterface>(SERVICE_NAMES.BOOK_SERVICE);
}

export function useAIService() {
  return useService<AIServiceInterface>(SERVICE_NAMES.AI_SERVICE);
}

export function useFeedbackService() {
  return useService<FeedbackServiceInterface>(SERVICE_NAMES.FEEDBACK_SERVICE);
}

export function useTriggerService() {
  return useService<TriggerServiceInterface>(SERVICE_NAMES.TRIGGER_SERVICE);
}

export function useStatisticsService() {
  return useService<StatisticsServiceInterface>(SERVICE_NAMES.STATISTICS_SERVICE);
}

export function useSampleService() {
  return useService<SampleServiceInterface>(SERVICE_NAMES.SAMPLE_SERVICE);
}

export function useConsultantService() {
  return useService<ConsultantServiceInterface>(SERVICE_NAMES.CONSULTANT_SERVICE);
}

export function useInteractionService() {
  return useService<InteractionServiceInterface>(SERVICE_NAMES.INTERACTION_SERVICE);
}

export function useMonitoringService() {
  return useService<MonitoringServiceInterface>(SERVICE_NAMES.MONITORING_SERVICE);
}

export function useDatabaseService() {
  return useService<DatabaseServiceInterface>(SERVICE_NAMES.DATABASE_SERVICE);
}

export function useDictionaryService() {
  return useService<DictionaryServiceInterface>(SERVICE_NAMES.DICTIONARY_SERVICE);
}

export function useAuthService() {
  return useService<AuthServiceInterface>(SERVICE_NAMES.AUTH_SERVICE);
}

export function useAnalyticsService() {
  return useService<AnalyticsServiceInterface>(SERVICE_NAMES.ANALYTICS_SERVICE);
}
