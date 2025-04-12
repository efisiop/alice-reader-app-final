// src/testSql.ts
import { createClient } from '@supabase/supabase-js';

// Hardcoded credentials for testing
const supabaseUrl = "https://blwypdcobizmpidmuhvq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsd3lwZGNvYml6bXBpZG11aHZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyMDgzNDcsImV4cCI6MjA1OTc4NDM0N30.YP2r-CnSaM4rKclXBivanAMBQh9sMsI95F2p87zIuWM";

// Create a simple client without type definitions
const supabase = createClient(supabaseUrl, supabaseKey);

// Run a direct SQL query
export async function testSql() {
  console.log('Running direct SQL query...');

  try {
    // Run a simple SQL query
    const { data, error } = await supabase
      .rpc('test_connection');

    if (error) {
      console.error('SQL query error:', error);

      // Try a different approach
      console.log('Trying alternative approach...');
      const { data: altData, error: altError } = await supabase
        .from('_test_connection')
        .select('*');

      if (altError) {
        console.error('Alternative approach failed:', altError);
        return { success: false, error: altError };
      }

      console.log('Alternative approach succeeded:', altData);
      return { success: true, data: altData };
    }

    console.log('SQL query successful:', data);
    return { success: true, data };
  } catch (err) {
    console.error('SQL query error:', err);
    return { success: false, error: err };
  }
}

// Make it available globally for testing in the console
if (typeof window !== 'undefined') {
  (window as any).testSql = testSql;
}
