// src/App.minimal.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'

function App() {
  console.log('App component rendering...');
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Test Application</h1>
      <p>If you can see this, basic React rendering is working.</p>
    </div>
  )
}

// Direct rendering for testing
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
