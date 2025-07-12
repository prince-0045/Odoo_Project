import React, { useState } from 'react';
import { questionService } from '../services/questionService';
import { answerService } from '../services/answerService';
import { useAuth } from '../context/AuthContext';
import AuthDebug from './AuthDebug';
import toast from 'react-hot-toast';

const TestAPI = () => {
  const { currentUser } = useAuth();
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test, success, message, data = null) => {
    setTestResults(prev => [...prev, {
      test,
      success,
      message,
      data,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const testQuestionsAPI = async () => {
    try {
      addResult('Questions API', 'pending', 'Testing questions API...');
      const response = await questionService.getQuestions();
      addResult('Questions API', 'success', `Found ${response.data?.questions?.length || 0} questions`, response.data);
    } catch (error) {
      addResult('Questions API', 'error', error.message, error);
    }
  };

  const testCreateQuestion = async () => {
    if (!currentUser) {
      addResult('Create Question', 'error', 'User not logged in');
      return;
    }

    try {
      addResult('Create Question', 'pending', 'Creating test question...');
      const testQuestion = {
        title: 'Test Question - ' + new Date().toLocaleTimeString(),
        description: 'This is a test question to verify the API is working correctly.',
        tags: ['test', 'api']
      };
      
      const response = await questionService.createQuestion(testQuestion);
      addResult('Create Question', 'success', 'Question created successfully', response.data);
      
      // Test creating an answer
      if (response.data?.question?._id) {
        await testCreateAnswer(response.data.question._id);
      }
    } catch (error) {
      addResult('Create Question', 'error', error.message, error);
    }
  };

  const testCreateAnswer = async (questionId) => {
    if (!currentUser) {
      addResult('Create Answer', 'error', 'User not logged in');
      return;
    }

    try {
      addResult('Create Answer', 'pending', 'Creating test answer...');
      const testAnswer = {
        questionId: questionId,
        content: 'This is a test answer to verify the answer API is working correctly.'
      };
      
      const response = await answerService.createAnswer(testAnswer);
      addResult('Create Answer', 'success', 'Answer created successfully', response.data);
    } catch (error) {
      addResult('Create Answer', 'error', error.message, error);
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    setTestResults([]);
    
    await testQuestionsAPI();
    await testCreateQuestion();
    
    setLoading(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">API Test Panel</h1>
          
          <AuthDebug />
          
          <div className="mb-6">
            <div className="flex space-x-4 mb-4">
              <button
                onClick={runAllTests}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Running Tests...' : 'Run All Tests'}
              </button>
              <button
                onClick={clearResults}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Clear Results
              </button>
            </div>
            
            <div className="text-sm text-gray-600">
              <p><strong>User Status:</strong> {currentUser ? `Logged in as ${currentUser.username}` : 'Not logged in'}</p>
              <p><strong>API Base URL:</strong> {process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}</p>
            </div>
          </div>

          {/* Test Results */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Test Results</h2>
            
            {testResults.length === 0 ? (
              <p className="text-gray-500">No tests run yet. Click "Run All Tests" to start.</p>
            ) : (
              testResults.map((result, index) => (
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
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestAPI; 