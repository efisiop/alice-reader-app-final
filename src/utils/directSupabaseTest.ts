// src/utils/directSupabaseTest.ts
// This file contains a function to test the Supabase API directly using fetch

/**
 * Tests the Supabase API directly using fetch instead of the Supabase client
 * This can help identify if the issue is with the Supabase client or the API itself
 */
export async function testSupabaseAPI() {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://blwypdcobizmpidmuhvq.supabase.co';
  const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsd3lwZGNvYml6bXBpZG11aHZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyMDgzNDcsImV4cCI6MjA1OTc4NDM0N30.YP2r-CnSaM4rKclXBivanAMBQh9sMsI95F2p87zIuWM';

  console.log('Testing Supabase API directly with fetch...');
  console.log('URL:', SUPABASE_URL);
  console.log('Key length:', SUPABASE_KEY?.length || 'not found');

  try {
    // Make a direct fetch request to the Supabase REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/books?select=*&limit=1`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const statusText = response.statusText;
    const status = response.status;

    console.log('Response status:', status, statusText);

    if (!response.ok) {
      const text = await response.text();
      console.error('Error response:', text);
      return {
        success: false,
        error: {
          status,
          statusText,
          message: text
        }
      };
    }

    const data = await response.json();
    console.log('Data:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Fetch error:', error);
    return { success: false, error };
  }
}

// Make it available globally for testing in the console
if (typeof window !== 'undefined') {
  (window as any).testSupabaseAPI = testSupabaseAPI;
}
