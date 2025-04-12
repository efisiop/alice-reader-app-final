// src/main-test.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import AppTest from './AppTest';
import './index.css';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppTest />
    </ThemeProvider>
  </React.StrictMode>
);
