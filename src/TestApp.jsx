// src/TestApp.jsx
import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'

function TestApp() {
  const [status, setStatus] = useState('Initializing...');
  const [error, setError] = useState(null);

  useEffect(() => {
    async function testConnection() {
      try {
        console.log('Starting connection test...');
        setStatus('Checking environment variables...');

        // Try both import.meta.env and window variables
        console.log('Environment variables from import.meta.env:', import.meta.env);
        console.log('Window environment variables:', {
          SUPABASE_URL: window.SUPABASE_URL,
          SUPABASE_KEY: window.SUPABASE_KEY ? 'Present (not shown for security)' : 'Missing'
        });

        // Try to get credentials from either source
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || window.SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || window.SUPABASE_KEY;

        console.log('Using Supabase URL:', supabaseUrl);
        console.log('Supabase Key present:', !!supabaseKey);

        if (!supabaseUrl || !supabaseKey) {
          throw new Error('Missing Supabase credentials in environment variables');
        }

        setStatus('Loading Supabase client...');
        console.log('Dynamically importing Supabase client...');

        // Dynamic import to avoid potential initialization issues
        const { createClient } = await import('@supabase/supabase-js');
        console.log('Supabase client imported successfully');

        setStatus('Creating Supabase client...');
        console.log('Creating Supabase client with credentials...');
        const supabase = createClient(supabaseUrl, supabaseKey);
        console.log('Supabase client created successfully');

        setStatus('Testing Supabase connection...');
        console.log('Executing test query on books table...');
        const { data, error } = await supabase.from('books').select('title').limit(1);
        console.log('Query result:', { data, error });

        if (error) throw error;

        setStatus(`Connected successfully! Found book: ${data?.[0]?.title || 'No books found'}`);
        console.log('Connection test completed successfully');
      } catch (err) {
        console.error('Error during connection test:', err);
        setError(err.message || 'Unknown error');
        setStatus('Connection failed');
      }
    }

    testConnection();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Supabase Connection Test</h1>
      <div style={{ padding: '10px', background: '#f0f0f0', borderRadius: '4px', marginBottom: '10px' }}>
        <strong>Status:</strong> {status}
      </div>

      {error && (
        <div style={{ padding: '10px', background: '#fff0f0', borderRadius: '4px', color: 'red' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <h3>Troubleshooting Notes:</h3>
        <ol>
          <li>Check if environment variables are loaded correctly</li>
          <li>Verify Supabase URL and API key are correct</li>
          <li>Confirm database is accessible and not paused</li>
          <li>Test browser console for additional errors</li>
        </ol>
      </div>
    </div>
  )
}

// Direct rendering for testing
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TestApp />
  </React.StrictMode>,
)
