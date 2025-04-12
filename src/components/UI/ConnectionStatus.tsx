import React, { useState, useEffect } from 'react';
import { Chip, Tooltip } from '@mui/material';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import { checkSupabaseConnection, startConnectionMonitoring } from '../../services/supabaseClient';
import { appLog } from '../LogViewer';

const ConnectionStatus: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  
  useEffect(() => {
    appLog('ConnectionStatus', 'Initializing connection monitoring', 'info');
    
    const checkConnection = async () => {
      const connected = await checkSupabaseConnection();
      setIsConnected(connected);
    };
    
    // Initial check
    checkConnection();
    
    // Start periodic monitoring
    const cleanup = startConnectionMonitoring();
    
    // Listen for connection status changes
    const handleConnectionChange = (event: CustomEvent) => {
      setIsConnected(event.detail.isConnected);
    };
    
    window.addEventListener('connection-status-change', handleConnectionChange as EventListener);
    
    return () => {
      cleanup();
      window.removeEventListener('connection-status-change', handleConnectionChange as EventListener);
    };
  }, []);
  
  return (
    <Tooltip title={isConnected ? "Connected to server" : "Using offline mode"}>
      <Chip
        icon={isConnected ? <WifiIcon fontSize="small" /> : <WifiOffIcon fontSize="small" />}
        label={isConnected ? "Online" : "Offline"}
        color={isConnected ? "success" : "error"}
        size="small"
        variant="outlined"
        sx={{ ml: 1 }}
      />
    </Tooltip>
  );
};

export default ConnectionStatus;
