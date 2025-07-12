// src/services/supabaseClient.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { appLog } from '../components/LogViewer';
import { Database } from '../types/supabase';
import { Book, Chapter, Section, BookWithChapters, SectionWithChapter } from '../types/book';

// Configuration
const MAX_RETRIES = 5;
const RETRY_DELAY = 500; // ms
const CONNECTION_CHECK_INTERVAL = 30000; // 30 seconds
const MAX_RETRY_DELAY = 10000; // Maximum delay between retries (10s)

// Get credentials from either environment variables or window fallbacks
const getSupabaseCredentials = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || window.ENV_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || window.ENV_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase credentials not found in environment or window globals');
  }

  return { supabaseUrl, supabaseAnonKey };
};

// Client instance cache
let supabaseClient: SupabaseClient<Database> | null = null;
let lastInitTime = 0;

// Handler for standard Supabase errors
export const handleSupabaseError = (error: any, context: string = 'Supabase') => {
  if (!error) return;

  // Handle different error types
  if (typeof error === 'string') {
    appLog('SupabaseClient', `${context}: ${error}`, 'error');
  } else if (error.message) {
    appLog('SupabaseClient', `${context}: ${error.message}`, 'error', {
      code: error.code,
      details: error.details
    });
  } else {
    appLog('SupabaseClient', `${context}: Unknown error format`, 'error', error);
  }
};

// Async getter for the Supabase client
export const getSupabaseClient = async (): Promise<SupabaseClient<Database>> => {
  const now = Date.now();

  try {
    // Check if we need to create a new client or refresh the existing one
    if (!supabaseClient || now - lastInitTime > CONNECTION_CHECK_INTERVAL) {
      appLog('SupabaseClient', 'Initializing Supabase client', supabaseClient ? 'info' : 'debug');

      const { supabaseUrl, supabaseAnonKey } = getSupabaseCredentials();

      // Create a new client with proxy support
      supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true
        }
      });

      lastInitTime = now;
    }

    return supabaseClient;
  } catch (error) {
    handleSupabaseError(error, 'Client initialization');
    throw error;
  }
};

// Retry utility function with improved timeout handling
export const executeWithRetries = async <T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> => {
  let retries = 0;
  let delay = RETRY_DELAY;
  const startTimeTotal = Date.now();

  while (retries < MAX_RETRIES) {
    try {
      const startTime = Date.now();
      appLog('SupabaseClient', `Executing ${operationName} (attempt ${retries + 1}/${MAX_RETRIES})`, 'debug');

      const result = await operation();

      const elapsed = Date.now() - startTime;
      if (elapsed > 2000) {
        appLog('SupabaseClient', `${operationName} completed in ${elapsed}ms (slow operation)`, 'warning');
      } else {
        appLog('SupabaseClient', `${operationName} completed in ${elapsed}ms`, 'debug');
      }

      return result;
    } catch (error: any) {
      retries++;

      const isNetworkError = error.message?.includes('network') ||
        error.message?.includes('timeout') ||
        error.message?.includes('connection');

      const isRateLimitError = error.code === '429' ||
        error.message?.includes('rate limit') ||
        error.message?.includes('too many requests');

      // Don't wait so long between retries - use a more aggressive retry strategy
      // If total time spent is getting too long (> 5 seconds), stop retrying
      const totalElapsed = Date.now() - startTimeTotal;
      if (totalElapsed > 5000) {
        appLog('SupabaseClient', `${operationName} taking too long (${totalElapsed}ms) - giving up after ${retries} attempts`, 'error');
        throw error;
      }

      const errorLevel = retries >= MAX_RETRIES ? 'error' : 'warning';
      // Log with appropriate level before calling handleSupabaseError
      appLog('SupabaseClient', `${operationName} attempt ${retries}/${MAX_RETRIES} failed: ${error.message}`, errorLevel);
      handleSupabaseError(error, `${operationName} (attempt ${retries}/${MAX_RETRIES})`);

      if (retries >= MAX_RETRIES) {
        appLog('SupabaseClient', `${operationName} failed after ${MAX_RETRIES} attempts`, 'error');
        throw error;
      }

      // Use a faster retry strategy - linear backoff with smaller increase
      // Only use longer delays for rate limit errors
      if (isRateLimitError) {
        // For rate limits, still use exponential but with smaller multiplier
        delay = Math.min(delay * 1.5, MAX_RETRY_DELAY);
      } else {
        // For other errors, use much smaller linear backoff
        delay = Math.min(RETRY_DELAY * (retries + 0.5), 2000);
      }

      appLog('SupabaseClient', `Retrying ${operationName} in ${Math.round(delay)}ms (${isNetworkError ? 'network issue' : isRateLimitError ? 'rate limit' : 'error'})`, 'debug');
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error(`Failed ${operationName} after ${MAX_RETRIES} retries`);
};

// Helper function to get user profile with retry logic
export async function getUserProfile(userId: string) {
  appLog('SupabaseClient', `Fetching profile for user: ${userId}`, 'info');
  return await executeWithRetries(async () => {
    const client = await getSupabaseClient();
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      appLog('SupabaseClient', `Error fetching profile for user ${userId}:`, 'error', error.message);
      throw error;
    }

    appLog('SupabaseClient', `Profile fetched successfully for user ${userId}`, 'success');
    return data;
  }, 'getUserProfile');
}

// Helper function to create user profile with retry logic
export async function createUserProfile(
  userId: string,
  firstName: string,
  lastName: string,
  email: string
) {
  appLog('SupabaseClient', `Creating profile for user: ${userId}`, 'info');
  console.log('SupabaseClient: Creating profile for user:', userId, { firstName, lastName, email });

  try {
    // First check if profile already exists
    const client = await getSupabaseClient();
    const { data: existingProfile, error: checkError } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    console.log('SupabaseClient: Profile check result:', { existingProfile, checkError });

    if (existingProfile) {
      // Profile exists, update it
      appLog('SupabaseClient', `Profile already exists for user ${userId}, updating it`, 'info');
      console.log('SupabaseClient: Profile already exists, updating it');

      const { data: updatedProfile, error: updateError } = await client
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          email: email,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      console.log('SupabaseClient: Profile update result:', { updatedProfile, updateError });

      if (updateError) {
        appLog('SupabaseClient', `Error updating profile for user ${userId}:`, 'error', updateError.message);
        console.error('SupabaseClient: Error updating profile:', updateError);
        throw updateError;
      }

      appLog('SupabaseClient', `Profile updated successfully for user ${userId}`, 'success');
      console.log('SupabaseClient: Profile updated successfully');
      return updatedProfile;
    } else {
      // Profile doesn't exist, create it
      appLog('SupabaseClient', `Creating new profile for user ${userId}`, 'info');
      console.log('SupabaseClient: Creating new profile');

      return await executeWithRetries(async () => {
        const { data, error } = await client
          .from('profiles')
          .insert({
            id: userId,
            first_name: firstName,
            last_name: lastName,
            email: email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        console.log('SupabaseClient: Profile creation result:', { data, error });

        if (error) {
          appLog('SupabaseClient', `Error creating profile for user ${userId}:`, 'error', error.message);
          console.error('SupabaseClient: Error creating profile:', error);
          throw error;
        }

        appLog('SupabaseClient', `Profile created successfully for user ${userId}`, 'success');
        console.log('SupabaseClient: Profile created successfully');
        return data;
      }, 'createUserProfile');
    }
  } catch (error) {
    appLog('SupabaseClient', `Error in createUserProfile for user ${userId}:`, 'error', error);
    console.error('SupabaseClient: Error in createUserProfile:', error);
    throw error;
  }
}

// Helper function to update user profile with retry logic
export async function updateUserProfile(
  userId: string,
  updates: {
    first_name?: string;
    last_name?: string;
    email?: string;
    book_verified?: boolean;
  }
) {
  appLog('SupabaseClient', `Updating profile for user: ${userId}`, 'info');
  console.log(`SupabaseClient: Updating profile for user: ${userId}`, updates);

  return await executeWithRetries(async () => {
    const client = await getSupabaseClient();

    try {
      // Single direct update method - no fallback to non-existent RPC
      const { data, error } = await client
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        appLog('SupabaseClient', `Error updating profile for user ${userId}: ${error.message}`, 'error');
        console.error('SupabaseClient: Error updating profile:', error);
        throw error;
      }

      appLog('SupabaseClient', `Profile updated successfully for user ${userId}`, 'success');
      console.log('SupabaseClient: Profile updated successfully:', data);
      return data;
    } catch (error) {
      appLog('SupabaseClient', `Error updating profile for user ${userId}:`, 'error', error);
      console.error('SupabaseClient: Error updating profile:', error);
      throw error;
    }
  }, 'updateUserProfile');
}

// Helper function for fast profile update using the database function
export async function fastProfileUpdate(
  userId: string,
  updates: {
    first_name?: string;
    last_name?: string;
    email?: string;
    book_verified?: boolean;
  }
) {
  try {
    console.log('SupabaseClient: Using fast profile update for user:', userId, updates);
    const client = await getSupabaseClient();

    const { data, error } = await client
      .rpc('fast_profile_update', {
        user_id: userId,
        first_name: updates.first_name || null,
        last_name: updates.last_name || null,
        email: updates.email || null,
        book_verified: updates.book_verified === undefined ? null : updates.book_verified
      });

    if (error) {
      console.error('SupabaseClient: Fast profile update failed:', error);
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('SupabaseClient: Error in fast profile update:', error);
    return { data: null, error };
  }
}

// Modify verifyBookCode to use the fast update function
export async function verifyBookCode(code: string, userId: string, firstName?: string, lastName?: string) {
  try {
    appLog('SupabaseClient', `Verifying book code: ${code} for user: ${userId}`, 'info');
    console.log(`DEBUG: Verifying book code: ${code} for user: ${userId}`);
    console.log(`DEBUG: First name: ${firstName}, Last name: ${lastName}`);

    // Get the client using the async getter
    const client = await getSupabaseClient();

    // Check if code exists and is not used
    const { data, error } = await client
      .from('verification_codes')
      .select('*, books(id, title, author)')
      .eq('code', code.toUpperCase())
      .single();

    console.log('DEBUG: Verification code check result:', { data, error });

    if (error || !data) {
      appLog('SupabaseClient', 'Invalid verification code', 'error', error);
      console.log('DEBUG: Invalid verification code:', error);
      return { success: false, error: 'Invalid verification code' };
    }

    if (data.is_used) {
      appLog('SupabaseClient', 'Code already used', 'warning');
      console.log('DEBUG: Code already used');
      return { success: false, error: 'This code has already been used' };
    }

    // Mark code as used and update profile in parallel to save time
    const codePromise = client
      .from('verification_codes')
      .update({
        is_used: true,
        used_by: userId
      })
      .eq('code', code.toUpperCase());

    // Update the user's profile to mark them as verified
    const updates: any = {
      book_verified: true,
      // Add first name and last name if provided
      ...(firstName ? { first_name: firstName } : {}),
      ...(lastName ? { last_name: lastName } : {})
    };

    console.log('DEBUG: Profile updates to apply:', updates);

    // Try to use the fast profile update function first
    const profilePromise = fastProfileUpdate(userId, updates);

    // Wait for both operations to complete (parallel)
    const [codeResult, profileResult] = await Promise.all([codePromise, profilePromise]);

    // Check for errors in code update
    if (codeResult.error) {
      appLog('SupabaseClient', 'Error updating verification code', 'error', codeResult.error);
      console.log('DEBUG: Error updating verification code:', codeResult.error);
      return { success: false, error: 'Error updating verification code' };
    }

    // Check for errors in profile update
    if (profileResult.error) {
      appLog('SupabaseClient', 'Error updating profile', 'error', profileResult.error);
      console.log('DEBUG: Error updating profile:', profileResult.error);
      return {
        success: false,
        error: `Profile update failed: ${String(profileResult.error)}`,
        verificationStatus: 'code_marked_used_profile_update_failed'
      };
    }

    console.log('DEBUG: Profile updated successfully:', profileResult.data);
    appLog('SupabaseClient', 'Book code verified successfully', 'success');
    return { success: true, data };
  } catch (error: any) {
    appLog('SupabaseClient', 'Error verifying book code', 'error', error);
    console.log('DEBUG: Error verifying book code:', error);
    return { success: false, error: 'Error verifying book code' };
  }
}

// Helper function to get a book with all its chapters and sections
export async function getBookWithChapters(bookId: string): Promise<BookWithChapters | null> {
  try {
    appLog('SupabaseClient', `Getting book with chapters: ${bookId}`, 'info');

    // Get the client using the async getter
    const client = await getSupabaseClient();

    // First get the book
    const { data: book, error: bookError } = await client
      .from('books')
      .select('*')
      .eq('id', bookId)
      .single();

    if (bookError) {
      appLog('SupabaseClient', 'Error fetching book', 'error', bookError);
      return null;
    }

    // Then get all chapters for this book
    const { data: chapters, error: chaptersError } = await client
      .from('chapters')
      .select('*')
      .eq('book_id', bookId)
      .order('number');

    if (chaptersError) {
      appLog('SupabaseClient', 'Error fetching chapters', 'error', chaptersError);
      return null;
    }

    // For each chapter, get its sections
    const chaptersWithSections = await Promise.all(
      chapters.map(async (chapter) => {
        const { data: sections, error: sectionsError } = await client
          .from('sections')
          .select('*')
          .eq('chapter_id', chapter.id)
          .order('number');

        if (sectionsError) {
          appLog('SupabaseClient', `Error fetching sections for chapter ${chapter.id}`, 'error', sectionsError);
          return { ...chapter, sections: [] };
        }

        return {
          ...chapter,
          sections: sections || []
        };
      })
    );

    return {
      ...book,
      chapters: chaptersWithSections
    };
  } catch (error) {
    appLog('SupabaseClient', 'Error in getBookWithChapters', 'error', error);
    return null;
  }
}

// Helper function to get sections for a specific page
export async function getSectionsForPage(bookId: string, pageNumber: number): Promise<SectionWithChapter[] | null> {
  try {
    appLog('SupabaseClient', `Getting sections for page: ${pageNumber} in book: ${bookId}`, 'info');

    // Get the client using the async getter
    const client = await getSupabaseClient();

    const { data, error } = await client
      .rpc('get_sections_for_page', {
        book_id_param: bookId,
        page_number_param: pageNumber
      });

    if (error) {
      appLog('SupabaseClient', 'Error fetching sections for page', 'error', error);
      return null;
    }

    return data as SectionWithChapter[];
  } catch (error) {
    appLog('SupabaseClient', 'Error in getSectionsForPage', 'error', error);
    return null;
  }
}

// Helper function to get a definition
export async function getDefinition(bookId: string, term: string): Promise<string | null> {
  try {
    appLog('SupabaseClient', `Getting definition for term: ${term} in book: ${bookId}`, 'info');

    // Get the client using the async getter
    const client = await getSupabaseClient();

    const { data, error } = await client
      .from('dictionary')
      .select('definition')
      .eq('book_id', bookId)
      .ilike('term', term)
      .single();

    if (error) {
      appLog('SupabaseClient', 'Error fetching definition', 'error', error);
      return null;
    }

    return data.definition;
  } catch (error) {
    appLog('SupabaseClient', 'Error in getDefinition', 'error', error);
    return null;
  }
}

// Helper function to save reading progress
export async function saveReadingProgress(
  userId: string,
  bookId: string,
  sectionId: string,
  position?: string
): Promise<boolean> {
  try {
    appLog('SupabaseClient', `Saving reading progress for user: ${userId}, book: ${bookId}, section: ${sectionId}`, 'info');

    // Get the client using the async getter
    const client = await getSupabaseClient();

    // Check if a record already exists
    const { data: existing, error: queryError } = await client
      .from('reading_progress')
      .select('id')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .single();

    if (queryError && queryError.code !== 'PGRST116') { // PGRST116 is code for "no rows returned"
      appLog('SupabaseClient', 'Error checking existing progress', 'error', queryError);
      return false;
    }

    const now = new Date().toISOString();

    if (existing) {
      // Update existing record
      const { error } = await client
        .from('reading_progress')
        .update({
          section_id: sectionId,
          last_position: position || null,
          updated_at: now
        })
        .eq('id', existing.id);

      if (error) {
        appLog('SupabaseClient', 'Error updating reading progress', 'error', error);
        return false;
      }

      appLog('SupabaseClient', 'Reading progress updated successfully', 'success');
    } else {
      // Insert new record
      const { error } = await client
        .from('reading_progress')
        .insert({
          user_id: userId,
          book_id: bookId,
          section_id: sectionId,
          last_position: position || null,
          updated_at: now
        });

      if (error) {
        appLog('SupabaseClient', 'Error inserting reading progress', 'error', error);
        return false;
      }

      appLog('SupabaseClient', 'Reading progress created successfully', 'success');
    }

    return true;
  } catch (error) {
    appLog('SupabaseClient', 'Error in saveReadingProgress', 'error', error);
    return false;
  }
}

// Helper function to get user's reading progress for a book
export async function getReadingProgress(userId: string, bookId: string): Promise<any | null> {
  try {
    appLog('SupabaseClient', `Getting reading progress for user: ${userId}, book: ${bookId}`, 'info');

    // Get the client using the async getter
    const client = await getSupabaseClient();

    const { data, error } = await client
      .from('reading_progress')
      .select(`
        id,
        user_id,
        book_id,
        section_id,
        last_position,
        last_read_at,
        updated_at,
        sections (
          id,
          title,
          content,
          page_number,
          chapter_id,
          chapters (
            id,
            title,
            number
          )
        )
      `)
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // If no progress is found, that's not an error
      if (error.code === 'PGRST116') {
        appLog('SupabaseClient', 'No reading progress found', 'info');
        return null;
      }

      appLog('SupabaseClient', 'Error fetching reading progress', 'error', error);
      return null;
    }

    return data;
  } catch (error) {
    appLog('SupabaseClient', 'Error in getReadingProgress', 'error', error);
    return null;
  }
}

// Diagnostic function for testing profile updates
export async function testProfileUpdate(userId: string, updates: any): Promise<{success: boolean, error?: any, data?: any}> {
  try {
    appLog('SupabaseClient', `TEST ONLY: Attempting direct profile update for user: ${userId}`, 'info', updates);

    // First, try to get the profile to ensure it exists
    const client = await getSupabaseClient();
    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      appLog('SupabaseClient', `TEST ONLY: Error getting profile for ${userId}:`, 'error', profileError);
      return { success: false, error: profileError, data: { method: 'get_profile' } };
    }

    appLog('SupabaseClient', `TEST ONLY: Profile exists for ${userId}:`, 'info', profile);

    // Try the update using different methods to diagnose issues

    // Method 1: Direct update with .update().eq()
    try {
      const { data: updateData1, error: updateError1 } = await client
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select();

      if (updateError1) {
        appLog('SupabaseClient', `TEST ONLY: Error with Method 1 update for ${userId}:`, 'error', updateError1);
      } else {
        appLog('SupabaseClient', `TEST ONLY: Method 1 update successful for ${userId}:`, 'success', updateData1);
        return { success: true, data: { method: 'direct_update', result: updateData1 } };
      }
    } catch (error) {
      appLog('SupabaseClient', `TEST ONLY: Exception with Method 1 update for ${userId}:`, 'error', error);
    }

    // Method 2: RPC call (if available)
    try {
      const { data: updateData2, error: updateError2 } = await client
        .rpc('update_profile', {
          user_id: userId,
          profile_updates: updates
        });

      if (updateError2) {
        appLog('SupabaseClient', `TEST ONLY: Error with Method 2 (RPC) update for ${userId}:`, 'error', updateError2);
      } else {
        appLog('SupabaseClient', `TEST ONLY: Method 2 (RPC) update successful for ${userId}:`, 'success', updateData2);
        return { success: true, data: { method: 'rpc_update', result: updateData2 } };
      }
    } catch (error) {
      appLog('SupabaseClient', `TEST ONLY: Exception with Method 2 (RPC) update for ${userId}:`, 'error', error);
    }

    // Method 3: Service role client if available (bypasses RLS)
    // Only attempt this if you have access to the service role key in your testing environment
    try {
      // This is just a diagnostic test - in production, never expose service role keys in client code
      const serviceRoleClient = client; // In real test, this would be configured with service role key

      const { data: updateData3, error: updateError3 } = await serviceRoleClient
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select();

      if (updateError3) {
        appLog('SupabaseClient', `TEST ONLY: Error with Method 3 (service role) update for ${userId}:`, 'error', updateError3);
      } else {
        appLog('SupabaseClient', `TEST ONLY: Method 3 (service role) update successful for ${userId}:`, 'success', updateData3);
        return { success: true, data: { method: 'service_role_update', result: updateData3 } };
      }
    } catch (error) {
      appLog('SupabaseClient', `TEST ONLY: Exception with Method 3 (service role) update for ${userId}:`, 'error', error);
    }

    return { success: false, error: 'All update methods failed' };
  } catch (error) {
    appLog('SupabaseClient', `TEST ONLY: Error in testProfileUpdate:`, 'error', error);
    return { success: false, error };
  }
}

// Function to check if Supabase connection is available
export const checkSupabaseConnection = async (force: boolean = false): Promise<boolean> => {
  try {
    appLog('SupabaseClient', 'Checking Supabase connection', 'info');

    // Get the client using the async getter
    const client = await getSupabaseClient();

    // Try a simple query to check connection
    const { data, error } = await client
      .from('books')
      .select('id')
      .limit(1);

    if (error) {
      appLog('SupabaseClient', `Supabase connection check failed: ${error.message}`, 'error');
      return false;
    }

    appLog('SupabaseClient', 'Supabase connection check successful', 'success');
    return true;
  } catch (error) {
    appLog('SupabaseClient', `Supabase connection check error: ${error instanceof Error ? error.message : String(error)}`, 'error');
    return false;
  }
};

// Default export for new code
export default getSupabaseClient;