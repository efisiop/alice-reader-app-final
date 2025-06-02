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

        // Provide a more user-friendly error message
        let errorMessage = `Failed to load content for section ${snippetToUse.number}.`;

        if (err.message.includes('empty response') || err.message.includes('incomplete')) {
          errorMessage = 'The section content could not be loaded completely. Please try again.';
        } else if (err.message) {
          errorMessage += ` ${err.message}`;
        }

        setFetchError(errorMessage);

        // Only clear selected section if this is not a retry
        if (!selectedSection) {
          setSelectedSection(null);
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
        {/* Removed redundant greeting and help text */}
        
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
          {/* Removed 'Step 1: Tell me what page you're reading' */}

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
                  mt: 2,
                  borderLeft: currentStep === 'content_interaction' ? '4px solid' : 'none',
                  borderColor: 'primary.main',
                  transition: 'all 0.3s ease'
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
                   position: 'relative'
                 }}
               >
                 {selectedSection.content ? (
                   <>
                     {/* Display section content with proper formatting */}
                     <Typography
                       variant="body1"
                       sx={{
                         whiteSpace: 'pre-wrap',
                         lineHeight: 1.8,
                         '& p': { marginBottom: 2 },
                         '& .paragraph': { marginBottom: 2 }
                       }}
                     >
                       {/* Split content by paragraphs and render each one */}
                       {selectedSection.content
                         .split(/\n\s*\n/)
                         .map((paragraph, index) => (
                           <React.Fragment key={index}>
                             {paragraph.trim()}
                             {index < selectedSection.content.split(/\n\s*\n/).length - 1 && (
                               <Box component="span" sx={{ display: 'block', my: 2 }} />
                             )}
                           </React.Fragment>
                         ))}
                     </Typography>

                     {/* Show content length for debugging */}
                     {import.meta.env.DEV && (
                       <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                         Content length: {selectedSection.content.length} characters
                       </Typography>
                     )}
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
