// src/components/Admin/VerificationCodeQR.tsx
import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, CircularProgress, Button } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { generateVerificationQRCode } from '../../utils/qrCodeGenerator';
import { appLog } from '../../components/LogViewer';

interface VerificationCodeQRProps {
  verificationCode: string;
  baseUrl: string;
  title?: string;
  showDownload?: boolean;
}

/**
 * Component to display a QR code for a verification code
 */
const VerificationCodeQR: React.FC<VerificationCodeQRProps> = ({ 
  verificationCode, 
  baseUrl,
  title = 'Scan to download Alice Reader',
  showDownload = true
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const generateQR = async () => {
      try {
        setLoading(true);
        const url = await generateVerificationQRCode(baseUrl, verificationCode);
        setQrCodeUrl(url);
        setError(null);
      } catch (err: any) {
        appLog('VerificationCodeQR', `Error generating QR code: ${err.message}`, 'error');
        setError(err.message || 'Failed to generate QR code');
      } finally {
        setLoading(false);
      }
    };
    
    generateQR();
  }, [verificationCode, baseUrl]);
  
  const handleDownload = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `alice-reader-${verificationCode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (loading) {
    return (
      <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
        <CircularProgress size={40} />
        <Typography variant="body2" sx={{ mt: 1 }}>
          Generating QR code...
        </Typography>
      </Paper>
    );
  }
  
  if (error) {
    return (
      <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="error" variant="body1">
          {error}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Please try again later.
        </Typography>
      </Paper>
    );
  }
  
  return (
    <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Box sx={{ my: 2 }}>
        <img 
          src={qrCodeUrl || ''} 
          alt="QR Code for Alice Reader" 
          style={{ maxWidth: '100%', height: 'auto', maxHeight: '200px' }}
        />
      </Box>
      <Typography variant="body2" color="text.secondary">
        Verification Code: <strong>{verificationCode}</strong>
      </Typography>
      
      {showDownload && (
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
          sx={{ mt: 2 }}
          size="small"
        >
          Download QR Code
        </Button>
      )}
    </Paper>
  );
};

export default VerificationCodeQR;
