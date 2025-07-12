// src/scripts/createTestAccounts.ts
import { getSupabaseClient } from '../services/supabaseClient';
import { testPersonas, consultantPersonas } from '../utils/testPersonas';
import { appLog } from '../components/LogViewer';

/**
 * Create test accounts for each persona
 */
export const createTestAccounts = async (): Promise<boolean> => {
  try {
    appLog('TestAccounts', 'Creating test accounts...', 'info');
    const supabase = await getSupabaseClient();
    
    // Create reader accounts
    for (const persona of testPersonas) {
      if (!persona.email || !persona.password) {
        appLog('TestAccounts', `Skipping ${persona.name} - missing email or password`, 'warning');
        continue;
      }
      
      // Check if user already exists
      const { data: existingUsers } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', persona.email)
        .limit(1);
      
      if (existingUsers && existingUsers.length > 0) {
        appLog('TestAccounts', `User ${persona.email} already exists, skipping`, 'info');
        continue;
      }
      
      // Create user
      const { data, error } = await supabase.auth.signUp({
        email: persona.email,
        password: persona.password,
        options: {
          data: {
            first_name: persona.name,
            last_name: 'Test',
            is_consultant: false
          }
        }
      });
      
      if (error) {
        appLog('TestAccounts', `Error creating user ${persona.email}: ${error.message}`, 'error');
      } else if (data.user) {
        appLog('TestAccounts', `Created user ${persona.email} with ID ${data.user.id}`, 'success');
      }
    }
    
    // Create consultant accounts
    for (const persona of consultantPersonas) {
      if (!persona.email || !persona.password) {
        appLog('TestAccounts', `Skipping ${persona.name} - missing email or password`, 'warning');
        continue;
      }
      
      // Check if user already exists
      const { data: existingUsers } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', persona.email)
        .limit(1);
      
      if (existingUsers && existingUsers.length > 0) {
        appLog('TestAccounts', `User ${persona.email} already exists, skipping`, 'info');
        continue;
      }
      
      // Create user
      const { data, error } = await supabase.auth.signUp({
        email: persona.email,
        password: persona.password,
        options: {
          data: {
            first_name: persona.name,
            last_name: 'Consultant',
            is_consultant: true
          }
        }
      });
      
      if (error) {
        appLog('TestAccounts', `Error creating consultant ${persona.email}: ${error.message}`, 'error');
      } else if (data.user) {
        appLog('TestAccounts', `Created consultant ${persona.email} with ID ${data.user.id}`, 'success');
        
        // Add to consultant_users table
        const { error: consultantError } = await supabase
          .from('consultant_users')
          .insert({
            user_id: data.user.id,
            role: persona.role.toUpperCase().replace(' ', '_'),
            permissions: ['VIEW_READERS', 'RESPOND_TO_HELP', 'SEND_PROMPTS']
          });
        
        if (consultantError) {
          appLog('TestAccounts', `Error adding consultant role: ${consultantError.message}`, 'error');
        }
      }
    }
    
    appLog('TestAccounts', 'Test accounts created', 'success');
    return true;
  } catch (error: any) {
    appLog('TestAccounts', `Error creating test accounts: ${error.message}`, 'error');
    return false;
  }
};

// Run if called directly
if (require.main === module) {
  createTestAccounts()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default createTestAccounts;
