// src/services/dictionaryService.ts
import { appLog } from '../components/LogViewer';
import { fetchData } from '../utils/dataFetcher';
import { dictionaryCache } from './cacheService';
import { getDefinition as backendGetDefinition, saveAiInteraction } from './backendService';
import { BookId, SectionId, ChapterId, UserId } from '../types/idTypes';
import { registry } from './serviceRegistry';
import { handleServiceError } from '../utils/errorHandling';

// Types for dictionary responses
export interface DictionaryEntry {
  term: string;
  definition: string;
  examples?: string[];
  relatedTerms?: string[];
  pronunciation?: string;
  source?: 'database' | 'local' | 'external' | 'fallback';
}

// Local dictionary with enhanced definitions for fallback
const localDictionary: Record<string, DictionaryEntry> = {
  Alice: {
    term: 'Alice',
    definition: 'The curious and imaginative protagonist of the story.',
    examples: [
      'Alice was beginning to get very tired of sitting by her sister on the bank.',
      'Alice had not a moment to think about stopping herself before she found herself falling down a very deep well.'
    ],
    relatedTerms: ['protagonist', 'curious', 'imaginative'],
    pronunciation: "/ˈælɪs/",
    source: 'local'
  },
  Wonderland: {
    term: 'Wonderland',
    definition: 'The magical and nonsensical world that Alice discovers after falling down the rabbit hole.',
    examples: [
      'Welcome to Wonderland!',
      'In Wonderland, animals can talk and nothing makes sense.'
    ],
    relatedTerms: ['fantasy', 'magical', 'dream'],
    pronunciation: "/ˈwʌndərˌlænd/",
    source: 'local'
  },
  Rabbit: {
    term: 'Rabbit',
    definition: 'A white rabbit with pink eyes that Alice follows down the rabbit hole.',
    examples: [
      'The Rabbit pulled a watch out of his waistcoat pocket.',
      'Oh dear! Oh dear! I shall be late!'
    ],
    relatedTerms: ['white rabbit', 'pocket watch', 'waistcoat'],
    pronunciation: "/ˈræbɪt/",
    source: 'local'
  },
  Cheshire: {
    term: 'Cheshire',
    definition: 'Relating to the Cheshire Cat, a mysterious feline known for its distinctive grin that can appear and disappear independently of the rest of its body.',
    examples: [
      'The Cheshire Cat vanished quite slowly, beginning with the end of the tail, and ending with the grin.',
      'Well! I\'ve often seen a cat without a grin, but a grin without a cat!'
    ],
    relatedTerms: ['cat', 'grin', 'vanish', 'appear'],
    pronunciation: "/ˈtʃɛʃər/",
    source: 'local'
  }
};

/**
 * External dictionary API fallback
 * @param word Word to look up
 * @returns Dictionary entry
 */
async function fetchExternalDefinition(word: string): Promise<DictionaryEntry | null> {
  try {
    appLog('DictionaryService', 'Fetching from external API', 'info', { word });
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);

    if (!response.ok) {
      throw new Error('Word not found in external API');
    }

    const data = await response.json();

    if (!data || !data[0] || !data[0].meanings || !data[0].meanings[0]) {
      throw new Error('Invalid response format from external API');
    }

    return {
      term: word,
      definition: data[0]?.meanings[0]?.definitions[0]?.definition || 'No definition available',
      examples: data[0]?.meanings[0]?.definitions[0]?.example ?
        [data[0]?.meanings[0]?.definitions[0]?.example] : undefined,
      pronunciation: data[0]?.phonetic,
      relatedTerms: data[0]?.meanings[0]?.synonyms?.slice(0, 5),
      source: 'external'
    };
  } catch (error) {
    appLog('DictionaryService', 'Error fetching from external API', 'error', error);
    return null;
  }
}

/**
 * Get definition from local dictionary
 * @param word Word to look up
 * @returns Dictionary entry or null if not found
 */
function getLocalDefinition(word: string): DictionaryEntry | null {
  // Clean the word
  const cleanWord = word.replace(/[.,!?;:'"]/g, '').toLowerCase();
  const capitalizedWord = cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1);

  // Check for the word in various cases
  if (localDictionary[word]) {
    appLog('DictionaryService', `Found exact match for "${word}" in local dictionary`, 'debug');
    return localDictionary[word];
  } else if (localDictionary[cleanWord]) {
    appLog('DictionaryService', `Found lowercase match for "${cleanWord}" in local dictionary`, 'debug');
    return localDictionary[cleanWord];
  } else if (localDictionary[capitalizedWord]) {
    appLog('DictionaryService', `Found capitalized match for "${capitalizedWord}" in local dictionary`, 'debug');
    return localDictionary[capitalizedWord];
  }

  return null;
}

/**
 * Get definition from database
 * @param bookId Book ID
 * @param term Term to look up
 * @param sectionId Optional section ID for context
 * @param chapterId Optional chapter ID for context
 * @returns Dictionary entry or null if not found
 */
async function getDatabaseDefinition(
  bookId: string | BookId,
  term: string,
  sectionId?: string | SectionId,
  chapterId?: string | ChapterId
): Promise<DictionaryEntry | null> {
  try {
    // Clean the term to improve matching
    const cleanTerm = term.replace(/[.,!?;:'"\/\\()\[\]{}]/g, '').trim();

    appLog('DictionaryService', 'Fetching definition from database', 'info', {
      bookId, term: cleanTerm, sectionId, chapterId
    });

    const { data, error } = await backendGetDefinition(
      bookId.toString(),
      cleanTerm,
      sectionId?.toString(),
      chapterId?.toString()
    );

    if (error) {
      appLog('DictionaryService', 'Error fetching from database', 'warning', error);
      return null;
    }

    if (!data) {
      appLog('DictionaryService', 'No definition found in database', 'info', { term: cleanTerm });
      return null;
    }

    appLog('DictionaryService', 'Found definition in database', 'success', { term: cleanTerm });

    return {
      term,
      definition: data,
      source: 'database'
    };
  } catch (error) {
    appLog('DictionaryService', 'Error fetching definition from database', 'error', error);
    return null;
  }
}

/**
 * Dictionary Service Interface
 */
export interface DictionaryServiceInterface {
  getDefinition: (
    bookId: string | BookId,
    term: string,
    sectionId?: string | SectionId,
    chapterId?: string | ChapterId
  ) => Promise<DictionaryEntry>;

  logDictionaryLookup: (
    userId: string | UserId,
    bookId: string | BookId,
    sectionId: string | SectionId | undefined,
    term: string,
    definitionFound: boolean
  ) => Promise<void>;

  saveToVocabulary: (
    userId: string | UserId,
    term: string,
    definition: string
  ) => boolean;

  getUserVocabulary: (
    userId: string | UserId
  ) => any[];

  removeFromVocabulary: (
    userId: string | UserId,
    term: string
  ) => boolean;

  clearDefinitionCache: () => void;
}

/**
 * Create Dictionary Service
 *
 * Factory function to create the dictionary service implementation
 */
const createDictionaryService = async (): Promise<DictionaryServiceInterface> => {
  appLog('DictionaryService', 'Creating dictionary service', 'info');

  // Create service implementation
  const dictionaryService: DictionaryServiceInterface = {
    getDefinition: async (
      bookId: string | BookId,
      term: string,
      sectionId?: string | SectionId,
      chapterId?: string | ChapterId
    ): Promise<DictionaryEntry> => {
      appLog('DictionaryService', 'Getting definition', 'info', {
        bookId, term, sectionId, chapterId
      });

      // Clean the term
      const cleanTerm = term.replace(/[.,!?;:'"\/\\()\[\]{}]/g, '').trim();
      const lowerTerm = cleanTerm.toLowerCase();

      // Create a cache key
      const cacheKey = `definition_${bookId}_${lowerTerm}${sectionId ? `_${sectionId}` : ''}${chapterId ? `_${chapterId}` : ''}`;

      try {
        // Check cache first
        const cachedDefinition = dictionaryCache.get<DictionaryEntry>(cacheKey);
        if (cachedDefinition) {
          appLog('DictionaryService', 'Found definition in cache', 'success', { term: cleanTerm, source: cachedDefinition.source });
          return cachedDefinition;
        }

        // Try database first with context (section and chapter)
        const dbDefinition = await getDatabaseDefinition(bookId, cleanTerm, sectionId, chapterId);
        if (dbDefinition) {
          appLog('DictionaryService', 'Found definition in database with context', 'success', { term: cleanTerm });
          dictionaryCache.set(cacheKey, dbDefinition, 24 * 60 * 60 * 1000); // 24 hours
          return dbDefinition;
        }

        // Try local dictionary next
        const localDefinition = getLocalDefinition(cleanTerm);
        if (localDefinition) {
          appLog('DictionaryService', 'Found definition in local dictionary', 'info', { term: cleanTerm });
          dictionaryCache.set(cacheKey, localDefinition, 24 * 60 * 60 * 1000); // 24 hours
          return localDefinition;
        }

        // Try external API as last resort
        const externalDefinition = await fetchExternalDefinition(cleanTerm);
        if (externalDefinition) {
          appLog('DictionaryService', 'Found definition in external API', 'info', { term: cleanTerm });
          dictionaryCache.set(cacheKey, externalDefinition, 24 * 60 * 60 * 1000); // 24 hours
          return externalDefinition;
        }

        // Fallback
        appLog('DictionaryService', 'No definition found, using fallback', 'warning', { term: cleanTerm });
        const fallbackDefinition = {
          term,
          definition: 'No definition available for this term.',
          source: 'fallback' as const
        };

        // Cache the fallback for a shorter time (1 hour)
        dictionaryCache.set(cacheKey, fallbackDefinition, 60 * 60 * 1000); // 1 hour
        return fallbackDefinition;
      } catch (error) {
        appLog('DictionaryService', 'Error getting definition', 'error', { term: cleanTerm, error });

        // Return a fallback in case of error
        return {
          term,
          definition: 'An error occurred while retrieving the definition.',
          source: 'fallback'
        };
      }
    },

    logDictionaryLookup: async (
      userId: string | UserId,
      bookId: string | BookId,
      sectionId: string | SectionId | undefined,
      term: string,
      definitionFound: boolean
    ): Promise<void> => {
      try {
        appLog('DictionaryService', 'Logging dictionary lookup', 'info', {
          userId, bookId, sectionId, term, definitionFound
        });

        // Log as AI interaction for analytics
        await saveAiInteraction(
          userId.toString(),
          bookId.toString(),
          `Dictionary lookup: ${term}`,
          definitionFound ? `Definition found for "${term}"` : `No definition found for "${term}"`,
          sectionId?.toString()
        );
      } catch (error) {
        appLog('DictionaryService', 'Error logging dictionary lookup', 'error', error);
      }
    },

    saveToVocabulary: (
      userId: string | UserId,
      term: string,
      definition: string
    ): boolean => {
      try {
        // In a real app, this would save to Supabase
        // For now, just save to localStorage
        const vocabulary = JSON.parse(localStorage.getItem('userVocabulary') || '{}');

        if (!vocabulary[userId]) {
          vocabulary[userId] = [];
        }

        // Check if word already exists in vocabulary
        const existingIndex = vocabulary[userId].findIndex((item: any) => item.term === term);

        if (existingIndex >= 0) {
          appLog('DictionaryService', 'Word already exists in vocabulary, updating', 'info');
          vocabulary[userId][existingIndex] = {
            term,
            definition,
            savedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        } else {
          vocabulary[userId].push({
            term,
            definition,
            savedAt: new Date().toISOString()
          });
        }

        localStorage.setItem('userVocabulary', JSON.stringify(vocabulary));
        return true;
      } catch (error) {
        appLog('DictionaryService', 'Error saving to vocabulary', 'error', error);
        return false;
      }
    },

    getUserVocabulary: (userId: string | UserId): any[] => {
      try {
        const vocabulary = JSON.parse(localStorage.getItem('userVocabulary') || '{}');
        return vocabulary[userId] || [];
      } catch (error) {
        appLog('DictionaryService', 'Error getting user vocabulary', 'error', error);
        return [];
      }
    },

    removeFromVocabulary: (userId: string | UserId, term: string): boolean => {
      try {
        const vocabulary = JSON.parse(localStorage.getItem('userVocabulary') || '{}');

        if (!vocabulary[userId]) {
          return false;
        }

        const index = vocabulary[userId].findIndex((item: any) => item.term === term);

        if (index === -1) {
          return false;
        }

        vocabulary[userId].splice(index, 1);
        localStorage.setItem('userVocabulary', JSON.stringify(vocabulary));
        return true;
      } catch (error) {
        appLog('DictionaryService', 'Error removing from vocabulary', 'error', error);
        return false;
      }
    },

    clearDefinitionCache: () => {
      dictionaryCache.clear();
      appLog('DictionaryService', 'Definition cache cleared', 'info');
    }
  };

  return dictionaryService;
};

// Export the factory function
export { createDictionaryService };

// Create backward-compatible exports
export async function getDefinition(
  bookId: string | BookId,
  term: string,
  sectionId?: string | SectionId,
  chapterId?: string | ChapterId
): Promise<DictionaryEntry> {
  const service = await registry.getService<DictionaryServiceInterface>('dictionaryService');
  return service.getDefinition(bookId, term, sectionId, chapterId);
};

export async function logDictionaryLookup(
  userId: string | UserId,
  bookId: string | BookId,
  sectionId: string | SectionId | undefined,
  term: string,
  definitionFound: boolean
): Promise<void> {
  const service = await registry.getService<DictionaryServiceInterface>('dictionaryService');
  return service.logDictionaryLookup(userId, bookId, sectionId, term, definitionFound);
};

export function saveToVocabulary(
  userId: string | UserId,
  term: string,
  definition: string
): boolean {
  const service = registry.get<DictionaryServiceInterface>('dictionaryService');
  return service.saveToVocabulary(userId, term, definition);
};

export function getUserVocabulary(userId: string | UserId): any[] {
  const service = registry.get<DictionaryServiceInterface>('dictionaryService');
  return service.getUserVocabulary(userId);
};

export function removeFromVocabulary(userId: string | UserId, term: string): boolean {
  const service = registry.get<DictionaryServiceInterface>('dictionaryService');
  return service.removeFromVocabulary(userId, term);
};

export function clearDefinitionCache(): void {
  const service = registry.get<DictionaryServiceInterface>('dictionaryService');
  service.clearDefinitionCache();
};
