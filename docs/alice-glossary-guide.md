# Alice Glossary System Guide

## Overview

The Alice Glossary System is a specialized feature of the Alice Reader that provides contextual definitions for terms specific to "Alice's Adventures in Wonderland." This system prioritizes Alice-specific definitions over generic dictionary entries, helping readers understand Victorian-era language, literary references, and unique expressions from Lewis Carroll's work.

## 🎯 Key Features

### Priority-Based Definition Lookup
The system uses a hierarchical approach to find the most relevant definition:

1. **Alice Glossary** (Priority 0) - Custom Alice-specific definitions
2. **Dictionary Section** (Priority 1) - Section-specific contextual definitions  
3. **Dictionary Chapter** (Priority 2) - Chapter-specific contextual definitions
4. **Dictionary Book** (Priority 3) - General book-wide definitions
5. **External APIs** (Fallback) - Standard dictionary services

### Smart Text Recognition
- **Partial Word Expansion**: Selecting "Caucus" expands to "Caucus-Race"
- **Phrasal Recognition**: Supports multi-word expressions (up to 4 words)
- **Victorian Terminology**: Understanding of period-specific language
- **Literary Context**: Definitions include usage examples from the text

## 🛠️ Setup and Installation

### Database Migration

1. **Run the migration script:**
   ```bash
   node scripts/run_migration.js
   ```

   This creates:
   - `alice_glossary` table
   - `get_glossary_definition()` function
   - `import_glossary_term()` function
   - Proper indexing and RLS policies

### Import Glossary Data

2. **Import sample data:**
   ```bash
   node scripts/import_alice_glossary.js
   ```

   Or create your own CSV file with the format:
   ```csv
   term,definition,source_sentence,example,citation
   "A Caucus-Race","A race where everyone runs in a circle with no clear winner, representing the absurdity of certain activities","The race is over!' and they all crowded round her, panting, and asking, 'But who has won?'","In politics, the debate felt like a caucus-race - lots of activity but no real progress","[cite: pages 45-47]"
   ```

### Environment Configuration

3. **Set up environment variables:**
   ```bash
   # Add to .env.local
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

## 🗂️ Database Schema

### alice_glossary Table

```sql
CREATE TABLE alice_glossary (
    id BIGSERIAL PRIMARY KEY,
    term TEXT NOT NULL,
    definition TEXT NOT NULL,
    source_sentence TEXT,
    example TEXT,
    chapter_reference TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Fields Description:
- **term**: The word or phrase to be defined
- **definition**: The Alice-specific definition
- **source_sentence**: Original sentence from the book
- **example**: Modern usage example
- **chapter_reference**: Chapter information (e.g., "Chapter 1", "Chapter 2-3")

### Database Functions

#### get_glossary_definition(book_uuid, search_term)
Returns the best matching definition with priority system:

```sql
SELECT * FROM get_glossary_definition(
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'caucus-race'
);
```

#### import_glossary_term(term, definition, source, example, chapter)
Safely imports or updates glossary terms:

```sql
SELECT import_glossary_term(
    'Mock Turtle',
    'A melancholy character who tells Alice about his education',
    'We called him Tortoise because he taught us',
    'Like the Mock Turtle, he seemed sad about his past',
    'Chapter 9'
);
```

## 📊 CSV Import Format

### Required Format
Create CSV files with these exact column headers:

```csv
term,definition,source_sentence,example,citation
```

### Example Entries

```csv
"White Rabbit","The anxious, time-conscious rabbit who leads Alice into Wonderland","Oh dear! Oh dear! I shall be late!","Like the White Rabbit, she was always checking her watch","[cite: pages 12-15]"
"Cheshire Cat","A grinning cat known for its ability to disappear, leaving only its smile","We're all mad here. I'm mad. You're mad.","His Cheshire Cat grin made everyone uncomfortable","[cite: pages 89-95]"
"Mad Hatter","An eccentric character from the endless tea party","Have I gone mad? I'm afraid so, but let me tell you something, the best people usually are.","The meeting was as chaotic as the Mad Hatter's tea party","[cite: pages 102-110]"
```

### CSV Guidelines

1. **Quotes**: Always wrap multi-word terms and definitions in quotes
2. **Citations**: Use format `[cite: pages X-Y]` for page references
3. **Escaping**: Use `""` for quotes within quoted fields
4. **Encoding**: Save files as UTF-8 to handle special characters

## 🚀 Usage in the Application

### Text Selection
1. **Navigate** to the reader interface: `/#/reader/interaction`
2. **Enter a page number** and select a section
3. **Click or highlight** any word in the text
4. **View definition** that appears at the top of the section

### Definition Display
- **Gradient Background**: Beautiful visual presentation
- **Priority Indicator**: Shows source (glossary, dictionary, external)
- **Examples**: Includes usage examples when available
- **Close Button**: Easy dismissal of definitions

### Smart Features
- **Auto-expansion**: Partial selections expand to full terms
- **Phrase Recognition**: Multi-word expressions are recognized
- **Context Awareness**: Chapter-specific definitions when available
- **Fallback System**: Graceful degradation to external dictionaries

## 🧪 Testing the System

### Manual Testing

1. **Test Custom Definitions:**
   ```bash
   # Navigate to reader
   # Select "A Caucus-Race" in the text
   # Verify custom Alice definition appears
   ```

2. **Test Phrase Recognition:**
   ```bash
   # Select partial word "Caucus"
   # Verify expansion to "Caucus-Race"
   # Check definition appears correctly
   ```

3. **Test Fallback System:**
   ```bash
   # Select common word like "table"
   # Verify external dictionary definition
   # Check source indicator
   ```

### Automated Testing

```bash
# Test database connection
node test_connection_simple.js

# Test glossary functionality
node scripts/test_glossary.js

# Verify import process
node scripts/import_alice_glossary.js
```

## 📝 Content Management

### Adding New Terms

1. **Via CSV Import:**
   ```bash
   # Create new CSV file
   # Add entries in correct format
   # Run import script
   node scripts/import_alice_glossary.js path/to/your/file.csv
   ```

2. **Via Database Function:**
   ```sql
   SELECT import_glossary_term(
       'New Term',
       'Definition of the new term',
       'Source sentence from book',
       'Modern usage example',
       'Chapter 1'
   );
   ```

### Updating Existing Terms

The `import_glossary_term()` function will update existing terms:
- If term exists: Updates definition, source, example
- If term doesn't exist: Creates new entry
- Always updates `updated_at` timestamp

### Chapter Mapping

Page ranges are automatically mapped to chapters:
- **Pages 1-50**: Chapter 1
- **Pages 51-100**: Chapter 2  
- **Pages 101-150**: Chapter 3
- And so on...

## 🔧 Troubleshooting

### Common Issues

#### Import Script Fails
```bash
# Check environment variables
echo $SUPABASE_SERVICE_ROLE_KEY

# Verify database connection
node test_connection_simple.js

# Check CSV format
head -5 your_file.csv
```

#### Definitions Not Appearing
```bash
# Test lookup function directly
psql -c "SELECT * FROM get_glossary_definition('550e8400-e29b-41d4-a716-446655440000'::uuid, 'caucus-race');"

# Check browser console for errors
# Verify text selection is working
```

#### CSV Format Errors
- Ensure proper quote escaping: `"He said ""Hello"" to me"`
- Check for unmatched quotes in definitions
- Verify UTF-8 encoding for special characters
- Ensure no trailing commas or empty rows

### Debug Queries

```sql
-- Check glossary contents
SELECT term, definition FROM alice_glossary ORDER BY term;

-- Test definition lookup
SELECT * FROM get_glossary_definition(
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'white rabbit'
);

-- Check import log
SELECT * FROM alice_glossary WHERE updated_at > NOW() - INTERVAL '1 day';
```

## 🎨 Customization

### Styling Definition Display
The definition area uses CSS classes that can be customized:

```css
/* Definition container */
.definition-display {
    background: linear-gradient(135deg, #f8f9ff 0%, #e8f0fe 50%, #f0f4ff 100%);
    border-radius: 12px;
    padding: 24px;
}

/* Definition term */
.definition-term {
    font-weight: bold;
    color: primary;
    margin-bottom: 8px;
}

/* Definition text */
.definition-text {
    line-height: 1.6;
    margin-bottom: 8px;
}
```

### Priority System Customization
Modify the priority values in the database function:

```sql
-- Custom priority order
CASE 
    WHEN source = 'alice_glossary' THEN 0
    WHEN source = 'custom_dictionary' THEN 1
    WHEN source = 'external_api' THEN 2
    ELSE 3
END as priority
```

## 📈 Analytics and Insights

### Usage Tracking
The system logs all definition lookups:
- User ID
- Book ID and Section ID
- Search term
- Definition found (true/false)
- Timestamp

### Query Patterns
Monitor which terms are looked up most frequently:

```sql
SELECT 
    content as search_term,
    COUNT(*) as lookup_count
FROM user_interactions 
WHERE interaction_type = 'dictionary_lookup'
GROUP BY content
ORDER BY lookup_count DESC
LIMIT 20;
```

## 🔮 Future Enhancements

### Planned Features
- **Audio Pronunciations**: Add pronunciation guides for Victorian terms
- **Visual Illustrations**: Include period-appropriate images
- **Cross-References**: Link related terms and concepts
- **User Contributions**: Allow users to suggest definitions
- **Multi-Language Support**: Translate Alice terms to other languages

### API Extensions
- **Batch Import**: Import large glossaries efficiently
- **Export Functions**: Generate glossary reports
- **Versioning**: Track definition changes over time
- **Approval Workflow**: Review process for user contributions

## 📚 Resources

### Reference Materials
- **Original Text**: Project Gutenberg Alice's Adventures in Wonderland
- **Victorian Dictionary**: Historical term references
- **Literary Analysis**: Academic interpretations of Carroll's language
- **Etymology**: Word origin and evolution tracking

### Community
- **GitHub Issues**: Report bugs or suggest improvements
- **Documentation**: Contribute to guides and examples
- **Testing**: Help validate new features and definitions

---

**The Alice Glossary System transforms reading comprehension by providing contextual, literary-aware definitions that enhance understanding of classic literature. Happy exploring! 📖✨** 