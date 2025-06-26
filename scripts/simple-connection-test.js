#!/usr/bin/env node

/**
 * Simple Supabase Connection Test
 * 
 * This script provides a basic test to check if Supabase connection is working.
 * It's simpler than the full glossary test and helps isolate connection issues.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Simple Supabase Connection Test');
console.log('===================================\n');

// Check environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('📋 Environment Check:');
console.log(`   VITE_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
console.log(`   VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Set' : '❌ Missing'}`);

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('\n❌ ERROR: Missing Supabase credentials in environment variables.');
  console.log('   Please check your .env file and ensure these variables are set:');
  console.log('   - VITE_SUPABASE_URL');
  console.log('   - VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('\n🔗 Testing Supabase Connection...');

try {
  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  console.log('   ✅ Supabase client created successfully');
  
  // Test basic connection with a simple query
  console.log('   🔍 Testing database connection...');
  
  const { data, error } = await supabase
    .from('books')
    .select('id, title')
    .limit(1);
  
  if (error) {
    console.log(`   ❌ Database connection failed: ${error.message}`);
    console.log(`   Error code: ${error.code}`);
    console.log(`   Error details: ${error.details}`);
    
    if (error.code === 'PGRST301') {
      console.log('\n💡 This might be a CORS issue. Check your Supabase project settings.');
    } else if (error.code === 'PGRST116') {
      console.log('\n💡 No data found, but connection is working.');
    }
    
    process.exit(1);
  }
  
  console.log('   ✅ Database connection successful!');
  console.log(`   📊 Found ${data?.length || 0} books`);
  
  if (data && data.length > 0) {
    console.log(`   📖 Sample book: ${data[0].title} (ID: ${data[0].id})`);
  }
  
  // Test glossary table specifically
  console.log('\n📚 Testing glossary table...');
  
  const { data: glossaryData, error: glossaryError } = await supabase
    .from('alice_glossary')
    .select('term')
    .limit(5);
  
  if (glossaryError) {
    console.log(`   ❌ Glossary table access failed: ${glossaryError.message}`);
    console.log(`   Error code: ${glossaryError.code}`);
  } else {
    console.log(`   ✅ Glossary table accessible!`);
    console.log(`   📊 Found ${glossaryData?.length || 0} glossary terms`);
    
    if (glossaryData && glossaryData.length > 0) {
      console.log('   📝 Sample terms:');
      glossaryData.slice(0, 3).forEach((item, index) => {
        console.log(`      ${index + 1}. ${item.term}`);
      });
    }
  }
  
  console.log('\n🎉 SUCCESS: Supabase connection is working properly!');
  console.log('   Your app should be able to connect to Supabase and load glossary terms.');
  
} catch (error) {
  console.log('\n❌ CONNECTION FAILED');
  console.log(`   Error: ${error.message}`);
  
  if (error.message.includes('fetch failed')) {
    console.log('\n💡 This looks like a network connectivity issue.');
    console.log('   Possible causes:');
    console.log('   - Internet connection is down');
    console.log('   - Firewall or proxy blocking the connection');
    console.log('   - Supabase service is temporarily unavailable');
    console.log('   - DNS resolution issues');
  } else if (error.message.includes('Invalid URL')) {
    console.log('\n💡 The Supabase URL appears to be invalid.');
    console.log('   Please check your VITE_SUPABASE_URL in the .env file.');
  } else if (error.message.includes('Invalid API key')) {
    console.log('\n💡 The Supabase API key appears to be invalid.');
    console.log('   Please check your VITE_SUPABASE_ANON_KEY in the .env file.');
  }
  
  console.log('\n🔧 Troubleshooting steps:');
  console.log('   1. Check your internet connection');
  console.log('   2. Verify your .env file has correct Supabase credentials');
  console.log('   3. Try accessing your Supabase dashboard in a browser');
  console.log('   4. Check if Supabase is experiencing any outages');
  
  process.exit(1);
} 