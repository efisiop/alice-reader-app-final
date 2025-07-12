// src/pages/Auth/ForgotPasswordPage.tsx
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Link, 
  Alert, 
  CircularProgress,
  Container
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuthService, useAnalyticsService } from '../../hooks/useService';
import { usePerformance } from '../../hooks/usePerformance';

const ForgotPasswordPage: React.FC = () => {
  const { service: authService, loading: authLoading } = useAuthService();
  const { service: analyticsService } = useAnalyticsService();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Track performance
  usePerformance({
    trackPageLoad: true,
    trackRender: true,
    componentName: 'ForgotPasswordPage'
  });
  
  // Track page view
  useEffect(() => {
    if (analyticsService) {
      analyticsService.trackPageView('forgot_password_page');
    }
  }, [analyticsService]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    
    if (!authService) {
      setError('Authentication service not available');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const startTime = performance.now();
      const { error } = await authService.resetPassword(email);
      
      if (error) {
        throw error;
      }
      
      setSuccess('Password reset instructions have been sent to your email.');
      
      // Track success
      if (analyticsService) {
        analyticsService.trackEvent('password_reset_request', {
          success: true,
          timeToComplete: performance.now() - startTime
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email. Please try again.');
      
      // Track error
      if (analyticsService) {
        analyticsService.trackEvent('password_reset_request', {
          success: false,
          error: err.message
        });
      }
    } finally {
      setLoading(false);
    }
  };
  
  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            borderRadius: 2
          }}
        >
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Reset Password
          </Typography>
          <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 3 }}>
            Enter your email address and we'll send you instructions to reset your password
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!error && !email.trim()}
              disabled={!!success}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading || !!success}
            >
              {loading ? <CircularProgress size={24} /> : 'Reset Password'}
            </Button>
            
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2">
                Remember your password?{' '}
                <Link component={RouterLink} to="/login">
                  Sign In
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ForgotPasswordPage;
