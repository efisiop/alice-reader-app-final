import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';

const MAX_LOGS = 100;

// Define the window interface with appLogs
declare global {
  interface Window {
    appLogs: any[];
  }
}

// Global log storage
if (typeof window !== 'undefined' && !window.appLogs) {
  window.appLogs = [];
}

// Global logging function
export const appLog = (message: string, type: 'info' | 'error' | 'warning' = 'info', data?: any) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    message,
    type,
    data: data ? JSON.stringify(data) : undefined
  };

  // Use the appropriate console method based on type
  if (type === 'error') {
    console.error(message, data);
  } else if (type === 'warning') {
    console.warn(message, data);
  } else {
    console.log(message, data);
  }

  if (typeof window !== 'undefined') {
    window.appLogs = [logEntry, ...window.appLogs].slice(0, MAX_LOGS);

    // Trigger log update event
    const event = new CustomEvent('app-log-update', { detail: logEntry });
    window.dispatchEvent(event);
  }
};

const LogViewer: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Initialize with existing logs
    if (typeof window !== 'undefined' && window.appLogs) {
      setLogs(window.appLogs);
    }

    // Listen for new logs
    const handleLogUpdate = (event: CustomEvent) => {
      setLogs(window.appLogs);
    };

    window.addEventListener('app-log-update', handleLogUpdate as EventListener);

    return () => {
      window.removeEventListener('app-log-update', handleLogUpdate as EventListener);
    };
  }, []);

  if (!expanded) {
    return (
      <Button
        variant="outlined"
        size="small"
        onClick={() => setExpanded(true)}
        sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}
      >
        Show Logs ({logs.length})
      </Button>
    );
  }

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 1000,
        width: 400,
        maxHeight: 400,
        overflow: 'auto',
        p: 2
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Application Logs</Typography>
        <Button size="small" onClick={() => setExpanded(false)}>Close</Button>
      </Box>

      {logs.length === 0 ? (
        <Typography color="text.secondary">No logs yet</Typography>
      ) : (
        logs.map((log, index) => (
          <Box key={index} sx={{ mb: 1, p: 1, borderLeft: '3px solid',
            borderColor: log.type === 'error' ? 'error.main' :
                        log.type === 'warning' ? 'warning.main' : 'info.main',
            bgcolor: 'background.paper'
          }}>
            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
              {new Date(log.timestamp).toLocaleTimeString()}
            </Typography>
            <Typography variant="body2">
              {log.message}
            </Typography>
            {log.data && (
              <Box
                component="pre"
                sx={{
                  mt: 1,
                  fontSize: '0.75rem',
                  overflow: 'auto',
                  bgcolor: 'background.default',
                  p: 1,
                  borderRadius: 1
                }}
              >
                {log.data}
              </Box>
            )}
          </Box>
        ))
      )}
    </Paper>
  );
};

export default LogViewer;
