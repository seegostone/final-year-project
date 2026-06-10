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

      const response = await axiosInstance.get(
        `/management/queue?${queryString.toString()}`
      );

      return {
        success: true,
        data: response.data || response,
        count: response.count,
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
  async getTechnicians() {
    try {
      const response = await axiosInstance.get('/management/technicians');

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

  // Define scope
  async defineScopeComplaint(complaintId, data) {
    try {
      const response = await axiosInstance.post(
        `/management/${complaintId}/scope`,
        data
      );

      return {
        success: true,
        data: response.data || response,
        message: response.message,
      };
    } catch (error) {
      console.error('Define scope error:', error);
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

  // Assign complaint to technician
  async assignComplaint(complaintId, data) {
    try {
      const response = await axiosInstance.post(
        `/management/${complaintId}/assign`,
        data
      );

      return {
        success: true,
        data: response.data || response,
        message: response.message,
      };
    } catch (error) {
      console.error('Assign complaint error:', error);
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

  // Record resident approval
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
