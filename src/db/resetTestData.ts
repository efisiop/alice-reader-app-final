// src/db/resetTestData.ts
import { getSupabaseClient } from '../services/supabaseClient';
import { appLog } from '../components/LogViewer';

/**
 * Reset test data in the database
 * This preserves the structure but clears user-generated content
 */
export const resetTestData = async (): Promise<boolean> => {
  try {
    appLog('TestSetup', 'Resetting test data...', 'info');
    const supabase = await getSupabaseClient();
    
    // Define tables to reset in order (to avoid foreign key constraints)
    const tables = [
      'ai_interactions',
      'user_prompt_responses',
      'help_requests',
      'user_feedback',
      'consultant_actions_log',
      'consultant_triggers',
      'reading_sessions',
      'reading_stats',
      'reading_progress',
    ];
    
    // Clear each table
    for (const table of tables) {
      const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (error) {
        appLog('TestSetup', `Error clearing ${table}: ${error.message}`, 'error');
      } else {
        appLog('TestSetup', `Cleared ${table}`, 'success');
      }
    }
    
    // Reset verification codes to unused
    const { error: resetError } = await supabase
      .from('verification_codes')
      .update({ is_used: false, used_by: null })
      .eq('is_used', true);
    
    if (resetError) {
      appLog('TestSetup', `Error resetting verification codes: ${resetError.message}`, 'error');
    } else {
      appLog('TestSetup', 'Reset verification codes', 'success');
    }
    
    appLog('TestSetup', 'Test data reset complete', 'success');
    return true;
  } catch (error: any) {
    appLog('TestSetup', `Error resetting test data: ${error.message}`, 'error');
    return false;
  }
};

/**
 * Create test users for testing
 */
export const createTestUsers = async (): Promise<boolean> => {
  try {
    appLog('TestSetup', 'Creating test users...', 'info');
    const supabase = await getSupabaseClient();
    
    // Test user data
    const testUsers = [
      {
        email: 'test-reader@example.com',
        password: 'Password123!',
        first_name: 'Test',
        last_name: 'Reader',
        is_consultant: false
      },
      {
        email: 'test-consultant@example.com',
        password: 'Password123!',
        first_name: 'Test',
        last_name: 'Consultant',
        is_consultant: true
      }
    ];
    
    for (const user of testUsers) {
      // Check if user already exists
      const { data: existingUsers } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', user.email)
        .limit(1);
      
      if (existingUsers && existingUsers.length > 0) {
        appLog('TestSetup', `User ${user.email} already exists, skipping`, 'info');
        continue;
      }
      
      // Create user
      const { data, error } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            first_name: user.first_name,
            last_name: user.last_name,
            is_consultant: user.is_consultant
          }
        }
      });
      
      if (error) {
        appLog('TestSetup', `Error creating user ${user.email}: ${error.message}`, 'error');
      } else if (data.user) {
        appLog('TestSetup', `Created user ${user.email} with ID ${data.user.id}`, 'success');
        
        // If consultant, add to consultant_users table
        if (user.is_consultant) {
          const { error: consultantError } = await supabase
            .from('consultant_users')
            .insert({
              user_id: data.user.id,
              role: 'PUBLISHER_STAFF',
              permissions: ['VIEW_READERS', 'RESPOND_TO_HELP', 'SEND_PROMPTS']
            });
          
          if (consultantError) {
            appLog('TestSetup', `Error adding consultant role: ${consultantError.message}`, 'error');
          }
        }
      }
    }
    
    appLog('TestSetup', 'Test users created', 'success');
    return true;
  } catch (error: any) {
    appLog('TestSetup', `Error creating test users: ${error.message}`, 'error');
    return false;
  }
};

export default { resetTestData, createTestUsers };
