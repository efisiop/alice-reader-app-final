// src/components/AI/ReflectionPrompts.tsx
import React, { useState } from 'react';
import {
  Box, Typography, TextField, Button, Paper,
  List, ListItem, ListItemText, Divider, IconButton
} from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import SaveIcon from '@mui/icons-material/Save';

interface ReflectionPromptsProps {
  sectionId: string;
  onSaveReflection: (prompt: string, response: string) => void;
}

const ReflectionPrompts: React.FC<ReflectionPromptsProps> = ({
  sectionId,
  onSaveReflection
}) => {
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [reflection, setReflection] = useState('');
  const [savedReflections, setSavedReflections] = useState<Array<{prompt: string, response: string}>>([]);

  // Mock prompts - in a real app, these would come from the backend
  const prompts = [
    "How would you feel if you suddenly found yourself in Wonderland?",
    "Which character do you relate to most and why?",
    "What does this story teach us about growing up?",
    "If you could give Alice advice, what would you tell her?",
    "How does the concept of 'nonsense' in the story relate to real life?"
  ];

  const handlePromptSelect = (prompt: string) => {
    setSelectedPrompt(prompt);
  };

  const handleReflectionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReflection(e.target.value);
  };

  const handleSaveReflection = () => {
    if (selectedPrompt && reflection) {
      onSaveReflection(selectedPrompt, reflection);
      
      // Add to local state
      setSavedReflections([
        ...savedReflections,
        { prompt: selectedPrompt, response: reflection }
      ]);
      
      // Reset form
      setSelectedPrompt(null);
      setReflection('');
    }
  };

  return (
    <Box>
      {!selectedPrompt ? (
        <>
          <Typography variant="h6" gutterBottom>
            Reflection Prompts
          </Typography>
          <List>
            {prompts.map((prompt, index) => (
              <ListItem 
                key={index} 
                button 
                onClick={() => handlePromptSelect(prompt)}
                sx={{ 
                  borderLeft: '3px solid transparent',
                  '&:hover': {
                    borderLeft: '3px solid',
                    borderLeftColor: 'primary.main',
                    bgcolor: 'action.hover'
                  }
                }}
              >
                <ListItemText
                  primary={prompt}
                  secondary="Click to reflect"
                />
              </ListItem>
            ))}
          </List>
        </>
      ) : (
        <Box>
          <Typography variant="h6" gutterBottom>
            Your Reflection
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
            <Typography variant="body1" fontWeight="medium">
              {selectedPrompt}
            </Typography>
          </Paper>
          
          <TextField
            fullWidth
            multiline
            rows={6}
            label="Your thoughts"
            value={reflection}
            onChange={handleReflectionChange}
            sx={{ mb: 2 }}
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button 
              variant="outlined" 
              onClick={() => setSelectedPrompt(null)}
            >
              Back to Prompts
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveReflection}
              disabled={!reflection}
            >
              Save Reflection
            </Button>
          </Box>
        </Box>
      )}

      {savedReflections.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>
            Your Saved Reflections
          </Typography>
          
          {savedReflections.map((item, index) => (
            <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                {item.prompt}
              </Typography>
              <Typography variant="body2">
                {item.response}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <IconButton size="small" title="Share reflection">
                  <ShareIcon fontSize="small" />
                </IconButton>
              </Box>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ReflectionPrompts;
