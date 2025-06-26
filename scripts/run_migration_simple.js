// Simplified migration script for alice_glossary
// Uses the anon key to attempt creating the necessary functions

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Initialize Supabase client with anon key first
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Missing Supabase credentials in environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTable() {
  console.log('🚀 Creating alice_glossary table...');
  
  // Create the table with a simple query
  const { error: tableError } = await supabase.rpc('exec', {
    sql: `
      CREATE TABLE IF NOT EXISTS alice_glossary (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        book_id UUID NOT NULL,
        term TEXT NOT NULL,
        definition TEXT NOT NULL,
        source_sentence TEXT,
        example TEXT,
        chapter_reference TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_alice_glossary_book_term ON alice_glossary(book_id, term);
      CREATE INDEX IF NOT EXISTS idx_alice_glossary_term ON alice_glossary(term);
    `
  });

  if (tableError) {
    console.log('Table creation through RPC failed, trying direct approach...');
    
    // Try creating table using a different approach
    try {
      // First try to see if we can query existing tables
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'alice_glossary')
        .limit(1);
        
      if (error) {
        console.log('Cannot access information_schema, table may already exist');
      } else if (data && data.length === 0) {
        console.log('Table does not exist, manual creation required');
        console.log('\n📋 Please run this SQL manually in your Supabase SQL editor:');
        console.log('---');
        
        const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20241223_add_alice_glossary.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
        console.log(migrationSQL);
        console.log('---');
        return false;
      } else {
        console.log('✅ alice_glossary table already exists');
        return true;
      }
    } catch (err) {
      console.error('Error checking table existence:', err);
      return false;
    }
  } else {
    console.log('✅ Table created successfully');
    return true;
  }
}

async function runSimpleMigration() {
  try {
    console.log('🚀 Running simplified alice_glossary migration...');
    
    const success = await createTable();
    
    if (success) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('You can now run: node scripts/import_alice_glossary.js alice_glossary_sample.csv');
    } else {
      console.log('\n⚠️  Migration requires manual setup. Please copy the SQL from above and run it in your Supabase dashboard.');
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    
    // Show the manual SQL as fallback
    console.log('\n📋 Please run the migration SQL manually in your Supabase SQL editor.');
    console.log('Go to your Supabase dashboard → SQL Editor and run the migration file.');
    
    process.exit(1);
  }
}

// Run the migration
runSimpleMigration().catch(console.error); 