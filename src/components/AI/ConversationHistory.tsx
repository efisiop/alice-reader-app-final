// src/components/AI/ConversationHistory.tsx
import React from 'react';
import { Box, Typography, Paper, Avatar, Divider } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface ConversationHistoryProps {
  messages: Message[];
}

const ConversationHistory: React.FC<ConversationHistoryProps> = ({ messages }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
      {messages.map((message) => (
        <Box
          key={message.id}
          sx={{
            display: 'flex',
            flexDirection: message.sender === 'user' ? 'row-reverse' : 'row',
            alignItems: 'flex-start',
            gap: 1,
          }}
        >
          <Avatar
            sx={{
              bgcolor: message.sender === 'user' ? 'primary.main' : 'secondary.main',
            }}
          >
            {message.sender === 'user' ? <PersonIcon /> : <SmartToyIcon />}
          </Avatar>
          <Paper
            sx={{
              p: 2,
              maxWidth: '80%',
              bgcolor: message.sender === 'user' ? 'primary.light' : 'background.paper',
              borderRadius: 2,
            }}
          >
            <Typography variant="body1">{message.text}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Typography>
          </Paper>
        </Box>
      ))}
    </Box>
  );
};

export default ConversationHistory;
