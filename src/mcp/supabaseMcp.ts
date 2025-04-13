import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

interface CachedSession {
  session: Session | null;
  timestamp: number;
}

interface MCPConfig {
  supabaseUrl: string;
  supabaseKey: string;
  mockEnabled?: boolean;
  cacheEnabled?: boolean;
  cacheDuration?: number; // in milliseconds
  debug?: boolean;
}

class SupabaseMCP {
  private client: SupabaseClient;
  private sessionCache: Map<string, CachedSession> = new Map();
  private config: MCPConfig;
  private mockData: Map<string, any> = new Map();

  constructor(config: MCPConfig) {
    this.config = {
      mockEnabled: false,
      cacheEnabled: true,
      cacheDuration: 5 * 60 * 1000, // 5 minutes default
      debug: false,
      ...config
    };

    this.client = createClient(config.supabaseUrl, config.supabaseKey);
    this.initializeMockData();
  }

  private log(message: string, data?: any) {
    if (this.config.debug) {
      console.log(`[SupabaseMCP] ${message}`, data || '');
    }
  }

  private initializeMockData() {
    // Initialize mock data for testing
    this.mockData.set('mockUser', {
      id: 'mock-user-id',
      email: 'mock@example.com',
      user_metadata: {
        first_name: 'Mock',
        last_name: 'User'
      }
    });
  }

  private getCachedSession(key: string): Session | null {
    if (!this.config.cacheEnabled) return null;

    const cached = this.sessionCache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > (this.config.cacheDuration || 0);
    if (isExpired) {
      this.sessionCache.delete(key);
      return null;
    }

    return cached.session;
  }

  private setCachedSession(key: string, session: Session | null) {
    if (!this.config.cacheEnabled) return;

    this.sessionCache.set(key, {
      session,
      timestamp: Date.now()
    });
  }

  async getSession(): Promise<{ data: { session: Session | null }, error: Error | null }> {
    try {
      if (this.config.mockEnabled) {
        this.log('Returning mock session');
        return {
          data: { session: null },
          error: null
        };
      }

      const cachedSession = this.getCachedSession('current');
      if (cachedSession) {
        this.log('Returning cached session');
        return {
          data: { session: cachedSession },
          error: null
        };
      }

      const { data, error } = await this.client.auth.getSession();
      
      if (!error && data.session) {
        this.setCachedSession('current', data.session);
      }

      return { data, error };
    } catch (error) {
      this.log('Error getting session', error);
      return {
        data: { session: null },
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  async signIn(email: string, password: string): Promise<{ data: { user: User | null }, error: Error | null }> {
    try {
      if (this.config.mockEnabled) {
        const mockUser = this.mockData.get('mockUser');
        return {
          data: { user: mockUser },
          error: null
        };
      }

      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password
      });

      if (!error && data.session) {
        this.setCachedSession('current', data.session);
      }

      return {
        data: { user: data.user },
        error
      };
    } catch (error) {
      return {
        data: { user: null },
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  async signUp(email: string, password: string): Promise<{ data: { user: User | null }, error: Error | null }> {
    try {
      if (this.config.mockEnabled) {
        const mockUser = this.mockData.get('mockUser');
        return {
          data: { user: mockUser },
          error: null
        };
      }

      const { data, error } = await this.client.auth.signUp({
        email,
        password
      });

      if (!error && data.session) {
        this.setCachedSession('current', data.session);
      }

      return {
        data: { user: data.user },
        error
      };
    } catch (error) {
      return {
        data: { user: null },
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  async signOut(): Promise<{ error: Error | null }> {
    try {
      if (this.config.mockEnabled) {
        this.sessionCache.clear();
        return { error: null };
      }

      const { error } = await this.client.auth.signOut();
      this.sessionCache.clear();
      return { error };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    if (this.config.mockEnabled) {
      // Return a mock unsubscribe function
      return {
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        },
        error: null
      };
    }

    return this.client.auth.onAuthStateChange((event, session) => {
      if (session) {
        this.setCachedSession('current', session);
      } else {
        this.sessionCache.clear();
      }
      callback(event, session);
    });
  }

  // Helper method to toggle mock mode
  setMockEnabled(enabled: boolean) {
    this.config.mockEnabled = enabled;
    this.log(`Mock mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Helper method to toggle cache
  setCacheEnabled(enabled: boolean) {
    this.config.cacheEnabled = enabled;
    this.log(`Cache ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Helper method to get configuration state
  getConfig() {
    return {
      mockEnabled: this.config.mockEnabled,
      cacheEnabled: this.config.cacheEnabled,
      cacheDuration: this.config.cacheDuration,
      debug: this.config.debug
    };
  }

  // Helper method to set mock data
  setMockData(key: string, data: any) {
    this.mockData.set(key, data);
    this.log(`Mock data updated for key: ${key}`);
  }

  // Helper method to clear cache
  clearCache() {
    this.sessionCache.clear();
    this.log('Cache cleared');
  }
}

export default SupabaseMCP; 