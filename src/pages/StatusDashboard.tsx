// src/pages/StatusDashboard.tsx
import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Alert, Grid, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Divider, Chip, Accordion, AccordionSummary, AccordionDetails,
  TextField, Tabs, Tab, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  DialogContentText
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { testConnection, supabase } from '../services/supabaseClient';
import { checkIsConsultant } from '../services/consultantService';
import { useAuth } from '../contexts/AuthContext';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { appLog } from '../components/LogViewer';
import { getBookUuid, ALICE_BOOK_ID_STRING, ALICE_BOOK_ID_UUID } from '../utils/bookIdUtils';
import { getDatabaseService } from '../services/databaseService';
import { Migration } from '../utils/migrationUtils';

const StatusDashboard: React.FC = () => {
  const { user, isVerified } = useAuth();
  const navigate = useNavigate();
  const [supabaseStatus, setSupabaseStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [tables, setTables] = useState<any[]>([]);
  const [bookData, setBookData] = useState<any>(null);
  const [testResults, setTestResults] = useState<Record<string, { status: 'success' | 'error' | 'pending', message: string }>>({});
  const [consultantEmail, setConsultantEmail] = useState<string>('');
  const [addingConsultant, setAddingConsultant] = useState<boolean>(false);
  const [consultantList, setConsultantList] = useState<any[]>([]);
  const [loadingConsultants, setLoadingConsultants] = useState<boolean>(false);

  // Database migration state
  const [currentTab, setCurrentTab] = useState<number>(0);
  const [currentVersion, setCurrentVersion] = useState<number>(0);
  const [availableMigrations, setAvailableMigrations] = useState<Migration[]>([]);
  const [versionHistory, setVersionHistory] = useState<any[]>([]);
  const [loadingMigrations, setLoadingMigrations] = useState<boolean>(false);
  const [migrationInProgress, setMigrationInProgress] = useState<boolean>(false);
  const [targetVersion, setTargetVersion] = useState<number>(0);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState<boolean>(false);
  const [confirmAction, setConfirmAction] = useState<'apply' | 'rollback'>('apply');
  const [schemaVerification, setSchemaVerification] = useState<{
    valid: boolean;
    missingTables: string[];
    missingColumns: Record<string, string[]>;
    errors: string[];
  } | null>(null);
  const [tableInfo, setTableInfo] = useState<any[]>([]);
  const [sqlQuery, setSqlQuery] = useState<string>('');
  const [sqlResult, setSqlResult] = useState<{ success: boolean; message: string } | null>(null);

  // Function to load migration data
  const loadMigrationData = async () => {
    setLoadingMigrations(true);
    try {
      appLog('StatusDashboard', 'Loading migration data', 'info');
      const dbService = await getDatabaseService();

      // Get current schema version
      const version = await dbService.getCurrentSchemaVersion();
      setCurrentVersion(version);
      setTargetVersion(version); // Initialize target version to current

      // Get available migrations
      const migrations = dbService.getAvailableMigrations();
      setAvailableMigrations(migrations);

      // Get version history
      const { data: history } = await dbService.getSchemaVersionHistory();
      setVersionHistory(history || []);

      // Verify schema
      const verification = await dbService.verifySchema();
      setSchemaVerification(verification);

      // Get table info
      const { data: tables } = await dbService.getTableInfo();
      setTableInfo(tables || []);

      appLog('StatusDashboard', 'Migration data loaded successfully', 'success', {
        currentVersion: version,
        migrationCount: migrations.length,
        historyCount: history?.length || 0
      });
    } catch (error) {
      appLog('StatusDashboard', 'Error loading migration data', 'error', error);
      setErrorMessage(`Failed to load migration data: ${error.message}`);
    } finally {
      setLoadingMigrations(false);
    }
  };

  // Function to apply migrations
  const handleApplyMigrations = async () => {
    setMigrationInProgress(true);
    setSqlResult(null);
    try {
      appLog('StatusDashboard', 'Applying migrations', 'info', {
        from: currentVersion,
        to: targetVersion
      });

      const dbService = await getDatabaseService();
      const result = await dbService.applyMigrations(targetVersion);

      if (result.success) {
        appLog('StatusDashboard', 'Migrations applied successfully', 'success', result);
        setSqlResult({
          success: true,
          message: `Successfully applied ${result.appliedMigrations.length} migrations: ${result.appliedMigrations.join(', ')}`
        });

        // Reload migration data
        await loadMigrationData();
      } else {
        appLog('StatusDashboard', 'Migration failed', 'error', result);
        setSqlResult({
          success: false,
          message: `Migration failed: ${result.error}`
        });
      }
    } catch (error) {
      appLog('StatusDashboard', 'Error applying migrations', 'error', error);
      setSqlResult({
        success: false,
        message: `Error applying migrations: ${error.message}`
      });
    } finally {
      setMigrationInProgress(false);
      setConfirmDialogOpen(false);
    }
  };

  // Function to roll back migrations
  const handleRollbackMigrations = async () => {
    setMigrationInProgress(true);
    setSqlResult(null);
    try {
      appLog('StatusDashboard', 'Rolling back migrations', 'info', {
        from: currentVersion,
        to: targetVersion
      });

      const dbService = await getDatabaseService();
      const result = await dbService.rollbackMigrations(targetVersion);

      if (result.success) {
        appLog('StatusDashboard', 'Migrations rolled back successfully', 'success', result);
        setSqlResult({
          success: true,
          message: `Successfully rolled back ${result.rolledBackMigrations.length} migrations: ${result.rolledBackMigrations.join(', ')}`
        });

        // Reload migration data
        await loadMigrationData();
      } else {
        appLog('StatusDashboard', 'Rollback failed', 'error', result);
        setSqlResult({
          success: false,
          message: `Rollback failed: ${result.error}`
        });
      }
    } catch (error) {
      appLog('StatusDashboard', 'Error rolling back migrations', 'error', error);
      setSqlResult({
        success: false,
        message: `Error rolling back migrations: ${error.message}`
      });
    } finally {
      setMigrationInProgress(false);
      setConfirmDialogOpen(false);
    }
  };

  // Function to execute custom SQL
  const handleExecuteSQL = async () => {
    if (!sqlQuery.trim()) return;

    setMigrationInProgress(true);
    setSqlResult(null);
    try {
      appLog('StatusDashboard', 'Executing custom SQL', 'info');

      const dbService = await getDatabaseService();
      const result = await dbService.executeSQL(sqlQuery);

      if (result.success) {
        appLog('StatusDashboard', 'SQL executed successfully', 'success');
        setSqlResult({
          success: true,
          message: 'SQL executed successfully'
        });

        // Reload migration data
        await loadMigrationData();
      } else {
        appLog('StatusDashboard', 'SQL execution failed', 'error', result.error);
        setSqlResult({
          success: false,
          message: `SQL execution failed: ${result.error.message}`
        });
      }
    } catch (error) {
      appLog('StatusDashboard', 'Error executing SQL', 'error', error);
      setSqlResult({
        success: false,
        message: `Error executing SQL: ${error.message}`
      });
    } finally {
      setMigrationInProgress(false);
    }
  };

  // Function to open confirmation dialog
  const openConfirmDialog = (action: 'apply' | 'rollback') => {
    setConfirmAction(action);
    setConfirmDialogOpen(true);
  };

  useEffect(() => {
    const checkSupabase = async () => {
      try {
        appLog('StatusDashboard', 'Testing Supabase connection', 'info');
        const result = await testConnection();
        setSupabaseStatus(result.success ? 'connected' : 'error');
        if (!result.success) {
          appLog('StatusDashboard', 'Supabase connection test failed', 'error', result.error);
          setErrorMessage(String(result.error) || 'Unknown connection error');
        } else {
          appLog('StatusDashboard', 'Supabase connection test successful', 'success');

          // Load migration data if connected
          await loadMigrationData();
        }
      } catch (error: any) {
        appLog('StatusDashboard', 'Error testing Supabase connection', 'error', error);
        setSupabaseStatus('error');
        setErrorMessage(error.message || 'Unknown error testing connection');
      }
    };

    const checkDatabaseStatus = async () => {
      appLog('StatusDashboard', 'Checking database status', 'info');
      setLoading(true);

      try {
        // Initialize test results
        setTestResults({
          connection: { status: 'pending', message: 'Testing connection...' },
          books: { status: 'pending', message: 'Checking books table...' },
          chapters: { status: 'pending', message: 'Checking chapters table...' },
          sections: { status: 'pending', message: 'Checking sections table...' },
          reading_progress: { status: 'pending', message: 'Checking reading_progress table...' },
          reading_stats: { status: 'pending', message: 'Checking reading_stats table...' }
        });

        // Test 1: Basic connection
        appLog('StatusDashboard', 'Testing basic connection', 'info');
        const { data: connectionData, error: connectionError } = await supabase.from('books').select('count').limit(1);

        if (connectionError) {
          appLog('StatusDashboard', 'Connection test failed', 'error', connectionError);
          setTestResults(prev => ({
            ...prev,
            connection: { status: 'error', message: `Connection failed: ${connectionError.message}` }
          }));
        } else {
          appLog('StatusDashboard', 'Connection test successful', 'success');
          setTestResults(prev => ({
            ...prev,
            connection: { status: 'success', message: 'Connection successful' }
          }));
        }

        // Test 2: List tables
        appLog('StatusDashboard', 'Fetching table list', 'info');
        const { data: tablesData, error: tablesError } = await supabase.rpc('get_tables');

        if (tablesError) {
          appLog('StatusDashboard', 'Error fetching tables', 'error', tablesError);
        } else if (tablesData) {
          appLog('StatusDashboard', `Found ${tablesData.length} tables`, 'success');
          setTables(tablesData);

          // Check for required tables
          const tableNames = tablesData.map((t: any) => t.table_name);

          // Check books table
          if (tableNames.includes('books')) {
            setTestResults(prev => ({
              ...prev,
              books: { status: 'success', message: 'Books table exists' }
            }));
          } else {
            setTestResults(prev => ({
              ...prev,
              books: { status: 'error', message: 'Books table not found' }
            }));
          }

          // Check chapters table
          if (tableNames.includes('chapters')) {
            setTestResults(prev => ({
              ...prev,
              chapters: { status: 'success', message: 'Chapters table exists' }
            }));
          } else {
            setTestResults(prev => ({
              ...prev,
              chapters: { status: 'error', message: 'Chapters table not found' }
            }));
          }

          // Check sections table
          if (tableNames.includes('sections')) {
            setTestResults(prev => ({
              ...prev,
              sections: { status: 'success', message: 'Sections table exists' }
            }));
          } else {
            setTestResults(prev => ({
              ...prev,
              sections: { status: 'error', message: 'Sections table not found' }
            }));
          }

          // Check reading_progress table
          if (tableNames.includes('reading_progress')) {
            // Check if last_read_at column exists
            try {
              const { error: columnError } = await supabase
                .from('reading_progress')
                .select('last_read_at')
                .limit(1);

              if (columnError && columnError.message.includes('column')) {
                setTestResults(prev => ({
                  ...prev,
                  reading_progress: {
                    status: 'error',
                    message: 'Reading progress table exists but missing last_read_at column'
                  }
                }));
              } else {
                setTestResults(prev => ({
                  ...prev,
                  reading_progress: { status: 'success', message: 'Reading progress table exists with required columns' }
                }));
              }
            } catch (e) {
              setTestResults(prev => ({
                ...prev,
                reading_progress: { status: 'error', message: 'Error checking reading_progress columns' }
              }));
            }
          } else {
            setTestResults(prev => ({
              ...prev,
              reading_progress: { status: 'error', message: 'Reading progress table not found' }
            }));
          }

          // Check reading_stats table
          if (tableNames.includes('reading_stats')) {
            setTestResults(prev => ({
              ...prev,
              reading_stats: { status: 'success', message: 'Reading stats table exists' }
            }));
          } else {
            setTestResults(prev => ({
              ...prev,
              reading_stats: { status: 'error', message: 'Reading stats table not found' }
            }));
          }
        }

        // Test 3: Check Alice book
        appLog('StatusDashboard', 'Checking Alice book data', 'info');
        appLog('StatusDashboard', `Using book UUID: ${ALICE_BOOK_ID_UUID}`, 'debug');

        const { data: bookData, error: bookError } = await supabase
          .from('books')
          .select('*')
          .eq('id', ALICE_BOOK_ID_UUID)
          .maybeSingle();

        if (bookError) {
          appLog('StatusDashboard', 'Error fetching Alice book', 'error', bookError);
        } else if (bookData) {
          appLog('StatusDashboard', 'Alice book found', 'success', bookData);
          setBookData(bookData);
        } else {
          appLog('StatusDashboard', 'Alice book not found', 'warning');

          // Try with string ID
          const { data: stringIdData, error: stringIdError } = await supabase
            .from('books')
            .select('*')
            .eq('string_id', ALICE_BOOK_ID_STRING)
            .maybeSingle();

          if (stringIdError) {
            appLog('StatusDashboard', 'Error fetching Alice book by string ID', 'error', stringIdError);
          } else if (stringIdData) {
            appLog('StatusDashboard', 'Alice book found by string ID', 'success', stringIdData);
            setBookData(stringIdData);
          } else {
            appLog('StatusDashboard', 'Alice book not found by any ID', 'error');
          }
        }
      } catch (error) {
        appLog('StatusDashboard', 'Unexpected error checking database status', 'error', error);
        setErrorMessage('An unexpected error occurred while checking database status');
      } finally {
        setLoading(false);
      }
    };

    checkSupabase();
    checkDatabaseStatus();
    loadConsultants();
  }, []);

  // State for migration results and confirmation dialog
  const [migrationResult, setMigrationResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Function to show confirmation dialog
  const confirmRunMigrations = () => {
    appLog('StatusDashboard', 'Showing migration confirmation dialog', 'info');
    setShowConfirmDialog(true);
  };

  // Function to run database migrations
  const loadConsultants = async () => {
    setLoadingConsultants(true);
    try {
      appLog('StatusDashboard', 'Loading consultant list', 'info');
      const { data, error } = await supabase
        .from('consultant_users')
        .select(`
          user_id,
          is_active,
          created_at,
          profiles:user_id (id, email, first_name, last_name)
        `);

      if (error) {
        appLog('StatusDashboard', 'Error loading consultants', 'error', error);
      } else {
        appLog('StatusDashboard', `Loaded ${data.length} consultants`, 'success');
        setConsultantList(data);
      }
    } catch (error) {
      appLog('StatusDashboard', 'Error in loadConsultants', 'error', error);
    } finally {
      setLoadingConsultants(false);
    }
  };

  const addConsultant = async () => {
    if (!consultantEmail.trim()) return;

    setAddingConsultant(true);
    try {
      appLog('StatusDashboard', 'Looking up user by email', 'info', { email: consultantEmail });

      // First, find the user by email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .eq('email', consultantEmail.trim())
        .single();

      if (userError) {
        appLog('StatusDashboard', 'Error finding user', 'error', userError);
        alert(`Error: ${userError.message || 'User not found'}`);
        setAddingConsultant(false);
        return;
      }

      if (!userData) {
        alert('User not found with that email address');
        setAddingConsultant(false);
        return;
      }

      // Check if user is already a consultant
      const { data: existingConsultant } = await supabase
        .from('consultant_users')
        .select('user_id')
        .eq('user_id', userData.id)
        .single();

      if (existingConsultant) {
        alert('This user is already a consultant');
        setAddingConsultant(false);
        return;
      }

      // Add the user as a consultant
      const { error: insertError } = await supabase
        .from('consultant_users')
        .insert({
          user_id: userData.id,
          is_active: true
        });

      if (insertError) {
        appLog('StatusDashboard', 'Error adding consultant', 'error', insertError);
        alert(`Error: ${insertError.message || 'Failed to add consultant'}`);
      } else {
        appLog('StatusDashboard', 'Consultant added successfully', 'success', { userId: userData.id });
        alert(`${userData.first_name} ${userData.last_name} (${userData.email}) added as a consultant`);
        setConsultantEmail('');
        loadConsultants();
      }
    } catch (error: any) {
      appLog('StatusDashboard', 'Error in addConsultant', 'error', error);
      alert(`Error: ${error.message || 'An unexpected error occurred'}`);
    } finally {
      setAddingConsultant(false);
    }
  };

  const toggleConsultantStatus = async (userId: string, currentStatus: boolean) => {
    try {
      appLog('StatusDashboard', 'Toggling consultant status', 'info', { userId, newStatus: !currentStatus });

      const { error } = await supabase
        .from('consultant_users')
        .update({ is_active: !currentStatus })
        .eq('user_id', userId);

      if (error) {
        appLog('StatusDashboard', 'Error toggling consultant status', 'error', error);
        alert(`Error: ${error.message || 'Failed to update consultant status'}`);
      } else {
        appLog('StatusDashboard', 'Consultant status updated successfully', 'success');
        loadConsultants();
      }
    } catch (error: any) {
      appLog('StatusDashboard', 'Error in toggleConsultantStatus', 'error', error);
      alert(`Error: ${error.message || 'An unexpected error occurred'}`);
    }
  };

  // Legacy function for backward compatibility
  const runMigrations = async () => {
    appLog('StatusDashboard', 'Running database migrations', 'info');
    setShowConfirmDialog(false);
    setLoading(true);
    setMigrationResult(null);

    try {
      // Use our new migration system instead
      appLog('StatusDashboard', 'Using new migration system', 'info');
      const dbService = await getDatabaseService();

      // Get the highest migration ID
      const migrations = dbService.getAvailableMigrations();
      const highestVersion = Math.max(...migrations.map(m => m.id));

      // Apply all migrations
      const result = await dbService.applyMigrations(highestVersion);

      if (result.success) {
        appLog('StatusDashboard', 'Migrations completed successfully', 'success', result);
        setMigrationResult({
          success: true,
          message: `Successfully applied ${result.appliedMigrations.length} migrations: ${result.appliedMigrations.join(', ')}`
        });

        // Wait a moment before refreshing to show the success message
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        appLog('StatusDashboard', 'Migrations failed', 'error', result);
        setMigrationResult({ success: false, message: result.error || 'Unknown error' });
      }
    } catch (error) {
      appLog('StatusDashboard', 'Error running migrations', 'error', error);
      setMigrationResult({
        success: false,
        message: `Failed to run migrations: ${error instanceof Error ? error.message : String(error)}`
      });
      setErrorMessage(`Failed to run migrations: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <div>
            <Typography variant="h4" gutterBottom>Alice Reader Admin Dashboard</Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              This dashboard is for technical staff and administrators only. It shows the current status of the Alice Reader application and its components.
            </Typography>
            <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold', mb: 2 }}>
              Admin Access Only
            </Typography>
          </div>
          <Button
            variant="outlined"
            color="secondary"
            size="small"
            onClick={() => {
              // Remove admin flag and navigate back to reader dashboard
              localStorage.removeItem('isAdmin');
              appLog('StatusDashboard', 'Admin access revoked', 'info');
              navigate('/reader');
            }}
          >
            Exit Admin Mode
          </Button>
        </Box>

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errorMessage}
          </Alert>
        )}
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Supabase Connection</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    mr: 1,
                    bgcolor:
                      supabaseStatus === 'connected' ? 'success.main' :
                      supabaseStatus === 'error' ? 'error.main' : 'warning.main'
                  }}
                />
                <Typography>
                  {supabaseStatus === 'connected' ? 'Connected' :
                   supabaseStatus === 'error' ? 'Connection Error' : 'Checking...'}
                </Typography>
              </Box>

              <Button
                variant="outlined"
                size="small"
                onClick={() => window.location.reload()}
                sx={{ mt: 2 }}
              >
                Refresh Status
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Authentication</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    mr: 1,
                    bgcolor: user ? 'success.main' : 'error.main'
                  }}
                />
                <Typography>
                  {user ? `Logged in as ${user.email}` : 'Not logged in'}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    mr: 1,
                    bgcolor: isVerified ? 'success.main' : 'warning.main'
                  }}
                />
                <Typography>
                  {isVerified ? 'Book Verified' : 'Book Not Verified'}
                </Typography>
              </Box>

              <Button
                variant="outlined"
                size="small"
                sx={{ mr: 1 }}
                onClick={() => {
                  appLog('StatusDashboard', 'Opening Login Page in new tab', 'info');
                  // Open in a new tab to preserve admin access
                  window.open('/#/login', '_blank');
                }}
              >
                Login Page
              </Button>

              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  appLog('StatusDashboard', 'Opening Verification Page in new tab', 'info');
                  // Open in a new tab to preserve admin access
                  window.open('/#/verify', '_blank');
                }}
              >
                Verification Page
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Reader Access</Typography>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={() => {
                  appLog('StatusDashboard', 'Opening Reader Dashboard in new tab', 'info');
                  // Open in a new tab to preserve admin access
                  window.open('/#/reader', '_blank');
                }}
                sx={{ mb: 1 }}
              >
                Go to Reader Dashboard
              </Button>

              <Button
                variant="outlined"
                fullWidth
                onClick={() => {
                  appLog('StatusDashboard', 'Opening Reader Interface in new tab', 'info');
                  // First set a flag to skip the welcome page
                  localStorage.setItem('skipWelcome', 'true');
                  // Clear any existing reading progress to start fresh
                  localStorage.removeItem('readingProgress');
                  // Open in a new tab to preserve admin access
                  window.open('/#/reader/read', '_blank');
                }}
                sx={{ mb: 2 }}
              >
                Start Reading
              </Button>

              <Typography variant="body2" color="text.secondary">
                Note: You need to be logged in and have a verified book to access the reader.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Test Pages</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="outlined"
                    fullWidth
                    component={RouterLink}
                    to="/test"
                  >
                    Basic Test Page
                  </Button>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="outlined"
                    fullWidth
                    component={RouterLink}
                    to="/supabase-test"
                  >
                    Supabase Test Page
                  </Button>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="outlined"
                    fullWidth
                    component={RouterLink}
                    to="/connection-test"
                    onClick={(e) => {
                      e.preventDefault();
                      window.open('/connection-test.html', '_blank');
                    }}
                  >
                    Connection Test
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Database Management Section */}
        <Grid item xs={12}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>Database Management</Typography>

              <Tabs
                value={currentTab}
                onChange={(_, newValue) => setCurrentTab(newValue)}
                sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab label="Schema Status" />
                <Tab label="Migrations" />
                <Tab label="Version History" />
                <Tab label="SQL Console" />
              </Tabs>

              {/* Schema Status Tab */}
              {currentTab === 0 && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ mr: 2 }}>Schema Verification</Typography>
                    {loadingMigrations ? (
                      <CircularProgress size={24} />
                    ) : schemaVerification ? (
                      schemaVerification.valid ? (
                        <Chip
                          icon={<CheckCircleIcon />}
                          label="Valid"
                          color="success"
                          variant="outlined"
                        />
                      ) : (
                        <Chip
                          icon={<ErrorIcon />}
                          label="Issues Detected"
                          color="error"
                          variant="outlined"
                        />
                      )
                    ) : (
                      <Chip
                        icon={<WarningIcon />}
                        label="Not Verified"
                        color="warning"
                        variant="outlined"
                      />
                    )}
                  </Box>

                  {schemaVerification && !schemaVerification.valid && (
                    <Box sx={{ mb: 3 }}>
                      {schemaVerification.missingTables.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle1" color="error" gutterBottom>
                            Missing Tables:
                          </Typography>
                          <ul>
                            {schemaVerification.missingTables.map(table => (
                              <li key={table}>{table}</li>
                            ))}
                          </ul>
                        </Box>
                      )}

                      {Object.keys(schemaVerification.missingColumns).length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle1" color="error" gutterBottom>
                            Missing Columns:
                          </Typography>
                          {Object.entries(schemaVerification.missingColumns).map(([table, columns]) => (
                            <Box key={table} sx={{ mb: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                Table: {table}
                              </Typography>
                              <ul>
                                {columns.map(column => (
                                  <li key={`${table}-${column}`}>{column}</li>
                                ))}
                              </ul>
                            </Box>
                          ))}
                        </Box>
                      )}

                      {schemaVerification.errors.length > 0 && (
                        <Box>
                          <Typography variant="subtitle1" color="error" gutterBottom>
                            Errors:
                          </Typography>
                          <ul>
                            {schemaVerification.errors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </Box>
                      )}
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={confirmRunMigrations}
                      disabled={loading || supabaseStatus !== 'connected'}
                      startIcon={loading ? <CircularProgress size={20} /> : null}
                      sx={{ mr: 2 }}
                    >
                      Run All Migrations
                    </Button>

                    <Button
                      variant="outlined"
                      onClick={() => loadMigrationData()}
                      disabled={loadingMigrations}
                      startIcon={loadingMigrations ? <CircularProgress size={20} /> : null}
                    >
                      Refresh Status
                    </Button>
                  </Box>

                  {/* Confirmation Dialog */}
                  {showConfirmDialog && (
                    <Box sx={{ mt: 2, p: 2, border: '1px solid #ccc', borderRadius: 1, bgcolor: '#f5f5f5' }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Are you sure you want to run all migrations?
                      </Typography>
                      <Typography variant="body2" paragraph color="warning.main">
                        This will modify your database schema. Make sure you have a backup before proceeding.
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => setShowConfirmDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="contained"
                          color="warning"
                          size="small"
                          onClick={runMigrations}
                        >
                          Yes, Run All Migrations
                        </Button>
                      </Box>
                    </Box>
                  )}

                  {migrationResult && (
                    <Alert
                      severity={migrationResult.success ? 'success' : 'error'}
                      sx={{ mt: 2 }}
                    >
                      {migrationResult.message}
                    </Alert>
                  )}
                </Box>
              )}

              {/* Migrations Tab */}
              {currentTab === 1 && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ mr: 2 }}>
                      Current Version: <strong>{currentVersion}</strong>
                    </Typography>
                    <Typography variant="subtitle1" sx={{ mr: 2 }}>
                      Target Version:
                    </Typography>
                    <TextField
                      type="number"
                      size="small"
                      value={targetVersion}
                      onChange={(e) => setTargetVersion(parseInt(e.target.value) || 0)}
                      inputProps={{ min: 0, max: Math.max(...availableMigrations.map(m => m.id), 0) }}
                      sx={{ width: 80 }}
                    />
                  </Box>

                  <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>ID</TableCell>
                          <TableCell>Name</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {availableMigrations.map((migration) => {
                          const isApplied = migration.id <= currentVersion;
                          const isPending = targetVersion >= migration.id && migration.id > currentVersion;
                          const willRollback = targetVersion < migration.id && migration.id <= currentVersion;

                          return (
                            <TableRow key={migration.id}>
                              <TableCell>{migration.id}</TableCell>
                              <TableCell>{migration.name}</TableCell>
                              <TableCell>{migration.description}</TableCell>
                              <TableCell>
                                {isApplied ? (
                                  <Chip
                                    size="small"
                                    label="Applied"
                                    color="success"
                                    variant="outlined"
                                  />
                                ) : isPending ? (
                                  <Chip
                                    size="small"
                                    label="Pending"
                                    color="primary"
                                    variant="outlined"
                                  />
                                ) : willRollback ? (
                                  <Chip
                                    size="small"
                                    label="Will Rollback"
                                    color="warning"
                                    variant="outlined"
                                  />
                                ) : (
                                  <Chip
                                    size="small"
                                    label="Not Applied"
                                    color="default"
                                    variant="outlined"
                                  />
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => openConfirmDialog('apply')}
                      disabled={migrationInProgress || targetVersion <= currentVersion}
                      startIcon={migrationInProgress ? <CircularProgress size={20} /> : null}
                    >
                      Apply Migrations
                    </Button>

                    <Button
                      variant="outlined"
                      color="warning"
                      onClick={() => openConfirmDialog('rollback')}
                      disabled={migrationInProgress || targetVersion >= currentVersion}
                      startIcon={migrationInProgress ? <CircularProgress size={20} /> : null}
                    >
                      Rollback Migrations
                    </Button>
                  </Box>

                  {sqlResult && (
                    <Alert
                      severity={sqlResult.success ? 'success' : 'error'}
                      sx={{ mt: 2 }}
                    >
                      {sqlResult.message}
                    </Alert>
                  )}
                </Box>
              )}

              {/* Version History Tab */}
              {currentTab === 2 && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Schema Version History
                  </Typography>

                  {loadingMigrations ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                      <CircularProgress />
                    </Box>
                  ) : versionHistory.length > 0 ? (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Version</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Applied At</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {versionHistory.map((version) => (
                            <TableRow key={version.id}>
                              <TableCell>{version.version}</TableCell>
                              <TableCell>{version.description}</TableCell>
                              <TableCell>
                                {new Date(version.applied_at).toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Alert severity="info">
                      No version history found. Run migrations to create the schema_versions table.
                    </Alert>
                  )}
                </Box>
              )}

              {/* SQL Console Tab */}
              {currentTab === 3 && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    SQL Console (Admin Only)
                  </Typography>
                  <Typography variant="body2" color="error" paragraph>
                    Warning: This allows direct execution of SQL statements. Use with extreme caution.
                  </Typography>

                  <TextField
                    label="SQL Query"
                    multiline
                    rows={6}
                    fullWidth
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    placeholder="Enter SQL query here..."
                    variant="outlined"
                    sx={{ mb: 2 }}
                    disabled={migrationInProgress}
                  />

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained"
                      color="warning"
                      onClick={handleExecuteSQL}
                      disabled={!sqlQuery.trim() || migrationInProgress}
                      startIcon={migrationInProgress ? <CircularProgress size={20} /> : null}
                    >
                      Execute SQL
                    </Button>

                    <Button
                      variant="outlined"
                      onClick={() => setSqlQuery('')}
                      disabled={!sqlQuery.trim() || migrationInProgress}
                    >
                      Clear
                    </Button>
                  </Box>

                  {sqlResult && (
                    <Alert
                      severity={sqlResult.success ? 'success' : 'error'}
                      sx={{ mt: 2 }}
                    >
                      {sqlResult.message}
                    </Alert>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>

          <Accordion defaultExpanded={false}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Database Diagnostics</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                {/* Database Status Card */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Database Status
                      </Typography>

                      {loading ? (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CircularProgress size={24} sx={{ mr: 2 }} />
                          <Typography>Checking status...</Typography>
                        </Box>
                      ) : (
                        <>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Chip
                              label={supabaseStatus === 'connected' ? 'Online' : supabaseStatus === 'error' ? 'Error' : 'Offline'}
                              color={supabaseStatus === 'connected' ? 'success' : supabaseStatus === 'error' ? 'error' : 'default'}
                              sx={{ mr: 2 }}
                            />
                            <Typography>
                              {supabaseStatus === 'connected'
                                ? 'Database is connected and operational'
                                : supabaseStatus === 'error'
                                  ? 'Database connection has errors'
                                  : 'Database is offline'}
                            </Typography>
                          </Box>

                          {bookData && (
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="subtitle2">Alice Book Info:</Typography>
                              <Typography variant="body2">ID: {bookData.id}</Typography>
                              <Typography variant="body2">Title: {bookData.title}</Typography>
                              <Typography variant="body2">Author: {bookData.author}</Typography>
                            </Box>
                          )}
                        </>
                      )}
                    </CardContent>
                    <Divider />
                    <Box sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: migrationResult ? 2 : 0 }}>
                        <Button
                          size="small"
                          onClick={() => window.location.reload()}
                          disabled={loading}
                        >
                          Refresh Status
                        </Button>
                        <Button
                          size="small"
                          color="primary"
                          variant="contained"
                          onClick={runMigrations}
                          disabled={loading || supabaseStatus !== 'connected'}
                        >
                          Run Database Fixes
                        </Button>
                      </Box>

                      {migrationResult && (
                        <Alert
                          severity={migrationResult.success ? 'success' : 'error'}
                          sx={{ mt: 2 }}
                        >
                          {migrationResult.message}
                        </Alert>
                      )}
                    </Box>
                  </Card>
                </Grid>

                {/* Test Results Card */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Database Tests
                      </Typography>

                      {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                          <CircularProgress />
                        </Box>
                      ) : Object.keys(testResults).length > 0 ? (
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Test</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Details</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {Object.entries(testResults).map(([test, result]) => (
                                <TableRow key={test}>
                                  <TableCell>{test.replace('_', ' ')}</TableCell>
                                  <TableCell>
                                    <Chip
                                      label={result.status === 'success' ? 'Pass' : result.status === 'error' ? 'Fail' : 'Pending'}
                                      color={result.status === 'success' ? 'success' : result.status === 'error' ? 'error' : 'default'}
                                      size="small"
                                    />
                                  </TableCell>
                                  <TableCell>{result.message}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Typography color="text.secondary" sx={{ p: 2 }}>
                          No test results available.
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Tables List */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Database Tables
                      </Typography>

                      {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                          <CircularProgress />
                        </Box>
                      ) : tables.length > 0 ? (
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Table Name</TableCell>
                                <TableCell>Row Count</TableCell>
                                <TableCell>Last Modified</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {tables.map((table: any) => (
                                <TableRow key={table.table_name}>
                                  <TableCell>{table.table_name}</TableCell>
                                  <TableCell>{table.row_count || 'N/A'}</TableCell>
                                  <TableCell>
                                    {table.last_modified
                                      ? new Date(table.last_modified).toLocaleString()
                                      : 'N/A'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Typography color="text.secondary" sx={{ p: 2 }}>
                          No tables found or unable to retrieve table information.
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>

      {/* Consultant Management */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h5" gutterBottom>Consultant Management</Typography>
        <Divider sx={{ mb: 2 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>Add New Consultant</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              label="Consultant Email"
              value={consultantEmail}
              onChange={(e) => setConsultantEmail(e.target.value)}
              placeholder="Enter email address"
              fullWidth
              disabled={addingConsultant}
            />
            <Button
              variant="contained"
              onClick={addConsultant}
              disabled={!consultantEmail.trim() || addingConsultant}
              startIcon={addingConsultant ? <CircularProgress size={20} /> : null}
            >
              Add
            </Button>
          </Box>
        </Box>

        <Typography variant="subtitle1" gutterBottom>Current Consultants</Typography>
        {loadingConsultants ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress />
          </Box>
        ) : consultantList.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            No consultants found. Add a consultant using the form above.
          </Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Added</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {consultantList.map((consultant) => (
                  <TableRow key={consultant.user_id}>
                    <TableCell>
                      {consultant.profiles?.first_name} {consultant.profiles?.last_name}
                    </TableCell>
                    <TableCell>{consultant.profiles?.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={consultant.is_active ? 'Active' : 'Inactive'}
                        color={consultant.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(consultant.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        size="small"
                        color={consultant.is_active ? 'warning' : 'success'}
                        onClick={() => toggleConsultantStatus(consultant.user_id, consultant.is_active)}
                      >
                        {consultant.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Confirmation Dialog for Migrations */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        aria-labelledby="migration-confirm-dialog-title"
      >
        <DialogTitle id="migration-confirm-dialog-title">
          {confirmAction === 'apply' ? 'Apply Migrations' : 'Rollback Migrations'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmAction === 'apply' ? (
              <>
                You are about to apply migrations from version <strong>{currentVersion}</strong> to <strong>{targetVersion}</strong>.
                This will modify your database schema. Make sure you have a backup before proceeding.
              </>
            ) : (
              <>
                You are about to roll back migrations from version <strong>{currentVersion}</strong> to <strong>{targetVersion}</strong>.
                This will revert your database schema. Make sure you have a backup before proceeding.
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmAction === 'apply' ? handleApplyMigrations : handleRollbackMigrations}
            color="warning"
            variant="contained"
            disabled={migrationInProgress}
            startIcon={migrationInProgress ? <CircularProgress size={20} /> : null}
          >
            {confirmAction === 'apply' ? 'Apply' : 'Rollback'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StatusDashboard;
