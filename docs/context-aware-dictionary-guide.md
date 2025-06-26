# Context-Aware Dictionary Guide

## Overview

The Context-Aware Dictionary feature enhances the reading experience by providing shorter, more relevant definitions based on the surrounding text context. Instead of showing lengthy definitions that may not be relevant to the current reading context, the system analyzes the text around a selected word and provides the most applicable definition.

## How It Works

### 1. Context Capture
When a user clicks on a word in the text, the system captures:
- The selected word
- Surrounding text (typically 3 words before and after)
- Current section/chapter context
- Book context

### 2. Keyword Analysis
The system extracts meaningful keywords from:
- The surrounding text
- The full definition
- Available examples

### 3. Relevance Scoring
A relevance score is calculated based on:
- Keyword overlap between context and definition
- Semantic similarity
- Context-specific examples

### 4. Definition Optimization
The system then:
- Selects the most relevant sentence from the full definition
- Chooses the most applicable example
- Truncates long definitions to focus on relevant parts
- Limits definition length to ~200 characters

### 5. Word Origin Preservation
The system intelligently preserves word origins when:
- The context mentions etymology-related terms ("origin", "etymology", "derived from", etc.)
- The word has interesting historical origins (Old French, Latin, Greek)
- The word is a compound word or named entity
- The word origin provides valuable cultural or historical context

## Benefits

### For Readers
- **Faster Comprehension**: Shorter, focused definitions
- **Better Relevance**: Definitions match the reading context
- **Reduced Cognitive Load**: Less information to process
- **Improved Flow**: Minimal interruption to reading
- **Rich Etymology**: Preserved word origins for linguistic learning

### For Learning
- **Contextual Understanding**: Words are defined in their actual usage
- **Better Retention**: Relevant examples help memory
- **Progressive Learning**: Can expand to full definition when needed
- **Historical Context**: Word origins provide cultural and linguistic insights

## Technical Implementation

### Core Functions

#### `getContextAwareDefinition()`
```typescript
async function getContextAwareDefinition(
  bookId: string,
  term: string,
  surroundingText: string,
  sectionId?: string,
  chapterId?: string
): Promise<DictionaryEntry>
```

#### `analyzeContext()`
```typescript
function analyzeContext(
  term: string,
  surroundingText: string,
  fullDefinition: DictionaryEntry
): {
  relevantDefinition: string;
  score: number;
  keywords: string[];
  preserveWordOrigin: boolean;
}
```

#### `extractKeywords()`
```typescript
function extractKeywords(text: string): string[]
```

### Algorithm Steps

1. **Text Preprocessing**
   - Clean and normalize text
   - Remove punctuation and stop words
   - Extract meaningful keywords

2. **Keyword Matching**
   - Compare context keywords with definition keywords
   - Calculate overlap score
   - Identify relevant examples

3. **Definition Selection**
   - Split definition into sentences
   - Score each sentence for relevance
   - Select best matching sentence

4. **Length Optimization**
   - Truncate if definition is too long
   - Preserve complete sentences
   - Add ellipsis for truncated content

5. **Word Origin Analysis**
   - Check for etymology-related keywords in context
   - Evaluate word origin significance
   - Preserve origins for historically interesting terms

## Usage Examples

### Example 1: "Alice" in Different Contexts

**Context 1**: "Alice was beginning to get very tired of sitting by her sister on the bank"
- **Context-Aware Definition**: "The curious and imaginative protagonist of the story"
- **Word Origin**: "From Old French 'Aalis', a variant of 'Adelais' meaning 'noble kind'"
- **Full Definition**: "The curious and imaginative protagonist of the story who follows the White Rabbit down the rabbit hole into Wonderland."

**Context 2**: "The origin of the name Alice comes from Old French"
- **Context-Aware Definition**: "The curious and imaginative protagonist of the story"
- **Word Origin**: "From Old French 'Aalis', a variant of 'Adelais' meaning 'noble kind'" (preserved due to etymology interest)
- **Full Definition**: "The curious and imaginative protagonist of the story who follows the White Rabbit down the rabbit hole into Wonderland."

### Example 2: "Wonderland" in Different Contexts

**Context 1**: "Welcome to Wonderland!"
- **Context-Aware Definition**: "The magical and nonsensical world that Alice discovers"
- **Word Origin**: "Compound word: 'wonder' (amazement) + 'land' (territory)"
- **Full Definition**: "The magical and nonsensical world that Alice discovers after falling down the rabbit hole, where animals can talk and nothing follows normal logic."

**Context 2**: "The etymology of Wonderland shows it's a compound word"
- **Context-Aware Definition**: "The magical and nonsensical world that Alice discovers"
- **Word Origin**: "Compound word: 'wonder' (amazement) + 'land' (territory)" (preserved due to etymology interest)
- **Full Definition**: "The magical and nonsensical world that Alice discovers after falling down the rabbit hole, where animals can talk and nothing follows normal logic."

### Example 3: "Cheshire Cat" Etymology

**Context**: "The Cheshire Cat vanished quite slowly"
- **Context-Aware Definition**: "A mysterious feline known for its mischievous grin"
- **Word Origin**: "Named after Cheshire, a county in England, known for its cheese"
- **Full Definition**: "A mysterious feline known for its mischievous grin that can appear and disappear at will, offering cryptic advice to Alice."

## Configuration

### Relevance Thresholds
- **Minimum Context Score**: 0.2 (20%) for context-aware processing
- **Example Relevance**: 0.3 (30%) for including examples
- **Sentence Relevance**: 0.1 (10%) for sentence selection

### Length Limits
- **Maximum Definition Length**: 200 characters
- **Truncation Point**: 150 characters for word boundary
- **Context Window**: 3 words before and after

### Word Origin Preservation
- **Etymology Keywords**: origin, etymology, derived, comes from, meaning, root, history, old, ancient, latin, greek, french, german
- **Historical Origins**: Old French, Latin, Greek, Compound word, Named after
- **Always Preserve**: When context shows etymology interest or word has significant historical origin

### Stop Words
Common English stop words are filtered out during keyword extraction:
- Articles: the, a, an
- Prepositions: in, on, at, to, for, of, with, by
- Conjunctions: and, or, but
- Pronouns: I, you, he, she, it, we, they
- Common verbs: is, are, was, were, have, has, had

## Future Enhancements

### Planned Features
1. **AI-Powered Analysis**: Use machine learning for better context understanding
2. **Semantic Similarity**: Implement word embeddings for better matching
3. **User Preferences**: Allow users to adjust definition length and detail level
4. **Learning Adaptation**: Adapt to user's vocabulary level and reading patterns
5. **Multilingual Support**: Extend to other languages
6. **Enhanced Etymology**: Include more detailed word origin information and historical context

### Performance Optimizations
1. **Caching**: Cache context analysis results
2. **Preprocessing**: Pre-analyze common word contexts
3. **Lazy Loading**: Load full definitions only when requested
4. **Background Processing**: Analyze context in background threads

## Testing

### Test Cases
1. **Basic Context Matching**: Verify keyword overlap detection
2. **Sentence Selection**: Test relevance scoring for different sentences
3. **Length Optimization**: Ensure definitions are appropriately truncated
4. **Word Origin Preservation**: Test etymology detection and preservation
5. **Edge Cases**: Handle empty context, very long definitions, etc.
6. **Performance**: Measure response time for context analysis

### Test Data
- Sample texts from Alice in Wonderland
- Various word contexts and definitions
- Different definition lengths and complexities
- Words with interesting etymologies
- Edge cases and error conditions

## Conclusion

The Context-Aware Dictionary feature significantly improves the reading experience by providing more relevant and concise definitions. By analyzing the surrounding text context, the system delivers definitions that are tailored to the specific usage and meaning of words in their current context, while intelligently preserving valuable word origin information for linguistic and cultural learning. 