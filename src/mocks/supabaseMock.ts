// src/mocks/supabaseMock.ts
import { Database } from '../types/supabase';

// Mock data
export const mockData = {
  users: new Map(),
  profiles: new Map(),
  books: [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Alice in Wonderland',
      author: 'Lewis Carroll',
      description: 'The classic tale of a girl who falls through a rabbit hole into a fantasy world.',
      cover_image_url: null,
      total_pages: 100,
      created_at: new Date().toISOString(),
    },
  ],
  chapters: [
    {
      id: 'c1',
      book_id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Down the Rabbit-Hole',
      number: 1,
      created_at: new Date().toISOString(),
    },
    {
      id: 'c2',
      book_id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'The Pool of Tears',
      number: 2,
      created_at: new Date().toISOString(),
    },
  ],
  sections: [
    {
      id: 's1',
      chapter_id: 'c1',
      title: 'Beginning',
      content: 'Alice was beginning to get very tired of sitting by her sister on the bank...',
      page_number: 1,
      created_at: new Date().toISOString(),
    },
    {
      id: 's2',
      chapter_id: 'c1',
      title: 'The Rabbit',
      content: 'There was nothing so very remarkable in that; nor did Alice think it so very much out of the way to hear the Rabbit say to itself, "Oh dear! Oh dear! I shall be late!"',
      page_number: 2,
      created_at: new Date().toISOString(),
    },
  ],
  verificationCodes: new Map([
    ['ALICE123', { is_used: false, used_by: null, book_id: '550e8400-e29b-41d4-a716-446655440000' }],
    ['WONDERLAND', { is_used: false, used_by: null, book_id: '550e8400-e29b-41d4-a716-446655440000' }],
    ['RABBIT', { is_used: false, used_by: null, book_id: '550e8400-e29b-41d4-a716-446655440000' }],
    ['TEAPARTY', { is_used: false, used_by: null, book_id: '550e8400-e29b-41d4-a716-446655440000' }],
    ['CHESHIRE', { is_used: false, used_by: null, book_id: '550e8400-e29b-41d4-a716-446655440000' }],
  ]),
  dictionary: [
    { id: 'd1', book_id: '550e8400-e29b-41d4-a716-446655440000', word: 'alice', definition: 'The main character of the story.', created_at: new Date().toISOString() },
    { id: 'd2', book_id: '550e8400-e29b-41d4-a716-446655440000', word: 'rabbit', definition: 'A small mammal with long ears.', created_at: new Date().toISOString() },
  ],
  readingProgress: new Map(),
  readingStats: new Map(),
  aiInteractions: new Map(),
  aiPrompts: [
    { id: 'p1', prompt_type: 'reflection', prompt_text: 'What do you think about the story so far?', created_at: new Date().toISOString() },
    { id: 'p2', prompt_type: 'question', prompt_text: 'Do you have any questions about the story?', created_at: new Date().toISOString() },
  ],
  userPromptResponses: new Map(),
  consultantAssignments: new Map(),
  consultantTriggers: new Map(),
  helpRequests: new Map(),
  userFeedback: new Map(),
  consultantActionsLog: new Map(),
  readingSessions: new Map(),
};

// Mock user and session
let mockUser: any = null;
let mockSession: any = null;

// Create a mock Supabase client
export const mockSupabaseClient = {
  auth: {
    getSession: jest.fn().mockImplementation(async () => {
      return { data: { session: mockSession }, error: null };
    }),
    getUser: jest.fn().mockImplementation(async () => {
      return { data: { user: mockUser }, error: null };
    }),
    signInWithPassword: jest.fn().mockImplementation(async ({ email, password }) => {
      // Create a mock user
      mockUser = {
        id: 'mock-user-id',
        email,
        aud: 'authenticated',
        role: 'authenticated',
        created_at: new Date().toISOString(),
      };

      // Create a mock session
      mockSession = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_at: Date.now() + 3600,
        user: mockUser,
      };

      return { data: { user: mockUser, session: mockSession }, error: null };
    }),
    signUp: jest.fn().mockImplementation(async ({ email, password }) => {
      // Create a mock user
      mockUser = {
        id: 'mock-user-id',
        email,
        aud: 'authenticated',
        role: 'authenticated',
        created_at: new Date().toISOString(),
      };

      return { data: { user: mockUser }, error: null };
    }),
    signOut: jest.fn().mockImplementation(async () => {
      mockUser = null;
      mockSession = null;
      return { error: null };
    }),
  },
  from: jest.fn().mockImplementation((table) => {
    return {
      select: jest.fn().mockImplementation((columns) => {
        return {
          eq: jest.fn().mockImplementation((column, value) => {
            return {
              single: jest.fn().mockImplementation(async () => {
                // Handle different tables
                switch (table) {
                  case 'books':
                    const book = mockData.books.find(b => b.id === value);
                    return { data: book || null, error: book ? null : { message: 'Book not found' } };
                  case 'verification_codes':
                    const code = mockData.verificationCodes.get(value);
                    return { data: code || null, error: code ? null : { message: 'Code not found' } };
                  case 'dictionary':
                    const word = mockData.dictionary.find(d => d.word === value && d.book_id === column);
                    return { data: word || null, error: word ? null : { message: 'Word not found' } };
                  default:
                    return { data: null, error: { message: 'Table not implemented in mock' } };
                }
              }),
              maybeSingle: jest.fn().mockImplementation(async () => {
                // Similar to single but returns null instead of error if not found
                switch (table) {
                  case 'reading_progress':
                    // Mock implementation for reading progress
                    return { data: null, error: null };
                  default:
                    return { data: null, error: null };
                }
              }),
            };
          }),
          order: jest.fn().mockImplementation((column, { ascending }) => {
            return {
              range: jest.fn().mockImplementation((from, to) => {
                return {
                  limit: jest.fn().mockImplementation((limit) => {
                    // Handle different tables
                    switch (table) {
                      case 'sections':
                        const sections = mockData.sections.filter(s => 
                          s.page_number >= from && s.page_number <= to
                        ).slice(0, limit);
                        return { data: sections, error: null };
                      default:
                        return { data: [], error: null };
                    }
                  }),
                };
              }),
            };
          }),
          limit: jest.fn().mockImplementation((limit) => {
            // Handle different tables
            switch (table) {
              case 'books':
                return { data: mockData.books.slice(0, limit), error: null };
              case 'chapters':
                return { data: mockData.chapters.slice(0, limit), error: null };
              case 'ai_prompts':
                return { data: mockData.aiPrompts.slice(0, limit), error: null };
              default:
                return { data: [], error: null };
            }
          }),
        };
      }),
      insert: jest.fn().mockImplementation((data) => {
        // Handle different tables
        switch (table) {
          case 'profiles':
            return { data: { id: 'mock-profile-id', ...data }, error: null };
          case 'reading_progress':
            return { data: { id: 'mock-progress-id', ...data }, error: null };
          case 'ai_interactions':
            return { data: { id: 'mock-interaction-id', ...data }, error: null };
          case 'user_prompt_responses':
            return { data: { id: 'mock-response-id', ...data }, error: null };
          case 'help_requests':
            return { data: { id: 'mock-help-request-id', ...data }, error: null };
          case 'user_feedback':
            return { data: { id: 'mock-feedback-id', ...data }, error: null };
          default:
            return { data: null, error: { message: 'Table not implemented in mock' } };
        }
      }),
      update: jest.fn().mockImplementation((data) => {
        return {
          eq: jest.fn().mockImplementation((column, value) => {
            // Handle different tables
            switch (table) {
              case 'reading_progress':
                return { data: { id: value, ...data }, error: null };
              case 'verification_codes':
                return { data: { code: value, ...data }, error: null };
              case 'help_requests':
                return { data: { id: value, ...data }, error: null };
              default:
                return { data: null, error: { message: 'Table not implemented in mock' } };
            }
          }),
        };
      }),
    };
  }),
  storage: {
    from: jest.fn().mockImplementation((bucket) => {
      return {
        upload: jest.fn().mockImplementation(async (path, file) => {
          return { data: { path }, error: null };
        }),
        getPublicUrl: jest.fn().mockImplementation((path) => {
          return {
            data: { publicUrl: `https://mock-storage.example.com/${bucket}/${path}` },
            error: null,
          };
        }),
      };
    }),
  },
};

// Helper functions for testing
export const resetMockData = () => {
  mockData.users = new Map();
  mockData.profiles = new Map();
  mockData.readingProgress = new Map();
  mockData.readingStats = new Map();
  mockData.aiInteractions = new Map();
  mockData.userPromptResponses = new Map();
  mockData.consultantAssignments = new Map();
  mockData.consultantTriggers = new Map();
  mockData.helpRequests = new Map();
  mockData.userFeedback = new Map();
  mockData.consultantActionsLog = new Map();
  mockData.readingSessions = new Map();
  
  // Reset verification codes
  mockData.verificationCodes = new Map([
    ['ALICE123', { is_used: false, used_by: null, book_id: '550e8400-e29b-41d4-a716-446655440000' }],
    ['WONDERLAND', { is_used: false, used_by: null, book_id: '550e8400-e29b-41d4-a716-446655440000' }],
    ['RABBIT', { is_used: false, used_by: null, book_id: '550e8400-e29b-41d4-a716-446655440000' }],
    ['TEAPARTY', { is_used: false, used_by: null, book_id: '550e8400-e29b-41d4-a716-446655440000' }],
    ['CHESHIRE', { is_used: false, used_by: null, book_id: '550e8400-e29b-41d4-a716-446655440000' }],
  ]);
  
  // Reset user and session
  mockUser = null;
  mockSession = null;
};

// Export a function to create a mock Supabase client
export const createMockSupabaseClient = () => {
  return mockSupabaseClient;
};
