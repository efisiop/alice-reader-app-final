/* eslint-disable @typescript-eslint/no-unused-vars */
// The above line disables unused variable warnings for this file
// Some variables are declared but not used yet as they will be used in future implementations

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { useBookService, useDictionaryService, useConsultantService } from '../../hooks/useService';
import { LoadingIndicator } from '../../components/common/LoadingIndicator';
import { useSnackbar } from '../../utils/notistackUtils';
import { fixAliceText, validateText } from '../../utils/textUtils';
import { appLog } from '../../components/LogViewer';
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
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import GlossaryAwareTextHighlighter from '../../components/Reader/GlossaryAwareTextHighlighter';
import { useGlossaryTerms } from '../../hooks/useGlossaryTerms';
import ConnectionStatus from '../../components/UI/ConnectionStatus';

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

// Common phrasal verbs for detection
const commonPhrasalVerbs = [
  'look up', 'find out', 'come across', 'run into', 'get up', 'sit down', 'stand up',
  'turn around', 'come back', 'go away', 'come in', 'go out', 'put on', 'take off',
  'pick up', 'put down', 'come up', 'go down', 'come out', 'go in', 'look down',
  'come over', 'go over', 'come through', 'go through', 'come along', 'go along',
  'come about', 'go about', 'go across', 'come after', 'go after', 'come before',
  'go before', 'come between', 'go between', 'come by', 'go by', 'come for',
  'go for', 'come from', 'go from', 'come into', 'go into', 'come of', 'go of',
  'come off', 'go off', 'come on', 'go on', 'come round', 'go round', 'come to',
  'go to', 'come under', 'go under', 'come upon', 'go upon', 'come with', 'go with'
];

// Simple phrasal verb detection function
const detectPhrasalVerb = (text: string): boolean => {
  const cleanText = text.toLowerCase().trim();
  return commonPhrasalVerbs.includes(cleanText);
};

const MainInteractionPage: React.FC = () => {
  // These hooks are kept for future implementation of navigation and error handling
  const navigate = useNavigate(); // Will be used for navigation between pages
  const { bookId = 'alice-in-wonderland' } = useParams<{ bookId?: string }>(); // Used to identify which book to load
  const { user, profile, loading: authLoading } = useAuth();
  const { service: bookService, loading: bookServiceLoading, error: bookServiceError } = useBookService();
  const { service: dictionaryService, loading: dictionaryServiceLoading, error: dictionaryServiceError } = useDictionaryService();
  const { service: consultantService } = useConsultantService();
  const { enqueueSnackbar } = useSnackbar(); // Will be used for notifications

  // Glossary terms for hover highlighting
  const { glossaryTerms, isLoading: glossaryLoading, error: glossaryError, termCount } = useGlossaryTerms();

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
  const [showAiButton, setShowAiButton] = useState(false);
  const [aiButtonPosition, setAiButtonPosition] = useState({ x: 0, y: 0 });

  // Dictionary state
  const [dictionaryLoading, setDictionaryLoading] = useState(false);
  const [dictionaryError, setDictionaryError] = useState<string | null>(null);
  const [dictionaryDefinition, setDictionaryDefinition] = useState<string | null>(null);
  const [dictionaryDialogOpen, setDictionaryDialogOpen] = useState(false);
  const [wordOrigin, setWordOrigin] = useState<string | null>(null);
  const [example, setExample] = useState<string | null>(null);
  const [isGeneratingExample, setIsGeneratingExample] = useState(false);
  const [dictionarySource, setDictionarySource] = useState<string | null>(null);
  const [isPhrasalVerb, setIsPhrasalVerb] = useState(false);

  // Add these state variables at the top with other states
  const [AIAnalysis, setAIAnalysis] = useState<string | null>(null);
  const [AIAnalysisLoading, setAIAnalysisLoading] = useState(false);
  const [AIAnalysisError, setAIAnalysisError] = useState<string | null>(null);
  const [AIAnalysisDialogOpen, setAIAnalysisDialogOpen] = useState(false);

  // Ref for tracking last interaction time
  const lastInteractionTime = useRef<number>(0);

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

  // Handle word selection for definitions
  const handleWordSelect = useCallback(async (word: string, element: HTMLElement, context?: string) => {
    // Clean the word
    const cleanWord = word.replace(/[.,!?;:'"]/g, '').trim();
    if (!cleanWord) return;
    
    setSelectedText(cleanWord);
    setDictionaryLoading(true);
    setDictionaryError(null);
    setDictionaryDefinition(null);
    setWordOrigin(null);
    setExample(null);
    setDictionarySource(null);
    setIsPhrasalVerb(false);
    setDictionaryDialogOpen(true);
    
    try {
      // Add a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (!dictionaryService) {
        throw new Error('Dictionary service not available');
      }

      // Get the current section ID for context
      const currentSectionId = selectedSection?.id;
      
      // Use context-aware dictionary service if context is available
      let result;
      if (context && context.trim().length > 0) {
        appLog('MainInteractionPage', 'Using context-aware definition lookup', 'info', { 
          word: cleanWord, 
          context: context.substring(0, 100) + '...' 
        });
        
        result = await dictionaryService.getContextAwareDefinition(
          ALICE_BOOK_UUID,
          cleanWord,
          context,
          currentSectionId
        );
      } else {
        // Fallback to regular definition lookup
        result = await dictionaryService.getDefinition(
          ALICE_BOOK_UUID,
          cleanWord,
          currentSectionId
        );
      }

      if (result && result.definition) {
        setDictionaryDefinition(result.definition);
        setWordOrigin(result.wordOrigin || null);
        setExample(result.examples && result.examples.length > 0 ? result.examples[0] : null);
        setDictionarySource(result.source || null);
        setIsPhrasalVerb(result.isPhrasalVerb || false);
        
        // Log the successful lookup
        if (user && selectedSection && consultantService) {
          consultantService.logConsultantAction(
            user.id,
            'DEFINITION_LOOKUP',
            { word: cleanWord, success: true, book_id: ALICE_BOOK_UUID, section_id: selectedSection.id }
          ).catch(err => console.error("Error logging dictionary lookup:", err));
        }
      } else {
        setDictionaryError('No definition found for this word.');
        
        // Log the failed lookup
        if (user && selectedSection && consultantService) {
          consultantService.logConsultantAction(
            user.id,
            'DEFINITION_LOOKUP',
            { word: cleanWord, success: false, book_id: ALICE_BOOK_UUID, section_id: selectedSection.id, error: dictionaryError }
          ).catch(err => console.error("Error logging dictionary lookup:", err));
        }
      }
    } catch (error) {
      console.error('Error fetching definition:', error);
      setDictionaryError('Error fetching definition. Please try again.');
      
      // Log the error
      if (user && selectedSection && consultantService) {
        consultantService.logConsultantAction(
          user.id,
          'DEFINITION_LOOKUP',
          { word: cleanWord, success: false, book_id: ALICE_BOOK_UUID, section_id: selectedSection.id, error: String(error) }
        ).catch(err => console.error("Error logging dictionary lookup:", err));
      }
    } finally {
      setDictionaryLoading(false);
    }
  }, [dictionaryService, selectedSection, user, consultantService]);

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
        // Log PAGE_SYNC event
        if (user && consultantService) {
          consultantService.logConsultantAction(user.id, 'PAGE_SYNC', { page_number: pageNum, book_id: ALICE_BOOK_UUID });
        }
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

        // Log SECTION_SYNC event
        if (user && consultantService) {
          consultantService.logConsultantAction(user.id, 'SECTION_SYNC', { section_id: sectionId, page_number: activePage, book_id: ALICE_BOOK_UUID });
        }
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

  const handleTextSelection = async () => {
    const selection = window.getSelection();
    if (!selection || !selection.toString().trim()) return;

    let selectedText = selection.toString().trim();
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Expand selection to full word/phrase (existing logic)
    const anchorNode = selection.anchorNode;
    let expanded = null;
    if (anchorNode && anchorNode.nodeType === Node.TEXT_NODE) {
      const textContent = anchorNode.textContent || '';
      const startOffset = selection.anchorOffset;
      const endOffset = selection.focusOffset;
      expanded = expandSelectionToWords(textContent, startOffset, endOffset);
      if (expanded) {
        // Check if user selected multiple words or if it's a phrasal verb
        const originalSelection = selection.toString().trim();
        const originalWordCount = originalSelection.split(/\s+/).length;
        const isPhrasalVerb = detectPhrasalVerb(expanded.phrase);
        
        // Use phrase only if user selected multiple words OR if it's a known phrasal verb
        if (originalWordCount > 1 || isPhrasalVerb) {
          selectedText = expanded.phrase || expanded.singleWord;
        } else {
          // Default to single word for single-word selections
          selectedText = expanded.singleWord;
        }
        selectedText = selectedText.trim();
      }
    }

    // Count words
    const wordCount = selectedText.split(/\s+/).length;

    if (wordCount > 5) {
      // Show AI assistant button for long selections
      setShowAiButton(true);
      setAiButtonPosition({ x: rect.left, y: rect.bottom });
      setDictionaryDialogOpen(false);
      return;
    }

    // Try dictionary lookup for 1-5 words
    setDictionaryLoading(true);
    setDictionaryError(null);
    setDictionaryDefinition(null);
    setDictionaryDialogOpen(true);
    setSelectedText(selectedText);
    setShowAiButton(false);

    // Try to fetch definition (local glossary or external API)
    try {
      await fetchDictionaryDefinition(selectedText);
    } catch (err) {
      setDictionaryError('Error fetching definition.');
    } finally {
      setDictionaryLoading(false);
    }
  };

  // Handle AI button click
  const handleAiButtonClick = async () => {
    setAiDialogOpen(true);
    setShowAiButton(false);
    setIsAiLoading(true);
    setAiResponse('');

    try {
      // Simulate AI response for now
      const simulatedResponse = `AI response for: "${selectedText}"`;
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
      setAiResponse(simulatedResponse);

      // Log AI_QUERY event
      if (user && consultantService && selectedSection) {
        consultantService.logConsultantAction(
          user.id,
          'AI_QUERY',
          { query: selectedText, response: simulatedResponse, book_id: ALICE_BOOK_UUID, section_id: selectedSection.id }
        ).catch(err => console.error("Error logging AI query:", err));
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      setAiResponse('Failed to get AI response. Please try again.');
      // Log failed AI_QUERY event
      if (user && consultantService && selectedSection) {
        consultantService.logConsultantAction(
          user.id,
          'AI_QUERY',
          { query: selectedText, response: 'Failed', book_id: ALICE_BOOK_UUID, section_id: selectedSection.id, error: String(error) }
        ).catch(err => console.error("Error logging AI query:", err));
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  // Handle AI dialog close
  const handleCloseAIDialog = () => {
    setAiDialogOpen(false);
    setAiResponse('');
  };

  // Handle dictionary dialog close
  const handleCloseDictionaryDialog = () => {
    setDictionaryDialogOpen(false);
    setDictionaryDefinition(null);
    setDictionaryError(null);
    setWordOrigin(null);
    setExample(null);
    setDictionarySource(null);
    setIsPhrasalVerb(false);
  };

  // Fetch dictionary definition
  const fetchDictionaryDefinition = async (word: string) => {
    setDictionaryLoading(true);
    setDictionaryError(null);
    setDictionaryDefinition(null);
    setWordOrigin(null);
    setExample(null);
    setDictionarySource(null);
    setIsPhrasalVerb(false);
    
    try {
      // Add a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (!dictionaryService) {
        throw new Error('Dictionary service not available');
      }

      // Get the current section ID for context
      const currentSectionId = selectedSection?.id;
      
      // Use the enhanced dictionary service
      const result = await dictionaryService.getDefinition(
        ALICE_BOOK_UUID,
        word,
        currentSectionId
      );

      if (result && result.definition) {
        setDictionaryDefinition(result.definition);
        setWordOrigin(result.wordOrigin || null);
        setExample(result.examples && result.examples.length > 0 ? result.examples[0] : null);
        setDictionarySource(result.source || null);
        setIsPhrasalVerb(result.isPhrasalVerb || false);
        
        // Log the successful lookup
        if (user && selectedSection && consultantService) {
          consultantService.logConsultantAction(
            user.id,
            'DEFINITION_LOOKUP',
            { word: word, success: true, book_id: ALICE_BOOK_UUID, section_id: selectedSection.id }
          ).catch(err => console.error("Error logging dictionary lookup:", err));
        }
      } else {
        setDictionaryError('No definition found for this word.');
        
        // Log the failed lookup
        if (user && selectedSection && consultantService) {
          consultantService.logConsultantAction(
            user.id,
            'DEFINITION_LOOKUP',
            { word: word, success: false, book_id: ALICE_BOOK_UUID, section_id: selectedSection.id, error: dictionaryError }
          ).catch(err => console.error("Error logging dictionary lookup:", err));
        }
      }
    } catch (error) {
      console.error('Error fetching definition:', error);
      setDictionaryError('Failed to fetch definition. Please try again.');
    } finally {
      setDictionaryLoading(false);
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
        setSelectedText(selectedText);
        setDictionaryDialogOpen(true);
        await fetchDictionaryDefinition(selectedText);
      } else {
        // Multiple words: check if it's a phrasal verb first
        const phrasalVerbInfo = detectPhrasalVerb(selectedText);
        
        if (phrasalVerbInfo) {
          // It's a phrasal verb: show dictionary dialog
          setSelectedText(selectedText);
          setDictionaryDialogOpen(true);
          await fetchDictionaryDefinition(selectedText);
        } else {
          // Multiple words that aren't a phrasal verb: show AI assistant
          setSelectedText(selectedText);
          setShowAiButton(true);
          
          // Position the AI button near the selection
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          setAiButtonPosition({
            x: rect.left + rect.width / 2,
            y: rect.bottom + 10
          });
        }
      }
    } catch (error) {
      console.error("Error in dictionary lookup:", error);
      setDictionaryError("Failed to look up definition. Please try again.");
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

  // Add event listeners for text selection
  useEffect(() => {
    document.addEventListener('mouseup', handleTextSelection);
    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
    };
  }, []);

  // Add click outside listener to hide AI button
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showAiButton) {
        setShowAiButton(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAiButton]);

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
                     {/* Display section content with glossary-aware highlighting */}
                     <Box
                       ref={sectionContentRef}
                       sx={{
                         position: 'relative',
                         minHeight: '200px',
                         height: '100%'
                       }}
                     >
                       <GlossaryAwareTextHighlighter
                         text={fixAliceText(selectedSection.content)}
                         onWordSelect={handleWordSelect}
                         onTextSelect={handleTextSelection}
                         fontSize="1.1rem"
                         lineHeight={1.8}
                         fontFamily="Georgia, serif"
                         glossaryTerms={glossaryTerms}
                         normalWordHoverColor="rgba(25, 118, 210, 0.1)"
                         technicalWordHoverColor="rgba(255, 152, 0, 0.2)"
                       />
                     </Box>

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

                     {/* Glossary terms indicator */}
                     {!glossaryLoading && termCount > 0 && (
                       <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                         ✨ Hover over words to see highlights: {termCount} technical terms available
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

      {/* AI Button */}
      {showAiButton && (
        <Box
          sx={{
            position: 'absolute',
            left: aiButtonPosition.x,
            top: aiButtonPosition.y,
            zIndex: 1000,
          }}
        >
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={handleAiButtonClick}
            startIcon={<AutoAwesomeIcon />}
            sx={{
              backgroundColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
              boxShadow: 2,
            }}
          >
            Ask AI Assistant
          </Button>
        </Box>
      )}

      {/* Dictionary Dialog */}
      <Dialog
        open={dictionaryDialogOpen}
        onClose={handleCloseDictionaryDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Definition for "{selectedText}"
          {isPhrasalVerb && (
            <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 1 }}>
              📝 Phrasal Verb
            </Typography>
          )}
          {dictionarySource && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Source: {dictionarySource === 'glossary' ? 'Alice Glossary' : 
                       dictionarySource === 'external' ? 'Free Dictionary API' : 
                       dictionarySource === 'database' ? 'Database' : 
                       dictionarySource === 'not_found' ? 'Not Found' : dictionarySource}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {dictionaryLoading ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center', 
              alignItems: 'center',
              p: 4,
              minHeight: '200px'
            }}>
              <CircularProgress size={40} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Looking up definition...
              </Typography>
            </Box>
          ) : dictionaryError ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center', 
              alignItems: 'center',
              p: 4,
              minHeight: '200px'
            }}>
              <Typography color="error" variant="h6" gutterBottom>
                Definition Not Found
              </Typography>
              <Typography color="text.secondary" textAlign="center">
                {dictionaryError}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                Try selecting a different word or phrase.
              </Typography>
            </Box>
          ) : (
            <>
              <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 'bold', mt: 1 }}>
                Definition
              </Typography>
              <Typography variant="body1" paragraph>
                {dictionaryDefinition || 'No definition available'}
              </Typography>
              
              {example && (
                <>
                  <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 'bold', mt: 2 }}>
                    Example
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {example}
                  </Typography>
                </>
              )}
              
              {wordOrigin && (
                <>
                  <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 'bold', mt: 2 }}>
                    Origin
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {wordOrigin}
                  </Typography>
                </>
              )}
              
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                  Need deeper analysis?
                </Typography>
                <Button
                  variant="text"
                  color="secondary"
                  startIcon={<AutoAwesomeIcon />}
                  onClick={handleAiButtonClick}
                  sx={{ fontWeight: 'bold' }}
                >
                  Ask AI
                </Button>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDictionaryDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* AI Dialog */}
      <Dialog
        open={aiDialogOpen}
        onClose={handleCloseAIDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Explanation
        </DialogTitle>
        <DialogContent>
          {isAiLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Typography variant="body1">
              {aiResponse}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAIDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Connection Status Indicator */}
      <ConnectionStatus />
    </Box>
  );
};

export default MainInteractionPage;
