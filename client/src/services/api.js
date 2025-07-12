import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = localStorage.getItem('token');
      console.log('API Request:', config.method?.toUpperCase(), config.url, 'Token:', token ? 'Present' : 'Missing');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error in request interceptor:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API helper functions
export const apiService = {
  // GET request
  get: async (url, config = {}) => {
    try {
      const response = await api.get(url, config);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  // POST request
  post: async (url, data = {}, config = {}) => {
    try {
      const response = await api.post(url, data, config);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  // PUT request
  put: async (url, data = {}, config = {}) => {
    try {
      const response = await api.put(url, data, config);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  // DELETE request
  delete: async (url, config = {}) => {
    try {
      const response = await api.delete(url, config);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  // PATCH request
  patch: async (url, data = {}, config = {}) => {
    try {
      const response = await api.patch(url, data, config);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

function handleApiError(error) {
  console.error('API Error:', {
    status: error.response?.status,
    statusText: error.response?.statusText,
    data: error.response?.data,
    url: error.config?.url,
    method: error.config?.method
  });
  
  if (error.response && error.response.data) {
    const { error: errorMessage, errors } = error.response.data;
    
    if (errors && Object.keys(errors).length > 0) {
      // Format validation errors
      const validationMessages = Object.values(errors).join(', ');
      return new Error(`Validation errors: ${validationMessages}`);
    }
    
    if (errorMessage) {
      return new Error(errorMessage);
    }
  }
  
  if (error.response?.status === 400) {
    return new Error('Bad request - please check your input data');
  }
  
  if (error.response?.status === 401) {
    return new Error('Authentication required - please login');
  }
  
  if (error.response?.status === 404) {
    return new Error('Resource not found');
  }
  
  if (error.response?.status === 500) {
    return new Error('Server error - please try again later');
  }
  
  return error;
}

export default api;
