import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Box,
  Typography
} from '@mui/material';
import { getVerifiedReaders, ReaderProfile } from '../../services/consultantService';
import { appLog } from '../../components/LogViewer';

export const ReaderListView: React.FC = () => {
  const navigate = useNavigate();
  const [readers, setReaders] = useState<ReaderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReaders = async () => {
      try {
        appLog('ReaderListView', 'Fetching verified readers', 'info');
        const data = await getVerifiedReaders();
        setReaders(data);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch readers';
        setError(message);
        appLog('ReaderListView', `Error fetching readers: ${message}`, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchReaders();
  }, []);

  const handleRowClick = (readerId: string) => {
    appLog('ReaderListView', `Navigating to reader profile: ${readerId}`, 'info');
    navigate(`/consultant-dashboard/reader/${readerId}`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (readers.length === 0) {
    return (
      <Typography variant="body1" color="text.secondary" align="center">
        No verified readers found.
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Book Verified</TableCell>
            <TableCell>Joined</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {readers.map((reader) => (
            <TableRow
              key={reader.id}
              hover
              sx={{ 
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
              onClick={() => handleRowClick(reader.id)}
            >
              <TableCell>
                {reader.first_name} {reader.last_name}
              </TableCell>
              <TableCell>{reader.email}</TableCell>
              <TableCell>{reader.book_verified ? 'Yes' : 'No'}</TableCell>
              <TableCell>
                {new Date(reader.created_at).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}; 