import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Import only the test page
import TestPage from './pages/TestPage';

function SimpleApp() {
  console.log('SimpleApp: Rendering');
  
  return (
    <Router>
      <div className="App">
        <main>
          <Routes>
            <Route path="/" element={<TestPage />} />
            <Route path="/test" element={<TestPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default SimpleApp;
