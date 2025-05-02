import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Switch, 
  FormControlLabel, 
  Paper,
  Alert,
  Snackbar
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { appLog } from '../../components/LogViewer';

// Default proxy settings
const DEFAULT_PROXY_SETTINGS = {
  host: '',
  port: 8080,
  username: '',
  password: '',
  enabled: false
};

const ProxySettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [proxySettings, setProxySettings] = useState(DEFAULT_PROXY_SETTINGS);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // Load saved settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('proxy_settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setProxySettings(parsedSettings);
        appLog('ProxySettings', 'Loaded proxy settings from localStorage', 'info');
      } catch (error) {
        appLog('ProxySettings', 'Error parsing saved proxy settings', 'error');
        console.error('Error parsing saved proxy settings:', error);
      }
    }
  }, []);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setProxySettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Save settings to localStorage
      localStorage.setItem('proxy_settings', JSON.stringify(proxySettings));
      
      // Show success message
      setSnackbarMessage('Proxy settings saved successfully. Please refresh the page for changes to take effect.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      appLog('ProxySettings', 'Proxy settings saved', 'success');
    } catch (error) {
      // Show error message
      setSnackbarMessage('Error saving proxy settings');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      
      appLog('ProxySettings', 'Error saving proxy settings', 'error');
      console.error('Error saving proxy settings:', error);
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Handle reset to defaults
  const handleReset = () => {
    setProxySettings(DEFAULT_PROXY_SETTINGS);
    localStorage.removeItem('proxy_settings');
    
    setSnackbarMessage('Proxy settings reset to defaults');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
    
    appLog('ProxySettings', 'Proxy settings reset to defaults', 'info');
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Proxy Settings
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="body1" paragraph>
          Configure proxy settings for connecting to Supabase through a corporate proxy.
          These settings will be saved in your browser's local storage.
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          After saving your proxy settings, you'll need to refresh the page for the changes to take effect.
        </Alert>
        
        <form onSubmit={handleSubmit}>
          <FormControlLabel
            control={
              <Switch
                checked={proxySettings.enabled}
                onChange={handleChange}
                name="enabled"
                color="primary"
              />
            }
            label="Enable Proxy"
            sx={{ mb: 2, display: 'block' }}
          />
          
          <TextField
            label="Proxy Host"
            name="host"
            value={proxySettings.host}
            onChange={handleChange}
            fullWidth
            margin="normal"
            disabled={!proxySettings.enabled}
            placeholder="e.g., proxy.company.com"
            helperText="Your corporate proxy server hostname or IP address"
          />
          
          <TextField
            label="Proxy Port"
            name="port"
            type="number"
            value={proxySettings.port}
            onChange={handleChange}
            fullWidth
            margin="normal"
            disabled={!proxySettings.enabled}
            placeholder="e.g., 8080"
            helperText="The port number for your proxy server"
          />
          
          <Typography variant="subtitle1" sx={{ mt: 2 }}>
            Authentication (Optional)
          </Typography>
          
          <TextField
            label="Username"
            name="username"
            value={proxySettings.username}
            onChange={handleChange}
            fullWidth
            margin="normal"
            disabled={!proxySettings.enabled}
            helperText="Username for proxy authentication (if required)"
          />
          
          <TextField
            label="Password"
            name="password"
            type="password"
            value={proxySettings.password}
            onChange={handleChange}
            fullWidth
            margin="normal"
            disabled={!proxySettings.enabled}
            helperText="Password for proxy authentication (if required)"
          />
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleReset}
            >
              Reset to Defaults
            </Button>
            
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={!proxySettings.enabled || !proxySettings.host}
            >
              Save Settings
            </Button>
          </Box>
        </form>
      </Paper>
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProxySettingsPage;
