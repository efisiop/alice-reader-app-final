// src/pages/Auth/LoginPage.tsx
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
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthService, useAnalyticsService, useConsultantService } from '../../hooks/useService';
import { usePerformance } from '../../hooks/usePerformance';
import { useAuth } from '../../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, user, isVerified } = useAuth();
  const { service: analyticsService } = useAnalyticsService();
  const { service: consultantService } = useConsultantService();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Track performance
  usePerformance({
    trackPageLoad: true,
    trackRender: true,
    componentName: 'LoginPage'
  });

  // Check if user is already logged in
  useEffect(() => {
    if (user) {
      if (isVerified) {
        navigate('/reader');
      } else {
        navigate('/verify');
      }
    }
  }, [user, isVerified, navigate]);

  // Check for redirect message in location state
  useEffect(() => {
    if (location.state && location.state.message) {
      setSuccessMessage(location.state.message);
      // Clear the message after 5 seconds
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  // Track page view
  useEffect(() => {
    if (analyticsService) {
      analyticsService.trackPageView('login_page');
    }
  }, [analyticsService]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('LoginPage: Attempting login with email:', email);
      const startTime = performance.now();
      const { error, user } = await signIn(email, password);

      if (error) {
        console.error('LoginPage: Login error:', error);
        throw error;
      }

      console.log('LoginPage: Login successful, user:', user);
      console.log('LoginPage: Verification status:', isVerified);

      if (analyticsService) {
        analyticsService.trackEvent('login_attempt', {
          success: true,
          timeToComplete: performance.now() - startTime
        });
      }

      setSuccessMessage('Login successful!');

      // Log the login event
      if (consultantService && user) {
        try {
          await consultantService.logConsultantAction(user.id, 'LOGIN', { email: user.email });
          console.log('LoginPage: Login event logged successfully.');
        } catch (logError) {
          console.error('LoginPage: Failed to log login event:', logError);
        }
      }

      // Add a small delay to ensure the profile is loaded
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Manually navigate based on verification status
      if (isVerified) {
        console.log('LoginPage: User is verified, navigating to dashboard');
        navigate('/dashboard');
      } else {
        console.log('LoginPage: User is not verified, navigating to verification page');
        navigate('/verify');
      }
    } catch (err: any) {
      console.error('LoginPage: Login failed:', err);
      setError(err.message || 'Login failed. Please check your credentials.');

      if (analyticsService) {
        analyticsService.trackEvent('login_attempt', {
          success: false,
          error: err.message
        });
      }
    } finally {
      setLoading(false);
    }
  };

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
            Welcome Back
          </Typography>
          <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 3 }}>
            Sign in to continue your reading journey
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {successMessage && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {successMessage}
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
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!error && !password.trim()}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Link component={RouterLink} to="/forgot-password" variant="body2">
                Forgot password?
              </Link>
            </Box>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2">
                Don't have an account?{' '}
                <Link component={RouterLink} to="/register">
                  Sign Up
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage;
