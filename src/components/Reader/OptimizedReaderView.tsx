// src/components/reader/OptimizedReaderView.tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Box, Typography, Paper, Divider, IconButton, Tooltip } from '@mui/material';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import SettingsIcon from '@mui/icons-material/Settings';
import { useBookService, useAuthService, useAnalyticsService } from '../../hooks/useService';
import { usePerformance } from '../../hooks/usePerformance';
import { useAccessibility } from '../common/AccessibilityMenu';
import LoadingSkeleton from '../common/LoadingSkeleton';
import AccessibilityMenu from '../common/AccessibilityMenu';

interface OptimizedReaderViewProps {
  bookId: string;
  chapterId?: string;
}

const OptimizedReaderView: React.FC<OptimizedReaderViewProps> = ({ bookId, chapterId }) => {
  // Track component performance
  const performance = usePerformance({
    trackPageLoad: true,
    trackRender: true,
    componentName: 'OptimizedReaderView'
  });
  
  // Services
  const { service: bookService, loading: bookServiceLoading } = useBookService();
  const { service: authService, loading: authServiceLoading } = useAuthService();
  const { service: analyticsService } = useAnalyticsService();
  
  // Accessibility settings
  const { settings: accessibilitySettings } = useAccessibility();
  
  // State
  const [bookContent, setBookContent] = useState<any>(null);
  const [currentChapter, setCurrentChapter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Refs for performance tracking
  const contentRef = useRef<HTMLDivElement>(null);
  const lastInteractionTime = useRef<number>(0);
  
  // Memoized chapter selection
  const selectedChapter = useMemo(() => {
    if (!bookContent || !bookContent.chapters) return null;
    
    if (chapterId) {
      return bookContent.chapters.find((ch: any) => ch.id === chapterId) || bookContent.chapters[0];
    }
    
    return bookContent.chapters[0];
  }, [bookContent, chapterId]);
  
  // Fetch book data with performance tracking
  useEffect(() => {
    if (!bookService || !authService) return;
    
    const fetchBookData = async () => {
      setLoading(true);
      try {
        const startTime = performance.now();
        const data = await bookService.getBook(bookId);
        performance.trackApiCall('getBook', startTime);
        
        setBookContent(data);
        
        // Track page view
        if (analyticsService) {
          analyticsService.trackPageView('reader', { bookId });
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load book'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookData();
  }, [bookService, authService, bookId, performance, analyticsService]);
  
  // Update current chapter when selected chapter changes
  useEffect(() => {
    if (selectedChapter) {
      setCurrentChapter(selectedChapter);
      
      // Track chapter view
      if (analyticsService) {
        analyticsService.trackEvent('view_chapter', { 
          bookId, 
          chapterId: selectedChapter.id,
          chapterTitle: selectedChapter.title
        });
      }
    }
  }, [selectedChapter, bookId, analyticsService]);
  
  // Intersection Observer for reading progress tracking
  useEffect(() => {
    if (!contentRef.current || !bookService || !bookId || !currentChapter) return;
    
    const paragraphs = contentRef.current.querySelectorAll('p');
    if (paragraphs.length === 0) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const paragraph = entry.target as HTMLParagraphElement;
            const paragraphIndex = Array.from(paragraphs).indexOf(paragraph);
            
            // Update reading progress every 5 paragraphs to avoid too many updates
            if (paragraphIndex % 5 === 0 && bookService) {
              bookService.updateReadingProgress(bookId, currentChapter.id, paragraphIndex);
              
              // Track reading progress
              if (analyticsService) {
                analyticsService.trackEvent('reading_progress', {
                  bookId,
                  chapterId: currentChapter.id,
                  position: paragraphIndex,
                  totalParagraphs: paragraphs.length
                });
              }
            }
          }
        });
      },
      { threshold: 0.5 }
    );
    
    paragraphs.forEach(paragraph => {
      observer.observe(paragraph);
    });
    
    return () => {
      observer.disconnect();
    };
  }, [currentChapter, bookId, bookService, analyticsService]);
  
  // Handle word selection for definitions
  const handleWordSelection = useCallback((event: React.MouseEvent) => {
    lastInteractionTime.current = performance.now();
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const selectedText = selection.toString().trim();
    if (!selectedText) return;
    
    // In a real implementation, this would show a definition popup
    console.log('Selected text:', selectedText);
    
    // Track word selection
    if (analyticsService) {
      analyticsService.trackReaderAction('highlight', {
        bookId,
        pageNumber: currentChapter?.id ? parseInt(currentChapter.id) : 0,
        content: selectedText
      });
    }
    
    performance.trackInteraction('word_selection', lastInteractionTime.current);
  }, [bookId, currentChapter, analyticsService, performance]);
  
  // Handle bookmark
  const handleBookmark = useCallback(() => {
    const startTime = performance.now();
    
    if (bookService && currentChapter) {
      bookService.addBookmark(bookId, currentChapter.id);
      
      // Track bookmark
      if (analyticsService) {
        analyticsService.trackEvent('add_bookmark', {
          bookId,
          chapterId: currentChapter.id
        });
      }
    }
    
    performance.trackInteraction('add_bookmark', startTime);
  }, [bookId, currentChapter, bookService, analyticsService, performance]);
  
  // Loading state
  if (bookServiceLoading || authServiceLoading || loading) {
    return <LoadingSkeleton type="reader" />;
  }
  
  // Error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error" variant="h6">
          Error loading book: {error.message}
        </Typography>
      </Box>
    );
  }
  
  // Empty state
  if (!bookContent || !currentChapter) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">
          No content available
        </Typography>
      </Box>
    );
  }
  
  // Apply font size from accessibility settings
  const fontSizeStyle = {
    fontSize: `${accessibilitySettings.fontSize / 100}rem`,
    lineHeight: accessibilitySettings.lineHeight
  };
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3, 
        maxWidth: 800, 
        mx: 'auto', 
        my: 2,
        bgcolor: 'background.paper'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5" component="h1">
          {bookContent.title}
        </Typography>
        <Box>
          <Tooltip title="Bookmark">
            <IconButton onClick={handleBookmark} aria-label="Bookmark this page">
              <BookmarkIcon />
            </IconButton>
          </Tooltip>
          <AccessibilityMenu />
        </Box>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <Typography variant="h6" component="h2" gutterBottom>
        {currentChapter.title}
      </Typography>
      
      <Box 
        ref={contentRef} 
        onClick={handleWordSelection}
        sx={{ 
          mt: 2,
          '& p': {
            ...fontSizeStyle,
            mb: 2
          }
        }}
      >
        {currentChapter.content.split('\n\n').map((paragraph: string, index: number) => (
          <Typography 
            key={index} 
            component="p" 
            paragraph
            sx={fontSizeStyle}
          >
            {paragraph}
          </Typography>
        ))}
      </Box>
    </Paper>
  );
};

// Use React.memo to prevent unnecessary re-renders
export default React.memo(OptimizedReaderView);
