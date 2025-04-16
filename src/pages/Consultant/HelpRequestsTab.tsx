import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from '../../utils/notistackUtils';
import { consultantService } from '../../services/consultantService';
import { HelpRequest } from '../../types/helpRequest';
import { HelpRequestCard } from '../../components/HelpRequestCard';
import { LoadingIndicator } from '../../components/common/LoadingIndicator';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { LoadingButton } from '../../components/common/LoadingButton';

export const HelpRequestsTab: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const loadHelpRequests = async () => {
    try {
      setLoading(true);
      const requests = await consultantService.getHelpRequests(statusFilter === 'all' ? undefined : statusFilter);
      setHelpRequests(requests);
    } catch (error) {
      console.error('Error loading help requests:', error);
      enqueueSnackbar('Failed to load help requests', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHelpRequests();
  }, [statusFilter]);

  const handleStatusChange = async (requestId: string, newStatus: string) => {
    try {
      setUpdatingStatus(requestId);
      const updatedRequest = await consultantService.updateHelpRequestStatus(requestId, newStatus);
      setHelpRequests(prev =>
        prev.map(request => (request.id === requestId ? updatedRequest : request))
      );
      enqueueSnackbar('Status updated successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error updating status:', error);
      enqueueSnackbar('Failed to update status', { variant: 'error' });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleFilterChange = (event: SelectChangeEvent<string>) => {
    setStatusFilter(event.target.value);
  };

  const viewReaderProfile = (userId: string) => {
    navigate(`/reader/${userId}`);
  };

  if (loading) {
    return (
      <Box p={isMobile ? 2 : 3}>
        <Box
          mb={isMobile ? 2 : 3}
          display="flex"
          flexDirection={isMobile ? 'column' : 'row'}
          gap={isMobile ? 2 : 0}
          justifyContent="space-between"
          alignItems={isMobile ? 'stretch' : 'center'}
        >
          <Typography variant={isMobile ? 'h6' : 'h5'}>Help Requests</Typography>
          <LoadingSkeleton variant="text" width={isMobile ? '100%' : 150} height={40} />
        </Box>
        <Grid container spacing={isMobile ? 1.5 : 2}>
          {[1, 2, 3].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <LoadingSkeleton variant="card" />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box p={isMobile ? 2 : 3}>
      <Box
        mb={isMobile ? 2 : 3}
        display="flex"
        flexDirection={isMobile ? 'column' : 'row'}
        gap={isMobile ? 2 : 0}
        justifyContent="space-between"
        alignItems={isMobile ? 'stretch' : 'center'}
      >
        <Typography variant={isMobile ? 'h6' : 'h5'}>Help Requests</Typography>
        <Select
          value={statusFilter}
          onChange={handleFilterChange}
          size="small"
          fullWidth={isMobile}
          sx={{ minWidth: isMobile ? 'auto' : 150 }}
        >
          <MenuItem value="all">All Statuses</MenuItem>
          <MenuItem value="PENDING">Pending</MenuItem>
          <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
          <MenuItem value="RESOLVED">Resolved</MenuItem>
          <MenuItem value="CANCELLED">Cancelled</MenuItem>
        </Select>
      </Box>

      <Grid container spacing={isMobile ? 1.5 : 2}>
        {helpRequests.map(request => (
          <Grid
            item
            xs={12}
            sm={isTablet ? 12 : 6}
            md={4}
            key={request.id}
          >
            <HelpRequestCard
              request={request}
              onStatusChange={handleStatusChange}
              onViewProfile={() => viewReaderProfile(request.user_id)}
              loading={updatingStatus === request.id}
            />
          </Grid>
        ))}
        {helpRequests.length === 0 && (
          <Grid item xs={12}>
            <Typography
              variant="body1"
              textAlign="center"
              color="text.secondary"
              sx={{ py: isMobile ? 4 : 6 }}
            >
              No help requests found
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};