// src/services/triggerService.ts
import { registry, SERVICE_NAMES } from '@services/serviceRegistry';
import { initManager } from './initManager';
import { getSupabaseClient } from './supabaseClient';
import { appLog } from '../components/LogViewer';

console.log('Loading triggerService module');

// Define service interface
export interface TriggerServiceInterface {
  getTriggers: (userId: string, bookId: string) => Promise<any[]>;
  createTrigger: (userId: string, bookId: string, sectionId: string, triggerType: string, content: string) => Promise<boolean>;
  markTriggerProcessed: (triggerId: string) => Promise<boolean>;
  subscribeToTriggers: (userId: string, bookId: string, callback: (trigger: any) => void) => Promise<() => void>;
}

// Define trigger types
export enum TriggerType {
  ENGAGEMENT = 'ENGAGEMENT',
  CHECK_IN = 'CHECK_IN',
  QUIZ = 'QUIZ',
  ENCOURAGE = 'ENCOURAGE'
}

// Create service factory
const createTriggerService = async (): Promise<TriggerServiceInterface> => {
  appLog('TriggerService', 'Creating trigger service', 'info');
  console.log('Creating trigger service');
  
  // Create service implementation
  const triggerService: TriggerServiceInterface = {
    getTriggers: async (userId: string, bookId: string) => {
      try {
        appLog("TriggerService", "Getting triggers", "info");
        const supabase = await getSupabaseClient();
        
        const { data, error } = await supabase
          .from("consultant_triggers")
          .select("*")
          .eq("user_id", userId)
          .eq("book_id", bookId)
          .eq("is_processed", false)
          .order("created_at", { ascending: false });
        
        if (error) {
          appLog("TriggerService", `Error getting triggers: ${error.message}`, "error");
          return [];
        }
        
        return data || [];
      } catch (error: any) {
        appLog("TriggerService", `Error getting triggers: ${error.message}`, "error");
        return [];
      }
    },
    
    createTrigger: async (userId: string, bookId: string, sectionId: string, triggerType: string, content: string) => {
      try {
        appLog("TriggerService", "Creating trigger", "info");
        const supabase = await getSupabaseClient();
        
        const { error } = await supabase
          .from("consultant_triggers")
          .insert({
            user_id: userId,
            book_id: bookId,
            section_id: sectionId,
            trigger_type: triggerType,
            content,
            is_processed: false,
            created_at: new Date().toISOString()
          });
        
        if (error) {
          appLog("TriggerService", `Error creating trigger: ${error.message}`, "error");
          return false;
        }
        
        appLog("TriggerService", "Trigger created successfully", "success");
        return true;
      } catch (error: any) {
        appLog("TriggerService", `Error creating trigger: ${error.message}`, "error");
        return false;
      }
    },
    
    markTriggerProcessed: async (triggerId: string) => {
      try {
        appLog("TriggerService", `Marking trigger ${triggerId} as processed`, "info");
        const supabase = await getSupabaseClient();
        
        const { error } = await supabase
          .from("consultant_triggers")
          .update({
            is_processed: true,
            processed_at: new Date().toISOString()
          })
          .eq("id", triggerId);
        
        if (error) {
          appLog("TriggerService", `Error marking trigger as processed: ${error.message}`, "error");
          return false;
        }
        
        appLog("TriggerService", "Trigger marked as processed successfully", "success");
        return true;
      } catch (error: any) {
        appLog("TriggerService", `Error marking trigger as processed: ${error.message}`, "error");
        return false;
      }
    },
    
    subscribeToTriggers: async (userId: string, bookId: string, callback: (trigger: any) => void) => {
      try {
        appLog("TriggerService", "Subscribing to triggers", "info");
        const supabase = await getSupabaseClient();
        
        // Subscribe to changes in the consultant_triggers table
        const subscription = supabase
          .channel('consultant_triggers_channel')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'consultant_triggers',
              filter: `user_id=eq.${userId} AND book_id=eq.${bookId} AND is_processed=eq.false`
            },
            (payload) => {
              appLog("TriggerService", "New trigger received", "info");
              callback(payload.new);
            }
          )
          .subscribe();
        
        // Return unsubscribe function
        return () => {
          appLog("TriggerService", "Unsubscribing from triggers", "info");
          supabase.removeChannel(subscription);
        };
      } catch (error: any) {
        appLog("TriggerService", `Error subscribing to triggers: ${error.message}`, "error");
        // Return a no-op unsubscribe function
        return () => {};
      }
    }
  };
  
  return triggerService;
};

// Register initialization function
console.log(`Registering initialization function for triggerService`);
initManager.register(SERVICE_NAMES.TRIGGER_SERVICE, async () => {
  console.log(`Creating trigger service for registration`);
  const service = await createTriggerService();
  console.log(`Registering trigger service in registry`);
  registry.register(SERVICE_NAMES.TRIGGER_SERVICE, service);
  console.log(`Trigger service registered successfully`);
}, []); // No dependencies for now

// Create backward-compatible exports
const createBackwardCompatibleMethod = <T extends any[], R>(
  methodName: string
): ((...args: T) => Promise<R>) => {
  return async (...args: T): Promise<R> => {
    // Ensure service is initialized
    if (!registry.has(SERVICE_NAMES.TRIGGER_SERVICE)) {
      await initManager.initializeService(SERVICE_NAMES.TRIGGER_SERVICE);
    }
    
    // Get service from registry
    const service = registry.get<TriggerServiceInterface>(SERVICE_NAMES.TRIGGER_SERVICE);
    
    // Call method
    return service[methodName](...args);
  };
};

// Export for backward compatibility
export const getTriggers = createBackwardCompatibleMethod<[string, string], any[]>('getTriggers');
export const createTrigger = createBackwardCompatibleMethod<[string, string, string, string, string], boolean>('createTrigger');
export const markTriggerProcessed = createBackwardCompatibleMethod<[string], boolean>('markTriggerProcessed');
export const subscribeToTriggers = createBackwardCompatibleMethod<[string, string, (trigger: any) => void], Promise<() => void>>('subscribeToTriggers');

// Default export for backward compatibility
export default {
  getTriggers,
  createTrigger,
  markTriggerProcessed,
  subscribeToTriggers
};

console.log('triggerService module loaded');
