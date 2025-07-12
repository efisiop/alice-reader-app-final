import React, { useState, useEffect } from 'react';
import {
  Container, Box, Typography, TextField, Button,
  Paper, Alert, CircularProgress, Link, Checkbox, FormControlLabel,
  Snackbar
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingState from '../components/common/LoadingState';

const VerificationPage: React.FC = () => {
  const [verificationCode, setVerificationCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { setIsVerified, user, isVerified, verifyBook, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is already verified
  useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        // If user is already verified, redirect to reader dashboard
        if (isVerified) {
          navigate('/reader');
          return;
        }

        // Get user data from location state if available
        const state = location.state as any;
        if (state) {
          if (state.firstName) setFirstName(state.firstName);
          if (state.lastName) setLastName(state.lastName);
          if (state.email) setEmail(state.email);
          if (state.userId) setUserId(state.userId);
          if (state.message) setSuccessMessage(state.message);
        } else if (user) {
          // If no state but user is logged in, use user data
          setEmail(user.email || '');
          // We don't have first/last name in the user object directly
          // This would be fetched from the user profile in a real app
        }
      } catch (err) {
        console.error('Error checking verification status:', err);
      } finally {
        setInitialLoading(false);
      }
    };

    checkVerificationStatus();
  }, [isVerified, navigate, location, user]);

  // Verification will be done through Supabase

  // Form validation
  const validateForm = () => {
    // Reset error
    setError(null);

    // Check for empty fields
    if (!verificationCode.trim()) {
      setError('Verification code is required');
      return false;
    }

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

    if (!consentGiven) {
      setError('You must agree to the terms to continue');
      return false;
    }

    return true;
  };

  // Handle verification
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Determine which user ID to use
      const effectiveUserId = user?.id || userId;

      if (!effectiveUserId) {
        throw new Error('User not found. Please log in again.');
      }

      // Use the comprehensive verification function from AuthContext
      const { success, error: verifyError } = await verifyBook(verificationCode, firstName, lastName);

      if (!success || verifyError) {
        throw verifyError || new Error('Verification failed');
      }

      // Explicitly update verification state in the frontend
      setIsVerified(true);

      // Show success message
      setSuccessMessage('Book verified successfully! Redirecting to dashboard...');

      // Ensure we're redirecting to the correct page
      const redirectPath = '/dashboard';

      // Use a more reliable redirection method
      // First set a short delay to show success message
      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 1500);

    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Prevent showing reader dashboard content when on verification page
  useEffect(() => {
    // Clear any reader dashboard loading messages that might be showing
    const dashboardLoadingElements = document.querySelectorAll('.reader-dashboard-loading');
    dashboardLoadingElements.forEach(element => {
      if (element instanceof HTMLElement) {
        element.style.display = 'none';
      }
    });
  }, []);

  // Show loading state while checking verification status
  if (initialLoading) {
    return <LoadingState message="Checking verification status..." />;
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
            Verify Your Book
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Please enter your book verification code and personal information
          </Typography>

          {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleVerify} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="verificationCode"
              label="Book Verification Code"
              name="verificationCode"
              autoFocus
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              helperText="Enter the verification code from your book (e.g., ALICE123)"
              disabled={loading}
              error={!!error && !verificationCode.trim()}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="firstName"
              label="First Name"
              name="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={loading}
              error={!!error && !firstName.trim()}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="lastName"
              label="Last Name"
              name="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={loading}
              error={!!error && !lastName.trim()}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              type="email"
              value={email || (user?.email ?? '')}
              onChange={(e) => setEmail(e.target.value)}
              helperText="This should match your registration email"
              disabled={loading}
              error={!!error && (!email.trim() || error.includes('email'))}
            />

            <Box sx={{ bgcolor: 'background.paper', p: 2, mt: 2, borderRadius: 1, border: '1px solid #e0e0e0' }}>
              <Typography variant="body2" paragraph>
                <strong>Why we need your information:</strong>
              </Typography>
              <Typography variant="body2" paragraph>
                Your name and email enable us to provide you with personalized reading support. This allows:
              </Typography>
              <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
                <li>Certified consultants to monitor your progress and offer assistance when needed</li>
                <li>Our AI to provide gentle, personalized prompts to enhance your reading experience</li>
                <li>Saving your reading progress across sessions</li>
              </Typography>
              <Typography variant="body2" paragraph>
                We respect your privacy and will only use this information to support your reading journey.
              </Typography>
              <Typography variant="body2">
                <Link href="/privacy-policy" target="_blank">
                  View our complete Privacy Policy
                </Link>
              </Typography>
            </Box>

            <FormControlLabel
              control={
                <Checkbox
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  color="primary"
                  disabled={loading}
                />
              }
              label="I understand and agree to the collection and use of my information as described above"
              sx={{ mt: 2 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading || !consentGiven}
            >
              {loading ? <CircularProgress size={24} /> : 'Verify & Activate'}
            </Button>

            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2 }}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => {
                  // Sign out and redirect to login
                  signOut();
                  navigate('/');
                }}
              >
                Sign Out
              </Button>
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

export default VerificationPage;