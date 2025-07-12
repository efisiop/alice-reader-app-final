// src/components/Reader/TextHighlighter.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { appLog } from '../LogViewer';

interface TextHighlighterProps {
  text: string;
  onWordSelect: (word: string, element: HTMLElement, context?: string) => void;
  onTextSelect?: (text: string) => void;
  fontSize?: string | number;
  lineHeight?: string | number;
  fontFamily?: string;
  color?: string;
  paragraphSpacing?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Component for highlighting and selecting text with word-level interaction
 */
const TextHighlighter: React.FC<TextHighlighterProps> = ({
  text,
  onWordSelect,
  onTextSelect,
  fontSize = '1rem',
  lineHeight = 1.6,
  fontFamily = 'Georgia, serif',
  color = 'inherit',
  paragraphSpacing = '1.2em',
  className,
  style
}) => {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);

  // Process text into paragraphs
  const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0);

  /**
   * Extract surrounding context for a word
   * @param word The selected word
   * @param paragraphIndex Index of the paragraph containing the word
   * @param wordIndex Index of the word within the paragraph
   * @returns Context string
   */
  const getWordContext = (word: string, paragraphIndex: number, wordIndex: number): string => {
    try {
      const paragraph = paragraphs[paragraphIndex];
      if (!paragraph) return '';

      // Split paragraph into words to find the word position
      const wordPattern = /([\w'']+|[.,!?;:()\[\]{}""''\\\/-—–]|\s+)/g;
      const tokens = paragraph.match(wordPattern) || [];
      
      // Find the actual word position (skip punctuation and whitespace)
      let actualWordIndex = 0;
      let currentWordIndex = 0;
      
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const isWhitespace = /^\s+$/.test(token);
        const isPunctuation = /^[.,!?;:()\[\]{}""''\\\/-—–]$/.test(token);
        
        if (!isWhitespace && !isPunctuation) {
          if (currentWordIndex === wordIndex) {
            actualWordIndex = i;
            break;
          }
          currentWordIndex++;
        }
      }

      // Extract context: 3 words before and 3 words after
      const contextStart = Math.max(0, actualWordIndex - 3);
      const contextEnd = Math.min(tokens.length, actualWordIndex + 4);
      const contextTokens = tokens.slice(contextStart, contextEnd);
      
      // Clean up the context
      const context = contextTokens
        .map(token => token.trim())
        .filter(token => token.length > 0)
        .join(' ');
      
      return context;
    } catch (error) {
      appLog('TextHighlighter', 'Error extracting word context', 'error', error);
      return '';
    }
  };

  // Handle word click
  const handleWordClick = useCallback((event: React.MouseEvent<HTMLSpanElement>) => {
    const target = event.currentTarget;
    const word = target.textContent || '';

    // Don't process empty or whitespace-only words
    if (!word.trim()) return;

    appLog('TextHighlighter', 'Word clicked', 'debug', { word });

    // Update selected word and element
    setSelectedWord(word);
    setSelectedElement(target);

    // Extract context
    const context = getWordContext(word, 0, 0); // We'll improve this later

    // Call the callback with context
    onWordSelect(word, target, context);
  }, [onWordSelect]);

  // Handle text selection
  const handleTextSelection = useCallback(() => {
    if (!onTextSelect || !window.getSelection) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const selectedText = selection.toString().trim();
    if (selectedText.length > 0) {
      appLog('TextHighlighter', 'Text selected', 'debug', { selectedText });
      onTextSelect(selectedText);
    }
  }, [onTextSelect]);

  // Add selection event listener
  useEffect(() => {
    if (!onTextSelect || !containerRef.current) return;

    const container = containerRef.current;
    container.addEventListener('mouseup', handleTextSelection);

    return () => {
      container.removeEventListener('mouseup', handleTextSelection);
    };
  }, [onTextSelect, handleTextSelection]);

  // Process a paragraph into word spans
  const renderParagraph = (paragraph: string, index: number) => {
    // Split paragraph into words, preserving punctuation and spaces
    const wordPattern = /([\w'']+|[.,!?;:()\[\]{}""''\\\/-—–]|\s+)/g;
    const tokens = paragraph.match(wordPattern) || [];

    return (
      <Typography
        component="p"
        key={`p-${index}`}
        sx={{
          fontSize,
          lineHeight,
          fontFamily,
          color,
          marginBottom: paragraphSpacing,
          textAlign: 'justify',
          hyphens: 'auto'
        }}
      >
        {tokens.map((token, i) => {
          // Skip rendering empty tokens
          if (!token) return null;

          // Check if token is whitespace
          const isWhitespace = /^\s+$/.test(token);

          // Check if token is punctuation
          const isPunctuation = /^[.,!?;:()\[\]{}""''\\\/-—–]$/.test(token);

          // If it's whitespace, render a space
          if (isWhitespace) {
            return <span key={`${index}-${i}`}>{token}</span>;
          }

          // If it's punctuation, render without click handler
          if (isPunctuation) {
            return <span key={`${index}-${i}`}>{token}</span>;
          }

          // Otherwise, render as clickable word
          return (
            <span
              key={`${index}-${i}`}
              onClick={handleWordClick}
              style={{
                cursor: 'pointer',
                borderRadius: '2px',
                padding: '0 1px',
                transition: 'background-color 0.2s',
                display: 'inline-block',
                position: 'relative'
              }}
              className="highlightable-word"
              data-paragraph-index={index}
              data-word-index={i}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.palette.action.hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {token}
            </span>
          );
        })}
      </Typography>
    );
  };

  return (
    <Box
      ref={containerRef}
      className={`text-highlighter ${className || ''}`}
      sx={{
        position: 'relative',
        userSelect: onTextSelect ? 'text' : 'none',
        ...style
      }}
    >
      {paragraphs.map(renderParagraph)}
    </Box>
  );
};

export default TextHighlighter;
