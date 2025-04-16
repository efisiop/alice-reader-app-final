import React from 'react';
import { SnackbarProvider as NotistackProvider } from '../../utils/notistackUtils';
import { useTheme } from '@mui/material/styles';

interface SnackbarProviderProps {
  children: React.ReactNode;
}

export const SnackbarProvider: React.FC<SnackbarProviderProps> = ({ children }) => {
  const theme = useTheme();

  return (
    <NotistackProvider
      maxSnack={3}
      autoHideDuration={3000}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      style={{
        zIndex: theme.zIndex.snackbar,
      }}
    >
      {children}
    </NotistackProvider>
  );
};

export default SnackbarProvider;
