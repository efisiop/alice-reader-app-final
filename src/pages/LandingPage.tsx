// src/pages/LandingPage.tsx
import React, { useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAnalyticsService } from '../hooks/useService';
import { usePerformance } from '../hooks/usePerformance';
import BookIcon from '@mui/icons-material/Book';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import { aliceCover } from '../assets';
import localAliceCoverImg from '../assets/local_images/alice_book_cover.jpg';

const LandingPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user, isVerified } = useAuth();
  const navigate = useNavigate();
  const { service: analyticsService } = useAnalyticsService();

  // Track performance
  const performance = usePerformance({
    trackPageLoad: true,
    trackRender: true,
    componentName: 'LandingPage'
  });

  // Redirect if already logged in and verified
  useEffect(() => {
    if (user && isVerified) {
      navigate('/dashboard');
    }
  }, [user, isVerified, navigate]);

  // Track page view
  useEffect(() => {
    if (analyticsService) {
      analyticsService.trackPageView('landing_page');
    }
  }, [analyticsService]);

  return (
    <Box sx={{
      minHeight: '100vh',
      backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7)), url('https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=2730&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      pt: 8,
      pb: 6
    }}>
      <Container maxWidth="lg">
        {/* Hero Section */}
        <Box sx={{
          textAlign: 'center',
          mb: 8,
          animation: 'fadeIn 1.2s ease-in-out',
          '@keyframes fadeIn': {
            '0%': { opacity: 0, transform: 'translateY(20px)' },
            '100%': { opacity: 1, transform: 'translateY(0)' }
          }
        }}>
          <Typography
            component="h1"
            variant="h2"
            color="primary.main"
            gutterBottom
            sx={{
              fontFamily: '"Alice", serif',
              fontWeight: 'bold',
              textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
            }}
          >
            Alice Reader
          </Typography>

          <Typography
            variant="h5"
            color="text.secondary"
            paragraph
            sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}
          >
            Your AI-powered reading companion for exploring the wonders of literature.
            Discover deeper meaning, expand your vocabulary, and enhance your reading experience.
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button
              component={RouterLink}
              to="/register"
              variant="contained"
              size="large"
              color="primary"
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: theme.shadows[8]
                }
              }}
            >
              Sign Up
            </Button>

            <Button
              component={RouterLink}
              to="/login"
              variant="outlined"
              size="large"
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: theme.shadows[2]
                }
              }}
            >
              Login
            </Button>
          </Box>
        </Box>

        {/* Book Preview */}
        <Paper
          elevation={3}
          sx={{
            p: 4,
            mb: 8,
            borderRadius: 2,
            background: 'rgba(255, 255, 255, 0.9)',
            boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255, 255, 255, 0.18)'
          }}
        >
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={4}>
              <Box
                component="img"
                src={localAliceCoverImg}
                alt="Alice in Wonderland"
                sx={{
                  width: '100%',
                  maxWidth: 300,
                  height: 'auto',
                  borderRadius: 2,
                  boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
                  transform: 'rotate(-3deg)',
                  mx: 'auto',
                  display: 'block'
                }}
              />
            </Grid>

            <Grid item xs={12} md={8}>
              <Typography variant="h4" component="h2" gutterBottom color="primary.dark">
                Alice in Wonderland
              </Typography>

              <Typography variant="subtitle1" gutterBottom color="text.secondary">
                By Lewis Carroll
              </Typography>

              <Typography variant="body1" paragraph sx={{ mt: 2 }}>
                Begin your journey down the rabbit hole with Alice! This interactive reading experience
                brings the classic tale to life with AI-powered assistance, vocabulary building tools,
                and personalized reading insights.
              </Typography>

              <Box sx={{ mt: 3 }}>
                <Button
                  component={RouterLink}
                  to="/register"
                  variant="contained"
                  color="secondary"
                  startIcon={<BookIcon />}
                >
                  Start Reading
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Features */}
        <Typography
          variant="h4"
          component="h2"
          align="center"
          gutterBottom
          sx={{ mb: 4 }}
        >
          Key Features
        </Typography>

        <Grid container spacing={4}>
          {/* Feature 1 */}
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.3s',
                '&:hover': {
                  transform: 'translateY(-8px)'
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 3 }}>
                <Box sx={{ mb: 2 }}>
                  <BookIcon color="primary" sx={{ fontSize: 60 }} />
                </Box>
                <Typography variant="h5" component="h3" gutterBottom>
                  Interactive Dictionary
                </Typography>
                <Typography>
                  Instantly look up any word by simply highlighting it. Build your vocabulary
                  and deepen your understanding of the text.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Feature 2 */}
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.3s',
                '&:hover': {
                  transform: 'translateY(-8px)'
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 3 }}>
                <Box sx={{ mb: 2 }}>
                  <SmartToyIcon color="secondary" sx={{ fontSize: 60 }} />
                </Box>
                <Typography variant="h5" component="h3" gutterBottom>
                  AI Reading Assistant
                </Typography>
                <Typography>
                  Ask questions about the text, get explanations, and explore themes with
                  our intelligent AI assistant that understands the context of what you're reading.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Feature 3 */}
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.3s',
                '&:hover': {
                  transform: 'translateY(-8px)'
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 3 }}>
                <Box sx={{ mb: 2 }}>
                  <PersonIcon color="info" sx={{ fontSize: 60 }} />
                </Box>
                <Typography variant="h5" component="h3" gutterBottom>
                  Reading Consultant
                </Typography>
                <Typography>
                  Get personalized guidance from reading consultants who can help you
                  navigate difficult passages and provide insights tailored to your needs.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>


        {/* Call to Action */}
        <Box
          sx={{
            textAlign: 'center',
            mt: 8,
            p: 4,
            borderRadius: 2,
            background: theme.palette.primary.main,
            color: 'white'
          }}
        >
          <Typography variant="h5" component="p" gutterBottom>
            Ready to transform your reading experience?
          </Typography>

          <Button
            component={RouterLink}
            to="/register"
            variant="contained"
            size="large"
            color="secondary"
            sx={{ mt: 2, px: 4 }}
          >
            Get Started Now
          </Button>
        </Box>

        {/* Footer */}
        <Box sx={{ mt: 8, pt: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} Alice Reader. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default LandingPage;
