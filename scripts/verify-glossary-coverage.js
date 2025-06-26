#!/usr/bin/env node

/**
 * Glossary Coverage Verification Script
 * 
 * This script verifies that all glossary terms from Supabase are being properly
 * detected and highlighted in the text content.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

class GlossaryCoverageVerifier {
  constructor() {
    this.glossaryTerms = new Set();
    this.bookContent = [];
    this.missingTerms = [];
    this.foundTerms = [];
  }

  /**
   * Load all glossary terms from Supabase
   */
  async loadGlossaryTerms() {
    console.log('📖 Loading all glossary terms from Supabase...');
    
    try {
      const { data, error } = await supabase
        .from('alice_glossary')
        .select('term, definition')
        .order('term');

      if (error) {
        throw new Error(`Failed to fetch glossary terms: ${error.message}`);
      }

      if (data && data.length > 0) {
        data.forEach(item => {
          const term = item.term;
          if (term) {
            // Add the original term
            this.glossaryTerms.add(term);
            
            // Add lowercase version
            this.glossaryTerms.add(term.toLowerCase());
            
            // Add capitalized version
            this.glossaryTerms.add(term.charAt(0).toUpperCase() + term.slice(1));
            
            // Add title case version for multi-word terms
            if (term.includes(' ')) {
              const titleCase = term.split(' ').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ');
              this.glossaryTerms.add(titleCase);
            }
          }
        });
      }

      console.log(`✅ Loaded ${data.length} original glossary terms`);
      console.log(`✅ Created ${this.glossaryTerms.size} variations (including case forms)\n`);
      
      // Show some sample terms
      console.log('📋 Sample glossary terms:');
      const sampleTerms = Array.from(this.glossaryTerms).slice(0, 20);
      sampleTerms.forEach((term, index) => {
        console.log(`   ${index + 1}. "${term}"`);
      });
      if (this.glossaryTerms.size > 20) {
        console.log(`   ... and ${this.glossaryTerms.size - 20} more terms\n`);
      }
      
    } catch (error) {
      console.error('❌ Error loading glossary terms:', error.message);
      throw error;
    }
  }

  /**
   * Load book content from Supabase
   */
  async loadBookContent() {
    console.log('📚 Loading book content from Supabase...');
    
    try {
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

      this.bookContent = chapters || [];
      console.log(`✅ Loaded ${this.bookContent.length} chapters with content\n`);
      
    } catch (error) {
      console.error('❌ Error loading book content:', error.message);
      throw error;
    }
  }

  /**
   * Check if a word is in the glossary (same logic as the component)
   */
  isGlossaryTerm(word) {
    if (this.glossaryTerms.size === 0) return false;
    
    // Clean the word for comparison
    const cleanWord = word.replace(/[.,!?;:'"]/g, '').trim();
    const lowerWord = cleanWord.toLowerCase();
    const capitalizedWord = cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1);
    const titleCaseWord = cleanWord.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');

    // Check various forms of the word
    return this.glossaryTerms.has(cleanWord) || 
           this.glossaryTerms.has(lowerWord) || 
           this.glossaryTerms.has(capitalizedWord) || 
           this.glossaryTerms.has(titleCaseWord);
  }

  /**
   * Scan content for glossary terms
   */
  scanContentForTerms() {
    console.log('🔍 Scanning content for glossary terms...\n');
    
    const allFoundTerms = new Set();
    const allMissingTerms = new Set();
    const termOccurrences = {};

    this.bookContent.forEach(chapter => {
      console.log(`📖 Chapter ${chapter.number}: ${chapter.title}`);
      
      if (chapter.sections) {
        chapter.sections.forEach(section => {
          const words = section.content.split(/\s+/);
          const foundInSection = new Set();
          const missingInSection = new Set();

          words.forEach(word => {
            const cleanWord = word.replace(/[.,!?;:'"]/g, '').trim();
            
            if (this.isGlossaryTerm(cleanWord)) {
              foundInSection.add(cleanWord);
              allFoundTerms.add(cleanWord);
              
              // Count occurrences
              if (!termOccurrences[cleanWord]) {
                termOccurrences[cleanWord] = 0;
              }
              termOccurrences[cleanWord]++;
            } else {
              // Check if this word might be a glossary term that's not being detected
              const lowerWord = cleanWord.toLowerCase();
              const capitalizedWord = cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1);
              
              // Check if any glossary term contains this word
              for (const glossaryTerm of this.glossaryTerms) {
                if (glossaryTerm.toLowerCase().includes(lowerWord) && 
                    lowerWord.length > 2) { // Only consider words longer than 2 characters
                  missingInSection.add(cleanWord);
                  allMissingTerms.add(cleanWord);
                  break;
                }
              }
            }
          });

          if (foundInSection.size > 0) {
            console.log(`   ✅ Section ${section.number}: ${section.title}`);
            console.log(`      Found terms: ${Array.from(foundInSection).join(', ')}`);
          }
          
          if (missingInSection.size > 0) {
            console.log(`   ⚠️  Section ${section.number}: ${section.title}`);
            console.log(`      Potentially missing: ${Array.from(missingInSection).join(', ')}`);
          }
        });
      }
      console.log('');
    });

    this.foundTerms = Array.from(allFoundTerms);
    this.missingTerms = Array.from(allMissingTerms);

    return {
      foundTerms: this.foundTerms,
      missingTerms: this.missingTerms,
      termOccurrences
    };
  }

  /**
   * Generate comprehensive report
   */
  generateReport(scanResults) {
    console.log('📊 GLOSSARY COVERAGE REPORT');
    console.log('='.repeat(50));

    console.log('\n📈 SUMMARY:');
    console.log(`   • Total glossary terms in Supabase: ${this.glossaryTerms.size}`);
    console.log(`   • Terms found in content: ${scanResults.foundTerms.length}`);
    console.log(`   • Potentially missing terms: ${scanResults.missingTerms.length}`);

    console.log('\n✅ FOUND TERMS:');
    if (scanResults.foundTerms.length > 0) {
      scanResults.foundTerms.forEach((term, index) => {
        const count = scanResults.termOccurrences[term] || 0;
        console.log(`   ${index + 1}. "${term}" (${count} occurrences)`);
      });
    } else {
      console.log('   No terms found in content');
    }

    console.log('\n⚠️  POTENTIALLY MISSING TERMS:');
    if (scanResults.missingTerms.length > 0) {
      scanResults.missingTerms.forEach((term, index) => {
        console.log(`   ${index + 1}. "${term}"`);
      });
    } else {
      console.log('   No potentially missing terms detected');
    }

    console.log('\n💡 RECOMMENDATIONS:');
    
    if (scanResults.foundTerms.length === 0) {
      console.log('   ❌ No glossary terms found in content!');
      console.log('   • Check if content is properly loaded');
      console.log('   • Verify glossary terms are in the correct format');
    } else if (scanResults.foundTerms.length < 10) {
      console.log('   ⚠️  Very few terms found - consider adding more Alice-specific terms');
    } else {
      console.log('   ✅ Good coverage of glossary terms in content');
    }

    if (scanResults.missingTerms.length > 0) {
      console.log('   ⚠️  Some terms might not be detected properly');
      console.log('   • Check word matching logic');
      console.log('   • Verify case sensitivity handling');
    }

    console.log('\n🔧 NEXT STEPS:');
    console.log('   1. Review the found terms list above');
    console.log('   2. Check if missing terms should be added to glossary');
    console.log('   3. Test highlighting in the demo page');
    console.log('   4. Run consistency checker: ./scripts/run-glossary-check.sh');
  }

  /**
   * Run the complete verification
   */
  async run() {
    try {
      console.log('🚀 Starting Glossary Coverage Verification...\n');
      
      // Step 1: Load glossary terms
      await this.loadGlossaryTerms();
      
      // Step 2: Load book content
      await this.loadBookContent();
      
      // Step 3: Scan for terms
      const scanResults = this.scanContentForTerms();
      
      // Step 4: Generate report
      this.generateReport(scanResults);
      
      console.log('\n✅ Glossary coverage verification completed!');
      
    } catch (error) {
      console.error('\n❌ Error during verification:', error.message);
      process.exit(1);
    }
  }
}

// Run the verifier if this script is executed directly
const verifier = new GlossaryCoverageVerifier();
verifier.run(); 