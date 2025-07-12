// src/contexts/FeedbackContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import FeedbackSnackbar, { FeedbackVariant } from '../components/common/FeedbackSnackbar';

interface FeedbackContextType {
  showFeedback: (message: string, options?: FeedbackOptions) => void;
  showSuccess: (message: string, options?: Omit<FeedbackOptions, 'variant'>) => void;
  showError: (message: string, options?: Omit<FeedbackOptions, 'variant'>) => void;
  showInfo: (message: string, options?: Omit<FeedbackOptions, 'variant'>) => void;
  showWarning: (message: string, options?: Omit<FeedbackOptions, 'variant'>) => void;
  clearFeedback: () => void;
}

interface FeedbackOptions {
  variant?: FeedbackVariant;
  duration?: number;
  title?: string;
  action?: React.ReactNode;
  position?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
}

interface FeedbackState {
  open: boolean;
  message: string;
  variant: FeedbackVariant;
  duration: number;
  title?: string;
  action?: React.ReactNode;
  position: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
}

const initialState: FeedbackState = {
  open: false,
  message: '',
  variant: 'info',
  duration: 5000,
  position: {
    vertical: 'bottom',
    horizontal: 'center',
  },
};

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [feedback, setFeedback] = useState<FeedbackState>(initialState);
  
  // Show feedback with options
  const showFeedback = useCallback((message: string, options?: FeedbackOptions) => {
    setFeedback({
      open: true,
      message,
      variant: options?.variant || 'info',
      duration: options?.duration || 5000,
      title: options?.title,
      action: options?.action,
      position: options?.position || {
        vertical: 'bottom',
        horizontal: 'center',
      },
    });
  }, []);
  
  // Show success feedback
  const showSuccess = useCallback((message: string, options?: Omit<FeedbackOptions, 'variant'>) => {
    showFeedback(message, { ...options, variant: 'success' });
  }, [showFeedback]);
  
  // Show error feedback
  const showError = useCallback((message: string, options?: Omit<FeedbackOptions, 'variant'>) => {
    showFeedback(message, { ...options, variant: 'error' });
  }, [showFeedback]);
  
  // Show info feedback
  const showInfo = useCallback((message: string, options?: Omit<FeedbackOptions, 'variant'>) => {
    showFeedback(message, { ...options, variant: 'info' });
  }, [showFeedback]);
  
  // Show warning feedback
  const showWarning = useCallback((message: string, options?: Omit<FeedbackOptions, 'variant'>) => {
    showFeedback(message, { ...options, variant: 'warning' });
  }, [showFeedback]);
  
  // Clear feedback
  const clearFeedback = useCallback(() => {
    setFeedback((prev) => ({ ...prev, open: false }));
  }, []);
  
  // Handle close
  const handleClose = () => {
    clearFeedback();
  };
  
  return (
    <FeedbackContext.Provider
      value={{
        showFeedback,
        showSuccess,
        showError,
        showInfo,
        showWarning,
        clearFeedback,
      }}
    >
      {children}
      
      <FeedbackSnackbar
        open={feedback.open}
        message={feedback.message}
        variant={feedback.variant}
        autoHideDuration={feedback.duration}
        onClose={handleClose}
        title={feedback.title}
        action={feedback.action}
        anchorOrigin={feedback.position}
      />
    </FeedbackContext.Provider>
  );
};

export const useFeedback = (): FeedbackContextType => {
  const context = useContext(FeedbackContext);
  
  if (context === undefined) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  
  return context;
};

export default FeedbackContext;
