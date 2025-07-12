import React, { useEffect, useState } from 'react';
import { 
  signIn, 
  signUp,
  signOut,
  getUser,
  createUserProfile,
  getBookContent, 
  getSectionsForPage, 
  getDefinition, 
  saveReadingProgress,
  getReadingProgress,
  updateReadingStats,
  getReadingStats,
  saveAiInteraction,
  getAiInteractions,
  getAiPrompts,
  savePromptResponse,
  verifyBookCode,
  createTrigger,
  getTriggers,
  markTriggerProcessed
} from '../services/backendService';

// Make MUI imports optional with fallbacks in case it's not properly installed
let Box: any, Button: any, Container: any, Typography: any, CircularProgress: any, Tab: any, Tabs: any, Paper: any;

try {
  // Try to import from @mui/material
  const mui = require('@mui/material');
  Box = mui.Box;
  Button = mui.Button;
  Container = mui.Container;
  Typography = mui.Typography;
  CircularProgress = mui.CircularProgress;
  Tab = mui.Tab;
  Tabs = mui.Tabs;
  Paper = mui.Paper;
} catch (e) {
  // Fallback to simple div elements if MUI is not available
  Box = ({ children, sx, ...props }: any) => <div {...props}>{children}</div>;
  Button = ({ children, variant, color, onClick, disabled, ...props }: any) => 
    <button onClick={onClick} disabled={disabled} {...props}>{children}</button>;
  Container = ({ children, maxWidth, sx, ...props }: any) => <div {...props}>{children}</div>;
  Typography = ({ children, variant, component, gutterBottom, sx, ...props }: any) => 
    <div {...props}>{children}</div>;
  CircularProgress = ({ size, sx, ...props }: any) => <div {...props}>Loading...</div>;
  Tab = ({ label, disabled, ...props }: any) => <button disabled={disabled} {...props}>{label}</button>;
  Tabs = ({ children, value, onChange, ...props }: any) => <div {...props}>{children}</div>;
  Paper = ({ children, elevation, sx, ...props }: any) => <div {...props}>{children}</div>;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const TestMockBackend: React.FC = () => {
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [runSpecificTest, setRunSpecificTest] = useState<string | null>(null);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    async function runTests() {
      setLoading(true);
      try {
        const results: Record<string, any> = {};
        const bookId = '550e8400-e29b-41d4-a716-446655440000';
        
        // Only run all tests when initially loading
        if (!runSpecificTest) {
          // Test auth
          // TypeScript has trouble with the auth response type that varies between real and mock backend
          // For testing purposes, we're using a cast to any
          results.auth = await signIn('test@example.com', 'password123') as any;
          
          // Test book content
          results.bookContent = await getBookContent(bookId);
          
          // Test sections for page
          results.sectionsForPage = await getSectionsForPage(bookId, 5);
          
          // Test definition
          results.definition = await getDefinition(bookId, 'alice');
          
          // Test reading progress
          const userId = 'mock-user-id'; // Just use a hardcoded ID for testing
          const sectionId = 's1';
          await saveReadingProgress(userId, bookId, sectionId);
          results.readingProgress = await getReadingProgress(userId, bookId);
          
          // Test AI prompts
          results.aiPrompts = await getAiPrompts('reflection');
          
          setTestResults(results);
        } else {
          // Run a specific test based on button click
          switch (runSpecificTest) {
            case 'auth': {
              // Test complete auth flow
              await signOut(); // Start fresh
              
              // Sign up
              const signUpResult = await signUp('test2@example.com', 'password123') as any;
              
              // Create profile
              const userId = 'mock-user-id'; // Hardcode for testing
              const profileResult = await createUserProfile(userId, 'Test', 'User', 'test2@example.com');
              
              // Sign in
              const signInResult = await signIn('test2@example.com', 'password123') as any;
              
              // Get user
              const userResult = await getUser();
              
              setTestResults({
                ...testResults,
                authFlow: {
                  signUp: signUpResult,
                  createProfile: profileResult,
                  signIn: signInResult,
                  getUser: userResult
                }
              });
              break;
            }
            
            case 'reading': {
              const userId = 'mock-user-id';
              
              // Save progress for a different section
              const progressResult = await saveReadingProgress(userId, bookId, 's3', '{"position": "mid-chapter"}');
              
              // Update reading stats
              const statsUpdateResult = await updateReadingStats(userId, bookId, 300, 8);
              
              // Get updated stats
              const statsResult = await getReadingStats(userId, bookId);
              
              // Get progress
              const currentProgressResult = await getReadingProgress(userId, bookId);
              
              setTestResults({
                ...testResults,
                readingFlow: {
                  saveProgress: progressResult,
                  updateStats: statsUpdateResult,
                  getStats: statsResult,
                  currentProgress: currentProgressResult
                }
              });
              break;
            }
            
            case 'ai': {
              const userId = 'mock-user-id';
              
              // Save AI interaction
              const interactionResult = await saveAiInteraction(
                userId, 
                bookId, 
                "What does the White Rabbit symbolize?", 
                "The White Rabbit represents time consciousness and anxiety about being late, reflecting Lewis Carroll's commentary on the rigid Victorian society."
              );
              
              // Get AI interactions
              const getInteractionsResult = await getAiInteractions(userId, bookId);
              
              // Get prompts and save response
              const promptsResult = await getAiPrompts('character');
              let responseResult = null;
              
              if (promptsResult.data && promptsResult.data.length > 0) {
                responseResult = await savePromptResponse(
                  userId,
                  promptsResult.data[0].id,
                  "I relate most to Alice because I'm curious and often find myself in unfamiliar situations."
                );
              }
              
              setTestResults({
                ...testResults,
                aiFlow: {
                  saveInteraction: interactionResult,
                  getInteractions: getInteractionsResult,
                  getPrompts: promptsResult,
                  saveResponse: responseResult
                }
              });
              break;
            }
            
            case 'verification': {
              // Verify book code
              const verifyResult = await verifyBookCode('ALICE123');
              
              // Mark code as used
              const markUsedResult = await verifyBookCode('WONDERLAND');
              
              setTestResults({
                ...testResults,
                verificationFlow: {
                  verifyCode: verifyResult,
                  markUsed: markUsedResult
                }
              });
              break;
            }
            
            case 'consultant': {
              const userId = 'mock-user-id';
              const consultantId = 'mock-consultant-id';
              
              // Create trigger
              const triggerResult = await createTrigger(
                userId,
                bookId,
                'assistance',
                'I need help understanding the Queen of Hearts character.',
                consultantId
              );
              
              // Get triggers
              const getTriggersResult = await getTriggers(consultantId);
              
              // Mark trigger as processed
              let markProcessedResult = null;
              if (getTriggersResult.data && getTriggersResult.data.length > 0) {
                markProcessedResult = await markTriggerProcessed(getTriggersResult.data[0].id);
              }
              
              setTestResults({
                ...testResults,
                consultantFlow: {
                  createTrigger: triggerResult,
                  getTriggers: getTriggersResult,
                  markProcessed: markProcessedResult
                }
              });
              break;
            }
          }
        }
      } catch (err) {
        setError(`Error running tests: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
        setRunSpecificTest(null);
      }
    }
    
    if (loading || runSpecificTest) {
      runTests();
    }
  }, [loading, runSpecificTest, testResults]);

  if (loading && !runSpecificTest) {
    return (
      <Container sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>Running mock backend tests...</Typography>
      </Container>
    );
  }

  const handleRunTest = (testName: string) => {
    setRunSpecificTest(testName);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Mock Backend Testing Interface
      </Typography>
      
      {error && (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 2, 
            mb: 3, 
            backgroundColor: '#ffebee', 
            color: '#c62828'
          }}
        >
          <Typography variant="h6">Error</Typography>
          <Typography>{error}</Typography>
        </Paper>
      )}
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>Run Specific Tests</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => handleRunTest('auth')}
            disabled={!!runSpecificTest}
          >
            Test Auth Flow
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => handleRunTest('reading')}
            disabled={!!runSpecificTest}
          >
            Test Reading Flow
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => handleRunTest('ai')}
            disabled={!!runSpecificTest}
          >
            Test AI Interactions
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => handleRunTest('verification')}
            disabled={!!runSpecificTest}
          >
            Test Book Verification
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => handleRunTest('consultant')}
            disabled={!!runSpecificTest}
          >
            Test Consultant Features
          </Button>
        </Box>
        {runSpecificTest && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
            <CircularProgress size={24} sx={{ mr: 2 }} />
            <Typography>Running {runSpecificTest} tests...</Typography>
          </Box>
        )}
      </Box>
      
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Initial Tests" />
            <Tab label="Auth Flow" disabled={!testResults.authFlow} />
            <Tab label="Reading Flow" disabled={!testResults.readingFlow} />
            <Tab label="AI Features" disabled={!testResults.aiFlow} />
            <Tab label="Verification" disabled={!testResults.verificationFlow} />
            <Tab label="Consultant" disabled={!testResults.consultantFlow} />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          {Object.entries(testResults)
            .filter(([key]) => !['authFlow', 'readingFlow', 'aiFlow', 'verificationFlow', 'consultantFlow'].includes(key))
            .map(([test, result]) => (
              <Box key={test} sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ borderBottom: '1px solid #ccc', pb: 1, mb: 2 }}>
                  {test.charAt(0).toUpperCase() + test.slice(1)}
                </Typography>
                <Paper elevation={2} sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                  <pre style={{ overflow: 'auto', maxHeight: '300px' }}>
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </Paper>
              </Box>
            ))}
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          {testResults.authFlow && Object.entries(testResults.authFlow).map(([test, result]) => (
            <Box key={test} sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ borderBottom: '1px solid #ccc', pb: 1, mb: 2 }}>
                {test.charAt(0).toUpperCase() + test.slice(1)}
              </Typography>
              <Paper elevation={2} sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                <pre style={{ overflow: 'auto', maxHeight: '300px' }}>
                  {JSON.stringify(result, null, 2)}
                </pre>
              </Paper>
            </Box>
          ))}
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          {testResults.readingFlow && Object.entries(testResults.readingFlow).map(([test, result]) => (
            <Box key={test} sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ borderBottom: '1px solid #ccc', pb: 1, mb: 2 }}>
                {test.charAt(0).toUpperCase() + test.slice(1)}
              </Typography>
              <Paper elevation={2} sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                <pre style={{ overflow: 'auto', maxHeight: '300px' }}>
                  {JSON.stringify(result, null, 2)}
                </pre>
              </Paper>
            </Box>
          ))}
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          {testResults.aiFlow && Object.entries(testResults.aiFlow).map(([test, result]) => (
            <Box key={test} sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ borderBottom: '1px solid #ccc', pb: 1, mb: 2 }}>
                {test.charAt(0).toUpperCase() + test.slice(1)}
              </Typography>
              <Paper elevation={2} sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                <pre style={{ overflow: 'auto', maxHeight: '300px' }}>
                  {JSON.stringify(result, null, 2)}
                </pre>
              </Paper>
            </Box>
          ))}
        </TabPanel>
        
        <TabPanel value={tabValue} index={4}>
          {testResults.verificationFlow && Object.entries(testResults.verificationFlow).map(([test, result]) => (
            <Box key={test} sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ borderBottom: '1px solid #ccc', pb: 1, mb: 2 }}>
                {test.charAt(0).toUpperCase() + test.slice(1)}
              </Typography>
              <Paper elevation={2} sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                <pre style={{ overflow: 'auto', maxHeight: '300px' }}>
                  {JSON.stringify(result, null, 2)}
                </pre>
              </Paper>
            </Box>
          ))}
        </TabPanel>
        
        <TabPanel value={tabValue} index={5}>
          {testResults.consultantFlow && Object.entries(testResults.consultantFlow).map(([test, result]) => (
            <Box key={test} sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ borderBottom: '1px solid #ccc', pb: 1, mb: 2 }}>
                {test.charAt(0).toUpperCase() + test.slice(1)}
              </Typography>
              <Paper elevation={2} sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                <pre style={{ overflow: 'auto', maxHeight: '300px' }}>
                  {JSON.stringify(result, null, 2)}
                </pre>
              </Paper>
            </Box>
          ))}
        </TabPanel>
      </Box>
    </Container>
  );
};

export default TestMockBackend; 