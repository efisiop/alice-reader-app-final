console.log('main.tsx: Script executing');

import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './styles/animations.css'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import { appLog } from './components/LogViewer'

// Make logging available globally for debugging
if (typeof window !== 'undefined') {
  window.appLog = appLog;
}

// Add TypeScript declaration
declare global {
  interface Window {
    appLog: typeof appLog;
  }
}

// Make logging available globally for debugging
if (typeof window !== 'undefined') {
  window.appLog = appLog;
}

// Fallback environment variables
if (!import.meta.env.VITE_SUPABASE_URL && window.SUPABASE_URL) {
  appLog('Main', 'Using fallback Supabase URL from window', 'warning');
}

if (!import.meta.env.VITE_SUPABASE_ANON_KEY && window.SUPABASE_KEY) {
  appLog('Main', 'Using fallback Supabase key from window', 'warning');
}

// Log initialization
appLog('Main', 'Application initializing...', 'info');

// Update TypeScript declaration for global appLog
declare global {
  interface Window {
    SUPABASE_URL?: string;
    SUPABASE_KEY?: string;
  }
}

// Function to initialize the application
async function initializeApp() {
  try {
    appLog('Main', 'Starting application initialization...', 'info');

    // First, load debug helpers in development mode
    if (process.env.NODE_ENV !== 'production') {
      try {
        appLog('Main', 'Loading debug helpers...', 'debug');
        const debugHelpers = await import('./utils/debugHelpers');
        appLog('Main', 'Debug helpers loaded successfully', 'success');
      } catch (error) {
        appLog('Main', 'Failed to load debug helpers', 'error', error);
      }
    }

    // Test Supabase connection before rendering the app
    try {
      appLog('Main', 'Testing Supabase connection...', 'info');
      const testModule = await import('./utils/testSupabase');
      const connectionSuccess = await testModule.testSupabaseConnection();

      if (connectionSuccess) {
        appLog('Main', 'Supabase connection test successful', 'success');
      } else {
        appLog('Main', 'Supabase connection test failed, but continuing with app initialization', 'warning');
      }
    } catch (error) {
      appLog('Main', 'Failed to test Supabase connection', 'error', error);
      appLog('Main', 'Continuing with app initialization despite Supabase test failure', 'warning');
    }

    // Dynamically import App to avoid issues with Supabase initialization
    appLog('Main', 'Loading App component...', 'info');
    console.log('main.tsx: Loading App component...');
    const { default: App } = await import('./App');
    appLog('Main', 'App component loaded successfully', 'success');
    console.log('main.tsx: App component loaded successfully');

    // Render the app
    appLog('Main', 'Rendering application to DOM...', 'info');
    console.log('main.tsx: Rendering App into root...');
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );

    appLog('Main', 'Application rendering complete', 'success');
  } catch (error) {
    appLog('Main', 'Failed to initialize application', 'error', error);

    // Show error in UI if React fails to render
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="padding: 20px; font-family: sans-serif;">
          <h1 style="color: #d32f2f;">Application Error</h1>
          <p>The application failed to initialize. Please check the console for more details.</p>
          <div style="background: #f5f5f5; padding: 10px; border-radius: 4px; margin-top: 20px;">
            <strong>Error:</strong> ${error instanceof Error ? error.message : 'Unknown error'}
          </div>
          <button onclick="location.reload()" style="margin-top: 20px; padding: 8px 16px; background: #2196f3; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Reload Application
          </button>
        </div>
      `;
    }
  }
}

// Start the application
initializeApp();
