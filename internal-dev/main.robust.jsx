// src/main.robust.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ENV } from './config/env'

// Log environment status in development
ENV.logStatus();

// Function to initialize the application
async function initializeApp() {
  try {
    console.log('Initializing Alice Reader application...');
    
    // Dynamically import App to avoid issues with Supabase initialization
    const { default: App } = await import('./App');
    
    console.log('App component loaded, rendering to DOM...');
    
    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
    
    console.log('React rendering complete.');
  } catch (error) {
    console.error('Failed to initialize application:', error);
    
    // Show error in UI if React fails to render
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="padding: 20px; font-family: sans-serif;">
          <h1 style="color: #d32f2f;">Application Error</h1>
          <p>The application failed to initialize. Please check the console for more details.</p>
          <div style="background: #f5f5f5; padding: 10px; border-radius: 4px; margin-top: 20px;">
            <strong>Error:</strong> ${error.message || 'Unknown error'}
          </div>
        </div>
      `;
    }
  }
}

// Start the application
initializeApp();
