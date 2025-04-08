// src/App.tsx
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerificationPage from './pages/VerificationPage';
import ReaderDashboard from './pages/ReaderDashboard';
import ReaderInterface from './pages/ReaderInterface';

// Basic theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#6a51ae', // Purple shade for Alice in Wonderland theme
    },
    secondary: {
      main: '#ff6b8b', // Pink shade for highlights
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/verify"
              element={
                <ProtectedRoute requireVerification={false}>
                  <VerificationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reader"
              element={
                <ProtectedRoute>
                  <ReaderDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reader/read"
              element={
                <ProtectedRoute>
                  <ReaderInterface />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
