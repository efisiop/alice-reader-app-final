// src/services/loggingService.ts
import { registry } from '@services/serviceRegistry';
import { initManager } from './initManager';
import { getSupabaseClient } from './supabaseClient';
import { appLog } from '../components/LogViewer';
import { handleServiceError } from '../utils/errorHandling';

// Event types for interaction logging
export enum InteractionEventType {
  LOGIN = 'LOGIN',
  PAGE_SYNC = 'PAGE_SYNC',
  SECTION_SYNC = 'SECTION_SYNC',
  DEFINITION_LOOKUP = 'DEFINITION_LOOKUP',
  AI_QUERY = 'AI_QUERY',
  HELP_REQUEST = 'HELP_REQUEST',
  FEEDBACK_SUBMISSION = 'FEEDBACK_SUBMISSION',
  QUIZ_ATTEMPT = 'QUIZ_ATTEMPT',
  NOTE_CREATION = 'NOTE_CREATION'
}

/**
 * Logging Service Interface
 */
export interface LoggingServiceInterface {
  logInteraction: (
    userId: string,
    eventType: InteractionEventType | string,
    contextData?: {
      bookId?: string;
      sectionId?: string;
      pageNumber?: number;
      content?: string;
      [key: string]: any;
    }
  ) => Promise<boolean>;
  
  getUserInteractions: (
    userId: string,
    options?: {
      eventType?: InteractionEventType | string;
      bookId?: string;
      limit?: number;
      offset?: number;
    }
  ) => Promise<any[]>;
  
  getInteractionStats: (
    userId: string,
    options?: {
      bookId?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ) => Promise<any>;
}

/**
 * Create Logging Service
 *
 * Factory function to create the logging service implementation
 */
export const createLoggingService = async (): Promise<LoggingServiceInterface> => {
  appLog('LoggingService', 'Creating logging service', 'info');

  // Create service implementation
  const loggingService: LoggingServiceInterface = {
    logInteraction: async (userId, eventType, contextData = {}) => {
      try {
        appLog('LoggingService', `Logging interaction: ${eventType}`, 'info', { userId, ...contextData });
        
        const { bookId, sectionId, pageNumber, content, ...otherContext } = contextData;
        
        // Extract content and context from contextData
        const context = Object.keys(otherContext).length > 0 ? otherContext : null;
        
        // Get the Supabase client
        const client = await getSupabaseClient();
        
        // Insert the interaction record
        const { error } = await client
          .from('interactions')
          .insert({
            user_id: userId,
            event_type: eventType,
            book_id: bookId || null,
            section_id: sectionId || null,
            page_number: pageNumber || null,
            content: content || null,
            context: context ? JSON.stringify(context) : null
          });
        
        if (error) {
          appLog('LoggingService', `Error logging interaction: ${error.message}`, 'error', error);
          return false;
        }
        
        return true;
      } catch (error) {
        // Log the error but don't throw - logging failures shouldn't crash core functionality
        appLog('LoggingService', 'Error logging interaction', 'error', error);
        return false;
      }
    },
    
    getUserInteractions: async (userId, options = {}) => {
      try {
        const { eventType, bookId, limit = 100, offset = 0 } = options;
        
        appLog('LoggingService', 'Getting user interactions', 'info', { userId, eventType, bookId, limit, offset });
        
        // Get the Supabase client
        const client = await getSupabaseClient();
        
        // Build the query
        let query = client
          .from('interactions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        
        // Add filters if provided
        if (eventType) {
          query = query.eq('event_type', eventType);
        }
        
        if (bookId) {
          query = query.eq('book_id', bookId);
        }
        
        // Execute the query
        const { data, error } = await query;
        
        if (error) {
          appLog('LoggingService', `Error getting user interactions: ${error.message}`, 'error', error);
          return [];
        }
        
        return data || [];
      } catch (error) {
        appLog('LoggingService', 'Error getting user interactions', 'error', error);
        return [];
      }
    },
    
    getInteractionStats: async (userId, options = {}) => {
      try {
        const { bookId, startDate, endDate } = options;
        
        appLog('LoggingService', 'Getting interaction stats', 'info', { userId, bookId, startDate, endDate });
        
        // Get the Supabase client
        const client = await getSupabaseClient();
        
        // Get all interactions for the user
        let query = client
          .from('interactions')
          .select('event_type')
          .eq('user_id', userId);
        
        // Add filters if provided
        if (bookId) {
          query = query.eq('book_id', bookId);
        }
        
        if (startDate) {
          query = query.gte('created_at', startDate.toISOString());
        }
        
        if (endDate) {
          query = query.lte('created_at', endDate.toISOString());
        }
        
        // Execute the query
        const { data, error } = await query;
        
        if (error) {
          appLog('LoggingService', `Error getting interaction stats: ${error.message}`, 'error', error);
          return { total: 0 };
        }
        
        // Count interactions by type
        const stats = {
          total: data?.length || 0,
          byType: {} as Record<string, number>
        };
        
        // Count by event type
        data?.forEach((interaction: any) => {
          const eventType = interaction.event_type;
          stats.byType[eventType] = (stats.byType[eventType] || 0) + 1;
        });
        
        return stats;
      } catch (error) {
        appLog('LoggingService', 'Error getting interaction stats', 'error', error);
        return { total: 0 };
      }
    }
  };

  return loggingService;
};

// Register initialization function
initManager.register('loggingService', async () => {
  const service = await createLoggingService();
  registry.register('loggingService', service);
});

// Create backward-compatible exports
export const logInteraction = async (
  userId: string,
  eventType: InteractionEventType | string,
  contextData?: {
    bookId?: string;
    sectionId?: string;
    pageNumber?: number;
    content?: string;
    [key: string]: any;
  }
) => {
  const service = await registry.getOrInitialize<LoggingServiceInterface>('loggingService', initManager);
  return service.logInteraction(userId, eventType, contextData);
};

export const getUserInteractions = async (
  userId: string,
  options?: {
    eventType?: InteractionEventType | string;
    bookId?: string;
    limit?: number;
    offset?: number;
  }
) => {
  const service = await registry.getOrInitialize<LoggingServiceInterface>('loggingService', initManager);
  return service.getUserInteractions(userId, options);
};

export const getInteractionStats = async (
  userId: string,
  options?: {
    bookId?: string;
    startDate?: Date;
    endDate?: Date;
  }
) => {
  const service = await registry.getOrInitialize<LoggingServiceInterface>('loggingService', initManager);
  return service.getInteractionStats(userId, options);
};

// Default export for backward compatibility
export default {
  logInteraction,
  getUserInteractions,
  getInteractionStats
};
