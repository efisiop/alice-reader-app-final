import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Chip,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  LinearProgress
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import BookIcon from '@mui/icons-material/Book';
import TimerIcon from '@mui/icons-material/Timer';
import { useConsultant } from '../../contexts/ConsultantContext';
import { appLog } from '../../components/LogViewer';
import ReaderProfileView from './ReaderProfileView';

const AssignedReadersPanel: React.FC = () => {
  const { assignments } = useConsultant();
  const [selectedReaderId, setSelectedReaderId] = useState<string | null>(null);

  const handleViewProfile = (readerId: string) => {
    appLog('AssignedReadersPanel', 'View reader profile', 'info', { readerId });
    setSelectedReaderId(readerId);
  };

  const handleCloseProfile = () => {
    setSelectedReaderId(null);
  };

  // If a reader profile is selected, show that instead
  if (selectedReaderId) {
    return (
      <ReaderProfileView
        userId={selectedReaderId}
        onClose={handleCloseProfile}
      />
    );
  }

  if (assignments.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Readers Assigned
        </Typography>
        <Typography variant="body2" color="text.secondary">
          You don't have any readers assigned to you yet.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Your Assigned Readers ({assignments.length})
      </Typography>

      <Grid container spacing={3}>
        {assignments.map((assignment) => (
          <Grid item xs={12} md={6} key={assignment.id}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <PersonIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1">
                      {assignment.profiles?.first_name} {assignment.profiles?.last_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {assignment.profiles?.email}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 1 }} />

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <BookIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    Reading: Alice in Wonderland
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Reading Progress:
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={45}
                    sx={{ height: 8, borderRadius: 1 }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      45% complete
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      <TimerIcon fontSize="inherit" sx={{ verticalAlign: 'text-bottom', mr: 0.5 }} />
                      Last active: 2 days ago
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip
                    label="3 Help Requests"
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    label="5 Feedback Items"
                    size="small"
                    color="secondary"
                    variant="outlined"
                  />
                </Box>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  onClick={() => handleViewProfile(assignment.user_id)}
                >
                  View Details
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    appLog('AssignedReadersPanel', 'Send message clicked', 'info', {
                      readerId: assignment.user_id
                    });
                  }}
                >
                  Send Message
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default AssignedReadersPanel;
