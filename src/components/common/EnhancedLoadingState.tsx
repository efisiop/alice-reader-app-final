// src/components/common/EnhancedLoadingState.tsx
import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Paper,
  useTheme,
  Fade,
  LinearProgress
} from '@mui/material';
import { TRANSITIONS } from '../../theme/theme';

interface EnhancedLoadingStateProps {
  message?: string;
  fullHeight?: boolean;
  variant?: 'circular' | 'linear' | 'dots' | 'pulse';
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  className?: string;
  showPaper?: boolean;
  delay?: number;
  progress?: number;
}

/**
 * Enhanced loading state component with animations and variants
 */
const EnhancedLoadingState: React.FC<EnhancedLoadingStateProps> = ({
  message = 'Loading...',
  fullHeight = false,
  variant = 'circular',
  size = 'medium',
  color = 'primary',
  className = '',
  showPaper = false,
  delay = 300,
  progress
}) => {
  const theme = useTheme();
  const [visible, setVisible] = React.useState(delay === 0);
  
  // Show loading state after delay
  React.useEffect(() => {
    if (delay === 0) return;
    
    const timer = setTimeout(() => {
      setVisible(true);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [delay]);
  
  // Get size in pixels
  const getSize = () => {
    switch (size) {
      case 'small':
        return 24;
      case 'large':
        return 56;
      case 'medium':
      default:
        return 40;
    }
  };
  
  // Render loading indicator based on variant
  const renderLoadingIndicator = () => {
    switch (variant) {
      case 'linear':
        return (
          <Box sx={{ width: '100%', maxWidth: 300 }}>
            <LinearProgress
              color={color}
              variant={progress !== undefined ? 'determinate' : 'indeterminate'}
              value={progress}
              sx={{ height: 8, borderRadius: 4 }}
            />
            {progress !== undefined && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1, display: 'block', textAlign: 'center' }}
              >
                {Math.round(progress)}%
              </Typography>
            )}
          </Box>
        );
      case 'dots':
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {[0, 1, 2].map((i) => (
              <Box
                key={i}
                sx={{
                  width: getSize() / 3,
                  height: getSize() / 3,
                  borderRadius: '50%',
                  backgroundColor: theme.palette[color].main,
                  animation: 'pulse 1.5s infinite ease-in-out',
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </Box>
        );
      case 'pulse':
        return (
          <Box
            sx={{
              width: getSize(),
              height: getSize(),
              borderRadius: '50%',
              backgroundColor: theme.palette[color].main,
              opacity: 0.6,
              animation: 'pulse 1.5s infinite ease-in-out',
            }}
          />
        );
      case 'circular':
      default:
        return <CircularProgress color={color} size={getSize()} />;
    }
  };
  
  // Render content
  const renderContent = () => {
    const content = (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: fullHeight ? '100vh' : '50vh',
          gap: 2,
          p: 3,
        }}
      >
        {renderLoadingIndicator()}
        
        {message && (
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 2, textAlign: 'center' }}
          >
            {message}
          </Typography>
        )}
      </Box>
    );
    
    if (showPaper) {
      return (
        <Paper
          elevation={1}
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            maxWidth: 400,
            width: '100%',
          }}
        >
          {content}
        </Paper>
      );
    }
    
    return content;
  };
  
  return (
    <Fade
      in={visible}
      timeout={{
        enter: TRANSITIONS.MEDIUM,
        exit: TRANSITIONS.SHORT,
      }}
    >
      <Box className={className}>
        {renderContent()}
      </Box>
    </Fade>
  );
};

export default EnhancedLoadingState;
