import React from 'react'
import ReactDOM from 'react-dom/client'
import { Typography, Box, Container } from '@mui/material';

function App() {
  return (
    <Container>
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h3">Hello World</Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          This is a simple test page to verify that the application is rendering correctly.
        </Typography>
      </Box>
    </Container>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
