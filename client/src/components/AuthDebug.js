import React from 'react';
import { useAuth } from '../context/AuthContext';

const AuthDebug = () => {
  const { currentUser, loading } = useAuth();
  const token = localStorage.getItem('token');

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-medium text-yellow-800 mb-2">Authentication Debug Info</h3>
      <div className="text-sm text-yellow-700 space-y-1">
        <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
        <p><strong>Token exists:</strong> {token ? 'Yes' : 'No'}</p>
        <p><strong>Token length:</strong> {token ? token.length : 0}</p>
        <p><strong>Current User:</strong> {currentUser ? 'Yes' : 'No'}</p>
        {currentUser && (
          <>
            <p><strong>Username:</strong> {currentUser.username}</p>
            <p><strong>Email:</strong> {currentUser.email}</p>
            <p><strong>User ID:</strong> {currentUser._id}</p>
          </>
        )}
        <p><strong>Token Preview:</strong> {token ? `${token.substring(0, 20)}...` : 'None'}</p>
      </div>
    </div>
  );
};

export default AuthDebug; 