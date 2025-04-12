#!/usr/bin/env ts-node
/**
 * Supabase Backend Verification Script
 * 
 * This script verifies that the Supabase backend is properly configured
 * for the Alice Reader application before deployment.
 * 
 * It checks:
 * 1. Connection to Supabase
 * 2. Database schema (tables, columns)
 * 3. RLS policies
 * 4. Edge functions
 * 5. Storage buckets
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../src/types/supabase';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// Load environment variables
dotenv.config();

// ANSI color codes for output formatting
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m'
};

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Expected tables in the database
const EXPECTED_TABLES = [
  'books',
  'chapters',
  'sections',
  'profiles',
  'consultant_users',
  'verification_codes',
  'dictionary',
  'reading_progress',
  'reading_stats',
  'reading_sessions',
  'ai_interactions',
  'ai_prompts',
  'user_prompt_responses',
  'user_vocabulary',
  'consultant_assignments',
  'consultant_triggers',
  'help_requests',
  'user_feedback',
  'consultant_actions_log',
  'schema_versions'
];

// Expected RLS policies
const EXPECTED_RLS_POLICIES = {
  'profiles': [
    'Public profiles are viewable by everyone',
    'Users can update their own profile',
    'Consultants can view all profiles'
  ],
  'books': [
    'Books are viewable by authenticated users'
  ],
  'reading_progress': [
    'Users can view their own reading progress',
    'Users can update their own reading progress',
    'Users can insert their own reading progress',
    'Consultants can view assigned users\' reading progress'
  ],
  'reading_stats': [
    'Users can view their own reading stats',
    'Users can update their own reading stats',
    'Users can insert their own reading stats',
    'Consultants can view all reading stats'
  ],
  'user_feedback': [
    'Users can view their own feedback',
    'Users can insert their own feedback',
    'Consultants can view all feedback'
  ],
  'help_requests': [
    'Users can view their own help requests',
    'Users can insert their own help requests',
    'Users can update their own help requests',
    'Consultants can view all help requests',
    'Consultants can update help requests'
  ]
};

// Expected Edge Functions
const EXPECTED_EDGE_FUNCTIONS = [
  'get-ai-response',
  'process-help-request',
  'generate-reading-insights'
];

// Expected Storage Buckets
const EXPECTED_STORAGE_BUCKETS = [
  'book-covers',
  'user-uploads'
];

// Track verification results
let hasErrors = false;
let hasWarnings = false;

// Initialize Supabase client
let supabase: SupabaseClient<Database>;
let supabaseAdmin: SupabaseClient<Database>;

/**
 * Main verification function
 */
async function verifySupabaseBackend() {
  console.log(`${colors.bold}${colors.blue}🔍 Starting Supabase Backend Verification${colors.reset}\n`);
  
  // Step 1: Verify connection
  if (!await verifyConnection()) {
    console.error(`${colors.red}${colors.bold}❌ Cannot connect to Supabase. Aborting verification.${colors.reset}`);
    process.exit(1);
  }
  
  // Step 2: Verify database schema
  await verifyDatabaseSchema();
  
  // Step 3: Verify RLS policies
  await verifyRLSPolicies();
  
  // Step 4: Verify Edge Functions
  await verifyEdgeFunctions();
  
  // Step 5: Verify Storage Buckets
  await verifyStorageBuckets();
  
  // Step 6: Verify test data
  await verifyTestData();
  
  // Print summary
  console.log(`\n${colors.bold}${colors.blue}🏁 Supabase Backend Verification Complete${colors.reset}`);
  
  if (hasErrors) {
    console.error(`${colors.red}${colors.bold}❌ Verification failed with errors. Please fix the issues before deployment.${colors.reset}`);
    process.exit(1);
  } else if (hasWarnings) {
    console.warn(`${colors.yellow}${colors.bold}⚠️ Verification completed with warnings. Review the warnings before deployment.${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`${colors.green}${colors.bold}✅ Verification successful! The Supabase backend is properly configured.${colors.reset}`);
    process.exit(0);
  }
}

/**
 * Verify connection to Supabase
 */
async function verifyConnection(): Promise<boolean> {
  console.log(`${colors.cyan}📡 Verifying Supabase connection...${colors.reset}`);
  
  try {
    // Check if environment variables are set
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error(`${colors.red}❌ Missing Supabase credentials in environment variables.${colors.reset}`);
      console.error(`${colors.red}   Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.${colors.reset}`);
      hasErrors = true;
      return false;
    }
    
    // Initialize client
    supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY);
    
    // Test connection with a simple query
    const { data, error } = await supabase.from('books').select('id').limit(1);
    
    if (error) {
      console.error(`${colors.red}❌ Failed to connect to Supabase: ${error.message}${colors.reset}`);
      hasErrors = true;
      return false;
    }
    
    console.log(`${colors.green}✅ Successfully connected to Supabase${colors.reset}`);
    
    // Initialize admin client if service role key is available
    if (SERVICE_ROLE_KEY) {
      supabaseAdmin = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY);
      console.log(`${colors.green}✅ Service role client initialized${colors.reset}`);
    } else {
      console.warn(`${colors.yellow}⚠️ Service role key not provided. Some verification steps will be limited.${colors.reset}`);
      hasWarnings = true;
    }
    
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ Error connecting to Supabase: ${error instanceof Error ? error.message : String(error)}${colors.reset}`);
    hasErrors = true;
    return false;
  }
}

/**
 * Verify database schema
 */
async function verifyDatabaseSchema() {
  console.log(`\n${colors.cyan}📋 Verifying database schema...${colors.reset}`);
  
  try {
    // Get list of tables
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.error(`${colors.red}❌ Failed to fetch tables: ${tablesError.message}${colors.reset}`);
      hasErrors = true;
      return;
    }
    
    const tableNames = tables.map(t => t.table_name);
    
    // Check for missing tables
    const missingTables = EXPECTED_TABLES.filter(table => !tableNames.includes(table));
    
    if (missingTables.length > 0) {
      console.error(`${colors.red}❌ Missing tables: ${missingTables.join(', ')}${colors.reset}`);
      hasErrors = true;
    } else {
      console.log(`${colors.green}✅ All expected tables exist${colors.reset}`);
    }
    
    // Check key tables for required columns
    await verifyTableColumns('books', ['id', 'title', 'author', 'description', 'cover_image_url', 'total_pages', 'string_id']);
    await verifyTableColumns('reading_progress', ['id', 'user_id', 'book_id', 'section_id', 'last_position', 'last_read_at']);
    await verifyTableColumns('reading_stats', ['id', 'user_id', 'book_id', 'total_reading_time', 'pages_read', 'percentage_complete']);
    await verifyTableColumns('profiles', ['id', 'first_name', 'last_name', 'email', 'is_consultant']);
    await verifyTableColumns('user_feedback', ['id', 'user_id', 'book_id', 'section_id', 'feedback_type', 'content']);
    
    // Check for indexes on frequently queried tables
    await verifyTableIndexes('reading_progress', ['user_id', 'book_id']);
    await verifyTableIndexes('reading_stats', ['user_id', 'book_id']);
    await verifyTableIndexes('ai_interactions', ['user_id', 'book_id']);
    await verifyTableIndexes('user_feedback', ['user_id', 'book_id']);
    
  } catch (error) {
    console.error(`${colors.red}❌ Error verifying database schema: ${error instanceof Error ? error.message : String(error)}${colors.reset}`);
    hasErrors = true;
  }
}

/**
 * Verify columns in a table
 */
async function verifyTableColumns(tableName: string, expectedColumns: string[]) {
  try {
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', tableName);
    
    if (error) {
      console.error(`${colors.red}❌ Failed to fetch columns for ${tableName}: ${error.message}${colors.reset}`);
      hasErrors = true;
      return;
    }
    
    const columnNames = columns.map(c => c.column_name);
    const missingColumns = expectedColumns.filter(col => !columnNames.includes(col));
    
    if (missingColumns.length > 0) {
      console.error(`${colors.red}❌ Table ${tableName} is missing columns: ${missingColumns.join(', ')}${colors.reset}`);
      hasErrors = true;
    } else {
      console.log(`${colors.green}✅ Table ${tableName} has all required columns${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}❌ Error verifying columns for ${tableName}: ${error instanceof Error ? error.message : String(error)}${colors.reset}`);
    hasErrors = true;
  }
}

/**
 * Verify indexes on a table
 */
async function verifyTableIndexes(tableName: string, expectedIndexedColumns: string[]) {
  try {
    const { data: indexes, error } = await supabase
      .from('pg_indexes')
      .select('indexname, indexdef')
      .eq('schemaname', 'public')
      .eq('tablename', tableName);
    
    if (error) {
      console.error(`${colors.red}❌ Failed to fetch indexes for ${tableName}: ${error.message}${colors.reset}`);
      hasErrors = true;
      return;
    }
    
    const indexDefs = indexes.map(i => i.indexdef);
    const missingIndexes = [];
    
    for (const column of expectedIndexedColumns) {
      const hasIndex = indexDefs.some(def => 
        def.includes(`(${column})`) || 
        def.includes(`("${column}")`) || 
        def.includes(`(${tableName}.${column})`) ||
        def.includes(`("${tableName}"."${column}")`)
      );
      
      if (!hasIndex) {
        missingIndexes.push(column);
      }
    }
    
    if (missingIndexes.length > 0) {
      console.warn(`${colors.yellow}⚠️ Table ${tableName} is missing indexes on columns: ${missingIndexes.join(', ')}${colors.reset}`);
      hasWarnings = true;
    } else {
      console.log(`${colors.green}✅ Table ${tableName} has all recommended indexes${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}❌ Error verifying indexes for ${tableName}: ${error instanceof Error ? error.message : String(error)}${colors.reset}`);
    hasErrors = true;
  }
}

/**
 * Verify RLS policies
 */
async function verifyRLSPolicies() {
  console.log(`\n${colors.cyan}🔒 Verifying Row Level Security policies...${colors.reset}`);
  
  try {
    // We need service role key for this
    if (!SERVICE_ROLE_KEY) {
      console.warn(`${colors.yellow}⚠️ Cannot verify RLS policies without service role key${colors.reset}`);
      hasWarnings = true;
      return;
    }
    
    // Get all policies
    const { data: policies, error } = await supabaseAdmin
      .from('pg_policies')
      .select('tablename, policyname')
      .eq('schemaname', 'public');
    
    if (error) {
      console.error(`${colors.red}❌ Failed to fetch RLS policies: ${error.message}${colors.reset}`);
      hasErrors = true;
      return;
    }
    
    // Group policies by table
    const policyMap: Record<string, string[]> = {};
    policies.forEach(policy => {
      if (!policyMap[policy.tablename]) {
        policyMap[policy.tablename] = [];
      }
      policyMap[policy.tablename].push(policy.policyname);
    });
    
    // Check for missing policies
    for (const [table, expectedPolicies] of Object.entries(EXPECTED_RLS_POLICIES)) {
      const tablePolicies = policyMap[table] || [];
      const missingPolicies = expectedPolicies.filter(policy => 
        !tablePolicies.some(p => p.toLowerCase() === policy.toLowerCase())
      );
      
      if (missingPolicies.length > 0) {
        console.error(`${colors.red}❌ Table ${table} is missing policies: ${missingPolicies.join(', ')}${colors.reset}`);
        hasErrors = true;
      } else {
        console.log(`${colors.green}✅ Table ${table} has all required RLS policies${colors.reset}`);
      }
    }
    
    // Check if RLS is enabled on important tables
    await verifyRLSEnabled('profiles');
    await verifyRLSEnabled('books');
    await verifyRLSEnabled('reading_progress');
    await verifyRLSEnabled('reading_stats');
    await verifyRLSEnabled('ai_interactions');
    await verifyRLSEnabled('user_feedback');
    await verifyRLSEnabled('help_requests');
    
  } catch (error) {
    console.error(`${colors.red}❌ Error verifying RLS policies: ${error instanceof Error ? error.message : String(error)}${colors.reset}`);
    hasErrors = true;
  }
}

/**
 * Verify RLS is enabled on a table
 */
async function verifyRLSEnabled(tableName: string) {
  try {
    if (!SERVICE_ROLE_KEY) return;
    
    const { data, error } = await supabaseAdmin.rpc('has_rls_enabled', { table_name: tableName });
    
    if (error) {
      console.error(`${colors.red}❌ Failed to check RLS status for ${tableName}: ${error.message}${colors.reset}`);
      hasErrors = true;
      return;
    }
    
    if (!data) {
      console.error(`${colors.red}❌ RLS is not enabled on table ${tableName}${colors.reset}`);
      hasErrors = true;
    } else {
      console.log(`${colors.green}✅ RLS is enabled on table ${tableName}${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}❌ Error checking RLS status for ${tableName}: ${error instanceof Error ? error.message : String(error)}${colors.reset}`);
    hasErrors = true;
  }
}

/**
 * Verify Edge Functions
 */
async function verifyEdgeFunctions() {
  console.log(`\n${colors.cyan}⚡ Verifying Edge Functions...${colors.reset}`);
  
  try {
    // We need service role key for this
    if (!SERVICE_ROLE_KEY) {
      console.warn(`${colors.yellow}⚠️ Cannot verify Edge Functions without service role key${colors.reset}`);
      hasWarnings = true;
      return;
    }
    
    // Get all functions
    const { data: functions, error } = await supabaseAdmin.functions.list();
    
    if (error) {
      console.error(`${colors.red}❌ Failed to fetch Edge Functions: ${error.message}${colors.reset}`);
      hasErrors = true;
      return;
    }
    
    const functionNames = functions.map(f => f.name);
    
    // Check for missing functions
    const missingFunctions = EXPECTED_EDGE_FUNCTIONS.filter(func => !functionNames.includes(func));
    
    if (missingFunctions.length > 0) {
      console.error(`${colors.red}❌ Missing Edge Functions: ${missingFunctions.join(', ')}${colors.reset}`);
      hasErrors = true;
    } else {
      console.log(`${colors.green}✅ All expected Edge Functions exist${colors.reset}`);
    }
    
  } catch (error) {
    console.error(`${colors.red}❌ Error verifying Edge Functions: ${error instanceof Error ? error.message : String(error)}${colors.reset}`);
    hasErrors = true;
  }
}

/**
 * Verify Storage Buckets
 */
async function verifyStorageBuckets() {
  console.log(`\n${colors.cyan}📦 Verifying Storage Buckets...${colors.reset}`);
  
  try {
    // Get all buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error(`${colors.red}❌ Failed to fetch Storage Buckets: ${error.message}${colors.reset}`);
      hasErrors = true;
      return;
    }
    
    const bucketNames = buckets.map(b => b.name);
    
    // Check for missing buckets
    const missingBuckets = EXPECTED_STORAGE_BUCKETS.filter(bucket => !bucketNames.includes(bucket));
    
    if (missingBuckets.length > 0) {
      console.error(`${colors.red}❌ Missing Storage Buckets: ${missingBuckets.join(', ')}${colors.reset}`);
      hasErrors = true;
    } else {
      console.log(`${colors.green}✅ All expected Storage Buckets exist${colors.reset}`);
    }
    
  } catch (error) {
    console.error(`${colors.red}❌ Error verifying Storage Buckets: ${error instanceof Error ? error.message : String(error)}${colors.reset}`);
    hasErrors = true;
  }
}

/**
 * Verify test data
 */
async function verifyTestData() {
  console.log(`\n${colors.cyan}🧪 Verifying test data...${colors.reset}`);
  
  try {
    // Check for Alice in Wonderland book
    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('id, title, string_id')
      .eq('string_id', 'alice-in-wonderland');
    
    if (booksError) {
      console.error(`${colors.red}❌ Failed to fetch books: ${booksError.message}${colors.reset}`);
      hasErrors = true;
      return;
    }
    
    if (!books || books.length === 0) {
      console.error(`${colors.red}❌ Test book 'Alice in Wonderland' not found${colors.reset}`);
      hasErrors = true;
    } else {
      console.log(`${colors.green}✅ Test book 'Alice in Wonderland' exists${colors.reset}`);
      
      // Check for chapters
      const bookId = books[0].id;
      const { data: chapters, error: chaptersError } = await supabase
        .from('chapters')
        .select('id')
        .eq('book_id', bookId);
      
      if (chaptersError) {
        console.error(`${colors.red}❌ Failed to fetch chapters: ${chaptersError.message}${colors.reset}`);
        hasErrors = true;
      } else if (!chapters || chapters.length === 0) {
        console.error(`${colors.red}❌ No chapters found for test book${colors.reset}`);
        hasErrors = true;
      } else {
        console.log(`${colors.green}✅ Test book has ${chapters.length} chapters${colors.reset}`);
      }
    }
    
    // Check for verification codes
    const { data: codes, error: codesError } = await supabase
      .from('verification_codes')
      .select('code')
      .eq('is_used', false)
      .limit(1);
    
    if (codesError) {
      console.error(`${colors.red}❌ Failed to fetch verification codes: ${codesError.message}${colors.reset}`);
      hasErrors = true;
    } else if (!codes || codes.length === 0) {
      console.warn(`${colors.yellow}⚠️ No unused verification codes found${colors.reset}`);
      hasWarnings = true;
    } else {
      console.log(`${colors.green}✅ Unused verification codes exist${colors.reset}`);
    }
    
    // Check for dictionary entries
    const { data: dictionary, error: dictionaryError } = await supabase
      .from('dictionary')
      .select('id')
      .limit(1);
    
    if (dictionaryError) {
      console.error(`${colors.red}❌ Failed to fetch dictionary entries: ${dictionaryError.message}${colors.reset}`);
      hasErrors = true;
    } else if (!dictionary || dictionary.length === 0) {
      console.warn(`${colors.yellow}⚠️ No dictionary entries found${colors.reset}`);
      hasWarnings = true;
    } else {
      console.log(`${colors.green}✅ Dictionary entries exist${colors.reset}`);
    }
    
  } catch (error) {
    console.error(`${colors.red}❌ Error verifying test data: ${error instanceof Error ? error.message : String(error)}${colors.reset}`);
    hasErrors = true;
  }
}

// Add a helper function to check if RLS is enabled
async function addRLSHelperFunction() {
  if (!SERVICE_ROLE_KEY) return;
  
  try {
    const { error } = await supabaseAdmin.rpc('create_rls_helper_function');
    
    if (error) {
      // Function might already exist, which is fine
      if (!error.message.includes('already exists')) {
        console.error(`${colors.red}❌ Failed to create RLS helper function: ${error.message}${colors.reset}`);
      }
    }
  } catch (error) {
    // Create the function manually
    const { error: createError } = await supabaseAdmin.rpc('create_rls_helper_function_manual');
    
    if (createError && !createError.message.includes('already exists')) {
      console.error(`${colors.red}❌ Failed to create RLS helper function: ${createError.message}${colors.reset}`);
    }
  }
}

// Run the verification
(async () => {
  try {
    // Add RLS helper function if needed
    await addRLSHelperFunction();
    
    // Run verification
    await verifySupabaseBackend();
  } catch (error) {
    console.error(`${colors.red}${colors.bold}❌ Unhandled error during verification: ${error instanceof Error ? error.message : String(error)}${colors.reset}`);
    process.exit(1);
  }
})();
