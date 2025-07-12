import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Container, 
  Alert, 
  Chip, 
  Grid, 
  Card, 
  CardContent,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoIcon from '@mui/icons-material/Info';
import GlossaryAwareTextHighlighter from '../components/Reader/GlossaryAwareTextHighlighter';
import { useGlossaryTerms } from '../hooks/useGlossaryTerms';
import { searchGlossaryTerms, clearGlossaryCache } from '../services/glossaryService';
import { getDefinition } from '../services/dictionaryService';
import { DictionaryEntry } from '../services/dictionaryService';
import { appLog } from '../components/LogViewer';

const AliceGlossaryDemo: React.FC = () => {
  const { glossaryTerms, isLoading, error, termCount, isGlossaryTerm } = useGlossaryTerms();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Sample text with many Alice in Wonderland terms
  const sampleText = `Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, "and what is the use of a book," thought Alice "without pictures or conversations?"

So she was considering in her own mind (as well as she could, for the hot day made her feel very sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.

There was nothing so very remarkable in that; nor did Alice think it so very much out of the way to hear the Rabbit say to itself, "Oh dear! Oh dear! I shall be late!" (when she thought it over afterwards, it occurred to her that she ought to have wondered at this, but at the time it all seemed quite natural); but when the Rabbit actually took a watch out of its waistcoat-pocket, and looked at it, and then hurried on, Alice started to her feet, for it flashed across her mind that she had never before seen a rabbit with either a waistcoat-pocket, or a watch to take out of it, and burning with curiosity, she ran across the field after it, and fortunately was just in time to see it pop down a large rabbit-hole under the hedge.

In another moment down went Alice after it, never once considering how in the world she was to get out again.

The rabbit-hole went straight on like a tunnel for some way, and then dipped suddenly down, so suddenly that Alice had not a moment to think about stopping herself before she found herself falling down a very deep well.

Either the well was very deep, or she fell very slowly, for she had plenty of time as she went down to look about her and to wonder what was going to happen next. First, she tried to look down and make out what she was coming to, but it was too dark to see anything; then she looked at the sides of the well, and noticed that they were filled with cupboards and book-shelves; here and there she saw maps and pictures hung upon pegs. She took down a jar from one of the shelves as she passed; it was labelled "ORANGE MARMALADE", but to her great disappointment it was empty: she did not like to drop the jar for fear of killing somebody, so managed to put it into one of the cupboards as she fell past it.

"Well!" thought Alice to herself, "after such a fall as this, I shall think nothing of tumbling down stairs! How brave they'll all think me at home! Why, I wouldn't say anything about it, even if I fell off the top of the house!" (Which was very likely true.)

Down, down, down. Would the fall never come to an end! "I wonder how many miles I've fallen by this time?" she said aloud. "I must be getting somewhere near the centre of the earth. Let me see: that would be four thousand miles down, I think—" (for, you see, Alice had learnt several things of this sort in her lessons in the schoolroom, and though this was not a very good opportunity for showing off her knowledge, as there was no one to listen to her, still it was good practice to say it over) "—yes, that's about the right distance—but then I wonder what Latitude or Longitude I've got to?" (Alice had no idea what Latitude was, or Longitude either, but thought they were nice grand words to say.)

The Caterpillar and Alice looked at each other for some time in silence: at last the Caterpillar took the hookah out of its mouth, and addressed her in a languid, sleepy voice.

"Who are you?" said the Caterpillar.

This was not an encouraging opening for a conversation. Alice replied, rather shyly, "I—I hardly know, sir, just at present—at least I know who I was when I got up this morning, but I think I must have been changed several times since then."

"What do you mean by that?" said the Caterpillar sternly. "Explain yourself!"

"I can't explain myself, I'm afraid, sir," said Alice, "because I'm not myself, you see."

"I don't see," said the Caterpillar.

"I'm afraid I can't put it more clearly," Alice replied very politely, "for I can't understand it myself to begin with; and being so many different sizes in a day is very confusing."

"It isn't," said the Caterpillar.

"Well, perhaps you haven't found it so yet," said Alice; "but when you have to turn into a chrysalis—you will some day, you know—and then after that into a butterfly, I should think you'll feel it a little queer, won't you?"

"Not a bit," said the Caterpillar.

"Well, perhaps your feelings may be different," said Alice; "all I know is, it would feel very queer to me."

"You!" said the Caterpillar contemptuously. "Who are you?"

Which brought them back again to the beginning of the conversation. Alice felt a little irritated at the Caterpillar's making such very short remarks, and she drew herself up and said, very gravely, "I think, you ought to tell me who you are, first."

"Why?" said the Caterpillar.

Here was another puzzling question; and as Alice could not think of any good reason, and as the Caterpillar seemed to be in a very unpleasant state of mind, she turned away.

"Come back!" the Caterpillar called after her. "I've something important to say!"

This sounded promising, certainly: Alice turned and came back again.

"Keep your temper," said the Caterpillar.

"Is that all?" said Alice, swallowing down her anger as well as she could.

"No," said the Caterpillar.

Alice thought she might as well wait, as she had nothing else to do, and perhaps after all it might tell her something worth hearing. For some minutes it puffed away without speaking, but at last it unfolded its arms, took the hookah out of its mouth again, and said, "So you think you're changed, do you?"

"I'm afraid I am, sir," said Alice; "I can't remember things as I used—and I don't keep the same size for ten minutes together!"

"Can't remember what things?" said the Caterpillar.

"Well, I've tried to say 'How doth the little busy bee,' but it all came different!" Alice replied in a very melancholy voice.

"Repeat, 'You are old, Father William,'" said the Caterpillar.

Alice folded her hands, and began:—

"You are old, Father William," the young man said,
    "And your hair has become very white;
And yet you incessantly stand on your head—
    Do you think, at your age, it is right?"

"In my youth," Father William replied to his son,
    "I feared it might injure the brain;
But, now that I'm perfectly sure I have none,
    Why, I do it again and again."

"You are old," said the youth, "as I mentioned before,
    And have grown most uncommonly fat;
Yet you turned a back-somersault in at the door—
    Pray, what is the reason of that?"

"In my youth," said the sage, as he shook his grey locks,
    "I kept all my limbs very supple
By the use of this ointment—one shilling the box—
    Allow me to sell you a couple?"

"You are old," said the youth, "and your jaws are too weak
    For anything tougher than suet;
Yet you finished the goose, with the bones and the beak—
    Pray, how did you manage to do it?"

"In my youth," said his father, "I took to the law,
    And argued each case with my wife;
And the muscular strength, which it gave to my jaw,
    Has lasted the rest of my life."

"You are old," said the youth, "one would hardly suppose
    That your eye was as steady as ever;
Yet you balanced an eel on the end of your nose—
    What made you so awfully clever?"

"I have answered three questions, and that is enough,"
    Said his father; "don't give yourself airs!
Do you think I can listen all day to such stuff?
    Be off, or I'll kick you down stairs!"`;

  // Test dictionary lookup
  const [testTerm, setTestTerm] = useState('');
  const [testDefinition, setTestDefinition] = useState<DictionaryEntry | null>(null);
  const [isLoadingDefinition, setIsLoadingDefinition] = useState(false);

  const handleWordSelect = (word: string, element: HTMLElement) => {
    console.log('Word clicked:', word);
    const isGlossaryTerm = element.getAttribute('data-is-glossary-term') === 'true';
    const originalTerm = element.getAttribute('data-original-term');
    
    if (isGlossaryTerm) {
      alert(`✨ Alice in Wonderland Term: "${originalTerm || word}"\n\nThis is one of the ${termCount} technical terms from the Alice glossary!\n\nClick would show the definition for this term.`);
    } else {
      alert(`You clicked on: "${word}"\n\nThis is a regular word. Click would show the definition.`);
    }
  };

  const handleTextSelect = (text: string) => {
    console.log('Text selected:', text);
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await searchGlossaryTerms(searchTerm, 10);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleRefresh = () => {
    clearGlossaryCache();
    window.location.reload();
  };

  const testDictionaryLookup = async () => {
    if (!testTerm.trim()) return;
    
    setIsLoadingDefinition(true);
    try {
      const definition = await getDefinition('alice', testTerm);
      setTestDefinition(definition);
      appLog('AliceGlossaryDemo', `Dictionary lookup result for "${testTerm}"`, 'info', definition);
    } catch (error) {
      appLog('AliceGlossaryDemo', 'Error in dictionary lookup', 'error', error);
      setTestDefinition(null);
    } finally {
      setIsLoadingDefinition(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
        ✨ Alice in Wonderland Glossary Demo
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body1">
          <strong>Enhanced Glossary Highlighting:</strong> This demo showcases the 162 Alice in Wonderland glossary terms 
          fetched directly from Supabase. Alice terms now have <strong>distinct orange underlines</strong> and enhanced hover effects!
        </Typography>
      </Alert>

      {/* Status Information */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📊 Glossary Status
              </Typography>
              {isLoading && (
                <Typography variant="body2" color="text.secondary">
                  Loading glossary terms from Supabase...
                </Typography>
              )}
              {error && (
                <Typography variant="body2" color="error">
                  Error: {error}
                </Typography>
              )}
              {!isLoading && termCount > 0 && (
                <Box>
                  <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
                    ✅ Successfully loaded {termCount} Alice glossary terms
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total variations: {glossaryTerms.size} (including case variations)
                  </Typography>
                </Box>
              )}
              <Button
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                size="small"
                sx={{ mt: 1 }}
              >
                Refresh Cache
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🔍 Search Glossary Terms
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  size="small"
                  placeholder="Search terms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleSearch} disabled={isSearching}>
                          <SearchIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ flexGrow: 1 }}
                />
              </Box>
              {searchResults.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Found {searchResults.length} results:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {searchResults.map((term, index) => (
                      <Chip
                        key={index}
                        label={term.term}
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dictionary Test Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Test Dictionary Lookup</h3>
        <p className="text-gray-600 mb-4">
          Test the dictionary service to see if it fetches Alice-specific definitions from Supabase.
        </p>
        
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={testTerm}
            onChange={(e) => setTestTerm(e.target.value)}
            placeholder="Enter an Alice term (e.g., 'Rabbit-Hole', 'Cheshire Cat')"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={testDictionaryLookup}
            disabled={isLoadingDefinition || !testTerm.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingDefinition ? 'Loading...' : 'Look Up'}
          </button>
        </div>

        {testDefinition && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">Definition for "{testDefinition.term}"</h4>
            <div className="space-y-2">
              <p className="text-gray-700"><strong>Source:</strong> {testDefinition.source}</p>
              <p className="text-gray-700"><strong>Definition:</strong> {testDefinition.definition}</p>
              {testDefinition.examples && testDefinition.examples.length > 0 && (
                <div>
                  <strong className="text-gray-700">Examples:</strong>
                  <ul className="list-disc list-inside ml-4 mt-1">
                    {testDefinition.examples.map((example: string, index: number) => (
                      <li key={index} className="text-gray-600 italic">"{example}"</li>
                    ))}
                  </ul>
                </div>
              )}
              {testDefinition.wordOrigin && (
                <p className="text-gray-700"><strong>Word Origin:</strong> {testDefinition.wordOrigin}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Visual Legend */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
          🎨 Visual Legend
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <span 
                className="glossary-term" 
                style={{ 
                  display: 'inline-block', 
                  padding: '4px 8px',
                  marginRight: '12px',
                  fontSize: '1.1rem'
                }}
              >
                Alice
              </span>
              <Typography variant="body2">
                <strong>Alice Glossary Terms:</strong> Orange underline, enhanced hover effects
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <span 
                className="normal-word" 
                style={{ 
                  display: 'inline-block', 
                  padding: '4px 8px',
                  marginRight: '12px',
                  fontSize: '1.1rem'
                }}
              >
                normal
              </span>
              <Typography variant="body2">
                <strong>Regular Words:</strong> Blue hover effect, standard styling
              </Typography>
            </Box>
          </Grid>
        </Grid>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          💡 <strong>Try it:</strong> Hover over words in the text below to see the difference!
        </Typography>
      </Paper>

      {/* Sample Text */}
      <Paper elevation={2} sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ color: 'primary.main' }}>
          📖 Alice's Adventures in Wonderland - Sample Text
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Enhanced Visual Distinction:</strong> Alice glossary terms now have:
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>✨ <strong>Orange underlines</strong> that are always visible</li>
              <li>🎨 <strong>Enhanced hover effects</strong> with gradients and shadows</li>
              <li>📚 <strong>Special tooltips</strong> identifying Alice-specific terms</li>
              <li>🎯 <strong>Multi-word term support</strong> with bold styling</li>
            </ul>
          </Typography>
        </Alert>
        
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
            technicalWordHoverColor="rgba(255, 152, 0, 0.3)"
          />
        </Box>
      </Paper>

      {/* Footer Info */}
      <Paper elevation={1} sx={{ p: 2, mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          ✨ This demo showcases the enhanced Alice in Wonderland glossary system with {termCount} technical terms 
          fetched directly from Supabase. Each term has been carefully curated to help readers understand 
          the rich vocabulary of Lewis Carroll's masterpiece.
        </Typography>
      </Paper>
    </Container>
  );
};

export default AliceGlossaryDemo; 