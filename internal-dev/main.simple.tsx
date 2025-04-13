import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

// Simple component for testing
const SimpleApp = () => {
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Alice Reader Test Page</h1>
      <p>If you can see this, React is working correctly.</p>
      <p>The main application might have an issue with:</p>
      <ul>
        <li>Supabase connection</li>
        <li>Router configuration</li>
        <li>Authentication context</li>
      </ul>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SimpleApp />
  </React.StrictMode>,
)
