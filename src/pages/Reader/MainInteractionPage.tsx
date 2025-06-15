/* eslint-disable @typescript-eslint/no-unused-vars */
// The above line disables unused variable warnings for this file
// Some variables are declared but not used yet as they will be used in future implementations

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fade
} from '@mui/material';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useBookService, useDictionaryService } from '../../hooks/useService';
import { LoadingIndicator } from '../../components/common/LoadingIndicator';
import { useSnackbar } from '../../utils/notistackUtils';
import { fixAliceText, validateText } from '../../utils/textUtils';
import CloseIcon from '@mui/icons-material/Close';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import NoteIcon from '@mui/icons-material/Note';
import HelpIcon from '@mui/icons-material/Help';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import InfoIcon from '@mui/icons-material/Info';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import { Book as BookIcon, Menu as MenuIcon, LibraryBooks as DictionaryIcon, SmartToy as SmartToyIcon } from '@mui/icons-material';
import { readerService, SectionSnippet } from '../../services/readerService';
import { registry } from '../../services/serviceRegistry';
import { ALICE_BOOK_ID } from '../../data/fallbackBookData';
import { DictionaryServiceInterface } from '../../services/dictionaryService';

// Define types for Section data
interface SectionDetail extends SectionSnippet {
  content: string;
}

interface DefinitionData {
  word: string;
  definition: string;
  examples?: string[];
  source?: 'database' | 'local' | 'external' | 'not_found' | 'error';
}

const MainInteractionPage: React.FC = () => {
  // These hooks are kept for future implementation of navigation and error handling
  const navigate = useNavigate(); // Will be used for navigation between pages
  const { bookId = 'alice-in-wonderland' } = useParams<{ bookId?: string }>(); // Used to identify which book to load
  const { user, profile, loading: authLoading } = useAuth();
  const { service: bookService, loading: bookServiceLoading, error: bookServiceError } = useBookService();
  const { service: dictionaryService, loading: dictionaryServiceLoading, error: dictionaryServiceError } = useDictionaryService();
  const { enqueueSnackbar } = useSnackbar(); // Will be used for notifications

  // FIXED: Define the actual UUID for Alice in Wonderland book to use in API calls
  const ALICE_BOOK_UUID = '550e8400-e29b-41d4-a716-446655440000';

  // State for page/section input
  const [pageInput, setPageInput] = useState<string>('');
  const [activePage, setActivePage] = useState<number | null>(null);
  const [isLoadingSections, setIsLoadingSections] = useState<boolean>(false);
  const [sectionSnippets, setSectionSnippets] = useState<SectionSnippet[]>([]);
  const [selectedSection, setSelectedSection] = useState<SectionDetail | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // State for tracking the current step in the user flow
  const [currentStep, setCurrentStep] = useState<'page_input' | 'section_selection' | 'content_interaction'>('page_input');

  // State for definition sidebar
  // selectedText will be used to store the highlighted text for future features
  const [selectedText, setSelectedText] = useState<string>('');
  const [definitionData, setDefinitionData] = useState<DefinitionData | null>(null);
  const [isLoadingDefinition, setIsLoadingDefinition] = useState<boolean>(false);

  // Ref for the text area where section content is displayed for highlighting
  const sectionContentRef = useRef<HTMLDivElement>(null);

  // Ref for the page input field to focus on it when the component loads
  const pageInputRef = useRef<HTMLInputElement>(null);

  // We'll use this to conditionally render content
  const [isReady, setIsReady] = useState<boolean>(false);

  // State for AI assistant
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAssistantPosition, setAiAssistantPosition] = useState({ x: 0, y: 0 });

  // Dictionary state
  const [dictionaryLoading, setDictionaryLoading] = useState(false);
  const [dictionaryError, setDictionaryError] = useState<string | null>(null);
  const [dictionaryDefinition, setDictionaryDefinition] = useState<string | null>(null);
  const [dictionaryDialogOpen, setDictionaryDialogOpen] = useState(false);

  // Add state for origin
  const [wordOrigin, setWordOrigin] = useState<string | null>(null);

  // Add these state variables at the top with other states
  const [AIAnalysis, setAIAnalysis] = useState<string | null>(null);
  const [AIAnalysisLoading, setAIAnalysisLoading] = useState(false);
  const [AIAnalysisError, setAIAnalysisError] = useState<string | null>(null);
  const [AIAnalysisDialogOpen, setAIAnalysisDialogOpen] = useState(false);

  // Add this new function after the existing handleAIAssistantClick
  const handleGenerateExample = async () => {
    try {
      const response = await fetch('/api/ai/generate-example', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          word: selectedText,
          definition: dictionaryDefinition,
          context: 'Alice in Wonderland'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate example');
      }

      const data = await response.json();
      return data.example;
    } catch (error) {
      console.error('Error generating example:', error);
      return null;
    }
  };

  // Modify the dictionary dialog content
  const [example, setExample] = useState<string | null>(null);
  const [isGeneratingExample, setIsGeneratingExample] = useState(false);

  // Add this effect to generate example when dictionary definition is loaded
  useEffect(() => {
    if (dictionaryDefinition && !example) {
      setIsGeneratingExample(true);
      handleGenerateExample().then((generatedExample) => {
        setExample(generatedExample);
        setIsGeneratingExample(false);
      });
    }
  }, [dictionaryDefinition]);

  // Check if services are ready
  useEffect(() => {
    if (!authLoading && !bookServiceLoading && !dictionaryServiceLoading && user && bookService && dictionaryService) {
      setIsReady(true);
    }
  }, [authLoading, bookServiceLoading, dictionaryServiceLoading, user, bookService, dictionaryService]);

  // Focus on the page input field when the component is ready
  useEffect(() => {
    if (isReady && pageInputRef.current && currentStep === 'page_input') {
      // Use a small timeout to ensure the DOM is fully rendered
      const timer = setTimeout(() => {
        pageInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isReady, currentStep]);

  // --- Core Functions ---

  const handlePageSubmit = async () => {
    const pageNum = parseInt(pageInput, 10);
    if (isNaN(pageNum) || pageNum <= 0) {
      setFetchError('Please enter a valid page number.');
      return;
    }
    setIsLoadingSections(true);
    setFetchError(null);
    setSectionSnippets([]);
    setSelectedSection(null); // Clear previous section
    setActivePage(pageNum);
    console.log(`Fetching sections for page: ${pageNum}`);
    try {
      // FIXED: Use actual UUID for Alice in Wonderland instead of string identifier
      // This fixes the "invalid input syntax for type uuid" error
      const snippets = await readerService.getSectionSnippetsForPage(ALICE_BOOK_UUID, pageNum);
      setSectionSnippets(snippets || []);

      if (snippets.length === 0) {
        setFetchError(`No sections found on page ${pageNum}.`);
      } else {
        // Update the current step to section selection
        setCurrentStep('section_selection');
      }
    } catch (err: any) {
      console.error('Error fetching sections:', err);
      setFetchError(`Failed to load sections for page ${pageNum}. ${err.message || ''}`);
      setSectionSnippets([]);
    } finally {
      setIsLoadingSections(false);
    }
  };

  const handleSectionSelect = async (sectionId: string) => {
     // Find the selected snippet to get basic info
     const snippet = sectionSnippets.find(s => s.id === sectionId);
     if (!snippet && !selectedSection) {
       console.error(`No snippet found with ID: ${sectionId}`);
       return;
     }

     // If we're retrying with an existing selectedSection
     const snippetToUse = snippet || { id: sectionId, number: selectedSection?.number || 0, preview: selectedSection?.preview || '' };

     console.log('Selected snippet:', snippetToUse);

     setIsLoadingSections(true); // Use same loading state for fetching full content
     setFetchError(null);

     // Only clear selected section if this is not a retry
     if (!selectedSection) {
       setSelectedSection(null);
     }

     console.log(`Fetching full content for section: ${sectionId}`);

     try {
        // Use the readerService to get full section content
        const fullSection = await readerService.getSection(sectionId);
        console.log('Received full section data:', fullSection);

        // Validate that we received content
        if (!fullSection || !fullSection.content) {
          console.error('Section content is empty or undefined:', fullSection);
          throw new Error('Section content could not be loaded (empty response)');
        }

        // Log content length for debugging
        console.log(`Section content length: ${fullSection.content.length} characters`);
        console.log(`Section content preview: "${fullSection.content.substring(0, 100)}..."`);

        // Check if content is just the preview (which would indicate a problem)
        if (fullSection.content.trim() === snippetToUse.preview.trim()) {
          console.warn('Section content appears to be just the preview text, attempting to retry with direct query');
          throw new Error('Section content appears incomplete. Please try again.');
        }

        // Transform to expected format
        const sectionDetail: SectionDetail = {
          id: fullSection.id,
          number: snippetToUse.number, // Keep the number from snippet since it might not be in the full section object
          preview: snippetToUse.preview,
          content: fullSection.content
        };

        console.log('Setting selected section with content:', sectionDetail);
        setSelectedSection(sectionDetail);

        if (snippet) {
          setSectionSnippets([]); // Hide snippets once full section is loaded
        }

        clearDefinition(); // Clear any previous definition

        // Update the current step to content interaction
        setCurrentStep('content_interaction');
     } catch (err: any) {
        console.error('Error fetching section content:', err);
        setFetchError(`Failed to load section content. ${err.message || ''}`);
     } finally {
        setIsLoadingSections(false);
     }
  };

  // --- Text Selection and Definition Functions ---

  const expandSelectionToWords = (text: string, startOffset: number, endOffset: number, multiWordMode: 'first' | 'last' | 'all' = 'all') => {
    // Define word boundary pattern (letters, numbers, apostrophes, hyphens)
    const wordCharPattern = /[\w''\-]/;
    const whitespacePattern = /\s/;

    // Expand start offset to the beginning of the word
    let expandedStart = startOffset;
    while (expandedStart > 0 && wordCharPattern.test(text[expandedStart - 1])) {
      expandedStart--;
    }

    // Expand end offset to the end of the word
    let expandedEnd = endOffset;
    while (expandedEnd < text.length && wordCharPattern.test(text[expandedEnd])) {
      expandedEnd++;
    }

    // For phrasal definitions, try to expand to include nearby words that might form a phrase
    // Look for common phrasal patterns (up to 4 words)
    let phraseStart = expandedStart;
    let phraseEnd = expandedEnd;

    // Look backwards for potential phrase components
    let tempStart = expandedStart;
    let wordsBeforeCount = 0;
    while (tempStart > 0 && wordsBeforeCount < 3) {
      // Skip whitespace
      while (tempStart > 0 && whitespacePattern.test(text[tempStart - 1])) {
        tempStart--;
      }
      if (tempStart === 0) break;
      
      // Find word boundary
      let wordStart = tempStart;
      while (wordStart > 0 && wordCharPattern.test(text[wordStart - 1])) {
        wordStart--;
      }
      
      const wordBefore = text.substring(wordStart, tempStart);
      if (wordBefore && wordBefore.length > 1) {
        phraseStart = wordStart;
        wordsBeforeCount++;
        tempStart = wordStart;
      } else {
        break;
      }
    }

    // Look forwards for potential phrase components
    let tempEnd = expandedEnd;
    let wordsAfterCount = 0;
    while (tempEnd < text.length && wordsAfterCount < 3) {
      // Skip whitespace
      while (tempEnd < text.length && whitespacePattern.test(text[tempEnd])) {
        tempEnd++;
      }
      if (tempEnd >= text.length) break;
      
      // Find word boundary
      let wordEnd = tempEnd;
      while (wordEnd < text.length && wordCharPattern.test(text[wordEnd])) {
        wordEnd++;
      }
      
      const wordAfter = text.substring(tempEnd, wordEnd);
      if (wordAfter && wordAfter.length > 1) {
        phraseEnd = wordEnd;
        wordsAfterCount++;
        tempEnd = wordEnd;
      } else {
        break;
      }
    }

    // Return both single word and potential phrase
    const singleWord = text.substring(expandedStart, expandedEnd);
    const potentialPhrase = text.substring(phraseStart, phraseEnd);

    return {
      singleWord: singleWord.trim(),
      phrase: potentialPhrase.trim(),
      expandedStart,
      expandedEnd,
      phraseStart,
      phraseEnd
    };
  };

  // Clean word for dictionary lookup (remove punctuation, etc.)
  const cleanWord = (word: string) => {
    if (!word) return '';
    
    // First trim whitespace
    let cleaned = word.trim();
    
    // Remove leading and trailing punctuation, but keep internal hyphens and apostrophes
    cleaned = cleaned.replace(/^[^\w]+|[^\w]+$/g, '');
    
    // Handle special case where the word might be just punctuation
    if (cleaned.length === 0 && word.length > 0) {
      console.log("Word contained only punctuation:", word);
      return '';
    }
    
    return cleaned.toLowerCase();
  };

  // --- Key Event Handlers ---

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || !selection.toString().trim()) return;

    const selectedText = selection.toString().trim();
    const range = selection.getRangeAt(0);
    const text = range.startContainer.textContent || '';
    const startOffset = range.startOffset;
    const endOffset = range.endOffset;

    // Find the nearest punctuation marks
    const punctuationMarks = ['.', '!', '?', ';', ':', ','];
    let startPos = startOffset;
    let endPos = endOffset;

    // Look for punctuation before the selection
    for (let i = startOffset; i >= 0; i--) {
      if (punctuationMarks.includes(text[i])) {
        startPos = i + 1;
        break;
      }
    }

    // Look for punctuation after the selection
    for (let i = endOffset; i < text.length; i++) {
      if (punctuationMarks.includes(text[i])) {
        endPos = i;
        break;
      }
    }

    // Create a new range with the adjusted positions
    const newRange = document.createRange();
    newRange.setStart(range.startContainer, startPos);
    newRange.setEnd(range.endContainer, endPos);

    // Update the selection
    selection.removeAllRanges();
    selection.addRange(newRange);

    // Get the new selected text
    const newSelectedText = selection.toString().trim();
    setSelectedText(newSelectedText);
    fetchDictionaryDefinition(newSelectedText);
    setDictionaryDialogOpen(true);
  };

  // Update the fetchDictionaryDefinition function
  const fetchDictionaryDefinition = async (word: string) => {
    setDictionaryLoading(true);
    setDictionaryError(null);
    setDictionaryDefinition(null);
    setWordOrigin(null);
    setExample(null);

    try {
      // First try the free dictionary API
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      if (!response.ok) {
        throw new Error('Word not found');
      }
      const data = await response.json();
      
      // Get the first definition and origin
      const firstEntry = data[0];
      const firstMeaning = firstEntry.meanings[0];
      const firstDefinition = firstMeaning.definitions[0].definition;
      
      // Try to get origin from etymology
      let origin = 'Origin not available';
      if (firstEntry.etymologies && firstEntry.etymologies.length > 0) {
        origin = firstEntry.etymologies[0];
      } else if (firstEntry.origin) {
        origin = firstEntry.origin;
      }

      setDictionaryDefinition(firstDefinition);
      setWordOrigin(origin);
    } catch (error) {
      console.error('Error fetching definition:', error);
      setDictionaryError('Failed to fetch definition. Please try again.');
    } finally {
      setDictionaryLoading(false);
    }
  };

  // Update the handleAIAssistantClick function to ensure it's making the request
  const handleAIAssistantClick = async () => {
    try {
      setAIAnalysisLoading(true);
      const response = await fetch('/api/ai/generate-example', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          word: selectedText,
          definition: dictionaryDefinition,
          context: 'Alice in Wonderland',
          type: 'detailed'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI analysis');
      }

      const data = await response.json();
      setAIAnalysis(data.example);
      setAIAnalysisDialogOpen(true);
    } catch (error) {
      console.error('Error getting AI analysis:', error);
      setAIAnalysisError('Failed to get AI analysis. Please try again.');
    } finally {
      setAIAnalysisLoading(false);
    }
  };

  const handleCloseAIDialog = () => {
    setAiDialogOpen(false);
    setAiResponse('');
  };

  // Separate function to handle the actual definition lookup
  const lookupDefinition = async (termToLookup: string, originalTerm: string, expansion?: any) => {
    // Show loading state
    setIsLoadingDefinition(true);
    setDefinitionData(null);

    try {
      console.log('Looking up definition for:', termToLookup);

      if (!dictionaryService) {
        throw new Error('Dictionary service not available');
      }

             // Try to get definition from dictionary service
       let definition = await dictionaryService.getDefinition(ALICE_BOOK_UUID, termToLookup);
       console.log('Definition result for', termToLookup, ':', definition);

       // If no definition found for phrase and we have expansion info, try the single word
       if ((!definition || !definition.definition) && expansion && expansion.phrase !== expansion.singleWord) {
         console.log('No phrasal definition found, trying single word:', expansion.singleWord);
         const singleWordCleaned = cleanWord(expansion.singleWord);
         if (singleWordCleaned && singleWordCleaned !== termToLookup) {
           definition = await dictionaryService.getDefinition(ALICE_BOOK_UUID, singleWordCleaned);
           console.log('Single word definition result for', singleWordCleaned, ':', definition);
           if (definition && definition.definition) {
             termToLookup = singleWordCleaned;
             originalTerm = expansion.singleWord;
           }
         }
       }

      if (definition && definition.definition) {
        const definitionData: DefinitionData = {
          word: originalTerm,
          definition: definition.definition,
          examples: definition.examples || [],
          source: definition.source as any || 'database'
        };

        setDefinitionData(definitionData);
        console.log('Definition set:', definitionData);

        // Log the successful dictionary lookup if user is logged in
        if (user && selectedSection) {
          dictionaryService.logDictionaryLookup(
            user.id,
            ALICE_BOOK_UUID,
            selectedSection.id,
            termToLookup,
            true
          ).catch(err => console.error("Error logging dictionary lookup:", err));
        }
      } else {
        // No definition found
        const noDefData: DefinitionData = {
          word: originalTerm,
          definition: 'Definition not found.',
          source: 'not_found'
        };
        setDefinitionData(noDefData);
        console.log('No definition found for:', termToLookup);

        // Log the failed dictionary lookup if user is logged in
        if (user && selectedSection) {
          dictionaryService.logDictionaryLookup(
            user.id,
            ALICE_BOOK_UUID,
            selectedSection.id,
            termToLookup,
            false
          ).catch(err => console.error("Error logging dictionary lookup:", err));
        }
      }
    } catch (error) {
      console.error('Error getting definition:', error);
      const errorDefData: DefinitionData = {
        word: originalTerm,
        definition: 'Error loading definition.',
        source: 'error'
      };
      setDefinitionData(errorDefData);
    } finally {
      setIsLoadingDefinition(false);
    }
  };

  const clearDefinition = () => {
    setDefinitionData(null);
    setSelectedText('');
  };

  // Handle navigation actions
  const handleStatistics = () => {
    navigate('/reader/statistics');
  };

  const handleNotes = () => {
    // Notes functionality to be implemented
    console.log('Notes button clicked');
    alert('Notes feature coming soon!');
  };

  const handleConsultantHelp = () => {
    // TODO: Implement navigation to consultant help form
    console.log('Navigate to consultant help form');
  };

  const handleInfoCenter = () => {
    // TODO: Implement navigation to info center
    console.log('Navigate to info center');
  };

  const handleConsultantClick = () => {
    // This will be implemented when consultant functionality is added
    console.log('Consultant button clicked');
    alert('Consultant feature coming soon!');
  };

  const handleDictionaryClick = async () => {
    try {
      const selection = window.getSelection();
      if (!selection || !selection.toString().trim()) return;

      const selectedText = selection.toString().trim();
      if (!selectedText) return;

      // Check if it's a single word or multiple words
      const wordCount = selectedText.split(/\s+/).length;
      if (wordCount === 1) {
        // Single word: show dictionary definition dialog
        setDictionaryLoading(true);
        setDictionaryError(null);
        setDictionaryDefinition(null);
        setDictionaryDialogOpen(true);

        // Get the current section ID
        const currentSectionId = selectedSection?.id;

        // Get the definition using the dictionary service
        const dictionaryService = await registry.getService<DictionaryServiceInterface>('dictionaryService');
        const result = await dictionaryService.getDefinition(
          ALICE_BOOK_ID,
          selectedText,
          currentSectionId
        );

        if (result.definition) {
          setDictionaryDefinition(result.definition);
          // Log the successful lookup
          await dictionaryService.logDictionaryLookup(
            user?.id || 'anonymous',
            ALICE_BOOK_ID,
            currentSectionId,
            selectedText,
            true
          );
        } else {
          setDictionaryError("No definition found for this term.");
          // Log the failed lookup
          await dictionaryService.logDictionaryLookup(
            user?.id || 'anonymous',
            ALICE_BOOK_ID,
            currentSectionId,
            selectedText,
            false
          );
        }
        setDictionaryLoading(false);
      } else {
        // Multiple words: show AI assistant dialog
        setAIAnalysisLoading(true);
        setAIAnalysisDialogOpen(true);
        setDictionaryDialogOpen(false);
        setAIAnalysisError(null);
        setAIAnalysis(null);
        try {
          const response = await fetch('/api/ai/generate-example', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              word: selectedText,
              context: 'Alice in Wonderland',
              type: 'detailed'
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to get AI analysis');
          }

          const data = await response.json();
          setAIAnalysis(data.example);
        } catch (error) {
          setAIAnalysisError('Failed to get AI analysis. Please try again.');
        } finally {
          setAIAnalysisLoading(false);
        }
      }
    } catch (error) {
      console.error("Error in dictionary or AI lookup:", error);
      setDictionaryError("Failed to look up definition. Please try again.");
      setAIAnalysisError("Failed to get AI analysis. Please try again.");
      setDictionaryLoading(false);
      setAIAnalysisLoading(false);
    }
  };

  // --- Event Listeners ---

     const handleKeyDown = (event: KeyboardEvent) => {
       // Future: Add keyboard shortcuts here
       if (event.ctrlKey || event.metaKey) {
         // Handle Ctrl/Cmd + key combinations
       }
     };

     useEffect(() => {
       document.addEventListener('keydown', handleKeyDown);
       return () => document.removeEventListener('keydown', handleKeyDown);
     }, []);

  // --- Render Logic ---
  if (!isReady) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <LoadingIndicator message="Initializing Companion..." />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
      {/* Main Content Area (3/4 of page) */}
      <Box sx={{ 
        width: '75%', 
        p: 3, 
        overflow: 'auto',
        position: 'relative'
      }}>
        {/* Page Input */}
        <Paper
          elevation={currentStep === 'page_input' ? 3 : 1}
          sx={{
            p: 3,
            mb: 3,
            display: 'flex',
            flexDirection: 'column',
            borderLeft: currentStep === 'page_input' ? '4px solid' : 'none',
            borderColor: 'primary.main',
            transition: 'all 0.3s ease'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography>Page number:</Typography>
            <TextField
              inputRef={pageInputRef}
              type="number"
              size="small"
              variant="outlined"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              sx={{ maxWidth: '120px' }}
              onKeyDown={(e) => e.key === 'Enter' && handlePageSubmit()}
              placeholder="7"
            />
            <Button
              variant="contained"
              onClick={handlePageSubmit}
              disabled={isLoadingSections}
              sx={{ minWidth: '120px' }}
            >
              {isLoadingSections ? 'Loading...' : 'Find Sections'}
            </Button>
          </Box>
        </Paper>

        {/* Definition Area at Top with Nice Background */}
        {definitionData && (
          <Paper 
            elevation={3} 
            sx={{
              mb: 4,
              p: 3,
              background: 'linear-gradient(135deg, #f8f9ff 0%, #e8f0fe 50%, #f0f4ff 100%)',
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'primary.light',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
           <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
             <Box sx={{ flex: 1 }}>
               <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                 {definitionData.word}
               </Typography>
               <Typography variant="body1" sx={{ mb: 1 }}>
                 {definitionData.definition}
               </Typography>
               {definitionData.examples && definitionData.examples.length > 0 && (
                 <Box sx={{ mt: 1 }}>
                   {definitionData.examples.map((example, index) => (
                     <Typography key={index} variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                       "{example}"
                     </Typography>
                   ))}
                 </Box>
               )}
               <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                 Source: {definitionData.source}
               </Typography>
             </Box>
             <IconButton size="small" onClick={clearDefinition} sx={{ ml: 2 }}>
               <CloseIcon fontSize="small"/>
             </IconButton>
           </Box>
         </Paper>
       )}

        {/* Section Selection / Display Area - This takes up most of the 3/4 space */}
        <Box sx={{ flex: 1, minHeight: '400px' }}>
          {isLoadingSections && <LoadingIndicator message="Loading sections..." />}
          {fetchError && <LoadingIndicator message={fetchError} />}

          {/* Display Section Snippets */}
          {!isLoadingSections && !fetchError && sectionSnippets.length > 0 && !selectedSection && (
            <Paper
              elevation={currentStep === 'section_selection' ? 3 : 1}
              sx={{
                p: 3,
                borderLeft: currentStep === 'section_selection' ? '4px solid' : 'none',
                borderColor: 'primary.main',
                transition: 'all 0.3s ease',
                height: '100%'
              }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select which section you are reading:
              </Typography>

              <List>
                {sectionSnippets.map((snippet) => (
                  <ListItem
                    key={snippet.id}
                    onClick={() => handleSectionSelect(snippet.id)}
                    sx={{
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                        borderColor: 'primary.light'
                      }
                    }}
                  >
                    <ListItemText
                      primary={`Section ${snippet.number}`}
                      secondary={snippet.preview}
                      primaryTypographyProps={{ fontWeight: 'bold' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}

          {/* Display Selected Section Content */}
          {!isLoadingSections && !fetchError && selectedSection && (
             <Paper
                elevation={currentStep === 'content_interaction' ? 3 : 1}
                sx={{
                  p: 3,
                  borderLeft: currentStep === 'content_interaction' ? '4px solid' : 'none',
                  borderColor: 'primary.main',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  height: '100%',
                  overflow: 'auto'
                }}
                ref={sectionContentRef}
                onMouseUp={handleTextSelection} // Trigger definition lookup
             >
               <Box
                 sx={{
                   p: 2,
                   border: '1px solid',
                   borderColor: 'divider',
                   borderRadius: 1,
                   backgroundColor: 'background.paper',
                   position: 'relative',
                   minHeight: '200px',
                   height: '100%'
                 }}
               >
                 {selectedSection.content ? (
                   <>
                     {/* Display section content with proper formatting */}
                     <Typography
                       ref={sectionContentRef}
                       variant="body1"
                       component="div"
                       onMouseUp={handleTextSelection}
                       sx={{
                         whiteSpace: 'pre-wrap',
                         lineHeight: 1.8,
                         '& p': { marginBottom: 2 },
                         '& .paragraph': { marginBottom: 2 },
                         '& .drop-cap': {
                           float: 'left',
                           fontSize: '3.5em',
                           lineHeight: '0.8',
                           paddingRight: '0.1em',
                           paddingTop: '0.1em',
                           fontFamily: '"Alice", serif',
                           color: 'primary.main'
                         }
                       }}
                     >
                       {/* Split content by paragraphs and render each one with text cleaning */}
                       {fixAliceText(selectedSection.content)
                         .split(/\n\s*\n/)
                         .map((paragraph, index) => {
                           const trimmedParagraph = paragraph.trim();
                           if (!trimmedParagraph) return null;
                           
                           // Add drop cap to first paragraph only
                           if (index === 0) {
                             // Get the first word and its first letter
                             const firstWord = trimmedParagraph.split(/\s+/)[0];
                             const firstChar = firstWord.charAt(0);
                             const restOfFirstWord = firstWord.slice(1);
                             const restOfText = trimmedParagraph.slice(firstWord.length);
                             
                             return (
                               <React.Fragment key={index}>
                                 <span className="drop-cap">{firstChar}</span>
                                 {restOfFirstWord}{restOfText}
                                 {index < fixAliceText(selectedSection.content).split(/\n\s*\n/).length - 1 && (
                                   <Box component="span" sx={{ display: 'block', my: 2 }} />
                                 )}
                               </React.Fragment>
                             );
                           }
                           
                           return (
                             <React.Fragment key={index}>
                               {trimmedParagraph}
                               {index < fixAliceText(selectedSection.content).split(/\n\s*\n/).length - 1 && (
                                 <Box component="span" sx={{ display: 'block', my: 2 }} />
                               )}
                             </React.Fragment>
                           );
                         })}
                     </Typography>

                     {/* Show content length for debugging */}
                     {import.meta.env.DEV && (
                       <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                         Content length: {selectedSection.content.length} characters
                         {(() => {
                           const validation = validateText(selectedSection.content);
                           return !validation.isValid ? (
                             <span style={{ color: 'red', display: 'block' }}>
                               Text issues: {validation.issues.join(', ')}
                             </span>
                           ) : null;
                         })()}
                       </Typography>
                     )}

                     {/* Location info at bottom left */}
                     <Box sx={{ position: 'absolute', left: 16, bottom: 8 }}>
                       <Typography variant="caption" color="text.secondary">
                         {activePage ? `Page ${activePage}` : ''}{selectedSection ? `, Section ${selectedSection.number}` : ''}
                       </Typography>
                     </Box>
                   </>
                 ) : (
                   <Box sx={{ textAlign: 'center', py: 2 }}>
                     <Typography variant="body2" color="error">
                       Section content could not be loaded. Please try selecting the section again.
                     </Typography>
                     <Button
                       variant="outlined"
                       size="small"
                       sx={{ mt: 2 }}
                       onClick={() => handleSectionSelect(selectedSection.id)}
                     >
                       Retry Loading Content
                     </Button>
                   </Box>
                 )}
               </Box>
             </Paper>
          )}
        </Box>
      </Box>

      {/* Right Sidebar (1/4 of page) */}
      <Box sx={{ 
        width: '25%', 
        p: 2, 
        borderLeft: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        gap: 2
      }}>
        {/* Consultant Help */}
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: 'background.paper',
            boxShadow: 1,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: 3,
            },
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            minHeight: '140px'
          }}
          onClick={() => navigate('/consultant')}
        >
          <Box sx={{ 
            width: 60,
            height: 60,
            mx: 'auto', 
            mb: 1, 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5',
            borderRadius: '50%'
          }}>
            <SupportAgentIcon 
              sx={{ 
                fontSize: 32,
                color: 'primary.main'
              }}
            />
          </Box>
          <Typography variant="h6" gutterBottom>
            Consultant Help
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Email or Phone Consultation
          </Typography>
        </Box>

        {/* Info Center Button */}
        <Card 
          sx={{ 
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': { 
              transform: 'translateY(-2px)', 
              boxShadow: 4 
            }
          }}
          onClick={handleInfoCenter}
        >
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Box sx={{ 
              width: 60, 
              height: 60, 
              mx: 'auto', 
              mb: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: '#f5f5f5',
              borderRadius: '50%'
            }}>
              <BookIcon 
                sx={{ width: 30, height: 30, color: '#333' }}
              />
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              Info Center
            </Typography>
            <Typography variant="caption" color="text.secondary">
              More Books & Events
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Dictionary Dialog */}
      <Dialog 
        open={dictionaryDialogOpen} 
        onClose={() => setDictionaryDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pr: 2
        }}>
          <Typography variant="h6">
            Definition for "{selectedText}"
          </Typography>
          <IconButton 
            onClick={() => setDictionaryDialogOpen(false)}
            size="small"
            sx={{ 
              color: 'text.secondary',
              '&:hover': {
                color: 'text.primary'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {dictionaryLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : dictionaryError ? (
            <Typography color="error">{dictionaryError}</Typography>
          ) : dictionaryDefinition ? (
            <Box sx={{ py: 1 }}>
              {/* Definition Section */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Definition
                </Typography>
                <Typography variant="body1">
                  {dictionaryDefinition}
                </Typography>
              </Box>

              {/* Example Section */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Example
                </Typography>
                {isGeneratingExample ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="body2" color="text.secondary">
                      Generating example...
                    </Typography>
                  </Box>
                ) : example ? (
                  <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                    {example}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No example available
                  </Typography>
                )}
              </Box>

              {/* Origin Section */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Origin
                </Typography>
                <Typography variant="body1">
                  {wordOrigin || 'Origin not available'}
                </Typography>
              </Box>

              {/* AI Help Section */}
              <Box sx={{ 
                mt: 4,
                pt: 2,
                borderTop: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <Typography variant="body2" color="text.secondary">
                  Need deeper analysis?
                </Typography>
                <Button 
                  size="small" 
                  color="secondary"
                  onClick={handleAIAssistantClick}
                  disabled={AIAnalysisLoading}
                  sx={{ 
                    ml: 'auto',
                    '&:hover': {
                      backgroundColor: 'rgba(144, 202, 249, 0.08)'
                    }
                  }}
                >
                  {AIAnalysisLoading ? 'Analyzing...' : 'Ask AI'}
                </Button>
                <AutoAwesomeIcon 
                  color="secondary" 
                  fontSize="small"
                  sx={{ 
                    animation: 'sparkle 1.5s ease-in-out infinite',
                    '@keyframes sparkle': {
                      '0%': { opacity: 0.7 },
                      '50%': { opacity: 1 },
                      '100%': { opacity: 0.7 }
                    }
                  }}
                />
              </Box>
            </Box>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* AI Assistant Dialog */}
      <Dialog
        open={aiDialogOpen}
        onClose={handleCloseAIDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          AI Assistant
          <IconButton
            onClick={handleCloseAIDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom>
            Selected Text:
          </Typography>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              mb: 2,
              backgroundColor: 'grey.50',
              fontStyle: 'italic'
            }}
          >
            "{selectedText}"
          </Paper>
          
          <Typography variant="subtitle1" gutterBottom>
            AI Response:
          </Typography>
          {isAiLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                backgroundColor: 'background.paper',
                whiteSpace: 'pre-wrap'
              }}
            >
              {aiResponse}
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAIDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MainInteractionPage;
