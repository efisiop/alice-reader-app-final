import React, { useState, useEffect } from 'react';
import TextHighlighter from '../components/Reader/TextHighlighter';
import {
  Container, Box, Typography, Paper, IconButton,
  Divider, Drawer, List, ListItem, ListItemIcon,
  ListItemText, Slider, Tooltip, Popover, TextField,
  Button, Tabs, Tab
} from '@mui/material';
import TabPanel from '../components/UI/TabPanel';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';

import SettingsIcon from '@mui/icons-material/Settings';
import FormatSizeIcon from '@mui/icons-material/FormatSize';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CloseIcon from '@mui/icons-material/Close';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import QuizIcon from '@mui/icons-material/Quiz';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';

const ReaderInterface: React.FC = () => {
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [darkMode, setDarkMode] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [definition, setDefinition] = useState('');
  const [definitionAnchorEl, setDefinitionAnchorEl] = useState<HTMLSpanElement | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [userQuestion, setUserQuestion] = useState('');
  const [aiPromptOpen, setAiPromptOpen] = useState(false);
  const [pageNumber, setPageNumber] = useState('');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // Sample text from Alice in Wonderland
  const sampleText = `
    Alice was beginning to get very tired of sitting by her sister on the bank,
    and of having nothing to do: once or twice she had peeped into the book her sister
    was reading, but it had no pictures or conversations in it, 'and what is the use of
    a book,' thought Alice 'without pictures or conversations?'

    So she was considering in her own mind (as well as she could, for the hot day made
    her feel very sleepy and stupid), whether the pleasure of making a daisy-chain would
    be worth the trouble of getting up and picking the daisies, when suddenly a White
    Rabbit with pink eyes ran close by her.

    There was nothing so very remarkable in that; nor did Alice think it so very much
    out of the way to hear the Rabbit say to itself, 'Oh dear! Oh dear! I shall be late!'
    (when she thought it over afterwards, it occurred to her that she ought to have
    wondered at this, but at the time it all seemed quite natural); but when the Rabbit
    actually took a watch out of its waistcoat-pocket, and looked at it, and then hurried on,
    Alice started to her feet, for it flashed across her mind that she had never before
    seen a rabbit with either a waistcoat-pocket, or a watch to take out of it, and
    burning with curiosity, she ran across the field after it, and fortunately was just
    in time to see it pop down a large rabbit-hole under the hedge.
  `;

  const toggleSettings = () => {
    setSettingsOpen(!settingsOpen);
  };

  const handleFontSizeChange = (_event: Event, newValue: number | number[]) => {
    setFontSize(newValue as number);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleBookmark = () => {
    setBookmarked(!bookmarked);
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would fetch the content for the given page
    console.log('Navigating to page:', pageNumber);
  };

  // Sample book sections for the demo
  const bookSections = [
    {
      id: 'section1',
      title: 'Down the Rabbit-Hole',
      content: sampleText
    },
    {
      id: 'section2',
      title: 'The Pool of Tears',
      content: 'Another section of the book would go here...'
    },
    {
      id: 'section3',
      title: 'A Caucus-Race and a Long Tale',
      content: 'Yet another section of the book would go here...'
    }
  ];

  const handleTextSelection = (text: string) => {
    setSelectedText(text);
  };

  const handleWordClick = (word: string, element: HTMLSpanElement) => {
    // In a real app, this would fetch definitions from an API or dictionary
    // For now, we'll just show a mock definition
    setDefinition(`Definition for "${word}": ${getMockDefinition(word)}`);
    setDefinitionAnchorEl(element);
  };

  const handlePopoverClose = () => {
    setDefinitionAnchorEl(null);
  };

  const getMockDefinition = (word: string) => {
    // Mock dictionary for Alice in Wonderland terms
    const definitions: Record<string, string> = {
      Alice: 'The curious and imaginative protagonist of the story.',
      Rabbit: 'A character Alice follows down the rabbit hole, always late and in a hurry.',
      sister: 'Alice\'s older sibling who reads a book without pictures or conversations.',
      bank: 'The side of a river or stream.',
      book: 'A written or printed work consisting of pages bound together.',
      pictures: 'Visual representations or illustrations.',
      conversations: 'Spoken exchanges between characters.',
      daisy: 'A small flower with white petals and a yellow center.',
      chain: 'A series of connected elements.',
      White: 'The color of the Rabbit that Alice follows.',
      Rabbit: 'The character that leads Alice to Wonderland.',
      pink: 'A pale red color, the color of the White Rabbit\'s eyes.',
      watch: 'A timepiece worn on the person, carried by the White Rabbit.',
      waistcoat: 'A sleeveless upper-body garment worn by the White Rabbit.',
      pocket: 'A small bag sewn into a garment for carrying small items.',
      field: 'An open area of land, especially one planted with crops or pasture.',
      rabbit: 'A burrowing, plant-eating mammal with long ears and a short tail.',
      hole: 'An opening or hollow place in something solid.',
      hedge: 'A fence or boundary formed by closely growing bushes or shrubs.',
    };

    // Remove punctuation to match dictionary keys
    const cleanWord = word.replace(/[.,!?;:'"]/g, '').toLowerCase();

    return definitions[cleanWord] || definitions[word] || 'No definition available.';
  };

  // Mock function to simulate AI check-in prompts
  const showRandomAiPrompt = () => {
    // In a real app, this would be triggered by backend events or timers
    // For demo purposes, we'll show a prompt after 30 seconds
    setTimeout(() => {
      setAiPromptOpen(true);
    }, 30000);
  };

  // Initialize the AI prompt timer on component mount
  useEffect(() => {
    showRandomAiPrompt();
  }, []);

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Main Content Area */}
      <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
        {/* Page Number Input */}
        {!selectedSection && (
          <Paper component="form" onSubmit={handlePageSubmit} sx={{ p: 3, mb: 3, maxWidth: 500, mx: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Where would you like to start reading?
            </Typography>
            <TextField
              fullWidth
              label="Enter Page Number"
              variant="outlined"
              value={pageNumber}
              onChange={(e) => setPageNumber(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button type="submit" variant="contained" color="primary">
              Go to Page
            </Button>
          </Paper>
        )}

        {/* Section Snippets */}
        {!selectedSection && pageNumber && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Available Sections
            </Typography>
            <List>
              {bookSections.map((section) => (
                <ListItem
                  component="li"
                  button
                  key={section.id}
                  onClick={() => setSelectedSection(section.id)}
                >
                  <ListItemText
                    primary={section.title}
                    secondary={`${section.content.substring(0, 100)}...`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}

        {/* Selected Section Content */}
        {selectedSection && (
          <Paper sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom>
              {bookSections.find(s => s.id === selectedSection)?.title}
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {/* Text with highlighting capability */}
            <TextHighlighter
              text={bookSections.find(s => s.id === selectedSection)?.content || ''}
              onTextSelect={handleTextSelection}
              onWordClick={handleWordClick}
            />

            {/* Definition Popover */}
            <Popover
              open={Boolean(definitionAnchorEl)}
              anchorEl={definitionAnchorEl}
              onClose={handlePopoverClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'center',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'center',
              }}
            >
              <Box sx={{ p: 2, maxWidth: 300 }}>
                <Typography variant="body2">{definition}</Typography>
              </Box>
            </Popover>
          </Paper>
        )}
      </Box>

      {/* AI Assistant Button (Fixed position) */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000,
        }}
      >
        <Tooltip title="Open AI Assistant">
          <Button
            variant="contained"
            color="secondary"
            onClick={toggleDrawer}
            startIcon={<SmartToyIcon />}
            sx={{ borderRadius: 28, py: 1.5 }}
          >
            AI Help
          </Button>
        </Tooltip>
      </Box>

      {/* AI Initiated Prompt (Fixed position) */}
      {aiPromptOpen && (
        <Paper
          elevation={3}
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 20,
            zIndex: 1000,
            p: 2,
            width: 280,
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <SmartToyIcon sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
              <Typography variant="subtitle2">Reading Assistant</Typography>
            </Box>
            <IconButton size="small" onClick={() => setAiPromptOpen(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <Typography variant="body2" sx={{ mb: 2 }}>
            How are you enjoying the story so far?
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
            <IconButton color="primary" onClick={() => setAiPromptOpen(false)}>
              <InsertEmoticonIcon />
            </IconButton>
            <IconButton color="primary" onClick={() => setAiPromptOpen(false)}>
              <InsertEmoticonIcon />
            </IconButton>
            <IconButton color="primary" onClick={() => setAiPromptOpen(false)}>
              <InsertEmoticonIcon />
            </IconButton>
          </Box>
        </Paper>
      )}

      {/* AI Assistant Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={toggleDrawer}
        sx={{
          width: 350,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 350,
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, borderBottom: '1px solid #eee' }}>
          <Typography variant="h6">AI Reading Assistant</Typography>
          <IconButton onClick={toggleDrawer}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
          >
            <Tab icon={<HelpOutlineIcon />} label="Ask" />
            <Tab icon={<QuizIcon />} label="Quiz" />
          </Tabs>
        </Box>

        {/* Ask Tab */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="subtitle2" gutterBottom>
            Selected Text Context
          </Typography>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              mb: 2,
              bgcolor: 'background.default',
              minHeight: 80,
              color: selectedText ? 'text.primary' : 'text.disabled'
            }}
          >
            <Typography variant="body2">
              {selectedText || 'Select text from the story to provide context for your question.'}
            </Typography>
          </Paper>

          <Typography variant="subtitle2" gutterBottom>
            Your Question
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Ask about the story, characters, or themes..."
            value={userQuestion}
            onChange={(e) => setUserQuestion(e.target.value)}
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />

          <Button
            fullWidth
            variant="contained"
            color="primary"
            disabled={!userQuestion.trim()}
          >
            Ask AI Assistant
          </Button>

          <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
            AI Response
          </Typography>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              bgcolor: 'background.default',
              minHeight: 150,
              color: 'text.disabled'
            }}
          >
            <Typography variant="body2">
              AI responses will appear here.
            </Typography>
          </Paper>
        </TabPanel>

        {/* Quiz Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Test your understanding with interactive quizzes about what you've read.
          </Typography>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            disabled={!selectedSection}
          >
            Start Quiz on Current Section
          </Button>
        </TabPanel>
      </Drawer>

      {/* Settings Drawer */}
      <Drawer
        anchor="right"
        open={settingsOpen}
        onClose={toggleSettings}
      >
        <Box sx={{ width: 250, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Reading Settings
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <List>
            <ListItem>
              <ListItemIcon>
                <FormatSizeIcon />
              </ListItemIcon>
              <ListItemText primary="Font Size" />
            </ListItem>
            <ListItem>
              <Slider
                value={fontSize}
                onChange={handleFontSizeChange}
                min={12}
                max={24}
                step={1}
                valueLabelDisplay="auto"
              />
            </ListItem>

            <ListItem component="li" onClick={toggleDarkMode}>
              <ListItemIcon>
                {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
              </ListItemIcon>
              <ListItemText primary={darkMode ? "Light Mode" : "Dark Mode"} />
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </Box>
  );
};

export default ReaderInterface;
