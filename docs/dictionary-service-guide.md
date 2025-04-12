# Dictionary Service Implementation Guide

This guide explains how to use the Dictionary Service in the Alice Reader app, including how to populate the dictionary table with definitions and how to use the service in the frontend.

## Overview

The Dictionary Service provides word definitions with contextual awareness, meaning that definitions can be specific to a book, chapter, or section. This allows for more accurate and relevant definitions based on the context in which a word appears.

## Database Schema

The dictionary table has the following structure:

```sql
CREATE TABLE dictionary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  definition TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(book_id, term, chapter_id, section_id)
);
```

The table uses a contextual hierarchy:
- Book-level definitions (most general)
- Chapter-level definitions (more specific)
- Section-level definitions (most specific)

## Populating the Dictionary

### Using the Provided Scripts

We've created scripts to populate the dictionary table with sample data:

1. **Populate the dictionary table**:
   ```bash
   npm run dictionary:populate
   ```

2. **Test the dictionary service**:
   ```bash
   npm run dictionary:test
   ```

### Adding Custom Definitions

To add custom definitions, you can:

1. Modify the `scripts/populate_dictionary.sql` file to include your own definitions
2. Use the Supabase dashboard to add entries directly to the dictionary table
3. Create a custom script to import definitions from a CSV or JSON file

## Using the Dictionary Service in the Frontend

### Basic Usage

```typescript
import { getDefinition } from '../services/dictionaryService';

// Get a definition with context
const definition = await getDefinition(
  bookId,    // Required: The ID of the book
  term,      // Required: The word to look up
  sectionId, // Optional: Current section ID for context
  chapterId  // Optional: Current chapter ID for context
);

// The result includes:
// - term: The original term
// - definition: The definition text
// - source: Where the definition came from ('database', 'local', 'external', or 'fallback')
// - examples: Optional array of example sentences (if available)
// - relatedTerms: Optional array of related terms (if available)
// - pronunciation: Optional pronunciation guide (if available)
```

### Logging Dictionary Lookups

To track dictionary usage for analytics:

```typescript
import { logDictionaryLookup } from '../services/dictionaryService';

// Log that a user looked up a definition
await logDictionaryLookup(
  userId,           // User ID
  bookId,           // Book ID
  sectionId,        // Section ID (optional)
  term,             // The term that was looked up
  definitionFound   // Boolean indicating if a definition was found
);
```

### User Vocabulary

The service also supports saving words to a user's personal vocabulary:

```typescript
import { saveToVocabulary, getUserVocabulary, removeFromVocabulary } from '../services/dictionaryService';

// Save a word to the user's vocabulary
saveToVocabulary(userId, term, definition);

// Get all words in the user's vocabulary
const vocabulary = getUserVocabulary(userId);

// Remove a word from the user's vocabulary
removeFromVocabulary(userId, term);
```

## Fallback Mechanisms

The Dictionary Service uses a multi-tiered approach to find definitions:

1. **Database Lookup**: First tries to find a definition in the Supabase database with context
2. **Local Dictionary**: Falls back to a small built-in dictionary for common terms
3. **External API**: If not found locally, queries an external dictionary API
4. **Fallback Message**: If all else fails, returns a generic "No definition available" message

## Performance Considerations

- Definitions are cached for 24 hours to improve performance
- The service uses context-aware lookups to provide the most relevant definitions
- Failed lookups are cached for a shorter period (1 hour) to prevent repeated API calls

## Extending the Service

To extend the Dictionary Service:

1. **Add more local definitions**: Expand the `localDictionary` object in `dictionaryService.ts`
2. **Integrate with additional external APIs**: Add new API services in the fallback chain
3. **Enhance the database schema**: Add additional fields like part of speech, etymology, etc.

## Troubleshooting

If definitions aren't appearing correctly:

1. Check that the dictionary table is populated with data
2. Verify that the book, chapter, and section IDs are correct
3. Ensure the term is being properly cleaned (removing punctuation, etc.)
4. Check the browser console for any errors from the Dictionary Service
5. Try clearing the definition cache with `clearDefinitionCache()`
