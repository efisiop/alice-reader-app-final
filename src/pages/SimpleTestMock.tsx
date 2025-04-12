import React, { useEffect, useState } from 'react';
import { getBookContent } from '../services/backendService';

const SimpleTestMock: React.FC = () => {
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function runTest() {
      try {
        const bookId = '550e8400-e29b-41d4-a716-446655440000';
        const result = await getBookContent(bookId);
        setTestResults(result);
      } catch (err) {
        setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    }
    
    runTest();
  }, []);

  if (loading) {
    return <div>Loading test results...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Simple Mock Backend Test</h1>
      
      <div>
        <h2>Book Content Test Result:</h2>
        <pre style={{ 
          backgroundColor: '#f5f5f5', 
          padding: '10px', 
          borderRadius: '5px',
          maxHeight: '500px',
          overflow: 'auto'
        }}>
          {JSON.stringify(testResults, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default SimpleTestMock; 