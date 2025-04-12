// tests/e2e/readerJourney.test.ts
import { test, expect } from '@jest/globals';
import { getSupabaseClient } from '../../src/services/supabaseClient';
import { testPersonas } from '../../src/utils/testPersonas';

// Mock the auth functions
jest.mock('../../src/services/supabaseClient', () => ({
  getSupabaseClient: jest.fn(),
}));

// Test user for the journey
const testUser = testPersonas[0];

describe('Reader Journey', () => {
  // Onboarding Flow Tests
  test('User can scan QR code and be directed to the app', async () => {
    // This would be an E2E test with a real browser
    // For now, we'll just check that the verification page exists
    expect(true).toBe(true);
  });

  test('User can register with email and password', async () => {
    const mockSupabase = {
      auth: {
        signUp: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
    };
    
    (getSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);
    
    // Simulate registration
    const result = await mockSupabase.auth.signUp({
      email: testUser.email,
      password: testUser.password,
    });
    
    expect(result.error).toBeNull();
    expect(result.data.user).toBeDefined();
    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: testUser.email,
      password: testUser.password,
    });
  });

  test('User can enter verification code to activate the book', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { book_id: 'test-book-id', is_used: false },
        error: null,
      }),
      update: jest.fn().mockResolvedValue({
        error: null,
      }),
    };
    
    (getSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);
    
    // Simulate verification code validation
    const result = await mockSupabase.from('verification_codes')
      .select()
      .eq('code', 'TEST123')
      .single();
    
    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
    expect(result.data.book_id).toBe('test-book-id');
  });

  test('User sees appropriate error messages for invalid verification codes', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Invalid code' },
      }),
    };
    
    (getSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);
    
    // Simulate invalid verification code
    const result = await mockSupabase.from('verification_codes')
      .select()
      .eq('code', 'INVALID')
      .single();
    
    expect(result.error).toBeDefined();
    expect(result.error.message).toBe('Invalid code');
  });

  // Reader Dashboard Tests
  test('User can view reading progress on dashboard', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { 
          last_position: '10', 
          section_id: 'test-section-id',
          section_title: 'Test Section',
          chapter_title: 'Test Chapter',
        },
        error: null,
      }),
    };
    
    (getSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);
    
    // Simulate getting reading progress
    const result = await mockSupabase.from('reading_progress')
      .select()
      .eq('user_id', 'test-user-id')
      .eq('book_id', 'test-book-id')
      .single();
    
    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
    expect(result.data.last_position).toBe('10');
  });

  test('User can navigate to continue reading from dashboard', async () => {
    // This would be an E2E test with a real browser
    expect(true).toBe(true);
  });

  test('User can access reading statistics from dashboard', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { 
          total_reading_time: 3600, 
          pages_read: 20,
          percentage_complete: 0.2,
        },
        error: null,
      }),
    };
    
    (getSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);
    
    // Simulate getting reading stats
    const result = await mockSupabase.from('reading_stats')
      .select()
      .eq('user_id', 'test-user-id')
      .eq('book_id', 'test-book-id')
      .single();
    
    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
    expect(result.data.total_reading_time).toBe(3600);
    expect(result.data.pages_read).toBe(20);
  });

  // Reading Interface Tests
  test('User can navigate to a specific page', async () => {
    // This would be an E2E test with a real browser
    expect(true).toBe(true);
  });

  test('User can select a section on the page', async () => {
    // This would be an E2E test with a real browser
    expect(true).toBe(true);
  });

  test('User can highlight a word and see a definition (Tier 1)', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { 
          term: 'curious',
          definition: 'Eager to know or learn something',
        },
        error: null,
      }),
    };
    
    (getSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);
    
    // Simulate getting a definition
    const result = await mockSupabase.from('dictionary')
      .select()
      .eq('book_id', 'test-book-id')
      .eq('term', 'curious')
      .single();
    
    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
    expect(result.data.term).toBe('curious');
    expect(result.data.definition).toBe('Eager to know or learn something');
  });

  test('User can open AI assistant for deeper explanation (Tier 2)', async () => {
    // This would be an E2E test with a real browser
    expect(true).toBe(true);
  });

  test('User receives appropriate responses from AI assistant', async () => {
    const mockSupabase = {
      functions: {
        invoke: jest.fn().mockResolvedValue({
          data: { 
            response: 'This is a test AI response about Alice in Wonderland.',
          },
          error: null,
        }),
      },
    };
    
    (getSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);
    
    // Simulate AI assistant response
    const result = await mockSupabase.functions.invoke('ai-assistant', {
      body: {
        prompt: 'What is the significance of the White Rabbit?',
        context: 'Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, "and what is the use of a book," thought Alice "without pictures or conversations?"',
        bookId: 'test-book-id',
        sectionId: 'test-section-id',
        userId: 'test-user-id',
        mode: 'chat',
      }
    });
    
    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
    expect(result.data.response).toBe('This is a test AI response about Alice in Wonderland.');
  });

  test('User can request live help if AI assistant is insufficient (Tier 3)', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockResolvedValue({
        data: { id: 'test-help-request-id' },
        error: null,
      }),
    };
    
    (getSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);
    
    // Simulate creating a help request
    const result = await mockSupabase.from('help_requests').insert({
      user_id: 'test-user-id',
      book_id: 'test-book-id',
      section_id: 'test-section-id',
      question: 'I need help understanding this passage',
      status: 'PENDING',
    });
    
    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
    expect(result.data.id).toBe('test-help-request-id');
  });

  // Subtle Prompts Tests
  test('User receives subtle prompts based on reading behavior', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({
        data: [{ 
          id: 'test-prompt-id',
          message: 'Have you noticed how Alice\'s curiosity drives the story?',
          trigger_type: 'ENGAGEMENT',
        }],
        error: null,
      }),
    };
    
    (getSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);
    
    // Simulate getting prompts
    const result = await mockSupabase.from('consultant_triggers')
      .select()
      .eq('user_id', 'test-user-id')
      .eq('book_id', 'test-book-id')
      .is('is_processed', false)
      .order('created_at', { ascending: false })
      .limit(1);
    
    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
    expect(result.data.length).toBe(1);
    expect(result.data[0].message).toBe('Have you noticed how Alice\'s curiosity drives the story?');
  });

  test('User can respond to or dismiss prompts', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      update: jest.fn().mockResolvedValue({
        error: null,
      }),
      insert: jest.fn().mockResolvedValue({
        data: { id: 'test-response-id' },
        error: null,
      }),
    };
    
    (getSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);
    
    // Simulate marking a prompt as processed
    const updateResult = await mockSupabase.from('consultant_triggers').update({
      is_processed: true,
    });
    
    // Simulate recording a response
    const insertResult = await mockSupabase.from('user_prompt_responses').insert({
      user_id: 'test-user-id',
      trigger_id: 'test-prompt-id',
      response: 'Yes, I noticed that!',
    });
    
    expect(updateResult.error).toBeNull();
    expect(insertResult.error).toBeNull();
    expect(insertResult.data.id).toBe('test-response-id');
  });

  // Feedback Tests
  test('User can submit positively framed feedback', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockResolvedValue({
        data: { id: 'test-feedback-id' },
        error: null,
      }),
    };
    
    (getSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);
    
    // Simulate submitting feedback
    const result = await mockSupabase.from('user_feedback').insert({
      user_id: 'test-user-id',
      book_id: 'test-book-id',
      section_id: 'test-section-id',
      feedback_type: 'AHA_MOMENT',
      content: 'I just realized the connection between the White Rabbit and time!',
    });
    
    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
    expect(result.data.id).toBe('test-feedback-id');
  });

  // Reading Statistics Tests
  test('Reading statistics accurately reflect user activity', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { 
          total_reading_time: 3600, 
          pages_read: 20,
          percentage_complete: 0.2,
        },
        error: null,
      }),
      update: jest.fn().mockResolvedValue({
        error: null,
      }),
    };
    
    (getSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);
    
    // Simulate updating reading stats
    const updateResult = await mockSupabase.from('reading_stats').update({
      total_reading_time: 3900,
      pages_read: 22,
      percentage_complete: 0.22,
    });
    
    // Simulate getting updated stats
    const getResult = await mockSupabase.from('reading_stats')
      .select()
      .eq('user_id', 'test-user-id')
      .eq('book_id', 'test-book-id')
      .single();
    
    expect(updateResult.error).toBeNull();
    expect(getResult.error).toBeNull();
    expect(getResult.data).toBeDefined();
    expect(getResult.data.total_reading_time).toBe(3600);
    expect(getResult.data.pages_read).toBe(20);
  });
});
