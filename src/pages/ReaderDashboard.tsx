import React from 'react';
import { 
  Container, Box, Typography, Paper, Grid, Button, 
  Card, CardContent, CardActions, LinearProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import HistoryIcon from '@mui/icons-material/History';

const ReaderDashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // Placeholder data - would come from backend in real implementation
  const readingProgress = 35; // percentage
  const lastReadPage = 42;
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome to Your Reading Journey
      </Typography>
      
      <Grid container spacing={3}>
        {/* Current Book */}
        <Grid item xs={12} md={8}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <MenuBookIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h5" component="h2">
                Alice in Wonderland
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Reading Progress
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={readingProgress} 
                sx={{ height: 10, borderRadius: 5 }}
              />
              <Typography variant="body2" sx={{ mt: 1 }}>
                {readingProgress}% Complete
              </Typography>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1">
                Last read: Page {lastReadPage}
              </Typography>
            </Box>
            
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => navigate('/reader/read')}
              startIcon={<MenuBookIcon />}
            >
              Continue Reading
            </Button>
          </Paper>
        </Grid>
        
        {/* Reading Stats */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            }}
          >
            <Typography variant="h6" component="h3" gutterBottom>
              Your Reading Journey
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <HistoryIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="body1">
                Reading time: 3 hours 15 minutes
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <BookmarkIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="body1">
                Bookmarks: 2
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        {/* Reading Insights */}
        <Grid xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" component="h3" gutterBottom>
              Reading Insights
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" component="div" gutterBottom>
                      Characters Explored
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      You've met 6 of 12 main characters so far in your journey.
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small">View Character Guide</Button>
                  </CardActions>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" component="div" gutterBottom>
                      Key Scenes
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      You've encountered 4 of 10 pivotal moments in the story.
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small">View Scene Timeline</Button>
                  </CardActions>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" component="div" gutterBottom>
                      Reading Pace
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Your average reading speed is about 35 pages per hour.
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small">View Reading Analytics</Button>
                  </CardActions>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ReaderDashboard;
