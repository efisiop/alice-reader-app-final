// scripts/create-test-accounts.ts
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables from .env.beta
const envPath = path.resolve(process.cwd(), '.env.beta');
if (fs.existsSync(envPath)) {
  console.log(`Loading environment from ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.log('No .env.beta file found, using default environment');
  dotenv.config();
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Needs admin rights

if (!supabaseUrl) {
  console.error('Missing VITE_SUPABASE_URL environment variable');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.warn('Missing SUPABASE_SERVICE_KEY environment variable. Using anon key instead.');
  console.warn('Note: Some operations may fail due to insufficient permissions.');
}

// Use service key if available, otherwise fall back to anon key
const supabaseKey = supabaseServiceKey || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('Missing SUPABASE_SERVICE_KEY or VITE_SUPABASE_ANON_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test accounts data
const readerAccounts = [
  { email: 'leo@test.com', password: 'Test1234!', firstName: 'Leo', lastName: 'Test', role: 'reader' },
  { email: 'sarah@test.com', password: 'Test1234!', firstName: 'Sarah', lastName: 'Test', role: 'reader' },
  { email: 'reader1@test.com', password: 'Test1234!', firstName: 'Reader', lastName: 'One', role: 'reader' },
  { email: 'reader2@test.com', password: 'Test1234!', firstName: 'Reader', lastName: 'Two', role: 'reader' },
];

const consultantAccounts = [
  { email: 'consultant1@test.com', password: 'Test1234!', firstName: 'Mark', lastName: 'Consultant', role: 'consultant' },
  { email: 'consultant2@test.com', password: 'Test1234!', firstName: 'Anna', lastName: 'Advisor', role: 'consultant' },
];

// Create accounts
async function createAccounts() {
  console.log('Creating test accounts...');
  
  // Create reader accounts
  for (const account of readerAccounts) {
    try {
      console.log(`Creating reader account: ${account.email}`);
      
      // Check if user already exists
      const { data: existingUsers, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', account.email);
      
      if (checkError) {
        console.error(`Error checking if user ${account.email} exists:`, checkError);
        continue;
      }
      
      if (existingUsers && existingUsers.length > 0) {
        console.log(`User ${account.email} already exists, skipping`);
        continue;
      }
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true // Auto-confirm email
      });
      
      if (authError) {
        console.error(`Failed to create auth user ${account.email}:`, authError);
        continue;
      }
      
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          first_name: account.firstName,
          last_name: account.lastName,
          email: account.email,
          role: account.role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (profileError) {
        console.error(`Failed to create profile for ${account.email}:`, profileError);
        continue;
      }
      
      console.log(`Created reader account: ${account.email}`);
    } catch (error) {
      console.error(`Error creating account ${account.email}:`, error);
    }
  }
  
  // Create consultant accounts
  for (const account of consultantAccounts) {
    try {
      console.log(`Creating consultant account: ${account.email}`);
      
      // Check if user already exists
      const { data: existingUsers, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', account.email);
      
      if (checkError) {
        console.error(`Error checking if user ${account.email} exists:`, checkError);
        continue;
      }
      
      if (existingUsers && existingUsers.length > 0) {
        console.log(`User ${account.email} already exists, skipping`);
        continue;
      }
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true // Auto-confirm email
      });
      
      if (authError) {
        console.error(`Failed to create auth user ${account.email}:`, authError);
        continue;
      }
      
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          first_name: account.firstName,
          last_name: account.lastName,
          email: account.email,
          role: account.role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (profileError) {
        console.error(`Failed to create profile for ${account.email}:`, profileError);
        continue;
      }
      
      // Add to consultant_users table
      const { error: consultantError } = await supabase
        .from('consultant_users')
        .upsert({
          user_id: authData.user.id,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (consultantError) {
        console.error(`Failed to add ${account.email} to consultant_users:`, consultantError);
        continue;
      }
      
      console.log(`Created consultant account: ${account.email}`);
    } catch (error) {
      console.error(`Error creating account ${account.email}:`, error);
    }
  }
  
  console.log('Account creation completed');
}

// Create verification codes
async function createVerificationCodes() {
  console.log('Creating verification codes...');
  
  const codes = [
    { code: 'BETA001', book_id: 'alice-in-wonderland' },
    { code: 'BETA002', book_id: 'alice-in-wonderland' },
    { code: 'BETA003', book_id: 'alice-in-wonderland' },
    { code: 'BETA004', book_id: 'alice-in-wonderland' },
    { code: 'BETA005', book_id: 'alice-in-wonderland' },
  ];
  
  for (const codeData of codes) {
    try {
      console.log(`Creating verification code: ${codeData.code}`);
      
      // Check if code already exists
      const { data: existingCodes, error: checkError } = await supabase
        .from('verification_codes')
        .select('code')
        .eq('code', codeData.code);
      
      if (checkError) {
        console.error(`Error checking if code ${codeData.code} exists:`, checkError);
        continue;
      }
      
      if (existingCodes && existingCodes.length > 0) {
        console.log(`Code ${codeData.code} already exists, skipping`);
        continue;
      }
      
      const { error } = await supabase
        .from('verification_codes')
        .upsert({
          code: codeData.code,
          book_id: codeData.book_id,
          is_used: false,
          created_at: new Date().toISOString()
        });
      
      if (error) {
        console.error(`Failed to create code ${codeData.code}:`, error);
        continue;
      }
      
      console.log(`Created verification code: ${codeData.code}`);
    } catch (error) {
      console.error(`Error creating code ${codeData.code}:`, error);
    }
  }
  
  console.log('Verification code creation completed');
}

// Run the script
async function main() {
  try {
    await createAccounts();
    await createVerificationCodes();
    console.log('Test data creation completed successfully');
  } catch (error) {
    console.error('Failed to create test data:', error);
  } finally {
    process.exit(0);
  }
}

main();
