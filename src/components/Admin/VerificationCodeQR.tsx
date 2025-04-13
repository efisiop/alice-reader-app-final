import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';

interface VerificationCodeQRProps {
  code: string;
  size?: number;
  title?: string;
}

export function VerificationCodeQR({ code, size = 200, title }: VerificationCodeQRProps) {
  return (
    <Paper elevation={2} sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {title && (
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
      )}
      <Box sx={{ my: 2 }}>
        <QRCodeSVG value={code} size={size} />
      </Box>
      <Typography variant="body2" color="text.secondary" align="center">
        {code}
      </Typography>
    </Paper>
  );
} 