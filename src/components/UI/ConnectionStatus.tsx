import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Chip, 
  Tooltip, 
  IconButton,
  Collapse,
  Paper,
  Alert
} from '@mui/material';
import { 
  CheckCircle, 
  Error, 
  Warning, 
  Info, 
  ExpandMore, 
  ExpandLess,
  Refresh
} from '@mui/icons-material';
import { checkSupabaseConnection } from '../../services/supabaseClient';
import { getAllGlossaryTerms, getTermCount } from '../../services/glossaryService';
import { appLog } from '../LogViewer';

interface ConnectionDetails {
  supabase: boolean;
  glossaryTerms: number;
  lastCheck: Date;
  error?: string;
}

const ConnectionStatus: React.FC = () => {
  const [connectionDetails, setConnectionDetails] = useState<ConnectionDetails | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const checkAllConnections = async () => {
    try {
      setIsChecking(true);
      setLastRefresh(new Date());

      // Check Supabase connection
      const supabaseConnected = await checkSupabaseConnection(true);
      
      let glossaryTerms = 0;
      let error: string | undefined;

      if (supabaseConnected) {
        try {
          // Try to load glossary terms
          const terms = await getAllGlossaryTerms();
          glossaryTerms = terms.size;
        } catch (glossaryError) {
          error = `Glossary error: ${glossaryError instanceof Error ? glossaryError.message : String(glossaryError)}`;
          appLog('ConnectionStatus', 'Error loading glossary terms', 'error', glossaryError);
        }
      } else {
        error = 'Supabase connection failed';
      }

      setConnectionDetails({
        supabase: supabaseConnected,
        glossaryTerms,
        lastCheck: new Date(),
        error
      });

      appLog('ConnectionStatus', `Connection check completed - Supabase: ${supabaseConnected}, Glossary terms: ${glossaryTerms}`, supabaseConnected ? 'success' : 'error');
    } catch (error) {
      setConnectionDetails({
        supabase: false,
        glossaryTerms: 0,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : String(error)
      });
      appLog('ConnectionStatus', 'Error checking connections', 'error', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    let checkInterval: NodeJS.Timeout;

    const initialCheck = async () => {
      if (!mounted) return;
      await checkAllConnections();
    };

    // Initial check
    initialCheck();

    // Set up periodic checks
    checkInterval = setInterval(() => {
      if (mounted) {
        checkAllConnections();
      }
    }, 60000); // Check every minute

    return () => {
      mounted = false;
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    };
  }, []);

  const getStatusColor = () => {
    if (!connectionDetails) return 'warning';
    if (connectionDetails.supabase && connectionDetails.glossaryTerms > 0) return 'success';
    if (connectionDetails.supabase) return 'warning';
    return 'error';
  };

  const getStatusIcon = () => {
    if (isChecking) return <CircularProgress size={16} />;
    if (!connectionDetails) return <Warning sx={{ fontSize: 16 }} />;
    if (connectionDetails.supabase && connectionDetails.glossaryTerms > 0) return <CheckCircle sx={{ fontSize: 16 }} />;
    if (connectionDetails.supabase) return <Warning sx={{ fontSize: 16 }} />;
    return <Error sx={{ fontSize: 16 }} />;
  };

  const getStatusText = () => {
    if (isChecking) return 'Checking...';
    if (!connectionDetails) return 'Unknown';
    if (connectionDetails.supabase && connectionDetails.glossaryTerms > 0) return 'Connected';
    if (connectionDetails.supabase) return 'Partial';
    return 'Disconnected';
  };

  const getStatusDescription = () => {
    if (!connectionDetails) return 'Connection status unknown';
    if (connectionDetails.supabase && connectionDetails.glossaryTerms > 0) {
      return `Supabase: ✅, Glossary: ${connectionDetails.glossaryTerms} terms`;
    }
    if (connectionDetails.supabase) {
      return 'Supabase: ✅, Glossary: ❌';
    }
    return 'Supabase: ❌';
  };

    return (
    <Box sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 0.5, 
          minWidth: 180,
          maxWidth: 250,
          border: 1,
          borderColor: getStatusColor() === 'success' ? 'success.main' : 
                       getStatusColor() === 'warning' ? 'warning.main' : 'error.main'
        }}
      >
        {/* Main Status Bar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
          {getStatusIcon()}
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            {getStatusText()}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton 
            size="small" 
            onClick={checkAllConnections}
            disabled={isChecking}
            sx={{ p: 0.25 }}
          >
            <Refresh sx={{ fontSize: 14 }} />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => setExpanded(!expanded)}
            sx={{ p: 0.25 }}
          >
            {expanded ? <ExpandLess sx={{ fontSize: 14 }} /> : <ExpandMore sx={{ fontSize: 14 }} />}
          </IconButton>
        </Box>

        {/* Status Description */}
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
          {getStatusDescription()}
        </Typography>

        {/* Expanded Details */}
        <Collapse in={expanded}>
          <Box sx={{ pt: 1, borderTop: 1, borderColor: 'divider' }}>
            
            {/* Connection Details */}
            {connectionDetails && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Connection Details:
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box 
                      sx={{ 
                        width: 6, 
                        height: 6, 
                        borderRadius: '50%',
                        backgroundColor: connectionDetails.supabase ? 'success.main' : 'error.main'
                      }} 
                    />
                    <Typography variant="caption">
                      Supabase: {connectionDetails.supabase ? 'Connected' : 'Failed'}
        </Typography>
      </Box>
                  
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box
        sx={{
                        width: 6, 
                        height: 6, 
          borderRadius: '50%',
                        backgroundColor: connectionDetails.glossaryTerms > 0 ? 'success.main' : 'error.main'
        }}
      />
                    <Typography variant="caption">
                      Glossary Terms: {connectionDetails.glossaryTerms} loaded
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}

            {/* Error Details */}
            {connectionDetails?.error && (
              <Alert severity="error" sx={{ mb: 1, py: 0.5 }}>
                <Typography variant="caption">
                  {connectionDetails.error}
                </Typography>
              </Alert>
            )}

            {/* Last Check Time */}
            <Typography variant="caption" color="text.secondary">
              Last check: {lastRefresh.toLocaleTimeString()}
            </Typography>

            {/* Troubleshooting Tips */}
            {connectionDetails && !connectionDetails.supabase && (
              <Box sx={{ mt: 1, p: 1, bgcolor: 'warning.light', borderRadius: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                  Troubleshooting:
                </Typography>
                <Typography variant="caption" sx={{ display: 'block' }}>
                  • Check your internet connection
                </Typography>
                <Typography variant="caption" sx={{ display: 'block' }}>
                  • Verify Supabase credentials in .env
                </Typography>
                <Typography variant="caption" sx={{ display: 'block' }}>
                  • Check browser console for errors
      </Typography>
              </Box>
            )}
          </Box>
        </Collapse>
      </Paper>
    </Box>
  );
};

export default ConnectionStatus;
