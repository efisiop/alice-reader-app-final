// src/services/bookService.ts
import { registry, SERVICE_NAMES } from '@services/serviceRegistry';
import { initManager } from './initManager';
import { getSupabaseClient } from './supabaseClient';
import { appLog } from '../components/LogViewer';
import { logInteraction, InteractionEventType } from './loggingService';

console.log('Loading bookService module');

// Define service interface
export interface BookServiceInterface {
  getBook: (bookId: string) => Promise<any>; // Added getBook method
  getPage: (bookId: string, pageNumber: number) => Promise<any>; // Added getPage method
  getBookDetails: (bookId: string) => Promise<any>;
  getSectionDetails: (sectionId: string) => Promise<any>;
  getBookContent: (bookId: string) => Promise<any>;
  getSectionByPage: (bookId: string, pageNumber: number) => Promise<any>;
  saveReadingProgress: (userId: string, bookId: string, sectionId: string, position: string) => Promise<boolean>;
  getReadingProgress: (userId: string, bookId: string) => Promise<any>;
  getReadingStats: (userId: string, bookId: string) => Promise<any>;
  updateReadingStats: (userId: string, bookId: string, currentPosition: string) => Promise<boolean>;
  updateReadingProgress: (userId: string, bookId: string, pageNumber: number, readingTime: number) => Promise<boolean>; // Added updateReadingProgress method
}

// Create service factory
export const createBookService = async (): Promise<BookServiceInterface> => {
  appLog('BookService', 'Creating book service', 'info');
  console.log('Creating book service');

  // Create service implementation
  const bookService: BookServiceInterface = {
    getBook: async (bookId: string) => {
      try {
        appLog("BookService", `Getting book with ID ${bookId}`, "info");
        console.log(`BookService: Getting book with ID ${bookId}`);

        // For testing purposes, return mock data
        return {
          id: bookId,
          title: "Alice in Wonderland",
          author: "Lewis Carroll",
          description: "Alice's Adventures in Wonderland is an 1865 novel by English author Lewis Carroll. It tells of a young girl named Alice, who falls through a rabbit hole into a subterranean fantasy world populated by peculiar, anthropomorphic creatures.",
          coverImage: "https://m.media-amazon.com/images/I/71pmz7EqjdL._AC_UF1000,1000_QL80_.jpg",
          totalPages: 100,
          chapters: [
            { id: "ch1", chapter_number: 1, title: "Down the Rabbit-Hole" },
            { id: "ch2", chapter_number: 2, title: "The Pool of Tears" },
            { id: "ch3", chapter_number: 3, title: "A Caucus-Race and a Long Tale" }
          ]
        };
      } catch (error: any) {
        appLog("BookService", `Error getting book: ${error.message}`, "error");
        console.error(`BookService: Error getting book: ${error.message}`);
        return null;
      }
    },

    getPage: async (bookId: string, pageNumber: number) => {
      try {
        appLog("BookService", `Getting page ${pageNumber} for book ${bookId}`, "info");
        console.log(`BookService: Getting page ${pageNumber} for book ${bookId}`);

        // For testing purposes, return mock data
        const chapterNumber = Math.ceil(pageNumber / 10);
        const chapterTitle = chapterNumber === 1 ? "Down the Rabbit-Hole" :
                            chapterNumber === 2 ? "The Pool of Tears" :
                            "A Caucus-Race and a Long Tale";

        return {
          id: `page-${pageNumber}`,
          bookId,
          pageNumber,
          title: `Chapter ${chapterNumber}: ${chapterTitle}`,
          content: `This is the content for page ${pageNumber} of Alice in Wonderland. \n\n` +
                  `Alice was beginning to get very tired of sitting by her sister on the bank, ` +
                  `and of having nothing to do: once or twice she had peeped into the book her sister was reading, ` +
                  `but it had no pictures or conversations in it, 'and what is the use of a book,' thought Alice ` +
                  `'without pictures or conversations?'\n\n` +
                  `So she was considering in her own mind (as well as she could, for the hot day made her feel very ` +
                  `sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of ` +
                  `getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.\n\n` +
                  `There was nothing so very remarkable in that; nor did Alice think it so very much out of the way ` +
                  `to hear the Rabbit say to itself, 'Oh dear! Oh dear! I shall be late!' (when she thought it over ` +
                  `afterwards, it occurred to her that she ought to have wondered at this, but at the time it all ` +
                  `seemed quite natural); but when the Rabbit actually took a watch out of its waistcoat-pocket, and ` +
                  `looked at it, and then hurried on, Alice started to her feet, for it flashed across her mind that ` +
                  `she had never before seen a rabbit with either a waistcoat-pocket, or a watch to take out of it, ` +
                  `and burning with curiosity, she ran across the field after it, and fortunately was just in time ` +
                  `to see it pop down a large rabbit-hole under the hedge.`
        };
      } catch (error: any) {
        appLog("BookService", `Error getting page: ${error.message}`, "error");
        console.error(`BookService: Error getting page: ${error.message}`);
        return null;
      }
    },

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
    },

    updateReadingProgress: async (userId: string, bookId: string, pageNumber: number, readingTime: number) => {
      try {
        appLog("BookService", `Updating reading progress for user ${userId}, book ${bookId}, page ${pageNumber}, time ${readingTime}s`, "info");
        console.log(`BookService: Updating reading progress for user ${userId}, book ${bookId}, page ${pageNumber}, time ${readingTime}s`);

        // Log page sync interaction
        await logInteraction(userId, InteractionEventType.PAGE_SYNC, {
          bookId,
          pageNumber,
          content: `User synced to page ${pageNumber}`,
          readingTime
        }).catch(err => {
          // Just log the error but don't fail the update
          appLog('BookService', 'Error logging page sync interaction', 'error', err);
        });

        // For testing purposes, just return success
        return true;
      } catch (error: any) {
        appLog("BookService", `Error updating reading progress: ${error.message}`, "error");
        console.error(`BookService: Error updating reading progress: ${error.message}`);
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
export const getBook = createBackwardCompatibleMethod<[string], any>('getBook');
export const getPage = createBackwardCompatibleMethod<[string, number], any>('getPage');
export const getBookDetails = createBackwardCompatibleMethod<[string], any>('getBookDetails');
export const getSectionDetails = createBackwardCompatibleMethod<[string], any>('getSectionDetails');
export const getBookContent = createBackwardCompatibleMethod<[string], any>('getBookContent');
export const getSectionByPage = createBackwardCompatibleMethod<[string, number], any>('getSectionByPage');
export const saveReadingProgress = createBackwardCompatibleMethod<[string, string, string, string], boolean>('saveReadingProgress');
export const getReadingProgress = createBackwardCompatibleMethod<[string, string], any>('getReadingProgress');
export const getReadingStats = createBackwardCompatibleMethod<[string, string], any>('getReadingStats');
export const updateReadingStats = createBackwardCompatibleMethod<[string, string, string], boolean>('updateReadingStats');
export const updateReadingProgress = createBackwardCompatibleMethod<[string, string, number, number], boolean>('updateReadingProgress');

// Default export for backward compatibility
export default {
  getBook,
  getPage,
  getBookDetails,
  getSectionDetails,
  getBookContent,
  getSectionByPage,
  saveReadingProgress,
  getReadingProgress,
  getReadingStats,
  updateReadingStats,
  updateReadingProgress
};

console.log('bookService module loaded');
