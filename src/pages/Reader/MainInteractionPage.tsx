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
  CardContent
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
import InfoIcon from '@mui/icons-material/Info';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
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
    try {
      // Get the selection object
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || !selectedSection) return;

      // Get the selected text
      const selectedText = selection.toString().trim();
      if (!selectedText) return;

      // Skip very long selections (likely paragraphs, not words)
      if (selectedText.length > 100) {
        console.log("Selection too long for definition lookup:", selectedText.length, "characters");
        return;
      }

      // Skip very short selections (likely accidental clicks)
      if (selectedText.length < 1) {
        console.log("Selection too short for definition lookup:", selectedText.length, "characters");
        return;
      }

      console.log("Text selection detected:", selectedText);

      // Get the range of the selection
      const range = selection.getRangeAt(0);

      // Check if the selection spans multiple nodes
      const isMultiNodeSelection = range.startContainer !== range.endContainer;

      let fullText: string;
      let textNode: Node;
      let startOffset: number;
      let endOffset: number;

      if (isMultiNodeSelection) {
        // For multi-node selections, we'll use the selected text directly
        // and try to clean it for definition lookup
        console.log("Multi-node selection detected, using selected text directly");

        // Try to clean the selected text for definition lookup
        const cleanedText = cleanWord(selectedText);
        
        if (!cleanedText) return;

        await lookupDefinition(cleanedText, selectedText);
        return;
      }

      // For single node selections, proceed with the expansion logic
      textNode = range.startContainer;

      // Make sure we're working with a text node
      if (textNode.nodeType !== Node.TEXT_NODE) return;

      // Get the full text content of the node
      fullText = textNode.textContent || '';

      // Get the start and end offsets of the selection within the text node
      startOffset = range.startOffset;
      endOffset = range.endOffset;

      console.log(`Selection range: [${startOffset}, ${endOffset}] in text of length ${fullText.length}`);

      // Expand the selection to include full words and potential phrases
      const expansion = expandSelectionToWords(fullText, startOffset, endOffset);

      console.log('Expansion results:', {
        original: selectedText,
        singleWord: expansion.singleWord,
        phrase: expansion.phrase
      });

      // Determine what to look up
      let termToLookup = '';
      let originalTerm = '';

      // If the original selection was just part of a word, use the full word
      if (selectedText.length < expansion.singleWord.length && 
          expansion.singleWord.toLowerCase().includes(selectedText.toLowerCase())) {
        termToLookup = cleanWord(expansion.singleWord);
        originalTerm = expansion.singleWord;
        console.log(`Expanded partial selection "${selectedText}" to full word "${expansion.singleWord}"`);
      }
      // If we have a potential phrase that's significantly different from the single word, try the phrase first
      else if (expansion.phrase !== expansion.singleWord && 
               expansion.phrase.split(/\s+/).length <= 4 && 
               expansion.phrase.split(/\s+/).length >= 2) {
        termToLookup = cleanWord(expansion.phrase);
        originalTerm = expansion.phrase;
        console.log(`Trying phrasal lookup for: "${expansion.phrase}"`);
      }
      // Otherwise, use the single word
      else {
        termToLookup = cleanWord(expansion.singleWord);
        originalTerm = expansion.singleWord;
        console.log(`Using single word lookup for: "${expansion.singleWord}"`);
      }

      if (!termToLookup) {
        console.log("No valid term to lookup after cleaning");
        return;
      }

      await lookupDefinition(termToLookup, originalTerm, expansion);

    } catch (error) {
      // Handle any errors that might occur during the text selection process
      console.error("Error in text selection handling:", error);
      // Don't show an error to the user, just silently fail
    }
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
    setSelectedText(null);
  };

  const handleAskAI = () => {
    // This will be implemented when AI assistant functionality is added
    console.log('AI assistant button clicked');
    alert('AI Assistant feature coming soon!');
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

  const handleInfoCenter = () => {
    // Info center functionality to be implemented
    console.log('Info Center button clicked');
    alert('Info Center feature coming soon!');
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
      <Box sx={{ flex: 3, p: 3, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        
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

                 {/* Definition Area at Bottom with Nice Background */}
         {definitionData && (
           <Paper 
             elevation={3} 
             sx={{
               mt: 4,
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
      </Box>

      {/* Navigation Sidebar (1/4 of page) */}
      <Box sx={{ 
        flex: 1, 
        p: 2, 
        borderLeft: '1px solid', 
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        gap: 2
      }}>
        
                 {/* AI Assistance Button */}
         <Card 
           sx={{ 
             cursor: 'pointer',
             transition: 'all 0.2s',
             '&:hover': { 
               transform: 'translateY(-2px)', 
               boxShadow: 4 
             }
           }}
           onClick={handleAskAI}
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
               <AutoAwesomeIcon sx={{ fontSize: 30, color: '#333' }} />
             </Box>
             <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
               AI assistance
             </Typography>
           </CardContent>
         </Card>

         {/* Our Consultant Button */}
         <Card 
           sx={{ 
             cursor: 'pointer',
             transition: 'all 0.2s',
             '&:hover': { 
               transform: 'translateY(-2px)', 
               boxShadow: 4 
             }
           }}
           onClick={handleNotes}
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
               <SupportAgentIcon sx={{ fontSize: 30, color: '#666' }} />
             </Box>
             <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
               Our Consultants
             </Typography>
           </CardContent>
         </Card>

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
               backgroundColor: '#2196f3',
               borderRadius: '50%'
             }}>
               <LibraryBooksIcon sx={{ fontSize: 30, color: 'white' }} />
             </Box>
             <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
               INFO CENTER
             </Typography>
           </CardContent>
         </Card>

        {/* Loading indicator for definition */}
        {isLoadingDefinition && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress size={20} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MainInteractionPage;
