// src/utils/debugHelpers.ts
import { getSupabaseClient } from '../services/supabaseClient';
import { mockData, debugMockData, resetMockData } from '../services/mockSupabaseClient';

// Debug function to check authentication state
export async function debugAuthState() {
  const supabase = await getSupabaseClient();
  const session = await supabase.auth.getSession();
  const user = session.data.session?.user;

  console.log('Auth State:');
  console.log('- Session exists:', !!session.data.session);
  console.log('- User ID:', user?.id || 'Not logged in');

  if (user) {
    // Check if user is verified
    const { data } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('used_by', user.id)
      .eq('is_used', true);

    console.log('- Verification status:', data && data.length > 0 ? 'Verified' : 'Not verified');

    // Check user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    console.log('- Profile exists:', !!profile);
    if (profile) {
      console.log('- Name:', `${profile.first_name} ${profile.last_name}`);
    }
  }
}

// Test database connectivity
export async function testDatabaseConnection() {
  try {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('books')
      .select('title')
      .limit(1);

    console.log('Database connection:', error ? 'Failed' : 'Success');
    console.log('Sample data:', data);
    return !error;
  } catch (err) {
    console.error('Database connection test failed:', err);
    return false;
  }
}

// Initialize global debug helpers
export function initializeDebugHelpers() {
  // Make debug utilities available globally
  if (typeof window !== 'undefined') {
    (window as any)._debug = {
      // Auth state
      getStoredAuth: () => {
        try {
          const stored = localStorage.getItem('mockAuthSession');
          return stored ? JSON.parse(stored) : null;
        } catch (e) {
          console.error('Error parsing stored session:', e);
          return null;
        }
      },

      // Mock data inspection
      mockData,
      showMockData: debugMockData,
      resetMockData,

      // Clear auth state
      clearAuth: () => {
        localStorage.removeItem('mockAuthSession');
        console.log('Cleared stored auth session');
      },

      // Test verification
      verifyCode: (code: string, userId: string) => {
        const codeData = mockData.verificationCodes.get(code);
        if (!codeData) {
          console.log(`Code ${code} not found`);
          return false;
        }

        codeData.is_used = true;
        codeData.used_by = userId;
        mockData.verificationCodes.set(code, codeData);
        console.log(`Set code ${code} as used by ${userId}`);

        return true;
      },

      // Run auth state check
      checkAuth: debugAuthState,

      // Test database connection
      testDb: testDatabaseConnection
    };

    console.log('Debug helpers initialized. Try window._debug in console');
  }
}

// Add global debug object
declare global {
  interface Window {
    _debug: {
      auth: typeof debugAuthState;
      db: typeof testDatabaseConnection;
      getSupabaseClient: typeof getSupabaseClient;
    };
  }
}

// Initialize debug helpers in development mode
if (process.env.NODE_ENV !== 'production') {
  window._debug = {
    auth: debugAuthState,
    db: testDatabaseConnection,
    getSupabaseClient: getSupabaseClient
  };
}
