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
  CircularProgress
} from '@mui/material';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useBookService, useDictionaryService } from '../../hooks/useService';
import { LoadingIndicator } from '../../components/common/LoadingIndicator';
import { useSnackbar } from '../../utils/notistackUtils';
import CloseIcon from '@mui/icons-material/Close';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import NoteIcon from '@mui/icons-material/Note';
import HelpIcon from '@mui/icons-material/Help';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import { readerService, SectionSnippet } from '../../services/readerService';

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
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [definitionData, setDefinitionData] = useState<DefinitionData | null>(null);
  const [isLoadingDefinition, setIsLoadingDefinition] = useState<boolean>(false);

  // Ref for the text area where section content is displayed for highlighting
  const sectionContentRef = useRef<HTMLDivElement>(null);

  // Ref for the page input field to focus on it when the component loads
  const pageInputRef = useRef<HTMLInputElement>(null);

  // We'll use this to conditionally render content
  const [isReady, setIsReady] = useState<boolean>(false);

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
     console.log('[DEBUG] handleSectionSelect triggered. Received sectionId:', sectionId);
     console.log('[DEBUG] Current sectionSnippets array length:', sectionSnippets.length);
     console.log('[DEBUG] Current sectionSnippets array:', sectionSnippets);

     // Verify the function is being called with the correct parameter
     if (typeof sectionId !== 'string') {
       console.error('[DEBUG] CRITICAL: sectionId is not a string:', sectionId);
       setFetchError(`Error: Invalid section ID type. Please try again.`);
       return;
     }

     if (!sectionId) {
       console.error('[DEBUG] CRITICAL: sectionId is missing or empty!');
       setFetchError(`Error: Invalid section ID. Please try again.`);
       return;
     }

     console.log('[DEBUG] Attempting to extract snippet for sectionId:', sectionId);

     // Find the selected snippet to get basic info
     const snippet = sectionSnippets.find(s => s.id === sectionId);
     console.log('[DEBUG] Found snippet for sectionId:', snippet);

     if (!snippet) {
       console.error(`[DEBUG] CRITICAL: No snippet found with ID: ${sectionId}`);
       setFetchError(`Error: Could not find section information. Please try again.`);
       return;
     }

     console.log('[DEBUG] Selected snippet:', snippet);

     setIsLoadingSections(true); // Use same loading state for fetching full content
     setFetchError(null);
     setSelectedSection(null);
     console.log(`[DEBUG] Fetching full content for section: ${sectionId}`);
     console.log(`[DEBUG] About to call readerService.getSection with ID: ${sectionId}`);
     console.log(`[DEBUG] readerService object available:`, !!readerService);
     console.log(`[DEBUG] readerService.getSection function available:`, typeof readerService.getSection === 'function');

     // Track retry attempts
     let retryCount = 0;
     const maxRetries = 2;
     const retryDelay = 1000; // 1 second

     const attemptFetch = async (): Promise<SectionDetail | null> => {
       try {
         console.log(`[DEBUG] Attempt ${retryCount + 1}/${maxRetries + 1} to fetch section ${sectionId}`);
         console.log(`[DEBUG] Calling readerService.getSection with ID: ${sectionId}`);

         // Use the readerService to get full section content
         const fullSection = await readerService.getSection(sectionId);
         console.log('[DEBUG] Service call returned. Data:', fullSection);

         if (!fullSection) {
           console.error('[DEBUG] CRITICAL: Received null or undefined from service call');
           throw new Error('No data received from server');
         }

         // Add detailed logging of the response
         console.log('[DEBUG] Section ID:', fullSection?.id);
         console.log('[DEBUG] Section Title:', fullSection?.title);
         console.log('[DEBUG] Section Content Type:', typeof fullSection?.content);
         console.log('[DEBUG] Section Content Length:', fullSection?.content?.length || 0);
         console.log('[DEBUG] Section Content Preview:', fullSection?.content?.substring(0, 100) || 'No content');
         console.log('[DEBUG] Section Chapter:', fullSection?.chapter);

         if (!fullSection) {
           console.error('Section data is null or undefined');
           throw new Error('No section data received from server');
         }

         if (!fullSection.content) {
           console.error('Section content is missing:', fullSection);
           throw new Error('Received section data without content');
         }

         if (fullSection.content.length === 0) {
           console.error('Section content is empty:', fullSection);
           throw new Error('Received empty section content from server');
         }

         // Transform to expected format
         const sectionDetail: SectionDetail = {
           id: fullSection.id,
           number: snippet.number, // Keep the number from snippet since it might not be in the full section object
           preview: snippet.preview,
           content: fullSection.content
         };

         console.log('Created section detail object:', sectionDetail);
         console.log('Content length in detail object:', sectionDetail.content.length);

         return sectionDetail;
       } catch (err: any) {
         console.error(`Error fetching section content (attempt ${retryCount + 1}/${maxRetries + 1}):`, err);
         console.error('Error details:', err.message);
         console.error('Error stack:', err.stack);

         if (retryCount < maxRetries) {
           retryCount++;
           console.log(`Retrying in ${retryDelay}ms...`);
           await new Promise(resolve => setTimeout(resolve, retryDelay));
           return attemptFetch(); // Recursive retry
         }

         throw err; // Re-throw if all retries failed
       }
     };

     try {
       const sectionDetail = await attemptFetch();

       if (sectionDetail) {
         console.log('Setting selected section with content:', sectionDetail);

         // Create a guaranteed working section with content
         const guaranteedSection: SectionDetail = {
           id: sectionDetail.id || sectionId,
           number: snippet.number,
           preview: snippet.preview,
           content: sectionDetail.content || `This is guaranteed mock content for section ${snippet.number}.

           Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

           Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`
         };

         console.log('[DEBUG] Using guaranteed section with content:', guaranteedSection);
         console.log('[DEBUG] Content to be set in state:', guaranteedSection.content?.substring(0, 100) + '...');

         // Explicitly check content before setting state
         if (!guaranteedSection.content) {
           console.error('[DEBUG] CRITICAL: guaranteedSection.content is still empty or null before setState!');
         } else {
           console.log('[DEBUG] Content length before setState:', guaranteedSection.content.length);
         }

         // Update state with the section content
         setSelectedSection(guaranteedSection);
         console.log('[DEBUG] State update called with guaranteedSection');

         setSectionSnippets([]); // Hide snippets once full section is loaded
         clearDefinition(); // Clear any previous definition

         // Update the current step to content interaction
         setCurrentStep('content_interaction');

         // Log success to console for debugging
         console.log('Section content loaded successfully:', guaranteedSection.content.substring(0, 100) + '...');
       }
     } catch (err: any) {
       console.error('All attempts to fetch section content failed:', err);

       // Instead of showing an error, create an emergency fallback section
       console.log('Creating emergency fallback section with content');

       const emergencySection: SectionDetail = {
         id: sectionId,
         number: snippet.number,
         preview: snippet.preview,
         content: `[EMERGENCY FALLBACK CONTENT]

         This is emergency fallback content for section ${snippet.number}. The actual content could not be loaded due to an error:

         Error: ${err.message || 'Unknown error'}

         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

         Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`
       };

       console.log('Using emergency fallback section:', emergencySection);
       setSelectedSection(emergencySection);
       setSectionSnippets([]); // Hide snippets
       setCurrentStep('content_interaction');

       // Still show the error message to the user
       setFetchError(`Warning: Using fallback content for section ${snippet.number}. ${err.message || 'Please check your network connection and try again.'}`);

       // Show a more detailed error in the console for debugging
       console.error('Error details:', err);

       // Attempt to log the error to the server if analytics service is available
       if (window.logError) {
         window.logError('section_content_fetch_failed', {
           sectionId,
           error: err.message,
           stack: err.stack
         });
       }
     } finally {
       setIsLoadingSections(false);
     }
  };

  /**
   * Expands a selection to include full words
   * @param text The full text content
   * @param startOffset The starting offset of the selection
   * @param endOffset The ending offset of the selection
   * @param multiWordMode How to handle multi-word selections: 'first' (first word only), 'last' (last word only), or 'all' (all words)
   * @returns An object with the expanded start and end offsets
   */
  const expandSelectionToWords = (text: string, startOffset: number, endOffset: number, multiWordMode: 'first' | 'last' | 'all' = 'first') => {
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

    // Check if the selection spans multiple words
    const selectedText = text.substring(expandedStart, expandedEnd);
    const containsWhitespace = /\s/.test(selectedText);

    if (containsWhitespace && multiWordMode !== 'all') {
      // Handle multi-word selection based on the specified mode
      if (multiWordMode === 'first') {
        // Find the end of the first word
        let firstWordEnd = expandedStart;
        while (firstWordEnd < expandedEnd && !whitespacePattern.test(text[firstWordEnd])) {
          firstWordEnd++;
        }
        expandedEnd = firstWordEnd;
      } else if (multiWordMode === 'last') {
        // Find the start of the last word
        let lastWordStart = expandedEnd;
        while (lastWordStart > expandedStart && !whitespacePattern.test(text[lastWordStart - 1])) {
          lastWordStart--;
        }
        while (lastWordStart > expandedStart && whitespacePattern.test(text[lastWordStart - 1])) {
          lastWordStart--;
        }
        expandedStart = lastWordStart;
      }
    }

    return { expandedStart, expandedEnd };
  };

  /**
   * Cleans a word by removing surrounding punctuation
   * @param word The word to clean
   * @returns The cleaned word
   */
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

    return cleaned;
  };

  const handleTextSelection = async () => {
    try {
      // Get the selection object
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || !selectedSection) return;

      // Get the selected text
      const selectedText = selection.toString().trim();
      if (!selectedText) return;

      // Skip very long selections (likely paragraphs, not words)
      if (selectedText.length > 50) {
        console.log("Selection too long for definition lookup:", selectedText.length, "characters");
        return;
      }

      // Skip very short selections (likely accidental clicks)
      if (selectedText.length < 2) {
        console.log("Selection too short for definition lookup:", selectedText.length, "characters");
        return;
      }

      console.log("Original highlight detected:", selectedText);

      // Get the range of the selection
      const range = selection.getRangeAt(0);

      // Check if the selection spans multiple nodes
      const isMultiNodeSelection = range.startContainer !== range.endContainer;

      let fullText: string;
      let textNode: Node;

      if (isMultiNodeSelection) {
        // For multi-node selections, we'll use the common ancestor container
        // and work with its text content
        textNode = range.commonAncestorContainer;

        // If the common ancestor is not a text node, use its text content
        // This will include all text within the container
        fullText = textNode.textContent || '';

        // For multi-node selections, we'll just use the selected text directly
        // and clean it, rather than trying to expand it
        console.log("Multi-node selection detected, using selected text directly");

        // Clean the selected text
        const cleanedText = cleanWord(selectedText);

        // If the cleaned text is empty, return
        if (!cleanedText) return;

        // Proceed with definition lookup using the cleaned selected text
        setIsLoadingDefinition(true);
        setDefinitionData(null); // Clear previous

        try {
          // Use the dictionaryService to get the definition
          const definitionEntry = await dictionaryService.getDefinition(ALICE_BOOK_UUID, cleanedText);

          if (definitionEntry) {
            setDefinitionData({
              word: cleanedText,
              definition: definitionEntry.definition,
              examples: definitionEntry.examples || [],
              source: definitionEntry.source || 'database'
            });

            // Log the successful dictionary lookup if user is logged in
            if (user) {
              dictionaryService.logDictionaryLookup(
                user.id,
                ALICE_BOOK_UUID,
                selectedSection?.id,
                cleanedText,
                true
              ).catch(err => console.error("Error logging dictionary lookup:", err));
            }
          } else {
            setDefinitionData({ word: cleanedText, definition: `No definition found for "${cleanedText}".`, examples: [], source: 'not_found' });

            // Log the failed dictionary lookup if user is logged in
            if (user) {
              dictionaryService.logDictionaryLookup(
                user.id,
                ALICE_BOOK_UUID,
                selectedSection?.id,
                cleanedText,
                false
              ).catch(err => console.error("Error logging dictionary lookup:", err));
            }
          }
        } catch (err: any) {
          console.error("Error fetching definition:", err);
          setDefinitionData({ word: cleanedText, definition: `Error looking up "${cleanedText}".`, examples: [], source: 'error' });
        } finally {
          setIsLoadingDefinition(false);
        }

        return;
      }

      // For single node selections, proceed with the normal expansion logic
      textNode = range.startContainer;

      // Make sure we're working with a text node
      if (textNode.nodeType !== Node.TEXT_NODE) return;

      // Get the full text content of the node
      fullText = textNode.textContent || '';

      // Get the start and end offsets of the selection within the text node
      const startOffset = range.startOffset;
      const endOffset = range.endOffset;

      // Expand the selection to include full words (use 'first' mode for multi-word selections)
      const { expandedStart, expandedEnd } = expandSelectionToWords(fullText, startOffset, endOffset, 'first');

      // Extract the expanded text
      const expandedText = fullText.substring(expandedStart, expandedEnd);

      // Log the expansion process
      if (expandedText !== selectedText) {
        console.log(`Selection expanded from "${selectedText}" to "${expandedText}"`);

        // If the expanded text is significantly different from the original selection
        // (e.g., the user selected just a single character in a long word),
        // we might want to be more conservative. For now, we'll proceed with the expansion.
        const expansionRatio = expandedText.length / selectedText.length;
        if (expansionRatio > 5) {
          console.log(`Significant expansion detected (${expansionRatio.toFixed(1)}x). Proceeding anyway.`);
        }
      }

      // Clean the expanded text (remove surrounding punctuation)
      const cleanedText = cleanWord(expandedText);

      // If the expanded text is empty after cleaning, return
      if (!cleanedText) return;

      console.log("Expanded to full word:", cleanedText);

      // Proceed with definition lookup using the expanded text
      setIsLoadingDefinition(true);
      setDefinitionData(null); // Clear previous

      try {
        // Use the dictionaryService to get the definition
        const definitionEntry = await dictionaryService.getDefinition(ALICE_BOOK_UUID, cleanedText);

        if (definitionEntry) {
          setDefinitionData({
            word: cleanedText,
            definition: definitionEntry.definition,
            examples: definitionEntry.examples || [],
            source: definitionEntry.source || 'database'
          });

          // Log the successful dictionary lookup if user is logged in
          if (user) {
            dictionaryService.logDictionaryLookup(
              user.id,
              ALICE_BOOK_UUID,
              selectedSection?.id,
              cleanedText,
              true
            ).catch(err => console.error("Error logging dictionary lookup:", err));
          }
        } else {
          setDefinitionData({ word: cleanedText, definition: `No definition found for "${cleanedText}".`, examples: [], source: 'not_found' });

          // Log the failed dictionary lookup if user is logged in
          if (user) {
            dictionaryService.logDictionaryLookup(
              user.id,
              ALICE_BOOK_UUID,
              selectedSection?.id,
              cleanedText,
              false
            ).catch(err => console.error("Error logging dictionary lookup:", err));
          }
        }
      } catch (err: any) {
        console.error("Error fetching definition:", err);
        setDefinitionData({ word: cleanedText, definition: `Error looking up "${cleanedText}".`, examples: [], source: 'error' });
      } finally {
        setIsLoadingDefinition(false);
      }
    } catch (error) {
      // Handle any errors that might occur during the text selection process
      console.error("Error in text selection handling:", error);
      // Don't show an error to the user, just silently fail
    }
  };

  const clearDefinition = () => {
     setSelectedText(null);
     setDefinitionData(null);
     setIsLoadingDefinition(false);
  };

  // Handle AI Assistant button click
  const handleAskAI = () => {
    console.log('AI Assistant Clicked - Section Context:', selectedSection);
    // Future implementation will open the AI chat interface
    enqueueSnackbar('AI Assistant feature coming soon!', { variant: 'info' });
  };

   // Add Escape key listener (keep existing logic)
   useEffect(() => {
     const handleKeyDown = (event: KeyboardEvent) => {
       if (event.key === 'Escape') {
         clearDefinition();
       }
     };
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
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}> {/* Adjust height based on Header */}

      {/* Main Content Area (Approx 90-95%) */}
      <Box sx={{ flexGrow: 1, p: 3, overflowY: 'auto' }}>
        {/* Welcome Message */}
        <Box sx={{ display: 'flex', flexDirection: 'column', mb: 3 }}>
          <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
            Hi {profile?.first_name || 'Reader'},
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Let me help you with your Alice in Wonderland book
          </Typography>
        </Box>

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
          <Typography variant="h6" color="primary" gutterBottom>
            Step 1: Tell me what page you're reading
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
            <Typography sx={{ whiteSpace: 'nowrap' }}>What page are you on?</Typography>
            <TextField
              inputRef={pageInputRef}
              type="number"
              size="small"
              variant="outlined"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              sx={{ maxWidth: '150px' }}
              onKeyDown={(e) => e.key === 'Enter' && handlePageSubmit()}
              placeholder="Enter page #"
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

          {currentStep === 'page_input' && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Enter the page number from your physical book to find the corresponding sections.
            </Typography>
          )}
        </Paper>

        {/* Section Selection / Display Area */}
        <Box sx={{ minHeight: '300px' /* Adjust */ }}>
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
                transition: 'all 0.3s ease'
              }}
            >
              <Typography variant="h6" color="primary" gutterBottom>
                Step 2: Select the section you're reading
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                I found {sectionSnippets.length} section{sectionSnippets.length !== 1 ? 's' : ''} on page {activePage}.
                Click on the section that matches what you're currently reading in your book.
              </Typography>

              <List>
                {sectionSnippets.map((snippet) => {
                  console.log('[DEBUG] Rendering snippet element with ID:', snippet.id);
                  return (
                    <ListItem
                      key={snippet.id}
                      onClick={() => {
                        console.log('[DEBUG] Snippet clicked with ID:', snippet.id);
                        handleSectionSelect(snippet.id);
                      }}
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
                  );
                })}
              </List>
            </Paper>
          )}

          {/* Display Selected Section Content */}
          {console.log('[DEBUG] Rendering section content area. Current state:', {
            isLoadingSections,
            fetchError: fetchError ? 'Error exists' : 'No error',
            selectedSection: selectedSection ? 'Has value' : 'Null',
            currentStep,
            contentLength: selectedSection?.content?.length || 0
          })}

          {!isLoadingSections && !fetchError && selectedSection && (
             <Paper
                elevation={currentStep === 'content_interaction' ? 3 : 1}
                sx={{
                  p: 3,
                  mt: 2,
                  borderLeft: currentStep === 'content_interaction' ? '4px solid' : 'none',
                  borderColor: 'primary.main',
                  transition: 'all 0.3s ease'
                }}
                ref={sectionContentRef}
                onMouseUp={handleTextSelection} // Trigger definition lookup
             >
               {console.log('[DEBUG] Rendering Step 3 content. selectedSection.content:',
                 selectedSection.content ?
                 `${selectedSection.content.substring(0, 100)}... (${selectedSection.content.length} chars)` :
                 'NULL OR EMPTY')}
               <Typography variant="h6" color="primary" gutterBottom>
                 Step 3: Interact with the text
               </Typography>

               <Box sx={{
                 display: 'flex',
                 alignItems: 'center',
                 mb: 2,
                 p: 2,
                 backgroundColor: 'info.light',
                 borderRadius: 1,
                 color: 'info.contrastText'
               }}>
                 <Typography variant="body2">
                   <strong>Tip:</strong> Highlight any word or phrase you'd like to understand better.
                   I'll show you definitions in the sidebar.
                 </Typography>
               </Box>

               <Box
                 sx={{
                   p: 2,
                   border: '1px solid',
                   borderColor: 'divider',
                   borderRadius: 1,
                   backgroundColor: 'background.paper',
                   position: 'relative',
                   minHeight: '200px'
                 }}
               >
                 {/* ULTRA SIMPLE CONTENT DISPLAY */}
                 <Box sx={{ p: 3, border: '1px solid #2196f3', borderRadius: 2, bgcolor: '#fff' }}>
                   <Typography
                     variant="body1"
                     component="div"
                     sx={{
                       fontSize: '1.1rem',
                       lineHeight: 1.8,
                       fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                       color: '#333',
                       whiteSpace: 'pre-wrap'
                     }}
                   >
                     {selectedSection.content || 'No content available'}
                   </Typography>
                 </Box>
               </Box>
             </Paper>
          )}
        </Box>
      </Box>

      {/* Sidebar (Approx 5-10%) */}
      <Paper elevation={3} sx={{
          width: '250px', // Fixed width might be easier than percentage initially
          // OR use flex basis: flexBasis: '10%', flexShrink: 0,
          borderLeft: '1px solid',
          borderColor: 'divider',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto'
      }}>
        <Typography variant="h6" gutterBottom>Companion</Typography>

        {/* Current Location Display */}
        <Box mb={2}>
          <Typography variant="overline">Location</Typography>
          <Typography variant="body2">
             {activePage ? `Page ${activePage}` : 'Sync Page Above'}
             {selectedSection ? `, Section ${selectedSection.number}` : ''}
          </Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />

        {/* Definition Area */}
        <Box mb={2} flexGrow={1}> {/* Allow this area to grow */}
          <Typography variant="overline">Definition</Typography>
          {isLoadingDefinition && <CircularProgress size={20} />}
          {definitionData && (
             <Box>
                <IconButton size="small" onClick={clearDefinition} sx={{ float: 'right' }}><CloseIcon fontSize="small"/></IconButton>
                <Typography variant="body1" fontWeight="bold">{definitionData.word}</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>{definitionData.definition}</Typography>
                {/* Add examples later */}
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>Source: {definitionData.source}</Typography>
             </Box>
          )}
          {!isLoadingDefinition && !definitionData && (
            <Typography variant="caption" color="text.secondary">
              Highlight text in the section content area to look up definitions.
            </Typography>
          )}
        </Box>
        <Divider sx={{ mb: 2 }} />

        {/* AI Assistant Area */}
        <Box>
           <Typography variant="overline">AI Assistant</Typography>
           <Button
              size="small"
              variant="contained"
              color="primary"
              startIcon={<QuestionAnswerIcon />}
              sx={{
                mt: 1,
                width: '100%',
                display: 'flex',
                justifyContent: 'flex-start',
                textTransform: 'none',
                boxShadow: 2,
                '&:hover': { boxShadow: 3 }
              }}
              disabled={!selectedSection}
              onClick={handleAskAI}
           >
              Ask AI about this section
           </Button>
           {!selectedSection && (
             <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
               Select a section to enable AI assistance.
             </Typography>
           )}
           {/* AI Chat interface will go here */}
        </Box>
         <Divider sx={{ my: 2 }} />
         {/* Notes Area (Placeholder) */}
         <Box>
            <Typography variant="overline">Notes</Typography>
             <Button size="small" variant="outlined" sx={{ mt: 1 }} disabled={!selectedSection}>
              Add Note
           </Button>
         </Box>

         <Divider sx={{ my: 2 }} />
         {/* Quick Links */}
         <Box>
            <Typography variant="overline">My Reading</Typography>
            <List dense sx={{ mt: 1 }}>
              <ListItem button component={RouterLink} to="/reader/statistics" sx={{ borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}>
                <ListItemIcon sx={{ minWidth: '30px' }}>
                  <EqualizerIcon fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText primary="My Progress & Stats" primaryTypographyProps={{ variant: 'body2' }} />
              </ListItem>
              <ListItem button onClick={() => alert('Notes feature coming soon!')} sx={{ borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}>
                <ListItemIcon sx={{ minWidth: '30px' }}>
                  <NoteIcon fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText primary="My Notes" primaryTypographyProps={{ variant: 'body2' }} />
              </ListItem>
            </List>
         </Box>

         <Divider sx={{ my: 2 }} />
         {/* Help & Tutorials */}
         <Box>
            <Typography variant="overline">Help & Tutorials</Typography>
            <List dense sx={{ mt: 1 }}>
              <ListItem button component={RouterLink} to="/reader" sx={{ borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}>
                <ListItemIcon sx={{ minWidth: '30px' }}>
                  <MenuBookIcon fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText primary="Welcome Page" primaryTypographyProps={{ variant: 'body2' }} />
              </ListItem>
              <ListItem button onClick={() => alert('Tutorials coming soon!')} sx={{ borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}>
                <ListItemIcon sx={{ minWidth: '30px' }}>
                  <HelpIcon fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText primary="Tutorials" primaryTypographyProps={{ variant: 'body2' }} />
              </ListItem>
            </List>
         </Box>

      </Paper>
    </Box>
  );
};

export default MainInteractionPage;