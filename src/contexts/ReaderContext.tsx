// src/contexts/ReaderContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookWithChapters, SectionWithChapter, BookProgress, BookStats } from '../types/supabase';
import { BookId, SectionId, UserId } from '../types/idTypes';
import { useAuth } from './AuthContext';
import { appLog } from '../components/LogViewer';
import { 
  getBookContent, 
  getSectionByPage, 
  saveReadingProgress, 
  getReadingProgress,
  getReadingStats,
  updateReadingStats
} from '../services/bookService';
import { fetchData, prefetcher } from '../utils/dataFetcher';
import { bookCache, sectionCache, progressCache, statsCache } from '../services/cacheService';
import { getBookUuid, ALICE_BOOK_ID_STRING } from '../utils/bookIdUtils';

// Define the context type
interface ReaderContextType {
  // Book data
  bookData: BookWithChapters | null;
  chapters: any[];
  sections: SectionWithChapter[];
  currentPage: number;
  totalPages: number;
  selectedSection: string | null;
  
  // Reading progress
  progress: BookProgress | null;
  stats: BookStats | null;
  
  // Loading states
  loading: boolean;
  loadingProgress: boolean;
  
  // Error state
  error: string | null;
  
  // Actions
  loadBook: (bookId: string) => Promise<BookWithChapters | null>;
  loadPage: (page: number) => Promise<void>;
  saveProgress: (sectionId: string) => Promise<void>;
  navigateToPage: (page: number) => void;
  navigateToSection: (sectionId: string) => void;
  refreshProgress: () => Promise<void>;
  
  // Prefetching
  prefetchNextPage: () => void;
  prefetchPreviousPage: () => void;
}

// Create the context
const ReaderContext = createContext<ReaderContextType | undefined>(undefined);

// Provider component
export const ReaderProvider: React.FC<{ children: ReactNode; bookId?: string }> = ({ 
  children, 
  bookId = ALICE_BOOK_ID_STRING 
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Book data state
  const [bookData, setBookData] = useState<BookWithChapters | null>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [sections, setSections] = useState<SectionWithChapter[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  
  // Reading progress state
  const [progress, setProgress] = useState<BookProgress | null>(null);
  const [stats, setStats] = useState<BookStats | null>(null);
  
  // Loading and error states
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load book data
  const loadBook = useCallback(async (bookId: string): Promise<BookWithChapters | null> => {
    appLog('ReaderContext', 'Loading book data', 'info', { bookId });
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchData<BookWithChapters>(
        () => getBookContent(bookId),
        {
          cacheKey: `book_${bookId}`,
          cache: bookCache,
          context: 'ReaderContext.loadBook'
        }
      );
      
      if (!data) {
        appLog('ReaderContext', 'Failed to load book data', 'error');
        setError('Failed to load book data. Please try again later.');
        setLoading(false);
        return null;
      }
      
      appLog('ReaderContext', 'Book data loaded successfully', 'success', { title: data.title });
      setBookData(data);
      setChapters(data.chapters || []);
      setTotalPages(data.total_pages || 0);
      
      return data;
    } catch (error: any) {
      appLog('ReaderContext', 'Error loading book data', 'error', error);
      setError(`Error loading book: ${error.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Load page content
  const loadPage = useCallback(async (page: number): Promise<void> => {
    if (!bookId) return;
    
    appLog('ReaderContext', 'Loading page content', 'info', { page, bookId });
    setLoading(true);
    setError(null);
    
    try {
      const sectionsData = await fetchData<SectionWithChapter[]>(
        () => getSectionByPage(bookId, page),
        {
          cacheKey: `sections_${bookId}_page_${page}`,
          cache: sectionCache,
          context: 'ReaderContext.loadPage'
        }
      );
      
      if (!sectionsData || sectionsData.length === 0) {
        appLog('ReaderContext', 'No sections found for page', 'warning', { page });
        setError(`No content found for page ${page}.`);
        setSections([]);
        setLoading(false);
        return;
      }
      
      appLog('ReaderContext', 'Page content loaded successfully', 'success', {
        page,
        sectionCount: sectionsData.length
      });
      
      setSections(sectionsData);
      setCurrentPage(page);
      
      // Set the first section as selected
      if (sectionsData.length > 0) {
        setSelectedSection(sectionsData[0].id);
        
        // Save progress if user is logged in
        if (user) {
          saveProgress(sectionsData[0].id);
        }
      }
      
      // Prefetch adjacent pages
      prefetchNextPage();
      prefetchPreviousPage();
    } catch (error: any) {
      appLog('ReaderContext', 'Error loading page content', 'error', error);
      setError(`Error loading page: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [bookId, user]);
  
  // Save reading progress
  const saveProgress = useCallback(async (sectionId: string): Promise<void> => {
    if (!user || !bookId) {
      appLog('ReaderContext', 'User not logged in or no book ID, not saving progress to server', 'info');
      localStorage.setItem('readingProgress', sectionId);
      return;
    }
    
    try {
      appLog('ReaderContext', 'Saving reading progress', 'info', { sectionId, bookId, userId: user.id });
      
      // Save to localStorage as backup
      localStorage.setItem('readingProgress', sectionId);
      
      // Save to server
      await saveReadingProgress(user.id, bookId, sectionId);
      
      // Update local state
      setSelectedSection(sectionId);
      
      // Update progress cache
      const progressKey = `progress_${user.id}_${bookId}`;
      const currentProgress = progressCache.get<BookProgress>(progressKey);
      
      if (currentProgress) {
        const updatedProgress = { ...currentProgress, section_id: sectionId };
        progressCache.set(progressKey, updatedProgress);
      }
      
      appLog('ReaderContext', 'Reading progress saved successfully', 'success');
    } catch (error: any) {
      appLog('ReaderContext', 'Error saving reading progress', 'error', error);
    }
  }, [user, bookId]);
  
  // Load reading progress
  const loadProgress = useCallback(async (): Promise<void> => {
    if (!user || !bookId) {
      appLog('ReaderContext', 'User not logged in or no book ID, not loading progress from server', 'info');
      return;
    }
    
    setLoadingProgress(true);
    
    try {
      appLog('ReaderContext', 'Loading reading progress', 'info', { bookId, userId: user.id });
      
      const progressData = await fetchData<BookProgress>(
        () => getReadingProgress(user.id, bookId),
        {
          cacheKey: `progress_${user.id}_${bookId}`,
          cache: progressCache,
          context: 'ReaderContext.loadProgress'
        }
      );
      
      if (progressData) {
        appLog('ReaderContext', 'Reading progress loaded successfully', 'success', progressData);
        setProgress(progressData);
        
        // If we have a section ID, set it as selected
        if (progressData.section_id) {
          setSelectedSection(progressData.section_id);
        }
      } else {
        appLog('ReaderContext', 'No reading progress found', 'info');
      }
      
      // Load reading stats
      const statsData = await fetchData<BookStats>(
        () => getReadingStats(user.id, bookId),
        {
          cacheKey: `stats_${user.id}_${bookId}`,
          cache: statsCache,
          context: 'ReaderContext.loadProgress'
        }
      );
      
      if (statsData) {
        appLog('ReaderContext', 'Reading stats loaded successfully', 'success', statsData);
        setStats(statsData);
      } else {
        appLog('ReaderContext', 'No reading stats found', 'info');
      }
    } catch (error: any) {
      appLog('ReaderContext', 'Error loading reading progress', 'error', error);
    } finally {
      setLoadingProgress(false);
    }
  }, [user, bookId]);
  
  // Refresh progress
  const refreshProgress = useCallback(async (): Promise<void> => {
    if (!user || !bookId) return;
    
    // Clear progress cache
    progressCache.remove(`progress_${user.id}_${bookId}`);
    statsCache.remove(`stats_${user.id}_${bookId}`);
    
    // Reload progress
    await loadProgress();
  }, [user, bookId, loadProgress]);
  
  // Navigation helpers
  const navigateToPage = useCallback((page: number): void => {
    if (page < 1 || (totalPages > 0 && page > totalPages)) {
      appLog('ReaderContext', 'Invalid page number', 'warning', { page, totalPages });
      return;
    }
    
    appLog('ReaderContext', 'Navigating to page', 'info', { page });
    navigate(`/reader/read/${bookId}/page/${page}`);
  }, [bookId, totalPages, navigate]);
  
  const navigateToSection = useCallback((sectionId: string): void => {
    if (!bookData) return;
    
    // Find the section
    let targetPage = 1;
    
    for (const chapter of bookData.chapters || []) {
      for (const section of chapter.sections || []) {
        if (section.id === sectionId) {
          targetPage = section.start_page;
          break;
        }
      }
    }
    
    appLog('ReaderContext', 'Navigating to section', 'info', { sectionId, page: targetPage });
    navigate(`/reader/read/${bookId}/page/${targetPage}`);
  }, [bookId, bookData, navigate]);
  
  // Prefetching
  const prefetchNextPage = useCallback((): void => {
    if (!bookId || currentPage >= totalPages) return;
    
    const nextPage = currentPage + 1;
    const cacheKey = `sections_${bookId}_page_${nextPage}`;
    
    // Skip if already in cache or being prefetched
    if (sectionCache.has(cacheKey) || prefetcher.isPrefetching(cacheKey)) return;
    
    appLog('ReaderContext', 'Prefetching next page', 'debug', { page: nextPage });
    
    prefetcher.prefetch(
      cacheKey,
      () => getSectionByPage(bookId, nextPage),
      {
        cache: sectionCache,
        context: 'ReaderContext.prefetchNextPage'
      }
    );
  }, [bookId, currentPage, totalPages]);
  
  const prefetchPreviousPage = useCallback((): void => {
    if (!bookId || currentPage <= 1) return;
    
    const prevPage = currentPage - 1;
    const cacheKey = `sections_${bookId}_page_${prevPage}`;
    
    // Skip if already in cache or being prefetched
    if (sectionCache.has(cacheKey) || prefetcher.isPrefetching(cacheKey)) return;
    
    appLog('ReaderContext', 'Prefetching previous page', 'debug', { page: prevPage });
    
    prefetcher.prefetch(
      cacheKey,
      () => getSectionByPage(bookId, prevPage),
      {
        cache: sectionCache,
        context: 'ReaderContext.prefetchPreviousPage'
      }
    );
  }, [bookId, currentPage]);
  
  // Initial load
  useEffect(() => {
    const initializeReader = async () => {
      // Load book data
      const book = await loadBook(bookId);
      
      if (book) {
        // Load reading progress
        await loadProgress();
        
        // If we have progress, navigate to the section
        if (progress && progress.section_id) {
          navigateToSection(progress.section_id);
        } else {
          // Otherwise load the first page
          loadPage(1);
        }
      }
    };
    
    initializeReader();
  }, [bookId, loadBook, loadProgress, loadPage, navigateToSection, progress]);
  
  // Update reading stats periodically
  useEffect(() => {
    if (!user || !bookId || !selectedSection) return;
    
    // Update stats every 30 seconds
    const interval = setInterval(() => {
      updateReadingStats(user.id, bookId, 30);
      
      // Refresh stats cache
      statsCache.remove(`stats_${user.id}_${bookId}`);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [user, bookId, selectedSection]);
  
  // Context value
  const value: ReaderContextType = {
    bookData,
    chapters,
    sections,
    currentPage,
    totalPages,
    selectedSection,
    progress,
    stats,
    loading,
    loadingProgress,
    error,
    loadBook,
    loadPage,
    saveProgress,
    navigateToPage,
    navigateToSection,
    refreshProgress,
    prefetchNextPage,
    prefetchPreviousPage
  };
  
  return (
    <ReaderContext.Provider value={value}>
      {children}
    </ReaderContext.Provider>
  );
};

// Hook for using the context
export const useReader = (): ReaderContextType => {
  const context = useContext(ReaderContext);
  
  if (context === undefined) {
    throw new Error('useReader must be used within a ReaderProvider');
  }
  
  return context;
};
