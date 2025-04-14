// src/services/analyticsService.ts
import { registry } from '@services/serviceRegistry';
import { initManager } from './initManager';
import { appLog } from '../components/LogViewer';
import { handleServiceError } from '../utils/errorHandling';

export interface AnalyticsServiceInterface {
  // User tracking
  identifyUser: (userId: string, traits?: Record<string, any>) => void;
  resetUser: () => void;

  // Event tracking
  trackEvent: (
    eventName: string,
    properties?: Record<string, any>
  ) => void;

  // Screen/page tracking
  trackPageView: (
    pageName: string,
    properties?: Record<string, any>
  ) => void;

  // Reading behavior tracking
  trackReaderAction: (
    action: 'highlight' | 'definition' | 'ai_query' | 'help_request',
    details: {
      bookId: string;
      pageNumber: number;
      section?: string;
      content?: string;
      duration?: number;
    }
  ) => void;

  // Performance tracking
  trackPerformance: (
    metric: 'page_load' | 'render_time' | 'api_call' | 'interaction',
    value: number,
    details?: Record<string, any>
  ) => void;
}

/**
 * Create Analytics Service
 *
 * Factory function to create the analytics service implementation
 */
export const createAnalyticsService = async (): Promise<AnalyticsServiceInterface> => {
  appLog('AnalyticsService', 'Creating analytics service', 'info');

  // Create service implementation
  const analyticsService: AnalyticsServiceInterface = {
    identifyUser: (userId, traits = {}) => {
      try {
        if (import.meta.env.DEV) {
          console.log(`[Analytics] Identify user: ${userId}`, traits);
        }

        appLog('AnalyticsService', `Identify user: ${userId}`, 'info', traits);

        // In production: connect to actual analytics service
        // Example: amplitude.getInstance().identify(userId, traits);
      } catch (error) {
        appLog('AnalyticsService', 'Error identifying user', 'error', error);
      }
    },

    resetUser: () => {
      try {
        if (import.meta.env.DEV) {
          console.log('[Analytics] Reset user');
        }

        appLog('AnalyticsService', 'Reset user', 'info');

        // In production: reset user in analytics service
        // Example: amplitude.getInstance().setUserId(null);
      } catch (error) {
        appLog('AnalyticsService', 'Error resetting user', 'error', error);
      }
    },

    trackEvent: (eventName, properties = {}) => {
      try {
        if (import.meta.env.DEV) {
          console.log(`[Analytics] Track event: ${eventName}`, properties);
        }

        appLog('AnalyticsService', `Track event: ${eventName}`, 'info', properties);

        // In production: send to actual analytics service
        // Example: amplitude.getInstance().logEvent(eventName, properties);
      } catch (error) {
        appLog('AnalyticsService', 'Error tracking event', 'error', error);
      }
    },

    trackPageView: (pageName, properties = {}) => {
      try {
        if (import.meta.env.DEV) {
          console.log(`[Analytics] Page view: ${pageName}`, properties);
        }

        appLog('AnalyticsService', `Page view: ${pageName}`, 'info', properties);

        // In production: track page view
        // Example: amplitude.getInstance().logEvent('page_view', { page: pageName, ...properties });
      } catch (error) {
        appLog('AnalyticsService', 'Error tracking page view', 'error', error);
      }
    },

    trackReaderAction: (action, details) => {
      try {
        if (import.meta.env.DEV) {
          console.log(`[Analytics] Reader action: ${action}`, details);
        }

        appLog('AnalyticsService', `Reader action: ${action}`, 'info', details);

        // In production: track reader action
        // Example: amplitude.getInstance().logEvent('reader_action', { action, ...details });
      } catch (error) {
        appLog('AnalyticsService', 'Error tracking reader action', 'error', error);
      }
    },

    trackPerformance: (metric, value, details = {}) => {
      try {
        if (import.meta.env.DEV) {
          console.log(`[Analytics] Performance ${metric}: ${value}ms`, details);
        }

        appLog('AnalyticsService', `Performance ${metric}: ${value}ms`, 'info', details);

        // In production: track performance
        // Example: amplitude.getInstance().logEvent('performance', { metric, value, ...details });
      } catch (error) {
        appLog('AnalyticsService', 'Error tracking performance', 'error', error);
      }
    }
  };

  return analyticsService;
};

// Register with initialization manager
initManager.register('analyticsService', async () => {
  const service = await createAnalyticsService();
  registry.register('analyticsService', service);
});

// Export for backward compatibility
export const identifyUser = (userId: string, traits?: Record<string, any>) => {
  const service = registry.get<AnalyticsServiceInterface>('analyticsService');
  if (service) {
    service.identifyUser(userId, traits);
  }
};

export const resetUser = () => {
  const service = registry.get<AnalyticsServiceInterface>('analyticsService');
  if (service) {
    service.resetUser();
  }
};

export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  const service = registry.get<AnalyticsServiceInterface>('analyticsService');
  if (service) {
    service.trackEvent(eventName, properties);
  }
};

export const trackPageView = (pageName: string, properties?: Record<string, any>) => {
  const service = registry.get<AnalyticsServiceInterface>('analyticsService');
  if (service) {
    service.trackPageView(pageName, properties);
  }
};

export const trackReaderAction = (
  action: 'highlight' | 'definition' | 'ai_query' | 'help_request',
  details: {
    bookId: string;
    pageNumber: number;
    section?: string;
    content?: string;
    duration?: number;
  }
) => {
  const service = registry.get<AnalyticsServiceInterface>('analyticsService');
  if (service) {
    service.trackReaderAction(action, details);
  }
};

export const trackPerformance = (
  metric: 'page_load' | 'render_time' | 'api_call' | 'interaction',
  value: number,
  details?: Record<string, any>
) => {
  const service = registry.get<AnalyticsServiceInterface>('analyticsService');
  if (service) {
    service.trackPerformance(metric, value, details);
  }
};

export default {
  identifyUser,
  resetUser,
  trackEvent,
  trackPageView,
  trackReaderAction,
  trackPerformance
};
