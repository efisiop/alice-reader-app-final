// src/components/common/PageWrapper.tsx
import React from 'react';
import { Box, Container, Paper, Typography, Breadcrumbs, Link, useTheme } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import PageTransition from './PageTransition';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface PageWrapperProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  padding?: number;
  paper?: boolean;
  paperProps?: React.ComponentProps<typeof Paper>;
  className?: string;
  transitionVariant?: 'fade' | 'grow' | 'slide' | 'zoom' | 'none';
}

/**
 * Page wrapper component with consistent styling and transitions
 */
const PageWrapper: React.FC<PageWrapperProps> = ({
  children,
  title,
  subtitle,
  breadcrumbs,
  maxWidth = 'lg',
  padding = 3,
  paper = true,
  paperProps,
  className,
  transitionVariant = 'fade'
}) => {
  const theme = useTheme();
  
  // Render breadcrumbs
  const renderBreadcrumbs = () => {
    if (!breadcrumbs || breadcrumbs.length === 0) return null;
    
    return (
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{ mb: 2 }}
      >
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          
          if (isLast || !item.path) {
            return (
              <Typography key={index} color="text.primary">
                {item.label}
              </Typography>
            );
          }
          
          return (
            <Link
              key={index}
              component={RouterLink}
              to={item.path}
              color="inherit"
              underline="hover"
            >
              {item.label}
            </Link>
          );
        })}
      </Breadcrumbs>
    );
  };
  
  // Render header
  const renderHeader = () => {
    if (!title && !subtitle) return null;
    
    return (
      <Box sx={{ mb: 3 }}>
        {title && (
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            className="fade-in-up"
            sx={{ fontWeight: 500 }}
          >
            {title}
          </Typography>
        )}
        
        {subtitle && (
          <Typography
            variant="subtitle1"
            color="text.secondary"
            className="fade-in-up stagger-1"
          >
            {subtitle}
          </Typography>
        )}
      </Box>
    );
  };
  
  // Render content
  const renderContent = () => {
    if (!paper) {
      return children;
    }
    
    return (
      <Paper
        elevation={1}
        sx={{ p: padding, borderRadius: 2 }}
        className="scale-in"
        {...paperProps}
      >
        {children}
      </Paper>
    );
  };
  
  return (
    <PageTransition variant={transitionVariant}>
      <Container maxWidth={maxWidth} sx={{ py: 4 }} className={className}>
        {renderBreadcrumbs()}
        {renderHeader()}
        {renderContent()}
      </Container>
    </PageTransition>
  );
};

export default PageWrapper;
