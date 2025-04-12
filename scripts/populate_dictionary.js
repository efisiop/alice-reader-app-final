// scripts/populate_dictionary.js
// This script populates the dictionary table with sample data for Alice in Wonderland

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL or key not found in environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_KEY are set in your .env file');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function populateDictionary() {
  try {
    console.log('Starting dictionary population...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'populate_dictionary.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('run_sql', { sql_query: sqlContent });
    
    if (error) {
      console.error('Error executing SQL:', error);
      return;
    }
    
    console.log('Dictionary populated successfully!');
    console.log('Result:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the function
populateDictionary();
