/**
 * This file serves as a centralized module for notistack exports
 * to ensure proper bundling in production builds
 */

import React from 'react';
import { useSnackbar, SnackbarProvider } from 'notistack';

// Re-export everything from notistack
export { useSnackbar, SnackbarProvider };

// Define types for notistack
type SnackbarKey = string | number;
type SnackbarMessage = string | React.ReactNode;
type VariantType = 'default' | 'error' | 'success' | 'warning' | 'info';

// Add any custom notification utilities here
export const showNotification = (
  enqueueSnackbar: (message: SnackbarMessage, options?: any) => SnackbarKey,
  message: string,
  variant: VariantType = 'default'
) => {
  return enqueueSnackbar(message, { variant });
};

export const showSuccessNotification = (
  enqueueSnackbar: (message: SnackbarMessage, options?: any) => SnackbarKey,
  message: string
) => {
  return showNotification(enqueueSnackbar, message, 'success');
};

export const showErrorNotification = (
  enqueueSnackbar: (message: SnackbarMessage, options?: any) => SnackbarKey,
  message: string
) => {
  return showNotification(enqueueSnackbar, message, 'error');
};

export const showInfoNotification = (
  enqueueSnackbar: (message: SnackbarMessage, options?: any) => SnackbarKey,
  message: string
) => {
  return showNotification(enqueueSnackbar, message, 'info');
};

export const showWarningNotification = (
  enqueueSnackbar: (message: SnackbarMessage, options?: any) => SnackbarKey,
  message: string
) => {
  return showNotification(enqueueSnackbar, message, 'warning');
};

export default {
  useSnackbar,
  SnackbarProvider,
  showNotification,
  showSuccessNotification,
  showErrorNotification,
  showInfoNotification,
  showWarningNotification
};
