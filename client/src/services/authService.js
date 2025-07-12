import { apiService } from './api';

export const authService = {
  // Register new user
  register: async ({ email, password, username }) => {
    return await apiService.post('/auth/register', {
      email,
      password,
      username
    });
  },

  // Login user
  login: async ({ email, password }) => {
    return await apiService.post('/auth/login', {
      email,
      password
    });
  },

  // Get current user
  getCurrentUser: async () => {
    return await apiService.get('/auth/me');
  },

  // Update user profile
  updateProfile: async (updates) => {
    return await apiService.put('/auth/profile', updates);
  },

  // Delete user account
  deleteAccount: async () => {
    return await apiService.delete('/auth/account');
  },
}; 