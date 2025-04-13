// src/services/statisticsService.ts
import { getSupabaseClient } from './supabaseClient';
import { appLog } from '../components/LogViewer';
import { registry } from '@services/serviceRegistry';
import { initManager } from './initManager';
import { handleServiceError } from '../utils/errorHandling';

const SERVICE_NAME = 'StatisticsService';

/**
 * Detailed Reading Stats Interface
 */
export interface DetailedReadingStats {
  id: string;
  user_id: string;
  book_id: string;
  total_reading_time: number;
  pages_read: number;
  percentage_complete: number;
  last_session_date: string;
  reading_streak: number;
  words_looked_up: number;
  ai_interactions: number;
  help_requests: number;
  feedback_submitted: number;
}

/**
 * Statistics Service Interface
 */
export interface StatisticsServiceInterface {
  getBasicReadingStats: (userId: string, bookId: string) => Promise<any>;
  getDetailedReadingStats: (userId: string, bookId: string) => Promise<DetailedReadingStats | null>;
  updateReadingTime: (userId: string, bookId: string, timeInSeconds: number) => Promise<boolean>;
  getReaderLeaderboard: (bookId: string, limit?: number) => Promise<any[]>;
  updateReadingStats: (userId: string, bookId: string, currentPage: number | string, totalPages?: number) => Promise<boolean>;
}

/**
 * Create Statistics Service
 *
 * Factory function to create the statistics service implementation
 */
const createStatisticsService = async (): Promise<StatisticsServiceInterface> => {
  appLog(SERVICE_NAME, 'Creating statistics service', 'info');

  // Create service implementation
  const statisticsService: StatisticsServiceInterface = {
    /**
     * Get basic reading statistics for a user and book
     * @param userId User ID
     * @param bookId Book ID
     * @returns Basic reading statistics
     */
    getBasicReadingStats: async (userId: string, bookId: string) => {
  try {
    appLog(SERVICE_NAME, `Getting basic reading stats for user ${userId}`, 'info');
    const supabase = await getSupabaseClient();

    // Get basic reading stats
    const { data, error } = await supabase
      .from('reading_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      appLog(SERVICE_NAME, `Error getting reading stats: ${error.message}`, 'error');
      return null;
    }

    return data || null;
  } catch (error) {
    throw handleServiceError(error, 'statisticsService', 'getBasicReadingStats');
  }
},

/**
 * Get detailed reading statistics for a user and book
 * @param userId User ID
 * @param bookId Book ID
 * @returns Detailed reading statistics
 */
getDetailedReadingStats: async (userId: string, bookId: string) => {
  try {
    appLog(SERVICE_NAME, `Getting detailed reading stats for user ${userId}`, 'info');
    const supabase = await getSupabaseClient();

    // Get basic reading stats
    const { data: basicStats, error: statsError } = await supabase
      .from('reading_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .single();

    if (statsError && statsError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      appLog(SERVICE_NAME, `Error getting reading stats: ${statsError.message}`, 'error');
      return null;
    }

    if (!basicStats) {
      return null;
    }

    // Get AI interaction count
    const { count: aiInteractions, error: aiError } = await supabase
      .from('ai_interactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('book_id', bookId);

    if (aiError) {
      appLog(SERVICE_NAME, `Error getting AI interactions count: ${aiError.message}`, 'warning');
    }

    // Get word lookup count
    const { count: wordsLookedUp, error: wordError } = await supabase
      .from('ai_interactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .eq('interaction_type', 'definition');

    if (wordError) {
      appLog(SERVICE_NAME, `Error getting word lookups count: ${wordError.message}`, 'warning');
    }

    // Get help request count
    const { count: helpRequests, error: helpError } = await supabase
      .from('help_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('book_id', bookId);

    if (helpError) {
      appLog(SERVICE_NAME, `Error getting help requests count: ${helpError.message}`, 'warning');
    }

    // Get feedback count
    const { count: feedbackSubmitted, error: feedbackError } = await supabase
      .from('user_feedback')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('book_id', bookId);

    if (feedbackError) {
      appLog(SERVICE_NAME, `Error getting feedback count: ${feedbackError.message}`, 'warning');
    }

    // Calculate reading streak (simplified for now)
    const readingStreak = 1;

    // Combine all stats
    return {
      ...basicStats,
      reading_streak: readingStreak,
      words_looked_up: wordsLookedUp || 0,
      ai_interactions: aiInteractions || 0,
      help_requests: helpRequests || 0,
      feedback_submitted: feedbackSubmitted || 0
    };
  } catch (error) {
    throw handleServiceError(error, 'statisticsService', 'getDetailedReadingStats');
  }
},

/**
 * Update reading time for a user and book
 * @param userId User ID
 * @param bookId Book ID
 * @param timeInSeconds Time spent reading in seconds
 * @returns Success status
 */
updateReadingTime: async (userId: string, bookId: string, timeInSeconds: number) => {
  try {
    appLog(SERVICE_NAME, `Updating reading time for user ${userId}`, 'info');
    const supabase = await getSupabaseClient();

    // Check if stats exist
    const { data: existingStats, error: checkError } = await supabase
      .from('reading_stats')
      .select('id, total_reading_time')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      appLog(SERVICE_NAME, `Error checking reading stats: ${checkError.message}`, 'error');
      return false;
    }

    if (existingStats) {
      // Update existing stats
      const { error: updateError } = await supabase
        .from('reading_stats')
        .update({
          total_reading_time: existingStats.total_reading_time + timeInSeconds,
          last_session_date: new Date().toISOString()
        })
        .eq('id', existingStats.id);

      if (updateError) {
        appLog(SERVICE_NAME, `Error updating reading time: ${updateError.message}`, 'error');
        return false;
      }
    } else {
      // Create new stats record
      const { error: insertError } = await supabase
        .from('reading_stats')
        .insert({
          user_id: userId,
          book_id: bookId,
          total_reading_time: timeInSeconds,
          pages_read: 0,
          percentage_complete: 0,
          last_session_date: new Date().toISOString()
        });

      if (insertError) {
        appLog(SERVICE_NAME, `Error creating reading stats: ${insertError.message}`, 'error');
        return false;
      }
    }

    return true;
  } catch (error) {
    throw handleServiceError(error, 'statisticsService', 'updateReadingTime');
  }
},

/**
 * Get reader leaderboard for a book
 * @param bookId Book ID
 * @param limit Maximum number of entries to return
 * @returns Leaderboard entries
 */
getReaderLeaderboard: async (bookId: string, limit = 10) => {
  try {
    appLog(SERVICE_NAME, `Getting reader leaderboard for book ${bookId}`, 'info');
    const supabase = await getSupabaseClient();

    const { data, error } = await supabase
      .from('reading_stats')
      .select('*, user:user_id(username, display_name)')
      .eq('book_id', bookId)
      .order('percentage_complete', { ascending: false })
      .limit(limit);

    if (error) {
      appLog(SERVICE_NAME, `Error getting reader leaderboard: ${error.message}`, 'error');
      return [];
    }

    return data || [];
  } catch (error) {
    throw handleServiceError(error, 'statisticsService', 'getReaderLeaderboard');
  }
},

/**
 * Update reading statistics for a user and book
 * @param userId User ID
 * @param bookId Book ID
 * @param currentPage Current page number
 * @param totalPages Total pages in the book
 * @returns Success status
 */
updateReadingStats: async (userId: string, bookId: string, currentPage: number | string, totalPages = 100) => {
  try {
    appLog(SERVICE_NAME, `Updating reading stats for user ${userId}`, 'info');
    const supabase = await getSupabaseClient();

    // Check if stats exist
    const { data: existingStats, error: checkError } = await supabase
      .from('reading_stats')
      .select('id, pages_read')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      appLog(SERVICE_NAME, `Error checking reading stats: ${checkError.message}`, 'error');
      return false;
    }

    // Calculate percentage complete
    const pageNumber = typeof currentPage === 'string' ? parseInt(currentPage) : currentPage;
    const percentageComplete = Math.min(pageNumber / totalPages, 1);

    const now = new Date().toISOString();

    if (existingStats) {
      // Update existing stats
      const { error: updateError } = await supabase
        .from('reading_stats')
        .update({
          pages_read: Math.max(existingStats.pages_read, pageNumber),
          percentage_complete: percentageComplete,
          last_session_date: now
        })
        .eq('id', existingStats.id);

      if (updateError) {
        appLog(SERVICE_NAME, `Error updating reading stats: ${updateError.message}`, 'error');
        return false;
      }
    } else {
      // Create new stats record
      const { error: insertError } = await supabase
        .from('reading_stats')
        .insert({
          user_id: userId,
          book_id: bookId,
          total_reading_time: 0,
          pages_read: pageNumber,
          percentage_complete: percentageComplete,
          last_session_date: now
        });

      if (insertError) {
        appLog(SERVICE_NAME, `Error creating reading stats: ${insertError.message}`, 'error');
        return false;
      }
    }

    return true;
  } catch (error) {
    throw handleServiceError(error, 'statisticsService', 'updateReadingStats');
  }
}
  };

  return statisticsService;
};

// Register initialization function
// The dependencies are automatically loaded from SERVICE_DEPENDENCIES
initManager.register('statisticsService', async () => {
  const service = await createStatisticsService();
  registry.register('statisticsService', service);
});

// Create backward-compatible exports
export async function getBasicReadingStats(userId: string, bookId: string) {
  const service = await registry.getOrInitialize<StatisticsServiceInterface>('statisticsService', initManager);
  return service.getBasicReadingStats(userId, bookId);
};

export async function getDetailedReadingStats(userId: string, bookId: string) {
  const service = await registry.getOrInitialize<StatisticsServiceInterface>('statisticsService', initManager);
  return service.getDetailedReadingStats(userId, bookId);
};

export async function updateReadingTime(userId: string, bookId: string, timeInSeconds: number) {
  const service = await registry.getOrInitialize<StatisticsServiceInterface>('statisticsService', initManager);
  return service.updateReadingTime(userId, bookId, timeInSeconds);
};

export async function getReaderLeaderboard(bookId: string, limit = 10) {
  const service = await registry.getOrInitialize<StatisticsServiceInterface>('statisticsService', initManager);
  return service.getReaderLeaderboard(bookId, limit);
};

export async function updateReadingStats(userId: string, bookId: string, currentPage: number | string, totalPages = 100) {
  const service = await registry.getOrInitialize<StatisticsServiceInterface>('statisticsService', initManager);
  return service.updateReadingStats(userId, bookId, currentPage, totalPages);
};

// Default export for backward compatibility
export default {
  getBasicReadingStats,
  getDetailedReadingStats,
  updateReadingTime,
  getReaderLeaderboard,
  updateReadingStats
};
