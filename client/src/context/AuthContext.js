import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authService.getCurrentUser()
        .then(res => {
          if (res.success) {
            setCurrentUser(res.data.user);
            setUserProfile(res.data.user);
          } else {
            setCurrentUser(null);
            setUserProfile(null);
            localStorage.removeItem('token');
          }
        })
        .catch(() => {
          setCurrentUser(null);
          setUserProfile(null);
          localStorage.removeItem('token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Register
  const signup = async (email, password, username) => {
    try {
      const response = await authService.register({ email, password, username });
      if (response.success && response.token) {
        localStorage.setItem('token', response.token);
        setCurrentUser(response.data.user);
        setUserProfile(response.data.user);
        toast.success('Account created successfully!');
        return { success: true, user: response.data.user };
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to create account');
      return { success: false, error: error.message };
    }
  };

  // Login
  const login = async (email, password) => {
    try {
      const response = await authService.login({ email, password });
      if (response.success && response.token) {
        localStorage.setItem('token', response.token);
        setCurrentUser(response.data.user);
        setUserProfile(response.data.user);
        toast.success('Welcome back!');
        return { success: true, user: response.data.user };
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to sign in');
      return { success: false, error: error.message };
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setUserProfile(null);
    toast.success('Signed out successfully');
  };

  // Update user profile
  const updateUserProfile = async (updates) => {
    try {
      const response = await authService.updateProfile(updates);
      if (response.success) {
        setUserProfile(response.data.user);
        setCurrentUser(response.data.user);
        toast.success('Profile updated successfully');
        return { success: true, user: response.data.user };
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
      return { success: false, error: error.message };
    }
  };

  // Get current user profile
  const getCurrentUser = async () => {
    try {
      const response = await authService.getCurrentUser();
      if (response.success) {
        setUserProfile(response.data.user);
        setCurrentUser(response.data.user);
        return response.data.user;
      }
    } catch (error) {
      // ignore
    }
    return null;
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    signup,
    login,
    logout,
    updateUserProfile,
    getCurrentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 