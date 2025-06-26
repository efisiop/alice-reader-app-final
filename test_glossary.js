import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

console.log('🔍 Testing Alice Glossary Import...');

try {
  // Check total count
  const { count, error: countError } = await supabase
    .from('alice_glossary')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Error getting count:', countError);
  } else {
    console.log(`✅ Total glossary entries: ${count}`);
  }

  // Test a few specific terms
  const testTerms = ['A Caucus-Race', 'White Rabbit', 'Cheshire Cat', 'Mad Hatter'];
  
  for (const term of testTerms) {
    const { data, error } = await supabase
      .from('alice_glossary')
      .select('term, definition')
      .eq('term', term)
      .single();

    if (error) {
      console.log(`❌ "${term}": Not found`);
    } else {
      console.log(`✅ "${term}": ${data.definition.substring(0, 80)}...`);
    }
  }

  // Test the priority function
  console.log('\n🔧 Testing glossary priority function...');
  const { data: priorityTest, error: priorityError } = await supabase
    .rpc('get_glossary_definition', {
      book_id_param: '550e8400-e29b-41d4-a716-446655440000',
      term_param: 'A Caucus-Race'
    });

  if (priorityError) {
    console.error('❌ Priority function error:', priorityError);
  } else if (priorityTest && priorityTest.length > 0) {
    console.log(`✅ Priority function works! Source: ${priorityTest[0].source_type}, Priority: ${priorityTest[0].priority}`);
  }

} catch (err) {
  console.error('❌ Test failed:', err.message);
} 