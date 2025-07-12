import React, { useState, useEffect } from 'react';
import {
  Drawer, Box, Typography, IconButton, List, ListItem, ListItemText,
  Divider, TextField, InputAdornment, CircularProgress, Button, Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import SortIcon from '@mui/icons-material/Sort';
import { getUserVocabulary } from '../../services/dictionaryService';
import { appLog } from '../common/LogViewer';

interface VocabularyItem {
  word: string;
  definition: string;
  savedAt: string;
  updatedAt?: string;
}

interface VocabularyDrawerProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onWordClick?: (word: string) => void;
}

const VocabularyDrawer: React.FC<VocabularyDrawerProps> = ({
  open,
  onClose,
  userId,
  onWordClick
}) => {
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [filteredVocabulary, setFilteredVocabulary] = useState<VocabularyItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'alphabetical' | 'recent'>('recent');

  // Load vocabulary when drawer opens
  useEffect(() => {
    if (open) {
      loadVocabulary();
    }
  }, [open, userId]);

  // Filter vocabulary when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredVocabulary(vocabulary);
    } else {
      const filtered = vocabulary.filter(item => 
        item.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.definition.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredVocabulary(filtered);
    }
  }, [searchTerm, vocabulary]);

  const loadVocabulary = async () => {
    setLoading(true);
    setError(null);
    
    try {
      appLog('VocabularyDrawer: Loading vocabulary', 'info', { userId });
      const userVocabulary = getUserVocabulary(userId);
      
      if (userVocabulary.length === 0) {
        appLog('VocabularyDrawer: No vocabulary items found', 'info');
      } else {
        appLog('VocabularyDrawer: Loaded vocabulary items', 'info', { count: userVocabulary.length });
      }
      
      setVocabulary(userVocabulary);
      setFilteredVocabulary(userVocabulary);
      sortVocabulary(userVocabulary, sortOrder);
    } catch (error) {
      appLog('VocabularyDrawer: Error loading vocabulary', 'error', error);
      setError('Failed to load your vocabulary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleWordClick = (word: string) => {
    if (onWordClick) {
      onWordClick(word);
    }
    onClose();
  };

  const toggleSortOrder = () => {
    const newSortOrder = sortOrder === 'alphabetical' ? 'recent' : 'alphabetical';
    setSortOrder(newSortOrder);
    sortVocabulary(filteredVocabulary, newSortOrder);
  };

  const sortVocabulary = (items: VocabularyItem[], order: 'alphabetical' | 'recent') => {
    let sorted;
    
    if (order === 'alphabetical') {
      sorted = [...items].sort((a, b) => a.word.localeCompare(b.word));
    } else {
      sorted = [...items].sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.savedAt);
        const dateB = new Date(b.updatedAt || b.savedAt);
        return dateB.getTime() - dateA.getTime();
      });
    }
    
    setFilteredVocabulary(sorted);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': { width: { xs: '100%', sm: 350 } },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">My Vocabulary</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          placeholder="Search vocabulary"
          value={searchTerm}
          onChange={handleSearchChange}
          variant="outlined"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {filteredVocabulary.length} {filteredVocabulary.length === 1 ? 'word' : 'words'}
          </Typography>
          <Button 
            startIcon={<SortIcon />} 
            size="small" 
            onClick={toggleSortOrder}
          >
            Sort: {sortOrder === 'alphabetical' ? 'A-Z' : 'Recent'}
          </Button>
        </Box>
      </Box>
      
      <Divider />
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ p: 2 }}>
          <Alert severity="error">{error}</Alert>
          <Button 
            fullWidth 
            variant="outlined" 
            sx={{ mt: 2 }} 
            onClick={loadVocabulary}
          >
            Try Again
          </Button>
        </Box>
      ) : filteredVocabulary.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          {searchTerm ? (
            <Typography color="text.secondary">No words match your search</Typography>
          ) : (
            <Typography color="text.secondary">
              Your vocabulary is empty. Click on words while reading to add them.
            </Typography>
          )}
        </Box>
      ) : (
        <List sx={{ overflow: 'auto', flexGrow: 1 }}>
          {filteredVocabulary.map((item, index) => (
            <React.Fragment key={`${item.word}-${index}`}>
              <ListItem 
                button 
                onClick={() => handleWordClick(item.word)}
                secondaryAction={
                  <IconButton edge="end" aria-label="delete">
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={item.word}
                  secondary={item.definition}
                  primaryTypographyProps={{ fontWeight: 'bold' }}
                  secondaryTypographyProps={{ 
                    sx: { 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    } 
                  }}
                />
              </ListItem>
              {index < filteredVocabulary.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Drawer>
  );
};

export default VocabularyDrawer;
