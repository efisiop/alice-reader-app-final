// src/services/supabaseClient.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database, BookWithChapters, SectionWithChapter, BookProgress, BookStats } from '../types/supabase';
import { appLog } from '../components/LogViewer';

// Configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms
const CONNECTION_CHECK_INTERVAL = 30000; // 30 seconds

// Get credentials from either environment variables or window fallbacks
const getSupabaseCredentials = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || window.SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || window.SUPABASE_KEY;

  // Log which source we're using for credentials in development
  if (import.meta.env.DEV) {
    if (import.meta.env.VITE_SUPABASE_URL) {
      appLog('SupabaseClient', 'Using Supabase URL from environment variables', 'debug');
    } else if (window.SUPABASE_URL) {
      appLog('SupabaseClient', 'Using Supabase URL from window fallback', 'debug');
    }

    if (import.meta.env.VITE_SUPABASE_ANON_KEY) {
      appLog('SupabaseClient', 'Using Supabase key from environment variables', 'debug');
    } else if (window.SUPABASE_KEY) {
      appLog('SupabaseClient', 'Using Supabase key from window fallback', 'debug');
    }
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    appLog('SupabaseClient', 'Missing Supabase credentials. Application may not function correctly.', 'error');
  }

  return { supabaseUrl, supabaseAnonKey };
};

// Centralized error handler
export const handleSupabaseError = (error: any, operation: string): void => {
  appLog('SupabaseClient', `Supabase ${operation} error`, 'error', error);
};

// Connection status tracking
let connectionStatus = {
  isConnected: false,
  lastChecked: 0,
  checkInProgress: false
};

// Singleton client instance
let supabaseClient: SupabaseClient<Database> | null = null;

// Initialize client with error handling
export const initializeSupabaseClient = async (): Promise<SupabaseClient<Database>> => {
  if (supabaseClient) return supabaseClient;

  const { supabaseUrl, supabaseAnonKey } = getSupabaseCredentials();

  if (!supabaseUrl || !supabaseAnonKey) {
    const error = new Error('Missing Supabase credentials');
    handleSupabaseError(error, 'initialization');
    throw error;
  }

  try {
    appLog('SupabaseClient', 'Creating Supabase client...', 'info');
    supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
    appLog('SupabaseClient', 'Supabase client created successfully', 'success');

    // Verify connection
    const isConnected = await checkSupabaseConnection(true);
    if (!isConnected) {
      appLog('SupabaseClient', 'Supabase client created but connection test failed', 'warning');
    }

    return supabaseClient;
  } catch (error) {
    handleSupabaseError(error, 'initialization');
    supabaseClient = null;
    throw new Error('Failed to initialize Supabase client');
  }
};

// Connection status check
export const checkSupabaseConnection = async (force: boolean = false): Promise<boolean> => {
  // Skip check if one is already in progress
  if (connectionStatus.checkInProgress && !force) {
    return connectionStatus.isConnected;
  }

  // Skip check if we checked recently (within last 5 seconds) unless forced
  const now = Date.now();
  if (!force && now - connectionStatus.lastChecked < 5000) {
    return connectionStatus.isConnected;
  }

  connectionStatus.checkInProgress = true;

  try {
    appLog('SupabaseClient', 'Testing Supabase connection...', 'debug');

    if (!supabaseClient) {
      const { supabaseUrl, supabaseAnonKey } = getSupabaseCredentials();
      if (!supabaseUrl || !supabaseAnonKey) {
        connectionStatus.isConnected = false;
        return false;
      }

      // Create a temporary client just for the check
      const tempClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
      const { error } = await tempClient.from('books').select('id').limit(1);
      connectionStatus.isConnected = !error;
    } else {
      // Use existing client
      const { error } = await supabaseClient.from('books').select('id').limit(1);
      connectionStatus.isConnected = !error;
    }

    connectionStatus.lastChecked = now;

    if (connectionStatus.isConnected) {
      appLog('SupabaseClient', 'Supabase connection test successful', 'success');
    } else {
      appLog('SupabaseClient', 'Supabase connection test failed', 'warning');
    }

    return connectionStatus.isConnected;
  } catch (error) {
    handleSupabaseError(error, 'connection check');
    connectionStatus.isConnected = false;
    return false;
  } finally {
    connectionStatus.checkInProgress = false;
  }
};

// Start periodic connection checking
export const startConnectionMonitoring = () => {
  // Check immediately
  checkSupabaseConnection(true);

  // Then check periodically
  const interval = setInterval(() => {
    checkSupabaseConnection();
  }, CONNECTION_CHECK_INTERVAL);

  // Return cleanup function
  return () => clearInterval(interval);
};

// Retry utility function
export const executeWithRetries = async <T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> => {
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      return await operation();
    } catch (error: any) {
      retries++;
      handleSupabaseError(error, `${operationName} (attempt ${retries}/${MAX_RETRIES})`);

      if (retries >= MAX_RETRIES) {
        throw error;
      }

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, retries - 1)));
    }
  }

  throw new Error(`Failed ${operationName} after ${MAX_RETRIES} retries`);
};

// Get the Supabase client (initializing if needed)
export const getSupabaseClient = async (): Promise<SupabaseClient<Database>> => {
  if (!supabaseClient) {
    return initializeSupabaseClient();
  }
  return supabaseClient;
};

// Test Supabase connection function (legacy compatibility)
export async function testConnection() {
  try {
    appLog('SupabaseClient', 'Testing Supabase connection...', 'info');

    const isConnected = await checkSupabaseConnection(true);

    if (!isConnected) {
      return { success: false, error: new Error('Connection test failed') };
    }

    // Get some actual data to return
    const client = await getSupabaseClient();
    const { data, error } = await client.from('books').select('title').limit(1);

    if (error) {
      appLog('SupabaseClient', 'Supabase data fetch failed', 'error', error);
      return { success: false, error };
    }

    appLog('SupabaseClient', 'Supabase connection successful!', 'success', data);
    return { success: true, data };
  } catch (err) {
    appLog('SupabaseClient', 'Supabase connection test error', 'error', err);
    return { success: false, error: err };
  }
}

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

    if (error) {
      appLog('SupabaseClient', `Error creating profile for user ${userId}:`, 'error', error.message);
      throw error;
    }

    appLog('SupabaseClient', `Profile created successfully for user ${userId}`, 'success');
    return data;
  }, 'createUserProfile');
}

// Helper function to update user profile with retry logic
export async function updateUserProfile(
  userId: string,
  updates: {
    first_name?: string;
    last_name?: string;
    email?: string;
  }
) {
  appLog('SupabaseClient', `Updating profile for user: ${userId}`, 'info');
  return await executeWithRetries(async () => {
    const client = await getSupabaseClient();
    const { data, error } = await client
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      appLog('SupabaseClient', `Error updating profile for user ${userId}:`, 'error', error.message);
      throw error;
    }

    appLog('SupabaseClient', `Profile updated successfully for user ${userId}`, 'success');
    return data;
  }, 'updateUserProfile');
}

// Helper function to verify a book code
export async function verifyBookCode(code: string, userId: string, firstName?: string, lastName?: string) {
  try {
    appLog('SupabaseClient', `Verifying book code: ${code} for user: ${userId}`, 'info');

    // Get the client using the async getter
    const client = await getSupabaseClient();

    // Check if code exists and is not used
    const { data, error } = await client
      .from('verification_codes')
      .select('*, books(id, title, author)')
      .eq('code', code.toUpperCase())
      .single();

    if (error || !data) {
      appLog('SupabaseClient', 'Invalid verification code', 'error', error);
      return { success: false, error: 'Invalid verification code' };
    }

    if (data.is_used) {
      appLog('SupabaseClient', 'Code already used', 'warning');
      return { success: false, error: 'This code has already been used' };
    }

    // Mark code as used
    const { error: updateError } = await client
      .from('verification_codes')
      .update({
        is_used: true,
        used_by: userId
      })
      .eq('code', code.toUpperCase());

    if (updateError) {
      appLog('SupabaseClient', 'Error updating verification code', 'error', updateError);
      return { success: false, error: 'Error updating verification code' };
    }

    // Update the user's profile to mark them as verified
    const updates: any = { book_verified: true };
    
    // Add first name and last name if provided
    if (firstName) updates.first_name = firstName;
    if (lastName) updates.last_name = lastName;
    
    const { error: profileError } = await client
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (profileError) {
      appLog('SupabaseClient', 'Error updating user profile during verification', 'error', profileError);
      return { 
        success: false, 
        error: `Profile update failed: ${profileError.message}`,
        verificationStatus: 'code_marked_used_profile_update_failed'
      };
    } 

    appLog('SupabaseClient', 'User profile updated with verification info', 'success');
    appLog('SupabaseClient', 'Book code verified successfully', 'success');
    return { success: true, data };
  } catch (error) {
    appLog('SupabaseClient', 'Error verifying book code', 'error', error);
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
export async function getReadingProgress(userId: string, bookId: string): Promise<BookProgress | null> {
  try {
    appLog('SupabaseClient', `Getting reading progress for user: ${userId}, book: ${bookId}`, 'info');

    // Get the client using the async getter
    const client = await getSupabaseClient();

    const { data, error } = await client
      .from('reading_progress')
      .select(`
        *,
        section:section_id (
          *,
          chapter:chapter_id (
            title,
            number
          )
        )
      `)
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .single();

    if (error) {
      appLog('SupabaseClient', 'Error fetching reading progress', 'error', error);
      return null;
    }

    // Extract the relevant data for the BookProgress type
    const section = data.section as any;
    const chapter = section?.chapter as any;

    return {
      section_id: data.section_id,
      last_position: data.last_position,
      section_title: section?.title || 'Unknown Section',
      chapter_title: chapter?.title || 'Unknown Chapter',
      page_number: section?.start_page || 1
    };
  } catch (error) {
    appLog('SupabaseClient', 'Error in getReadingProgress', 'error', error);
    return null;
  }
}

// Helper function to save AI interaction
export async function saveAiInteraction(
  userId: string,
  bookId: string,
  question: string,
  response: string,
  sectionId?: string,
  context?: string
) {
  try {
    return await executeWithRetries(async () => {
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

      if (error) {
        appLog('SupabaseClient', 'Error saving AI interaction', 'error', error);
        throw error;
      }

      return data;
    }, 'saveAiInteraction');
  } catch (error) {
    appLog('SupabaseClient', 'Failed to save AI interaction after retries', 'error', error);
    return null;
  }
}

// Create and export a default client for backward compatibility
// This will be initialized on first access
let supabaseInstance: ReturnType<typeof createClient<Database>>;

// Initialize the client immediately for backward compatibility
try {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseCredentials();

  if (supabaseUrl && supabaseAnonKey) {
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey);
    appLog('SupabaseClient', 'Legacy Supabase client created successfully', 'info');

    // Start connection monitoring
    startConnectionMonitoring();
  } else {
    // Create a mock client that logs errors instead of throwing
    appLog('SupabaseClient', 'Creating mock client due to missing credentials', 'warning');
    const mockErrorHandler = () => ({ data: null, error: new Error('Supabase client not initialized') });

    supabaseInstance = {
      from: () => ({
        select: () => mockErrorHandler(),
        insert: () => mockErrorHandler(),
        update: () => mockErrorHandler(),
        delete: () => mockErrorHandler(),
        eq: () => ({ select: () => mockErrorHandler() }),
        single: () => mockErrorHandler(),
        limit: () => mockErrorHandler(),
        order: () => mockErrorHandler(),
      }),
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ data: { user: null }, error: new Error('Supabase client not initialized') }),
        signUp: () => Promise.resolve({ data: { user: null }, error: new Error('Supabase client not initialized') }),
        signOut: () => Promise.resolve({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      rpc: () => mockErrorHandler(),
    } as any;
  }
} catch (error) {
  appLog('SupabaseClient', 'Error creating legacy Supabase client', 'error', error);

  // Create a mock client that logs errors instead of throwing
  const mockErrorHandler = () => ({ data: null, error: new Error('Supabase client not initialized') });

  supabaseInstance = {
    from: () => ({
      select: () => mockErrorHandler(),
      insert: () => mockErrorHandler(),
      update: () => mockErrorHandler(),
      delete: () => mockErrorHandler(),
      eq: () => ({ select: () => mockErrorHandler() }),
      single: () => mockErrorHandler(),
      limit: () => mockErrorHandler(),
      order: () => mockErrorHandler(),
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: { user: null }, error: new Error('Supabase client not initialized') }),
      signUp: () => Promise.resolve({ data: { user: null }, error: new Error('Supabase client not initialized') }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    rpc: () => mockErrorHandler(),
  } as any;
}

// Export the legacy Supabase client
export const supabase = supabaseInstance;

// Default export for new code
export default getSupabaseClient;
