import axiosInstance from './axios';
import { handleApiError } from './api';

const complaintService = {
  async createComplaint(complaintData = {}) {
    try {
      const formData = new FormData();

      const fields = ['title', 'description', 'location', 'category', 'urgency'];
      fields.forEach((field) => {
        if (complaintData[field] !== undefined && complaintData[field] !== null) {
          formData.append(field, complaintData[field]);
        }
      });

      if (complaintData.image instanceof File) {
        formData.append('image', complaintData.image);
      } else if (complaintData.imageData) {
        formData.append('imageData', complaintData.imageData);
      }

      const response = await axiosInstance.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Create complaint error:', error);
      const formattedError = handleApiError(error);

      return {
        success: false,
        error: formattedError.message,
        type: formattedError.type,
        status: formattedError.status || 500,
        validationErrors: formattedError.errors || null,
      };
    }
  },

  async getMyComplaints({ page = 1, limit = 10, status = 'all', category = 'all', timeRange = 'all', startDate = '', endDate = '', search = '' } = {}) {
    try {
      const queryString = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        status,
        category,
        timeRange,
        search,
      });

      if (startDate) {
        queryString.append('startDate', startDate);
      }
      if (endDate) {
        queryString.append('endDate', endDate);
      }

      const response = await axiosInstance.get(
        `/complaints/my-complaints?${queryString.toString()}`
      );

      // Note: axios interceptor already returns response.data (the backend body)
      // So 'response' here is actually: { success: true, count: 10, pagination: {...}, data: [...] }
      return {
        success: response.success,
        data: response.data,
        pagination: response.pagination,
        count: response.count,
        message: response.message,
      };
    } catch (error) {
      console.error('Fetch my complaints error:', error);
      const formattedError = handleApiError(error);

      return {
        success: false,
        error: formattedError.message,
        type: formattedError.type,
        status: formattedError.status || 500,
      };
    }
  },

  async getComplaintStats(timeRange = 'all', startDate = '', endDate = '') {
    try {
      const queryString = new URLSearchParams({
        timeRange,
      });
      if (startDate) {
        queryString.append('startDate', startDate);
      }
      if (endDate) {
        queryString.append('endDate', endDate);
      }

      const response = await axiosInstance.get(
        `/complaints/stats?${queryString.toString()}`
      );

      // axios interceptor already returns response.data
      return {
        success: response.success,
        data: response.data,
        message: response.message,
      };
    } catch (error) {
      console.error('Fetch complaint stats error:', error);
      const formattedError = handleApiError(error);

      return {
        success: false,
        error: formattedError.message,
        type: formattedError.type,
        status: formattedError.status || 500,
      };
    }
  },

  async getComplaintById(id) {
    try {
      const response = await axiosInstance.get(`/complaints/${id}`);

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Fetch complaint by ID error:', error);
      const formattedError = handleApiError(error);

      return {
        success: false,
        error: formattedError.message,
        type: formattedError.type,
        status: formattedError.status || 500,
      };
    }
  },

  async deleteComplaint(id) {
    try {
      const response = await axiosInstance.delete(`/complaints/${id}`);

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Delete complaint error:', error);
      const formattedError = handleApiError(error);

      return {
        success: false,
        error: formattedError.message,
        type: formattedError.type,
        status: formattedError.status || 500,
      };
    }
  },
};

export default complaintService;
