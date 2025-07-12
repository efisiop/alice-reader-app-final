import { useState, useEffect, useMemo } from 'react';
import { getAllGlossaryTerms, getTermCount } from '../services/glossaryService';
import { appLog } from '../components/LogViewer';

/**
 * Custom hook to manage Alice glossary terms for hover highlighting
 * Now fetches terms directly from Supabase for real-time data
 */
export const useGlossaryTerms = () => {
  const [glossaryTerms, setGlossaryTerms] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [termCount, setTermCount] = useState<number>(0);

  // Load glossary terms on mount
  useEffect(() => {
    const loadGlossaryTerms = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        appLog('useGlossaryTerms', 'Loading glossary terms from Supabase', 'info');
        
        // Fetch terms and count in parallel
        const [terms, count] = await Promise.all([
          getAllGlossaryTerms(),
          getTermCount()
        ]);
        
        setGlossaryTerms(terms);
        setTermCount(count);
        setIsLoading(false);
        
        appLog('useGlossaryTerms', `Loaded ${terms.size} glossary terms (${count} original entries)`, 'success');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error loading glossary terms';
        setError(errorMessage);
        setIsLoading(false);
        appLog('useGlossaryTerms', 'Error loading glossary terms', 'error', err);
      }
    };

    loadGlossaryTerms();
  }, []);

  // Memoized function to check if a word is a glossary term
  const isGlossaryTerm = useMemo(() => {
    return (word: string): boolean => {
      if (glossaryTerms.size === 0) return false;
      
      // Clean the word for comparison
      const cleanWord = word.replace(/[.,!?;:'"]/g, '').trim();
      const lowerWord = cleanWord.toLowerCase();
      const capitalizedWord = cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1);
      const titleCaseWord = cleanWord.split(' ').map((word: string) => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');

      // Check various forms of the word
      return glossaryTerms.has(cleanWord) || 
             glossaryTerms.has(lowerWord) || 
             glossaryTerms.has(capitalizedWord) || 
             glossaryTerms.has(titleCaseWord);
    };
  }, [glossaryTerms]);

  return {
    glossaryTerms,
    isLoading,
    error,
    termCount,
    isGlossaryTerm
  };
}; 