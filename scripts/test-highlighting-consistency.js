#!/usr/bin/env node

/**
 * Test Glossary Highlighting Consistency
 * 
 * This script provides a simple way to test that glossary terms
 * are being highlighted consistently across all chapters.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test glossary terms that should appear in Alice in Wonderland
const TEST_TERMS = [
  'Alice',
  'White Rabbit',
  'Wonderland',
  'rabbit-hole',
  'curious',
  'Cheshire Cat',
  'Mad Hatter',
  'Queen of Hearts',
  'Dormouse',
  'Caucus-Race',
  'Mouse',
  'telescope',
  'curiouser',
  'pool',
  'bank'
];

async function testGlossaryHighlighting() {
  console.log('🧪 Testing Glossary Highlighting Consistency...\n');

  try {
    // Step 1: Load glossary terms
    console.log('📖 Loading glossary terms...');
    const { data: glossaryData, error: glossaryError } = await supabase
      .from('alice_glossary')
      .select('term')
      .order('term');

    if (glossaryError) {
      throw new Error(`Failed to fetch glossary terms: ${glossaryError.message}`);
    }

    const glossaryTerms = new Set(glossaryData.map(item => item.term));
    console.log(`✅ Loaded ${glossaryTerms.size} glossary terms\n`);

    // Step 2: Test specific terms
    console.log('🔍 Testing specific glossary terms...');
    const testResults = [];

    TEST_TERMS.forEach(term => {
      const hasTerm = glossaryTerms.has(term);
      const hasLower = glossaryTerms.has(term.toLowerCase());
      const hasUpper = glossaryTerms.has(term.charAt(0).toUpperCase() + term.slice(1));
      
      const wouldHighlight = hasTerm || hasLower || hasUpper;
      
      testResults.push({
        term,
        wouldHighlight,
        exact: hasTerm,
        lowercase: hasLower,
        uppercase: hasUpper
      });

      const status = wouldHighlight ? '✅' : '❌';
      console.log(`   ${status} "${term}": ${wouldHighlight ? 'Will highlight' : 'Will NOT highlight'}`);
    });

    // Step 3: Load book content and check for terms
    console.log('\n📚 Checking for glossary terms in book content...');
    
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('id, title')
      .eq('title', 'Alice in Wonderland')
      .single();

    if (bookError || !book) {
      throw new Error('Alice in Wonderland book not found');
    }

    const { data: chapters, error: chaptersError } = await supabase
      .from('chapters')
      .select(`
        id,
        title,
        number,
        sections (
          id,
          title,
          content,
          number
        )
      `)
      .eq('book_id', book.id)
      .order('number');

    if (chaptersError) {
      throw new Error(`Failed to fetch chapters: ${chaptersError.message}`);
    }

    // Step 4: Analyze content for glossary terms
    const contentAnalysis = [];

    chapters.forEach(chapter => {
      const chapterAnalysis = {
        chapterNumber: chapter.number,
        chapterTitle: chapter.title,
        sections: [],
        totalGlossaryTerms: 0
      };

      if (chapter.sections) {
        chapter.sections.forEach(section => {
          const words = section.content.split(/\s+/);
          const foundTerms = [];

          words.forEach(word => {
            const cleanWord = word.replace(/[.,!?;:'"]/g, '').trim();
            if (glossaryTerms.has(cleanWord) || 
                glossaryTerms.has(cleanWord.toLowerCase()) ||
                glossaryTerms.has(cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1))) {
              foundTerms.push(cleanWord);
            }
          });

          const uniqueTerms = [...new Set(foundTerms)];
          chapterAnalysis.totalGlossaryTerms += uniqueTerms.length;

          chapterAnalysis.sections.push({
            sectionNumber: section.number,
            sectionTitle: section.title,
            foundTerms: uniqueTerms,
            termCount: uniqueTerms.length
          });
        });
      }

      contentAnalysis.push(chapterAnalysis);
    });

    // Step 5: Generate report
    console.log('\n📊 HIGHLIGHTING CONSISTENCY REPORT');
    console.log('='.repeat(50));

    console.log('\n🎨 Color Scheme:');
    console.log('   • Normal words: rgba(25, 118, 210, 0.1) (blue)');
    console.log('   • Glossary terms: rgba(255, 152, 0, 0.2) (orange)');

    console.log('\n📖 Chapter Analysis:');
    contentAnalysis.forEach(chapter => {
      console.log(`\n   Chapter ${chapter.chapterNumber}: ${chapter.chapterTitle}`);
      console.log(`   • Total glossary terms found: ${chapter.totalGlossaryTerms}`);
      
      if (chapter.sections.length > 0) {
        chapter.sections.forEach(section => {
          if (section.termCount > 0) {
            console.log(`     Section ${section.sectionNumber}: ${section.sectionTitle}`);
            console.log(`       Found terms: ${section.foundTerms.join(', ')}`);
          }
        });
      }
    });

    // Step 6: Summary and recommendations
    const totalTermsInContent = contentAnalysis.reduce((sum, chapter) => 
      sum + chapter.totalGlossaryTerms, 0
    );

    console.log('\n📈 Summary:');
    console.log(`   • Glossary terms loaded: ${glossaryTerms.size}`);
    console.log(`   • Test terms checked: ${TEST_TERMS.length}`);
    console.log(`   • Terms found in content: ${totalTermsInContent}`);
    console.log(`   • Chapters analyzed: ${chapters.length}`);

    console.log('\n💡 Recommendations:');
    if (totalTermsInContent === 0) {
      console.log('   ⚠️  No glossary terms found in content - check if content is properly loaded');
    } else if (totalTermsInContent < 10) {
      console.log('   ⚠️  Very few glossary terms found - consider adding more Alice-specific terms');
    } else {
      console.log('   ✅ Good coverage of glossary terms in content');
    }

    const missingTestTerms = TEST_TERMS.filter(term => {
      const hasTerm = glossaryTerms.has(term);
      const hasLower = glossaryTerms.has(term.toLowerCase());
      const hasUpper = glossaryTerms.has(term.charAt(0).toUpperCase() + term.slice(1));
      return !(hasTerm || hasLower || hasUpper);
    });

    if (missingTestTerms.length > 0) {
      console.log(`   ⚠️  Missing test terms: ${missingTestTerms.join(', ')}`);
    } else {
      console.log('   ✅ All test terms are available in glossary');
    }

    console.log('\n✅ Highlighting consistency test completed!');
    console.log('\n🎯 Next steps:');
    console.log('   1. Start the development server: npm run dev');
    console.log('   2. Navigate to the reader interface');
    console.log('   3. Hover over words to verify highlighting colors');
    console.log('   4. Check that glossary terms show orange, normal words show blue');

  } catch (error) {
    console.error('\n❌ Error during highlighting test:', error.message);
    process.exit(1);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testGlossaryHighlighting();
}

module.exports = { testGlossaryHighlighting }; 