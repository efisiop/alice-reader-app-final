// src/components/common/ResponsiveImage.tsx
import React, { useState, useEffect } from 'react';
import { Box, Skeleton, useTheme } from '@mui/material';
import { TRANSITIONS } from '../../theme/theme';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  aspectRatio?: number;
  borderRadius?: number | string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  className?: string;
  style?: React.CSSProperties;
  fallbackSrc?: string;
  lazyLoad?: boolean;
  onClick?: () => void;
  hoverEffect?: boolean;
}

/**
 * Responsive image component with loading state and fallback
 */
const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  width = '100%',
  height,
  aspectRatio,
  borderRadius = 8,
  objectFit = 'cover',
  className,
  style,
  fallbackSrc,
  lazyLoad = true,
  onClick,
  hoverEffect = false
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  
  // Load image
  useEffect(() => {
    if (!src) {
      setError(true);
      setLoading(false);
      return;
    }
    
    // Reset state when src changes
    setLoading(true);
    setError(false);
    
    // If lazyLoad is disabled, set the image src immediately
    if (!lazyLoad) {
      setImageSrc(src);
      return;
    }
    
    // Create an observer for lazy loading
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setImageSrc(src);
          observer.disconnect();
        }
      });
    });
    
    // Get the container element
    const container = document.getElementById(`image-container-${src.replace(/[^a-zA-Z0-9]/g, '')}`);
    
    if (container) {
      observer.observe(container);
    } else {
      // If container is not found, load the image immediately
      setImageSrc(src);
    }
    
    return () => {
      observer.disconnect();
    };
  }, [src, lazyLoad]);
  
  // Handle image load
  const handleLoad = () => {
    setLoading(false);
  };
  
  // Handle image error
  const handleError = () => {
    setError(true);
    setLoading(false);
    
    if (fallbackSrc) {
      setImageSrc(fallbackSrc);
    }
  };
  
  // Calculate height based on aspect ratio
  const calculatedHeight = aspectRatio && typeof width === 'number'
    ? width / aspectRatio
    : height;
  
  return (
    <Box
      id={`image-container-${src.replace(/[^a-zA-Z0-9]/g, '')}`}
      sx={{
        position: 'relative',
        width,
        height: calculatedHeight,
        borderRadius,
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        transition: `all ${TRANSITIONS.MEDIUM}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        ...(hoverEffect && {
          '&:hover': {
            transform: 'scale(1.03)',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
          },
        }),
      }}
      className={className}
      style={style}
      onClick={onClick}
    >
      {loading && (
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          animation="wave"
          sx={{ position: 'absolute', top: 0, left: 0, borderRadius }}
        />
      )}
      
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            width: '100%',
            height: '100%',
            objectFit,
            borderRadius,
            opacity: loading ? 0 : 1,
            transition: `opacity ${TRANSITIONS.MEDIUM}ms cubic-bezier(0.4, 0, 0.2, 1)`,
          }}
        />
      )}
      
      {error && !fallbackSrc && (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.palette.grey[200],
            color: theme.palette.text.secondary,
            fontSize: '0.875rem',
            borderRadius,
          }}
        >
          {alt || 'Image not available'}
        </Box>
      )}
    </Box>
  );
};

export default ResponsiveImage;
