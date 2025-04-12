// src/services/serviceTypes.ts
import { 
  AI_MODES, 
  FEEDBACK_TYPES, 
  HELP_REQUEST_STATUSES, 
  TRIGGER_TYPES 
} from '../constants';

// Book types
export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
}

export interface Chapter {
  id: string;
  book_id: string;
  chapter_number: number;
  title: string;
}

export interface Section {
  id: string;
  chapter_id: string;
  start_page: number;
  end_page: number;
  title?: string;
  content: string;
}

export interface BookWithChapters extends Book {
  chapters: Chapter[];
}

export interface SectionWithChapter extends Section {
  chapter: Chapter;
}

export interface BookContent {
  id: string;
  title: string;
  content: string;
  currentPage: number;
  totalPages: number;
}

// Reading progress types
export interface ReadingProgress {
  id: string;
  user_id: string;
  book_id: string;
  section_id: string;
  last_position: string;
  last_read_at: string;
  section?: Section;
}

export interface ReadingStats {
  id: string;
  user_id: string;
  book_id: string;
  total_reading_time: number;
  pages_read: number;
  percentage_complete: number;
  last_session_date: string;
}

export interface DetailedReadingStats extends ReadingStats {
  reading_streak: number;
  words_looked_up: number;
  ai_interactions: number;
  help_requests: number;
  feedback_submitted: number;
}

// AI types
export type AIMode = typeof AI_MODES[keyof typeof AI_MODES];

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface AIConversation {
  id: string;
  userId: string;
  bookId: string;
  sectionId: string;
  messages: AIMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface AIInteraction {
  id: string;
  user_id: string;
  book_id: string;
  section_id: string;
  query: string;
  response: string;
  interaction_type: AIMode;
  created_at: string;
}

// Feedback types
export type FeedbackType = typeof FEEDBACK_TYPES[keyof typeof FEEDBACK_TYPES];

export interface UserFeedback {
  id: string;
  user_id: string;
  book_id: string;
  section_id: string;
  feedback_type: FeedbackType;
  content: string;
  is_public: boolean;
  is_featured: boolean;
  created_at: string;
}

// Help request types
export type HelpRequestStatus = typeof HELP_REQUEST_STATUSES[keyof typeof HELP_REQUEST_STATUSES];

export interface HelpRequest {
  id: string;
  user_id: string;
  book_id: string;
  section_id: string;
  question: string;
  status: HelpRequestStatus;
  consultant_id?: string;
  created_at: string;
  resolved_at?: string;
}

// Trigger types
export type TriggerType = typeof TRIGGER_TYPES[keyof typeof TRIGGER_TYPES];

export interface ConsultantTrigger {
  id: string;
  consultant_id: string;
  user_id: string;
  book_id: string;
  trigger_type: TriggerType;
  message: string;
  is_processed: boolean;
  created_at: string;
  processed_at?: string;
}

export interface UserPromptResponse {
  id: string;
  user_id: string;
  trigger_id: string;
  response: string;
  created_at: string;
}

// Service interfaces
export interface BookServiceInterface {
  getBookDetails: (bookId: string) => Promise<BookWithChapters | null>;
  getSectionDetails: (sectionId: string) => Promise<SectionWithChapter | null>;
  getBookContent: (bookId: string) => Promise<BookContent | null>;
  getSectionByPage: (bookId: string, pageNumber: number) => Promise<SectionWithChapter | null>;
  saveReadingProgress: (userId: string, bookId: string, sectionId: string, position: string) => Promise<boolean>;
  getReadingProgress: (userId: string, bookId: string) => Promise<ReadingProgress | null>;
  getReadingStats: (userId: string, bookId: string) => Promise<ReadingStats | null>;
  updateReadingStats: (userId: string, bookId: string, currentPosition: string) => Promise<boolean>;
}

export interface AIServiceInterface {
  createConversation: (userId: string, bookId: string, sectionId: string) => AIConversation;
  addMessageToConversation: (conversation: AIConversation, role: 'user' | 'assistant' | 'system', content: string) => AIConversation;
  sendMessageToAI: (conversation: AIConversation, message: string, context?: string, mode?: AIMode) => Promise<{ response: string; conversation: AIConversation }>;
  getWordDefinition: (word: string, context: string, userId: string, bookId: string, sectionId: string) => Promise<string>;
  getAIInteractionStats: (userId: string, bookId: string) => Promise<any>;
  logHelpOffer: (userId: string, bookId: string, sectionId: string, reason: string) => Promise<boolean>;
  checkIfUserNeedsHelp: (userId: string, bookId: string, sectionId: string) => Promise<{ needsHelp: boolean; reason: string }>;
}

export interface FeedbackServiceInterface {
  getUserFeedback: (userId: string, bookId: string) => Promise<UserFeedback[]>;
  submitFeedback: (userId: string, bookId: string, sectionId: string, feedbackType: FeedbackType, content: string) => Promise<boolean>;
  updateFeedbackVisibility: (feedbackId: string, isPublic: boolean, isFeatured: boolean) => Promise<boolean>;
}

export interface TriggerServiceInterface {
  getUnprocessedTriggers: (userId: string) => Promise<ConsultantTrigger[]>;
  createTrigger: (consultantId: string, userId: string, bookId: string, triggerType: TriggerType, message: string) => Promise<boolean>;
  markTriggerAsProcessed: (triggerId: string) => Promise<boolean>;
  saveUserResponse: (userId: string, triggerId: string, response: string) => Promise<boolean>;
}

export interface StatisticsServiceInterface {
  getDetailedReadingStats: (userId: string, bookId: string) => Promise<DetailedReadingStats | null>;
  updateReadingTime: (userId: string, bookId: string, timeInSeconds: number) => Promise<boolean>;
  getReaderLeaderboard: (bookId: string, limit?: number) => Promise<any[]>;
}
