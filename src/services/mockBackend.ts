// src/services/mockBackend.ts
import { Database } from '../types/supabase';
import { BookWithChapters, SectionWithChapter } from '../types/supabase';

// Mock data
const mockBooks: BookWithChapters[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    title: 'Alice in Wonderland',
    author: 'Lewis Carroll',
    description: 'The classic tale of a girl who falls through a rabbit hole into a fantasy world.',
    cover_image_url: null,
    total_pages: 100,
    created_at: new Date().toISOString(),
    chapters: [
      {
        id: 'c1',
        book_id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Down the Rabbit-Hole',
        number: 1,
        created_at: new Date().toISOString(),
        sections: [
          {
            id: 's1',
            chapter_id: 'c1',
            title: 'Beginning',
            content: 'Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, "and what is the use of a book," thought Alice "without pictures or conversations?"',
            start_page: 1,
            end_page: 3,
            number: 1,
            created_at: new Date().toISOString()
          },
          {
            id: 's2',
            chapter_id: 'c1',
            title: 'The Rabbit',
            content: 'There was nothing so very remarkable in that; nor did Alice think it so very much out of the way to hear the Rabbit say to itself, "Oh dear! Oh dear! I shall be late!" (when she thought it over afterwards, it occurred to her that she ought to have wondered at this, but at the time it all seemed quite natural).',
            start_page: 4,
            end_page: 6,
            number: 2,
            created_at: new Date().toISOString()
          },
          {
            id: 's3',
            chapter_id: 'c1',
            title: 'Down the Hole',
            content: 'In another moment down went Alice after it, never once considering how in the world she was to get out again. The rabbit-hole went straight on like a tunnel for some way, and then dipped suddenly down, so suddenly that Alice had not a moment to think about stopping herself before she found herself falling down a very deep well.',
            start_page: 7,
            end_page: 10,
            number: 3,
            created_at: new Date().toISOString()
          }
        ]
      },
      {
        id: 'c2',
        book_id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'The Pool of Tears',
        number: 2,
        created_at: new Date().toISOString(),
        sections: [
          {
            id: 's4',
            chapter_id: 'c2',
            title: 'Curiouser and Curiouser',
            content: '"Curiouser and curiouser!" cried Alice (she was so much surprised, that for the moment she quite forgot how to speak good English); "now I\'m opening out like the largest telescope that ever was! Good-bye, feet!"',
            start_page: 11,
            end_page: 14,
            number: 1,
            created_at: new Date().toISOString()
          },
          {
            id: 's5',
            chapter_id: 'c2',
            title: 'The White Rabbit Again',
            content: 'And she went on planning to herself how she would manage it. "They must go by the carrier," she thought; "and how funny it\'ll seem, sending presents to one\'s own feet!"',
            start_page: 15,
            end_page: 18,
            number: 2,
            created_at: new Date().toISOString()
          }
        ]
      },
      {
        id: 'c3',
        book_id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'A Caucus-Race and a Long Tale',
        number: 3,
        created_at: new Date().toISOString(),
        sections: [
          {
            id: 's6',
            chapter_id: 'c3',
            title: 'The Mouse',
            content: '"O Mouse, do you know the way out of this pool? I am very tired of swimming about here, O Mouse!" Alice thought this must be the right way of speaking to a mouse.',
            start_page: 19,
            end_page: 22,
            number: 1,
            created_at: new Date().toISOString()
          },
          {
            id: 's7',
            chapter_id: 'c3',
            title: 'The Caucus-Race',
            content: 'They were indeed a queer-looking party that assembled on the bank—the birds with draggled feathers, the animals with their fur clinging close to them, and all dripping wet, cross, and uncomfortable.',
            start_page: 23,
            end_page: 26,
            number: 2,
            created_at: new Date().toISOString()
          }
        ]
      }
    ]
  }
];

// Mock verification codes
const mockVerificationCodes = [
  {
    code: 'ALICE123',
    book_id: '550e8400-e29b-41d4-a716-446655440000',
    is_used: false,
    used_by: null,
    created_at: new Date().toISOString(),
    books: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Alice in Wonderland',
      author: 'Lewis Carroll'
    }
  },
  {
    code: 'WONDERLAND',
    book_id: '550e8400-e29b-41d4-a716-446655440000',
    is_used: false,
    used_by: null,
    created_at: new Date().toISOString(),
    books: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Alice in Wonderland',
      author: 'Lewis Carroll'
    }
  }
];

const mockDictionary: Record<string, string> = {
  'alice': 'The main character of the story, a curious young girl.',
  'rabbit': 'A white rabbit with pink eyes that Alice follows down the rabbit hole.',
  'wonderland': 'The magical world Alice discovers after falling down the rabbit hole.',
  'curiouser': 'A made-up comparative form of "curious" that Alice uses, showing her confusion and wonder.',
  'telescope': 'Used as a metaphor for Alice growing taller, comparing her body to an extending telescope.',
  'caucus-race': 'A race with no clear rules or winner, used as a method to get dry after being soaked in tears.',
  'mouse': 'A character Alice meets in the pool of tears who tells a "dry" tale to help everyone get dry.',
  'pool of tears': 'A body of water created by Alice\'s giant tears when she was 9 feet tall.'
};

// Mock progress (keyed by user_id + book_id)
const mockProgress: Record<string, any> = {};

// Mock reading stats (keyed by user_id + book_id)
const mockReadingStats: Record<string, any> = {};

// Mock user profiles (keyed by user_id)
const mockProfiles: Record<string, any> = {};

// Mock AI interactions
const mockAiInteractions: any[] = [];

// Mock AI prompts
const mockAiPrompts: any[] = [
  {
    id: 'prompt1',
    prompt_text: 'What did you find most interesting about this chapter?',
    prompt_type: 'reflection',
    active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'prompt2',
    prompt_text: 'Which character do you relate to most and why?',
    prompt_type: 'character',
    active: true,
    created_at: new Date().toISOString()
  }
];

// Mock prompt responses
const mockPromptResponses: any[] = [];

// Mock consultant assignments
const mockConsultantAssignments: any[] = [];

// Mock consultant triggers
const mockConsultantTriggers: any[] = [];

// Mock user feedback
const mockUserFeedback: any[] = [];

// Mock help requests
const mockHelpRequests: any[] = [];

// Mock consultant actions log
const mockConsultantActions: any[] = [];

// Mock auth state
let mockUser: any = null;
let mockSession: any = null;

// Mock API functions
export const mockBackend = {
  auth: {
    getUser: () => {
      return mockUser;
    },
    getSession: () => {
      return { data: { session: mockSession }, error: null };
    },
    signIn: (email: string, password: string) => {
      // Create a mock user with the structure expected by the app
      mockUser = {
        id: 'mock-user-id',
        email,
        aud: 'authenticated',
        role: 'authenticated',
        created_at: new Date().toISOString()
      };

      // Create a mock session
      mockSession = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_at: Date.now() + 3600,
        user: mockUser
      };

      // Return in the format expected by the app
      return {
        data: { user: mockUser, session: mockSession },
        error: null
      };
    },
    signUp: (email: string, password: string, firstName?: string, lastName?: string) => {
      // Create a mock user with the structure expected by the app
      mockUser = {
        id: 'mock-user-id',
        email,
        aud: 'authenticated',
        role: 'authenticated',
        created_at: new Date().toISOString(),
        user_metadata: firstName && lastName ? {
          first_name: firstName,
          last_name: lastName
        } : {}
      };

      // Create a mock session
      mockSession = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_at: Date.now() + 3600,
        user: mockUser
      };

      // Create a mock profile if firstName and lastName are provided
      if (firstName && lastName) {
        mockProfiles['mock-user-id'] = {
          id: 'mock-user-id',
          first_name: firstName,
          last_name: lastName,
          email: email,
          is_consultant: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }

      // Return in the format expected by the app
      return {
        data: { user: mockUser, session: mockSession },
        error: null
      };
    },
    signOut: () => {
      mockUser = null;
      mockSession = null;
      return { error: null };
    },
    onAuthStateChange: (callback: Function) => {
      // Mock subscription
      return {
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      };
    }
  },
  profiles: {
    getUserProfile: (userId: string) => {
      return { data: mockProfiles[userId] || null, error: null };
    },
    createUserProfile: (userId: string, firstName: string, lastName: string, email: string) => {
      const profile = {
        id: userId,
        first_name: firstName,
        last_name: lastName,
        email: email,
        is_consultant: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      mockProfiles[userId] = profile;
      return { data: profile, error: null };
    },
    updateUserProfile: (userId: string, updates: any) => {
      if (!mockProfiles[userId]) {
        return { data: null, error: { message: 'Profile not found' } };
      }
      mockProfiles[userId] = { ...mockProfiles[userId], ...updates, updated_at: new Date().toISOString() };
      return { data: mockProfiles[userId], error: null };
    }
  },
  books: {
    getBookContent: (bookId: string) => {
      const book = mockBooks.find(b => b.id === bookId);
      return { data: book, error: null };
    },
    getAllBooks: () => {
      return {
        data: mockBooks.map(book => ({
          id: book.id,
          title: book.title,
          author: book.author,
          description: book.description,
          cover_image_url: book.cover_image_url,
          total_pages: book.total_pages,
          created_at: book.created_at
        })),
        error: null
      };
    },
    getSectionsForPage: (bookId: string, pageNumber: number) => {
      const book = mockBooks.find(b => b.id === bookId);
      if (!book) return { data: [], error: null };

      const sections: SectionWithChapter[] = [];
      book.chapters.forEach(chapter => {
        chapter.sections.forEach(section => {
          if (pageNumber >= section.start_page && pageNumber <= section.end_page) {
            sections.push({
              ...section,
              chapter_title: chapter.title,
              chapter_number: chapter.number
            });
          }
        });
      });

      return { data: sections, error: null };
    },
    getDefinition: (bookId: string, term: string, sectionId?: string, chapterId?: string): {data: any, error: null} => {
      const definition = mockDictionary[term.toLowerCase()];
      return {
        data: definition || null,
        error: null
      };
    },
    verifyBookCode: (code: string) => {
      // First try to find an exact match
      const verificationCode = mockVerificationCodes.find(vc => vc.code === code.toUpperCase());

      if (verificationCode) {
        return { data: verificationCode, error: null };
      }

      // For testing, accept any code when using mock backend
      // Create a mock verification code for the provided code
      const mockCode = {
        code: code.toUpperCase(),
        book_id: '550e8400-e29b-41d4-a716-446655440000',
        is_used: false,
        used_by: null,
        created_at: new Date().toISOString(),
        books: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          title: 'Alice in Wonderland',
          author: 'Lewis Carroll'
        }
      };

      // Add to mock verification codes for future reference
      mockVerificationCodes.push(mockCode);

      return { data: mockCode, error: null };
    },
    markCodeAsUsed: (code: string, userId: string) => {
      const index = mockVerificationCodes.findIndex(vc => vc.code === code.toUpperCase());
      if (index === -1) {
        // For testing, create a new code if it doesn't exist
        const mockCode = {
          code: code.toUpperCase(),
          book_id: '550e8400-e29b-41d4-a716-446655440000',
          is_used: true,
          used_by: userId,
          created_at: new Date().toISOString(),
          books: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            title: 'Alice in Wonderland',
            author: 'Lewis Carroll'
          }
        };

        // Add to mock verification codes
        mockVerificationCodes.push(mockCode);

        return { data: mockCode, error: null };
      }

      mockVerificationCodes[index] = {
        ...mockVerificationCodes[index],
        is_used: true,
        used_by: userId
      };

      return { data: mockVerificationCodes[index], error: null };
    }
  },
  progress: {
    saveReadingProgress: (userId: string, bookId: string, sectionId: string, lastPosition?: string) => {
      const key = `${userId}:${bookId}`;
      const now = new Date().toISOString();

      mockProgress[key] = {
        id: `progress-${key}`,
        user_id: userId,
        book_id: bookId,
        section_id: sectionId,
        last_position: lastPosition || null,
        last_read_at: now,
        created_at: mockProgress[key]?.created_at || now,
        updated_at: now
      };

      return { data: mockProgress[key], error: null };
    },
    getReadingProgress: (userId: string, bookId: string) => {
      const key = `${userId}:${bookId}`;
      const progress = mockProgress[key];

      if (!progress) {
        return { data: null, error: null };
      }

      // Get section and chapter details
      const book = mockBooks.find(b => b.id === bookId);
      if (!book) {
        return { data: null, error: { message: 'Book not found' } };
      }

      let sectionTitle = '';
      let chapterTitle = '';
      let pageNumber = 0;

      for (const chapter of book.chapters) {
        const section = chapter.sections.find(s => s.id === progress.section_id);
        if (section) {
          sectionTitle = section.title;
          chapterTitle = chapter.title;
          pageNumber = section.start_page;
          break;
        }
      }

      return {
        data: {
          section_id: progress.section_id,
          last_position: progress.last_position,
          section_title: sectionTitle,
          chapter_title: chapterTitle,
          page_number: pageNumber
        },
        error: null
      };
    },
    updateReadingStats: (userId: string, bookId: string, timeSpentSeconds: number, pagesRead: number) => {
      const key = `${userId}:${bookId}`;
      const now = new Date().toISOString();

      if (mockReadingStats[key]) {
        mockReadingStats[key] = {
          ...mockReadingStats[key],
          total_reading_time: mockReadingStats[key].total_reading_time + timeSpentSeconds,
          pages_read: Math.max(mockReadingStats[key].pages_read, pagesRead),
          last_session_date: now,
          updated_at: now
        };
      } else {
        mockReadingStats[key] = {
          id: `stats-${key}`,
          user_id: userId,
          book_id: bookId,
          total_reading_time: timeSpentSeconds,
          pages_read: pagesRead,
          last_session_date: now,
          created_at: now,
          updated_at: now
        };
      }

      return { data: mockReadingStats[key], error: null };
    },
    getReadingStats: (userId: string, bookId: string) => {
      const key = `${userId}:${bookId}`;
      const stats = mockReadingStats[key];

      if (!stats) {
        return { data: null, error: null };
      }

      // Get book to calculate percentage
      const book = mockBooks.find(b => b.id === bookId);
      if (!book) {
        return { data: null, error: { message: 'Book not found' } };
      }

      return {
        data: {
          ...stats,
          percentage_complete: Math.round((stats.pages_read / book.total_pages) * 100)
        },
        error: null
      };
    }
  },
  ai: {
    saveAiInteraction: (userId: string, bookId: string, question: string, response: string, sectionId?: string, context?: string) => {
      const interaction = {
        id: `ai-${mockAiInteractions.length + 1}`,
        user_id: userId,
        book_id: bookId,
        section_id: sectionId || null,
        question,
        context: context || null,
        response,
        created_at: new Date().toISOString()
      };

      mockAiInteractions.push(interaction);
      return { data: interaction, error: null };
    },
    getAiInteractions: (userId: string, bookId: string) => {
      const interactions = mockAiInteractions.filter(
        i => i.user_id === userId && i.book_id === bookId
      );

      return { data: interactions, error: null };
    },
    getAiPrompts: (promptType: string) => {
      const prompts = mockAiPrompts.filter(
        p => p.prompt_type === promptType && p.active
      );

      return { data: prompts, error: null };
    },
    savePromptResponse: (userId: string, promptId: string, response: string) => {
      const promptResponse = {
        id: `response-${mockPromptResponses.length + 1}`,
        user_id: userId,
        prompt_id: promptId,
        response,
        created_at: new Date().toISOString()
      };

      mockPromptResponses.push(promptResponse);
      return { data: promptResponse, error: null };
    }
  },
  consultant: {
    getConsultantAssignments: (consultantId: string) => {
      const assignments = mockConsultantAssignments.filter(
        a => a.consultant_id === consultantId && a.active
      );

      return { data: assignments, error: null };
    },
    assignConsultant: (consultantId: string, userId: string, bookId: string) => {
      const assignment = {
        id: `assignment-${mockConsultantAssignments.length + 1}`,
        consultant_id: consultantId,
        user_id: userId,
        book_id: bookId,
        active: true,
        created_at: new Date().toISOString()
      };

      mockConsultantAssignments.push(assignment);
      return { data: assignment, error: null };
    },
    createTrigger: (userId: string, bookId: string, triggerType: string, message?: string, consultantId?: string) => {
      const trigger = {
        id: `trigger-${mockConsultantTriggers.length + 1}`,
        consultant_id: consultantId || null,
        user_id: userId,
        book_id: bookId,
        trigger_type: triggerType,
        message: message || null,
        is_processed: false,
        created_at: new Date().toISOString()
      };

      mockConsultantTriggers.push(trigger);
      return { data: trigger, error: null };
    },
    getTriggers: (consultantId: string) => {
      const triggers = mockConsultantTriggers.filter(
        t => t.consultant_id === consultantId && !t.is_processed
      );

      return { data: triggers, error: null };
    },
    markTriggerProcessed: (triggerId: string) => {
      const index = mockConsultantTriggers.findIndex(t => t.id === triggerId);
      if (index === -1) {
        return { data: null, error: { message: 'Trigger not found' } };
      }

      const now = new Date().toISOString();
      mockConsultantTriggers[index] = {
        ...mockConsultantTriggers[index],
        is_processed: true,
        processed_at: now
      };

      return { data: mockConsultantTriggers[index], error: null };
    },

    isConsultant: (userId: string) => {
      // Check if user is in mockProfiles with is_consultant flag
      const profile = mockProfiles[userId];
      if (profile?.is_consultant) {
        return { data: true, error: null };
      }

      // For testing, consider specific test IDs as consultants
      if (userId === 'mock-consultant-id' || userId === 'mock-user-id') {
        return { data: true, error: null };
      }

      return { data: false, error: null };
    },

    submitFeedback: (userId: string, bookId: string, feedbackType: string, content: string, sectionId?: string, isPublic: boolean = false) => {
      const feedback = {
        id: `feedback-${mockUserFeedback.length + 1}`,
        user_id: userId,
        book_id: bookId,
        section_id: sectionId || null,
        feedback_type: feedbackType,
        content,
        is_public: isPublic,
        created_at: new Date().toISOString()
      };

      mockUserFeedback.push(feedback);
      return { data: feedback, error: null };
    },

    getUserFeedback: (userId: string, bookId: string) => {
      const feedback = mockUserFeedback.filter(
        f => f.user_id === userId && f.book_id === bookId
      );

      // Add section info if available
      const feedbackWithSections = feedback.map(f => {
        if (!f.section_id) return f;

        // Find section and chapter info
        let sectionTitle = '';
        let chapterTitle = '';

        for (const book of mockBooks) {
          if (book.id === bookId) {
            for (const chapter of book.chapters) {
              for (const section of chapter.sections) {
                if (section.id === f.section_id) {
                  sectionTitle = section.title;
                  chapterTitle = chapter.title;
                  break;
                }
              }
              if (sectionTitle) break;
            }
            if (sectionTitle) break;
          }
        }

        return {
          ...f,
          section: {
            title: sectionTitle,
            chapter_title: chapterTitle
          }
        };
      });

      return { data: feedbackWithSections, error: null };
    },

    getPublicFeedback: (bookId: string) => {
      const feedback = mockUserFeedback.filter(
        f => f.book_id === bookId && f.is_public
      );

      // Add user and section info
      const feedbackWithDetails = feedback.map(f => {
        const user = mockProfiles[f.user_id];

        // Find section and chapter info
        let sectionTitle = '';
        let chapterTitle = '';

        if (f.section_id) {
          for (const book of mockBooks) {
            if (book.id === bookId) {
              for (const chapter of book.chapters) {
                for (const section of chapter.sections) {
                  if (section.id === f.section_id) {
                    sectionTitle = section.title;
                    chapterTitle = chapter.title;
                    break;
                  }
                }
                if (sectionTitle) break;
              }
              if (sectionTitle) break;
            }
          }
        }

        return {
          ...f,
          user,
          section: f.section_id ? {
            title: sectionTitle,
            chapter_title: chapterTitle
          } : undefined
        };
      });

      return { data: feedbackWithDetails, error: null };
    },

    submitHelpRequest: (userId: string, bookId: string, content: string, sectionId?: string, context?: string) => {
      const request = {
        id: `help-${mockHelpRequests.length + 1}`,
        user_id: userId,
        book_id: bookId,
        section_id: sectionId || null,
        status: 'PENDING',
        content,
        context: context || null,
        assigned_to: null,
        resolved_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockHelpRequests.push(request);
      return { data: request, error: null };
    },

    getUserHelpRequests: (userId: string, bookId: string) => {
      const requests = mockHelpRequests.filter(
        r => r.user_id === userId && r.book_id === bookId
      );

      // Add consultant and section info
      const requestsWithDetails = requests.map(r => {
        const consultant = r.assigned_to ? mockProfiles[r.assigned_to] : null;

        // Find section and chapter info
        let sectionTitle = '';
        let chapterTitle = '';

        if (r.section_id) {
          for (const book of mockBooks) {
            if (book.id === bookId) {
              for (const chapter of book.chapters) {
                for (const section of chapter.sections) {
                  if (section.id === r.section_id) {
                    sectionTitle = section.title;
                    chapterTitle = chapter.title;
                    break;
                  }
                }
                if (sectionTitle) break;
              }
              if (sectionTitle) break;
            }
          }
        }

        return {
          ...r,
          consultant,
          section: r.section_id ? {
            title: sectionTitle,
            chapter_title: chapterTitle
          } : undefined
        };
      });

      return { data: requestsWithDetails, error: null };
    },

    getConsultantHelpRequests: (consultantId: string) => {
      const requests = mockHelpRequests.filter(
        r => r.assigned_to === consultantId
      );

      // Add user and section info
      const requestsWithDetails = requests.map(r => {
        const user = mockProfiles[r.user_id];

        // Find section and chapter info
        let sectionTitle = '';
        let chapterTitle = '';

        if (r.section_id) {
          for (const book of mockBooks) {
            if (book.id === r.book_id) {
              for (const chapter of book.chapters) {
                for (const section of chapter.sections) {
                  if (section.id === r.section_id) {
                    sectionTitle = section.title;
                    chapterTitle = chapter.title;
                    break;
                  }
                }
                if (sectionTitle) break;
              }
              if (sectionTitle) break;
            }
          }
        }

        return {
          ...r,
          user,
          section: r.section_id ? {
            title: sectionTitle,
            chapter_title: chapterTitle
          } : undefined
        };
      });

      return { data: requestsWithDetails, error: null };
    },

    getPendingHelpRequests: () => {
      const requests = mockHelpRequests.filter(
        r => r.status === 'PENDING' && !r.assigned_to
      );

      // Add user and section info
      const requestsWithDetails = requests.map(r => {
        const user = mockProfiles[r.user_id];

        // Find section and chapter info
        let sectionTitle = '';
        let chapterTitle = '';

        if (r.section_id) {
          for (const book of mockBooks) {
            if (book.id === r.book_id) {
              for (const chapter of book.chapters) {
                for (const section of chapter.sections) {
                  if (section.id === r.section_id) {
                    sectionTitle = section.title;
                    chapterTitle = chapter.title;
                    break;
                  }
                }
                if (sectionTitle) break;
              }
              if (sectionTitle) break;
            }
          }
        }

        return {
          ...r,
          user,
          section: r.section_id ? {
            title: sectionTitle,
            chapter_title: chapterTitle
          } : undefined
        };
      });

      return { data: requestsWithDetails, error: null };
    },

    updateHelpRequestStatus: (requestId: string, status: string, consultantId?: string) => {
      const index = mockHelpRequests.findIndex(r => r.id === requestId);
      if (index === -1) {
        return { data: null, error: { message: 'Help request not found' } };
      }

      const updates: any = { status, updated_at: new Date().toISOString() };

      if (status === 'IN_PROGRESS' && consultantId) {
        updates.assigned_to = consultantId;
      }

      if (status === 'RESOLVED') {
        updates.resolved_at = new Date().toISOString();
      }

      mockHelpRequests[index] = {
        ...mockHelpRequests[index],
        ...updates
      };

      return { data: mockHelpRequests[index], error: null };
    },

    logConsultantAction: (consultantId: string, userId: string, actionType: string, details?: any) => {
      const action = {
        id: `action-${mockConsultantActions.length + 1}`,
        consultant_id: consultantId,
        user_id: userId,
        action_type: actionType,
        details: details || null,
        created_at: new Date().toISOString()
      };

      mockConsultantActions.push(action);
      return { data: action, error: null };
    }
  }
};

// Helper to decide whether to use mock or real backend
export const isBackendAvailable = true; // Set to true to use real Supabase, false to use mock

// Log the backend status for debugging
console.log(`Backend status: Using ${isBackendAvailable ? 'REAL Supabase' : 'MOCK'} backend`);
