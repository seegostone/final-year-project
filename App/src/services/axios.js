// frontend/src/services/axios.js
import axios from 'axios';

// Create axios instance - Vite uses import.meta.env
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token to every request
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from localStorage (support both token and accessToken keys)
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    
    // If token exists, add to headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // You can add loading indicator here
    // document.body.style.cursor = 'progress';
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
axiosInstance.interceptors.response.use(
  (response) => {
    // Remove loading indicator
    // document.body.style.cursor = 'default';
    
    // Return only the data we need; 304 responses may not include a body,
    // so return an empty object instead of undefined.
    return response.data ?? {};
  },
  (error) => {
    // Remove loading indicator
    // document.body.style.cursor = 'default';
    
    // Handle different error scenarios
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({
        type: 'TIMEOUT',
        message: 'Request timed out. Please try again.',
      });
    }
    
    if (!error.response) {
      // Network error
      return Promise.reject({
        type: 'NETWORK_ERROR',
        message: 'Network error. Please check your internet connection.',
      });
    }
    
    const { status, data } = error.response;
    
    // Handle specific status codes
    switch (status) {
      case 400:
        return Promise.reject({
          type: 'VALIDATION_ERROR',
          status: 400,
          message: data.message || 'Bad request',
          errors: data.errors,
          code: data.code,
        });
      
      case 401:
        // Unauthorized - clear localStorage and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        
        return Promise.reject({
          type: 'UNAUTHORIZED',
          status: 401,
          message: 'Session expired. Please login again.',
        });
      
      case 403:
        return Promise.reject({
          type: 'FORBIDDEN',
          status: 403,
          message: 'You do not have permission to perform this action.',
        });
      
      case 404:
        return Promise.reject({
          type: 'NOT_FOUND',
          status: 404,
          message: 'Resource not found.',
        });
      
      case 409:
        return Promise.reject({
          type: 'CONFLICT',
          status: 409,
          message: data.message || 'Resource already exists.',
          code: data.code,
        });
      
      case 422:
        return Promise.reject({
          type: 'UNPROCESSABLE_ENTITY',
          status: 422,
          message: data.message || 'Validation failed',
          errors: data.errors,
        });
      
      case 429:
        return Promise.reject({
          type: 'RATE_LIMIT',
          status: 429,
          message: 'Too many requests. Please try again later.',
        });
      
      case 500:
        return Promise.reject({
          type: 'SERVER_ERROR',
          status: 500,
          message: 'Internal server error. Please try again later.',
        });
      
      default:
        return Promise.reject({
          type: 'UNKNOWN_ERROR',
          status,
          message: data.message || 'An unexpected error occurred.',
        });
    }
  }
);

export default axiosInstance;