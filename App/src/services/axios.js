// frontend/src/services/axios.js
import axios from 'axios';

// Create axios instance - Vite uses import.meta.env
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
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

    // Allow Axios to set the FormData boundary for uploads.
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
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
    
    // Return the full response data structure
    // 304 responses may not include a body, so return an empty object instead of undefined.
    console.log('API Response:', response.data);
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
      console.error('Network error:', error);
      return Promise.reject({
        type: 'NETWORK_ERROR',
        message: 'Network error. Please check your internet connection.',
        error: error,
      });
    }
    
    const { status, data } = error.response;
    const config = error.config || {};

    // Retry on 429 with exponential backoff
    if (status === 429) {
      const maxRetries = config.__maxRetries ?? 3;
      config.__retryCount = config.__retryCount || 0;
      config.__maxRetries = maxRetries;

      if (config.__retryCount < maxRetries) {
        config.__retryCount += 1;
        const delay = Math.min(2000, 300 * Math.pow(2, config.__retryCount));

        return new Promise((resolve) => setTimeout(resolve, delay)).then(() =>
          axiosInstance.request(config)
        );
      }
      // fall through to return formatted rate-limit error after retries exhausted
    }
    
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
      
      case 401: {
        const requestUrl = String(config.url || '').toLowerCase();
        let requestPath;

        try {
          requestPath = requestUrl.startsWith('http')
            ? new URL(requestUrl).pathname
            : new URL(requestUrl, 'http://localhost').pathname;
        } catch {
          requestPath = requestUrl;
        }

        const publicAuthRoutes = [
          '/auth/login',
          '/auth/register',
          '/auth/verify-email',
          '/auth/resend-verification',
          '/auth/forgot-password',
          '/auth/reset-password',
        ];

        const isPublicAuthRoute = publicAuthRoutes.some((route) => requestPath.includes(route));
        const messageFromServer = data?.message || 'Unauthorized. Please login again.';

        const rejectPayload = {
          type: 'UNAUTHORIZED',
          status: 401,
          message: messageFromServer,
          response: error.response,
        };

        if (!isPublicAuthRoute) {
          localStorage.removeItem('token');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('tokenExpiry');
          localStorage.removeItem('user');

          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }

          rejectPayload.message = data?.message || 'Session expired. Please login again.';
        }

        return Promise.reject(rejectPayload);
      }
      
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