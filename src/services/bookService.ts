// src/services/bookService.ts
import { registry, SERVICE_NAMES } from './registry';
import { initManager } from './initManager';
import { getSupabaseClient } from './supabaseClient';
import { appLog } from '../components/LogViewer';

console.log('Loading bookService module');

// Define service interface
export interface BookServiceInterface {
  getBookDetails: (bookId: string) => Promise<any>;
  getSectionDetails: (sectionId: string) => Promise<any>;
  getBookContent: (bookId: string) => Promise<any>;
  getSectionByPage: (bookId: string, pageNumber: number) => Promise<any>;
  saveReadingProgress: (userId: string, bookId: string, sectionId: string, position: string) => Promise<boolean>;
  getReadingProgress: (userId: string, bookId: string) => Promise<any>;
  getReadingStats: (userId: string, bookId: string) => Promise<any>;
  updateReadingStats: (userId: string, bookId: string, currentPosition: string) => Promise<boolean>;
}

// Create service factory
const createBookService = async (): Promise<BookServiceInterface> => {
  appLog('BookService', 'Creating book service', 'info');
  console.log('Creating book service');
  
  // Create service implementation
  const bookService: BookServiceInterface = {
    getBookDetails: async (bookId: string) => {
      try {
        appLog("BookService", `Getting book details for ${bookId}`, "info");
        const supabase = await getSupabaseClient();
        
        // For testing purposes, return mock data
        return {
          id: bookId,
          title: "Alice in Wonderland",
          author: "Lewis Carroll",
          description: "Alice's Adventures in Wonderland is an 1865 novel by English author Lewis Carroll. It tells of a young girl named Alice, who falls through a rabbit hole into a subterranean fantasy world populated by peculiar, anthropomorphic creatures.",
          chapters: [
            { id: "ch1", chapter_number: 1, title: "Down the Rabbit-Hole" },
            { id: "ch2", chapter_number: 2, title: "The Pool of Tears" },
            { id: "ch3", chapter_number: 3, title: "A Caucus-Race and a Long Tale" }
          ]
        };
      } catch (error: any) {
        appLog("BookService", `Error getting book details: ${error.message}`, "error");
        return null;
      }
    },
    
    getSectionDetails: async (sectionId: string) => {
      try {
        appLog("BookService", `Getting section details for ${sectionId}`, "info");
        // Mock implementation
        return {
          id: sectionId,
          title: "Section Title",
          content: "Section content goes here"
        };
      } catch (error: any) {
        appLog("BookService", `Error getting section details: ${error.message}`, "error");
        return null;
      }
    },
    
    getBookContent: async (bookId: string) => {
      try {
        appLog("BookService", `Getting book content for ${bookId}`, "info");
        // Mock implementation
        return {
          id: bookId,
          title: "Alice in Wonderland",
          content: "Mock content for Alice in Wonderland",
          currentPage: 1,
          totalPages: 100
        };
      } catch (error: any) {
        appLog("BookService", `Error getting book content: ${error.message}`, "error");
        return null;
      }
    },
    
    getSectionByPage: async (bookId: string, pageNumber: number) => {
      try {
        appLog("BookService", `Getting section for page ${pageNumber}`, "info");
        // Mock implementation
        return {
          id: `section_${pageNumber}`,
          title: `Section for page ${pageNumber}`,
          content: `Content for page ${pageNumber}`
        };
      } catch (error: any) {
        appLog("BookService", `Error getting section by page: ${error.message}`, "error");
        return null;
      }
    },
    
    saveReadingProgress: async (userId: string, bookId: string, sectionId: string, position: string) => {
      try {
        appLog("BookService", `Saving reading progress for user ${userId}`, "info");
        // Mock implementation
        return true;
      } catch (error: any) {
        appLog("BookService", `Error saving reading progress: ${error.message}`, "error");
        return false;
      }
    },
    
    getReadingProgress: async (userId: string, bookId: string) => {
      try {
        appLog("BookService", `Getting reading progress for user ${userId}`, "info");
        // Mock implementation
        return {
          userId,
          bookId,
          sectionId: "section_1",
          lastPosition: "10",
          lastReadAt: new Date().toISOString()
        };
      } catch (error: any) {
        appLog("BookService", `Error getting reading progress: ${error.message}`, "error");
        return null;
      }
    },
    
    getReadingStats: async (userId: string, bookId: string) => {
      try {
        appLog("BookService", `Getting reading stats for user ${userId}`, "info");
        // Mock implementation
        return {
          userId,
          bookId,
          totalReadingTime: 120,
          pagesRead: 10,
          percentageComplete: 0.1,
          lastSessionDate: new Date().toISOString()
        };
      } catch (error: any) {
        appLog("BookService", `Error getting reading stats: ${error.message}`, "error");
        return null;
      }
    },
    
    updateReadingStats: async (userId: string, bookId: string, currentPosition: string) => {
      try {
        appLog("BookService", `Updating reading stats for user ${userId}`, "info");
        // Mock implementation
        return true;
      } catch (error: any) {
        appLog("BookService", `Error updating reading stats: ${error.message}`, "error");
        return false;
      }
    }
  };
  
  return bookService;
};

// Register initialization function
console.log(`Registering initialization function for ${SERVICE_NAMES.BOOK_SERVICE}`);
initManager.register(SERVICE_NAMES.BOOK_SERVICE, async () => {
  console.log(`Creating book service for registration`);
  const service = await createBookService();
  console.log(`Registering book service in registry`);
  registry.register(SERVICE_NAMES.BOOK_SERVICE, service);
  console.log(`Book service registered successfully`);
}, []); // No dependencies for now

// Create backward-compatible exports
const createBackwardCompatibleMethod = <T extends any[], R>(
  methodName: string
): ((...args: T) => Promise<R>) => {
  return async (...args: T): Promise<R> => {
    // Ensure service is initialized
    if (!registry.has(SERVICE_NAMES.BOOK_SERVICE)) {
      await initManager.initializeService(SERVICE_NAMES.BOOK_SERVICE);
    }
    
    // Get service from registry
    const service = registry.get<BookServiceInterface>(SERVICE_NAMES.BOOK_SERVICE);
    
    // Call method
    return service[methodName](...args);
  };
};

// Export for backward compatibility
export const getBookDetails = createBackwardCompatibleMethod<[string], any>('getBookDetails');
export const getSectionDetails = createBackwardCompatibleMethod<[string], any>('getSectionDetails');
export const getBookContent = createBackwardCompatibleMethod<[string], any>('getBookContent');
export const getSectionByPage = createBackwardCompatibleMethod<[string, number], any>('getSectionByPage');
export const saveReadingProgress = createBackwardCompatibleMethod<[string, string, string, string], boolean>('saveReadingProgress');
export const getReadingProgress = createBackwardCompatibleMethod<[string, string], any>('getReadingProgress');
export const getReadingStats = createBackwardCompatibleMethod<[string, string], any>('getReadingStats');
export const updateReadingStats = createBackwardCompatibleMethod<[string, string, string], boolean>('updateReadingStats');

// Default export for backward compatibility
export default {
  getBookDetails,
  getSectionDetails,
  getBookContent,
  getSectionByPage,
  saveReadingProgress,
  getReadingProgress,
  getReadingStats,
  updateReadingStats
};

console.log('bookService module loaded');
