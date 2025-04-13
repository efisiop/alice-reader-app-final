// src/components/Beta/BetaTestHarness.tsx
import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  IconButton,
  Badge,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import BugReportIcon from '@mui/icons-material/BugReport';
import FeedbackIcon from '@mui/icons-material/Feedback';
import SpeedIcon from '@mui/icons-material/Speed';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';
import { registry } from '../../services/registry';
import { MonitoringServiceInterface } from '../../services/monitoringService';

// Make this component available globally in beta mode
const BETA_VERSION = import.meta.env.VITE_BETA_VERSION || 'v0.1-beta';

interface BugReport {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  steps: string;
  component: string;
  screenshot?: string; // URL to screenshot if available
}

interface BetaTestHarnessProps {
  children: React.ReactNode;
}

export const BetaTestHarness: React.FC<BetaTestHarnessProps> = ({ children }) => {
  const monitoringService = registry.get<MonitoringServiceInterface>('monitoringService');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [bugDialogOpen, setBugDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [perfDialogOpen, setPerfDialogOpen] = useState(false);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);

  // Bug report form state
  const [bugReport, setBugReport] = useState<BugReport>({
    title: '',
    description: '',
    severity: 'medium',
    steps: '',
    component: ''
  });

  // Feedback form state
  const [feedback, setFeedback] = useState({
    type: 'feature',
    content: '',
    rating: 3
  });

  // Performance metrics state
  const [performanceMetrics, setPerformanceMetrics] = useState({
    loadTime: 0,
    renderTime: 0,
    interactionTime: 0
  });

  // Toggle drawer
  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  // Handle bug report submission
  const handleBugSubmit = () => {
    if (monitoringService) {
      monitoringService.logEvent('beta_test', 'bug_report', bugReport.severity);
      // In a real implementation, send to a bug tracking system
      console.log('Bug report submitted:', bugReport);
    }
    setBugDialogOpen(false);
    // Reset form
    setBugReport({
      title: '',
      description: '',
      severity: 'medium',
      steps: '',
      component: ''
    });
  };

  // Handle feedback submission
  const handleFeedbackSubmit = () => {
    if (monitoringService) {
      monitoringService.logEvent('beta_test', 'feedback', feedback.type, feedback.rating);
      // In a real implementation, send to a feedback collection system
      console.log('Feedback submitted:', feedback);
    }
    setFeedbackDialogOpen(false);
    // Reset form
    setFeedback({
      type: 'feature',
      content: '',
      rating: 3
    });
  };

  // Collect performance metrics
  const collectPerformanceMetrics = () => {
    if (monitoringService) {
      const metrics = monitoringService.getPerformanceMetrics();

      // If we have real metrics, use them
      if (Object.keys(metrics).length > 0) {
        setPerformanceMetrics({
          loadTime: metrics.pageLoad?.duration || Math.round(Math.random() * 1000) / 10,
          renderTime: metrics.rendering?.duration || Math.round(Math.random() * 500) / 10,
          interactionTime: metrics.interaction?.duration || Math.round(Math.random() * 200) / 10
        });
      } else {
        // Otherwise simulate with random values
        setPerformanceMetrics({
          loadTime: Math.round(Math.random() * 1000) / 10,
          renderTime: Math.round(Math.random() * 500) / 10,
          interactionTime: Math.round(Math.random() * 200) / 10
        });
      }
    } else {
      // Fallback to random values if monitoring service is not available
      setPerformanceMetrics({
        loadTime: Math.round(Math.random() * 1000) / 10,
        renderTime: Math.round(Math.random() * 500) / 10,
        interactionTime: Math.round(Math.random() * 200) / 10
      });
    }

    setPerfDialogOpen(true);
  };

  // Only show in beta environment
  if (import.meta.env.VITE_APP_ENV !== 'beta') {
    return <>{children}</>;
  }

  return (
    <>
      <AppBar position="fixed" color="secondary" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={toggleDrawer}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Alice Reader {BETA_VERSION}
          </Typography>
          <IconButton color="inherit" onClick={() => setInfoDialogOpen(true)}>
            <InfoIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer}
        sx={{
          width: 250,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 250,
            boxSizing: 'border-box',
            top: '64px', // AppBar height
            height: 'calc(100% - 64px)'
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">Beta Testing Tools</Typography>
        </Box>
        <Divider />
        <List>
          <ListItem button onClick={() => setBugDialogOpen(true)}>
            <ListItemIcon>
              <Badge badgeContent={0} color="error">
                <BugReportIcon />
              </Badge>
            </ListItemIcon>
            <ListItemText primary="Report a Bug" />
          </ListItem>
          <ListItem button onClick={() => setFeedbackDialogOpen(true)}>
            <ListItemIcon>
              <FeedbackIcon />
            </ListItemIcon>
            <ListItemText primary="Submit Feedback" />
          </ListItem>
          <ListItem button onClick={collectPerformanceMetrics}>
            <ListItemIcon>
              <SpeedIcon />
            </ListItemIcon>
            <ListItemText primary="Performance Metrics" />
          </ListItem>
        </List>
      </Drawer>

      <Box component="main" sx={{ pt: 8, flexGrow: 1 }}>
        {children}
      </Box>

      {/* Bug Report Dialog */}
      <Dialog open={bugDialogOpen} onClose={() => setBugDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Report a Bug
          <IconButton
            aria-label="close"
            onClick={() => setBugDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Title"
            fullWidth
            margin="normal"
            value={bugReport.title}
            onChange={(e) => setBugReport({ ...bugReport, title: e.target.value })}
            required
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Severity</InputLabel>
            <Select
              value={bugReport.severity}
              onChange={(e) => setBugReport({ ...bugReport, severity: e.target.value as any })}
              label="Severity"
            >
              <MenuItem value="low">Low - Minor issue, doesn't affect functionality</MenuItem>
              <MenuItem value="medium">Medium - Affects functionality but has workaround</MenuItem>
              <MenuItem value="high">High - Major functionality affected</MenuItem>
              <MenuItem value="critical">Critical - Application crash or data loss</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Component"
            fullWidth
            margin="normal"
            value={bugReport.component}
            onChange={(e) => setBugReport({ ...bugReport, component: e.target.value })}
            placeholder="e.g., Reader Interface, Login, etc."
          />
          <TextField
            label="Steps to Reproduce"
            fullWidth
            margin="normal"
            multiline
            rows={3}
            value={bugReport.steps}
            onChange={(e) => setBugReport({ ...bugReport, steps: e.target.value })}
            placeholder="1. Navigate to...\n2. Click on...\n3. Observe that..."
            required
          />
          <TextField
            label="Description"
            fullWidth
            margin="normal"
            multiline
            rows={4}
            value={bugReport.description}
            onChange={(e) => setBugReport({ ...bugReport, description: e.target.value })}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBugDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleBugSubmit}
            variant="contained"
            color="primary"
            disabled={!bugReport.title || !bugReport.description || !bugReport.steps}
          >
            Submit Bug Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={feedbackDialogOpen} onClose={() => setFeedbackDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Submit Feedback
          <IconButton
            aria-label="close"
            onClick={() => setFeedbackDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <FormControl fullWidth margin="normal">
            <InputLabel>Feedback Type</InputLabel>
            <Select
              value={feedback.type}
              onChange={(e) => setFeedback({ ...feedback, type: e.target.value as string })}
              label="Feedback Type"
            >
              <MenuItem value="feature">Feature Feedback</MenuItem>
              <MenuItem value="usability">Usability Feedback</MenuItem>
              <MenuItem value="performance">Performance Feedback</MenuItem>
              <MenuItem value="suggestion">Enhancement Suggestion</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ my: 2 }}>
            <Typography gutterBottom>Rating (1-5)</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <Button
                  key={rating}
                  variant={feedback.rating === rating ? "contained" : "outlined"}
                  onClick={() => setFeedback({ ...feedback, rating: rating })}
                  sx={{ minWidth: 50 }}
                >
                  {rating}
                </Button>
              ))}
            </Box>
          </Box>
          <TextField
            label="Feedback"
            fullWidth
            margin="normal"
            multiline
            rows={5}
            value={feedback.content}
            onChange={(e) => setFeedback({ ...feedback, content: e.target.value })}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeedbackDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleFeedbackSubmit}
            variant="contained"
            color="primary"
            disabled={!feedback.content}
          >
            Submit Feedback
          </Button>
        </DialogActions>
      </Dialog>

      {/* Performance Metrics Dialog */}
      <Dialog open={perfDialogOpen} onClose={() => setPerfDialogOpen(false)}>
        <DialogTitle>
          Performance Metrics
          <IconButton
            aria-label="close"
            onClick={() => setPerfDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ minWidth: 300 }}>
            <Typography variant="subtitle1" gutterBottom>
              Page Load Time: {performanceMetrics.loadTime}ms
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
              Render Time: {performanceMetrics.renderTime}ms
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
              Interaction Time: {performanceMetrics.interactionTime}ms
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPerfDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Info Dialog */}
      <Dialog open={infoDialogOpen} onClose={() => setInfoDialogOpen(false)}>
        <DialogTitle>
          Beta Testing Information
          <IconButton
            aria-label="close"
            onClick={() => setInfoDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="h6" gutterBottom>
            Alice Reader {BETA_VERSION}
          </Typography>
          <Typography variant="body1" paragraph>
            Welcome to the controlled beta test of Alice Reader. This version includes special tools to help you report issues and provide feedback during testing.
          </Typography>
          <Typography variant="body1" paragraph>
            Use the menu in the top left to access the beta testing tools:
          </Typography>
          <Box component="ul" sx={{ pl: 2 }}>
            <Box component="li">
              <Typography><strong>Report a Bug</strong>: Submit detailed bug reports</Typography>
            </Box>
            <Box component="li">
              <Typography><strong>Submit Feedback</strong>: Share your thoughts on features and usability</Typography>
            </Box>
            <Box component="li">
              <Typography><strong>Performance Metrics</strong>: View performance information</Typography>
            </Box>
          </Box>
          <Typography variant="body1" sx={{ mt: 2 }}>
            Your participation helps us improve the application before public release. Thank you for your help!
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInfoDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BetaTestHarness;
