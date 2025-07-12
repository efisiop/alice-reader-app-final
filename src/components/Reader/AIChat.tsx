// src/components/Reader/AIChat.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Divider,
  CircularProgress,
  Avatar,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  useTheme
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import QuizIcon from '@mui/icons-material/Quiz';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ExplainIcon from '@mui/icons-material/Psychology';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import ReactMarkdown from 'react-markdown';
import { AIConversation, AIMessage, AIMode, createConversation, sendMessageToAI } from '../../services/aiService';
import { appLog } from '../LogViewer';
import { BookId, SectionId, UserId } from '../../types/idTypes';

interface AIChatProps {
  bookId?: string | BookId;
  sectionId?: string | SectionId;
  userId?: string | UserId;
  selectedText?: string;
  initialMode?: AIMode;
  onClose?: () => void;
  fullScreen?: boolean;
}

/**
 * AI Chat component for interacting with the AI assistant
 */
const AIChat: React.FC<AIChatProps> = ({
  bookId,
  sectionId,
  userId,
  selectedText = '',
  initialMode = 'chat',
  onClose,
  fullScreen = false
}) => {
  const theme = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [conversation, setConversation] = useState<AIConversation | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [messageMenuAnchorEl, setMessageMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMessage, setSelectedMessage] = useState<AIMessage | null>(null);
  const [mode, setMode] = useState<AIMode>(initialMode);
  
  // Initialize conversation
  useEffect(() => {
    const initialPrompt = getInitialPrompt();
    
    const newConversation = createConversation({
      initialMessage: initialPrompt,
      context: selectedText,
      bookId,
      sectionId,
      userId,
      mode
    });
    
    setConversation(newConversation);
    
    // If we have an initial prompt, send it to the AI
    if (initialPrompt) {
      handleSendMessage(initialPrompt, newConversation);
    }
  }, []);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);
  
  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  // Get initial prompt based on mode and selected text
  const getInitialPrompt = (): string => {
    if (!selectedText) return '';
    
    switch (mode) {
      case 'explain':
        return `Please explain this text: "${selectedText}"`;
      case 'quiz':
        return `Generate quiz questions about this text: "${selectedText}"`;
      case 'simplify':
        return `Please simplify this text: "${selectedText}"`;
      case 'chat':
      default:
        return '';
    }
  };
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };
  
  // Handle send message
  const handleSendMessage = async (message: string = input, conv: AIConversation | null = conversation) => {
    if (!message.trim() || !conv) return;
    
    setLoading(true);
    setInput('');
    
    try {
      const updatedConversation = await sendMessageToAI(conv, message);
      setConversation(updatedConversation);
    } catch (error) {
      appLog('AIChat', 'Error sending message', 'error', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Handle mode change
  const handleModeChange = (newMode: AIMode) => {
    setMode(newMode);
    setMenuAnchorEl(null);
    
    // Create a new conversation with the new mode
    const initialPrompt = selectedText ? getInitialPrompt() : '';
    
    const newConversation = createConversation({
      initialMessage: initialPrompt,
      context: selectedText,
      bookId,
      sectionId,
      userId,
      mode: newMode
    });
    
    setConversation(newConversation);
    
    // If we have an initial prompt, send it to the AI
    if (initialPrompt) {
      handleSendMessage(initialPrompt, newConversation);
    }
  };
  
  // Handle menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };
  
  // Handle menu close
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  // Handle message menu open
  const handleMessageMenuOpen = (event: React.MouseEvent<HTMLElement>, message: AIMessage) => {
    event.stopPropagation();
    setSelectedMessage(message);
    setMessageMenuAnchorEl(event.currentTarget);
  };
  
  // Handle message menu close
  const handleMessageMenuClose = () => {
    setMessageMenuAnchorEl(null);
    setSelectedMessage(null);
  };
  
  // Handle copy message
  const handleCopyMessage = () => {
    if (!selectedMessage) return;
    
    navigator.clipboard.writeText(selectedMessage.content)
      .then(() => {
        appLog('AIChat', 'Message copied to clipboard', 'success');
      })
      .catch((error) => {
        appLog('AIChat', 'Error copying message', 'error', error);
      });
    
    handleMessageMenuClose();
  };
  
  // Handle clear conversation
  const handleClearConversation = () => {
    const newConversation = createConversation({
      context: selectedText,
      bookId,
      sectionId,
      userId,
      mode
    });
    
    setConversation(newConversation);
    handleMenuClose();
  };
  
  // Get mode icon
  const getModeIcon = (chatMode: AIMode) => {
    switch (chatMode) {
      case 'explain':
        return <ExplainIcon />;
      case 'quiz':
        return <QuizIcon />;
      case 'simplify':
        return <AutoFixHighIcon />;
      case 'chat':
      default:
        return <ChatIcon />;
    }
  };
  
  // Get mode label
  const getModeLabel = (chatMode: AIMode) => {
    switch (chatMode) {
      case 'explain':
        return 'Explain';
      case 'quiz':
        return 'Quiz';
      case 'simplify':
        return 'Simplify';
      case 'chat':
      default:
        return 'Chat';
    }
  };
  
  // Render message
  const renderMessage = (message: AIMessage, index: number) => {
    if (message.role === 'system') return null;
    
    const isUser = message.role === 'user';
    
    return (
      <Box
        key={index}
        sx={{
          display: 'flex',
          flexDirection: isUser ? 'row-reverse' : 'row',
          mb: 2
        }}
      >
        <Avatar
          sx={{
            bgcolor: isUser ? 'primary.main' : 'secondary.main',
            width: 36,
            height: 36,
            mr: isUser ? 0 : 1,
            ml: isUser ? 1 : 0
          }}
        >
          {isUser ? <PersonIcon /> : <SmartToyIcon />}
        </Avatar>
        
        <Paper
          elevation={1}
          sx={{
            p: 2,
            maxWidth: '75%',
            borderRadius: 2,
            bgcolor: isUser ? 'primary.light' : 'background.paper',
            position: 'relative'
          }}
        >
          {!isUser && (
            <IconButton
              size="small"
              onClick={(e) => handleMessageMenuOpen(e, message)}
              sx={{
                position: 'absolute',
                top: 4,
                right: 4,
                opacity: 0.6,
                '&:hover': {
                  opacity: 1
                }
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          )}
          
          <Typography
            variant="body1"
            component="div"
            sx={{
              color: isUser ? 'primary.contrastText' : 'text.primary',
              whiteSpace: 'pre-wrap'
            }}
          >
            {isUser ? (
              message.content
            ) : (
              <ReactMarkdown>{message.content}</ReactMarkdown>
            )}
          </Typography>
          
          {message.timestamp && (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mt: 1,
                textAlign: isUser ? 'left' : 'right',
                color: isUser ? 'primary.contrastText' : 'text.secondary',
                opacity: 0.8
              }}
            >
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Typography>
          )}
        </Paper>
      </Box>
    );
  };
  
  return (
    <Paper
      elevation={3}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: fullScreen ? '100%' : 500,
        width: fullScreen ? '100%' : 400,
        overflow: 'hidden',
        borderRadius: fullScreen ? 0 : 2
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <SmartToyIcon sx={{ mr: 1 }} />
          <Typography variant="h6">AI Assistant</Typography>
          
          <Chip
            icon={getModeIcon(mode)}
            label={getModeLabel(mode)}
            size="small"
            color="secondary"
            sx={{ ml: 1 }}
            onClick={handleMenuOpen}
          />
        </Box>
        
        <Box>
          <IconButton
            color="inherit"
            onClick={handleMenuOpen}
            size="small"
          >
            <MoreVertIcon />
          </IconButton>
          
          {onClose && (
            <IconButton
              color="inherit"
              onClick={onClose}
              size="small"
              sx={{ ml: 1 }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </Box>
      
      {/* Messages */}
      <Box
        sx={{
          flexGrow: 1,
          p: 2,
          overflowY: 'auto',
          bgcolor: 'background.default'
        }}
      >
        {conversation?.messages.map(renderMessage)}
        
        {loading && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mt: 2
            }}
          >
            <CircularProgress size={24} />
          </Box>
        )}
        
        <div ref={messagesEndRef} />
      </Box>
      
      {/* Input */}
      <Box
        sx={{
          p: 2,
          borderTop: `1px solid ${theme.palette.divider}`
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type your message..."
          value={input}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          inputRef={inputRef}
          disabled={loading}
          InputProps={{
            endAdornment: (
              <IconButton
                color="primary"
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || loading}
              >
                <SendIcon />
              </IconButton>
            )
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 4
            }
          }}
        />
      </Box>
      
      {/* Mode menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleModeChange('chat')}>
          <ListItemIcon>
            <ChatIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Chat" />
        </MenuItem>
        <MenuItem onClick={() => handleModeChange('explain')}>
          <ListItemIcon>
            <ExplainIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Explain" />
        </MenuItem>
        <MenuItem onClick={() => handleModeChange('quiz')}>
          <ListItemIcon>
            <QuizIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Quiz" />
        </MenuItem>
        <MenuItem onClick={() => handleModeChange('simplify')}>
          <ListItemIcon>
            <AutoFixHighIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Simplify" />
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleClearConversation}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Clear conversation" />
        </MenuItem>
      </Menu>
      
      {/* Message menu */}
      <Menu
        anchorEl={messageMenuAnchorEl}
        open={Boolean(messageMenuAnchorEl)}
        onClose={handleMessageMenuClose}
      >
        <MenuItem onClick={handleCopyMessage}>
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Copy" />
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default AIChat;
