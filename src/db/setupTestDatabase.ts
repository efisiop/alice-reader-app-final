// src/db/setupTestDatabase.ts
import { createClient } from '@supabase/supabase-js';
import { generateTestDataset } from '../utils/testDataGenerator';

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_TEST_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_TEST_KEY || '';

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Set up the test database with sample data
 */
async function setupTestDatabase() {
  try {
    console.log('Setting up test database...');
    
    // Generate test data
    const testData = generateTestDataset();
    
    // Clear existing data
    await clearDatabase();
    
    // Insert test data
    await insertTestData(testData);
    
    console.log('Test database setup complete!');
  } catch (error) {
    console.error('Error setting up test database:', error);
  }
}

/**
 * Clear all data from the database
 */
async function clearDatabase() {
  console.log('Clearing database...');
  
  // Define tables to clear in order (to avoid foreign key constraints)
  const tables = [
    'reading_sessions',
    'reading_stats',
    'reading_progress',
    'ai_interactions',
    'user_prompt_responses',
    'help_requests',
    'user_feedback',
    'consultant_actions_log',
    'consultant_triggers',
    'sections',
    'chapters',
    'books',
    'consultant_users',
    'profiles',
  ];
  
  // Clear each table
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (error) {
      console.error(`Error clearing ${table}:`, error);
    } else {
      console.log(`Cleared ${table}`);
    }
  }
}

/**
 * Insert test data into the database
 * @param testData The test data to insert
 */
async function insertTestData(testData: any) {
  console.log('Inserting test data...');
  
  // Insert books
  const { error: booksError } = await supabase.from('books').insert(testData.books);
  
  if (booksError) {
    console.error('Error inserting books:', booksError);
  } else {
    console.log(`Inserted ${testData.books.length} books`);
  }
  
  // Insert chapters
  const { error: chaptersError } = await supabase.from('chapters').insert(testData.chapters);
  
  if (chaptersError) {
    console.error('Error inserting chapters:', chaptersError);
  } else {
    console.log(`Inserted ${testData.chapters.length} chapters`);
  }
  
  // Insert sections
  const { error: sectionsError } = await supabase.from('sections').insert(testData.sections);
  
  if (sectionsError) {
    console.error('Error inserting sections:', sectionsError);
  } else {
    console.log(`Inserted ${testData.sections.length} sections`);
  }
  
  // Insert users
  for (const user of [...testData.users, ...testData.consultants]) {
    // Create user in auth
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: 'Password123!',
      email_confirm: true,
    });
    
    if (userError) {
      console.error('Error creating user:', userError);
      continue;
    }
    
    // Create profile
    const { error: profileError } = await supabase.from('profiles').insert({
      id: userData.user.id,
      email: userData.user.email,
    });
    
    if (profileError) {
      console.error('Error creating profile:', profileError);
    }
    
    // Create consultant user if needed
    if (user.is_consultant) {
      const { error: consultantError } = await supabase.from('consultant_users').insert({
        user_id: userData.user.id,
        is_active: true,
      });
      
      if (consultantError) {
        console.error('Error creating consultant:', consultantError);
      }
    }
    
    // Update user ID in test data
    const oldUserId = user.id;
    user.id = userData.user.id;
    
    // Update user ID in related data
    updateUserId(testData, oldUserId, userData.user.id);
  }
  
  // Insert reading progress
  const { error: progressError } = await supabase.from('reading_progress').insert(testData.readingProgress);
  
  if (progressError) {
    console.error('Error inserting reading progress:', progressError);
  } else {
    console.log(`Inserted ${testData.readingProgress.length} reading progress records`);
  }
  
  // Insert reading stats
  const { error: statsError } = await supabase.from('reading_stats').insert(testData.readingStats);
  
  if (statsError) {
    console.error('Error inserting reading stats:', statsError);
  } else {
    console.log(`Inserted ${testData.readingStats.length} reading stats records`);
  }
  
  // Insert reading sessions
  const { error: sessionsError } = await supabase.from('reading_sessions').insert(testData.readingSessions);
  
  if (sessionsError) {
    console.error('Error inserting reading sessions:', sessionsError);
  } else {
    console.log(`Inserted ${testData.readingSessions.length} reading sessions`);
  }
  
  // Insert AI interactions
  const { error: aiError } = await supabase.from('ai_interactions').insert(testData.aiInteractions);
  
  if (aiError) {
    console.error('Error inserting AI interactions:', aiError);
  } else {
    console.log(`Inserted ${testData.aiInteractions.length} AI interactions`);
  }
  
  // Insert help requests
  const { error: helpError } = await supabase.from('help_requests').insert(testData.helpRequests);
  
  if (helpError) {
    console.error('Error inserting help requests:', helpError);
  } else {
    console.log(`Inserted ${testData.helpRequests.length} help requests`);
  }
  
  // Insert user feedback
  const { error: feedbackError } = await supabase.from('user_feedback').insert(testData.userFeedback);
  
  if (feedbackError) {
    console.error('Error inserting user feedback:', feedbackError);
  } else {
    console.log(`Inserted ${testData.userFeedback.length} user feedback records`);
  }
}

/**
 * Update user ID in related data
 * @param testData The test data
 * @param oldUserId The old user ID
 * @param newUserId The new user ID
 */
function updateUserId(testData: any, oldUserId: string, newUserId: string) {
  // Update reading progress
  for (const progress of testData.readingProgress) {
    if (progress.user_id === oldUserId) {
      progress.user_id = newUserId;
    }
  }
  
  // Update reading stats
  for (const stats of testData.readingStats) {
    if (stats.user_id === oldUserId) {
      stats.user_id = newUserId;
    }
  }
  
  // Update reading sessions
  for (const session of testData.readingSessions) {
    if (session.user_id === oldUserId) {
      session.user_id = newUserId;
    }
  }
  
  // Update AI interactions
  for (const interaction of testData.aiInteractions) {
    if (interaction.user_id === oldUserId) {
      interaction.user_id = newUserId;
    }
  }
  
  // Update help requests
  for (const request of testData.helpRequests) {
    if (request.user_id === oldUserId) {
      request.user_id = newUserId;
    }
  }
  
  // Update user feedback
  for (const feedback of testData.userFeedback) {
    if (feedback.user_id === oldUserId) {
      feedback.user_id = newUserId;
    }
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupTestDatabase();
}

export { setupTestDatabase, clearDatabase };
