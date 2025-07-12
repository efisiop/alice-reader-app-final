// src/utils/testSupabase.ts
import { createClient } from '@supabase/supabase-js';

// Test Supabase connection with robust error handling
export async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');

    // Get credentials from either environment variables or window fallbacks
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || window.SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || window.SUPABASE_KEY;

    console.log('Using Supabase URL:', supabaseUrl);
    console.log('Supabase Key present:', !!supabaseKey);

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials');
      return false;
    }

    // Create a new client instance for testing
    console.log('Creating test Supabase client...');
    const testClient = createClient(supabaseUrl, supabaseKey);

    // Try to fetch public data
    console.log('Executing test query...');
    const { data, error } = await testClient
      .from('books')
      .select('title')
      .limit(1);

    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }

    console.log('Supabase connection successful!', data);
    return true;
  } catch (err) {
    console.error('Supabase connection test error:', err);
    return false;
  }
}

// Add to window for testing in browser console
if (typeof window !== 'undefined') {
  (window as any).testSupabase = testSupabaseConnection;
}
