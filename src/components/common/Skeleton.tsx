// src/components/common/Skeleton.tsx
import React from 'react';
import { Box, Skeleton as MuiSkeleton, useTheme } from '@mui/material';

interface SkeletonProps {
  variant?: 'text' | 'rectangular' | 'rounded' | 'circular';
  width?: number | string;
  height?: number | string;
  animation?: 'pulse' | 'wave' | false;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Enhanced skeleton component with consistent styling
 */
const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  animation = 'pulse',
  className,
  style
}) => {
  const theme = useTheme();
  
  return (
    <MuiSkeleton
      variant={variant}
      width={width}
      height={height}
      animation={animation}
      className={className}
      style={{
        borderRadius: variant === 'circular' ? '50%' : theme.shape.borderRadius,
        ...style
      }}
    />
  );
};

/**
 * Text skeleton with multiple lines
 */
export const TextSkeleton: React.FC<{
  lines?: number;
  lastLineWidth?: number | string;
  spacing?: number;
  className?: string;
}> = ({
  lines = 3,
  lastLineWidth = '60%',
  spacing = 1,
  className
}) => {
  return (
    <Box className={className} sx={{ width: '100%' }}>
      {Array.from(new Array(lines)).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 && lastLineWidth ? lastLineWidth : '100%'}
          height={20}
          style={{ marginBottom: index < lines - 1 ? spacing * 8 : 0 }}
        />
      ))}
    </Box>
  );
};

/**
 * Card skeleton
 */
export const CardSkeleton: React.FC<{
  headerHeight?: number;
  contentLines?: number;
  width?: number | string;
  height?: number | string;
  className?: string;
}> = ({
  headerHeight = 40,
  contentLines = 4,
  width = '100%',
  height,
  className
}) => {
  return (
    <Box
      className={className}
      sx={{
        width,
        height,
        p: 2,
        borderRadius: 2,
        bgcolor: 'background.paper',
        boxShadow: 1
      }}
    >
      <Skeleton height={headerHeight} width="70%" style={{ marginBottom: 16 }} />
      <TextSkeleton lines={contentLines} />
    </Box>
  );
};

/**
 * Avatar with text skeleton
 */
export const AvatarWithTextSkeleton: React.FC<{
  avatarSize?: number;
  lines?: number;
  className?: string;
}> = ({
  avatarSize = 40,
  lines = 2,
  className
}) => {
  return (
    <Box className={className} sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
      <Skeleton
        variant="circular"
        width={avatarSize}
        height={avatarSize}
        style={{ marginRight: 16, flexShrink: 0 }}
      />
      <Box sx={{ flex: 1 }}>
        <TextSkeleton lines={lines} spacing={0.5} />
      </Box>
    </Box>
  );
};

/**
 * List item skeleton
 */
export const ListItemSkeleton: React.FC<{
  hasAvatar?: boolean;
  lines?: number;
  className?: string;
}> = ({
  hasAvatar = true,
  lines = 2,
  className
}) => {
  return (
    <Box
      className={className}
      sx={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        py: 1.5,
        px: 2,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}
    >
      {hasAvatar && (
        <Skeleton
          variant="circular"
          width={40}
          height={40}
          style={{ marginRight: 16, flexShrink: 0 }}
        />
      )}
      <Box sx={{ flex: 1 }}>
        <TextSkeleton lines={lines} spacing={0.5} />
      </Box>
    </Box>
  );
};

/**
 * Dashboard card skeleton
 */
export const DashboardCardSkeleton: React.FC<{
  hasIcon?: boolean;
  hasChart?: boolean;
  chartHeight?: number;
  className?: string;
}> = ({
  hasIcon = true,
  hasChart = false,
  chartHeight = 100,
  className
}) => {
  return (
    <Box
      className={className}
      sx={{
        width: '100%',
        p: 2,
        borderRadius: 2,
        bgcolor: 'background.paper',
        boxShadow: 1
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {hasIcon && (
          <Skeleton
            variant="circular"
            width={32}
            height={32}
            style={{ marginRight: 16, flexShrink: 0 }}
          />
        )}
        <Skeleton width="60%" height={28} />
      </Box>
      <Skeleton width="40%" height={60} style={{ marginBottom: 16 }} />
      {hasChart && (
        <Skeleton
          variant="rectangular"
          width="100%"
          height={chartHeight}
          style={{ marginTop: 16 }}
        />
      )}
    </Box>
  );
};

export default Skeleton;
