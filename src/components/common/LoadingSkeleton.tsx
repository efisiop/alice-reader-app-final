// src/components/common/LoadingSkeleton.tsx
import React from 'react';
import { Box, Skeleton, Stack } from '@mui/material';

type LoadingSkeletonVariant = 'text' | 'card' | 'list' | 'profile';

interface LoadingSkeletonProps {
  variant?: LoadingSkeletonVariant;
  count?: number;
  height?: number | string;
  width?: number | string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'text',
  count = 1,
  height,
  width = '100%',
}) => {
  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <Box
            sx={{
              width,
              height: height || 200,
              borderRadius: 1,
              overflow: 'hidden',
            }}
          >
            <Skeleton variant="rectangular" width="100%" height="60%" />
            <Box sx={{ p: 1 }}>
              <Skeleton variant="text" width="80%" />
              <Skeleton variant="text" width="60%" />
            </Box>
          </Box>
        );

      case 'list':
        return (
          <Stack spacing={1} width={width}>
            <Skeleton variant="text" width="100%" height={40} />
            <Skeleton variant="text" width="90%" height={40} />
            <Skeleton variant="text" width="95%" height={40} />
          </Stack>
        );

      case 'profile':
        return (
          <Box sx={{ width }}>
            <Skeleton variant="circular" width={80} height={80} sx={{ mb: 2 }} />
            <Skeleton variant="text" width="60%" height={32} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="40%" height={24} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" width="100%" height={120} />
          </Box>
        );

      default:
        return <Skeleton variant="text" width={width} height={height || 24} />;
    }
  };

  return (
    <Stack spacing={2}>
      {Array.from({ length: count }).map((_, index) => (
        <React.Fragment key={index}>{renderSkeleton()}</React.Fragment>
      ))}
    </Stack>
  );
};

export default LoadingSkeleton;
