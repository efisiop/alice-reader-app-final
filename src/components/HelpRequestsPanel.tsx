import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Alert,
  Snackbar,
  useTheme,
  useMediaQuery,
  CircularProgress,
} from '@mui/material';
import { useConsultantService } from '../hooks/useConsultantService';
import { HelpRequest } from '../types/helpRequest';
import { StatusFilter } from './StatusFilter';
import { HelpRequestCard } from './HelpRequestCard';

type HelpRequestStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';

const statusOptions = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' }
];

export const HelpRequestsPanel: React.FC = () => {
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<HelpRequestStatus>('PENDING');
  const consultantService = useConsultantService();

  const handleStatusChange = async (requestId: string, newStatus: string) => {
    try {
      setLoading(true);
      await consultantService.updateHelpRequestStatus(requestId, newStatus as HelpRequestStatus);
      // Refresh the list after status change
      await fetchHelpRequests(selectedStatus as HelpRequestStatus);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update request status';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchHelpRequests = async (status: HelpRequestStatus) => {
    try {
      setLoading(true);
      setError(null);
      const helpRequests = await consultantService.getHelpRequests(status);
      setRequests(helpRequests);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch help requests';
      setError(errorMessage);
      console.error('Error fetching help requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHelpRequests(selectedStatus as HelpRequestStatus);
  }, [selectedStatus]);

  if (loading && requests.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box mb={2}>
        <StatusFilter
          value={selectedStatus}
          onChange={(status: string) => setSelectedStatus(status as HelpRequestStatus)}
          options={statusOptions}
        />
      </Box>
      <Box display="flex" flexDirection="column" gap={2}>
        {requests.map((request) => (
          <HelpRequestCard 
            key={request.id} 
            request={request} 
            onStatusChange={handleStatusChange}
            onViewProfile={(userId) => {/* Implement profile view */}}
            loading={loading}
          />
        ))}
        {requests.length === 0 && !loading && (
          <Typography variant="body1" color="text.secondary" textAlign="center">
            No help requests found for this status
          </Typography>
        )}
      </Box>
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}; 