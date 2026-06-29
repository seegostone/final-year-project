
// frontend/src/services/api.js
import axiosInstance from './axios';

// Error handler utility
export const handleApiError = (error) => {
  console.error('API Error:', error);
  
  // Network error
  if (error.message === 'Network Error') {
    return {
      message: 'Unable to connect to the server. Please check your internet connection.',
      type: 'NETWORK_ERROR',
    };
  }
  
  // Timeout error
  if (error.code === 'ECONNABORTED') {
    return {
      message: 'Request timed out. Please try again.',
      type: 'TIMEOUT_ERROR',
    };
  }

  // Preserve errors already shaped by axios interceptors
  if (error.type) {
    return {
      message: error.message || 'An unexpected error occurred.',
      type: error.type,
      status: error.status,
      validationErrors: error.validationErrors || error.errors,
      code: error.code,
    };
  }
  
  // Response error with status
  if (error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return {
          message: data.message || 'Bad request. Please check your input.',
          type: 'BAD_REQUEST',
          validationErrors: data.errors,
          code: data.code,
        };
      case 401:
        return {
          message: data.message || 'Unauthorized. Please login again.',
          type: 'UNAUTHORIZED',
        };
      case 403:
        return {
          message: 'You do not have permission to perform this action.',
          type: 'FORBIDDEN',
        };
      case 404:
        return {
          message: 'Resource not found.',
          type: 'NOT_FOUND',
        };
      case 409:
        return {
          message: data.message || 'Resource already exists.',
          type: 'CONFLICT',
          code: data.code,
        };
      case 422:
        return {
          message: data.message || 'Validation failed.',
          type: 'VALIDATION_ERROR',
          validationErrors: data.errors,
        };
      case 429:
        return {
          message: 'Too many requests. Please try again later.',
          type: 'RATE_LIMIT',
        };
      case 500:
        return {
          message: 'Internal server error. Please try again later.',
          type: 'SERVER_ERROR',
        };
      default:
        return {
          message: data.message || 'An unexpected error occurred.',
          type: 'UNKNOWN_ERROR',
        };
    }
  }
  
  // Default error
  return {
    message: error.message || 'An unexpected error occurred.',
    type: 'UNKNOWN_ERROR',
  };
};

// Auth Service
export const authService = {
  async register(userData) {
    try {
      const payload = {
        name: userData.fullName,
        email: userData.email,
        password: userData.password,
        role: userData.role,
        phoneNumber: userData.phoneNumber,
        specialization: userData.specialization,
        zone: userData.zone,
        skills: userData.skills,
      };
      
      const response = await axiosInstance.post('/auth/register', payload);
      
      return {
        success: true,
        data: response.data || response,
      };
    } catch (error) {
      console.error('Registration error:', error);
      const formattedError = handleApiError(error);
      
      return {
        success: false,
        error: formattedError.message,
        type: formattedError.type,
        status: error.status || 500,
        validationErrors: formattedError.validationErrors || null,
        code: formattedError.code || null,
      };
    }
  },

  async resendVerificationEmail(email) {
    try {
      const response = await axiosInstance.post('/auth/resend-verification', { email });
      
      return {
        success: true,
        data: response.data || response,
      };
    } catch (error) {
      console.error('Resend verification error:', error);
      const formattedError = handleApiError(error);
      
      return {
        success: false,
        error: formattedError.message,
        type: formattedError.type || 'RESEND_ERROR',
        status: error.status || 500,
      };
    }
  },

  async login(email, password) {
    try {
      const response = await axiosInstance.post('/auth/login', { email, password });
      
      const token = response.token || response.data?.token;
      const user = response.user || response.data?.user;
      
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('tokenExpiry', this.getTokenExpiry(token));
      }
      
      return {
        success: true,
        data: response,
        token: token,
        user: user,
      };
    } catch (error) {
      console.error('Login error:', error);
      const formattedError = handleApiError(error);
      
      return {
        success: false,
        error: formattedError.message,
        type: formattedError.type,
        status: error.status || 500,
        code: formattedError.code || null,
      };
    }
  },

  async verifyEmail(token) {
    try {
      const cleanedToken = String(token || '').trim();
      if (!cleanedToken) {
        return {
          success: false,
          error: 'Verification token is required.',
          type: 'VALIDATION_ERROR',
          status: 400,
        };
      }

      const response = await axiosInstance.get(
        `/auth/verify-email/${encodeURIComponent(cleanedToken)}`
      );
      
      return {
        success: true,
        data: response.data || response,
      };
    } catch (error) {
      console.error('Verification error:', error?.response?.data || error);
      const formattedError = handleApiError(error);
      
      return {
        success: false,
        error: formattedError.message,
        type: formattedError.type,
        status: formattedError.status || 500,
      };
    }
  },

  async forgotPassword(email) {
    try {
      const response = await axiosInstance.post('/auth/forgot-password', { email });
      
      return {
        success: true,
        data: response.data || response,
      };
    } catch (error) {
      console.error('Forgot password error:', error);
      const formattedError = handleApiError(error);
      
      return {
        success: false,
        error: formattedError.message,
        type: formattedError.type,
        status: error.status || 500,
      };
    }
  },

  async resetPassword(token, password) {
    try {
      const response = await axiosInstance.put(`/auth/reset-password/${token}`, { password });
      
      return {
        success: true,
        data: response.data || response,
      };
    } catch (error) {
      console.error('Reset password error:', error);
      const formattedError = handleApiError(error);
      
      return {
        success: false,
        error: formattedError.message,
        type: formattedError.type,
        status: error.status || 500,
      };
    }
  },

  async getCurrentUser() {
    try {
      const response = await axiosInstance.get('/auth/me');
      
      return {
        success: true,
        user: response.user,
        data: response,
      };
    } catch (error) {
      console.error('Get current user error:', error);
      const formattedError = handleApiError(error);
      
      return {
        success: false,
        error: formattedError.message,
        type: formattedError.type,
        status: error.status || 500,
      };
    }
  },

  // Token Management Methods
  getToken() {
    return localStorage.getItem('token');
  },

  getTokenExpiry(token) {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  },

  isTokenExpired() {
    const token = this.getToken();
    if (!token) return true;
    
    const expiry = localStorage.getItem('tokenExpiry');
    if (!expiry) return true;
    
    return Date.now() > parseInt(expiry);
  },

  isAuthenticated() {
    return !!this.getToken() && !this.isTokenExpired();
  },

  getCurrentUserFromStorage() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getUserRole() {
    const user = this.getCurrentUserFromStorage();
    return user?.role || null;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenExpiry');
  },

  logoutAndRedirect() {
    this.logout();
    window.location.href = '/login?logout=true';
  },
};

// User Service
export const userService = {
  async getAllUsers() {
    try {
      const response = await axiosInstance.get('/users');
      return { 
        success: true, 
        data: response.data || response,
      };
    } catch (error) {
      console.error('Get all users error:', error);
      const formattedError = handleApiError(error);
      
      return { 
        success: false, 
        error: formattedError.message,
        type: formattedError.type,
        status: error.status || 500,
      };
    }
  },

  async getUserById(id) {
    try {
      const response = await axiosInstance.get(`/users/${id}`);
      return { 
        success: true, 
        data: response.data || response,
      };
    } catch (error) {
      console.error(`Get user by ID ${id} error:`, error);
      const formattedError = handleApiError(error);
      
      return { 
        success: false, 
        error: formattedError.message,
        type: formattedError.type,
        status: error.status || 500,
      };
    }
  },

  async updateUser(id, userData) {
    try {
      const response = await axiosInstance.put(`/users/${id}`, userData);
      return { 
        success: true, 
        data: response.data || response,
      };
    } catch (error) {
      console.error(`Update user ${id} error:`, error);
      const formattedError = handleApiError(error);
      
      return { 
        success: false, 
        error: formattedError.message,
        type: formattedError.type,
        status: error.status || 500,
        validationErrors: formattedError.validationErrors || null,
      };
    }
  },

  async deleteUser(id) {
    try {
      const response = await axiosInstance.delete(`/users/${id}`);
      return { 
        success: true, 
        data: response.data || response,
      };
    } catch (error) {
      console.error(`Delete user ${id} error:`, error);
      const formattedError = handleApiError(error);
      
      return { 
        success: false, 
        error: formattedError.message,
        type: formattedError.type,
        status: error.status || 500,
      };
    }
  },
};

export default authService;