// src/setupDatabase.ts
import { createClient } from '@supabase/supabase-js';

// Hardcoded credentials for testing
const supabaseUrl = "https://blwypdcobizmpidmuhvq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsd3lwZGNvYml6bXBpZG11aHZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyMDgzNDcsImV4cCI6MjA1OTc4NDM0N30.YP2r-CnSaM4rKclXBivanAMBQh9sMsI95F2p87zIuWM";

// Create a simple client without type definitions
const supabase = createClient(supabaseUrl, supabaseKey);

// Check if the books table exists
export async function checkBooksTable() {
  console.log('Checking if books table exists...');

  try {
    // Try to select from the books table
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error checking books table:', error);
      return { exists: false, error };
    }

    console.log('Books table exists:', data);
    return { exists: true, data };
  } catch (err) {
    console.error('Error checking books table:', err);
    return { exists: false, error: err };
  }
}

// Create a test book
export async function createTestBook() {
  console.log('Creating test book...');

  try {
    // Insert a test book
    const { data, error } = await supabase
      .from('books')
      .insert({
        id: 'alice-in-wonderland',
        title: 'Alice in Wonderland',
        author: 'Lewis Carroll',
        description: 'The classic tale of a girl who falls through a rabbit hole into a fantasy world.',
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

// Create a test verification code
export async function createTestVerificationCode() {
  console.log('Creating test verification code...');

  try {
    // Insert a test verification code
    const { data, error } = await supabase
      .from('verification_codes')
      .insert({
        code: 'ALICE123',
        book_id: 'alice-in-wonderland',
        is_used: false
      })
      .select();

    if (error) {
      console.error('Error creating test verification code:', error);
      return { success: false, error };
    }

    console.log('Test verification code created:', data);
    return { success: true, data };
  } catch (err) {
    console.error('Error creating test verification code:', err);
    return { success: false, error: err };
  }
}

// Run all setup functions
export async function setupDatabase() {
  console.log('Setting up database...');

  // Check if books table exists
  const booksTableResult = await checkBooksTable();

  if (!booksTableResult.exists) {
    console.log('Books table does not exist or is empty. Creating test data...');

    // Create test book
    const bookResult = await createTestBook();

    if (bookResult.success) {
      // Create test verification code
      await createTestVerificationCode();
    }
  }

  console.log('Database setup complete!');
}

// Make it available globally for testing in the console
if (typeof window !== 'undefined') {
  (window as any).setupDatabase = setupDatabase;
  (window as any).checkBooksTable = checkBooksTable;
  (window as any).createTestBook = createTestBook;
  (window as any).createTestVerificationCode = createTestVerificationCode;
}
