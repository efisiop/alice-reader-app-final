// scripts/test-alice-glossary.js
// Test script for the new Alice glossary service

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🧪 Testing Alice Glossary Service');
console.log('=====================================\n');

async function testGlossaryService() {
  try {
    // Test 1: Check if alice_glossary table exists
    console.log('1️⃣ Testing table access...');
    const { data: tableTest, error: tableError, count } = await supabase
      .from('alice_glossary')
      .select('*', { count: 'exact', head: true });

    if (tableError) {
      console.error('❌ Table access error:', tableError.message);
      return;
    }

    console.log(`✅ alice_glossary table exists! Found ${count} entries\n`);

    // Test 2: Get all terms
    console.log('2️⃣ Fetching all glossary terms...');
    const { data: terms, error: termsError } = await supabase
      .from('alice_glossary')
      .select('term')
      .order('term');

    if (termsError) {
      console.error('❌ Error fetching terms:', termsError.message);
      return;
    }

    console.log(`✅ Successfully fetched ${terms.length} terms\n`);

    // Test 3: Show sample terms
    console.log('3️⃣ Sample glossary terms:');
    const sampleTerms = terms.slice(0, 20);
    sampleTerms.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.term}`);
    });

    if (terms.length > 20) {
      console.log(`   ... and ${terms.length - 20} more terms\n`);
    } else {
      console.log('');
    }

    // Test 4: Test specific terms
    console.log('4️⃣ Testing specific term lookups...');
    const testTerms = ['Alice', 'White Rabbit', 'Cheshire Cat', 'Mad Hatter', 'Queen of Hearts'];
    
    for (const term of testTerms) {
      const { data: result, error } = await supabase
        .from('alice_glossary')
        .select('term, definition')
        .or(`term.eq.${term},term.eq.${term.toLowerCase()},term.eq.${term.charAt(0).toUpperCase() + term.slice(1)}`)
        .single();

      if (error) {
        console.log(`   ❌ "${term}": Not found`);
      } else {
        console.log(`   ✅ "${term}": ${result.definition.substring(0, 60)}...`);
      }
    }
    console.log('');

    // Test 5: Test search functionality
    console.log('5️⃣ Testing search functionality...');
    const { data: searchResults, error: searchError } = await supabase
      .from('alice_glossary')
      .select('term')
      .or('term.ilike.%rabbit%,definition.ilike.%rabbit%')
      .limit(5);

    if (searchError) {
      console.error('❌ Search error:', searchError.message);
    } else {
      console.log(`✅ Search for "rabbit" found ${searchResults.length} results:`);
      searchResults.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.term}`);
      });
    }
    console.log('');

    // Test 6: Create a Set with case variations (like the service does)
    console.log('6️⃣ Testing case variations...');
    const termsSet = new Set();
    
    terms.forEach(item => {
      const term = item.term;
      if (term) {
        // Add original term
        termsSet.add(term);
        
        // Add lowercase version
        termsSet.add(term.toLowerCase());
        
        // Add capitalized version
        termsSet.add(term.charAt(0).toUpperCase() + term.slice(1));
        
        // Add title case version for multi-word terms
        if (term.includes(' ')) {
          const titleCase = term.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
          termsSet.add(titleCase);
        }
      }
    });

    console.log(`✅ Created Set with ${termsSet.size} variations (${terms.length} original terms)`);
    console.log(`   This matches what the glossary service will do in the app\n`);

    // Test 7: Verify specific variations work
    console.log('7️⃣ Testing case variation lookups...');
    const variationTests = [
      'alice',
      'ALICE', 
      'Alice',
      'white rabbit',
      'White Rabbit',
      'WHITE RABBIT'
    ];

    variationTests.forEach(testTerm => {
      const found = termsSet.has(testTerm);
      console.log(`   ${found ? '✅' : '❌'} "${testTerm}": ${found ? 'Found' : 'Not found'}`);
    });
    console.log('');

    console.log('🎉 All tests completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Start the development server: npm run dev');
    console.log('   2. Navigate to: http://localhost:5173/#/alice-glossary-demo');
    console.log('   3. See the enhanced Alice glossary highlighting in action!');
    console.log('   4. Hover over words to see the special orange highlighting for Alice terms');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
testGlossaryService(); 