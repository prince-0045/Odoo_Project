import React, { useState } from 'react';
import { questionService } from '../services/questionService';
import { answerService } from '../services/answerService';

const SimpleTest = () => {
  const [results, setResults] = useState([]);

  const addResult = (test, success, message, data = null) => {
    setResults(prev => [...prev, {
      test,
      success,
      message,
      data,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const testGetQuestions = async () => {
    try {
      addResult('GET /questions', 'pending', 'Testing...');
      const response = await questionService.getQuestions();
      addResult('GET /questions', 'success', 'Success', response);
    } catch (error) {
      addResult('GET /questions', 'error', error.message, {
        status: error.response?.status,
        data: error.response?.data
      });
    }
  };

  const testGetQuestion = async () => {
    try {
      addResult('GET /questions/:id', 'pending', 'Testing with dummy ID...');
      const response = await questionService.getQuestion('507f1f77bcf86cd799439011');
      addResult('GET /questions/:id', 'success', 'Success', response);
    } catch (error) {
      addResult('GET /questions/:id', 'error', error.message, {
        status: error.response?.status,
        data: error.response?.data
      });
    }
  };

  const testCreateQuestion = async () => {
    try {
      addResult('POST /questions', 'pending', 'Testing...');
      const testData = {
        title: 'Test Question',
        description: 'This is a test question to check if the API is working.',
        tags: ['test', 'api']
      };
      const response = await questionService.createQuestion(testData);
      addResult('POST /questions', 'success', 'Success', response);
    } catch (error) {
      addResult('POST /questions', 'error', error.message, {
        status: error.response?.status,
        data: error.response?.data
      });
    }
  };

  const testGetAnswers = async () => {
    try {
      addResult('GET /answers/question/:id', 'pending', 'Testing with dummy ID...');
      const response = await answerService.getAnswers('507f1f77bcf86cd799439011');
      addResult('GET /answers/question/:id', 'success', 'Success', response);
    } catch (error) {
      addResult('GET /answers/question/:id', 'error', error.message, {
        status: error.response?.status,
        data: error.response?.data
      });
    }
  };

  const runAllTests = async () => {
    setResults([]);
    await testGetQuestions();
    await testGetQuestion();
    await testCreateQuestion();
    await testGetAnswers();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Simple API Test</h1>
          
          <div className="mb-6">
            <button
              onClick={runAllTests}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Run All Tests
            </button>
          </div>

          <div className="space-y-4">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.success === 'success' ? 'bg-green-50 border-green-200' :
                  result.success === 'error' ? 'bg-red-50 border-red-200' :
                  'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{result.test}</h3>
                    <p className="text-sm text-gray-600">{result.message}</p>
                    <p className="text-xs text-gray-500">{result.timestamp}</p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    result.success === 'success' ? 'bg-green-100 text-green-800' :
                    result.success === 'error' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {result.success}
                  </div>
                </div>
                
                {result.data && (
                  <details className="mt-2">
                    <summary className="text-sm text-gray-600 cursor-pointer">View Data</summary>
                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleTest; 