import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  useTheme,
  useMediaQuery,
  Drawer,
  IconButton,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { readerService } from '../../services/readerService';
import { Section } from '../../types/section';
import { LoadingIndicator } from '../../components/common/LoadingIndicator';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { LoadingButton } from '../../components/common/LoadingButton';
import HelpIcon from '@mui/icons-material/Help';

export const ReaderInterfacePage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const { sectionId } = useParams<{ sectionId: string }>();
  const [section, setSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [helpDrawerOpen, setHelpDrawerOpen] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    loadSection();
  }, [sectionId]);

  const loadSection = async () => {
    if (!sectionId) return;
    try {
      setLoading(true);
      const data = await readerService.getSection(sectionId);
      setSection(data);
    } catch (error) {
      console.error('Error loading section:', error);
      enqueueSnackbar('Failed to load section', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestHelp = async () => {
    if (!section) return;
    try {
      setSubmitting(true);
      await readerService.requestHelp(section.id);
      enqueueSnackbar('Help request submitted successfully', { variant: 'success' });
      if (isMobile) {
        setHelpDrawerOpen(false);
      }
    } catch (error) {
      console.error('Error requesting help:', error);
      enqueueSnackbar('Failed to submit help request', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const renderHelpPanel = () => (
    <Box p={isMobile ? 2 : 3}>
      <Typography variant="h6" gutterBottom>
        Need Help?
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        If you're having trouble understanding this section, our consultants are here to help.
      </Typography>
      <LoadingButton
        variant="contained"
        fullWidth
        onClick={handleRequestHelp}
        loading={submitting}
        loadingText="Requesting Help..."
      >
        Request Help
      </LoadingButton>
    </Box>
  );

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ px: isMobile ? 2 : 3 }}>
        <Box py={isMobile ? 2 : 4}>
          <Grid container spacing={isMobile ? 2 : 3}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: isMobile ? 2 : 3 }}>
                <LoadingSkeleton variant="text" width="60%" height={32} />
                <Box mt={2}>
                  <LoadingSkeleton variant="text" count={5} />
                </Box>
              </Paper>
            </Grid>
            {!isMobile && (
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3 }}>
                  <LoadingSkeleton variant="text" width="80%" height={24} />
                  <Box mt={2}>
                    <LoadingSkeleton variant="text" count={3} />
                  </Box>
                  <Box mt={3}>
                    <LoadingSkeleton variant="text" width="100%" height={36} />
                  </Box>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>
      </Container>
    );
  }

  if (!section) {
    return (
      <Box p={3} textAlign="center">
        <Typography variant="h6" color="text.secondary">
          Section not found
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ px: isMobile ? 2 : 3 }}>
      <Box py={isMobile ? 2 : 4}>
        <Grid container spacing={isMobile ? 2 : 3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: isMobile ? 2 : 3, position: 'relative' }}>
              {isMobile && (
                <IconButton
                  color="primary"
                  onClick={() => setHelpDrawerOpen(true)}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    zIndex: 1,
                  }}
                >
                  <HelpIcon />
                </IconButton>
              )}
              <Typography 
                variant={isMobile ? 'h6' : 'h5'} 
                gutterBottom
                sx={{ pr: isMobile ? 5 : 0 }}
              >
                {section.chapter.title}
              </Typography>
              <Typography 
                variant={isMobile ? 'subtitle1' : 'h6'} 
                color="text.secondary" 
                gutterBottom
              >
                {section.title}
              </Typography>
              <Typography 
                variant="body1"
                sx={{
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  lineHeight: 1.6,
                }}
              >
                {section.content}
              </Typography>
            </Paper>
          </Grid>
          {!isMobile && (
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, position: 'sticky', top: 24 }}>
                {renderHelpPanel()}
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>

      {isMobile && (
        <Drawer
          anchor="bottom"
          open={helpDrawerOpen}
          onClose={() => setHelpDrawerOpen(false)}
          PaperProps={{
            sx: {
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              maxHeight: '80vh',
            },
          }}
        >
          {renderHelpPanel()}
        </Drawer>
      )}
    </Container>
  );
};