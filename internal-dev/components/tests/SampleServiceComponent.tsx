// src/components/test/SampleServiceComponent.tsx
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  TextField, 
  CircularProgress, 
  Alert,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useSampleService } from '../../hooks/useService';
import { appLog } from '../../../src/components/LogViewer';
import { SampleService, createSampleService } from '../../../src/services/sampleService';

/**
 * Sample Service Component
 * 
 * This component demonstrates how to use a service with the new hooks.
 */
const SampleServiceComponent: React.FC = () => {
  // Get the sample service using our custom hook
  const { 
    service: sampleService, 
    loading: serviceLoading, 
    error: serviceError 
  } = useSampleService();
  
  // Component state
  const [sampleData, setSampleData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  
  // Load sample data when the service is available
  useEffect(() => {
    if (sampleService) {
      loadSampleData();
    }
  }, [sampleService]);
  
  // Load sample data
  const loadSampleData = async () => {
    if (!sampleService) return;
    
    setLoading(true);
    setError(null);
    
    try {
      appLog('SampleComponent', 'Loading sample data', 'info');
      const data = await sampleService.getSampleData('sample-1');
      setSampleData(data);
      appLog('SampleComponent', 'Sample data loaded successfully', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      appLog('SampleComponent', `Error loading sample data: ${errorMessage}`, 'error');
      setError(`Error loading sample data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Create new sample data
  const createNewItem = async () => {
    if (!sampleService) return;
    
    if (!newItemName.trim()) {
      setError('Name is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      appLog('SampleComponent', 'Creating new sample data', 'info');
      const newData = await sampleService.createSampleData({
        name: newItemName,
        description: newItemDescription
      });
      
      // Update the sample data
      setSampleData(newData);
      
      // Clear form
      setNewItemName('');
      setNewItemDescription('');
      
      appLog('SampleComponent', 'New sample data created successfully', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      appLog('SampleComponent', `Error creating sample data: ${errorMessage}`, 'error');
      setError(`Error creating sample data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Delete sample data
  const deleteItem = async (id: string) => {
    if (!sampleService) return;
    
    setLoading(true);
    setError(null);
    
    try {
      appLog('SampleComponent', `Deleting sample data: ${id}`, 'info');
      await sampleService.deleteSampleData(id);
      setSampleData(null);
      appLog('SampleComponent', 'Sample data deleted successfully', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      appLog('SampleComponent', `Error deleting sample data: ${errorMessage}`, 'error');
      setError(`Error deleting sample data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };
  
  // If the service is loading
  if (serviceLoading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // If there's a service error
  if (serviceError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Service Error: {serviceError.message}
        </Alert>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Sample Service Demo
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Sample Data</Typography>
          
          <Button
            variant="outlined"
            startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
            onClick={loadSampleData}
            disabled={loading || !sampleService}
          >
            Refresh
          </Button>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress />
          </Box>
        ) : sampleData ? (
          <Box sx={{ mb: 3 }}>
            <List>
              <ListItem
                secondaryAction={
                  <IconButton edge="end" onClick={() => deleteItem(sampleData.id)}>
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={sampleData.name}
                  secondary={
                    <>
                      <Typography variant="body2" component="span">
                        {sampleData.description}
                      </Typography>
                      <br />
                      <Typography variant="caption" component="span">
                        ID: {sampleData.id}
                      </Typography>
                      <br />
                      <Typography variant="caption" component="span">
                        Created: {new Date(sampleData.createdAt).toLocaleString()}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            </List>
          </Box>
        ) : (
          <Alert severity="info" sx={{ mb: 3 }}>
            No sample data available. Create a new item or click Refresh.
          </Alert>
        )}
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="h6" gutterBottom>
          Create New Item
        </Typography>
        
        <Box component="form" noValidate autoComplete="off" sx={{ mt: 2 }}>
          <TextField
            label="Name"
            variant="outlined"
            fullWidth
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            disabled={loading}
            required
            sx={{ mb: 2 }}
          />
          
          <TextField
            label="Description"
            variant="outlined"
            fullWidth
            multiline
            rows={3}
            value={newItemDescription}
            onChange={(e) => setNewItemDescription(e.target.value)}
            disabled={loading}
            sx={{ mb: 2 }}
          />
          
          <Button
            variant="contained"
            onClick={createNewItem}
            disabled={loading || !newItemName.trim() || !sampleService}
          >
            {loading ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default SampleServiceComponent;
