// src/types/supabase.ts
import {
  UserId,
  BookId,
  ChapterId,
  SectionId,
  ProfileId,
  DictionaryId,
  ReadingProgressId,
  ReadingStatsId,
  HelpRequestId,
  FeedbackId,
  ConsultantTriggerId,
  ConsultantActionId
} from './idTypes';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: ProfileId
          first_name: string
          last_name: string
          email: string
          is_consultant: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: UserId
          first_name: string
          last_name: string
          email: string
          is_consultant?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: ProfileId
          first_name?: string
          last_name?: string
          email?: string
          is_consultant?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      books: {
        Row: {
          id: BookId
          title: string
          author: string
          description: string | null
          cover_image_url: string | null
          total_pages: number
          created_at: string
          string_id?: string
        }
        Insert: {
          id?: BookId
          title: string
          author: string
          description?: string | null
          cover_image_url?: string | null
          total_pages: number
          created_at?: string
          string_id?: string
        }
        Update: {
          id?: BookId
          title?: string
          author?: string
          description?: string | null
          cover_image_url?: string | null
          total_pages?: number
          created_at?: string
          string_id?: string
        }
      }
      chapters: {
        Row: {
          id: ChapterId
          book_id: BookId
          title: string
          number: number
          created_at: string
        }
        Insert: {
          id?: ChapterId
          book_id: BookId
          title: string
          number: number
          created_at?: string
        }
        Update: {
          id?: ChapterId
          book_id?: BookId
          title?: string
          number?: number
          created_at?: string
        }
      }
      sections: {
        Row: {
          id: SectionId
          chapter_id: ChapterId
          title: string
          content: string
          start_page: number
          end_page: number
          number: number
          created_at: string
        }
        Insert: {
          id?: SectionId
          chapter_id: ChapterId
          title: string
          content: string
          start_page: number
          end_page: number
          number: number
          created_at?: string
        }
        Update: {
          id?: SectionId
          chapter_id?: ChapterId
          title?: string
          content?: string
          start_page?: number
          end_page?: number
          number?: number
          created_at?: string
        }
      }
      verification_codes: {
        Row: {
          code: string
          book_id: string
          is_used: boolean
          used_by: string | null
          created_at: string
        }
        Insert: {
          code: string
          book_id: string
          is_used?: boolean
          used_by?: string | null
          created_at?: string
        }
        Update: {
          code?: string
          book_id?: string
          is_used?: boolean
          used_by?: string | null
          created_at?: string
        }
      }
      dictionary: {
        Row: {
          id: DictionaryId
          book_id: BookId
          chapter_id: ChapterId | null
          section_id: SectionId | null
          term: string
          definition: string
          created_at: string
        }
        Insert: {
          id?: DictionaryId
          book_id: BookId
          chapter_id?: ChapterId | null
          section_id?: SectionId | null
          term: string
          definition: string
          created_at?: string
        }
        Update: {
          id?: DictionaryId
          book_id?: BookId
          chapter_id?: ChapterId | null
          section_id?: SectionId | null
          term?: string
          definition?: string
          created_at?: string
        }
      }
      reading_progress: {
        Row: {
          id: ReadingProgressId
          user_id: UserId
          book_id: BookId
          section_id: SectionId
          last_position: string | null
          last_read_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: ReadingProgressId
          user_id: UserId
          book_id: BookId
          section_id: SectionId
          last_position?: string | null
          last_read_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: ReadingProgressId
          user_id?: UserId
          book_id?: BookId
          section_id?: SectionId
          last_position?: string | null
          last_read_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      reading_stats: {
        Row: {
          id: ReadingStatsId
          user_id: UserId
          book_id: BookId
          total_reading_time: number
          pages_read: number
          last_session_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: ReadingStatsId
          user_id: UserId
          book_id: BookId
          total_reading_time?: number
          pages_read?: number
          last_session_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: ReadingStatsId
          user_id?: UserId
          book_id?: BookId
          total_reading_time?: number
          pages_read?: number
          last_session_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      ai_interactions: {
        Row: {
          id: string
          user_id: string
          book_id: string
          section_id: string | null
          question: string
          context: string | null
          response: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          book_id: string
          section_id?: string | null
          question: string
          context?: string | null
          response: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          book_id?: string
          section_id?: string | null
          question?: string
          context?: string | null
          response?: string
          created_at?: string
        }
      }
      ai_prompts: {
        Row: {
          id: string
          prompt_text: string
          prompt_type: string
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          prompt_text: string
          prompt_type: string
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          prompt_text?: string
          prompt_type?: string
          active?: boolean
          created_at?: string
        }
      }
      user_prompt_responses: {
        Row: {
          id: string
          user_id: string
          prompt_id: string
          response: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          prompt_id: string
          response?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          prompt_id?: string
          response?: string | null
          created_at?: string
        }
      }
      consultant_assignments: {
        Row: {
          id: string
          consultant_id: string
          user_id: string
          book_id: string
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          consultant_id: string
          user_id: string
          book_id: string
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          consultant_id?: string
          user_id?: string
          book_id?: string
          active?: boolean
          created_at?: string
        }
      }
      consultant_triggers: {
        Row: {
          id: string
          consultant_id: string | null
          user_id: string
          book_id: string
          trigger_type: string
          message: string | null
          is_processed: boolean
          processed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          consultant_id?: string | null
          user_id: string
          book_id: string
          trigger_type: string
          message?: string | null
          is_processed?: boolean
          processed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          consultant_id?: string | null
          user_id?: string
          book_id?: string
          trigger_type?: string
          message?: string | null
          is_processed?: boolean
          processed_at?: string | null
          created_at?: string
        }
      }
      consultant_users: {
        Row: {
          user_id: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          user_id: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          user_id?: string
          is_active?: boolean
          created_at?: string
        }
      }

      user_feedback: {
        Row: {
          id: string
          user_id: string
          book_id: string
          section_id: string | null
          feedback_type: string
          content: string
          is_public: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          book_id: string
          section_id?: string | null
          feedback_type: string
          content: string
          is_public?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          book_id?: string
          section_id?: string | null
          feedback_type?: string
          content?: string
          is_public?: boolean
          created_at?: string
        }
      }

      help_requests: {
        Row: {
          id: string
          user_id: string
          book_id: string
          section_id: string | null
          status: string
          content: string
          context: string | null
          assigned_to: string | null
          resolved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          book_id: string
          section_id?: string | null
          status?: string
          content: string
          context?: string | null
          assigned_to?: string | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          book_id?: string
          section_id?: string | null
          status?: string
          content?: string
          context?: string | null
          assigned_to?: string | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      consultant_actions_log: {
        Row: {
          id: string
          consultant_id: string
          user_id: string
          action_type: string
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          consultant_id: string
          user_id: string
          action_type: string
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          consultant_id?: string
          user_id?: string
          action_type?: string
          details?: Json | null
          created_at?: string
        }
      }
    }
    Functions: {
      get_sections_for_page: {
        Args: {
          book_id_param: string
          page_number_param: number
        }
        Returns: {
          id: string
          chapter_id: string
          title: string
          content: string
          start_page: number
          end_page: number
          number: number
          chapter_title: string
          chapter_number: number
        }[]
      }
      get_definition_with_context: {
        Args: {
          book_id_param: string
          term_param: string
          section_id_param?: string
          chapter_id_param?: string
        }
        Returns: {
          definition: string
          priority: number
        }[]
      }
      increment_counter: {
        Args: {
          table_name: string
          column_name: string
          row_id: string
          increment_by: number
        }
        Returns: undefined
      }
      is_consultant: {
        Args: Record<string, never>
        Returns: boolean
      }

      log_consultant_action: {
        Args: {
          p_user_id: string
          p_action_type: string
          p_details?: Json
        }
        Returns: string
      }

      create_consultant_trigger: {
        Args: {
          p_user_id: string
          p_book_id: string
          p_trigger_type: string
          p_message?: string
        }
        Returns: string
      }

      update_help_request_status: {
        Args: {
          p_request_id: string
          p_status: string
          p_assign_to_self?: boolean
        }
        Returns: boolean
      }
    }
  }
}

// Additional types for the application
export type BookWithChapters = Database['public']['Tables']['books']['Row'] & {
  chapters: (Database['public']['Tables']['chapters']['Row'] & {
    sections: Database['public']['Tables']['sections']['Row'][]
  })[]
};

export type SectionWithChapter = Database['public']['Tables']['sections']['Row'] & {
  chapter_title: string;
  chapter_number: number;
};

export type BookProgress = {
  section_id: SectionId;
  last_position: string | null;
  section_title?: string;
  chapter_title?: string;
  page_number?: number;
  percentage?: number;
};

export type BookStats = Database['public']['Tables']['reading_stats']['Row'] & {
  percentage_complete?: number;
};

export type AiPrompt = Database['public']['Tables']['ai_prompts']['Row'];

export type ConsultantTrigger = Database['public']['Tables']['consultant_triggers']['Row'];

// Custom types for the consultant features
export type UserProfile = Database['public']['Tables']['profiles']['Row'];

export type ConsultantUser = Database['public']['Tables']['consultant_users']['Row'];

export type UserFeedback = Database['public']['Tables']['user_feedback']['Row'] & {
  user?: UserProfile
  section?: {
    title: string
    chapter_title: string
  }
};

export type HelpRequest = Database['public']['Tables']['help_requests']['Row'] & {
  user?: UserProfile
  consultant?: UserProfile
  section?: {
    title: string
    chapter_title: string
  }
};

export type ConsultantAction = Database['public']['Tables']['consultant_actions_log']['Row'];

export enum FeedbackType {
  AHA_MOMENT = 'AHA_MOMENT',
  POSITIVE_EXPERIENCE = 'POSITIVE_EXPERIENCE',
  SUGGESTION = 'SUGGESTION',
  CONFUSION = 'CONFUSION',
  GENERAL = 'GENERAL'
}

export enum HelpRequestStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED'
}

export enum TriggerType {
  ENGAGEMENT = 'ENGAGEMENT',
  CHECK_IN = 'CHECK_IN',
  QUIZ = 'QUIZ',
  ENCOURAGE = 'ENCOURAGE'
}
