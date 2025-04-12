// src/services/edgeFunctionService.ts
import { supabase } from './supabaseClient';
import { appLog } from '../components/LogViewer';
import { BookId, SectionId, UserId } from '../types/idTypes';

const SERVICE_NAME = 'EdgeFunctionService';

/**
 * Check for unprocessed triggers for a user
 * @param userId User ID
 * @param bookId Book ID
 * @param sectionId Optional section ID
 * @returns Object with hasTriggers and count properties
 */
export async function checkForTriggers(
  userId: string | UserId,
  bookId: string | BookId,
  sectionId?: string | SectionId
): Promise<{ hasTriggers: boolean; count: number }> {
  try {
    appLog(SERVICE_NAME, 'Checking for triggers', 'info', {
      userId,
      bookId,
      sectionId
    });
    
    // Call the edge function
    const { data, error } = await supabase.functions.invoke('check-triggers', {
      body: {
        userId: userId.toString(),
        bookId: bookId.toString(),
        sectionId: sectionId?.toString()
      }
    });
    
    if (error) {
      appLog(SERVICE_NAME, 'Error checking for triggers', 'error', error);
      return { hasTriggers: false, count: 0 };
    }
    
    appLog(SERVICE_NAME, 'Trigger check completed', 'success', data);
    return {
      hasTriggers: data.hasTriggers,
      count: data.count
    };
  } catch (error) {
    appLog(SERVICE_NAME, 'Exception in checkForTriggers', 'error', error);
    return { hasTriggers: false, count: 0 };
  }
}
