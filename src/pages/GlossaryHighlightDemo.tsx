import React from 'react';
import { Box, Typography, Paper, Container, Alert } from '@mui/material';
import GlossaryAwareTextHighlighter from '../components/Reader/GlossaryAwareTextHighlighter';
import { useGlossaryTerms } from '../hooks/useGlossaryTerms';

const GlossaryHighlightDemo: React.FC = () => {
  const { glossaryTerms, isLoading, error, termCount } = useGlossaryTerms();

  // Sample text with Alice in Wonderland terms
  const sampleText = `Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, "and what is the use of a book," thought Alice "without pictures or conversations?"

So she was considering in her own mind (as well as she could, for the hot day made her feel very sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.

There was nothing so very remarkable in that; nor did Alice think it so very much out of the way to hear the Rabbit say to itself, "Oh dear! Oh dear! I shall be late!" (when she thought it over afterwards, it occurred to her that she ought to have wondered at this, but at the time it all seemed quite natural); but when the Rabbit actually took a watch out of its waistcoat-pocket, and looked at it, and then hurried on, Alice started to her feet, for it flashed across her mind that she had never before seen a rabbit with either a waistcoat-pocket, or a watch to take out of it, and burning with curiosity, she ran across the field after it, and fortunately was just in time to see it pop down a large rabbit-hole under the hedge.

In another moment down went Alice after it, never once considering how in the world she was to get out again.

The rabbit-hole went straight on like a tunnel for some way, and then dipped suddenly down, so suddenly that Alice had not a moment to think about stopping herself before she found herself falling down a very deep well.

Either the well was very deep, or she fell very slowly, for she had plenty of time as she went down to look about her and to wonder what was going to happen next. First, she tried to look down and make out what she was coming to, but it was too dark to see anything; then she looked at the sides of the well, and noticed that they were filled with cupboards and book-shelves; here and there she saw maps and pictures hung upon pegs. She took down a jar from one of the shelves as she passed; it was labelled "ORANGE MARMALADE", but to her great disappointment it was empty: she did not like to drop the jar for fear of killing somebody, so managed to put it into one of the cupboards as she fell past it.

"Well!" thought Alice to herself, "after such a fall as this, I shall think nothing of tumbling down stairs! How brave they'll all think me at home! Why, I wouldn't say anything about it, even if I fell off the top of the house!" (Which was very likely true.)

Down, down, down. Would the fall never come to an end! "I wonder how many miles I've fallen by this time?" she said aloud. "I must be getting somewhere near the centre of the earth. Let me see: that would be four thousand miles down, I think—" (for, you see, Alice had learnt several things of this sort in her lessons in the schoolroom, and though this was not a very good opportunity for showing off her knowledge, as there was no one to listen to her, still it was good practice to say it over) "—yes, that's about the right distance—but then I wonder what Latitude or Longitude I've got to?" (Alice had no idea what Latitude was, or Longitude either, but thought they were nice grand words to say.)`;

  const handleWordSelect = (word: string, element: HTMLElement) => {
    console.log('Word clicked:', word);
    alert(`You clicked on: "${word}"\n\nThis would show the definition for this word.`);
  };

  const handleTextSelect = (text: string) => {
    console.log('Text selected:', text);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Glossary-Aware Text Highlighting Demo
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>How it works:</strong> Hover over words in the text below. Technical terms from Alice in Wonderland 
          will show an orange highlight, while normal words will show a blue highlight. Click on any word to see its definition.
        </Typography>
      </Alert>

      {isLoading && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Loading glossary terms...
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Error loading glossary terms: {error}
        </Alert>
      )}

      {!isLoading && termCount > 0 && (
        <Alert severity="success" sx={{ mb: 3 }}>
          ✅ Loaded {termCount} glossary terms for hover highlighting
        </Alert>
      )}

      <Paper elevation={2} sx={{ p: 4 }}>
        <Typography variant="h6" gutterBottom>
          Alice's Adventures in Wonderland - Chapter 1
        </Typography>
        
        <Box sx={{ mt: 3 }}>
          <GlossaryAwareTextHighlighter
            text={sampleText}
            onWordSelect={handleWordSelect}
            onTextSelect={handleTextSelect}
            fontSize="1.1rem"
            lineHeight={1.8}
            fontFamily="Georgia, serif"
            glossaryTerms={glossaryTerms}
            normalWordHoverColor="rgba(25, 118, 210, 0.1)"
            technicalWordHoverColor="rgba(255, 152, 0, 0.2)"
          />
        </Box>
      </Paper>

      <Paper elevation={1} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Legend
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box 
              sx={{ 
                width: 20, 
                height: 20, 
                backgroundColor: 'rgba(25, 118, 210, 0.1)',
                border: '1px solid rgba(25, 118, 210, 0.3)',
                borderRadius: 1
              }} 
            />
            <Typography variant="body2">Normal words (blue highlight)</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box 
              sx={{ 
                width: 20, 
                height: 20, 
                backgroundColor: 'rgba(255, 152, 0, 0.2)',
                border: '1px solid rgba(255, 152, 0, 0.4)',
                borderRadius: 1
              }} 
            />
            <Typography variant="body2">Technical terms (orange highlight)</Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default GlossaryHighlightDemo; 