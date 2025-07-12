// src/checkTables.ts
import { createClient } from '@supabase/supabase-js';

// Hardcoded credentials for testing
const supabaseUrl = "https://blwypdcobizmpidmuhvq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsd3lwZGNvYml6bXBpZG11aHZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyMDgzNDcsImV4cCI6MjA1OTc4NDM0N30.YP2r-CnSaM4rKclXBivanAMBQh9sMsI95F2p87zIuWM";

// Create a simple client without type definitions
const supabase = createClient(supabaseUrl, supabaseKey);

// Check if tables exist
export async function checkTables() {
  console.log('Checking database tables...');

  try {
    // Get list of tables
    const { data, error } = await supabase
      .rpc('get_tables');

    if (error) {
      console.error('Error getting tables:', error);
      return { success: false, error };
    }

    console.log('Tables found:', data);
    return { success: true, data };
  } catch (err) {
    console.error('Error checking tables:', err);
    return { success: false, error: err };
  }
}

// Make it available globally for testing in the console
if (typeof window !== 'undefined') {
  (window as any).checkTables = checkTables;
}
