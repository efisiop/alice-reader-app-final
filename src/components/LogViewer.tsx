import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, IconButton, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';

// Maximum number of logs to keep
const MAX_LOGS = 200;

// Log entry structure
export interface LogEntry {
  timestamp: string;
  component: string;
  message: string;
  type: 'info' | 'error' | 'warning' | 'debug' | 'success';
  data?: any;
  stackTrace?: string;
}

// TypeScript declaration for global appLogs
declare global {
  interface Window {
    appLogs: LogEntry[];
  }
}

// Initialize global logs array if it doesn't exist
if (typeof window !== 'undefined' && !window.appLogs) {
  window.appLogs = [];
}

// Global logging function with proper console method selection
export const appLog = (
  component: string,
  message: string,
  type: 'info' | 'error' | 'warning' | 'debug' | 'success' = 'info',
  data?: any
) => {
  try {
    // Get stack trace for errors
    let stackTrace;
    if (type === 'error') {
      const err = new Error();
      stackTrace = err.stack;
    }

    // Format data for better display
    let formattedData;
    try {
      if (data) {
        if (data instanceof Error) {
          formattedData = {
            message: data.message,
            stack: data.stack,
            name: data.name
          };
        } else if (typeof data === 'object') {
          formattedData = JSON.stringify(data, null, 2);
        } else {
          formattedData = String(data);
        }
      }
    } catch (e) {
      formattedData = 'Error formatting data: ' + String(e);
    }

    // Create log entry
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      component,
      message,
      type,
      data: formattedData,
      stackTrace
    };

    // Select the correct console method
    switch (type) {
      case 'error':
        console.error(`[${component}]`, message, data);
        break;
      case 'warning':
        console.warn(`[${component}]`, message, data);
        break;
      case 'debug':
        console.debug(`[${component}]`, message, data);
        break;
      case 'success':
        console.info(`%c[${component}] ${message}`, 'color: green', data);
        break;
      case 'info':
      default:
        console.info(`[${component}]`, message, data);
        break;
    }

    // Add to global logs
    if (typeof window !== 'undefined') {
      window.appLogs = [logEntry, ...window.appLogs].slice(0, MAX_LOGS);

      // Trigger log update event
      const event = new CustomEvent('app-log-update', { detail: logEntry });
      window.dispatchEvent(event);
    }
  } catch (err) {
    // Fallback if the logging itself fails
    console.error('Logging error:', err);
  }
};

const LogViewer: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  // Update logs when they change
  useEffect(() => {
    const updateLogs = () => {
      if (typeof window !== 'undefined' && window.appLogs) {
        setLogs(window.appLogs);
      }
    };

    // Initial load
    updateLogs();

    // Listen for log updates
    const handleLogUpdate = () => updateLogs();
    window.addEventListener('app-log-update', handleLogUpdate);

    return () => {
      window.removeEventListener('app-log-update', handleLogUpdate);
    };
  }, []);

  // Filter logs based on selected type
  const filteredLogs = filter === 'all'
    ? logs
    : logs.filter(log => log.type === filter);

  // Copy logs to clipboard
  const copyLogs = () => {
    const logText = filteredLogs
      .map(log => {
        const time = new Date(log.timestamp).toLocaleTimeString();
        return `[${time}] [${log.component}] [${log.type.toUpperCase()}] ${log.message}${log.data ? '\nData: ' + log.data : ''}${log.stackTrace ? '\nStack: ' + log.stackTrace : ''}`;
      })
      .join('\n\n');

    navigator.clipboard.writeText(logText)
      .then(() => alert('Logs copied to clipboard'))
      .catch(err => console.error('Failed to copy logs:', err));
  };

  // Clear all logs
  const clearLogs = () => {
    if (typeof window !== 'undefined') {
      window.appLogs = [];
      setLogs([]);
    }
  };

  if (!expanded) {
    const errorCount = logs.filter(log => log.type === 'error').length;

    return (
      <Button
        variant="contained"
        color={errorCount > 0 ? "error" : "primary"}
        onClick={() => setExpanded(true)}
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000,
          boxShadow: 3
        }}
      >
        Logs {logs.length > 0 && `(${logs.length}${errorCount > 0 ? `, ${errorCount} errors` : ''})`}
      </Button>
    );
  }

  // Color coding for log types
  const getColorForType = (type: string) => {
    switch (type) {
      case 'error': return '#f44336';
      case 'warning': return '#ff9800';
      case 'success': return '#4caf50';
      case 'debug': return '#2196f3';
      default: return '#757575';
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 1000,
        width: { xs: '90vw', sm: 500 },
        maxHeight: { xs: '70vh', sm: '60vh' },
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#f8f9fa'
      }}
    >
      {/* Header with controls */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        p: 1,
        borderBottom: '1px solid #e0e0e0',
      }}>
        <Typography variant="h6" sx={{ fontSize: '1rem' }}>
          Application Logs ({filteredLogs.length})
        </Typography>
        <Box>
          <Tooltip title="Copy logs to clipboard">
            <IconButton size="small" onClick={copyLogs}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Clear logs">
            <IconButton size="small" onClick={clearLogs}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <IconButton size="small" onClick={() => setExpanded(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Filter controls */}
      <Box sx={{
        display: 'flex',
        gap: 1,
        p: 1,
        borderBottom: '1px solid #e0e0e0',
        overflowX: 'auto',
      }}>
        {['all', 'info', 'error', 'warning', 'success', 'debug'].map((type) => (
          <Button
            key={type}
            variant={filter === type ? 'contained' : 'outlined'}
            size="small"
            color={type === 'error' ? 'error' :
                   type === 'warning' ? 'warning' :
                   type === 'success' ? 'success' :
                   'primary'}
            sx={{ textTransform: 'capitalize', minWidth: 'auto' }}
            onClick={() => setFilter(type)}
          >
            {type}
          </Button>
        ))}
      </Box>

      {/* Log entries */}
      <Box sx={{
        flex: 1,
        overflow: 'auto',
        p: 1,
        backgroundColor: '#fff'
      }}>
        {filteredLogs.length === 0 ? (
          <Typography color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
            No logs to display
          </Typography>
        ) : (
          filteredLogs.map((log, index) => (
            <Box key={index} sx={{
              mb: 1.5,
              p: 1.5,
              borderRadius: 1,
              boxShadow: 1,
              borderLeft: '4px solid',
              borderColor: getColorForType(log.type),
              backgroundColor: log.type === 'error' ? '#fff8f8' :
                             log.type === 'warning' ? '#fffbf0' :
                             log.type === 'success' ? '#f0fff6' : '#ffffff'
            }}>
              {/* Log header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', color: getColorForType(log.type) }}>
                  {log.component}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {new Date(log.timestamp).toLocaleTimeString()}
                </Typography>
              </Box>

              {/* Log message */}
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {log.message}
              </Typography>

              {/* Log data */}
              {log.data && (
                <Box
                  component="pre"
                  sx={{
                    mt: 1,
                    p: 1,
                    fontSize: '0.75rem',
                    backgroundColor: 'rgba(0,0,0,0.04)',
                    borderRadius: 1,
                    overflow: 'auto',
                    maxHeight: 200,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}
                >
                  {log.data}
                </Box>
              )}

              {/* Stack trace for errors */}
              {log.type === 'error' && log.stackTrace && (
                <Tooltip title="Click to copy stack trace">
                  <Box
                    component="pre"
                    onClick={() => {
                      navigator.clipboard.writeText(log.stackTrace || '');
                      alert('Stack trace copied to clipboard');
                    }}
                    sx={{
                      mt: 1,
                      p: 1,
                      fontSize: '0.65rem',
                      backgroundColor: 'rgba(0,0,0,0.06)',
                      borderRadius: 1,
                      overflow: 'auto',
                      maxHeight: 100,
                      cursor: 'pointer',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      color: 'text.secondary',
                      '&:hover': {
                        backgroundColor: 'rgba(0,0,0,0.08)',
                      }
                    }}
                  >
                    {log.stackTrace}
                  </Box>
                </Tooltip>
              )}
            </Box>
          ))
        )}
      </Box>
    </Paper>
  );
};

export default LogViewer;

// Add TypeScript declaration for window
declare global {
  interface Window {
    appLogs: LogEntry[];
  }
}
