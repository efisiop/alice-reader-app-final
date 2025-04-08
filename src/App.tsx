// src/App.tsx
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import theme from './utils/theme';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerificationPage from './pages/VerificationPage';
import ReaderDashboard from './pages/ReaderDashboard';
import ReaderInterface from './pages/ReaderInterface';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify" element={
              <ProtectedRoute requireVerification={false}>
                <VerificationPage />
              </ProtectedRoute>
            } />
            <Route path="/reader" element={
              <ProtectedRoute>
                <ReaderDashboard />
              </ProtectedRoute>
            } />
            <Route path="/reader/read" element={
              <ProtectedRoute>
                <ReaderInterface />
              </ProtectedRoute>
            } />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App
