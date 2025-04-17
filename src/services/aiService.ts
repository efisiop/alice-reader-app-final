// src/services/aiService.ts
import { registry } from '@services/serviceRegistry';
import { initManager } from './initManager';
import { getSupabaseClient } from './supabaseClient';
import { appLog } from '../components/LogViewer';
import { AIModes } from '../constants/index';
import { handleServiceError } from '../utils/errorHandling';
import { logInteraction, InteractionEventType } from './loggingService';

// Define service interface
export interface AIServiceInterface {
  createConversation: (userId: string, bookId: string, sectionId: string) => any;
  addMessageToConversation: (conversation: any, role: 'user' | 'assistant' | 'system', content: string) => any;
  sendMessageToAI: (conversation: any, message: string, context?: string, mode?: string) => Promise<any>;
  getWordDefinition: (word: string, context: string, userId: string, bookId: string, sectionId: string) => Promise<string>;
  getAIInteractionStats: (userId: string, bookId: string) => Promise<any>;
  logHelpOffer: (userId: string, bookId: string, sectionId: string, reason: string) => Promise<boolean>;
  checkIfUserNeedsHelp: (userId: string, bookId: string, sectionId: string) => Promise<{ needsHelp: boolean; reason: string }>;
  logAIInteraction: (userId: string, bookId: string, sectionId: string, query: string, response: string, interactionType: string) => Promise<boolean>;
}

/**
 * Create AI Service
 *
 * Factory function to create the AI service implementation
 */
const createAIService = async (): Promise<AIServiceInterface> => {
  appLog('AIService', 'Creating AI service', 'info');

  // Create service implementation
  const aiService: AIServiceInterface = {
    createConversation: (userId: string, bookId: string, sectionId: string) => {
      appLog("AIService", "Creating conversation", "info");
      const now = new Date().toISOString();
      const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      return {
        id: conversationId,
        userId: userId,
        bookId: bookId,
        sectionId: sectionId,
        messages: [],
        createdAt: now,
        updatedAt: now
      };
    },

    addMessageToConversation: (conversation: any, role: 'user' | 'assistant' | 'system', content: string) => {
      appLog("AIService", `Adding ${role} message to conversation`, "info");
      const now = new Date().toISOString();

      return {
        ...conversation,
        messages: [
          ...conversation.messages,
          {
            role,
            content,
            timestamp: now
          }
        ],
        updatedAt: now
      };
    },

    sendMessageToAI: async (conversation: any, message: string, context: string = "", mode: string = AIModes.CHAT) => {
      try {
        appLog("AIService", `Sending message to AI (${mode})`, "info", { userId: conversation.userId, bookId: conversation.bookId });

        // Add user message to conversation
        const updatedConversation = aiService.addMessageToConversation(conversation, "user", message);

        // Prepare conversation history for the AI
        const conversationHistory = updatedConversation.messages
          .filter((msg: any) => msg.role !== "system")
          .map((msg: any) => ({
            role: msg.role,
            content: msg.content
          }));

        // Call the ask-ai edge function
        const supabase = await getSupabaseClient();
        try {
          appLog("AIService", "Calling ask-ai Edge Function", "info", { mode });

          const { data, error } = await supabase.functions.invoke("ask-ai", {
            body: {
              messages: conversationHistory,
              context,
              bookId: conversation.bookId,
              sectionId: conversation.sectionId,
              userId: conversation.userId,
              mode
            }
          });

          if (error) {
            appLog("AIService", `Error calling ask-ai Edge Function: ${error.message}`, "error", error);
            const errorResponse = "I'm sorry, I encountered an error processing your request. Please try again later.";
            return {
              response: errorResponse,
              conversation: aiService.addMessageToConversation(updatedConversation, "assistant", errorResponse)
            };
          }

          const aiResponse = data?.response || "I'm sorry, I don't have a response for that.";
          appLog("AIService", "Received response from ask-ai Edge Function", "success", { responseLength: aiResponse.length });

          // Add AI response to conversation
          const finalConversation = aiService.addMessageToConversation(updatedConversation, "assistant", aiResponse);

          // Log the AI query to the interactions table
          // This is in addition to the logging in the Edge Function
          if (conversation.userId) {
            await logInteraction(
              conversation.userId,
              InteractionEventType.AI_QUERY,
              {
                bookId: conversation.bookId,
                sectionId: conversation.sectionId,
                content: message,
                context: context ? context.substring(0, 500) : undefined, // Limit context length
                response: aiResponse.substring(0, 500), // Limit response length
                mode
              }
            ).catch(err => {
              // Just log the error but don't fail the AI interaction
              appLog('AIService', 'Error logging AI query interaction', 'error', err);
            });
          }

          return {
            response: aiResponse,
            conversation: finalConversation
          };
        } catch (error: any) {
          // If the edge function fails, provide a helpful error message
          appLog("AIService", `Error calling ask-ai Edge Function: ${error.message}`, "error", error);

          // Check if it's a connection error
          const isConnectionError = error.message?.includes('Failed to fetch') ||
                                   error.message?.includes('Network error') ||
                                   error.message?.includes('ECONNREFUSED');

          const errorResponse = isConnectionError
            ? "I'm sorry, I'm having trouble connecting to my knowledge base. Please check your internet connection and try again."
            : "I'm sorry, I encountered an error processing your request. Please try again later.";

          return {
            response: errorResponse,
            conversation: aiService.addMessageToConversation(updatedConversation, "assistant", errorResponse)
          };
        }
      } catch (error: any) {
        appLog("AIService", `Error sending message to AI: ${error.message}`, "error", error);
        const errorResponse = "I'm sorry, I encountered an error processing your request. Please try again later.";
        return {
          response: errorResponse,
          conversation: aiService.addMessageToConversation(conversation, "assistant", errorResponse)
        };
      }
    },

    getWordDefinition: async (word: string, context: string, userId: string, bookId: string, sectionId: string) => {
      try {
        appLog("AIService", `Getting definition for "${word}"`, "info");

        // Create a temporary conversation
        const conversation = aiService.createConversation(userId, bookId, sectionId);

        // Send request to AI
        const { response } = await aiService.sendMessageToAI(
          conversation,
          `Define the word "${word}" in this context.`,
          context,
          AIModes.DEFINITION
        );

        return response;
      } catch (error: any) {
        appLog("AIService", `Error getting word definition: ${error.message}`, "error");
        return "I'm sorry, I couldn't find a definition for that word.";
      }
    },

    getAIInteractionStats: async (userId: string, bookId: string) => {
      try {
        appLog("AIService", "Getting AI interaction stats", "info");
        const supabase = await getSupabaseClient();

        // Get interaction count
        const { data: stats, error } = await supabase
          .from("ai_interactions")
          .select("interaction_type, count", { count: "exact" })
          .eq("user_id", userId)
          .eq("book_id", bookId)
          .group("interaction_type");

        if (error) {
          appLog("AIService", `Error getting AI stats: ${error.message}`, "error");
          return null;
        }

        // Get recent interactions
        const { data: interactions, error: interactionsError } = await supabase
          .from("ai_interactions")
          .select("*")
          .eq("user_id", userId)
          .eq("book_id", bookId)
          .order("created_at", { ascending: false })
          .limit(5);

        if (interactionsError) {
          appLog("AIService", `Error getting recent interactions: ${interactionsError.message}`, "error");
          return null;
        }

        return {
          stats: stats || [],
          recentInteractions: interactions || []
        };
      } catch (error: any) {
        appLog("AIService", `Error getting AI stats: ${error.message}`, "error");
        return null;
      }
    },

    logHelpOffer: async (userId: string, bookId: string, sectionId: string, reason: string) => {
      try {
        appLog("AIService", "Logging help offer", "info");
        const supabase = await getSupabaseClient();

        // Insert help offer record
        const { error } = await supabase
          .from("help_offers")
          .insert({
            user_id: userId,
            book_id: bookId,
            section_id: sectionId,
            reason,
            created_at: new Date().toISOString()
          });

        if (error) {
          appLog("AIService", `Error logging help offer: ${error.message}`, "error");
          return false;
        }

        // Log to the interactions table
        await logInteraction(
          userId,
          InteractionEventType.HELP_REQUEST,
          {
            bookId,
            sectionId,
            content: reason
          }
        ).catch(err => {
          // Just log the error but don't fail the help offer
          appLog('AIService', 'Error logging help request interaction', 'error', err);
        });

        return true;
      } catch (error: any) {
        appLog("AIService", `Error logging help offer: ${error.message}`, "error");
        return false;
      }
    },

    checkIfUserNeedsHelp: async (userId: string, bookId: string, sectionId: string) => {
      try {
        appLog("AIService", "Checking if user needs help", "info");
        const supabase = await getSupabaseClient();

        // Get AI interactions for this section
        const { data: interactions, error: interactionsError } = await supabase
          .from("ai_interactions")
          .select("*")
          .eq("user_id", userId)
          .eq("book_id", bookId)
          .eq("section_id", sectionId)
          .order("created_at", { ascending: false })
          .limit(5);

        if (interactionsError) {
          appLog("AIService", `Error getting AI interactions: ${interactionsError.message}`, "error");
          return { needsHelp: false, reason: "" };
        }

        // Check for patterns that indicate the user needs help

        // Pattern 1: Multiple similar queries in a short time
        if (interactions && interactions.length >= 3) {
          const recentInteractions = interactions.slice(0, 3);
          const similarQueries = recentInteractions.filter(interaction => {
            // Check if queries are similar (simple check for now)
            return recentInteractions.some(other =>
              other.id !== interaction.id &&
              other.query.toLowerCase().includes(interaction.query.toLowerCase().substring(0, 5))
            );
          });

          if (similarQueries.length >= 2) {
            return {
              needsHelp: true,
              reason: "You seem to be asking similar questions. Would you like to speak with a consultant for more help?"
            };
          }
        }

        // Pattern 2: Questions about complex topics
        const complexTopics = ["symbolism", "theme", "meaning", "interpret", "analysis"];
        const hasComplexQuestions = interactions?.some(interaction =>
          complexTopics.some(topic => interaction.query.toLowerCase().includes(topic))
        );

        if (hasComplexQuestions) {
          return {
            needsHelp: true,
            reason: "You're asking about complex literary topics. Would you like to speak with a literature consultant?"
          };
        }

        // No help needed
        return { needsHelp: false, reason: "" };
      } catch (error: any) {
        appLog("AIService", `Error checking if user needs help: ${error.message}`, "error");
        return { needsHelp: false, reason: "" };
      }
    },

    logAIInteraction: async (
      userId: string,
      bookId: string,
      sectionId: string,
      query: string,
      response: string,
      interactionType: string
    ): Promise<boolean> => {
      try {
        appLog("AIService", "Logging AI interaction", "info");
        const supabase = await getSupabaseClient();

        // Insert interaction record
        const { error } = await supabase
          .from("ai_interactions")
          .insert({
            user_id: userId,
            book_id: bookId,
            section_id: sectionId,
            query,
            response,
            interaction_type: interactionType,
            created_at: new Date().toISOString()
          });

        if (error) {
          appLog("AIService", `Error logging AI interaction: ${error.message}`, "error");
          return false;
        }

        return true;
      } catch (error: any) {
        appLog("AIService", `Error logging AI interaction: ${error.message}`, "error");
        return false;
      }
    }
};

  return aiService;
};

// Register initialization function
// The dependencies are automatically loaded from SERVICE_DEPENDENCIES
initManager.register('aiService', async () => {
  const service = await createAIService();
  registry.register('aiService', service);
});

// Create backward-compatible exports
export async function createConversation(userId: string, bookId: string, sectionId: string) {
  const service = await registry.getOrInitialize<AIServiceInterface>('aiService', initManager);
  return service.createConversation(userId, bookId, sectionId);
};

export async function addMessageToConversation(conversation: any, role: 'user' | 'assistant' | 'system', content: string) {
  const service = await registry.getOrInitialize<AIServiceInterface>('aiService', initManager);
  return service.addMessageToConversation(conversation, role, content);
};

export async function sendMessageToAI(conversation: any, message: string, context?: string, mode?: string) {
  const service = await registry.getOrInitialize<AIServiceInterface>('aiService', initManager);
  return service.sendMessageToAI(conversation, message, context, mode);
};

export async function getWordDefinition(word: string, context: string, userId: string, bookId: string, sectionId: string) {
  const service = await registry.getOrInitialize<AIServiceInterface>('aiService', initManager);
  return service.getWordDefinition(word, context, userId, bookId, sectionId);
};

export async function getAIInteractionStats(userId: string, bookId: string) {
  const service = await registry.getOrInitialize<AIServiceInterface>('aiService', initManager);
  return service.getAIInteractionStats(userId, bookId);
};

export async function logHelpOffer(userId: string, bookId: string, sectionId: string, reason: string) {
  const service = await registry.getOrInitialize<AIServiceInterface>('aiService', initManager);
  return service.logHelpOffer(userId, bookId, sectionId, reason);
};

export async function checkIfUserNeedsHelp(userId: string, bookId: string, sectionId: string) {
  const service = await registry.getOrInitialize<AIServiceInterface>('aiService', initManager);
  return service.checkIfUserNeedsHelp(userId, bookId, sectionId);
};

export async function logAIInteraction(userId: string, bookId: string, sectionId: string, query: string, response: string, interactionType: string) {
  const service = await registry.getOrInitialize<AIServiceInterface>('aiService', initManager);
  return service.logAIInteraction(userId, bookId, sectionId, query, response, interactionType);
};

// Default export for backward compatibility
export default {
  createConversation,
  addMessageToConversation,
  sendMessageToAI,
  getWordDefinition,
  getAIInteractionStats,
  logHelpOffer,
  checkIfUserNeedsHelp,
  logAIInteraction
};
