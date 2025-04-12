// src/components/Reader/EnhancedTextHighlighter.tsx
import React, { useState, useEffect } from 'react';
import { Box, Menu, MenuItem, ListItemIcon, Typography } from '@mui/material';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import DeleteIcon from '@mui/icons-material/Delete';

export interface Highlight {
  id: string;
  text: string;
  color: string;
  note?: string;
  startIndex: number;
  endIndex: number;
}

interface EnhancedTextHighlighterProps {
  text: string;
  onTextSelect: (selectedText: string) => void;
  onWordClick?: (word: string, element: HTMLSpanElement) => void;
  highlights?: Highlight[];
  onHighlightCreate?: (highlight: Highlight) => void;
  onHighlightUpdate?: (highlight: Highlight) => void;
  onHighlightDelete?: (highlightId: string) => void;
}

const EnhancedTextHighlighter: React.FC<EnhancedTextHighlighterProps> = ({
  text,
  onTextSelect,
  onWordClick,
  highlights = [],
  onHighlightCreate,
  onHighlightUpdate,
  onHighlightDelete
}) => {
  const [selectedText, setSelectedText] = useState('');
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    text: string;
  } | null>(null);
  
  // Split text into words to make them individually clickable
  const words = text.split(/(\s+)/).filter(Boolean);

  const handleMouseUp = (e: React.MouseEvent) => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      const newSelectedText = selection.toString();
      setSelectedText(newSelectedText);
      onTextSelect(newSelectedText);
      
      // Show context menu for highlighting
      setContextMenu({
        mouseX: e.clientX,
        mouseY: e.clientY,
        text: newSelectedText
      });
    }
  };

  const handleWordClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    if (onWordClick) {
      const word = e.currentTarget.textContent || '';
      onWordClick(word, e.currentTarget);
    }
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  const createHighlight = (color: string) => {
    if (contextMenu && onHighlightCreate) {
      const newHighlight: Highlight = {
        id: `highlight-${Date.now()}`,
        text: contextMenu.text,
        color: color,
        startIndex: text.indexOf(contextMenu.text),
        endIndex: text.indexOf(contextMenu.text) + contextMenu.text.length
      };
      onHighlightCreate(newHighlight);
    }
    handleContextMenuClose();
  };

  // Check if a word is part of a highlight
  const getHighlightForWord = (word: string, index: number) => {
    const position = words.slice(0, index).join('').length;
    
    return highlights.find(highlight => 
      position >= highlight.startIndex && 
      position < highlight.endIndex
    );
  };

  return (
    <Box
      component="div"
      onMouseUp={handleMouseUp}
      sx={{
        fontSize: '1.1rem',
        lineHeight: 1.7,
        '& .word:hover': {
          backgroundColor: 'rgba(106, 81, 174, 0.1)',
          cursor: 'pointer',
        }
      }}
    >
      {words.map((word, index) => {
        const highlight = getHighlightForWord(word, index);
        
        return (
          <Box
            component="span"
            key={index}
            className={/\S/.test(word) ? 'word' : ''}
            onClick={/\S/.test(word) ? handleWordClick : undefined}
            sx={{
              display: 'inline',
              backgroundColor: highlight 
                ? highlight.color 
                : selectedText.includes(word) 
                  ? 'rgba(255, 107, 139, 0.2)' 
                  : 'transparent',
              transition: 'background-color 0.2s ease',
              padding: '0 2px',
              borderRadius: '2px',
            }}
            data-highlight-id={highlight?.id}
          >
            {word}
          </Box>
        );
      })}

      {/* Context Menu for Highlighting */}
      <Menu
        open={contextMenu !== null}
        onClose={handleContextMenuClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <Typography variant="subtitle2" sx={{ px: 2, py: 1 }}>
          Highlight Options
        </Typography>
        <MenuItem onClick={() => createHighlight('rgba(255, 255, 0, 0.3)')}>
          <ListItemIcon>
            <ColorLensIcon sx={{ color: 'yellow' }} />
          </ListItemIcon>
          Yellow
        </MenuItem>
        <MenuItem onClick={() => createHighlight('rgba(0, 255, 0, 0.3)')}>
          <ListItemIcon>
            <ColorLensIcon sx={{ color: 'green' }} />
          </ListItemIcon>
          Green
        </MenuItem>
        <MenuItem onClick={() => createHighlight('rgba(0, 255, 255, 0.3)')}>
          <ListItemIcon>
            <ColorLensIcon sx={{ color: 'cyan' }} />
          </ListItemIcon>
          Blue
        </MenuItem>
        <MenuItem onClick={() => createHighlight('rgba(255, 0, 255, 0.3)')}>
          <ListItemIcon>
            <ColorLensIcon sx={{ color: 'magenta' }} />
          </ListItemIcon>
          Pink
        </MenuItem>
        <MenuItem onClick={handleContextMenuClose}>
          <ListItemIcon>
            <DeleteIcon />
          </ListItemIcon>
          Cancel
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default EnhancedTextHighlighter;
