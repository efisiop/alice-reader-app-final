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
import { useBookService } from '../../hooks/useService';
import { LoadingIndicator } from '../../components/common/LoadingIndicator';
import { useSnackbar } from '../../utils/notistackUtils';
import CloseIcon from '@mui/icons-material/Close';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import NoteIcon from '@mui/icons-material/Note';
import HelpIcon from '@mui/icons-material/Help';
import MenuBookIcon from '@mui/icons-material/MenuBook';
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
  const { service: bookService, loading: serviceLoading, error: serviceError } = useBookService(); // serviceError will be used for error handling
  const { enqueueSnackbar } = useSnackbar(); // Will be used for notifications

  // State for page/section input
  const [pageInput, setPageInput] = useState<string>('');
  const [activePage, setActivePage] = useState<number | null>(null);
  const [isLoadingSections, setIsLoadingSections] = useState<boolean>(false);
  const [sectionSnippets, setSectionSnippets] = useState<SectionSnippet[]>([]);
  const [selectedSection, setSelectedSection] = useState<SectionDetail | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // State for definition sidebar
  // selectedText will be used to store the highlighted text for future features
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [definitionData, setDefinitionData] = useState<DefinitionData | null>(null);
  const [isLoadingDefinition, setIsLoadingDefinition] = useState<boolean>(false);

  // Ref for the text area where section content is displayed for highlighting
  const sectionContentRef = useRef<HTMLDivElement>(null);

  // We'll use this to conditionally render content
  const [isReady, setIsReady] = useState<boolean>(false);

  // Check if services are ready
  useEffect(() => {
    if (!authLoading && !serviceLoading && user && bookService) {
      setIsReady(true);
    }
  }, [authLoading, serviceLoading, user, bookService]);

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
      // Use the new readerService method to get section snippets
      const snippets = await readerService.getSectionSnippetsForPage(bookId, pageNum);
      setSectionSnippets(snippets || []);
      
      if (snippets.length === 0) {
        setFetchError(`No sections found on page ${pageNum}.`);
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
     if (!snippet) return;

     setIsLoadingSections(true); // Use same loading state for fetching full content
     setFetchError(null);
     setSelectedSection(null);
     console.log(`Fetching full content for section: ${sectionId}`);
     try {
        // Use the readerService to get full section content
        const fullSection = await readerService.getSection(sectionId);
        
        // Transform to expected format
        setSelectedSection({
          id: fullSection.id,
          number: snippet.number, // Keep the number from snippet since it might not be in the full section object
          preview: snippet.preview,
          content: fullSection.content
        });

        setSectionSnippets([]); // Hide snippets once full section is loaded
        clearDefinition(); // Clear any previous definition
     } catch (err: any) {
        console.error('Error fetching section content:', err);
        setFetchError(`Failed to load content for section ${snippet.number}. ${err.message || ''}`);
        setSelectedSection(null);
     } finally {
       setIsLoadingSections(false);
     }
  };

  const handleTextSelection = async () => {
    // --- Keep your existing working logic here ---
    // Uses window.getSelection(), calls bookService.getDefinition,
    // sets isLoadingDefinition, sets definitionData state.
    // Ensure it reads from the selectedSection?.content if available.
     const selection = window.getSelection();
     const text = selection?.toString().trim();
     if (text && selectedSection) { // Only lookup if section content is displayed
        console.log("Highlight detected:", text);
        setIsLoadingDefinition(true);
        setDefinitionData(null); // Clear previous
        try {
           // const result = await bookService.getDefinition(bookId, text, selectedSection.id);
           // --- MOCK DEFINITION ---
           await new Promise(res => setTimeout(res, 300));
           const result = text.length > 5 ? { data: `This is a definition for "${text}". Examples...` } : null;
           // --- END MOCK ---

           if (result?.data) {
              setDefinitionData({ word: text, definition: result.data, examples: [], source: 'database' });
           } else {
              setDefinitionData({ word: text, definition: `No definition found for "${text}".`, examples: [], source: 'not_found' });
           }
        } catch (err: any) {
           console.error("Error fetching definition:", err);
           setDefinitionData({ word: text, definition: `Error looking up "${text}".`, examples: [], source: 'error' });
        } finally {
           setIsLoadingDefinition(false);
        }
     }
  };

  const clearDefinition = () => {
     setSelectedText(null);
     setDefinitionData(null);
     setIsLoadingDefinition(false);
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
        <Paper elevation={1} sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography sx={{ whiteSpace: 'nowrap' }}>What page are you on?</Typography>
          <TextField
             type="number"
             size="small"
             variant="outlined"
             value={pageInput}
             onChange={(e) => setPageInput(e.target.value)}
             sx={{ maxWidth: '150px' }}
             onKeyDown={(e) => e.key === 'Enter' && handlePageSubmit()}
          />
          <Button variant="contained" onClick={handlePageSubmit} disabled={isLoadingSections}>
             {isLoadingSections ? 'Loading...' : 'Find Sections'}
          </Button>
        </Paper>

        {/* Section Selection / Display Area */}
        <Box sx={{ minHeight: '300px' /* Adjust */ }}>
          {isLoadingSections && <LoadingIndicator message="Loading sections..." />}
          {fetchError && <LoadingIndicator message={fetchError} />}

          {/* Display Section Snippets */}
          {!isLoadingSections && !fetchError && sectionSnippets.length > 0 && !selectedSection && (
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Select the section you are reading on page {activePage}:</Typography>
              <List dense>
                {sectionSnippets.map((snippet) => (
                  <ListItem key={snippet.id} onClick={() => handleSectionSelect(snippet.id)} sx={{ cursor: 'pointer' }}>
                     <ListItemText primary={`Section ${snippet.number}`} secondary={snippet.preview} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}

          {/* Display Selected Section Content */}
          {!isLoadingSections && !fetchError && selectedSection && (
             <Paper
                elevation={1}
                sx={{ p: 2, mt: 2 }}
                ref={sectionContentRef}
                onMouseUp={handleTextSelection} // Trigger definition lookup
             >
               <Tooltip title="Highlight text in this area to get definitions or ask AI">
                 <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedSection.content}
                 </Typography>
               </Tooltip>
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

        {/* AI Assistant Area (Placeholder) */}
        <Box>
           <Typography variant="overline">AI Assistant</Typography>
           <Button size="small" variant="outlined" sx={{ mt: 1 }} disabled={!selectedSection}>
              Ask AI about this section
           </Button>
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
