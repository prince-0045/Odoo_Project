import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { FiBell, FiCheck, FiX, FiRefreshCw } from 'react-icons/fi';

const NotificationTest = () => {
  const { socket, connected, notifications, unreadCount, addNotification, markNotificationAsRead, markAllNotificationsAsRead } = useSocket();
  const { currentUser } = useAuth();
  const [testResults, setTestResults] = useState([]);

  const addResult = (test, success, message, data = null) => {
    setTestResults(prev => [...prev, {
      test,
      success,
      message,
      data,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const testSocketConnection = () => {
    addResult('Socket Connection', connected ? 'success' : 'error', 
      connected ? 'Socket is connected' : 'Socket is not connected',
      { connected, socketId: socket?.id }
    );
  };

  const testManualNotification = () => {
    try {
      const testNotification = {
        _id: Date.now().toString(),
        type: 'test',
        content: 'This is a test notification - ' + new Date().toLocaleTimeString(),
        isRead: false,
        createdAt: new Date()
      };
      
      addNotification(testNotification);
      addResult('Manual Notification', 'success', 'Test notification added successfully', testNotification);
    } catch (error) {
      addResult('Manual Notification', 'error', error.message);
    }
  };

  const testSocketEmit = () => {
    if (socket && connected) {
      try {
        socket.emit('test_notification', {
          type: 'test',
          content: 'Test notification via socket - ' + new Date().toLocaleTimeString()
        });
        addResult('Socket Emit', 'success', 'Test notification sent via socket');
      } catch (error) {
        addResult('Socket Emit', 'error', error.message);
      }
    } else {
      addResult('Socket Emit', 'error', 'Socket not connected');
    }
  };

  const testMarkAsRead = () => {
    if (notifications.length > 0) {
      try {
        const firstNotification = notifications[0];
        markNotificationAsRead(firstNotification._id);
        addResult('Mark as Read', 'success', 'First notification marked as read', firstNotification);
      } catch (error) {
        addResult('Mark as Read', 'error', error.message);
      }
    } else {
      addResult('Mark as Read', 'error', 'No notifications to mark as read');
    }
  };

  const testMarkAllAsRead = () => {
    if (notifications.length > 0) {
      try {
        markAllNotificationsAsRead();
        addResult('Mark All as Read', 'success', 'All notifications marked as read');
      } catch (error) {
        addResult('Mark All as Read', 'error', error.message);
      }
    } else {
      addResult('Mark All as Read', 'error', 'No notifications to mark as read');
    }
  };

  const runAllTests = () => {
    setTestResults([]);
    testSocketConnection();
    testManualNotification();
    testSocketEmit();
    setTimeout(() => {
      testMarkAsRead();
      testMarkAllAsRead();
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Notification System Test</h1>
          
          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <FiBell className="w-5 h-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Socket Status</p>
                  <p className={`text-lg font-bold ${connected ? 'text-green-600' : 'text-red-600'}`}>
                    {connected ? 'Connected' : 'Disconnected'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <FiCheck className="w-5 h-5 text-green-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-green-900">Total Notifications</p>
                  <p className="text-lg font-bold text-green-600">{notifications.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center">
                <FiRefreshCw className="w-5 h-5 text-yellow-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">Unread Count</p>
                  <p className="text-lg font-bold text-yellow-600">{unreadCount}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center">
                <FiX className="w-5 h-5 text-purple-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-purple-900">User Status</p>
                  <p className="text-lg font-bold text-purple-600">
                    {currentUser ? currentUser.username : 'Not logged in'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Test Controls */}
          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={runAllTests}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Run All Tests
            </button>
            <button
              onClick={testSocketConnection}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Test Socket Connection
            </button>
            <button
              onClick={testManualNotification}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
            >
              Add Test Notification
            </button>
            <button
              onClick={testSocketEmit}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Test Socket Emit
            </button>
          </div>

          {/* Test Results */}
          <div className="space-y-4 mb-6">
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

        {/* Current Notifications */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Notifications</h2>
          
          {notifications.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No notifications yet.</p>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification, index) => (
                <div
                  key={notification._id || index}
                  className={`p-4 border rounded-lg ${
                    notification.isRead ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          notification.type === 'answer' ? 'bg-green-100 text-green-800' :
                          notification.type === 'vote' ? 'bg-blue-100 text-blue-800' :
                          notification.type === 'accept' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {notification.type}
                        </span>
                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-900 mt-1">{notification.content}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      {!notification.isRead && (
                        <button
                          onClick={() => markNotificationAsRead(notification._id)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Mark Read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationTest; 