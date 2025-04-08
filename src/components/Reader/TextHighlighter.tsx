// src/components/Reader/TextHighlighter.tsx
import React, { useState } from 'react';
import { Typography, Box } from '@mui/material';

interface TextHighlighterProps {
  text: string;
  onTextSelect: (selectedText: string) => void;
  onWordClick?: (word: string, element: HTMLSpanElement) => void;
}

const TextHighlighter: React.FC<TextHighlighterProps> = ({
  text,
  onTextSelect,
  onWordClick
}) => {
  const [selectedText, setSelectedText] = useState('');

  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      const newSelectedText = selection.toString();
      setSelectedText(newSelectedText);
      onTextSelect(newSelectedText);
    }
  };

  const handleWordClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    if (onWordClick) {
      const word = e.currentTarget.textContent || '';
      onWordClick(word, e.currentTarget);
    }
  };

  // Split text into words to make them individually clickable
  const words = text.split(/(\s+)/).filter(Boolean);

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
      {words.map((word, index) => (
        <Box
          component="span"
          key={index}
          className={/\S/.test(word) ? 'word' : ''}
          onClick={/\S/.test(word) ? handleWordClick : undefined}
          sx={{
            display: 'inline',
            backgroundColor: selectedText.includes(word) ? 'rgba(255, 107, 139, 0.2)' : 'transparent',
            transition: 'background-color 0.2s ease',
            padding: '0 2px',
            borderRadius: '2px',
          }}
        >
          {word}
        </Box>
      ))}
    </Box>
  );
};

export default TextHighlighter;
