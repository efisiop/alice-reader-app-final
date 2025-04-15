// src/pages/Auth/RegisterPage.tsx
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
  Container,
  Stepper,
  Step,
  StepLabel,
  Grid,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthService, useAnalyticsService } from '../../hooks/useService';
import { usePerformance } from '../../hooks/usePerformance';
import { useAuth } from '../../contexts/AuthContext';

// Password strength checker
const checkPasswordStrength = (password: string): { score: number; feedback: string } => {
  if (!password) return { score: 0, feedback: 'Password is required' };

  let score = 0;
  let feedback = '';

  // Length check
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;

  // Complexity checks
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  // Feedback based on score
  if (score < 3) {
    feedback = 'Weak password. Try adding numbers, symbols, and mixed case letters.';
  } else if (score < 5) {
    feedback = 'Moderate password. Consider making it longer or more complex.';
  } else {
    feedback = 'Strong password!';
  }

  return { score: Math.min(score, 5), feedback };
};

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signUp, user } = useAuth();
  const { service: analyticsService } = useAnalyticsService();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // UI state
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: '' });

  // Track performance
  usePerformance({
    trackPageLoad: true,
    trackRender: true,
    componentName: 'RegisterPage'
  });

  // Check if user is already logged in and verified
  useEffect(() => {
    if (user && !location.state?.fromRegistration) {
      // Only redirect if we're not in the middle of registration
      navigate('/verify');
    }
  }, [user, navigate, location.state]);

  // Track page view
  useEffect(() => {
    if (analyticsService) {
      analyticsService.trackPageView('register_page');
    }
  }, [analyticsService]);

  // Update password strength when password changes
  useEffect(() => {
    setPasswordStrength(checkPasswordStrength(password));
  }, [password]);

  const handleNext = () => {
    if (activeStep === 0) {
      // Validate first step
      if (!email || !password || !confirmPassword) {
        setError('Please fill in all required fields');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (passwordStrength.score < 3) {
        setError('Please use a stronger password');
        return;
      }
    }

    setError(null);
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName || !lastName || !agreeTerms) {
      setError('Please fill in all required fields and agree to the terms');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('RegisterPage: Starting signup process with:', { email, firstName, lastName });
      const startTime = performance.now();

      // Call signUp with all required parameters
      const { error, user } = await signUp(
        email,
        password,
        firstName,
        lastName
      );

      if (error) {
        console.error('RegisterPage: Signup error:', error);
        throw error;
      }

      console.log('RegisterPage: Signup successful, user:', user);

      if (analyticsService) {
        analyticsService.trackEvent('registration_complete', {
          success: true,
          timeToComplete: performance.now() - startTime
        });
      }

      // Show success message before navigating
      console.log('RegisterPage: Navigating to verification page');

      // Navigate to verification page with state that indicates this is a fresh registration
      navigate('/verify', {
        state: {
          message: 'Registration successful! Please verify your book to continue.',
          fromRegistration: true,
          firstName,
          lastName,
          email,
          userId: user?.id
        },
        replace: true // Use replace to prevent back navigation
      });

      console.log('RegisterPage: Navigation to verification page initiated');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');

      if (analyticsService) {
        analyticsService.trackEvent('registration_attempt', {
          success: false,
          error: err.message
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    const { score } = passwordStrength;
    if (score < 3) return 'error';
    if (score < 5) return 'warning';
    return 'success';
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          mt: 8,
          mb: 8,
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
            Create Your Account
          </Typography>
          <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
            Join Alice Reader to begin your interactive reading journey
          </Typography>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            <Step>
              <StepLabel>Account Details</StepLabel>
            </Step>
            <Step>
              <StepLabel>Personal Information</StepLabel>
            </Step>
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={activeStep === 1 ? handleSubmit : handleNext} noValidate>
            {activeStep === 0 ? (
              // Step 1: Account Details
              <>
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
                  error={!!error && !email}
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
                  error={!!error && (!password || passwordStrength.score < 3)}
                  helperText={password ? passwordStrength.feedback : 'Password is required'}
                  FormHelperTextProps={{
                    sx: { color: getPasswordStrengthColor() }
                  }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  id="confirmPassword"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={!!error && (!confirmPassword || password !== confirmPassword)}
                  helperText={
                    confirmPassword && password !== confirmPassword
                      ? 'Passwords do not match'
                      : ''
                  }
                />

                <Button
                  type="button"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2, py: 1.5 }}
                  onClick={handleNext}
                >
                  Next
                </Button>
              </>
            ) : (
              // Step 2: Personal Information
              <>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      id="firstName"
                      label="First Name"
                      name="firstName"
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      error={!!error && !firstName}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      id="lastName"
                      label="Last Name"
                      name="lastName"
                      autoComplete="family-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      error={!!error && !lastName}
                    />
                  </Grid>
                </Grid>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body2">
                      I agree to the{' '}
                      <Link component={RouterLink} to="/terms">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link component={RouterLink} to="/privacy">
                        Privacy Policy
                      </Link>
                    </Typography>
                  }
                  sx={{ mt: 2 }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={handleBack}
                    sx={{ py: 1.5, px: 3 }}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    sx={{ py: 1.5, px: 3 }}
                    disabled={loading || !agreeTerms}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Create Account'}
                  </Button>
                </Box>
              </>
            )}

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2">
                Already have an account?{' '}
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

export default RegisterPage;
