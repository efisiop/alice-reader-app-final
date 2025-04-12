// test-supabase.js
import { createClient } from '@supabase/supabase-js';

// Supabase credentials from .env
const supabaseUrl = "https://blwypdcobizmpidmuhvq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsd3lwZGNvYml6bXBpZG11aHZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyMDgzNDcsImV4cCI6MjA1OTc4NDM0N30.YP2r-CnSaM4rKclXBivanAMBQh9sMsI95F2p87zIuWM";

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Key present:', !!supabaseKey);

async function testConnection() {
  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test query
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Supabase query error:', error);
      return;
    }

    console.log('Connection successful!');
    console.log('Data:', data);
  } catch (err) {
    console.error('Error testing connection:', err);
  }
}

testConnection();
