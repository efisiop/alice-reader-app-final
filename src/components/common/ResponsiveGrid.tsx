// src/components/common/ResponsiveGrid.tsx
import React from 'react';
import { Grid, Box, useTheme, useMediaQuery } from '@mui/material';

interface ResponsiveGridProps {
  children: React.ReactNode;
  spacing?: number;
  columns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  minItemWidth?: number;
  maxColumns?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Responsive grid layout component
 */
const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  spacing = 2,
  columns = { xs: 1, sm: 2, md: 3, lg: 4, xl: 4 },
  minItemWidth = 280,
  maxColumns = 4,
  className,
  style
}) => {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.only('xs'));
  const isSm = useMediaQuery(theme.breakpoints.only('sm'));
  const isMd = useMediaQuery(theme.breakpoints.only('md'));
  const isLg = useMediaQuery(theme.breakpoints.only('lg'));
  const isXl = useMediaQuery(theme.breakpoints.up('xl'));
  
  // Determine number of columns based on breakpoint
  const getColumnCount = () => {
    if (isXs) return columns.xs || 1;
    if (isSm) return columns.sm || 2;
    if (isMd) return columns.md || 3;
    if (isLg) return columns.lg || 4;
    if (isXl) return columns.xl || 4;
    return 3; // Default
  };
  
  // Convert children to array
  const childrenArray = React.Children.toArray(children);
  
  // Calculate column count based on minItemWidth
  const calculateColumnCount = () => {
    const containerWidth = window.innerWidth - theme.spacing(4);
    const calculatedColumns = Math.floor(containerWidth / minItemWidth);
    return Math.min(Math.max(1, calculatedColumns), maxColumns);
  };
  
  // Use either the breakpoint-based columns or calculated columns
  const columnCount = minItemWidth ? calculateColumnCount() : getColumnCount();
  
  return (
    <Grid
      container
      spacing={spacing}
      className={className}
      style={style}
    >
      {childrenArray.map((child, index) => (
        <Grid
          item
          key={index}
          xs={12}
          sm={12 / Math.min(columns.sm || 2, childrenArray.length)}
          md={12 / Math.min(columns.md || 3, childrenArray.length)}
          lg={12 / Math.min(columns.lg || 4, childrenArray.length)}
          xl={12 / Math.min(columns.xl || 4, childrenArray.length)}
        >
          {child}
        </Grid>
      ))}
    </Grid>
  );
};

export default ResponsiveGrid;
