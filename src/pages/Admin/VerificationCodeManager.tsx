// src/pages/Admin/VerificationCodeManager.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import QrCodeIcon from '@mui/icons-material/QrCode';
import { useAuth } from '../../contexts/AuthContext';
import { appLog } from '../../components/LogViewer';
import {
  createVerificationCode,
  getVerificationCodes,
  generateBulkVerificationCodes
} from '../../services/verificationService';
import VerificationCodeQR from '../../components/Admin/VerificationCodeQR';
import { ALICE_BOOK_ID } from '../../utils/bookIdUtils';

interface VerificationCode {
  code: string;
  is_used: boolean;
  used_by: string | null;
  created_at: string;
}

const VerificationCodeManager: React.FC = () => {
  const { user } = useAuth();
  const [codes, setCodes] = useState<VerificationCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [customCode, setCustomCode] = useState('');
  const [bulkCount, setBulkCount] = useState(10);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [bookId, setBookId] = useState<string>(ALICE_BOOK_ID);

  // Base URL for QR codes
  const baseUrl = window.location.origin;

  // Load verification codes
  useEffect(() => {
    loadCodes();
  }, [bookId]);

  const loadCodes = async () => {
    try {
      setLoading(true);
      setError(null);

      const codesData = await getVerificationCodes(bookId);
      setCodes(codesData);
    } catch (err: any) {
      appLog('VerificationCodeManager', `Error loading codes: ${err.message}`, 'error');
      setError('Failed to load verification codes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCode = async () => {
    try {
      setLoading(true);

      const code = await createVerificationCode(bookId, customCode || undefined);

      if (code) {
        await loadCodes();
        setCustomCode('');
        setCreateDialogOpen(false);
      } else {
        setError('Failed to create verification code');
      }
    } catch (err: any) {
      appLog('VerificationCodeManager', `Error creating code: ${err.message}`, 'error');
      setError('Failed to create verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBulkCodes = async () => {
    try {
      setLoading(true);

      const generatedCodes = await generateBulkVerificationCodes(bookId, bulkCount);

      if (generatedCodes.length > 0) {
        await loadCodes();
        setBulkCount(10);
        setBulkDialogOpen(false);
      } else {
        setError('Failed to generate verification codes');
      }
    } catch (err: any) {
      appLog('VerificationCodeManager', `Error generating bulk codes: ${err.message}`, 'error');
      setError('Failed to generate verification codes');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const handleShowQR = (code: string) => {
    setSelectedCode(code);
    setQrDialogOpen(true);
  };

  const handlePrintAllCodes = () => {
    // Open a new window with all QR codes for printing
    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      setError('Pop-up blocked. Please allow pop-ups and try again.');
      return;
    }

    // Write HTML content
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Verification Codes - Alice Reader</title>
        <style>
          body { font-family: Arial, sans-serif; }
          .code-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
          .code-card { border: 1px solid #ccc; padding: 15px; text-align: center; page-break-inside: avoid; }
          .code { font-size: 16px; font-weight: bold; margin: 10px 0; }
          @media print {
            .no-print { display: none; }
            body { margin: 0; }
            .code-grid { grid-template-columns: repeat(2, 1fr); }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px;">
          <button onclick="window.print()">Print Codes</button>
          <button onclick="window.close()">Close</button>
        </div>
        <h1 class="no-print">Alice Reader Verification Codes</h1>
        <div class="code-grid">
          ${codes
            .filter(code => !code.is_used)
            .map(code => `
              <div class="code-card">
                <div>Alice Reader</div>
                <div class="code">Code: ${code.code}</div>
                <div>Scan to access your digital book:</div>
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                  `${baseUrl}?code=${code.code}`
                )}" alt="QR Code" />
              </div>
            `)
            .join('')}
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
  };

  const handleExportCodes = () => {
    // Create CSV content
    const csvContent =
      'Code,Created,Status\n' +
      codes.map(code =>
        `${code.code},${new Date(code.created_at).toLocaleDateString()},${code.is_used ? 'Used' : 'Available'}`
      ).join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'alice-reader-codes.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBookChange = (event: SelectChangeEvent) => {
    setBookId(event.target.value);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">Verification Code Manager</Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadCodes}
              disabled={loading}
              sx={{ mr: 1 }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              disabled={loading}
            >
              Create Code
            </Button>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="book-select-label">Book</InputLabel>
              <Select
                labelId="book-select-label"
                value={bookId}
                label="Book"
                onChange={handleBookChange}
              >
                <MenuItem value={ALICE_BOOK_ID}>Alice in Wonderland</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setBulkDialogOpen(true)}
              >
                Generate Bulk
              </Button>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={handlePrintAllCodes}
                disabled={codes.filter(c => !c.is_used).length === 0}
              >
                Print All
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleExportCodes}
                disabled={codes.length === 0}
              >
                Export CSV
              </Button>
            </Box>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading && codes.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {codes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No verification codes found
                    </TableCell>
                  </TableRow>
                ) : (
                  codes.map((code) => (
                    <TableRow key={code.code}>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace" fontWeight="bold">
                          {code.code}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {new Date(code.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={code.is_used ? 'Used' : 'Available'}
                          color={code.is_used ? 'default' : 'success'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Copy Code">
                          <IconButton
                            size="small"
                            onClick={() => handleCopyCode(code.code)}
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Show QR Code">
                          <IconButton
                            size="small"
                            onClick={() => handleShowQR(code.code)}
                          >
                            <QrCodeIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Create Code Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
        <DialogTitle>Create Verification Code</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Custom Code (Optional)"
            fullWidth
            variant="outlined"
            value={customCode}
            onChange={(e) => setCustomCode(e.target.value)}
            helperText="Leave blank to generate a random code"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateCode}
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Generate Dialog */}
      <Dialog open={bulkDialogOpen} onClose={() => setBulkDialogOpen(false)}>
        <DialogTitle>Generate Multiple Codes</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Number of Codes"
            type="number"
            fullWidth
            variant="outlined"
            value={bulkCount}
            onChange={(e) => setBulkCount(parseInt(e.target.value) || 10)}
            inputProps={{ min: 1, max: 100 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleGenerateBulkCodes}
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Generate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onClose={() => setQrDialogOpen(false)}>
        <DialogTitle>Verification Code QR</DialogTitle>
        <DialogContent>
          {selectedCode && (
            <VerificationCodeQR
              verificationCode={selectedCode}
              baseUrl={baseUrl}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default VerificationCodeManager;
