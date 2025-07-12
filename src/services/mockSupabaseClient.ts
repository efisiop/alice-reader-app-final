import { Database } from '../types/supabase';

// Mock data storage
export const mockData = {
  users: new Map(),
  profiles: new Map(),
  verificationCodes: new Map([
    ['ALICE123', { is_used: false, used_by: null, book_id: '550e8400-e29b-41d4-a716-446655440000' }],
    ['WONDERLAND', { is_used: false, used_by: null, book_id: '550e8400-e29b-41d4-a716-446655440000' }],
    ['RABBIT', { is_used: false, used_by: null, book_id: '550e8400-e29b-41d4-a716-446655440000' }],
    ['TEAPARTY', { is_used: false, used_by: null, book_id: '550e8400-e29b-41d4-a716-446655440000' }],
    ['CHESHIRE', { is_used: false, used_by: null, book_id: '550e8400-e29b-41d4-a716-446655440000' }]
  ]),
  books: new Map([
    ['550e8400-e29b-41d4-a716-446655440000', {
      id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Alice in Wonderland',
      author: 'Lewis Carroll',
      description: 'The classic tale of a girl who falls through a rabbit hole into a fantasy world.',
      total_pages: 100
    }]
  ]),
  readingProgress: new Map(),
  readingStats: new Map(),
  aiInteractions: new Map(),
  // Add more mock data as needed
};

// Create a complete mock implementation of all Supabase methods used in the application
export const supabase = {
  auth: {
    getSession: async () => {
      console.log('MOCK: auth.getSession called');
      const storedSessionStr = localStorage.getItem('mockAuthSession');
      if (storedSessionStr) {
        try {
          const session = JSON.parse(storedSessionStr);
          return { data: { session } };
        } catch (e) {
          console.error('Error parsing stored session:', e);
        }
      }
      return { data: { session: null } };
    },

    getUser: async () => {
      console.log('MOCK: auth.getUser called');
      const storedSessionStr = localStorage.getItem('mockAuthSession');
      if (storedSessionStr) {
        try {
          const session = JSON.parse(storedSessionStr);
          return { data: { user: session.user } };
        } catch (e) {
          console.error('Error parsing stored session:', e);
        }
      }
      return { data: { user: null } };
    },

    signUp: async ({ email, password }) => {
      console.log('MOCK: auth.signUp called with email:', email);
      const id = `mock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // Create mock user
      const mockUser = {
        id,
        email,
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      };

      // Create mock session
      const mockSession = {
        access_token: `mock-token-${id}`,
        refresh_token: `mock-refresh-${id}`,
        expires_at: Date.now() + 3600,
        user: mockUser,
      };

      // Store in mock data
      mockData.users.set(id, { email, password, id, verified: false });

      // Store session in localStorage for persistence
      localStorage.setItem('mockAuthSession', JSON.stringify(mockSession));

      console.log('MOCK: sign up successful, user created with ID:', id);
      return { data: { user: mockUser, session: mockSession }, error: null };
    },

    signInWithPassword: async ({ email, password }) => {
      console.log('MOCK: auth.signInWithPassword called with email:', email);

      // Check if user exists
      let userId = null;
      for (const [id, userData] of mockData.users.entries()) {
        if (userData.email === email) {
          userId = id;
          break;
        }
      }

      if (!userId) {
        // For testing, create user if doesn't exist
        console.log('MOCK: User not found, creating one for testing');
        return supabase.auth.signUp({ email, password });
      }

      const user = mockData.users.get(userId);

      // Create mock user
      const mockUser = {
        id: userId,
        email,
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      };

      // Create mock session
      const mockSession = {
        access_token: `mock-token-${userId}`,
        refresh_token: `mock-refresh-${userId}`,
        expires_at: Date.now() + 3600,
        user: mockUser,
      };

      // Store session in localStorage for persistence
      localStorage.setItem('mockAuthSession', JSON.stringify(mockSession));

      console.log('MOCK: sign in successful for user ID:', userId);
      return { data: { user: mockUser, session: mockSession }, error: null };
    },

    signOut: async () => {
      console.log('MOCK: auth.signOut called');
      localStorage.removeItem('mockAuthSession');
      return { error: null };
    },

    onAuthStateChange: (callback) => {
      console.log('MOCK: auth.onAuthStateChange registered');
      // In a real implementation, we would set up listeners
      // For mock, we'll just return an empty subscription
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              console.log('MOCK: unsubscribed from auth state change');
            }
          }
        }
      };
    }
  },

  from: (table) => {
    console.log(`MOCK: from('${table}') called`);

    return {
      select: (query = '*') => {
        console.log(`MOCK: select('${query}') from ${table}`);

        return {
          eq: (column, value) => {
            console.log(`MOCK: eq('${column}', '${value}') on ${table}`);

            return {
              eq: (column2, value2) => {
                console.log(`MOCK: second eq('${column2}', '${value2}') on ${table}`);

                return {
                  single: async () => {
                    console.log(`MOCK: single() on ${table} with ${column}='${value}' and ${column2}='${value2}'`);

                    if (table === 'verification_codes') {
                      if (column === 'used_by' && column2 === 'is_used' && value2 === true) {
                        // Check for verification status
                        for (const [codeKey, codeData] of mockData.verificationCodes.entries()) {
                          if (codeData.used_by === value && codeData.is_used === true) {
                            return {
                              data: {
                                code: codeKey,
                                ...codeData
                              },
                              error: null
                            };
                          }
                        }
                        return { data: null, error: { message: 'No verification record found' } };
                      }
                    }

                    return { data: null, error: { message: 'Not implemented in mock' } };
                  },

                  limit: (limit) => {
                    console.log(`MOCK: limit ${limit} on ${table}`);
                    return {
                      data: [],
                      error: null
                    };
                  }
                };
              },

              single: async () => {
                console.log(`MOCK: single() on ${table} where ${column}='${value}'`);

                if (table === 'verification_codes') {
                  if (column === 'code') {
                    // Lookup by code
                    const codeData = mockData.verificationCodes.get(value);
                    if (codeData) {
                      return {
                        data: {
                          code: value,
                          ...codeData
                        },
                        error: null
                      };
                    }
                    return { data: null, error: { message: 'Code not found' } };
                  } else if (column === 'used_by') {
                    // Lookup by user
                    for (const [codeKey, codeData] of mockData.verificationCodes.entries()) {
                      if (codeData.used_by === value) {
                        return {
                          data: {
                            code: codeKey,
                            ...codeData
                          },
                          error: null
                        };
                      }
                    }
                    return { data: null, error: { message: 'No code used by this user' } };
                  }
                }

                if (table === 'profiles') {
                  const profile = mockData.profiles.get(value);
                  if (profile) {
                    return { data: profile, error: null };
                  }
                  return { data: null, error: { message: 'Profile not found' } };
                }

                return { data: null, error: { message: 'Not implemented in mock' } };
              },

              limit: (limit) => {
                console.log(`MOCK: limit ${limit} on ${table}`);
                return {
                  data: [],
                  error: null
                };
              }
            };
          },

          single: async () => {
            console.log(`MOCK: single() on ${table} with no filters`);

            if (table === 'books') {
              const books = Array.from(mockData.books.values());
              return books.length > 0
                ? { data: books[0], error: null }
                : { data: null, error: { message: 'No books found' } };
            }

            return { data: null, error: null };
          }
        };
      },

      insert: (data) => {
        console.log(`MOCK: insert into ${table}:`, data);

        return {
          select: () => {
            return {
              single: async () => {
                console.log(`MOCK: single() after insert into ${table}`);

                if (table === 'profiles') {
                  const { id } = data;
                  mockData.profiles.set(id, { ...data });
                  return { data, error: null };
                }

                if (table === 'reading_progress') {
                  const { user_id, book_id } = data;
                  const id = `${user_id}-${book_id}`;
                  mockData.readingProgress.set(id, { ...data });
                  return { data: { ...data, id }, error: null };
                }

                if (table === 'ai_interactions') {
                  const id = `interaction-${Date.now()}`;
                  mockData.aiInteractions.set(id, { ...data, id });
                  return { data: { ...data, id }, error: null };
                }

                // Default case
                return { data, error: null };
              }
            };
          }
        };
      },

      update: (data) => {
        console.log(`MOCK: update ${table}:`, data);

        return {
          eq: (column, value) => {
            console.log(`MOCK: update where ${column}='${value}'`);

            return {
              select: () => {
                return {
                  single: async () => {
                    console.log(`MOCK: single() after update on ${table} where ${column}='${value}'`);

                    if (table === 'verification_codes') {
                      if (column === 'code') {
                        const codeData = mockData.verificationCodes.get(value);
                        if (codeData) {
                          const updatedData = { ...codeData, ...data };
                          mockData.verificationCodes.set(value, updatedData);
                          return { data: { code: value, ...updatedData }, error: null };
                        }
                        return { data: null, error: { message: 'Code not found' } };
                      }
                    }

                    if (table === 'profiles') {
                      if (column === 'id') {
                        const profile = mockData.profiles.get(value);
                        if (profile) {
                          const updatedProfile = { ...profile, ...data };
                          mockData.profiles.set(value, updatedProfile);
                          return { data: updatedProfile, error: null };
                        }
                        return { data: null, error: { message: 'Profile not found' } };
                      }
                    }

                    return { data: { ...data, [column]: value }, error: null };
                  }
                };
              }
            };
          }
        };
      },

      upsert: (data) => {
        console.log(`MOCK: upsert into ${table}:`, data);

        return {
          select: () => {
            return {
              single: async () => {
                console.log(`MOCK: single() after upsert into ${table}`);

                if (table === 'profiles') {
                  const { id } = data;
                  const existingProfile = mockData.profiles.get(id);
                  const newProfile = existingProfile
                    ? { ...existingProfile, ...data }
                    : { ...data };

                  mockData.profiles.set(id, newProfile);
                  return { data: newProfile, error: null };
                }

                return { data, error: null };
              }
            };
          }
        };
      }
    };
  },

  rpc: (functionName, params) => {
    console.log(`MOCK: rpc('${functionName}') called with params:`, params);

    return {
      single: async () => {
        if (functionName === 'get_sections_for_page') {
          const { book_id_param, page_number_param } = params;
          console.log(`MOCK: get_sections_for_page for book ${book_id_param}, page ${page_number_param}`);

          // Mock section data
          return {
            data: {
              id: 'section-1',
              chapter_id: 'chapter-1',
              title: 'Down the Rabbit-Hole',
              content: "Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, 'and what is the use of a book,' thought Alice 'without pictures or conversations?'",
              start_page: 1,
              end_page: 5,
              number: 1,
              chapter_title: 'Chapter 1',
              chapter_number: 1
            },
            error: null
          };
        }

        if (functionName === 'get_definition_with_context') {
          const { term_param } = params;
          console.log(`MOCK: get_definition_with_context for term '${term_param}'`);

          // Mock definitions
          const definitions = {
            'alice': 'The curious and imaginative protagonist of the story.',
            'rabbit': 'A white rabbit with pink eyes that Alice follows down the rabbit hole.',
            'wonderland': 'The magical world that Alice discovers after falling down the rabbit hole.',
            'cheshire': 'Relating to the Cheshire Cat, a mysterious feline known for its distinctive grin.',
            'dormouse': 'A small, mouse-like rodent known for being sleepy, as featured in the tea party scene.',
            'tea': 'A popular hot beverage, central to the famous mad tea party scene.',
            'queen': 'The Queen of Hearts, a temperamental ruler in Wonderland known for ordering beheadings.',
            'hatter': 'The Mad Hatter, an eccentric character who hosts a never-ending tea party.',
            'caterpillar': 'A wise but cryptic blue caterpillar who sits on a mushroom and smokes a hookah.',
            'croquet': 'A game played with mallets and balls, famously played with flamingos and hedgehogs in Wonderland.',
          };

          const term = term_param.toLowerCase();
          if (definitions[term]) {
            return {
              data: [{ definition: definitions[term], priority: 1 }],
              error: null
            };
          }

          return { data: [], error: null };
        }

        return { data: null, error: { message: `RPC function ${functionName} not implemented in mock` } };
      }
    };
  },

  storage: {
    from: (bucket) => {
      console.log(`MOCK: storage.from('${bucket}') called`);

      return {
        upload: async (path, file) => {
          console.log(`MOCK: storage upload to ${bucket}/${path}`);
          return { data: { path }, error: null };
        },

        getPublicUrl: (path) => {
          console.log(`MOCK: storage get public URL for ${bucket}/${path}`);
          return {
            data: { publicUrl: `https://mock-storage.example.com/${bucket}/${path}` },
            error: null
          };
        }
      };
    }
  }
};

// Helper functions for testing
export const resetMockData = () => {
  mockData.users = new Map();
  mockData.profiles = new Map();
  mockData.readingProgress = new Map();
  mockData.readingStats = new Map();
  mockData.aiInteractions = new Map();

  // Reset verification codes to unused state
  mockData.verificationCodes = new Map([
    ['ALICE123', { is_used: false, used_by: null, book_id: '550e8400-e29b-41d4-a716-446655440000' }],
    ['WONDERLAND', { is_used: false, used_by: null, book_id: '550e8400-e29b-41d4-a716-446655440000' }],
    ['RABBIT', { is_used: false, used_by: null, book_id: '550e8400-e29b-41d4-a716-446655440000' }],
    ['TEAPARTY', { is_used: false, used_by: null, book_id: '550e8400-e29b-41d4-a716-446655440000' }],
    ['CHESHIRE', { is_used: false, used_by: null, book_id: '550e8400-e29b-41d4-a716-446655440000' }]
  ]);
};

export const debugMockData = () => {
  console.log('=== MOCK DATA DEBUG ===');
  console.log('Users:', Array.from(mockData.users.entries()));
  console.log('Profiles:', Array.from(mockData.profiles.entries()));
  console.log('Verification Codes:', Array.from(mockData.verificationCodes.entries()));
  console.log('Reading Progress:', Array.from(mockData.readingProgress.entries()));
  console.log('=======================');
};

// Make these available on window for debugging
if (typeof window !== 'undefined') {
  (window as any)._mockData = mockData;
  (window as any)._mockDebug = {
    resetMockData,
    debugMockData
  };
}
