// src/App.tsx
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Typography, Box, Container, CssBaseline, Button } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import theme from './utils/theme';
import { AuthProvider } from './contexts/AuthContext';

// Simple Home component
function Home() {
  return (
    <Container>
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h3">Alice Reader</Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          Welcome to the Alice Reader application.
        </Typography>
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button variant="contained" color="primary" href="#/login">
            Login
          </Button>
          <Button variant="outlined" color="primary" href="#/about">
            About
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

// Simple About component
function About() {
  return (
    <Container>
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h3">About</Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          This is a simple about page.
        </Typography>
      </Box>
    </Container>
  );
}

// Simple Login component
function Login() {
  return (
    <Container>
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h3">Login</Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          This is a simple login page.
        </Typography>
        <Box sx={{ mt: 4 }}>
          <Button variant="contained" color="primary" href="#/">
            Back to Home
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Home />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
