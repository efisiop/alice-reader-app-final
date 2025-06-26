import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔗 Testing Supabase connection...');
console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test if alice_glossary table exists
try {
  console.log('📋 Testing alice_glossary table...');
  const { data, error, count } = await supabase
    .from('alice_glossary')
    .select('*', { count: 'exact', head: true });
    
  if (error) {
    console.error('❌ Table access error:', error.message);
  } else {
    console.log(`✅ alice_glossary table exists! Current count: ${count}`);
  }
} catch (err) {
  console.error('❌ Connection failed:', err.message);
} 