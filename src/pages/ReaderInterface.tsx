import React, { useState } from 'react';
import TextHighlighter from '../components/Reader/TextHighlighter';
import {
  Container, Box, Typography, Paper, IconButton,
  Divider, Drawer, List, ListItem, ListItemIcon,
  ListItemText, Slider, Tooltip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';

import SettingsIcon from '@mui/icons-material/Settings';
import FormatSizeIcon from '@mui/icons-material/FormatSize';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

const ReaderInterface: React.FC = () => {
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [darkMode, setDarkMode] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [selectedText, setSelectedText] = useState('');

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

  return (
    <Box sx={{
      display: 'flex',
      minHeight: '100vh',
      bgcolor: darkMode ? '#121212' : '#f5f5f5',
      color: darkMode ? '#fff' : '#000'
    }}>
      {/* Top Navigation */}
      <Box sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        p: 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        bgcolor: darkMode ? '#1e1e1e' : '#fff',
        borderBottom: 1,
        borderColor: 'divider',
        zIndex: 1100
      }}>
        <IconButton onClick={() => navigate('/reader')} color="primary">
          <ArrowBackIcon />
        </IconButton>

        <Typography variant="h6" component="div">
          Alice in Wonderland
        </Typography>

        <Box>
          <Tooltip title={bookmarked ? "Remove Bookmark" : "Add Bookmark"}>
            <IconButton onClick={toggleBookmark} color="primary">
              {bookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Settings">
            <IconButton onClick={toggleSettings} color="primary">
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Main Content */}
      <Container maxWidth="md" sx={{ mt: 8, mb: 4, pt: 2 }}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            minHeight: '80vh',
            bgcolor: darkMode ? '#1e1e1e' : '#fff',
            color: darkMode ? '#e0e0e0' : 'text.primary'
          }}
        >
          <Box sx={{ fontSize: `${fontSize}px` }}>
            <TextHighlighter
              text={sampleText}
              onTextSelect={(text) => setSelectedText(text)}
              onWordClick={(word) => console.log('Clicked word:', word)}
            />
          </Box>
        </Paper>
      </Container>

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
