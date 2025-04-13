// src/components/test/ServiceTestComponent.tsx
import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, CircularProgress, List, ListItem, ListItemText, Divider, Button, TextField, Alert } from '@mui/material';
import { appLog } from '../../../src/components/LogViewer';
import { createSampleService } from '../../../src/services/sampleService';
import { createBookService } from '../../../src/services/bookService';
import { registry, SERVICE_NAMES } from '../../../src/services/serviceRegistry';

const ServiceTestComponent: React.FC = () => {
  const [userData, setUserData] = useState<any>(null);
  const [bookData, setBookData] = useState<any>(null);
  const [pageData, setPageData] = useState<any>(null);
  const [progressData, setProgressData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registeredServices, setRegisteredServices] = useState<string[]>([]);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get list of registered services
        setRegisteredServices(registry.listServices());
        
        // Check if services are registered
        if (!registry.has('authService') || !registry.has('bookService')) {
          throw new Error('Required services not registered');
        }
        
        // Get services
        const authService = registry.get('authService');
        const bookService = registry.get('bookService');
        
        // Load data
        const user = await authService.getCurrentUser();
        setUserData(user);
        
        const userProfile = await authService.getUserProfile(user.id);
        
        const book = await bookService.getBook('alice-in-wonderland');
        setBookData(book);
        
        const page = await bookService.getPage('alice-in-wonderland', 1);
        setPageData(page);
        
        const progress = await bookService.getReadingProgress(user.id, 'alice-in-wonderland');
        setProgressData(progress);
        
      } catch (err: any) {
        console.error('Error loading data:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Paper sx={{ p: 3, bgcolor: '#ffebee' }}>
          <Typography color="error" variant="h6" gutterBottom>Error:</Typography>
          <Typography color="error">{error}</Typography>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Registered Services:
            </Typography>
            {registeredServices.length > 0 ? (
              <List dense>
                {registeredServices.map((service) => (
                  <ListItem key={service}>
                    <ListItemText primary={service} />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography>No services registered</Typography>
            )}
          </Box>
        </Paper>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 4, maxWidth: '800px', mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Service Test Component
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          User Data
        </Typography>
        <List dense>
          <ListItem>
            <ListItemText primary="ID" secondary={userData?.id} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Email" secondary={userData?.email} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Name" secondary={`${userData?.firstName} ${userData?.lastName}`} />
          </ListItem>
        </List>
      </Paper>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Book Data
        </Typography>
        <List dense>
          <ListItem>
            <ListItemText primary="ID" secondary={bookData?.id} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Title" secondary={bookData?.title} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Author" secondary={bookData?.author} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Total Pages" secondary={bookData?.totalPages} />
          </ListItem>
        </List>
        
        {bookData?.coverImage && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <img 
              src={bookData.coverImage} 
              alt={bookData.title} 
              style={{ maxWidth: '200px', maxHeight: '300px' }} 
            />
          </Box>
        )}
      </Paper>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Page Data
        </Typography>
        <List dense>
          <ListItem>
            <ListItemText primary="Title" secondary={pageData?.title} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Page Number" secondary={pageData?.pageNumber} />
          </ListItem>
        </List>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle1" gutterBottom>
          Content:
        </Typography>
        <Typography variant="body1">
          {pageData?.content}
        </Typography>
      </Paper>
      
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Reading Progress
        </Typography>
        <List dense>
          <ListItem>
            <ListItemText primary="Current Page" secondary={progressData?.current_page} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Current Chapter" secondary={progressData?.current_chapter} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Progress" secondary={`${progressData?.percentage_complete}%`} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Total Reading Time" secondary={`${Math.round((progressData?.total_reading_time || 0) / 60)} hours ${(progressData?.total_reading_time || 0) % 60} minutes`} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Last Read" secondary={new Date(progressData?.last_read_at).toLocaleString()} />
          </ListItem>
        </List>
      </Paper>
      
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="subtitle1" gutterBottom>
          Registered Services:
        </Typography>
        <Paper sx={{ p: 2 }}>
          <List dense>
            {registeredServices.map((service) => (
              <ListItem key={service}>
                <ListItemText primary={service} />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>
    </Box>
  );
};

export default ServiceTestComponent;
