// src/hooks/usePerformance.ts
import { useEffect, useRef } from 'react';
import { useAnalyticsService } from './useService';

interface PerformanceOptions {
  trackPageLoad?: boolean;
  trackRender?: boolean;
  componentName: string;
}

export function usePerformance(options: PerformanceOptions) {
  const { service: analyticsService } = useAnalyticsService();
  const startTimeRef = useRef<number>(performance.now());
  const renderTimeRef = useRef<number | null>(null);
  
  // Track component mount time
  useEffect(() => {
    const mountTime = performance.now() - startTimeRef.current;
    renderTimeRef.current = mountTime;
    
    if (options.trackRender && analyticsService) {
      analyticsService.trackPerformance('render_time', mountTime, {
        component: options.componentName
      });
    }
    
    // Track page load time
    if (options.trackPageLoad && analyticsService) {
      // Use Navigation Timing API for more accurate page load metrics
      if (window.performance && window.performance.timing) {
        const navTiming = window.performance.timing;
        const pageLoadTime = navTiming.loadEventEnd - navTiming.navigationStart;
        
        if (pageLoadTime > 0) {
          analyticsService.trackPerformance('page_load', pageLoadTime, {
            page: options.componentName
          });
        }
      }
    }
    
    return () => {
      // Track component lifetime on unmount
      const lifetime = performance.now() - startTimeRef.current;
      
      if (analyticsService) {
        analyticsService.trackPerformance('component_lifetime', lifetime, {
          component: options.componentName
        });
      }
    };
  }, [options.componentName, options.trackPageLoad, options.trackRender, analyticsService]);
  
  // Return timing information and tracking functions
  return {
    trackInteraction: (interactionName: string, startTime: number) => {
      const duration = performance.now() - startTime;
      
      if (analyticsService) {
        analyticsService.trackPerformance('interaction', duration, {
          component: options.componentName,
          interaction: interactionName
        });
      }
      
      return duration;
    },
    
    trackApiCall: (endpoint: string, startTime: number) => {
      const duration = performance.now() - startTime;
      
      if (analyticsService) {
        analyticsService.trackPerformance('api_call', duration, {
          component: options.componentName,
          endpoint
        });
      }
      
      return duration;
    },
    
    getRenderTime: () => renderTimeRef.current
  };
}
