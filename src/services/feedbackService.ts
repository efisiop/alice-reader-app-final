// src/services/feedbackService.ts
import { registry, SERVICE_NAMES } from '@services/serviceRegistry';
import { initManager } from './initManager';
import { getSupabaseClient } from './supabaseClient';
import { appLog } from '../components/LogViewer';
import { logInteraction, InteractionEventType } from './loggingService';

console.log('Loading feedbackService module');

// Define service interface
export interface FeedbackServiceInterface {
  getUserFeedback: (userId: string, bookId: string) => Promise<any[]>;
  submitFeedback: (userId: string, bookId: string, feedbackType: string, content: string, sectionId?: string, isPublic?: boolean) => Promise<{ data?: any; error?: any }>;
  updateFeedbackVisibility: (feedbackId: string, isPublic: boolean, isFeatured: boolean) => Promise<boolean>;
  logFeedbackInteraction: (userId: string, bookId: string, interactionType: string, metadata?: any) => Promise<boolean>;
}

// Define feedback types
export enum FeedbackType {
  AHA_MOMENT = 'AHA_MOMENT',
  POSITIVE_EXPERIENCE = 'POSITIVE_EXPERIENCE',
  SUGGESTION = 'SUGGESTION',
  CONFUSION = 'CONFUSION',
  GENERAL = 'GENERAL'
}

// Create service factory
const createFeedbackService = async (): Promise<FeedbackServiceInterface> => {
  appLog('FeedbackService', 'Creating feedback service', 'info');
  console.log('Creating feedback service');

  // Create service implementation
  const feedbackService: FeedbackServiceInterface = {
    getUserFeedback: async (userId: string, bookId: string) => {
      try {
        appLog("FeedbackService", "Getting user feedback", "info");
        const supabase = await getSupabaseClient();

        const { data, error } = await supabase
          .from("user_feedback")
          .select("*")
          .eq("user_id", userId)
          .eq("book_id", bookId)
          .order("created_at", { ascending: false });

        if (error) {
          appLog("FeedbackService", `Error getting user feedback: ${error.message}`, "error");
          return [];
        }

        return data || [];
      } catch (error: any) {
        appLog("FeedbackService", `Error getting user feedback: ${error.message}`, "error");
        return [];
      }
    },

    submitFeedback: async (userId: string, bookId: string, feedbackType: string, content: string, sectionId?: string, isPublic: boolean = false) => {
      try {
        appLog("FeedbackService", "Submitting feedback", "info", {
          feedbackType,
          hasSection: !!sectionId,
          isPublic
        });

        const supabase = await getSupabaseClient();

        // Create the feedback record
        const { data, error } = await supabase
          .from("user_feedback")
          .insert({
            user_id: userId,
            book_id: bookId,
            section_id: sectionId || null,
            feedback_type: feedbackType,
            content,
            is_public: isPublic,
            is_featured: false,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          appLog("FeedbackService", `Error submitting feedback: ${error.message}`, "error", error);
          return { error };
        }

        // Log the interaction for analytics (legacy method)
        try {
          await supabase
            .from("ai_interactions")
            .insert({
              user_id: userId,
              book_id: bookId,
              section_id: sectionId || null,
              question: `Feedback: ${feedbackType}`,
              response: "Feedback submitted successfully",
              interaction_type: "FEEDBACK",
              created_at: new Date().toISOString()
            });
        } catch (interactionError) {
          // Don't fail the whole operation if just the logging fails
          appLog("FeedbackService", "Warning: Failed to log feedback interaction", "warning", interactionError);
        }

        // Log to the interactions table
        try {
          await logInteraction(
            userId,
            InteractionEventType.FEEDBACK_SUBMISSION,
            {
              bookId,
              sectionId: sectionId || undefined,
              content,
              feedbackType,
              isPublic
            }
          );
        } catch (loggingError) {
          // Don't fail the whole operation if just the logging fails
          appLog("FeedbackService", "Warning: Failed to log feedback to interactions table", "warning", loggingError);
        }

        appLog("FeedbackService", "Feedback submitted successfully", "success", { id: data?.id });
        return { data };
      } catch (error: any) {
        appLog("FeedbackService", `Error submitting feedback: ${error.message}`, "error", error);
        return { error };
      }
    },

    updateFeedbackVisibility: async (feedbackId: string, isPublic: boolean, isFeatured: boolean) => {
      try {
        appLog("FeedbackService", "Updating feedback visibility", "info");
        const supabase = await getSupabaseClient();

        const { error } = await supabase
          .from("user_feedback")
          .update({
            is_public: isPublic,
            is_featured: isFeatured
          })
          .eq("id", feedbackId);

        if (error) {
          appLog("FeedbackService", `Error updating feedback visibility: ${error.message}`, "error");
          return false;
        }

        appLog("FeedbackService", "Feedback visibility updated successfully", "success");
        return true;
      } catch (error: any) {
        appLog("FeedbackService", `Error updating feedback visibility: ${error.message}`, "error");
        return false;
      }
    },

    logFeedbackInteraction: async (userId: string, bookId: string, interactionType: string, metadata?: any) => {
      try {
        appLog("FeedbackService", `Logging feedback interaction: ${interactionType}`, "info");
        const supabase = await getSupabaseClient();

        const { error } = await supabase
          .from("ai_interactions")
          .insert({
            user_id: userId,
            book_id: bookId,
            question: `Feedback interaction: ${interactionType}`,
            response: "Interaction logged",
            interaction_type: "FEEDBACK",
            metadata: metadata || {},
            created_at: new Date().toISOString()
          });

        if (error) {
          appLog("FeedbackService", `Error logging feedback interaction: ${error.message}`, "error", error);
          return false;
        }

        return true;
      } catch (error: any) {
        appLog("FeedbackService", `Error logging feedback interaction: ${error.message}`, "error", error);
        return false;
      }
    }
  };

  return feedbackService;
};

// Register initialization function
console.log(`Registering initialization function for feedbackService`);
initManager.register('feedbackService', async () => {
  console.log(`Creating feedback service for registration`);
  const service = await createFeedbackService();
  console.log(`Registering feedback service in registry`);
  registry.register('feedbackService', service);
  console.log(`Feedback service registered successfully`);
}, []); // No dependencies for now

// Create backward-compatible exports
const createBackwardCompatibleMethod = <T extends any[], R>(
  methodName: string
): ((...args: T) => Promise<R>) => {
  return async (...args: T): Promise<R> => {
    // Ensure service is initialized
    if (!registry.has('feedbackService')) {
      await initManager.initializeService('feedbackService');
    }

    // Get service from registry
    const service = registry.get<FeedbackServiceInterface>('feedbackService');

    // Call method
    return service[methodName](...args);
  };
};

// Export for backward compatibility
export const getUserFeedback = createBackwardCompatibleMethod<[string, string], any[]>('getUserFeedback');
export const submitFeedback = createBackwardCompatibleMethod<[string, string, string, string, string?, boolean?], { data?: any; error?: any }>('submitFeedback');
export const updateFeedbackVisibility = createBackwardCompatibleMethod<[string, boolean, boolean], boolean>('updateFeedbackVisibility');
export const logFeedbackInteraction = createBackwardCompatibleMethod<[string, string, string, any?], boolean>('logFeedbackInteraction');

// Default export for backward compatibility
export default {
  getUserFeedback,
  submitFeedback,
  updateFeedbackVisibility,
  logFeedbackInteraction
};

console.log('feedbackService module loaded');
