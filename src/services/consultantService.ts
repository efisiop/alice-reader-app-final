import { appLog } from '../components/LogViewer';
import { registry } from './serviceRegistry';
import {
  UserProfile,
  HelpRequest,
  UserFeedback,
  ConsultantTrigger,
  HelpRequestStatus,
  TriggerType,
  FeedbackType,
  ConsultantAction
} from '../types/supabase';
import { BOOK_IDS } from '../constants/app';
import { handleServiceError, AppError, ErrorCode } from '../utils/errorHandling';
import { getSupabaseClient } from './supabaseClient';

const SERVICE_NAME = 'ConsultantService';

export interface ReaderProfile extends UserProfile {
  book_verified: boolean;
  is_verified: boolean;
  updated_at: string;
}

export interface ReadingProgress {
  chapter: number;
  page: number;
  last_read_at: string | null;
  time_spent_minutes: number;
}

export interface ReaderInteraction {
  id: string;
  user_id: string;
  event_type: string;
  book_id?: string;
  section_id?: string;
  page_number?: number;
  content?: string;
  context?: any; // JSONB type
  created_at: string;
}

export interface ReaderActivity {
  id: string;
  type: 'help_request' | 'feedback' | 'chapter_complete';
  chapter?: number;
  page?: number;
  message?: string;
  created_at: string;
}

export interface ReaderDetails {
  profile: ReaderProfile;
  progress: any;
  stats: any;
  activity: {
    interactions: any[];
    feedback: any[];
    helpRequests: any[];
    consultantActions: any[];
  };
}

/**
 * Consultant Service Interface
 */
export interface ConsultantServiceInterface {
  checkIsConsultant: () => Promise<boolean>;
  getVerifiedReaders: () => Promise<ReaderProfile[]>;
  getUserReadingDetails: (userId: string, bookId?: string) => Promise<ReaderDetails>;
  getPendingHelpRequests: (bookId?: string) => Promise<HelpRequest[]>;
  getAssignedHelpRequests: (consultantId: string, bookId?: string) => Promise<HelpRequest[]>;
  updateHelpRequestStatus: (requestId: string, status: HelpRequestStatus, consultantId?: string) => Promise<HelpRequest>;
  getAllFeedback: (bookId?: string) => Promise<UserFeedback[]>;
  getPublicFeedback: (bookId?: string) => Promise<UserFeedback[]>;
  createConsultantTrigger: (userId: string, bookId: string, triggerType: TriggerType, message?: string) => Promise<string | null>;
  getUserTriggers: (userId: string) => Promise<ConsultantTrigger[]>;
  markTriggerProcessed: (triggerId: string) => Promise<boolean>;
  logConsultantAction: (userId: string, actionType: string, details?: any) => Promise<string | null>;
  submitFeedback: (userId: string, bookId: string, feedbackType: FeedbackType, content: string, sectionId?: string, isPublic?: boolean) => Promise<UserFeedback | null>;
  submitHelpRequest: (userId: string, bookId: string, content: string, sectionId?: string, context?: string) => Promise<HelpRequest | null>;
  getUserHelpRequests: (userId: string, bookId?: string) => Promise<HelpRequest[]>;
  getUserFeedback: (userId: string, bookId?: string) => Promise<UserFeedback[]>;
  getConsultantAssignments: () => Promise<any[]>;
  getConsultantStats: () => Promise<any>;
  getHelpRequests: (statusFilter?: string) => Promise<HelpRequest[]>;
  getReaderInteractions: (userId?: string, eventType?: string) => Promise<ReaderInteraction[]>;
}

/**
 * Create Consultant Service
 *
 * Factory function to create the consultant service implementation
 */
const createConsultantService = async (): Promise<ConsultantServiceInterface> => {
  appLog(SERVICE_NAME, 'Creating consultant service', 'info');

  // Create service implementation
  const consultantService: ConsultantServiceInterface = {

checkIsConsultant: async (): Promise<boolean> => {
  try {
    appLog(SERVICE_NAME, 'Checking if current user is a consultant', 'info');
    
    // Get Supabase client
    const client = await getSupabaseClient();

    const { data, error } = await client.rpc('is_consultant');

    if (error) {
      appLog(SERVICE_NAME, 'Error checking consultant status', 'error', error);
      return false;
    }

    return data === true;
  } catch (error) {
    throw handleServiceError(error, 'consultantService', 'checkIsConsultant');
  }
},

getVerifiedReaders: async (): Promise<ReaderProfile[]> => {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_verified', true);

    if (error) {
      throw error;
    }

    appLog(SERVICE_NAME, `Found ${profiles.length} verified readers`, 'success');
    return profiles.map(profile => ({
      id: profile.id,
      first_name: profile.first_name,
      last_name: profile.last_name,
      email: profile.email,
      created_at: profile.created_at,
      book_verified: Boolean(profile.book_verified),
      is_verified: Boolean(profile.is_verified),
      is_consultant: Boolean(profile.is_consultant),
      updated_at: profile.updated_at || profile.created_at
    })) as ReaderProfile[];
  } catch (error) {
    handleServiceError(error, 'Failed to fetch verified readers', SERVICE_NAME);
    return [];
  }
},

getUserReadingDetails: async (userId: string, bookId: string = BOOK_IDS.ALICE) => {
  try {
    appLog(SERVICE_NAME, 'Getting user reading details', 'info', { userId, bookId });

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      throw handleServiceError(profileError, 'Failed to fetch user profile', SERVICE_NAME);
    }

    // Get reading progress and stats
    const { data: progress, error: progressError } = await supabase
      .from('reading_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .single();

    if (progressError && progressError.code !== 'PGRST116') {
      throw handleServiceError(progressError, 'Failed to fetch reading progress', SERVICE_NAME);
    }

    const { data: stats, error: statsError } = await supabase
      .from('reading_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .single();

    if (statsError && statsError.code !== 'PGRST116') {
      throw handleServiceError(statsError, 'Failed to fetch reading stats', SERVICE_NAME);
    }

    // Get user activity
    const { data: interactions, error: interactionsError } = await supabase
      .from('interactions')
      .select('*')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .order('created_at', { ascending: false });

    if (interactionsError) {
      throw handleServiceError(interactionsError, 'Failed to fetch user interactions', SERVICE_NAME);
    }

    const { data: feedback, error: feedbackError } = await supabase
      .from('feedback')
      .select('*')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .order('created_at', { ascending: false });

    if (feedbackError) {
      throw handleServiceError(feedbackError, 'Failed to fetch user feedback', SERVICE_NAME);
    }

    const { data: helpRequests, error: helpRequestsError } = await supabase
      .from('help_requests')
      .select('*')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .order('created_at', { ascending: false });

    if (helpRequestsError) {
      throw handleServiceError(helpRequestsError, 'Failed to fetch help requests', SERVICE_NAME);
    }

    const { data: consultantActions, error: actionsError } = await supabase
      .from('consultant_actions')
      .select('*')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .order('created_at', { ascending: false });

    if (actionsError) {
      throw handleServiceError(actionsError, 'Failed to fetch consultant actions', SERVICE_NAME);
    }

    // Log consultant viewing this user's profile
    try {
      const client = await getSupabaseClient();
    await client.rpc('log_consultant_action', {
        p_user_id: userId,
        p_action_type: 'VIEW_PROFILE',
        p_details: { book_id: bookId }
      });
    } catch (error) {
      appLog(SERVICE_NAME, 'Error logging profile view', 'warning', error);
    }

    return {
      profile: {
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        created_at: profile.created_at,
        book_verified: Boolean(profile.book_verified),
        is_verified: Boolean(profile.is_verified),
        is_consultant: Boolean(profile.is_consultant),
        updated_at: profile.updated_at || profile.created_at
      },
      progress: progress || {},
      stats: stats || {},
      activity: {
        interactions: interactions || [],
        feedback: feedback || [],
        helpRequests: helpRequests || [],
        consultantActions: consultantActions || []
      }
    };
  } catch (error) {
    throw handleServiceError(error, 'Failed to fetch user reading details', SERVICE_NAME);
  }
},

getPendingHelpRequests: async (bookId: string = BOOK_IDS.ALICE) => {
  try {
    appLog(SERVICE_NAME, 'Getting pending help requests', 'info', { bookId });

    const { data, error } = await supabase
      .from('help_requests')
      .select(`
        *,
        profiles (
          first_name,
          last_name,
          email
        )
      `)
      .eq('book_id', bookId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      throw handleServiceError(error, 'Failed to fetch pending help requests', SERVICE_NAME);
    }

    return data || [];
  } catch (error) {
    throw handleServiceError(error, 'Failed to fetch pending help requests', SERVICE_NAME);
  }
},

getAssignedHelpRequests: async (consultantId: string, bookId: string = BOOK_IDS.ALICE) => {
  try {
    appLog(SERVICE_NAME, 'Getting assigned help requests', 'info', { consultantId, bookId });

    const { data, error } = await supabase
      .from('help_requests')
      .select(`
        *,
        profiles (
          first_name,
          last_name,
          email
        )
      `)
      .eq('book_id', bookId)
      .eq('consultant_id', consultantId)
      .neq('status', 'closed')
      .order('created_at', { ascending: true });

    if (error) {
      throw handleServiceError(error, 'Failed to fetch assigned help requests', SERVICE_NAME);
    }

    return data || [];
  } catch (error) {
    throw handleServiceError(error, 'Failed to fetch assigned help requests', SERVICE_NAME);
  }
},

updateHelpRequestStatus: async (requestId: string, status: HelpRequestStatus, consultantId?: string) => {
  try {
    appLog(SERVICE_NAME, 'Updating help request status', 'info', { requestId, status, consultantId });

    const updates: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (consultantId) {
      updates.consultant_id = consultantId;
    }

    const { data, error } = await supabase
      .from('help_requests')
      .update(updates)
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      throw handleServiceError(error, 'Failed to update help request status', SERVICE_NAME);
    }

    return data;
  } catch (error) {
    throw handleServiceError(error, 'Failed to update help request status', SERVICE_NAME);
  }
},

getAllFeedback: async (bookId: string = BOOK_IDS.ALICE): Promise<UserFeedback[]> => {
  try {
    appLog(SERVICE_NAME, 'Getting all feedback', 'info', { bookId });

    const { data, error } = await supabase
      .from('user_feedback')
      .select(`
        *,
        user:user_id (id, first_name, last_name, email),
        section:section_id (
          id, title,
          chapter:chapter_id (id, title)
        )
      `)
      .eq('book_id', bookId)
      .order('created_at', { ascending: false });

    if (error) {
      appLog(SERVICE_NAME, 'Error fetching all feedback', 'error', error);
      return [];
    }

    appLog(SERVICE_NAME, `Found ${data.length} feedback items`, 'success');
    return data;
  } catch (error) {
    throw handleServiceError(error, 'consultantService', 'getAllFeedback');
  }
},

getPublicFeedback: async (bookId: string = BOOK_IDS.ALICE): Promise<UserFeedback[]> => {
  try {
    appLog(SERVICE_NAME, 'Getting public feedback', 'info', { bookId });

    const { data, error } = await supabase
      .from('user_feedback')
      .select(`
        *,
        user:user_id (id, first_name, last_name),
        section:section_id (
          id, title,
          chapter:chapter_id (id, title)
        )
      `)
      .eq('book_id', bookId)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) {
      appLog(SERVICE_NAME, 'Error fetching public feedback', 'error', error);
      return [];
    }

    appLog(SERVICE_NAME, `Found ${data.length} public feedback items`, 'success');
    return data;
  } catch (error) {
    throw handleServiceError(error, 'consultantService', 'getPublicFeedback');
  }
},

createConsultantTrigger: async (
  userId: string,
  bookId: string = BOOK_IDS.ALICE,
  triggerType: TriggerType,
  message?: string
): Promise<string | null> => {
  try {
    appLog(SERVICE_NAME, 'Creating consultant trigger', 'info', {
      userId, bookId, triggerType, message
    });

    const client = await getSupabaseClient();
    const { data, error } = await client.rpc('create_consultant_trigger', {
      p_user_id: userId,
      p_book_id: bookId,
      p_trigger_type: triggerType,
      p_message: message
    });

    if (error) {
      appLog(SERVICE_NAME, 'Error creating consultant trigger', 'error', error);
      return null;
    }

    appLog(SERVICE_NAME, 'Consultant trigger created successfully', 'success');
    return data;
  } catch (error) {
    throw handleServiceError(error, 'consultantService', 'createConsultantTrigger');
  }
},

getUserTriggers: async (userId: string): Promise<ConsultantTrigger[]> => {
  try {
    appLog(SERVICE_NAME, 'Getting user triggers', 'info', { userId });

    const { data, error } = await supabase
      .from('consultant_triggers')
      .select(`
        *,
        consultant:consultant_id (id, first_name, last_name)
      `)
      .eq('user_id', userId)
      .eq('is_processed', false)
      .order('created_at', { ascending: false });

    if (error) {
      appLog(SERVICE_NAME, 'Error fetching user triggers', 'error', error);
      return [];
    }

    appLog(SERVICE_NAME, `Found ${data.length} unprocessed triggers`, 'success');
    return data;
  } catch (error) {
    throw handleServiceError(error, 'consultantService', 'getUserTriggers');
  }
},

markTriggerProcessed: async (triggerId: string): Promise<boolean> => {
  try {
    appLog(SERVICE_NAME, 'Marking trigger as processed', 'info', { triggerId });

    const { error } = await supabase
      .from('consultant_triggers')
      .update({
        is_processed: true,
        processed_at: new Date().toISOString()
      })
      .eq('id', triggerId);

    if (error) {
      appLog(SERVICE_NAME, 'Error marking trigger as processed', 'error', error);
      return false;
    }

    appLog(SERVICE_NAME, 'Trigger marked as processed successfully', 'success');
    return true;
  } catch (error) {
    throw handleServiceError(error, 'consultantService', 'markTriggerProcessed');
  }
},

logConsultantAction: async (
  userId: string,
  actionType: string,
  details?: any
): Promise<string | null> => {
  try {
    appLog(SERVICE_NAME, 'Logging consultant action', 'info', {
      userId, actionType, details
    });

    const client = await getSupabaseClient();
    const { data, error } = await client.rpc('log_consultant_action', {
      p_user_id: userId,
      p_consultant_id: user?.id,
      p_action_type: actionType,
      p_details: details ? JSON.stringify(details) : null
    });

    if (error) {
      appLog(SERVICE_NAME, 'Error logging consultant action', 'error', error);
      return null;
    }

    appLog(SERVICE_NAME, 'Consultant action logged successfully', 'success');
    return data;
  } catch (error) {
    throw handleServiceError(error, 'consultantService', 'logConsultantAction');
  }
},

submitFeedback: async (
  userId: string,
  bookId: string = BOOK_IDS.ALICE,
  feedbackType: FeedbackType,
  content: string,
  sectionId?: string,
  isPublic: boolean = false
): Promise<UserFeedback | null> => {
  try {
    appLog(SERVICE_NAME, 'Submitting user feedback', 'info', {
      userId, bookId, feedbackType, sectionId, isPublic
    });

    const { data, error } = await supabase
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

    if (error) {
      appLog(SERVICE_NAME, 'Error submitting feedback', 'error', error);
      return null;
    }

    appLog(SERVICE_NAME, 'Feedback submitted successfully', 'success');
    return data;
  } catch (error) {
    throw handleServiceError(error, 'consultantService', 'submitFeedback');
  }
},

submitHelpRequest: async (
  userId: string,
  bookId: string = BOOK_IDS.ALICE,
  content: string,
  sectionId?: string,
  context?: string
): Promise<HelpRequest | null> => {
  try {
    appLog(SERVICE_NAME, 'Submitting help request', 'info', {
      userId, bookId, sectionId, context
    });

    const { data, error } = await supabase
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

    if (error) {
      appLog(SERVICE_NAME, 'Error submitting help request', 'error', error);
      return null;
    }

    appLog(SERVICE_NAME, 'Help request submitted successfully', 'success');
    return data;
  } catch (error) {
    throw handleServiceError(error, 'consultantService', 'submitHelpRequest');
  }
},

getUserHelpRequests: async (
  userId: string,
  bookId: string = BOOK_IDS.ALICE
): Promise<HelpRequest[]> => {
  try {
    appLog(SERVICE_NAME, 'Getting user help requests', 'info', { userId, bookId });

    const { data, error } = await supabase
      .from('help_requests')
      .select(`
        *,
        consultant:assigned_to (id, first_name, last_name),
        section:section_id (
          id, title,
          chapter:chapter_id (id, title)
        )
      `)
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .order('created_at', { ascending: false });

    if (error) {
      appLog(SERVICE_NAME, 'Error fetching user help requests', 'error', error);
      return [];
    }

    appLog(SERVICE_NAME, `Found ${data.length} help requests`, 'success');
    return data;
  } catch (error) {
    throw handleServiceError(error, 'consultantService', 'getUserHelpRequests');
  }
},

getUserFeedback: async (
  userId: string,
  bookId: string = BOOK_IDS.ALICE
): Promise<UserFeedback[]> => {
  try {
    appLog(SERVICE_NAME, 'Getting user feedback', 'info', { userId, bookId });

    const { data, error } = await supabase
      .from('user_feedback')
      .select(`
        *,
        section:section_id (
          id, title,
          chapter:chapter_id (id, title)
        )
      `)
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .order('created_at', { ascending: false });

    if (error) {
      appLog(SERVICE_NAME, 'Error fetching user feedback', 'error', error);
      return [];
    }

    appLog(SERVICE_NAME, `Found ${data.length} feedback items`, 'success');
    return data;
  } catch (error) {
    throw handleServiceError(error, 'consultantService', 'getUserFeedback');
  }
},

getConsultantAssignments: async (): Promise<any[]> => {
  try {
    // In a real implementation, this would fetch from a consultant_assignments table
    // For now, we'll return a mock implementation
    return [
      {
        id: '1',
        user_id: 'mock-user-id',
        profiles: {
          first_name: 'Alice',
          last_name: 'Reader',
          email: 'alice@example.com'
        }
      }
    ];
  } catch (error) {
    throw handleServiceError(error, 'consultantService', 'getConsultantAssignments');
  }
},

getConsultantStats: async () => {
  try {
    appLog(SERVICE_NAME, 'Getting consultant dashboard statistics', 'info');

    const client = await getSupabaseClient();
    const { data: sessionData } = await client.auth.getSession();
    if (!sessionData.session?.user) {
      appLog(SERVICE_NAME, 'No authenticated user found', 'warning');
      return null;
    }

    const consultantId = sessionData.session.user.id;

    // Get assigned readers
    const { data: assignments, error: assignmentsError } = await supabase
      .from('consultant_assignments')
      .select('*, user:user_id(id, first_name, last_name)')
      .eq('consultant_id', consultantId)
      .eq('active', true);

    if (assignmentsError) {
      appLog(SERVICE_NAME, 'Error fetching assignments', 'error', assignmentsError);
      return null;
    }

    // Get help requests
    const { data: helpRequests, error: helpRequestsError } = await supabase
      .from('help_requests')
      .select('*')
      .or(`assigned_to.eq.${consultantId},status.eq.${HelpRequestStatus.PENDING}`);

    if (helpRequestsError) {
      appLog(SERVICE_NAME, 'Error fetching help requests', 'error', helpRequestsError);
      return null;
    }

    // Get feedback
    const { data: feedback, error: feedbackError } = await supabase
      .from('user_feedback')
      .select('*')
      .in('user_id', assignments?.map(a => a.user_id) || []);

    if (feedbackError) {
      appLog(SERVICE_NAME, 'Error fetching feedback', 'error', feedbackError);
      return null;
    }

    // Get recent activity
    const { data: recentActions, error: actionsError } = await supabase
      .from('consultant_actions_log')
      .select('*, user:user_id(id, first_name, last_name)')
      .eq('consultant_id', consultantId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (actionsError) {
      appLog(SERVICE_NAME, 'Error fetching recent actions', 'error', actionsError);
      return null;
    }

    // Calculate reader engagement levels
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const readerEngagement = {
      high: 0,
      medium: 0,
      low: 0
    };

    assignments?.forEach(assignment => {
      if (!assignment.last_active_at) {
        readerEngagement.low++;
        return;
      }

      const lastActive = new Date(assignment.last_active_at);
      if (lastActive > oneWeekAgo) {
        readerEngagement.high++;
      } else if (lastActive > new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)) {
        readerEngagement.medium++;
      } else {
        readerEngagement.low++;
      }
    });

    // Format recent activity
    const recentActivity = recentActions?.map(action => {
      let description = 'Unknown action';

      switch (action.action_type) {
        case 'TRIGGER_PROMPT':
          description = 'Sent a prompt to reader';
          break;
        case 'UPDATE_HELP_REQUEST':
          description = 'Updated help request status';
          break;
        case 'VIEW_READER_PROFILE':
          description = 'Viewed reader profile';
          break;
        default:
          description = `${action.action_type}`;
      }

      return {
        id: action.id,
        type: action.action_type.toLowerCase(),
        userId: action.user_id,
        userName: action.user ? `${action.user.first_name} ${action.user.last_name}` : 'Unknown User',
        timestamp: action.created_at,
        description
      };
    }) || [];

    // Compile stats
    const stats = {
      totalReaders: assignments?.length || 0,
      activeReaders: assignments?.filter(a => a.last_active_at && new Date(a.last_active_at) > oneWeekAgo).length || 0,
      pendingRequests: helpRequests?.filter(r => r.status === HelpRequestStatus.PENDING).length || 0,
      resolvedRequests: helpRequests?.filter(r => r.status === HelpRequestStatus.RESOLVED).length || 0,
      totalFeedback: feedback?.length || 0,
      recentFeedback: feedback?.filter(f => new Date(f.created_at) > oneWeekAgo).length || 0,
      readerEngagement,
      recentActivity
    };

    appLog(SERVICE_NAME, 'Consultant stats retrieved successfully', 'success');
    return stats;
  } catch (error) {
    throw handleServiceError(error, 'consultantService', 'getConsultantStats');
  }
},

getHelpRequests: async (statusFilter?: string): Promise<HelpRequest[]> => {
  try {
    appLog(SERVICE_NAME, 'Getting help requests', 'info', { statusFilter });

    let query = supabase
      .from('help_requests')
      .select(`
        *,
        user:user_id (
          id,
          first_name,
          last_name,
          email
        ),
        consultant:assigned_to (
          id,
          first_name,
          last_name
        ),
        section:section_id (
          id,
          title,
          chapter:chapter_id (
            id,
            title
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      appLog(SERVICE_NAME, 'Error fetching help requests', 'error', error);
      return [];
    }

    appLog(SERVICE_NAME, `Found ${data.length} help requests`, 'success');
    return data;
  } catch (error) {
    throw handleServiceError(error, 'consultantService', 'getHelpRequests');
  }
},

getReaderInteractions: async (userId?: string, eventType?: string): Promise<ReaderInteraction[]> => {
  try {
    appLog(SERVICE_NAME, 'Getting reader interactions', 'info', { userId, eventType });

    let query = supabase
      .from('interactions')
      .select(`
        id,
        user_id,
        event_type,
        book_id,
        section_id,
        page_number,
        content,
        context,
        created_at,
        profiles (first_name, last_name, email)
      `)
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    const { data, error } = await query;

    if (error) {
      appLog(SERVICE_NAME, 'Error fetching reader interactions', 'error', error);
      return [];
    }

    appLog(SERVICE_NAME, `Found ${data.length} reader interactions`, 'success');
    return data.map(item => ({
      ...item,
      // @ts-ignore - profiles is joined
      user_name: item.profiles ? `${item.profiles.first_name} ${item.profiles.last_name}` : 'Unknown User',
      // @ts-ignore
      user_email: item.profiles ? item.profiles.email : 'Unknown Email'
    }));
  } catch (error) {
    throw handleServiceError(error, 'consultantService', 'getReaderInteractions');
  }
}
  };

  return consultantService;
};

// Export the factory function
export { createConsultantService };

// Create backward-compatible exports
export async function checkIsConsultant(): Promise<boolean> {
  const service = await registry.getService<ConsultantServiceInterface>('consultantService');
  return service.checkIsConsultant();
}

export async function getVerifiedReaders(): Promise<ReaderProfile[]> {
  const service = await registry.getService<ConsultantServiceInterface>('consultantService');
  return service.getVerifiedReaders();
}

export async function getUserReadingDetails(userId: string, bookId: string = BOOK_IDS.ALICE) {
  const service = await registry.getService<ConsultantServiceInterface>('consultantService');
  return service.getUserReadingDetails(userId, bookId);
}

export async function getPendingHelpRequests(bookId: string = BOOK_IDS.ALICE): Promise<HelpRequest[]> {
  const service = await registry.getService<ConsultantServiceInterface>('consultantService');
  return service.getPendingHelpRequests(bookId);
}

export async function getAssignedHelpRequests(consultantId: string, bookId: string = BOOK_IDS.ALICE): Promise<HelpRequest[]> {
  const service = await registry.getService<ConsultantServiceInterface>('consultantService');
  return service.getAssignedHelpRequests(consultantId, bookId);
}

export async function updateHelpRequestStatus(
  requestId: string,
  status: HelpRequestStatus,
  consultantId?: string
): Promise<HelpRequest> {
  const service = await registry.getService<ConsultantServiceInterface>('consultantService');
  return service.updateHelpRequestStatus(requestId, status, consultantId);
}

export async function getAllFeedback(bookId: string = BOOK_IDS.ALICE): Promise<UserFeedback[]> {
  const service = await registry.getService<ConsultantServiceInterface>('consultantService');
  return service.getAllFeedback(bookId);
}

export async function getPublicFeedback(bookId: string = BOOK_IDS.ALICE): Promise<UserFeedback[]> {
  const service = await registry.getService<ConsultantServiceInterface>('consultantService');
  return service.getPublicFeedback(bookId);
}

export async function createConsultantTrigger(
  userId: string,
  bookId: string = BOOK_IDS.ALICE,
  triggerType: TriggerType,
  message?: string
): Promise<string | null> {
  const service = await registry.getService<ConsultantServiceInterface>('consultantService');
  return service.createConsultantTrigger(userId, bookId, triggerType, message);
}

export async function getUserTriggers(userId: string): Promise<ConsultantTrigger[]> {
  const service = await registry.getService<ConsultantServiceInterface>('consultantService');
  return service.getUserTriggers(userId);
}

export async function markTriggerProcessed(triggerId: string): Promise<boolean> {
  const service = await registry.getService<ConsultantServiceInterface>('consultantService');
  return service.markTriggerProcessed(triggerId);
}

export async function logConsultantAction(
  userId: string,
  actionType: string,
  details?: any
): Promise<string | null> {
  const service = await registry.getService<ConsultantServiceInterface>('consultantService');
  return service.logConsultantAction(userId, actionType, details);
}

export async function submitFeedback(
  userId: string,
  bookId: string = BOOK_IDS.ALICE,
  feedbackType: FeedbackType,
  content: string,
  sectionId?: string,
  isPublic: boolean = false
): Promise<UserFeedback | null> {
  const service = await registry.getService<ConsultantServiceInterface>('consultantService');
  return service.submitFeedback(userId, bookId, feedbackType, content, sectionId, isPublic);
}

export async function submitHelpRequest(
  userId: string,
  bookId: string = BOOK_IDS.ALICE,
  content: string,
  sectionId?: string,
  context?: string
): Promise<HelpRequest | null> {
  const service = await registry.getService<ConsultantServiceInterface>('consultantService');
  return service.submitHelpRequest(userId, bookId, content, sectionId, context);
}

export async function getUserHelpRequests(
  userId: string,
  bookId: string = BOOK_IDS.ALICE
): Promise<HelpRequest[]> {
  const service = await registry.getService<ConsultantServiceInterface>('consultantService');
  return service.getUserHelpRequests(userId, bookId);
}

export async function getUserFeedback(
  userId: string,
  bookId: string = BOOK_IDS.ALICE
): Promise<UserFeedback[]> {
  const service = await registry.getService<ConsultantServiceInterface>('consultantService');
  return service.getUserFeedback(userId, bookId);
}

export async function getConsultantAssignments(): Promise<any[]> {
  const service = await registry.getService<ConsultantServiceInterface>('consultantService');
  return service.getConsultantAssignments();
}

export async function getConsultantStats() {
  const service = await registry.getService<ConsultantServiceInterface>('consultantService');
  return service.getConsultantStats();
}

export async function getReaderInteractions(userId?: string, eventType?: string): Promise<ReaderInteraction[]> {
  const service = await registry.getService<ConsultantServiceInterface>('consultantService');
  return service.getReaderInteractions(userId, eventType);
}

// Default export for backward compatibility
export default {
  checkIsConsultant,
  getVerifiedReaders,
  getUserReadingDetails,
  getPendingHelpRequests,
  getAssignedHelpRequests,
  updateHelpRequestStatus,
  getAllFeedback,
  getPublicFeedback,
  createConsultantTrigger,
  getUserTriggers,
  markTriggerProcessed,
  logConsultantAction,
  submitFeedback,
  submitHelpRequest,
  getUserHelpRequests,
  getUserFeedback,
  getConsultantAssignments,
  getConsultantStats
};
