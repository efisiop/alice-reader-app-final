// src/main.4002.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'

// Simple component for testing
function SimpleApp() {
  console.log('SimpleApp rendering on port 4002...');
  
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Alice Reader Test (Port 4002)</h1>
      <p>If you can see this, React is working correctly on port 4002.</p>
      <p>Check the browser console for detailed logs.</p>
      
      <div style={{ marginTop: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '4px' }}>
        <h3>Environment Variables:</h3>
        <ul>
          <li>VITE_SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL || 'Not set'}</li>
          <li>Window SUPABASE_URL: {window.SUPABASE_URL || 'Not set'}</li>
          <li>VITE_SUPABASE_ANON_KEY: {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set (not shown)' : 'Not set'}</li>
          <li>Window SUPABASE_KEY: {window.SUPABASE_KEY ? 'Set (not shown)' : 'Not set'}</li>
        </ul>
      </div>
      
      <button 
        onClick={async () => {
          try {
            console.log('Testing Supabase connection...');
            
            // Get credentials from either source
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || window.SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || window.SUPABASE_KEY;
            
            if (!supabaseUrl || !supabaseKey) {
              throw new Error('Missing Supabase credentials');
            }
            
            // Dynamic import
            const { createClient } = await import('@supabase/supabase-js');
            const supabase = createClient(supabaseUrl, supabaseKey);
            
            // Test query
            const { data, error } = await supabase.from('books').select('title').limit(1);
            
            if (error) throw error;
            
            alert(`Connection successful! Found book: ${data?.[0]?.title || 'No books found'}`);
          } catch (err) {
            console.error('Connection test failed:', err);
            alert(`Connection failed: ${err.message}`);
          }
        }}
        style={{ 
          marginTop: '20px', 
          padding: '10px 20px', 
          background: '#6a51ae', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Test Supabase Connection
      </button>
    </div>
  )
}

// Log initialization
console.log('main.4002.jsx executing...');
console.log('Environment variables:', import.meta.env);
console.log('Window environment variables:', {
  SUPABASE_URL: window.SUPABASE_URL,
  SUPABASE_KEY: window.SUPABASE_KEY ? 'Present (not shown)' : 'Missing'
});

// Render the app
console.log('Rendering SimpleApp to DOM...');
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SimpleApp />
  </React.StrictMode>,
);
