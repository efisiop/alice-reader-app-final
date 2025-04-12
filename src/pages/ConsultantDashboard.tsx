import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Divider,
  Button,
  CircularProgress,
  Alert,
  Grid,
  useTheme,
  useMediaQuery
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import HelpIcon from '@mui/icons-material/Help';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { useNavigate } from 'react-router-dom';
import { useConsultant } from '../contexts/ConsultantContext';
import { useAuth } from '../contexts/AuthContext';
import AssignedReadersPanel from '../components/Consultant/AssignedReadersPanel';
import HelpRequestsPanel from '../components/Consultant/HelpRequestsPanel';
import FeedbackPanel from '../components/Consultant/FeedbackPanel';
import EnhancedReadersPanel from '../components/Consultant/EnhancedReadersPanel';
import EnhancedHelpRequestsPanel from '../components/Consultant/EnhancedHelpRequestsPanel';
import EnhancedFeedbackPanel from '../components/Consultant/EnhancedFeedbackPanel';
import DashboardOverview from '../components/Consultant/DashboardOverview';
import ReaderProfileView from '../components/Consultant/ReaderProfileView';
import LoadingState from '../components/common/LoadingState';
import { appLog } from '../components/LogViewer';

const ConsultantDashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const {
    isConsultant,
    isLoading,
    refreshAssignments,
    refreshRequests,
    refreshFeedback,
    selectedReader,
    selectReader,
    clearSelectedReader
  } = useConsultant();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    appLog('ConsultantDashboard', 'Refreshing data', 'info');

    try {
      await Promise.all([
        refreshAssignments(),
        refreshRequests(),
        refreshFeedback()
      ]);
      appLog('ConsultantDashboard', 'Data refreshed successfully', 'success');
    } catch (error) {
      appLog('ConsultantDashboard', 'Error refreshing data', 'error', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleViewReader = (userId: string) => {
    appLog('ConsultantDashboard', 'Viewing reader profile', 'info', { userId });
    selectReader(userId);
  };

  const handleBackToConsole = () => {
    appLog('ConsultantDashboard', 'Returning to console', 'info');
    clearSelectedReader();
  };

  if (isLoading) {
    return <LoadingState message="Loading consultant dashboard..." />;
  }

  if (!isConsultant) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Consultant Access Required
          </Typography>
          <Typography variant="body1" paragraph>
            You don't have consultant privileges. This area is restricted to authorized reading consultants only.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/reader')}
          >
            Return to Reader Dashboard
          </Button>
        </Paper>
      </Container>
    );
  }

  // If a reader is selected, show the reader profile view
  if (selectedReader) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Button variant="outlined" onClick={handleBackToConsole}>
            ← Back to Console
          </Button>
        </Box>
        <ReaderProfileView userId={selectedReader.user_id} onClose={handleBackToConsole} />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Consultant Dashboard</Typography>
        <Button
          variant="outlined"
          onClick={handleRefresh}
          disabled={refreshing}
          startIcon={refreshing ? <CircularProgress size={20} /> : null}
        >
          Refresh Data
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab icon={<DashboardIcon />} label="Overview" />
          <Tab icon={<PeopleIcon />} label="Assigned Readers" />
          <Tab icon={<HelpIcon />} label="Help Requests" />
          <Tab icon={<AssignmentIcon />} label="Reader Feedback" />
        </Tabs>
        <Divider />

        <Box sx={{ p: 3 }}>
          {tabValue === 0 && <DashboardOverview />}
          {tabValue === 1 && <EnhancedReadersPanel onViewReader={handleViewReader} />}
          {tabValue === 2 && <EnhancedHelpRequestsPanel onViewReader={handleViewReader} />}
          {tabValue === 3 && <EnhancedFeedbackPanel onViewReader={handleViewReader} />}
        </Box>
      </Paper>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Alert severity="info">
            <Typography variant="subtitle2">Consultant Guidelines</Typography>
            <Typography variant="body2">
              Remember to respond to help requests within 24 hours. Be supportive and encouraging in your responses.
              Focus on guiding readers to discover insights rather than simply providing answers.
            </Typography>
          </Alert>
        </Grid>
        <Grid item xs={12} md={6}>
          <Alert severity="warning">
            <Typography variant="subtitle2">Privacy Reminder</Typography>
            <Typography variant="body2">
              All reader data is confidential. Do not share reader information or feedback outside of the consultant team.
              Always respect reader privacy and maintain professional boundaries.
            </Typography>
          </Alert>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ConsultantDashboard;
