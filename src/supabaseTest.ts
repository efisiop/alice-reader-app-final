// src/supabaseTest.ts
import { createClient } from '@supabase/supabase-js';

// Simple test function
export async function testConnection() {
  console.log('Testing Supabase connection with direct credentials...');

  try {
    // Hardcoded credentials for testing
    const supabaseUrl = "https://blwypdcobizmpidmuhvq.supabase.co";
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsd3lwZGNvYml6bXBpZG11aHZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyMDgzNDcsImV4cCI6MjA1OTc4NDM0N30.YP2r-CnSaM4rKclXBivanAMBQh9sMsI95F2p87zIuWM";

    console.log('URL:', supabaseUrl);
    console.log('Key present:', !!supabaseKey);

    // Create a fresh client for this test
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Try a simple query
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Supabase query error:', error);
      return { success: false, error };
    }

    console.log('Supabase query successful:', data);
    return { success: true, data };
  } catch (err) {
    console.error('Supabase connection error:', err);
    return { success: false, error: err };
  }
}

// Try to create a test book
export async function createTestBook() {
  try {
    // Hardcoded credentials for testing
    const supabaseUrl = "https://blwypdcobizmpidmuhvq.supabase.co";
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsd3lwZGNvYml6bXBpZG11aHZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyMDgzNDcsImV4cCI6MjA1OTc4NDM0N30.YP2r-CnSaM4rKclXBivanAMBQh9sMsI95F2p87zIuWM";

    // Create a fresh client for this test
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Try to insert a test book
    const { data, error } = await supabase
      .from('books')
      .insert({
        id: 'test-book',
        title: 'Test Book',
        author: 'Test Author',
        description: 'A test book for testing Supabase connection',
        total_pages: 100
      })
      .select();

    if (error) {
      console.error('Error creating test book:', error);
      return { success: false, error };
    }

    console.log('Test book created:', data);
    return { success: true, data };
  } catch (err) {
    console.error('Error creating test book:', err);
    return { success: false, error: err };
  }
}

// Make it available globally for testing in the console
if (typeof window !== 'undefined') {
  (window as any).testSupabaseConnection = testConnection;
  (window as any).createTestBook = createTestBook;
}
