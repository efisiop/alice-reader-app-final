// src/components/Reader/ReadingProgressWidget.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
  Collapse,
  useTheme
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SpeedIcon from '@mui/icons-material/Speed';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import { getBasicReadingStats } from '../../services/statisticsService';
import { appLog } from '../LogViewer';
import { BookId, UserId } from '../../types/idTypes';

interface ReadingProgressWidgetProps {
  userId: string | UserId;
  bookId: string | BookId;
  currentPage?: number;
  totalPages?: number;
  expanded?: boolean;
  onToggleExpand?: () => void;
}

/**
 * A mini-widget for displaying reading progress
 */
const ReadingProgressWidget: React.FC<ReadingProgressWidgetProps> = ({
  userId,
  bookId,
  currentPage = 1,
  totalPages = 100,
  expanded = false,
  onToggleExpand
}) => {
  const theme = useTheme();
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(expanded);
  
  // Load reading statistics
  useEffect(() => {
    loadStats();
  }, [userId, bookId]);
  
  // Update expanded state from props
  useEffect(() => {
    setIsExpanded(expanded);
  }, [expanded]);
  
  // Load reading statistics
  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      appLog('ReadingProgressWidget', 'Loading reading statistics', 'info', { userId, bookId });
      
      const basicStats = await getBasicReadingStats(userId, bookId);
      
      if (basicStats) {
        appLog('ReadingProgressWidget', 'Reading statistics loaded successfully', 'success');
        setStats(basicStats);
      } else {
        appLog('ReadingProgressWidget', 'No reading statistics found', 'info');
      }
    } catch (error) {
      appLog('ReadingProgressWidget', 'Error loading reading statistics', 'error', error);
      setError('Failed to load reading statistics');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle toggle expand
  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
    if (onToggleExpand) {
      onToggleExpand();
    }
  };
  
  // Format minutes as hours and minutes
  const formatMinutes = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours} hr`;
    }
    
    return `${hours} hr ${remainingMinutes} min`;
  };
  
  // Calculate percentage complete
  const percentageComplete = stats
    ? stats.percentage_complete
    : Math.round((currentPage / totalPages) * 100);
  
  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        borderRadius: 2,
        backgroundColor: theme.palette.background.paper,
        boxShadow: theme.shadows[3]
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle1" fontWeight="medium">
          Reading Progress
        </Typography>
        
        <IconButton size="small" onClick={handleToggleExpand}>
          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            {percentageComplete}% Complete
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Page {currentPage} of {totalPages}
          </Typography>
        </Box>
        
        <LinearProgress
          variant="determinate"
          value={percentageComplete}
          sx={{ height: 8, borderRadius: 4 }}
        />
      </Box>
      
      <Collapse in={isExpanded}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {stats && (
            <>
              <Tooltip title="Total Reading Time">
                <Chip
                  icon={<AccessTimeIcon />}
                  label={formatMinutes(Math.round(stats.total_reading_time / 60))}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Tooltip>
              
              <Tooltip title="Pages Read">
                <Chip
                  icon={<MenuBookIcon />}
                  label={`${stats.pages_read} pages`}
                  size="small"
                  color="secondary"
                  variant="outlined"
                />
              </Tooltip>
              
              {stats.streak_days > 0 && (
                <Tooltip title="Reading Streak">
                  <Chip
                    icon={<LocalFireDepartmentIcon />}
                    label={`${stats.streak_days} day streak`}
                    size="small"
                    color="error"
                    variant="outlined"
                  />
                </Tooltip>
              )}
              
              {stats.reading_pace > 0 && (
                <Tooltip title="Reading Pace">
                  <Chip
                    icon={<SpeedIcon />}
                    label={`${stats.reading_pace.toFixed(1)} pages/hr`}
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                </Tooltip>
              )}
            </>
          )}
          
          {!stats && !loading && (
            <Typography variant="body2" color="text.secondary">
              Start reading to see your statistics!
            </Typography>
          )}
          
          {loading && (
            <Typography variant="body2" color="text.secondary">
              Loading statistics...
            </Typography>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default ReadingProgressWidget;
