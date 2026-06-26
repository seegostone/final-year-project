import axiosInstance from './axios';
import { handleApiError } from './api';

const managementService = {
  // Get complaints queue with filters
  async getQueue(filters = {}) {
    try {
      const queryString = new URLSearchParams({
        status: filters.status || 'all',
        priority: filters.priority || 'all',
      });
      if (filters.category) queryString.append('category', filters.category);
      if (filters.search) queryString.append('search', filters.search);
      if (filters.page) queryString.append('page', String(filters.page));
      if (filters.limit) queryString.append('limit', String(filters.limit));

      const response = await axiosInstance.get(
        `/management/queue?${queryString.toString()}`
      );

      const payload = response.data || response;
      const data = Array.isArray(payload.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : Array.isArray(payload.data?.data)
            ? payload.data.data
            : [];

      return {
        success: true,
        data,
        count: payload.count ?? 0,
        pagination: payload.pagination ?? payload.data?.pagination,
      };
    } catch (error) {
      console.error('Get queue error:', error);
      const formattedError = handleApiError(error);
      return {
        success: false,
        error: formattedError.message,
        type: formattedError.type,
        status: error.status || 500,
      };
    }
  },

  // Get dashboard statistics
  async getDashboardStats() {
    try {
      const response = await axiosInstance.get('/management/dashboard');

      return {
        success: true,
        data: response.data || response,
      };
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      const formattedError = handleApiError(error);
      return {
        success: false,
        error: formattedError.message,
        type: formattedError.type,
        status: error.status || 500,
      };
    }
  },

  // Get list of technicians
  async getTechnicians(category = null) {
    try {
      const queryString = new URLSearchParams();
      if (category) queryString.append('category', category);
      const response = await axiosInstance.get(
        `/management/technicians${queryString.toString() ? `?${queryString.toString()}` : ''}`
      );

      return {
        success: true,
        data: response.data || response,
        count: response.count,
      };
    } catch (error) {
      console.error('Get technicians error:', error);
      const formattedError = handleApiError(error);
      return {
        success: false,
        error: formattedError.message,
        type: formattedError.type,
        status: error.status || 500,
      };
    }
  },

  // Validate complaint
  async validateComplaint(complaintId, data) {
    try {
      const response = await axiosInstance.post(
        `/management/${complaintId}/validate`,
        data
      );

      return {
        success: true,
        data: response.data || response,
        message: response.message,
      };
    } catch (error) {
      console.error('Validate complaint error:', error);
      const formattedError = handleApiError(error);
      return {
        success: false,
        error: formattedError.message,
        type: formattedError.type,
        status: error.status || 500,
        validationErrors: formattedError.validationErrors,
      };
    }
  },




  async updateTaskStatus(complaintId, taskId, data) {
  try {
    const response = await axiosInstance.patch(
      `/management/${complaintId}/tasks/${taskId}/status`,
      data
    );
    return { success: true, data: response.data || response, message: response.message };
  } catch (error) {
    console.error('Update task status error:', error);
    const formattedError = handleApiError(error);
    return { success: false, error: formattedError.message, type: formattedError.type };
  }
},



  // Triage complaint
  async triageComplaint(complaintId, data) {
    try {
      const response = await axiosInstance.post(
        `/management/${complaintId}/triage`,
        data
      );

      return {
        success: true,
        data: response.data || response,
        message: response.message,
      };
    } catch (error) {
      console.error('Triage complaint error:', error);
      const formattedError = handleApiError(error);
      return {
        success: false,
        error: formattedError.message,
        type: formattedError.type,
        status: error.status || 500,
        validationErrors: formattedError.validationErrors,
      };
    }
  },

  // Assess & Prioritize (Triage)
  async assessPrioritizeComplaint(complaintId, data) {
    try {
      const response = await axiosInstance.post(
        `/management/${complaintId}/triage`,
        {
          priority: data.priority,
          triageNotes: data.triageNotes,
          triageBy: data.triageBy,
        }
      );

      return {
        success: true,
        data: response.data || response,
        message: response.message,
      };
    } catch (error) {
      console.error('Assess & prioritize error:', error);
      const formattedError = handleApiError(error);
      return {
        success: false,
        error: formattedError.message,
        type: formattedError.type,
        status: error.status || 500,
        validationErrors: formattedError.validationErrors,
      };
    }
  },

  // Define scope
  async defineScopeComplaint(complaintId, data) {
    try {
      console.log('📤 [DEFINE SCOPE API] Sending request:', {
        complaintId,
        data,
        endpoint: `/management/${complaintId}/scope`,
      });
      
      const response = await axiosInstance.post(
        `/management/${complaintId}/scope`,
        data
      );

      console.log('📥 [DEFINE SCOPE API] Success response:', response.data || response);
      return {
        success: true,
        data: response.data || response,
        message: response.data?.message || response.message,
      };
    } catch (error) {
      console.error('❌ [DEFINE SCOPE API] Error caught:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
      });
      console.error('❌ [DEFINE SCOPE API] Error response data:', error.response?.data);
      console.error('❌ [DEFINE SCOPE API] Error response status:', error.response?.status);
      console.error('❌ [DEFINE SCOPE API] Full error object:', error);
      
      // Handle different error scenarios
      let errorMessage = 'Failed to define scope';
      let errorType = 'UNKNOWN_ERROR';
      let httpStatus = 500;

      if (error.response) {
        // Server responded with error status
        httpStatus = error.response.status;
        errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      error.response.statusText ||
                      'Server error while defining scope';
        errorType = error.response.data?.type || 'SERVER_ERROR';
        console.error('📋 [DEFINE SCOPE API] Server error response:', {
          status: httpStatus,
          message: errorMessage,
          type: errorType,
          data: error.response.data,
        });
      } else if (error.request) {
        // Request made but no response
        errorMessage = 'No response from server. Please check your connection.';
        errorType = 'NO_RESPONSE';
        console.error('📋 [DEFINE SCOPE API] No server response:', error.request);
      } else {
        // Error during request setup
        errorMessage = error.message || 'Failed to send request';
        errorType = 'REQUEST_SETUP_ERROR';
      }

      const formattedError = handleApiError(error);
      
      return {
        success: false,
        error: errorMessage,
        type: errorType,
        status: httpStatus,
        validationErrors: formattedError.validationErrors,
        serverDetails: error.response?.data?.stack || error.response?.data?.details,
        serverResponse: error.response?.data,
      };
    }
  },

  // Quality check
  async performQualityCheck(complaintId, data) {
    try {
      const response = await axiosInstance.post(
        `/management/${complaintId}/quality-check`,
        data
      );

      return {
        success: true,
        data: response.data || response,
        message: response.message,
      };
    } catch (error) {
      console.error('Quality check error:', error);
      const formattedError = handleApiError(error);
      return {
        success: false,
        error: formattedError.message,
        type: formattedError.type,
        status: error.status || 500,
        validationErrors: formattedError.validationErrors,
      };
    }
  },

  // Schedule inspection
  async scheduleInspection(complaintId, data) {
    try {
      const response = await axiosInstance.post(
        `/management/${complaintId}/schedule-inspection`,
        data
      );

      return {
        success: true,
        data: response.data || response,
        message: response.message,
      };
    } catch (error) {
      console.error('Schedule inspection error:', error);
      const formattedError = handleApiError(error);
      return {
        success: false,
        error: formattedError.message,
        type: formattedError.type,
        status: error.status || 500,
        validationErrors: formattedError.validationErrors,
      };
    }
  },

  // Request resident approval (Officer initiates)
  async requestResidentApproval(complaintId, data) {
    try {
      const response = await axiosInstance.post(
        `/management/${complaintId}/request-approval`,
        data
      );

      return {
        success: true,
        data: response.data || response,
        message: response.message,
      };
    } catch (error) {
      console.error('Request resident approval error:', error);
      const formattedError = handleApiError(error);
      return {
        success: false,
        error: formattedError.message,
        type: formattedError.type,
        status: error.status || 500,
        validationErrors: formattedError.validationErrors,
      };
    }
  },

  // Record resident approval (Resident responds)
  async recordResidentApproval(complaintId, data) {
    try {
      const response = await axiosInstance.put(
        `/management/${complaintId}/resident-approval`,
        data
      );

      return {
        success: true,
        data: response.data || response,
        message: response.message,
      };
    } catch (error) {
      console.error('Record resident approval error:', error);
      const formattedError = handleApiError(error);
      return {
        success: false,
        error: formattedError.message,
        type: formattedError.type,
        status: error.status || 500,
        validationErrors: formattedError.validationErrors,
      };
    }
  },

  // Request rework
  async requestRework(complaintId, data) {
    try {
      const response = await axiosInstance.post(
        `/management/${complaintId}/rework`,
        data
      );

      return {
        success: true,
        data: response.data || response,
        message: response.message,
      };
    } catch (error) {
      console.error('Request rework error:', error);
      const formattedError = handleApiError(error);
      return {
        success: false,
        error: formattedError.message,
        type: formattedError.type,
        status: error.status || 500,
        validationErrors: formattedError.validationErrors,
      };
    }
  },

  // Escalate complaint
  async escalateComplaint(complaintId, data) {
    try {
      const response = await axiosInstance.post(
        `/management/${complaintId}/escalate`,
        data
      );

      return {
        success: true,
        data: response.data || response,
        message: response.message,
      };
    } catch (error) {
      console.error('Escalate complaint error:', error);
      const formattedError = handleApiError(error);
      return {
        success: false,
        error: formattedError.message,
        type: formattedError.type,
        status: error.status || 500,
        validationErrors: formattedError.validationErrors,
      };
    }
  },

  // Create task for a complaint
  async createTask(complaintId, data) {
    try {
      const response = await axiosInstance.post(
        `/management/${complaintId}/tasks`,
        data
      );

      return {
        success: true,
        data: response.data || response,
        message: response.message,
      };
    } catch (error) {
      console.error('Create task error:', error);
      const formattedError = handleApiError(error);
      return {
        success: false,
        error: formattedError.message,
        type: formattedError.type,
        status: error.status || 500,
        validationErrors: formattedError.validationErrors,
      };
    }
  },

  // Assign a technician to a task
  async assignTask(complaintId, taskId, data) {
    try {
      const response = await axiosInstance.post(
        `/management/${complaintId}/tasks/${taskId}/assign`,
        data
      );

      return {
        success: true,
        data: response.data || response,
        message: response.message,
      };
    } catch (error) {
      console.error('Assign task error:', error);
      const formattedError = handleApiError(error);
      return {
        success: false,
        error: formattedError.message,
        type: formattedError.type,
        status: error.status || 500,
        validationErrors: formattedError.validationErrors,
      };
    }
  },

  // Unassign a technician from a task
  async unassignTask(complaintId, taskId) {
    try {
      const response = await axiosInstance.post(
        `/management/${complaintId}/tasks/${taskId}/unassign`
      );

      return {
        success: true,
        data: response.data || response,
        message: response.message,
      };
    } catch (error) {
      console.error('Unassign task error:', error);
      const formattedError = handleApiError(error);
      return { success: false, error: formattedError.message, type: formattedError.type };
    }
  },


  // Close complaint
  async closeComplaint(complaintId, data) {
    try {
      const response = await axiosInstance.put(
        `/management/${complaintId}/close`,
        data
      );

      return {
        success: true,
        data: response.data || response,
        message: response.message,
      };
    } catch (error) {
      console.error('Close complaint error:', error);
      const formattedError = handleApiError(error);
      return {
        success: false,
        error: formattedError.message,
        type: formattedError.type,
        status: error.status || 500,
        validationErrors: formattedError.validationErrors,
      };
    }
  },

  // Get analytics
  async getAnalytics(timeRange = 'thismonth') {
    try {
      const response = await axiosInstance.get(
        `/management/analytics?timeRange=${timeRange}`
      );

      return {
        success: true,
        data: response.data || response,
      };
    } catch (error) {
      console.error('Get analytics error:', error);
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

export default managementService;
