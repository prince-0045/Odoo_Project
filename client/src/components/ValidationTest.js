import React, { useState } from 'react';
import { questionService } from '../services/questionService';
import { useAuth } from '../context/AuthContext';

const ValidationTest = () => {
  const { currentUser } = useAuth();
  const [results, setResults] = useState([]);
  const [formData, setFormData] = useState({
    title: 'Test Question Title',
    description: 'This is a test question description that should be long enough to pass validation.',
    tags: 'test,api,validation'
  });

  const addResult = (test, success, message, data = null) => {
    setResults(prev => [...prev, {
      test,
      success,
      message,
      data,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const testValidation = async () => {
    setResults([]);
    
    // Test 1: Valid data
    try {
      addResult('Valid Data Test', 'pending', 'Testing with valid data...');
      const validData = {
        title: 'This is a valid question title that meets the minimum length requirement',
        description: 'This is a valid question description that is long enough to pass the minimum length validation requirement of 20 characters.',
        tags: ['test', 'validation', 'api']
      };
      
      console.log('Sending valid data:', validData);
      const response = await questionService.createQuestion(validData);
      addResult('Valid Data Test', 'success', 'Success!', response);
    } catch (error) {
      addResult('Valid Data Test', 'error', error.message, {
        status: error.response?.status,
        data: error.response?.data,
        validationErrors: error.response?.data?.errors
      });
    }

    // Test 2: Short title
    try {
      addResult('Short Title Test', 'pending', 'Testing with short title...');
      const shortTitleData = {
        title: 'Short',
        description: 'This is a valid question description that is long enough to pass the minimum length validation requirement of 20 characters.',
        tags: ['test', 'validation']
      };
      
      console.log('Sending short title data:', shortTitleData);
      const response = await questionService.createQuestion(shortTitleData);
      addResult('Short Title Test', 'success', 'Unexpected success!', response);
    } catch (error) {
      addResult('Short Title Test', 'error', error.message, {
        status: error.response?.status,
        data: error.response?.data,
        validationErrors: error.response?.data?.errors
      });
    }

    // Test 3: Short description
    try {
      addResult('Short Description Test', 'pending', 'Testing with short description...');
      const shortDescData = {
        title: 'This is a valid question title that meets the minimum length requirement',
        description: 'Short desc',
        tags: ['test', 'validation']
      };
      
      console.log('Sending short description data:', shortDescData);
      const response = await questionService.createQuestion(shortDescData);
      addResult('Short Description Test', 'success', 'Unexpected success!', response);
    } catch (error) {
      addResult('Short Description Test', 'error', error.message, {
        status: error.response?.status,
        data: error.response?.data,
        validationErrors: error.response?.data?.errors
      });
    }

    // Test 4: Empty tags
    try {
      addResult('Empty Tags Test', 'pending', 'Testing with empty tags...');
      const emptyTagsData = {
        title: 'This is a valid question title that meets the minimum length requirement',
        description: 'This is a valid question description that is long enough to pass the minimum length validation requirement of 20 characters.',
        tags: []
      };
      
      console.log('Sending empty tags data:', emptyTagsData);
      const response = await questionService.createQuestion(emptyTagsData);
      addResult('Empty Tags Test', 'success', 'Unexpected success!', response);
    } catch (error) {
      addResult('Empty Tags Test', 'error', error.message, {
        status: error.response?.status,
        data: error.response?.data,
        validationErrors: error.response?.data?.errors
      });
    }

    // Test 5: Current form data
    try {
      addResult('Current Form Data Test', 'pending', 'Testing with current form data...');
      const currentData = {
        title: formData.title,
        description: formData.description,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      };
      
      console.log('Sending current form data:', currentData);
      const response = await questionService.createQuestion(currentData);
      addResult('Current Form Data Test', 'success', 'Success!', response);
    } catch (error) {
      addResult('Current Form Data Test', 'error', error.message, {
        status: error.response?.status,
        data: error.response?.data,
        validationErrors: error.response?.data?.errors
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Validation Test</h1>
          
          <div className="mb-6">
            <div className="text-sm text-gray-600 mb-4">
              <p><strong>User Status:</strong> {currentUser ? `Logged in as ${currentUser.username}` : 'Not logged in'}</p>
              <p><strong>Validation Rules:</strong></p>
              <ul className="list-disc list-inside ml-4">
                <li>Title: Minimum 10 characters</li>
                <li>Description: Minimum 20 characters</li>
                <li>Tags: At least one tag required</li>
              </ul>
            </div>
            
            <button
              onClick={testValidation}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Run Validation Tests
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

export default ValidationTest; 