// src/services/backendService.ts
import { getSupabaseClient, checkSupabaseConnection, executeWithRetries, verifyBookCode as supabaseVerifyBookCode } from './supabaseClient';
import { mockBackend } from './mockBackend';
import { isBackendAvailable } from './backendConfig';
import { BookWithChapters, SectionWithChapter, BookProgress, BookStats, HelpRequest, UserFeedback, HelpRequestStatus, FeedbackType, TriggerType } from '../types/supabase';
import { BookId, UserId, SectionId } from '../types/idTypes';
import { getBookUuid } from '../utils/bookIdUtils';
import { validateBookId, validateUserId, validateSectionId } from '../utils/idValidation';
import { appLog } from '../components/LogViewer';
import { User, Session } from '@supabase/supabase-js';
import mcpInstance from '../mcp/instance';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Function to determine if we should use the real backend
async function useRealBackend() {
  // First check the mock backend override
  if (!isBackendAvailable) {
    appLog('BackendService', 'Using mock backend (forced by configuration)', 'info');
    return false;
  }

  // Then check the actual connection status
  const isConnected = await checkSupabaseConnection();
  if (!isConnected) {
    appLog('BackendService', 'Using mock backend (connection unavailable)', 'warning');
    return false;
  }

  appLog('BackendService', 'Using real backend', 'info');
  return true;
}

// Auth services
export const signIn = async (email: string, password: string) => {
  return mcpInstance.signIn(email, password);
};

export const signUp = async (email: string, password: string) => {
  return mcpInstance.signUp(email, password);
};

export const signOut = async () => {
  return mcpInstance.signOut();
};

export const getSession = async () => {
  return mcpInstance.getSession();
};

export const onAuthStateChange = async (callback: (event: string, session: Session | null) => void) => {
  return mcpInstance.onAuthStateChange(callback);
};

// Helper functions for development
export const toggleMockMode = (enabled: boolean) => {
  mcpInstance.setMockEnabled(enabled);
};

export const toggleCache = (enabled: boolean) => {
  mcpInstance.setCacheEnabled(enabled);
};

export const clearCache = () => {
  mcpInstance.clearCache();
};

// Profile services
export async function getUserProfile(userId: string) {
  appLog('BackendService', `Getting user profile for ${userId}`, 'info');

  if (await useRealBackend()) {
    try {
      return await executeWithRetries(async () => {
        const client = await getSupabaseClient();
        const { data, error } = await client
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          appLog('BackendService', `Error fetching profile for user ${userId}:`, 'error', error.message);
          throw error;
        }

        appLog('BackendService', `Profile fetched successfully for user ${userId}`, 'success');
        return { data, error: null };
      }, 'getUserProfile');
    } catch (error) {
      appLog('BackendService', 'Get user profile failed after retries, falling back to mock', 'error', error);
      return mockBackend.profiles.getUserProfile(userId);
    }
  } else {
    return mockBackend.profiles.getUserProfile(userId);
  }
}

export async function createUserProfile(userId: string, firstName: string, lastName: string, email: string) {
  if (await useRealBackend()) {
    try {
      return await executeWithRetries(async () => {
        const client = await getSupabaseClient();
        const { data, error } = await client
          .from('profiles')
          .insert({
            id: userId,
            first_name: firstName,
            last_name: lastName,
            email: email
          })
          .select()
          .single();

        if (error) throw error;
        return { data, error: null };
      }, 'createUserProfile');
    } catch (error) {
      appLog('BackendService', 'Create user profile failed after retries, falling back to mock', 'error', error);
      return mockBackend.profiles.createUserProfile(userId, firstName, lastName, email);
    }
  } else {
    return mockBackend.profiles.createUserProfile(userId, firstName, lastName, email);
  }
}

export async function updateUserProfile(userId: string, updates: any) {
  if (await useRealBackend()) {
    try {
      return await executeWithRetries(async () => {
        const client = await getSupabaseClient();
        const { data, error } = await client
          .from('profiles')
          .update(updates)
          .eq('id', userId)
          .select()
          .single();

        if (error) throw error;
        return { data, error: null };
      }, 'updateUserProfile');
    } catch (error) {
      appLog('BackendService', 'Update user profile failed after retries, falling back to mock', 'error', error);
      return mockBackend.profiles.updateUserProfile(userId, updates);
    }
  } else {
    return mockBackend.profiles.updateUserProfile(userId, updates);
  }
}

// Book services
export async function getAllBooks() {
  if (await useRealBackend()) {
    try {
      return await executeWithRetries(async () => {
        const client = await getSupabaseClient();
        const { data, error } = await client
          .from('books')
          .select('*');

        if (error) throw error;
        return { data, error: null };
      }, 'getAllBooks');
    } catch (error) {
      appLog('BackendService', 'Get all books failed after retries, falling back to mock', 'error', error);
      return mockBackend.books.getAllBooks();
    }
  } else {
    return mockBackend.books.getAllBooks();
  }
}

export async function getBookContent(bookId: string | BookId): Promise<{ data: BookWithChapters | null, error: any }> {
  appLog('BackendService', `Fetching book content for ID: ${bookId}`, 'info');

  // Validate the book ID
  if (!validateBookId(bookId)) {
    appLog('BackendService', `Invalid book ID: ${bookId}`, 'error');
    return { data: null, error: new Error(`Invalid book ID: ${bookId}`) };
  }

  if (await useRealBackend()) {
    try {
      // Get the Supabase client
      const client = await getSupabaseClient();
      // Convert string ID to UUID if needed
      const bookUuid = getBookUuid(bookId.toString());
      appLog('BackendService', `Using book UUID: ${bookUuid}`, 'debug');

      // First get the book
      appLog('BackendService', 'Step 1 - Fetching book details...', 'info');
      const { data: book, error: bookError } = await client
        .from('books')
        .select('*')
        .eq('id', bookUuid)
        .single();

      if (bookError) {
        appLog('BackendService', 'Error fetching book', 'error', bookError);
        throw bookError;
      }

      if (!book) {
        appLog('BackendService', 'Book not found', 'error');
        throw new Error('Book not found');
      }

      appLog('BackendService', `Book found: ${book.title}`, 'success', { title: book.title, id: book.id });

      // Then get all chapters for this book
      appLog('BackendService', 'Step 2 - Fetching chapters...', 'info');
      const { data: chapters, error: chaptersError } = await client
        .from('chapters')
        .select('*')
        .eq('book_id', bookUuid)
        .order('number');

      if (chaptersError) {
        appLog('BackendService', 'Error fetching chapters', 'error', chaptersError);
        throw chaptersError;
      }

      if (!chapters || chapters.length === 0) {
        appLog('BackendService', 'No chapters found', 'error');
        throw new Error('No chapters found for this book');
      }

      appLog('BackendService', `Found ${chapters.length} chapters`, 'success');

      // For each chapter, get its sections
      appLog('BackendService', 'Step 3 - Fetching sections for each chapter...', 'info');
      const chaptersWithSections = await Promise.all(
        chapters.map(async (chapter: any) => {
          const { data: sections, error: sectionsError } = await client
            .from('sections')
            .select('*')
            .eq('chapter_id', chapter.id)
            .order('number');

          if (sectionsError) {
            appLog('BackendService', 'Error fetching sections', 'error', sectionsError);
            return { ...chapter, sections: [] };
          }

          return { ...chapter, sections };
        })
      );

      appLog('BackendService', 'Successfully assembled book with chapters and sections', 'success');
      return {
        data: {
          ...book,
          chapters: chaptersWithSections
        },
        error: null
      };
    } catch (error) {
      appLog('BackendService', 'Error in getBookContent', 'error', error);
      return { data: null, error };
    }
  } else {
    appLog('BackendService', 'Using mock backend', 'info');
    const result = mockBackend.books.getBookContent(bookId);
    // Ensure undefined is handled as null for type safety
    return {
      data: result.data || null,
      error: result.error
    };
  }
}

export async function getSectionsForPage(bookId: string, pageNumber: number) {
  if (await useRealBackend()) {
    // Get the Supabase client
    const client = await getSupabaseClient();

    const { data, error } = await client
      .rpc('get_sections_for_page', {
        book_id_param: bookId,
        page_number_param: pageNumber
      });

    return { data: data as SectionWithChapter[], error };
  } else {
    return mockBackend.books.getSectionsForPage(bookId, pageNumber);
  }
}

export async function getDefinition(bookId: string, term: string, sectionId?: string, chapterId?: string) {
  try {
    appLog('BackendService', 'Getting definition', 'info', {
      bookId, term, sectionId, chapterId
    });

    // Clean the term to improve matching
    const cleanTerm = term.replace(/[.,!?;:'"\/\\()\[\]{}]/g, '').trim().toLowerCase();

    if (await useRealBackend()) {
      // Get the Supabase client
      const client = await getSupabaseClient();

      // Convert IDs to UUIDs if needed
      const bookUuid = getBookUuid(bookId);

      // Call the stored procedure with context parameters
      const { data, error } = await client
        .rpc('get_definition_with_context', {
          book_id_param: bookUuid,
          term_param: cleanTerm,
          section_id_param: sectionId || null,
          chapter_id_param: chapterId || null
        });

      if (error) {
        appLog('BackendService', 'Error getting definition from database', 'error', error);
        return { data: null, error };
      }

      // Return the highest priority definition (lowest number)
      if (data && data.length > 0) {
        // Sort by priority (1 is highest priority)
        const sortedDefinitions = data.sort((a: {priority: number}, b: {priority: number}) => a.priority - b.priority);
        const definition = sortedDefinitions[0].definition;

        appLog('BackendService', 'Found definition in database', 'success', {
          term: cleanTerm,
          priority: sortedDefinitions[0].priority,
          definitionLength: definition.length
        });

        return { data: definition, error: null };
      }

      appLog('BackendService', 'No definition found in database', 'info', { term: cleanTerm });
      return { data: null, error: null };
    } else {
      appLog('BackendService', 'Using mock backend for definition', 'info');
      return mockBackend.books.getDefinition(bookId, cleanTerm, sectionId, chapterId);
    }
  } catch (error) {
    appLog('BackendService', 'Error in getDefinition', 'error', error);
    return { data: null, error };
  }
}

export async function verifyBookCode(code: string) {
  // @deprecated - This function only checks if a code exists but doesn't mark it as used or update the profile
  // Use verifyBookCodeComprehensive instead
  if (await useRealBackend()) {
    // Get the Supabase client
    const client = await getSupabaseClient();

    const { data, error } = await client
      .from('verification_codes')
      .select('*, books(id, title, author)')
      .eq('code', code.toUpperCase())
      .single();

    return { data, error };
  } else {
    return mockBackend.books.verifyBookCode(code);
  }
}

export async function markCodeAsUsed(code: string, userId: string) {
  // @deprecated - This function only marks a code as used but doesn't update the profile
  // Use verifyBookCodeComprehensive instead
  if (await useRealBackend()) {
    // Get the Supabase client
    const client = await getSupabaseClient();

    const { data, error } = await client
      .from('verification_codes')
      .update({ is_used: true, used_by: userId })
      .eq('code', code.toUpperCase())
      .select()
      .single();

    return { data, error };
  } else {
    return mockBackend.books.markCodeAsUsed(code, userId);
  }
}

/**
 * Comprehensive verification function that performs all necessary steps in a single call:
 * 1. Checks if code exists and is not used
 * 2. Marks code as used
 * 3. Updates user profile with first/last name and verification status
 *
 * @param code - The verification code to verify
 * @param userId - The user ID to associate with this code
 * @param firstName - Optional first name to update in the user's profile
 * @param lastName - Optional last name to update in the user's profile
 * @returns Promise with success status and data or error
 */
export async function verifyBookCodeComprehensive(code: string, userId: string, firstName?: string, lastName?: string) {
  appLog('BackendService', 'Performing comprehensive book verification', 'info', { code, userId, firstName, lastName });
  console.log('verifyBookCodeComprehensive: Starting verification with:', { code, userId, firstName, lastName });

  const startTime = Date.now();

  if (await useRealBackend()) {
    try {
      // Get the Supabase client
      const client = await getSupabaseClient();

      // Call the optimized supabaseVerifyBookCode function directly
      const result = await supabaseVerifyBookCode(code, userId, firstName, lastName);
      const elapsedMs = Date.now() - startTime;

      console.log(`verifyBookCodeComprehensive: Verification completed in ${elapsedMs}ms, result:`, result);

      // Additional diagnostics
      if (!result.success) {
        appLog('BackendService', 'Verification failed', 'error', result.error);
        console.error('verifyBookCodeComprehensive: Verification failed with error:', result.error);
      } else {
        appLog('BackendService', 'Verification successful', 'success');
        console.log('verifyBookCodeComprehensive: Verification successful');

        // Double-check the profile was actually updated - no need to await this
        setTimeout(async () => {
          try {
            const { data: profile } = await client
              .from('profiles')
              .select('first_name, last_name, book_verified')
              .eq('id', userId)
              .single();

            console.log('verifyBookCodeComprehensive: Post-verification profile check:', profile);

            if (!profile?.book_verified) {
              console.warn('verifyBookCodeComprehensive: Profile book_verified is still false!');
            }
          } catch (profileErr) {
            console.error('verifyBookCodeComprehensive: Error checking profile after verification:', profileErr);
          }
        }, 500);
      }

      return result;
    } catch (error) {
      const elapsedMs = Date.now() - startTime;
      appLog('BackendService', `Error in comprehensive verification (after ${elapsedMs}ms)`, 'error', error);
      console.error(`verifyBookCodeComprehensive: Error in verification after ${elapsedMs}ms:`, error);
      return { success: false, error };
    }
  } else {
    // For mock backend, we still need to perform all steps
    try {
      // Mock implementation for comprehensive verification
      appLog('BackendService', 'Using mock implementation for comprehensive verification', 'info');
      console.log('Mock verifyBookCodeComprehensive: Starting with code:', code, 'userId:', userId);

      // Step 1: Check if code exists and is not used
      const { data: verificationData, error: verifyError } = await mockBackend.books.verifyBookCode(code);

      if (verifyError || !verificationData) {
        console.error('Mock verification failed: Invalid code');
        return { success: false, error: verifyError || 'Invalid verification code' };
      }

      if (verificationData.is_used) {
        console.error('Mock verification failed: Code already used');
        return { success: false, error: 'This code has already been used' };
      }

      // Step 2: Mark code as used
      const { error: markCodeError } = await mockBackend.books.markCodeAsUsed(code, userId);

      if (markCodeError) {
        console.error('Mock verification failed: Error marking code as used');
        return { success: false, error: markCodeError };
      }

      // Step 3: Update user profile
      const updates: any = { book_verified: true };
      if (firstName) updates.first_name = firstName;
      if (lastName) updates.last_name = lastName;

      console.log('Mock verification: Updating profile with:', updates);

      // Check if profile exists, create if it doesn't
      const { data: existingProfile } = await mockBackend.profiles.getUserProfile(userId);

      if (!existingProfile) {
        console.log('Mock verification: Profile does not exist, creating new profile');
        await mockBackend.profiles.createUserProfile(
          userId,
          firstName || 'User',
          lastName || 'Name',
          'user@example.com'
        );
      }

      const { data: updatedProfile, error: updateError } = await mockBackend.profiles.updateUserProfile(userId, updates);

      if (updateError) {
        console.error('Mock verification failed: Error updating profile', updateError);
        return { success: false, error: updateError };
      }

      console.log('Mock verification successful! Updated profile:', updatedProfile);
      return { success: true, data: verificationData };
    } catch (error) {
      console.error('Mock verification failed with exception:', error);
      appLog('BackendService', 'Error in mock comprehensive verification', 'error', error);
      return { success: false, error };
    }
  }
}

// Reading progress services
export async function saveReadingProgress(userId: string | UserId, bookId: string | BookId, sectionId: string | SectionId, lastPosition?: string) {
  appLog('BackendService', 'Saving reading progress', 'info', { userId, bookId, sectionId });

  // Validate IDs
  if (!validateUserId(userId) || !validateBookId(bookId) || !validateSectionId(sectionId)) {
    appLog('BackendService', 'Invalid IDs for saving reading progress', 'error', { userId, bookId, sectionId });
    return { data: null, error: new Error('Invalid IDs for saving reading progress') };
  }

  if (await useRealBackend()) {
    try {
      // Get the Supabase client
      const client = await getSupabaseClient();
      // Convert string ID to UUID if needed
      const bookUuid = getBookUuid(bookId.toString());
      appLog('BackendService', `Using book UUID: ${bookUuid}`, 'debug');

      // Check if a record already exists
      const { data: existing, error: checkError } = await client
        .from('reading_progress')
        .select('id')
        .eq('user_id', userId)
        .eq('book_id', bookUuid)
        .maybeSingle();

      if (checkError) {
        appLog('BackendService', 'Error checking existing reading progress', 'error', checkError);
        return { data: null, error: checkError };
      }

      const now = new Date().toISOString();

      if (existing) {
        appLog('BackendService', 'Updating existing reading progress record', 'info', { id: existing.id });
        // Update existing record
        const { data, error } = await client
          .from('reading_progress')
          .update({
            section_id: sectionId,
            last_position: lastPosition || null,
            last_read_at: now,
            updated_at: now
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) {
          appLog('BackendService', 'Error updating reading progress', 'error', error);
        } else {
          appLog('BackendService', 'Reading progress updated successfully', 'success');
        }

        return { data, error };
      } else {
        appLog('BackendService', 'Creating new reading progress record', 'info');
        // Insert new record
        const { data, error } = await client
          .from('reading_progress')
          .insert({
            user_id: userId,
            book_id: bookUuid,
            section_id: sectionId,
            last_position: lastPosition || null,
            last_read_at: now
          })
          .select()
          .single();

        if (error) {
          appLog('BackendService', 'Error creating reading progress', 'error', error);
        } else {
          appLog('BackendService', 'Reading progress created successfully', 'success');
        }

        return { data, error };
      }
    } catch (error) {
      appLog('BackendService', 'Unexpected error in saveReadingProgress', 'error', error);
      return { data: null, error };
    }
  } else {
    appLog('BackendService', 'Using mock backend for saveReadingProgress', 'info');
    return mockBackend.progress.saveReadingProgress(userId, bookId, sectionId, lastPosition);
  }
}

export async function getReadingProgress(userId: string | UserId, bookId: string | BookId) {
  appLog('BackendService', 'Getting reading progress', 'info', { userId, bookId });

  // Validate IDs
  if (!validateUserId(userId) || !validateBookId(bookId)) {
    appLog('BackendService', 'Invalid IDs for getting reading progress', 'error', { userId, bookId });
    return { data: null, error: new Error('Invalid IDs for getting reading progress') };
  }

  if (await useRealBackend()) {
    try {
      // Get the Supabase client
      const client = await getSupabaseClient();
      // Convert string ID to UUID if needed
      const bookUuid = getBookUuid(bookId.toString());
      appLog('BackendService', `Using book UUID: ${bookUuid}`, 'debug');

      const { data, error } = await client
        .from('reading_progress')
        .select('section_id, last_position, last_read_at')
        .eq('user_id', userId)
        .eq('book_id', bookUuid)
        .maybeSingle();

      if (error) {
        appLog('BackendService', 'Error fetching reading progress', 'error', error);
        throw error;
      }

      if (!data) {
        appLog('BackendService', 'No reading progress found', 'info');
        return { data: null, error: null };
      }

      appLog('BackendService', 'Reading progress found', 'success', { sectionId: data.section_id });

      // Get section and chapter details
      appLog('BackendService', 'Fetching section and chapter details', 'info');
      const { data: sectionData, error: sectionError } = await client
        .from('sections')
        .select('title, start_page, chapters!inner(title, number)')
        .eq('id', data.section_id)
        .single();

      if (sectionError) {
        appLog('BackendService', 'Error fetching section details', 'error', sectionError);
        throw sectionError;
      }

      appLog('BackendService', 'Section details found', 'success', { title: sectionData.title });

      // The chapters property is an array with a single object due to the join
      const chapterData = sectionData.chapters as unknown as { title: string, number: number };

      const progressData: BookProgress = {
        section_id: data.section_id,
        last_position: data.last_position,
        section_title: sectionData.title,
        chapter_title: chapterData.title,
        page_number: sectionData.start_page
      };

      appLog('BackendService', 'Reading progress assembled successfully', 'success');
      return { data: progressData, error: null };
    } catch (error) {
      appLog('BackendService', 'Error in getReadingProgress', 'error', error);
      return { data: null, error };
    }
  } else {
    appLog('BackendService', 'Using mock backend for getReadingProgress', 'info');
    return mockBackend.progress.getReadingProgress(userId, bookId);
  }
}

export async function updateReadingStats(userId: string, bookId: string, timeSpentSeconds: number, pagesRead: number) {
  appLog('BackendService', 'Updating reading stats', 'info', { userId, bookId, timeSpentSeconds, pagesRead });

  if (await useRealBackend()) {
    try {
      // Get the Supabase client
      const client = await getSupabaseClient();

      // Convert string ID to UUID if needed
      const bookUuid = getBookUuid(bookId);
      appLog('BackendService', `Using book UUID: ${bookUuid}`, 'debug');

      // Check if a record already exists
      const { data: existing, error: checkError } = await client
        .from('reading_stats')
        .select('id, total_reading_time, pages_read')
        .eq('user_id', userId)
        .eq('book_id', bookUuid)
        .maybeSingle();

      if (checkError) {
        appLog('BackendService', 'Error checking existing reading stats', 'error', checkError);
        return { data: null, error: checkError };
      }

      const now = new Date().toISOString();

      if (existing) {
        appLog('BackendService', 'Updating existing reading stats', 'info', {
          id: existing.id,
          currentTime: existing.total_reading_time,
          newTime: existing.total_reading_time + timeSpentSeconds
        });

        // Update existing record
        const { data, error } = await client
          .from('reading_stats')
          .update({
            total_reading_time: existing.total_reading_time + timeSpentSeconds,
            pages_read: Math.max(existing.pages_read, pagesRead), // Only update if higher
            last_session_date: now,
            updated_at: now
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) {
          appLog('BackendService', 'Error updating reading stats', 'error', error);
        } else {
          appLog('BackendService', 'Reading stats updated successfully', 'success');
        }

        return { data, error };
      } else {
        appLog('BackendService', 'Creating new reading stats record', 'info');

        // Calculate percentage complete based on total pages in the book
        // This would normally come from the book data, but we'll use a default for now
        const totalPages = 100; // Default value
        const percentageComplete = Math.min(100, Math.round((pagesRead / totalPages) * 100));

        // Insert new record
        const { data, error } = await client
          .from('reading_stats')
          .insert({
            user_id: userId,
            book_id: bookUuid,
            total_reading_time: timeSpentSeconds,
            pages_read: pagesRead,
            percentage_complete: percentageComplete,
            last_session_date: now
          })
          .select()
          .single();

        if (error) {
          appLog('BackendService', 'Error creating reading stats', 'error', error);
        } else {
          appLog('BackendService', 'Reading stats created successfully', 'success');
        }

        return { data, error };
      }
    } catch (error) {
      appLog('BackendService', 'Unexpected error in updateReadingStats', 'error', error);
      return { data: null, error };
    }
  } else {
    appLog('BackendService', 'Using mock backend for updateReadingStats', 'info');
    return mockBackend.progress.updateReadingStats(userId, bookId, timeSpentSeconds, pagesRead);
  }
}

export async function getReadingStats(userId: string, bookId: string) {
  appLog('BackendService', 'Getting reading stats', 'info', { userId, bookId });

  if (await useRealBackend()) {
    try {
      // Convert string ID to UUID if needed
      const bookUuid = getBookUuid(bookId);
      appLog('BackendService', `Using book UUID: ${bookUuid}`, 'debug');

      const { data, error } = await client
        .from('reading_stats')
        .select('*')
        .eq('user_id', userId)
        .eq('book_id', bookUuid)
        .maybeSingle();

      if (error) {
        appLog('BackendService', 'Error fetching reading stats', 'error', error);
        throw error;
      }

      if (!data) {
        appLog('BackendService', 'No reading stats found', 'info');
        return { data: null, error: null };
      }

      appLog('BackendService', 'Reading stats found', 'success', {
        timeSpent: data.total_reading_time,
        pagesRead: data.pages_read
      });

      // If percentage_complete is already in the data, use it
      if (data.percentage_complete !== undefined) {
        appLog('BackendService', 'Using existing percentage_complete value', 'debug', { percentage: data.percentage_complete });
        return { data, error: null };
      }

      // Otherwise, get total pages to calculate percentage
      appLog('BackendService', 'Fetching book data to calculate percentage', 'info');
      const { data: bookData, error: bookError } = await client
        .from('books')
        .select('total_pages')
        .eq('id', bookUuid)
        .single();

      if (bookError) {
        appLog('BackendService', 'Error fetching book data', 'error', bookError);
        throw bookError;
      }

      appLog('BackendService', 'Book data found', 'success', { totalPages: bookData.total_pages });

      // Calculate percentage complete, ensuring it doesn't exceed 100%
      const percentageComplete = Math.min(100, Math.round((data.pages_read / bookData.total_pages) * 100));

      const statsData: BookStats = {
        ...data,
        percentage_complete: percentageComplete
      };

      appLog('BackendService', 'Reading stats assembled successfully', 'success', { percentageComplete });
      return { data: statsData, error: null };
    } catch (error) {
      appLog('BackendService', 'Error in getReadingStats', 'error', error);
      return { data: null, error };
    }
  } else {
    appLog('BackendService', 'Using mock backend for getReadingStats', 'info');
    return mockBackend.progress.getReadingStats(userId, bookId);
  }
}

// Database management services
export async function runDatabaseFixes(): Promise<{ success: boolean; message: string; results: any[] }> {
  appLog('BackendService', 'Starting database migration', 'info');

  try {
    // These migrations need to be run in sequence for dependencies
    const migrations = [
      // 1. Add last_read_at column to reading_progress
      {
        name: 'Add last_read_at column',
        sql: `ALTER TABLE reading_progress
              ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ DEFAULT NOW();`
      },

      // 2. Create reading_stats table
      {
        name: 'Create reading_stats table',
        sql: `CREATE TABLE IF NOT EXISTS reading_stats (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
                book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
                total_reading_time INT DEFAULT 0,
                pages_read INT DEFAULT 0,
                percentage_complete FLOAT DEFAULT 0,
                last_session_date TIMESTAMPTZ DEFAULT NOW(),
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(user_id, book_id)
              );`
      },

      // 3. Add indexes for reading_stats
      {
        name: 'Add indexes for reading_stats',
        sql: `CREATE INDEX IF NOT EXISTS idx_reading_stats_user_id ON reading_stats(user_id);
              CREATE INDEX IF NOT EXISTS idx_reading_stats_book_id ON reading_stats(book_id);`
      },

      // 4. Add string_id column to books
      {
        name: 'Add string_id column to books',
        sql: `ALTER TABLE books
              ADD COLUMN IF NOT EXISTS string_id TEXT;`
      },

      // 5. Update existing books with string IDs
      {
        name: 'Update books with string IDs',
        sql: `UPDATE books
              SET string_id = 'alice-in-wonderland'
              WHERE id = '550e8400-e29b-41d4-a716-446655440000'
              AND string_id IS NULL;`
      },

      // 6. Create book lookup function
      {
        name: 'Create book lookup function',
        sql: `CREATE OR REPLACE FUNCTION get_book_by_string_id(p_string_id TEXT)
              RETURNS TABLE (
                id UUID,
                title TEXT,
                author TEXT,
                description TEXT,
                total_pages INT,
                created_at TIMESTAMPTZ,
                string_id TEXT
              ) AS $$
              BEGIN
                RETURN QUERY
                SELECT b.id, b.title, b.author, b.description, b.total_pages, b.created_at, b.string_id
                FROM books b
                WHERE b.string_id = p_string_id;
              END;
              $$ LANGUAGE plpgsql;`
      },

      // 7. Set up RLS policies
      {
        name: 'Set up RLS policies',
        sql: `ALTER TABLE reading_stats ENABLE ROW LEVEL SECURITY;

              -- Drop existing policies if they exist
              DROP POLICY IF EXISTS "Users can view their own reading stats" ON reading_stats;
              DROP POLICY IF EXISTS "Users can update their own reading stats" ON reading_stats;
              DROP POLICY IF EXISTS "Users can insert their own reading stats" ON reading_stats;

              -- Create policies
              CREATE POLICY "Users can view their own reading stats"
              ON reading_stats FOR SELECT USING (user_id = auth.uid());

              CREATE POLICY "Users can update their own reading stats"
              ON reading_stats FOR UPDATE USING (user_id = auth.uid());

              CREATE POLICY "Users can insert their own reading stats"
              ON reading_stats FOR INSERT WITH CHECK (user_id = auth.uid());`
      },

      // 8. Create timestamp triggers
      {
        name: 'Create timestamp triggers',
        sql: `CREATE OR REPLACE FUNCTION update_timestamp()
              RETURNS TRIGGER AS $$
              BEGIN
                 NEW.updated_at = NOW();
                 RETURN NEW;
              END;
              $$ language 'plpgsql';

              DROP TRIGGER IF EXISTS update_reading_stats_timestamp ON reading_stats;
              CREATE TRIGGER update_reading_stats_timestamp
              BEFORE UPDATE ON reading_stats
              FOR EACH ROW
              EXECUTE FUNCTION update_timestamp();

              DROP TRIGGER IF EXISTS update_reading_progress_timestamp ON reading_progress;
              CREATE TRIGGER update_reading_progress_timestamp
              BEFORE UPDATE ON reading_progress
              FOR EACH ROW
              EXECUTE FUNCTION update_timestamp();`
      },

      // 9. Create get_tables function for diagnostics
      {
        name: 'Create get_tables function',
        sql: `CREATE OR REPLACE FUNCTION get_tables()
              RETURNS TABLE (
                table_name TEXT,
                row_count BIGINT,
                last_modified TIMESTAMPTZ
              ) AS $$
              BEGIN
                RETURN QUERY
                SELECT
                  t.table_name::TEXT,
                  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t.table_name)::BIGINT AS row_count,
                  NULL::TIMESTAMPTZ AS last_modified
                FROM
                  information_schema.tables t
                WHERE
                  t.table_schema = 'public'
                ORDER BY
                  t.table_name;
              END;
              $$ LANGUAGE plpgsql SECURITY DEFINER;

              -- Grant permission to authenticated users
              GRANT EXECUTE ON FUNCTION get_tables() TO authenticated;`
      }
    ];

    // Execute migrations in sequence and collect results
    const results = [];
    for (const migration of migrations) {
      appLog('BackendService', `Running migration: ${migration.name}`, 'info');

      try {
        const client = await getSupabaseClient();
        const { error } = await client.rpc('run_sql', { sql: migration.sql });

        if (error) {
          results.push({
            name: migration.name,
            success: false,
            error: error.message
          });
          appLog('BackendService', `Migration failed: ${migration.name}`, 'error', error);
        } else {
          results.push({
            name: migration.name,
            success: true
          });
          appLog('BackendService', `Migration successful: ${migration.name}`, 'success');
        }
      } catch (e) {
        // Try direct SQL execution if RPC fails
        try {
          const client = await getSupabaseClient();
          const { error } = await client.rpc('exec_sql', { query: migration.sql });

          if (error) {
            // One more fallback - try splitting the SQL into statements
            const statements = migration.sql.split(';').filter(s => s.trim());
            let statementSuccess = true;

            for (const statement of statements) {
              if (!statement.trim()) continue;

              const client = await getSupabaseClient();
              const { error: stmtError } = await client.rpc('exec_sql', {
                query: statement + ';'
              });

              if (stmtError) {
                statementSuccess = false;
                appLog('BackendService', `Statement failed: ${statement}`, 'error', stmtError);
              }
            }

            results.push({
              name: migration.name,
              success: statementSuccess,
              error: statementSuccess ? null : 'Failed to execute some statements'
            });
          } else {
            results.push({
              name: migration.name,
              success: true
            });
            appLog('BackendService', `Migration successful (via exec_sql): ${migration.name}`, 'success');
          }
        } catch (err) {
          results.push({
            name: migration.name,
            success: false,
            error: err.message
          });
          appLog('BackendService', `Migration failed with all methods: ${migration.name}`, 'error', err);
        }
      }
    }

    // Check if all migrations were successful
    const allSuccessful = results.every(r => r.success);

    if (allSuccessful) {
      appLog('BackendService', 'All database migrations completed successfully', 'success');
      return {
        success: true,
        message: 'Database schema updated successfully',
        results
      };
    } else {
      const failedMigrations = results.filter(r => !r.success).map(r => r.name).join(', ');
      appLog('BackendService', `Some migrations failed: ${failedMigrations}`, 'error');
      return {
        success: false,
        message: `Some migrations failed: ${failedMigrations}`,
        results
      };
    }
  } catch (error) {
    appLog('BackendService', 'Database migration failed', 'error', error);
    return {
      success: false,
      message: `Database migration failed: ${error.message}`,
      results: []
    };
  }
}

// AI interaction services
export async function saveAiInteraction(userId: string, bookId: string, question: string, response: string, sectionId?: string, context?: string) {
  if (await useRealBackend()) {
      // Get the Supabase client
      const client = await getSupabaseClient();

    const { data, error } = await client
      .from('ai_interactions')
      .insert({
        user_id: userId,
        book_id: bookId,
        section_id: sectionId || null,
        question,
        context: context || null,
        response
      })
      .select()
      .single();

    return { data, error };
  } else {
    return mockBackend.ai.saveAiInteraction(userId, bookId, question, response, sectionId, context);
  }
}

export async function getAiInteractions(userId: string, bookId: string) {
  if (await useRealBackend()) {
      // Get the Supabase client
      const client = await getSupabaseClient();

    const { data, error } = await client
      .from('ai_interactions')
      .select('*')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .order('created_at', { ascending: false });

    return { data, error };
  } else {
    return mockBackend.ai.getAiInteractions(userId, bookId);
  }
}

// AI Prompts services
export async function getAiPrompts(promptType: string) {
  if (await useRealBackend()) {
      // Get the Supabase client
      const client = await getSupabaseClient();

    const { data, error } = await client
      .from('ai_prompts')
      .select('*')
      .eq('prompt_type', promptType)
      .eq('active', true);

    return { data, error };
  } else {
    return mockBackend.ai.getAiPrompts(promptType);
  }
}

export async function savePromptResponse(userId: string, promptId: string, response: string) {
  if (await useRealBackend()) {
      // Get the Supabase client
      const client = await getSupabaseClient();

    const { data, error } = await client
      .from('user_prompt_responses')
      .insert({
        user_id: userId,
        prompt_id: promptId,
        response
      })
      .select()
      .single();

    return { data, error };
  } else {
    return mockBackend.ai.savePromptResponse(userId, promptId, response);
  }
}

// Consultant services
export async function getConsultantAssignments(consultantId: string) {
  if (await useRealBackend()) {
      // Get the Supabase client
      const client = await getSupabaseClient();

    const { data, error } = await client
      .from('consultant_assignments')
      .select('*, profiles!user_id(*)')
      .eq('consultant_id', consultantId)
      .eq('active', true);

    return { data, error };
  } else {
    return mockBackend.consultant.getConsultantAssignments(consultantId);
  }
}

export async function assignConsultant(consultantId: string, userId: string, bookId: string) {
  if (await useRealBackend()) {
      // Get the Supabase client
      const client = await getSupabaseClient();

    const { data, error } = await client
      .from('consultant_assignments')
      .insert({
        consultant_id: consultantId,
        user_id: userId,
        book_id: bookId,
        active: true
      })
      .select()
      .single();

    return { data, error };
  } else {
    return mockBackend.consultant.assignConsultant(consultantId, userId, bookId);
  }
}

export async function createTrigger(userId: string, bookId: string, triggerType: string, message?: string, consultantId?: string) {
  if (await useRealBackend()) {
      // Get the Supabase client
      const client = await getSupabaseClient();

    const { data, error } = await client
      .from('consultant_triggers')
      .insert({
        consultant_id: consultantId || null,
        user_id: userId,
        book_id: bookId,
        trigger_type: triggerType,
        message: message || null,
        is_processed: false
      })
      .select()
      .single();

    return { data, error };
  } else {
    return mockBackend.consultant.createTrigger(userId, bookId, triggerType, message, consultantId);
  }
}

export async function getTriggers(consultantId: string) {
  if (await useRealBackend()) {
      // Get the Supabase client
      const client = await getSupabaseClient();

    const { data, error } = await client
      .from('consultant_triggers')
      .select('*, profiles!user_id(*)')
      .eq('consultant_id', consultantId)
      .eq('is_processed', false);

    return { data, error };
  } else {
    return mockBackend.consultant.getTriggers(consultantId);
  }
}

export async function markTriggerProcessed(triggerId: string) {
  if (await useRealBackend()) {
      // Get the Supabase client
      const client = await getSupabaseClient();

    const now = new Date().toISOString();
    const { data, error } = await client
      .from('consultant_triggers')
      .update({
        is_processed: true,
        processed_at: now
      })
      .eq('id', triggerId)
      .select()
      .single();

    return { data, error };
  } else {
    return mockBackend.consultant.markTriggerProcessed(triggerId);
  }
}

// Check if user is a consultant
export async function isConsultant(userId: string) {
  if (await useRealBackend()) {
      // Get the Supabase client
      const client = await getSupabaseClient();

    // First check the profiles table
    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('is_consultant')
      .eq('id', userId)
      .single();

    if (profileError) {
      appLog('BackendService', 'Error checking consultant status in profiles', 'error', profileError);
      return { data: false, error: profileError };
    }

    if (profile?.is_consultant) {
      return { data: true, error: null };
    }

    // Then check the consultant_users table
    const { data: consultant, error: consultantError } = await client
      .from('consultant_users')
      .select('is_active')
      .eq('user_id', userId)
      .single();

    if (consultantError && consultantError.code !== 'PGRST116') { // PGRST116 is "not found"
      appLog('BackendService', 'Error checking consultant_users table', 'error', consultantError);
      return { data: false, error: consultantError };
    }

    return { data: consultant?.is_active || false, error: null };
  } else {
    return mockBackend.consultant.isConsultant(userId);
  }
}

// User Feedback services
export async function submitFeedback(userId: string, bookId: string, feedbackType: FeedbackType, content: string, sectionId?: string, isPublic: boolean = false) {
  if (await useRealBackend()) {
      // Get the Supabase client
      const client = await getSupabaseClient();

    const { data, error } = await client
      .from('user_feedback')
      .insert({
        user_id: userId,
        book_id: bookId,
        section_id: sectionId || null,
        feedback_type: feedbackType,
        content,
        is_public: isPublic
      })
      .select()
      .single();

    return { data, error };
  } else {
    return mockBackend.consultant.submitFeedback(userId, bookId, feedbackType, content, sectionId, isPublic);
  }
}

export async function getUserFeedback(userId: string, bookId: string) {
  if (await useRealBackend()) {
      // Get the Supabase client
      const client = await getSupabaseClient();

    const { data, error } = await client
      .from('user_feedback')
      .select(`
        *,
        sections!inner (*),
        sections!inner (chapters!inner (*))
      `)
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .order('created_at', { ascending: false });

    // Transform the data to match the UserFeedback type
    const transformedData = data?.map(item => ({
      ...item,
      section: item.sections ? {
        title: item.sections.title,
        chapter_title: item.sections.chapters.title
      } : undefined
    }));

    return { data: transformedData, error };
  } else {
    return mockBackend.consultant.getUserFeedback(userId, bookId);
  }
}

export async function getPublicFeedback(bookId: string) {
  if (await useRealBackend()) {
      // Get the Supabase client
      const client = await getSupabaseClient();

    const { data, error } = await client
      .from('user_feedback')
      .select(`
        *,
        profiles!user_id (*),
        sections (*),
        sections (chapters (*))
      `)
      .eq('book_id', bookId)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    // Transform the data to match the UserFeedback type
    const transformedData = data?.map(item => ({
      ...item,
      user: item.profiles,
      section: item.sections ? {
        title: item.sections.title,
        chapter_title: item.sections.chapters.title
      } : undefined
    }));

    return { data: transformedData, error };
  } else {
    return mockBackend.consultant.getPublicFeedback(bookId);
  }
}

// Help Request services
export async function submitHelpRequest(userId: string, bookId: string, content: string, sectionId?: string, context?: string) {
  if (await useRealBackend()) {
      // Get the Supabase client
      const client = await getSupabaseClient();

    const { data, error } = await client
      .from('help_requests')
      .insert({
        user_id: userId,
        book_id: bookId,
        section_id: sectionId || null,
        status: HelpRequestStatus.PENDING,
        content,
        context: context || null
      })
      .select()
      .single();

    return { data, error };
  } else {
    return mockBackend.consultant.submitHelpRequest(userId, bookId, content, sectionId, context);
  }
}

export async function getUserHelpRequests(userId: string, bookId: string) {
  if (await useRealBackend()) {
      // Get the Supabase client
      const client = await getSupabaseClient();

    const { data, error } = await client
      .from('help_requests')
      .select(`
        *,
        profiles!assigned_to (*),
        sections (*),
        sections (chapters (*))
      `)
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .order('created_at', { ascending: false });

    // Transform the data to match the HelpRequest type
    const transformedData = data?.map(item => ({
      ...item,
      consultant: item.profiles,
      section: item.sections ? {
        title: item.sections.title,
        chapter_title: item.sections.chapters.title
      } : undefined
    }));

    return { data: transformedData, error };
  } else {
    return mockBackend.consultant.getUserHelpRequests(userId, bookId);
  }
}

export async function getConsultantHelpRequests(consultantId: string) {
  if (await useRealBackend()) {
      // Get the Supabase client
      const client = await getSupabaseClient();

    const { data, error } = await client
      .from('help_requests')
      .select(`
        *,
        profiles!user_id (*),
        sections (*),
        sections (chapters (*))
      `)
      .eq('assigned_to', consultantId)
      .order('created_at', { ascending: false });

    // Transform the data to match the HelpRequest type
    const transformedData = data?.map(item => ({
      ...item,
      user: item.profiles,
      section: item.sections ? {
        title: item.sections.title,
        chapter_title: item.sections.chapters.title
      } : undefined
    }));

    return { data: transformedData, error };
  } else {
    return mockBackend.consultant.getConsultantHelpRequests(consultantId);
  }
}

export async function getPendingHelpRequests() {
  if (await useRealBackend()) {
      // Get the Supabase client
      const client = await getSupabaseClient();

    const { data, error } = await client
      .from('help_requests')
      .select(`
        *,
        profiles!user_id (*),
        sections (*),
        sections (chapters (*))
      `)
      .eq('status', HelpRequestStatus.PENDING)
      .is('assigned_to', null)
      .order('created_at', { ascending: true });

    // Transform the data to match the HelpRequest type
    const transformedData = data?.map(item => ({
      ...item,
      user: item.profiles,
      section: item.sections ? {
        title: item.sections.title,
        chapter_title: item.sections.chapters.title
      } : undefined
    }));

    return { data: transformedData, error };
  } else {
    return mockBackend.consultant.getPendingHelpRequests();
  }
}

export async function updateHelpRequestStatus(requestId: string, status: HelpRequestStatus, consultantId?: string) {
  if (await useRealBackend()) {
      // Get the Supabase client
      const client = await getSupabaseClient();

    const updates: any = { status };

    if (status === HelpRequestStatus.IN_PROGRESS && consultantId) {
      updates.assigned_to = consultantId;
    }

    if (status === HelpRequestStatus.RESOLVED) {
      updates.resolved_at = new Date().toISOString();
    }

    const { data, error } = await client
      .from('help_requests')
      .update(updates)
      .eq('id', requestId)
      .select()
      .single();

    return { data, error };
  } else {
    return mockBackend.consultant.updateHelpRequestStatus(requestId, status, consultantId);
  }
}

// Consultant Action Logging
export async function logConsultantAction(consultantId: string, userId: string, actionType: string, details?: any) {
  if (await useRealBackend()) {
      // Get the Supabase client
      const client = await getSupabaseClient();

    const { data, error } = await client
      .from('consultant_actions_log')
      .insert({
        consultant_id: consultantId,
        user_id: userId,
        action_type: actionType,
        details: details || null
      })
      .select()
      .single();

    return { data, error };
  } else {
    return mockBackend.consultant.logConsultantAction(consultantId, userId, actionType, details);
  }
}

// Database migration function (for backward compatibility)
export async function runAdditionalDatabaseFixes() {
  try {
    appLog('BackendService', 'Running database fixes using migration system', 'info');

    // Import the database service
    const { getDatabaseService } = await import('./databaseService');
    const dbService = await getDatabaseService();

    // Get the highest migration ID
    const migrations = dbService.getAvailableMigrations();
    const highestVersion = Math.max(...migrations.map(m => m.id));

    // Apply all migrations
    const result = await dbService.applyMigrations(highestVersion);

    if (result.success) {
      appLog('BackendService', 'Database fixes completed successfully', 'success', result);
      return {
        success: true,
        message: `Successfully applied ${result.appliedMigrations.length} migrations: ${result.appliedMigrations.join(', ')}`
      };
    } else {
      appLog('BackendService', 'Database fixes failed', 'error', result);
      return { success: false, message: result.error || 'Unknown error' };
    }
  } catch (error) {
    appLog('BackendService', 'Error running database fixes', 'error', error);
    return {
      success: false,
      message: `Failed to run database fixes: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
