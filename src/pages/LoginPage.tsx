import React, { useState, useEffect } from 'react';
import {
  Container, Box, Typography, TextField, Button,
  Paper, Link, Alert, CircularProgress, Snackbar
} from '@mui/material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingState from '../components/common/LoadingState';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { signIn, user, isVerified } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is already logged in
  useEffect(() => {
    console.log('LoginPage: Checking authentication state...');
    const checkAuthState = async () => {
      try {
        // If user is already logged in, redirect to appropriate page
        if (user) {
          console.log('LoginPage: User already logged in:', user.email);
          console.log('LoginPage: Verification status:', isVerified ? 'Verified' : 'Not verified');

          // If user is verified, redirect to reader dashboard
          if (isVerified) {
            console.log('LoginPage: Redirecting to reader dashboard...');
            navigate('/reader');
          } else {
            // If user is not verified, redirect to verification page
            console.log('LoginPage: Redirecting to verification page...');
            navigate('/verify');
          }
        }
      } catch (err) {
        console.error('LoginPage: Error checking auth state:', err);
      } finally {
        setInitialLoading(false);
      }
    };

    checkAuthState();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    console.log('LoginPage: Attempting login with email:', email);

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);

    try {
      console.log('LoginPage: Calling signIn method...');
      const { error, user } = await signIn(email, password);

      if (error) {
        console.error('LoginPage: Sign in error:', error);
        throw error;
      }

      console.log('LoginPage: Sign in successful, user:', user?.email);

      // Success! The useEffect will handle redirection based on verification status
      setSuccessMessage('Login successful!');
    } catch (err: any) {
      console.error('LoginPage: Login error:', err);
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (initialLoading) {
    return <LoadingState message="Checking authentication status..." />;
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mt: 8,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography component="h1" variant="h5" gutterBottom>
            Welcome to Alice in Wonderland
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Your AI Reading Companion
          </Typography>

          {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
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
              disabled={loading}
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
              disabled={loading}
              error={!!error && !password.trim()}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link component={RouterLink} to="/register" variant="body2">
                {"Don't have an account? Sign Up"}
              </Link>
              <Link component={RouterLink} to="/status" variant="body2">
                System Status
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Success message snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={5000}
        onClose={() => setSuccessMessage(null)}
        message={successMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Container>
  );
};

export default LoginPage;