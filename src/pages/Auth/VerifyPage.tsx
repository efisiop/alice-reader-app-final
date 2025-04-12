// src/pages/Auth/VerifyPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Container,
  Divider,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Fade,
  Grow,
  Chip
} from '@mui/material';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useAuthService, useAnalyticsService } from '../../hooks/useService';
import { usePerformance } from '../../hooks/usePerformance';
import { useAuth } from '../../contexts/AuthContext';

const VerifyPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isVerified, verifyBook } = useAuth();
  const { service: analyticsService } = useAnalyticsService();

  // Form state
  const [verificationCode, setVerificationCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  // Track performance
  usePerformance({
    trackPageLoad: true,
    trackRender: true,
    componentName: 'VerifyPage'
  });

  // Check if user is already verified
  useEffect(() => {
    // If we're coming from registration, don't redirect
    const isFromRegistration = location.state?.fromRegistration;
    
    // Only redirect if we're not coming from registration and the user is verified
    if (!isFromRegistration && user && isVerified) {
      console.log('User already verified, redirecting to reader');
      navigate('/reader', { replace: true });
    } else if (!user && !isFromRegistration) {
      // If there's no user and we're not coming from registration, redirect to login
      console.log('No user found, redirecting to login');
      navigate('/login', { replace: true });
    }
  }, [user, isVerified, navigate, location.state]);

  // Set initial form data from registration if available
  useEffect(() => {
    if (location.state?.fromRegistration) {
      setFirstName(location.state.firstName || '');
      setLastName(location.state.lastName || '');
      setEmail(location.state.email || '');
      setUserId(location.state.userId || null);
      // Clear the fromRegistration flag after setting the data
      navigate('.', { replace: true, state: { ...location.state, fromRegistration: false } });
    }
  }, [location.state, navigate]);

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
      analyticsService.trackPageView('verify_page');
    }
  }, [analyticsService]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationCode.trim()) {
      setError('Please enter your verification code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const startTime = performance.now();
      const { error, success } = await verifyBook(verificationCode);

      if (error) {
        throw error;
      }

      if (analyticsService) {
        analyticsService.trackEvent('book_verification', {
          success: true,
          timeToComplete: performance.now() - startTime
        });
      }

      setVerificationComplete(true);
      setSuccessMessage('Verification successful! Redirecting to your dashboard...');

      // Proceed through the steps
      setActiveStep(1);

      // Redirect after a delay
      setTimeout(() => {
        setActiveStep(2);
        setTimeout(() => {
          navigate('/reader');
        }, 1500);
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check your code and try again.');

      if (analyticsService) {
        analyticsService.trackEvent('book_verification', {
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
            Verify Your Book
          </Typography>
          <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
            Enter the verification code from your physical copy of Alice in Wonderland
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

          <Stepper activeStep={activeStep} orientation="vertical" sx={{ mb: 4 }}>
            <Step>
              <StepLabel>Enter Verification Code</StepLabel>
              <StepContent>
                <Box component="form" onSubmit={handleVerify} noValidate>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="verificationCode"
                    label="Verification Code"
                    name="verificationCode"
                    autoComplete="off"
                    autoFocus
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                    error={!!error}
                    placeholder="e.g. BETA001"
                    inputProps={{
                      style: { textTransform: 'uppercase', letterSpacing: '0.1em' }
                    }}
                    disabled={loading || verificationComplete}
                  />

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
                    The verification code can be found on the inside cover of your book or on your purchase receipt.
                  </Typography>

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 1, mb: 2, py: 1.5 }}
                    disabled={loading || verificationComplete}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Verify Book'}
                  </Button>
                </Box>
              </StepContent>
            </Step>
            <Step>
              <StepLabel>Verification Complete</StepLabel>
              <StepContent>
                <Box sx={{ py: 2 }}>
                  <Grow in={activeStep === 1}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CheckCircleIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
                      <Typography variant="h6">
                        Book Successfully Verified!
                      </Typography>
                    </Box>
                  </Grow>
                  <Typography variant="body1">
                    Your copy of Alice in Wonderland has been verified. You now have full access to all interactive features.
                  </Typography>
                </Box>
              </StepContent>
            </Step>
            <Step>
              <StepLabel>Preparing Your Experience</StepLabel>
              <StepContent>
                <Box sx={{ py: 2 }}>
                  <Typography variant="body1" paragraph>
                    Setting up your personalized reading experience...
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label="Dictionary Service" color="success" />
                    <Chip label="AI Assistant" color="success" />
                    <Chip label="Reading Progress" color="success" />
                    <Chip label="Consultant Support" color="success" />
                  </Box>
                </Box>
              </StepContent>
            </Step>
          </Stepper>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" paragraph>
              <strong>Note:</strong> By verifying your book, you agree that your reading progress and interactions may be monitored by our reading consultants to provide personalized assistance when needed.
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Your privacy is important to us. All data is handled according to our Privacy Policy.
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button
              variant="text"
              color="primary"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/login', { replace: true })}
            >
              Already Verified? Log In
            </Button>

            <Button
              variant="text"
              color="primary"
              endIcon={<PersonAddIcon />}
              onClick={() => navigate('/register', { replace: true })}
            >
              Need a New Account? Sign Up
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default VerifyPage;
