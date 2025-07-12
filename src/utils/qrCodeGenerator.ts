// src/utils/qrCodeGenerator.ts
import { appLog } from '../components/LogViewer';

/**
 * Generate a QR code for the application
 * @param baseUrl Base URL of the application
 * @param verificationCode Optional verification code to include in the URL
 * @returns Promise resolving to a data URL containing the QR code
 */
export const generateAppQRCode = async (
  baseUrl: string,
  verificationCode?: string
): Promise<string> => {
  try {
    appLog('QRCodeGenerator', 'Generating QR code', 'info');
    
    // Generate URL with optional verification code param
    const url = verificationCode 
      ? `${baseUrl}?code=${verificationCode}` 
      : baseUrl;
    
    // Dynamically import QRCode to avoid SSR issues
    const QRCode = await import('qrcode');
    
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.default.toDataURL(url, {
      errorCorrectionLevel: 'M',
      margin: 2,
      scale: 8,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    
    appLog('QRCodeGenerator', 'QR code generated successfully', 'success');
    return qrCodeDataUrl;
  } catch (error: any) {
    appLog('QRCodeGenerator', `Failed to generate QR code: ${error.message}`, 'error');
    throw error;
  }
};

/**
 * Generate a QR code for verification
 * This is a simplified version that returns a mock QR code if the real one fails
 */
export const generateVerificationQRCode = async (
  baseUrl: string,
  verificationCode: string
): Promise<string> => {
  try {
    return await generateAppQRCode(baseUrl, verificationCode);
  } catch (error) {
    appLog('QRCodeGenerator', 'Using fallback QR code', 'warning');
    // Return a placeholder image
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  }
};
