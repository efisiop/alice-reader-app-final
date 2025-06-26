// Script to import Alice in Wonderland glossary from CSV
// Usage: node scripts/import_alice_glossary.js path/to/your/glossary.csv

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('Error: Missing VITE_SUPABASE_URL in environment variables');
  process.exit(1);
}

// Try service role key first, fallback to anon key
const supabaseKey = supabaseServiceKey || supabaseAnonKey;

if (!supabaseKey) {
  console.error('Error: Missing Supabase key in environment variables');
  console.error('Please ensure SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY is set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

if (supabaseServiceKey) {
  console.log('🔐 Using service role key for admin operations');
} else {
  console.log('🔑 Using anon key - some operations may require authentication');
}

// Alice in Wonderland book UUID (you may need to adjust this)
const ALICE_BOOK_UUID = '550e8400-e29b-41d4-a716-446655440000';

// Robust CSV parser that handles multi-line quoted fields
function parseCSV(csvContent) {
  const lines = csvContent.split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row');
  }

  // Parse header
  const headers = parseCSVLine(lines[0]);
  console.log('CSV Headers:', headers);

  // Parse data rows - handle multi-line quoted fields
  const data = [];
  let currentRow = '';
  let inQuotes = false;
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    
    // Count quotes to determine if we're inside a quoted field
    const quoteCount = (line.match(/"/g) || []).length;
    
    if (currentRow) {
      currentRow += '\n' + line;
    } else {
      currentRow = line;
    }
    
    // Count total quotes in current row
    const totalQuotes = (currentRow.match(/"/g) || []).length;
    
    // If quotes are balanced (even number), we have a complete row
    if (totalQuotes % 2 === 0) {
      if (currentRow.trim()) {
        const values = parseCSVLine(currentRow);
        
        // Create object from headers and values
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        
        data.push(row);
      }
      currentRow = '';
    }
  }

  return data;
}

// Parse a single CSV line with proper quote handling
function parseCSVLine(line) {
  const values = [];
  let currentValue = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      // Handle escaped quotes ("")
      if (inQuotes && line[i + 1] === '"') {
        currentValue += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(currentValue.trim());
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  values.push(currentValue.trim()); // Add the last value
  
  // Clean up values - remove surrounding quotes and trim
  return values.map(val => {
    val = val.trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1);
    }
    return val;
  });
}

// Extract chapter references from citation format
function extractChapterReferences(definition, sourceSentence) {
  const citePattern = /\[cite:\s*([0-9,\s]+)\]/gi;
  const matches = definition.match(citePattern);
  
  if (matches) {
    // Extract page numbers and try to map to chapters
    const pageNumbers = matches[0].replace(/\[cite:\s*|\]/gi, '').split(',').map(p => parseInt(p.trim()));
    
    // Simple mapping based on typical Alice in Wonderland page ranges
    // You may need to adjust these ranges based on your book edition
    const chapters = [];
    pageNumbers.forEach(page => {
      if (page <= 50) chapters.push('1');
      else if (page <= 100) chapters.push('2'); 
      else if (page <= 150) chapters.push('3');
    });
    
    return [...new Set(chapters)].join(','); // Remove duplicates
  }
  
  return null;
}

// Clean definition text (remove citation markers)
function cleanDefinition(definition) {
  return definition.replace(/\[cite:\s*[0-9,\s]+\]/gi, '').trim();
}

async function importGlossary(csvFilePath) {
  try {
    console.log('🚀 Starting Alice in Wonderland glossary import...');
    
    // Check if file exists
    if (!fs.existsSync(csvFilePath)) {
      throw new Error(`CSV file not found: ${csvFilePath}`);
    }

    // Read and parse CSV
    console.log('📖 Reading CSV file...');
    const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
    const glossaryData = parseCSV(csvContent);
    
    console.log(`📊 Found ${glossaryData.length} glossary entries to import`);

    // Try to find Alice in Wonderland book or create it
    console.log('🔍 Looking for Alice in Wonderland book...');
    
    // First try to find any Alice book
    const { data: existingBooks, error: searchError } = await supabase
      .from('books')
      .select('id, title, author')
      .or('title.ilike.%Alice%,title.ilike.%Wonderland%')
      .limit(5);

    let book = null;
    let bookUuid = ALICE_BOOK_UUID;

    if (existingBooks && existingBooks.length > 0) {
      console.log('📚 Found existing Alice-related books:');
      existingBooks.forEach((b, i) => {
        console.log(`  ${i + 1}. "${b.title}" by ${b.author} (ID: ${b.id})`);
      });
      
      // Use the first Alice book found
      book = existingBooks[0];
      bookUuid = book.id;
      console.log(`✅ Using book: "${book.title}" (${bookUuid})`);
    } else {
      console.log('📖 No Alice books found, will try to create entry or proceed with default UUID');
      console.log(`🔧 Attempting to use default UUID: ${ALICE_BOOK_UUID}`);
      
      // Try to create the book entry
      try {
        const { data: newBook, error: createError } = await supabase
          .from('books')
          .insert([{
            id: ALICE_BOOK_UUID,
            title: "Alice's Adventures in Wonderland",
            author: "Lewis Carroll",
            created_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (createError) {
          console.warn('⚠️  Could not create book entry:', createError.message);
          console.log('🔧 Will proceed with import anyway using default UUID');
        } else {
          console.log('✅ Created book entry:', newBook.title);
          book = newBook;
        }
      } catch (err) {
        console.warn('⚠️  Book creation failed, proceeding with import anyway');
      }
    }

    // Import each glossary entry
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < glossaryData.length; i++) {
      const entry = glossaryData[i];
      
      // Map CSV columns (adjust these based on your CSV structure)
      const term = entry.Term || entry.term || '';
      const definition = entry.Definition || entry.definition || '';
      const sourceSentence = entry['Source Sentence'] || entry.source_sentence || '';
      const example = entry.Example || entry.example || '';

      if (!term || !definition) {
        console.warn(`⚠️  Skipping entry ${i + 1}: Missing term or definition`);
        errorCount++;
        continue;
      }

      try {
        // Clean the definition and extract chapter references
        const cleanedDefinition = cleanDefinition(definition);
        const chapterReference = extractChapterReferences(definition, sourceSentence);

        console.log(`📝 Importing: "${term}"`);

        // Use the import function we created in the migration
        const { data, error } = await supabase
          .rpc('import_glossary_term', {
            p_book_id: bookUuid,
            p_term: term,
            p_definition: cleanedDefinition,
            p_source_sentence: sourceSentence || null,
            p_example: example || null,
            p_chapter_reference: chapterReference
          });

        if (error) {
          console.error(`❌ Error importing "${term}":`, error);
          errorCount++;
        } else {
          console.log(`✅ Successfully imported: "${term}"`);
          successCount++;
        }

      } catch (err) {
        console.error(`❌ Error processing "${term}":`, err);
        errorCount++;
      }
    }

    console.log('\n🎉 Import completed!');
    console.log(`✅ Successfully imported: ${successCount} entries`);
    console.log(`❌ Errors: ${errorCount} entries`);

    // Show sample of imported data
    console.log('\n📋 Sample of imported glossary entries:');
    const { data: sampleEntries } = await supabase
      .from('alice_glossary')
      .select('term, definition')
      .eq('book_id', bookUuid)
      .limit(5);

    if (sampleEntries) {
      sampleEntries.forEach(entry => {
        console.log(`  • ${entry.term}: ${entry.definition.substring(0, 100)}...`);
      });
    }

  } catch (error) {
    console.error('💥 Import failed:', error);
    process.exit(1);
  }
}

// Main execution
async function main() {
  const csvFilePath = process.argv[2];
  
  if (!csvFilePath) {
    console.error('Usage: node scripts/import_alice_glossary.js <path-to-csv-file>');
    console.error('Example: node scripts/import_alice_glossary.js ./alice_glossary.csv');
    process.exit(1);
  }

  await importGlossary(csvFilePath);
}

// Run the script
// Run the import
main().catch(console.error); 