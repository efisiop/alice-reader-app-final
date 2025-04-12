// src/components/common/PageTransition.tsx
import React, { useState, useEffect } from 'react';
import { Fade, Grow, Slide, Zoom, Box } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { TRANSITIONS } from '../../theme/theme';

type TransitionVariant = 'fade' | 'grow' | 'slide' | 'zoom' | 'none';
type SlideDirection = 'up' | 'down' | 'left' | 'right';

interface PageTransitionProps {
  children: React.ReactNode;
  variant?: TransitionVariant;
  direction?: SlideDirection;
  duration?: number;
  easing?: string;
  delay?: number;
}

/**
 * Component for smooth page transitions
 */
const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  variant = 'fade',
  direction = 'up',
  duration = TRANSITIONS.MEDIUM,
  easing = 'cubic-bezier(0.4, 0, 0.2, 1)',
  delay = 0
}) => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  
  // Reset visibility on route change
  useEffect(() => {
    setIsVisible(false);
    
    // Small delay to ensure transition starts after route change
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);
    
    return () => clearTimeout(timer);
  }, [location.pathname]);
  
  // Apply transition based on variant
  const renderTransition = () => {
    const transitionProps = {
      in: isVisible,
      timeout: {
        enter: duration,
        exit: duration / 2
      },
      style: {
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: easing
      },
      unmountOnExit: true,
      children: <Box>{children}</Box>
    };
    
    switch (variant) {
      case 'fade':
        return <Fade {...transitionProps} />;
      case 'grow':
        return <Grow {...transitionProps} />;
      case 'slide':
        return <Slide {...transitionProps} direction={direction} />;
      case 'zoom':
        return <Zoom {...transitionProps} />;
      case 'none':
      default:
        return children;
    }
  };
  
  return renderTransition();
};

export default PageTransition;
