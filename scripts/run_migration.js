// Script to run the alice_glossary migration
// Usage: node scripts/run_migration.js

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

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials in environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Running alice_glossary migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20241223_add_alice_glossary.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    console.log('📖 Read migration file successfully');

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📊 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim().length === 0) continue;

      console.log(`📝 Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // If exec_sql doesn't exist, try direct query
          const { error: directError } = await supabase.from('').select('').sql(statement);
          
          if (directError) {
            console.error(`❌ Error executing statement ${i + 1}:`, directError);
            throw directError;
          }
        }
        
        console.log(`✅ Statement ${i + 1} executed successfully`);
      } catch (stmtError) {
        console.error(`❌ Error executing statement ${i + 1}:`, stmtError);
        console.error('Statement:', statement.substring(0, 200) + '...');
        throw stmtError;
      }
    }

    console.log('\n🎉 Migration completed successfully!');
    
    // Verify the table was created
    console.log('🔍 Verifying alice_glossary table was created...');
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'alice_glossary');

    if (tableError) {
      console.warn('⚠️  Could not verify table creation:', tableError);
    } else if (tables && tables.length > 0) {
      console.log('✅ alice_glossary table created successfully');
    } else {
      console.warn('⚠️  alice_glossary table may not have been created');
    }

  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  runMigration().catch(console.error);
}

module.exports = { runMigration }; 