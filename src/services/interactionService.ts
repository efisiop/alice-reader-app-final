// src/services/interactionService.ts
import { registry } from '@services/serviceRegistry';
import { initManager } from './initManager';
import { appLog } from '../components/LogViewer';
import { handleServiceError } from '../utils/errorHandling';
import { getSupabaseClient } from './supabaseClient';
import { ALICE_BOOK_ID } from '../data/fallbackBookData';

/**
 * Interaction Service Interface
 */
export interface InteractionServiceInterface {
  logPageView: (userId: string, bookId: string, pageNumber: number) => Promise<void>;
  logDictionaryLookup: (userId: string, bookId: string, sectionId: string | undefined, term: string, definitionFound: boolean) => Promise<void>;
  logAiInteraction: (userId: string, bookId: string, sectionId: string | undefined, query: string, response: string) => Promise<void>;
  logHighlight: (userId: string, bookId: string, sectionId: string | undefined, text: string) => Promise<void>;
  getUserInteractions: (userId: string, bookId?: string, limit?: number) => Promise<any[]>;
  getInteractionStats: (userId: string, bookId?: string) => Promise<any>;
}

/**
 * Create Interaction Service
 * 
 * Factory function to create the interaction service implementation
 */
const createInteractionService = async (): Promise<InteractionServiceInterface> => {
  appLog('InteractionService', 'Creating interaction service', 'info');
  
  // Create service implementation
  const interactionService: InteractionServiceInterface = {
    logPageView: async (userId: string, bookId: string, pageNumber: number) => {
      try {
        appLog('InteractionService', `Logging page view for user ${userId}, book ${bookId}, page ${pageNumber}`, 'info');
        
        const client = await getSupabaseClient();
        const { error } = await client
          .from('user_interactions')
          .insert({
            user_id: userId,
            book_id: bookId,
            interaction_type: 'page_view',
            page_number: pageNumber,
            created_at: new Date().toISOString()
          });
        
        if (error) throw error;
      } catch (error) {
        throw handleServiceError(error, 'interactionService', 'logPageView');
      }
    },
    
    logDictionaryLookup: async (userId: string, bookId: string, sectionId: string | undefined, term: string, definitionFound: boolean) => {
      try {
        appLog('InteractionService', `Logging dictionary lookup for user ${userId}, term ${term}`, 'info');
        
        const client = await getSupabaseClient();
        const { error } = await client
          .from('user_interactions')
          .insert({
            user_id: userId,
            book_id: bookId,
            section_id: sectionId,
            interaction_type: 'dictionary_lookup',
            content: term,
            metadata: { definitionFound },
            created_at: new Date().toISOString()
          });
        
        if (error) throw error;
      } catch (error) {
        throw handleServiceError(error, 'interactionService', 'logDictionaryLookup');
      }
    },
    
    logAiInteraction: async (userId: string, bookId: string, sectionId: string | undefined, query: string, response: string) => {
      try {
        appLog('InteractionService', `Logging AI interaction for user ${userId}`, 'info');
        
        const client = await getSupabaseClient();
        const { error } = await client
          .from('user_interactions')
          .insert({
            user_id: userId,
            book_id: bookId,
            section_id: sectionId,
            interaction_type: 'ai_interaction',
            content: query,
            metadata: { response },
            created_at: new Date().toISOString()
          });
        
        if (error) throw error;
      } catch (error) {
        throw handleServiceError(error, 'interactionService', 'logAiInteraction');
      }
    },
    
    logHighlight: async (userId: string, bookId: string, sectionId: string | undefined, text: string) => {
      try {
        appLog('InteractionService', `Logging highlight for user ${userId}`, 'info');
        
        const client = await getSupabaseClient();
        const { error } = await client
          .from('user_interactions')
          .insert({
            user_id: userId,
            book_id: bookId,
            section_id: sectionId,
            interaction_type: 'highlight',
            content: text,
            created_at: new Date().toISOString()
          });
        
        if (error) throw error;
      } catch (error) {
        throw handleServiceError(error, 'interactionService', 'logHighlight');
      }
    },
    
    getUserInteractions: async (userId: string, bookId: string = ALICE_BOOK_ID, limit: number = 100) => {
      try {
        appLog('InteractionService', `Getting interactions for user ${userId}, book ${bookId}`, 'info');
        
        const client = await getSupabaseClient();
        let query = client
          .from('user_interactions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit);
        
        if (bookId) {
          query = query.eq('book_id', bookId);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        return data || [];
      } catch (error) {
        throw handleServiceError(error, 'interactionService', 'getUserInteractions');
      }
    },
    
    getInteractionStats: async (userId: string, bookId: string = ALICE_BOOK_ID) => {
      try {
        appLog('InteractionService', `Getting interaction stats for user ${userId}, book ${bookId}`, 'info');
        
        const client = await getSupabaseClient();
        const { data, error } = await client
          .from('user_interactions')
          .select('interaction_type')
          .eq('user_id', userId)
          .eq('book_id', bookId);
        
        if (error) throw error;
        
        // Count interactions by type
        const stats = {
          total: 0,
          page_views: 0,
          dictionary_lookups: 0,
          ai_interactions: 0,
          highlights: 0
        };
        
        if (data) {
          stats.total = data.length;
          
          data.forEach((interaction: any) => {
            switch (interaction.interaction_type) {
              case 'page_view':
                stats.page_views++;
                break;
              case 'dictionary_lookup':
                stats.dictionary_lookups++;
                break;
              case 'ai_interaction':
                stats.ai_interactions++;
                break;
              case 'highlight':
                stats.highlights++;
                break;
            }
          });
        }
        
        return stats;
      } catch (error) {
        throw handleServiceError(error, 'interactionService', 'getInteractionStats');
      }
    }
  };
  
  return interactionService;
};

// Register initialization function
// The dependencies are automatically loaded from SERVICE_DEPENDENCIES
initManager.register('interactionService', async () => {
  const service = await createInteractionService();
  registry.register('interactionService', service);
});

// Create backward-compatible exports
export const logPageView = async (userId: string, bookId: string, pageNumber: number) => {
  const service = await registry.getOrInitialize<InteractionServiceInterface>('interactionService', initManager);
  return service.logPageView(userId, bookId, pageNumber);
};

export const logDictionaryLookup = async (userId: string, bookId: string, sectionId: string | undefined, term: string, definitionFound: boolean) => {
  const service = await registry.getOrInitialize<InteractionServiceInterface>('interactionService', initManager);
  return service.logDictionaryLookup(userId, bookId, sectionId, term, definitionFound);
};

export const logAiInteraction = async (userId: string, bookId: string, sectionId: string | undefined, query: string, response: string) => {
  const service = await registry.getOrInitialize<InteractionServiceInterface>('interactionService', initManager);
  return service.logAiInteraction(userId, bookId, sectionId, query, response);
};

export const logHighlight = async (userId: string, bookId: string, sectionId: string | undefined, text: string) => {
  const service = await registry.getOrInitialize<InteractionServiceInterface>('interactionService', initManager);
  return service.logHighlight(userId, bookId, sectionId, text);
};

export const getUserInteractions = async (userId: string, bookId?: string, limit?: number) => {
  const service = await registry.getOrInitialize<InteractionServiceInterface>('interactionService', initManager);
  return service.getUserInteractions(userId, bookId, limit);
};

export const getInteractionStats = async (userId: string, bookId?: string) => {
  const service = await registry.getOrInitialize<InteractionServiceInterface>('interactionService', initManager);
  return service.getInteractionStats(userId, bookId);
};

// Default export for backward compatibility
export default {
  logPageView,
  logDictionaryLookup,
  logAiInteraction,
  logHighlight,
  getUserInteractions,
  getInteractionStats
};
