// src/pages/Consultant/ReadersList.tsx
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MessageIcon from '@mui/icons-material/Message';
import HelpIcon from '@mui/icons-material/Help';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useConsultantService, useAnalyticsService } from '../../hooks/useService';
import { usePerformance } from '../../hooks/usePerformance';
import { useAuth } from '../../contexts/AuthContext';

const ReadersList: React.FC = () => {
  const { user } = useAuth();
  const { service: consultantService, loading: consultantLoading } = useConsultantService();
  const { service: analyticsService } = useAnalyticsService();
  
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readers, setReaders] = useState<any[]>([]);
  const [filteredReaders, setFilteredReaders] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [progressFilter, setProgressFilter] = useState('all');
  
  // Track performance
  usePerformance({
    trackPageLoad: true,
    trackRender: true,
    componentName: 'ReadersList'
  });
  
  // Load readers
  useEffect(() => {
    if (!consultantService || !user) return;
    
    const loadReaders = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const startTime = performance.now();
        const data = await consultantService.getAssignedReaders(user.id);
        
        // In a real app, we would use the actual data from the service
        // For now, we'll use mock data
        const mockReaders = [
          { id: 'r1', name: 'Leo Johnson', email: 'leo.j@example.com', progress: 35, lastActive: '2 hours ago', status: 'active', helpRequests: 1, book: 'Alice in Wonderland', joinDate: '2023-05-15' },
          { id: 'r2', name: 'Sarah Williams', email: 'sarah.w@example.com', progress: 68, lastActive: '1 day ago', status: 'inactive', helpRequests: 0, book: 'Alice in Wonderland', joinDate: '2023-04-22' },
          { id: 'r3', name: 'Michael Brown', email: 'michael.b@example.com', progress: 12, lastActive: '3 hours ago', status: 'active', helpRequests: 1, book: 'Alice in Wonderland', joinDate: '2023-06-01' },
          { id: 'r4', name: 'Emma Davis', email: 'emma.d@example.com', progress: 89, lastActive: '5 hours ago', status: 'active', helpRequests: 0, book: 'Alice in Wonderland', joinDate: '2023-03-10' },
          { id: 'r5', name: 'James Wilson', email: 'james.w@example.com', progress: 45, lastActive: '2 days ago', status: 'inactive', helpRequests: 0, book: 'Alice in Wonderland', joinDate: '2023-05-05' },
          { id: 'r6', name: 'Olivia Martinez', email: 'olivia.m@example.com', progress: 22, lastActive: '1 hour ago', status: 'active', helpRequests: 0, book: 'Alice in Wonderland', joinDate: '2023-06-10' },
          { id: 'r7', name: 'William Taylor', email: 'william.t@example.com', progress: 75, lastActive: '4 hours ago', status: 'active', helpRequests: 0, book: 'Alice in Wonderland', joinDate: '2023-04-15' },
          { id: 'r8', name: 'Sophia Anderson', email: 'sophia.a@example.com', progress: 5, lastActive: '3 days ago', status: 'inactive', helpRequests: 0, book: 'Alice in Wonderland', joinDate: '2023-06-05' },
          { id: 'r9', name: 'Benjamin Thomas', email: 'benjamin.t@example.com', progress: 50, lastActive: '6 hours ago', status: 'active', helpRequests: 0, book: 'Alice in Wonderland', joinDate: '2023-05-20' },
          { id: 'r10', name: 'Isabella Jackson', email: 'isabella.j@example.com', progress: 95, lastActive: '30 minutes ago', status: 'active', helpRequests: 0, book: 'Alice in Wonderland', joinDate: '2023-03-25' },
          { id: 'r11', name: 'Mason White', email: 'mason.w@example.com', progress: 60, lastActive: '1 day ago', status: 'inactive', helpRequests: 0, book: 'Alice in Wonderland', joinDate: '2023-04-30' },
          { id: 'r12', name: 'Charlotte Harris', email: 'charlotte.h@example.com', progress: 40, lastActive: '5 hours ago', status: 'active', helpRequests: 0, book: 'Alice in Wonderland', joinDate: '2023-05-25' }
        ];
        
        setReaders(data?.readers || mockReaders);
        setFilteredReaders(data?.readers || mockReaders);
        
        // Track page view
        if (analyticsService) {
          analyticsService.trackPageView('readers_list', {
            userId: user.id
          });
        }
      } catch (error) {
        console.error('Error loading readers:', error);
        setError('Failed to load readers. Please try again.');
        
        // Track error
        if (analyticsService) {
          analyticsService.trackEvent('readers_list_error', {
            error: String(error)
          });
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadReaders();
  }, [consultantService, user, analyticsService]);
  
  // Filter readers when search query or filters change
  useEffect(() => {
    if (!readers.length) return;
    
    let filtered = [...readers];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(reader => 
        reader.name.toLowerCase().includes(query) || 
        reader.email.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(reader => reader.status === statusFilter);
    }
    
    // Apply progress filter
    if (progressFilter !== 'all') {
      switch (progressFilter) {
        case 'beginner':
          filtered = filtered.filter(reader => reader.progress < 25);
          break;
        case 'intermediate':
          filtered = filtered.filter(reader => reader.progress >= 25 && reader.progress < 75);
          break;
        case 'advanced':
          filtered = filtered.filter(reader => reader.progress >= 75);
          break;
      }
    }
    
    setFilteredReaders(filtered);
    setPage(0); // Reset to first page when filters change
  }, [readers, searchQuery, statusFilter, progressFilter]);
  
  // Handle page change
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Handle status filter change
  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
    
    // Track filter change
    if (analyticsService) {
      analyticsService.trackEvent('reader_filter_change', {
        filterType: 'status',
        value: event.target.value
      });
    }
  };
  
  // Handle progress filter change
  const handleProgressFilterChange = (event: SelectChangeEvent) => {
    setProgressFilter(event.target.value);
    
    // Track filter change
    if (analyticsService) {
      analyticsService.trackEvent('reader_filter_change', {
        filterType: 'progress',
        value: event.target.value
      });
    }
  };
  
  // Handle search
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    
    // Track search
    if (analyticsService && event.target.value) {
      analyticsService.trackEvent('reader_search', {
        query: event.target.value
      });
    }
  };
  
  if (loading || consultantLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error" variant="h6" gutterBottom>
          {error}
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => window.location.reload()}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3, maxWidth: '1200px', mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <Button 
          component={RouterLink} 
          to="/consultant"
          startIcon={<ArrowBackIcon />}
          sx={{ mr: 2 }}
        >
          Dashboard
        </Button>
        <Typography variant="h4">
          Assigned Readers
        </Typography>
      </Box>
      
      {/* Filters */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search by name or email"
              value={searchQuery}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                id="status-filter"
                value={statusFilter}
                label="Status"
                onChange={handleStatusFilterChange}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel id="progress-filter-label">Progress</InputLabel>
              <Select
                labelId="progress-filter-label"
                id="progress-filter"
                value={progressFilter}
                label="Progress"
                onChange={handleProgressFilterChange}
              >
                <MenuItem value="all">All Progress</MenuItem>
                <MenuItem value="beginner">Beginner (0-25%)</MenuItem>
                <MenuItem value="intermediate">Intermediate (25-75%)</MenuItem>
                <MenuItem value="advanced">Advanced (75-100%)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="outlined" 
                startIcon={<FilterListIcon />}
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setProgressFilter('all');
                }}
              >
                Reset
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Readers Table */}
      <Paper sx={{ width: '100%', mb: 4, borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.light' }}>
                <TableCell>Reader</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Last Active</TableCell>
                <TableCell>Help Requests</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredReaders
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((reader) => (
                  <TableRow key={reader.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">{reader.name}</Typography>
                        <Typography variant="body2" color="text.secondary">{reader.email}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={reader.status === 'active' ? 'Active' : 'Inactive'} 
                        color={reader.status === 'active' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={reader.progress} 
                            sx={{ height: 8, borderRadius: 5 }}
                          />
                        </Box>
                        <Box sx={{ minWidth: 35 }}>
                          <Typography variant="body2" color="text.secondary">{`${Math.round(reader.progress)}%`}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{reader.lastActive}</TableCell>
                    <TableCell>
                      {reader.helpRequests > 0 ? (
                        <Chip 
                          label={reader.helpRequests} 
                          color="error"
                          size="small"
                        />
                      ) : (
                        <Typography variant="body2">None</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Profile">
                        <IconButton 
                          component={RouterLink} 
                          to={`/consultant/readers/${reader.id}`}
                          color="primary"
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Send Message">
                        <IconButton 
                          component={RouterLink} 
                          to={`/consultant/message/${reader.id}`}
                          color="secondary"
                        >
                          <MessageIcon />
                        </IconButton>
                      </Tooltip>
                      {reader.helpRequests > 0 && (
                        <Tooltip title="View Help Requests">
                          <IconButton 
                            component={RouterLink} 
                            to={`/consultant/help-requests?reader=${reader.id}`}
                            color="error"
                          >
                            <HelpIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              {filteredReaders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1">No readers found matching your filters</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredReaders.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
      
      {/* Summary */}
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Summary
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" color="text.secondary">
              Total Readers:
            </Typography>
            <Typography variant="h5">
              {readers.length}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" color="text.secondary">
              Active Readers:
            </Typography>
            <Typography variant="h5">
              {readers.filter(r => r.status === 'active').length}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" color="text.secondary">
              Pending Help Requests:
            </Typography>
            <Typography variant="h5">
              {readers.reduce((total, reader) => total + reader.helpRequests, 0)}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default ReadersList;
