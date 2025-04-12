// src/services/mockBackendFactory.ts
import { 
  BookServiceInterface, 
  AIServiceInterface,
  FeedbackServiceInterface,
  TriggerServiceInterface,
  StatisticsServiceInterface
} from "./serviceTypes";
import { ALICE_BOOK_ID } from "../constants";
import { appLog } from "../components/LogViewer";

// Create mock book service
export const createMockBookService = (): BookServiceInterface => {
  return {
    getBookDetails: async (bookId: string) => {
      appLog("MockBookService", `Getting book details for ${bookId}`, "info");
      return {
        id: ALICE_BOOK_ID,
        title: "Alice in Wonderland",
        author: "Lewis Carroll",
        description: "The classic tale of a girl who falls through a rabbit hole into a fantasy world.",
        chapters: []
      };
    },
    getSectionDetails: async (sectionId: string) => {
      return null;
    },
    getBookContent: async (bookId: string) => {
      return null;
    },
    getSectionByPage: async (bookId: string, pageNumber: number) => {
      return null;
    },
    saveReadingProgress: async (userId: string, bookId: string, sectionId: string, position: string) => {
      return true;
    },
    getReadingProgress: async (userId: string, bookId: string) => {
      return null;
    },
    getReadingStats: async (userId: string, bookId: string) => {
      return null;
    },
    updateReadingStats: async (userId: string, bookId: string, currentPosition: string) => {
      return true;
    }
  };
};

// Create mock AI service
export const createMockAIService = (): AIServiceInterface => {
  return {
    createConversation: (userId: string, bookId: string, sectionId: string) => {
      return {
        id: "mock-conversation",
        userId,
        bookId,
        sectionId,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    },
    addMessageToConversation: (conversation, role, content) => {
      return conversation;
    },
    sendMessageToAI: async (conversation, message, context, mode) => {
      return {
        response: "Mock AI response",
        conversation
      };
    },
    getWordDefinition: async (word, context, userId, bookId, sectionId) => {
      return `Mock definition for "${word}"`;
    },
    getAIInteractionStats: async (userId, bookId) => {
      return { stats: [], recentInteractions: [] };
    },
    logHelpOffer: async (userId, bookId, sectionId, reason) => {
      return true;
    },
    checkIfUserNeedsHelp: async (userId, bookId, sectionId) => {
      return { needsHelp: false, reason: "" };
    }
  };
};

// Create mock feedback service
export const createMockFeedbackService = (): FeedbackServiceInterface => {
  return {
    getUserFeedback: async (userId, bookId) => {
      return [];
    },
    submitFeedback: async (userId, bookId, sectionId, feedbackType, content) => {
      return true;
    },
    updateFeedbackVisibility: async (feedbackId, isPublic, isFeatured) => {
      return true;
    }
  };
};

// Create mock trigger service
export const createMockTriggerService = (): TriggerServiceInterface => {
  return {
    getUnprocessedTriggers: async (userId) => {
      return [];
    },
    createTrigger: async (consultantId, userId, bookId, triggerType, message) => {
      return true;
    },
    markTriggerAsProcessed: async (triggerId) => {
      return true;
    },
    saveUserResponse: async (userId, triggerId, response) => {
      return true;
    }
  };
};

// Create mock statistics service
export const createMockStatisticsService = (): StatisticsServiceInterface => {
  return {
    getDetailedReadingStats: async (userId, bookId) => {
      return null;
    },
    updateReadingTime: async (userId, bookId, timeInSeconds) => {
      return true;
    },
    getReaderLeaderboard: async (bookId, limit) => {
      return [];
    }
  };
};

// Export a function to create a complete mock backend
export const createMockBackend = () => {
  return {
    bookService: createMockBookService(),
    aiService: createMockAIService(),
    feedbackService: createMockFeedbackService(),
    triggerService: createMockTriggerService(),
    statisticsService: createMockStatisticsService()
  };
};
