import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, Alert } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { testProfileUpdate } from '../../utils/profileDiagnostics';

/**
 * Debug component to test profile updates
 * This is for development/debugging only
 */
const ProfileUpdateTester: React.FC = () => {
  const { user, profile } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bookVerified, setBookVerified] = useState<boolean | undefined>(undefined);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleTest = async () => {
    if (!user) {
      setError('No user logged in');
      return;
    }
    
    try {
      const updates: any = {};
      if (firstName) updates.first_name = firstName;
      if (lastName) updates.last_name = lastName;
      if (bookVerified !== undefined) updates.book_verified = bookVerified;
      
      const testResult = await testProfileUpdate(user.id, updates);
      setResult(testResult);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
      setResult(null);
    }
  };
  
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Profile Update Diagnostic Tool
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2">Current Profile:</Typography>
        <pre>{JSON.stringify(profile, null, 2)}</pre>
      </Box>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
        <TextField
          label="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          fullWidth
        />
        
        <TextField
          label="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          fullWidth
        />
        
        <Box>
          <Typography variant="subtitle2" gutterBottom>Book Verified:</Typography>
          <Button 
            variant={bookVerified === true ? "contained" : "outlined"} 
            color="primary"
            onClick={() => setBookVerified(true)}
            sx={{ mr: 1 }}
          >
            True
          </Button>
          <Button 
            variant={bookVerified === false ? "contained" : "outlined"} 
            color="secondary"
            onClick={() => setBookVerified(false)}
          >
            False
          </Button>
        </Box>
      </Box>
      
      <Button 
        variant="contained" 
        color="primary"
        onClick={handleTest}
        disabled={!user}
      >
        Test Profile Update
      </Button>
      
      {result && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2">Result:</Typography>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </Box>
      )}
    </Paper>
  );
};

export default ProfileUpdateTester;
