import React, { useState, useEffect } from 'react';
import {
  Container, Box, Typography, TextField, Button,
  Paper, Link, Alert, CircularProgress, Grid, Snackbar
} from '@mui/material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingState from '../components/common/LoadingState';

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { signUp, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is already logged in
  useEffect(() => {
    console.log('RegisterPage: Checking authentication state...');
    const checkAuthState = async () => {
      try {
        // If user is already logged in, redirect to appropriate page
        if (user) {
          console.log('RegisterPage: User already logged in, redirecting...');
          navigate('/reader');
        }
      } catch (err) {
        console.error('RegisterPage: Error checking auth state:', err);
      } finally {
        setInitialLoading(false);
      }
    };

    checkAuthState();
  }, [user, navigate]);

  // Form validation
  const validateForm = () => {
    // Reset error
    setError(null);

    // Check for empty fields
    if (!firstName.trim()) {
      setError('First name is required');
      return false;
    }

    if (!lastName.trim()) {
      setError('Last name is required');
      return false;
    }

    if (!email.trim()) {
      setError('Email is required');
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }

    // Password validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      console.log('RegisterPage: Attempting to sign up with email:', email);
      const { user, error } = await signUp(email, password, firstName, lastName);

      if (error) {
        console.error('RegisterPage: Sign up error:', error);
        throw error;
      }

      console.log('RegisterPage: Sign up successful, user data:', user?.id);
      setSuccessMessage('Account created successfully!');

      // Pass user data to verification page
      setTimeout(() => {
        navigate('/verify', {
          state: {
            firstName,
            lastName,
            email,
            userId: user?.id,
            message: 'Account created successfully! Please verify your book to continue.'
          }
        });
      }, 1000); // Short delay to show success message
    } catch (err: any) {
      console.error('RegisterPage: Failed to create account:', err);
      setError(err.message || 'Failed to create account');
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
            Create Your Account
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Join Alice in Wonderland Reading Experience
          </Typography>

          {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="firstName"
                  label="First Name"
                  name="firstName"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={loading}
                  error={!!error && !firstName.trim()}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="lastName"
                  label="Last Name"
                  name="lastName"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={loading}
                  error={!!error && !lastName.trim()}
                />
              </Grid>
            </Grid>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              error={!!error && (!email.trim() || error.includes('email'))}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              helperText="Password must be at least 6 characters"
              disabled={loading}
              error={!!error && (password.length < 6 || error.includes('password'))}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              error={!!error && password !== confirmPassword}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign Up'}
            </Button>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link component={RouterLink} to="/login" variant="body2">
                {'Already have an account? Sign In'}
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

export default RegisterPage;