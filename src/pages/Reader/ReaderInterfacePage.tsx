import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, TextField, Button, Paper, Grid, IconButton, Tooltip } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext'; // Adjust path
import { useBookService } from '@hooks/useService'; // Adjust path
import { LoadingIndicator } from '@components/common/LoadingIndicator'; // Adjust path
import { ErrorDisplay } from '@components/common/ErrorDisplay'; // Adjust path (or implement)
import { DefinitionData } from '@types'; // Adjust path
import CloseIcon from '@mui/icons-material/Close';
// Potentially import section snippet component if created

// Define types for Section data (adjust based on actual service return)
interface SectionSnippet {
  id: string;
  number: number;
  preview: string; // e.g., first ~50 chars of content
}
interface SectionDetail extends SectionSnippet {
  content: string;
}

export const MainInteractionPage: React.FC = () => {
  const navigate = useNavigate();
  const { bookId = 'alice-in-wonderland' } = useParams<{ bookId?: string }>(); // Default or get from route
  const { user, loading: authLoading } = useAuth();
  const { service: bookService, loading: serviceLoading, error: serviceError } = useBookService();

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
     return <ErrorDisplay message="Failed to initialize core services." />;
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
      // TODO: Implement/Call bookService.getSectionsForPage(bookId, pageNum)
      // This service needs to return an array of SectionSnippet objects
      // const sections = await bookService.getSectionsForPage(bookId, pageNum);
      // setSectionSnippets(sections || []); // Update state with fetched snippets
      
      // --- MOCK SNIPPETS FOR NOW ---
      await new Promise(res => setTimeout(res, 500)); // Simulate fetch
      setSectionSnippets([
          {id: 'sec1', number: 1, preview: 'Section 1: Alice was beginning to get very tired...'},
          {id: 'sec2', number: 2, preview: 'Section 2: Suddenly a White Rabbit with pink eyes...'},
          {id: 'sec3', number: 3, preview: 'Section 3: Down, down, down. Would the fall never...'},
      ]);
      // --- END MOCK SNIPPETS ---

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
        // TODO: Implement/Call bookService.getSectionContent(sectionId)
        // This service needs to return the full SectionDetail object (including content)
        // const fullSection = await bookService.getSectionContent(sectionId);
        // setSelectedSection(fullSection); // Update state with full section details

        // --- MOCK FULL SECTION FOR NOW ---
         await new Promise(res => setTimeout(res, 500)); // Simulate fetch
         setSelectedSection({ ...snippet, content: `This is the full text content for ${snippet.preview}` });
        // --- END MOCK ---
        
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
     setSelectedText(null); // Assuming you have this state too
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
        <Box sx={{ minHeight: '300px' /* Adjust */ }}>
          {isLoadingSections && <LoadingIndicator message="Loading sections..." />}
          {fetchError && <ErrorDisplay message={fetchError} />}

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
          {isLoadingDefinition && <LoadingIndicator size="small" />}
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

// Make sure to export it if it's not the default
// export default MainInteractionPage; 