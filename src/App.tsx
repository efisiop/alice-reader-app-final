// src/App.tsx
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Typography, Box, Container } from '@mui/material';

// Simple Home component
function Home() {
  return (
    <Container>
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h3">Alice Reader</Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          Welcome to the Alice Reader application.
        </Typography>
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

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/about" element={<About />} />
        <Route path="/" element={<Home />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
