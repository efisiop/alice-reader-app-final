import React, { useState } from 'react';
import { 
  Container, Box, Typography, TextField, Button, 
  Paper, Alert, CircularProgress, Link, Checkbox, FormControlLabel
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const VerificationPage: React.FC = () => {
  const [verificationCode, setVerificationCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { setIsVerified, user } = useAuth();
  const navigate = useNavigate();

  // In Phase 1, we're just mocking this verification
  // In Phase 2, we would actually validate against Supabase
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode || !firstName || !lastName || !email || !consentGiven) {
      setError('Please fill in all fields and agree to the terms');
      return;
    }
    
    setError(null);
    setLoading(true);
    
    try {
      // Mock successful verification for Phase 1
      // In Phase 2, we would call Supabase to verify and store user data
      setTimeout(() => {
        setIsVerified(true);
        navigate('/reader');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Verification failed');
      setLoading(false);
    }
  };

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
              helperText="Enter the unique code found with your book"
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
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default VerificationPage;