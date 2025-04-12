// src/components/Reader/VocabularyList.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  TextField,
  InputAdornment,
  Paper,
  Chip,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import { getUserVocabulary, removeFromVocabulary } from '../../services/dictionaryService';
import { appLog } from '../LogViewer';
import { UserId } from '../../types/idTypes';

interface VocabularyListProps {
  userId: string | UserId;
  onWordClick?: (word: string) => void;
}

/**
 * Component for displaying and managing user vocabulary
 */
const VocabularyList: React.FC<VocabularyListProps> = ({ userId, onWordClick }) => {
  const [vocabulary, setVocabulary] = useState<any[]>([]);
  const [filteredVocabulary, setFilteredVocabulary] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'date'>('date');
  
  // Load vocabulary
  useEffect(() => {
    const loadVocabulary = () => {
      try {
        setLoading(true);
        const userVocabulary = getUserVocabulary(userId);
        setVocabulary(userVocabulary);
        setFilteredVocabulary(userVocabulary);
        appLog('VocabularyList', 'Vocabulary loaded', 'info', { count: userVocabulary.length });
      } catch (error) {
        appLog('VocabularyList', 'Error loading vocabulary', 'error', error);
        setError('Failed to load vocabulary. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadVocabulary();
  }, [userId]);
  
  // Filter vocabulary when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredVocabulary(vocabulary);
      return;
    }
    
    const filtered = vocabulary.filter(item => 
      item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.definition.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredVocabulary(filtered);
  }, [searchTerm, vocabulary]);
  
  // Sort vocabulary
  useEffect(() => {
    const sorted = [...filteredVocabulary];
    
    switch (sortOrder) {
      case 'asc':
        sorted.sort((a, b) => a.term.localeCompare(b.term));
        break;
      case 'desc':
        sorted.sort((a, b) => b.term.localeCompare(a.term));
        break;
      case 'date':
        sorted.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
        break;
    }
    
    setFilteredVocabulary(sorted);
  }, [sortOrder, vocabulary]);
  
  // Handle search term change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  
  // Handle sort order change
  const handleSortChange = () => {
    if (sortOrder === 'asc') {
      setSortOrder('desc');
    } else if (sortOrder === 'desc') {
      setSortOrder('date');
    } else {
      setSortOrder('asc');
    }
  };
  
  // Handle word removal
  const handleRemoveWord = (term: string) => {
    try {
      const success = removeFromVocabulary(userId, term);
      
      if (success) {
        // Update local state
        const updatedVocabulary = vocabulary.filter(item => item.term !== term);
        setVocabulary(updatedVocabulary);
        appLog('VocabularyList', 'Word removed from vocabulary', 'success', { term });
      } else {
        appLog('VocabularyList', 'Failed to remove word from vocabulary', 'warning', { term });
      }
    } catch (error) {
      appLog('VocabularyList', 'Error removing word from vocabulary', 'error', error);
    }
  };
  
  // Handle word click
  const handleWordClick = (term: string) => {
    if (onWordClick) {
      onWordClick(term);
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (error) {
      return 'Unknown date';
    }
  };
  
  // Get sort order label
  const getSortOrderLabel = () => {
    switch (sortOrder) {
      case 'asc':
        return 'A-Z';
      case 'desc':
        return 'Z-A';
      case 'date':
        return 'Newest';
      default:
        return 'Sort';
    }
  };
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        My Vocabulary
      </Typography>
      
      {/* Search and sort */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <TextField
          placeholder="Search vocabulary"
          variant="outlined"
          size="small"
          fullWidth
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mr: 1 }}
        />
        
        <Button
          variant="outlined"
          size="small"
          startIcon={<SortIcon />}
          onClick={handleSortChange}
        >
          {getSortOrderLabel()}
        </Button>
      </Box>
      
      {/* Vocabulary list */}
      <Paper variant="outlined" sx={{ maxHeight: 400, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        ) : filteredVocabulary.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {searchTerm ? 'No matching words found.' : 'Your vocabulary list is empty.'}
            </Typography>
            {searchTerm && (
              <Button
                size="small"
                onClick={() => setSearchTerm('')}
                sx={{ mt: 1 }}
              >
                Clear search
              </Button>
            )}
          </Box>
        ) : (
          <List disablePadding>
            {filteredVocabulary.map((item, index) => (
              <React.Fragment key={item.term}>
                {index > 0 && <Divider component="li" />}
                <ListItem
                  button={!!onWordClick}
                  onClick={() => handleWordClick(item.term)}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="subtitle1" component="span">
                          {item.term}
                        </Typography>
                        <Chip
                          label={formatDate(item.savedAt)}
                          size="small"
                          variant="outlined"
                          sx={{ ml: 1, fontSize: '0.7rem' }}
                        />
                      </Box>
                    }
                    secondary={item.definition}
                    secondaryTypographyProps={{
                      noWrap: true,
                      sx: { maxWidth: '90%' }
                    }}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => handleRemoveWord(item.term)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
      
      {/* Stats */}
      {!loading && !error && (
        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" color="text.secondary">
            {filteredVocabulary.length} {filteredVocabulary.length === 1 ? 'word' : 'words'} 
            {searchTerm && vocabulary.length !== filteredVocabulary.length && 
              ` (filtered from ${vocabulary.length})`}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default VocabularyList;
