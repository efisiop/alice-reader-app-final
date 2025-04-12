// scripts/test_dictionary.js
// This script tests the dictionary service by looking up a few terms

const { createClient } = require('@supabase/supabase-js');
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

async function testDictionary() {
  try {
    console.log('Testing dictionary service...');
    
    // Get the book ID for Alice in Wonderland
    const { data: bookData, error: bookError } = await supabase
      .from('books')
      .select('id')
      .eq('title', 'Alice in Wonderland')
      .single();
    
    if (bookError) {
      console.error('Error fetching book:', bookError);
      return;
    }
    
    const bookId = bookData.id;
    console.log('Book ID:', bookId);
    
    // Get chapter and section IDs
    const { data: chapterData, error: chapterError } = await supabase
      .from('chapters')
      .select('id, number')
      .eq('book_id', bookId)
      .order('number');
    
    if (chapterError) {
      console.error('Error fetching chapters:', chapterError);
      return;
    }
    
    const chapter1Id = chapterData.find(c => c.number === 1)?.id;
    const chapter2Id = chapterData.find(c => c.number === 2)?.id;
    
    const { data: sectionData, error: sectionError } = await supabase
      .from('sections')
      .select('id, chapter_id, number')
      .eq('chapter_id', chapter1Id)
      .order('number');
    
    if (sectionError) {
      console.error('Error fetching sections:', sectionError);
      return;
    }
    
    const section1Id = sectionData.find(s => s.number === 1)?.id;
    
    // Test terms with different contexts
    const termsToTest = [
      { term: 'Alice', context: 'Book-level term' },
      { term: 'rabbit-hole', context: 'Chapter-specific term (Chapter 1)', chapterId: chapter1Id },
      { term: 'waistcoat-pocket', context: 'Section-specific term (Chapter 1, Section 1)', chapterId: chapter1Id, sectionId: section1Id },
      { term: 'telescope', context: 'Chapter-specific term (Chapter 2)', chapterId: chapter2Id },
      { term: 'Curiouser', context: 'Made-up word' },
      { term: 'ORANGE MARMALADE', context: 'Term with special formatting' }
    ];
    
    // Test each term
    for (const { term, context, chapterId, sectionId } of termsToTest) {
      console.log(`\nTesting: "${term}" (${context})`);
      
      const { data, error } = await supabase
        .rpc('get_definition_with_context', {
          book_id_param: bookId,
          term_param: term,
          section_id_param: sectionId || null,
          chapter_id_param: chapterId || null
        });
      
      if (error) {
        console.error(`Error looking up "${term}":`, error);
        continue;
      }
      
      if (data && data.length > 0) {
        // Sort by priority (1 is highest)
        const sortedDefinitions = data.sort((a, b) => a.priority - b.priority);
        console.log(`Definition found for "${term}" (priority ${sortedDefinitions[0].priority}):`);
        console.log(sortedDefinitions[0].definition);
        
        if (sortedDefinitions.length > 1) {
          console.log(`\nAlternative definitions found (${sortedDefinitions.length - 1}):`);
          for (let i = 1; i < sortedDefinitions.length; i++) {
            console.log(`Priority ${sortedDefinitions[i].priority}: ${sortedDefinitions[i].definition}`);
          }
        }
      } else {
        console.log(`No definition found for "${term}"`);
      }
    }
    
    console.log('\nDictionary testing complete!');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the function
testDictionary();
