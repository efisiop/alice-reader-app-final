import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useBookService } from '../../hooks/useService';
import { LoadingIndicator } from '../../components/common/LoadingIndicator';
import { useSnackbar } from '../../utils/notistackUtils';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import ChatIcon from '@mui/icons-material/Chat';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import MenuBookIcon from '@mui/icons-material/MenuBook';

// Define types for Section data
interface SectionSnippet {
  id: string;
  number: number;
  title: string;
  preview: string; // e.g., first ~50 chars of content
}

interface SectionDetail extends SectionSnippet {
  content: string;
}

interface DefinitionData {
  word: string;
  definition: string;
  examples?: string[];
  source?: 'database' | 'local' | 'external' | 'not_found' | 'error';
}

export const ReaderInterfacePage: React.FC = () => {
  const navigate = useNavigate();
  const { bookId = 'alice-in-wonderland' } = useParams<{ bookId?: string }>(); // Default or get from route
  const { user, loading: authLoading } = useAuth();
  const { service: bookService, loading: serviceLoading, error: serviceError } = useBookService();
  const { enqueueSnackbar } = useSnackbar();

  // State for page/section input
  const [pageInput, setPageInput] = useState<string>('');
  const [activePage, setActivePage] = useState<number | null>(null);
  const [isLoadingSections, setIsLoadingSections] = useState<boolean>(false);
  const [sectionSnippets, setSectionSnippets] = useState<SectionSnippet[]>([]);
  const [selectedSection, setSelectedSection] = useState<SectionDetail | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // State for definition sidebar
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [definitionData, setDefinitionData] = useState<DefinitionData | null>(null);
  const [isLoadingDefinition, setIsLoadingDefinition] = useState<boolean>(false);

  // Ref for the text area where section content is displayed for highlighting
  const sectionContentRef = useRef<HTMLDivElement>(null);

  // Initial loading state
  if (authLoading || serviceLoading) {
    return <LoadingIndicator message="Initializing Companion..." />;
  }

  if (!user || !bookService) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', mt: 4 }}>
        <Typography variant="h5" color="error" gutterBottom>
          Failed to initialize core services
        </Typography>
        <Typography variant="body1" paragraph>
          Please try refreshing the page or contact support if the problem persists.
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/reader')}
        >
          Back to Dashboard
        </Button>
      </Box>
    );
  }

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
      // Call bookService.getSectionsForPage(bookId, pageNum)
      // This service needs to return an array of SectionSnippet objects
      if (bookService.getSectionsForPage) {
        const result = await bookService.getSectionsForPage(bookId, pageNum);
        const sections = result?.data || [];

        // Transform the data to match our SectionSnippet interface if needed
        const formattedSections = sections.map((section: any) => ({
          id: section.id,
          number: section.number || 1,
          title: section.title || `Section ${section.number || 1}`,
          preview: section.content ? section.content.substring(0, 50) + '...' : 'No preview available'
        }));

        setSectionSnippets(formattedSections);
      } else {
        // MOCK SNIPPETS FOR TESTING
        await new Promise(res => setTimeout(res, 500)); // Simulate fetch
        setSectionSnippets([
          {id: 'sec1', number: 1, title: 'Section 1', preview: 'Alice was beginning to get very tired...'},
          {id: 'sec2', number: 2, title: 'Section 2', preview: 'Suddenly a White Rabbit with pink eyes...'},
          {id: 'sec3', number: 3, title: 'Section 3', preview: 'Down, down, down. Would the fall never...'}
        ]);
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
      // Call bookService.getSectionDetails(sectionId)
      // This service needs to return the full SectionDetail object (including content)
      if (bookService.getSectionDetails) {
        const fullSection = await bookService.getSectionDetails(sectionId);
        if (fullSection) {
          setSelectedSection({
            id: fullSection.id,
            number: fullSection.number || snippet.number,
            title: fullSection.title || snippet.title,
            preview: snippet.preview,
            content: fullSection.content || 'No content available for this section.'
          });
        }
      } else {
        // MOCK FULL SECTION FOR TESTING
        await new Promise(res => setTimeout(res, 500)); // Simulate fetch
        setSelectedSection({
          ...snippet,
          content: `This is the full text content for ${snippet.title}\n\nAlice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, 'and what is the use of a book,' thought Alice 'without pictures or conversations?'\n\nSo she was considering in her own mind (as well as she could, for the hot day made her feel very sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.`
        });
      }

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
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (text && selectedSection) { // Only lookup if section content is displayed
      console.log("Highlight detected:", text);
      setIsLoadingDefinition(true);
      setDefinitionData(null); // Clear previous
      try {
        if (bookService.getDefinition) {
          const result = await bookService.getDefinition(bookId, text, selectedSection.id);
          if (result && result.data) {
            setDefinitionData({
              word: text,
              definition: result.data,
              examples: [],
              source: 'database'
            });
          } else {
            setDefinitionData({
              word: text,
              definition: `No definition found for "${text}".`,
              examples: [],
              source: 'not_found'
            });
          }
        } else {
          // MOCK DEFINITION FOR TESTING
          await new Promise(res => setTimeout(res, 300));
          const mockDefinition = text.length > 5 ?
            { word: text, definition: `This is a definition for "${text}". Examples...`, examples: [], source: 'database' } :
            { word: text, definition: `No definition found for "${text}".`, examples: [], source: 'not_found' };
          setDefinitionData(mockDefinition);
        }
      } catch (err: any) {
        console.error("Error fetching definition:", err);
        setDefinitionData({
          word: text,
          definition: `Error looking up "${text}".`,
          examples: [],
          source: 'error'
        });
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

  // Add Escape key listener to clear definition
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
  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}> {/* Adjust height based on Header */}

      {/* Main Content Area (Approx 90-95%) */}
      <Box sx={{ flexGrow: 1, p: 3, overflowY: 'auto' }}>
        <Typography variant="h5" gutterBottom>Sync with your Physical Book</Typography>

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
        <Box sx={{ minHeight: '300px' }}>
          {isLoadingSections && <LoadingIndicator message="Loading sections..." />}
          {fetchError && (
            <Paper elevation={1} sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
              <Typography variant="body1">{fetchError}</Typography>
            </Paper>
          )}

          {/* Display Section Snippets */}
          {!isLoadingSections && !fetchError && sectionSnippets.length > 0 && !selectedSection && (
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Select the section you are reading on page {activePage}:</Typography>
              <List dense>
                {sectionSnippets.map((snippet) => (
                  <ListItem button key={snippet.id} onClick={() => handleSectionSelect(snippet.id)}>
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
      </Paper>
    </Box>
  );
};