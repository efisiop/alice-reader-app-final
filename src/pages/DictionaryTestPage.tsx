import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, Alert, Chip } from '@mui/material';
import { getDefinition } from '../services/dictionaryService';
import { DictionaryEntry } from '../services/dictionaryService';

const DictionaryTestPage: React.FC = () => {
  const [term, setTerm] = useState('');
  const [context, setContext] = useState('');
  const [result, setResult] = useState<DictionaryEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async () => {
    if (!term.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // For now, use the regular getDefinition since context-aware is not fully implemented
      const definition = await getDefinition(
        'alice-in-wonderland',
        term.trim(),
        undefined, // sectionId
        undefined  // chapterId
      );

      setResult(definition);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Pre-filled examples to demonstrate word origins
  const exampleTerms = [
    { term: 'Alice', context: 'Alice was beginning to get very tired of sitting by her sister on the bank' },
    { term: 'Wonderland', context: 'Welcome to Wonderland!' },
    { term: 'Cheshire Cat', context: 'The Cheshire Cat vanished quite slowly, beginning with the end of the tail' },
    { term: 'Mad Hatter', context: 'The Mad Hatter\'s tea party never ends because he offended Time' },
    { term: 'Dormouse', context: 'The Dormouse was fast asleep at the tea party' }
  ];

  const handleExampleClick = (example: { term: string; context: string }) => {
    setTerm(example.term);
    setContext(example.context);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Context-Aware Dictionary Test
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        This page demonstrates the context-aware dictionary functionality with word origins. 
        Enter a term and optional context to see how definitions can be tailored to the surrounding text.
      </Alert>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Test Parameters
        </Typography>
        
        <TextField
          fullWidth
          label="Term to look up"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="e.g., Alice, Wonderland, Cheshire Cat"
          sx={{ mb: 2 }}
        />
        
        <TextField
          fullWidth
          label="Context (optional)"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="e.g., Alice was beginning to get very tired of sitting by her sister on the bank"
          multiline
          rows={3}
          sx={{ mb: 2 }}
        />
        
        <Button
          variant="contained"
          onClick={handleLookup}
          disabled={loading || !term.trim()}
        >
          {loading ? 'Looking up...' : 'Look up definition'}
        </Button>
      </Paper>

      {/* Example terms with word origins */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Example Terms with Word Origins
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Click on any example to see how word origins work:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {exampleTerms.map((example, index) => (
            <Chip
              key={index}
              label={example.term}
              onClick={() => handleExampleClick(example)}
              variant="outlined"
              clickable
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {result && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Definition for "{result.term}"
          </Typography>
          
          {result.isContextAware && (
            <Alert severity="success" sx={{ mb: 2 }}>
              ✅ Context-aware definition (Relevance: {Math.round((result.contextScore || 0) * 100)}%)
            </Alert>
          )}
          
          <Typography variant="body1" paragraph>
            <strong>Definition:</strong> {result.definition}
          </Typography>
          
          {result.wordOrigin && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                📚 Word Origin:
              </Typography>
              <Typography variant="body2" sx={{ 
                fontStyle: 'italic', 
                color: 'text.secondary',
                p: 1.5,
                bgcolor: 'background.default',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider'
              }}>
                {result.wordOrigin}
              </Typography>
            </Box>
          )}
          
          {result.examples && result.examples.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Examples:
              </Typography>
              {result.examples.map((example, index) => (
                <Typography key={index} variant="body2" sx={{ fontStyle: 'italic', mb: 1 }}>
                  "{example}"
                </Typography>
              ))}
            </Box>
          )}
          
          {result.relatedTerms && result.relatedTerms.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Related terms:
              </Typography>
              <Typography variant="body2">
                {result.relatedTerms.join(', ')}
              </Typography>
            </Box>
          )}
          
          {result.contextKeywords && result.contextKeywords.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Context keywords:
              </Typography>
              <Typography variant="body2">
                {result.contextKeywords.join(', ')}
              </Typography>
            </Box>
          )}
          
          <Typography variant="caption" color="text.secondary">
            Source: {result.source || 'Unknown'}
          </Typography>
        </Paper>
      )}

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Word Origins in Context-Aware Definitions
        </Typography>
        
        <Typography variant="body2" paragraph>
          The context-aware dictionary system intelligently preserves word origins based on context:
        </Typography>
        
        <Box component="ul" sx={{ pl: 2 }}>
          <Typography component="li" variant="body2">
            <strong>Etymology Interest:</strong> If the surrounding text mentions "origin", "etymology", "derived from", etc.
          </Typography>
          <Typography component="li" variant="body2">
            <strong>Historical Terms:</strong> Words with Old French, Latin, or Greek origins
          </Typography>
          <Typography component="li" variant="body2">
            <strong>Compound Words:</strong> Words formed by combining other words
          </Typography>
          <Typography component="li" variant="body2">
            <strong>Named Entities:</strong> Characters or places named after real-world references
          </Typography>
        </Box>
        
        <Typography variant="body2" sx={{ mt: 2 }}>
          This ensures that interesting word origins are preserved even in shortened, context-aware definitions!
        </Typography>
      </Paper>
    </Box>
  );
};

export default DictionaryTestPage; 