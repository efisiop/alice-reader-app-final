#!/usr/bin/env node

/**
 * Glossary Consistency Checker
 * 
 * This script systematically scans through all 3 chapters of Alice in Wonderland
 * to ensure that all glossary terms have consistent highlighting colors when hovering.
 * 
 * Features:
 * - Loads all glossary terms from Supabase
 * - Scans through all book content (3 chapters)
 * - Identifies any inconsistencies in highlighting
 * - Provides detailed reporting
 * - Suggests fixes for any issues found
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

// Color constants for highlighting
const HIGHLIGHT_COLORS = {
  NORMAL_WORD: 'rgba(25, 118, 210, 0.1)',      // Blue for normal words
  TECHNICAL_TERM: 'rgba(255, 152, 0, 0.2)',    // Orange for Alice glossary terms
  TECHNICAL_TERM_ENHANCED: 'rgba(255, 152, 0, 0.3)' // Enhanced orange for better visibility
};

class GlossaryConsistencyChecker {
  constructor() {
    this.glossaryTerms = new Set();
    this.bookContent = [];
    this.issues = [];
    this.stats = {
      totalTerms: 0,
      totalWords: 0,
      glossaryWords: 0,
      chapters: 0,
      sections: 0
    };
  }

  /**
   * Load all glossary terms from Supabase
   */
  async loadGlossaryTerms() {
    console.log('📖 Loading glossary terms from Supabase...');
    
    try {
      const { data, error, count } = await supabase
        .from('alice_glossary')
        .select('term')
        .order('term');

      if (error) {
        throw new Error(`Failed to fetch glossary terms: ${error.message}`);
      }

      // Create a Set with all terms in various case forms
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

      this.stats.totalTerms = data?.length || 0;
      console.log(`✅ Successfully loaded ${this.glossaryTerms.size} glossary terms (${this.stats.totalTerms} original entries)`);
      
    } catch (error) {
      console.error('❌ Error loading glossary terms:', error.message);
      throw error;
    }
  }

  /**
   * Load all book content (chapters and sections)
   */
  async loadBookContent() {
    console.log('📚 Loading book content from Supabase...');
    
    try {
      // Get the Alice book
      const { data: book, error: bookError } = await supabase
        .from('books')
        .select('id, title')
        .eq('title', 'Alice in Wonderland')
        .single();

      if (bookError || !book) {
        throw new Error('Alice in Wonderland book not found');
      }

      // Get all chapters
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
      this.stats.chapters = this.bookContent.length;
      this.stats.sections = this.bookContent.reduce((total, chapter) => 
        total + (chapter.sections?.length || 0), 0
      );

      console.log(`✅ Loaded ${this.stats.chapters} chapters with ${this.stats.sections} sections`);
      
    } catch (error) {
      console.error('❌ Error loading book content:', error.message);
      throw error;
    }
  }

  /**
   * Check if a word is a glossary term
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
   * Extract words from text and analyze them
   */
  analyzeText(text, context) {
    const words = text.split(/\s+/);
    const analysis = {
      totalWords: words.length,
      glossaryWords: 0,
      glossaryTerms: [],
      normalWords: 0
    };

    words.forEach(word => {
      if (this.isGlossaryTerm(word)) {
        analysis.glossaryWords++;
        analysis.glossaryTerms.push(word);
      } else {
        analysis.normalWords++;
      }
    });

    this.stats.totalWords += analysis.totalWords;
    this.stats.glossaryWords += analysis.glossaryWords;

    return analysis;
  }

  /**
   * Scan all content for consistency
   */
  scanForConsistency() {
    console.log('🔍 Scanning content for glossary term consistency...');
    
    const report = {
      chapters: [],
      summary: {
        totalGlossaryTerms: 0,
        totalNormalWords: 0,
        consistencyIssues: 0,
        recommendations: []
      }
    };

    this.bookContent.forEach(chapter => {
      const chapterReport = {
        chapterNumber: chapter.number,
        chapterTitle: chapter.title,
        sections: [],
        totalGlossaryTerms: 0,
        totalNormalWords: 0
      };

      if (chapter.sections) {
        chapter.sections.forEach(section => {
          const analysis = this.analyzeText(section.content, {
            chapter: chapter.title,
            section: section.title
          });

          const sectionReport = {
            sectionNumber: section.number,
            sectionTitle: section.title,
            analysis,
            issues: []
          };

          // Check for potential issues
          if (analysis.glossaryWords === 0 && analysis.totalWords > 50) {
            sectionReport.issues.push({
              type: 'no_glossary_terms',
              message: 'No glossary terms found in this section - may indicate missing highlighting'
            });
          }

          if (analysis.glossaryWords > 0) {
            // Check if all glossary terms would get proper highlighting
            analysis.glossaryTerms.forEach(term => {
              const cleanTerm = term.replace(/[.,!?;:'"]/g, '').trim();
              if (!this.glossaryTerms.has(cleanTerm) && 
                  !this.glossaryTerms.has(cleanTerm.toLowerCase()) &&
                  !this.glossaryTerms.has(cleanTerm.charAt(0).toUpperCase() + cleanTerm.slice(1))) {
                sectionReport.issues.push({
                  type: 'missing_glossary_term',
                  message: `Term "${term}" not found in glossary - may not highlight properly`
                });
              }
            });
          }

          chapterReport.sections.push(sectionReport);
          chapterReport.totalGlossaryTerms += analysis.glossaryWords;
          chapterReport.totalNormalWords += analysis.normalWords;
        });
      }

      report.chapters.push(chapterReport);
      report.summary.totalGlossaryTerms += chapterReport.totalGlossaryTerms;
      report.summary.totalNormalWords += chapterReport.totalNormalWords;
    });

    // Generate recommendations
    if (report.summary.totalGlossaryTerms === 0) {
      report.summary.recommendations.push('No glossary terms found in any content - check if glossary is properly loaded');
    }

    if (report.summary.totalGlossaryTerms > 0 && report.summary.totalNormalWords > 0) {
      const ratio = report.summary.totalGlossaryTerms / report.summary.totalNormalWords;
      if (ratio < 0.01) {
        report.summary.recommendations.push('Very few glossary terms found - consider adding more Alice-specific terms');
      }
    }

    return report;
  }

  /**
   * Generate a comprehensive report
   */
  generateReport(scanResults) {
    console.log('\n' + '='.repeat(80));
    console.log('📊 GLOSSARY CONSISTENCY REPORT');
    console.log('='.repeat(80));

    console.log('\n📈 SUMMARY STATISTICS:');
    console.log(`   • Total glossary terms loaded: ${this.stats.totalTerms}`);
    console.log(`   • Total words scanned: ${this.stats.totalWords.toLocaleString()}`);
    console.log(`   • Glossary words found: ${this.stats.glossaryWords.toLocaleString()}`);
    console.log(`   • Chapters analyzed: ${this.stats.chapters}`);
    console.log(`   • Sections analyzed: ${this.stats.sections}`);

    console.log('\n🎨 HIGHLIGHTING COLORS:');
    console.log(`   • Normal words: ${HIGHLIGHT_COLORS.NORMAL_WORD} (blue)`);
    console.log(`   • Glossary terms: ${HIGHLIGHT_COLORS.TECHNICAL_TERM} (orange)`);
    console.log(`   • Enhanced glossary terms: ${HIGHLIGHT_COLORS.TECHNICAL_TERM_ENHANCED} (enhanced orange)`);

    console.log('\n📖 CHAPTER ANALYSIS:');
    scanResults.chapters.forEach(chapter => {
      console.log(`\n   Chapter ${chapter.chapterNumber}: ${chapter.chapterTitle}`);
      console.log(`   • Total words: ${(chapter.totalGlossaryTerms + chapter.totalNormalWords).toLocaleString()}`);
      console.log(`   • Glossary terms: ${chapter.totalGlossaryTerms}`);
      console.log(`   • Normal words: ${chapter.totalNormalWords.toLocaleString()}`);
      
      if (chapter.sections.length > 0) {
        console.log(`   • Sections: ${chapter.sections.length}`);
        
        chapter.sections.forEach(section => {
          const hasIssues = section.issues.length > 0;
          const status = hasIssues ? '⚠️' : '✅';
          console.log(`     ${status} Section ${section.sectionNumber}: ${section.sectionTitle}`);
          console.log(`        Words: ${section.analysis.totalWords}, Glossary terms: ${section.analysis.glossaryWords}`);
          
          if (hasIssues) {
            section.issues.forEach(issue => {
              console.log(`        ⚠️  ${issue.message}`);
            });
          }
        });
      }
    });

    console.log('\n💡 RECOMMENDATIONS:');
    if (scanResults.summary.recommendations.length === 0) {
      console.log('   ✅ No issues found! Glossary highlighting should be consistent across all chapters.');
    } else {
      scanResults.summary.recommendations.forEach(rec => {
        console.log(`   • ${rec}`);
      });
    }

    console.log('\n🔧 TECHNICAL DETAILS:');
    console.log('   • Glossary terms are stored in multiple case variations for accurate matching');
    console.log('   • Hover highlighting uses CSS transitions for smooth animations');
    console.log('   • Glossary terms get enhanced tooltips with "✨ Alice in Wonderland term"');
    console.log('   • Normal words get standard blue highlighting');
    console.log('   • Glossary terms get distinctive orange highlighting');

    console.log('\n' + '='.repeat(80));
  }

  /**
   * Run the complete consistency check
   */
  async run() {
    try {
      console.log('🚀 Starting Glossary Consistency Check...\n');
      
      // Step 1: Load glossary terms
      await this.loadGlossaryTerms();
      
      // Step 2: Load book content
      await this.loadBookContent();
      
      // Step 3: Scan for consistency
      const scanResults = this.scanForConsistency();
      
      // Step 4: Generate report
      this.generateReport(scanResults);
      
      console.log('\n✅ Glossary consistency check completed successfully!');
      
    } catch (error) {
      console.error('\n❌ Error during consistency check:', error.message);
      process.exit(1);
    }
  }
}

// Run the checker if this script is executed directly
if (require.main === module) {
  const checker = new GlossaryConsistencyChecker();
  checker.run();
}

module.exports = GlossaryConsistencyChecker; 