import React, { useState } from 'react';
import { getDefinition } from '../services/dictionaryService';
import { appLog } from './LogViewer';

export default function DictionaryTest() {
  const [word, setWord] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testWords = [
    'Alice',
    'Wonderland',
    'curious',
    'rabbit-hole',
    'Cheshire',
    'nonsense',
    'imagination'
  ];

  const handleLookup = async (testWord: string) => {
    setWord(testWord);
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      appLog('DictionaryTest', 'Looking up word', 'info', { word: testWord });
      const definition = await getDefinition('alice', testWord);
      setResult(definition);
      appLog('DictionaryTest', 'Lookup successful', 'success', { word: testWord, definition });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      appLog('DictionaryTest', 'Lookup failed', 'error', { word: testWord, error: err });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Dictionary Service Test</h1>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Test Words:</h2>
        <div className="flex flex-wrap gap-2">
          {testWords.map((testWord) => (
            <button
              key={testWord}
              onClick={() => handleLookup(testWord)}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              disabled={loading}
            >
              {testWord}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2">Looking up "{word}"...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-xl font-bold mb-2">{result.term}</h2>
          
          {result.pronunciation && (
            <p className="text-gray-600 mb-2">Pronunciation: {result.pronunciation}</p>
          )}
          
          <div className="mb-4">
            <h3 className="font-semibold mb-1">Definition:</h3>
            <p className="whitespace-pre-line">{result.definition}</p>
          </div>

          {result.examples && result.examples.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold mb-1">Examples:</h3>
              <ul className="list-disc pl-5">
                {result.examples.map((example: string, index: number) => (
                  <li key={index} className="mb-1">{example}</li>
                ))}
              </ul>
            </div>
          )}

          {result.relatedTerms && result.relatedTerms.length > 0 && (
            <div>
              <h3 className="font-semibold mb-1">Related Terms:</h3>
              <div className="flex flex-wrap gap-2">
                {result.relatedTerms.map((term: string, index: number) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 rounded text-sm"
                  >
                    {term}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 text-sm text-gray-500">
            Source: {result.source}
          </div>
        </div>
      )}
    </div>
  );
} 