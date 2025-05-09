import React from 'react';

const TestSimple: React.FC = () => {
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Simple Test Page</h1>
      <p>This is a simple test page that doesn't rely on any services.</p>
      <p>If you can see this, the basic React rendering is working.</p>
    </div>
  );
};

export default TestSimple;
