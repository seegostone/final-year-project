import axiosInstance from './axios';
import { handleApiError } from './api';

const managementService = {
  // ── Queue ──────────────────────────────────────────────────────────────────

  async getQueue(filters: {
    status?: string;
    priority?: string;
    category?: string;
    timeRange?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) {
    try {
      const params = new URLSearchParams();
      params.append('status', filters.status || 'all');
      params.append('priority', filters.priority || 'all');
      if (filters.category) params.append('category', filters.category);
      if (filters.timeRange) params.append('timeRange', filters.timeRange);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.search) params.append('search', filters.search);
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));

      const response = await axiosInstance.get(`/management/queue?${params.toString()}`);
      return { success: true, data: response.data || response, count: response.count, pagination: response.pagination };
    } catch (error) {
      const e = handleApiError(error);
      return { success: false, error: e.message, type: e.type, status: (error as any).status || 500 };
    }
  },

  // ── Dashboard Stats ────────────────────────────────────────────────────────

  async getDashboardStats(timeRange = 'all') {
    try {
      const response = await axiosInstance.get(`/management/dashboard?timeRange=${timeRange}`);
      return { success: true, data: response.data || response };
    } catch (error) {
      const e = handleApiError(error);
      return { success: false, error: e.message, type: e.type };
    }
  },

  // ── Technicians ────────────────────────────────────────────────────────────

  async getTechnicians() {
    try {
      const response = await axiosInstance.get('/management/technicians');
      return { success: true, data: response.data || response, count: response.count };
    } catch (error) {
      const e = handleApiError(error);
      return { success: false, error: e.message, type: e.type };
    }
  },

  // ── Validate ───────────────────────────────────────────────────────────────

  async validateComplaint(complaintId: string, data: Record<string, unknown>) {
    try {
      const response = await axiosInstance.post(`/management/${complaintId}/validate`, data);
      return { success: true, data: response.data || response, message: response.message };
    } catch (error) {
      const e = handleApiError(error);
      return { success: false, error: e.message, type: e.type, validationErrors: e.validationErrors };
    }
  },

  // ── Triage ─────────────────────────────────────────────────────────────────

  async triageComplaint(complaintId: string, data: Record<string, unknown>) {
    try {
      const response = await axiosInstance.post(`/management/${complaintId}/triage`, data);
      return { success: true, data: response.data || response, message: response.message };
    } catch (error) {
      const e = handleApiError(error);
      return { success: false, error: e.message, type: e.type, validationErrors: e.validationErrors };
    }
  },

  // ── Define Scope ───────────────────────────────────────────────────────────

  async defineScopeComplaint(complaintId: string, data: Record<string, unknown>) {
    try {
      const response = await axiosInstance.post(`/management/${complaintId}/scope`, data);
      return { success: true, data: response.data || response, message: response.message };
    } catch (error) {
      const e = handleApiError(error);
      return { success: false, error: e.message, type: e.type, validationErrors: e.validationErrors };
    }
  },

  // ── Assign Complaint ───────────────────────────────────────────────────────

  async assignComplaint(complaintId: string, data: Record<string, unknown>) {
    try {
      const response = await axiosInstance.post(`/management/${complaintId}/assign`, data);
      return { success: true, data: response.data || response, message: response.message };
    } catch (error) {
      const e = handleApiError(error);
      return { success: false, error: e.message, type: e.type, validationErrors: e.validationErrors };
    }
  },

  // ── Create Task ────────────────────────────────────────────────────────────

  async createTask(complaintId: string, data: Record<string, unknown>) {
    try {
      const response = await axiosInstance.post(`/management/${complaintId}/tasks`, data);
      return { success: true, data: response.data || response, message: response.message };
    } catch (error) {
      const e = handleApiError(error);
      return { success: false, error: e.message, type: e.type, validationErrors: e.validationErrors };
    }
  },

  // ── Assign Task ────────────────────────────────────────────────────────────

  async assignTask(complaintId: string, taskId: string, data: Record<string, unknown>) {
    try {
      const response = await axiosInstance.post(`/management/${complaintId}/tasks/${taskId}/assign`, data);
      return { success: true, data: response.data || response, message: response.message };
    } catch (error) {
      const e = handleApiError(error);
      return { success: false, error: e.message, type: e.type, validationErrors: e.validationErrors };
    }
  },

  // ── Update Task Status (NEW) ───────────────────────────────────────────────

  async updateTaskStatus(complaintId: string, taskId: string, data: { status: string; notes?: string }) {
    try {
      const response = await axiosInstance.patch(`/management/${complaintId}/tasks/${taskId}/status`, data);
      return { success: true, data: response.data || response, message: response.message };
    } catch (error) {
      const e = handleApiError(error);
      return { success: false, error: e.message, type: e.type };
    }
  },

  // ── Quality Check ──────────────────────────────────────────────────────────

  async performQualityCheck(complaintId: string, data: Record<string, unknown>) {
    try {
      const response = await axiosInstance.post(`/management/${complaintId}/quality-check`, data);
      return { success: true, data: response.data || response, message: response.message };
    } catch (error) {
      const e = handleApiError(error);
      return { success: false, error: e.message, type: e.type, validationErrors: e.validationErrors };
    }
  },

  // ── Schedule Inspection ────────────────────────────────────────────────────

  async scheduleInspection(complaintId: string, data: Record<string, unknown>) {
    try {
      const response = await axiosInstance.post(`/management/${complaintId}/schedule-inspection`, data);
      return { success: true, data: response.data || response, message: response.message };
    } catch (error) {
      const e = handleApiError(error);
      return { success: false, error: e.message, type: e.type, validationErrors: e.validationErrors };
    }
  },

  // ── Resident Approval ──────────────────────────────────────────────────────

  async recordResidentApproval(complaintId: string, data: Record<string, unknown>) {
    try {
      const response = await axiosInstance.put(`/management/${complaintId}/resident-approval`, data);
      return { success: true, data: response.data || response, message: response.message };
    } catch (error) {
      const e = handleApiError(error);
      return { success: false, error: e.message, type: e.type, validationErrors: e.validationErrors };
    }
  },

  // ── Request Rework ─────────────────────────────────────────────────────────

  async requestRework(complaintId: string, data: Record<string, unknown>) {
    try {
      const response = await axiosInstance.post(`/management/${complaintId}/rework`, data);
      return { success: true, data: response.data || response, message: response.message };
    } catch (error) {
      const e = handleApiError(error);
      return { success: false, error: e.message, type: e.type, validationErrors: e.validationErrors };
    }
  },

  // ── Escalate ───────────────────────────────────────────────────────────────

  async escalateComplaint(complaintId: string, data: Record<string, unknown>) {
    try {
      const response = await axiosInstance.post(`/management/${complaintId}/escalate`, data);
      return { success: true, data: response.data || response, message: response.message };
    } catch (error) {
      const e = handleApiError(error);
      return { success: false, error: e.message, type: e.type, validationErrors: e.validationErrors };
    }
  },

  // ── Close ──────────────────────────────────────────────────────────────────

  async closeComplaint(complaintId: string, data: Record<string, unknown>) {
    try {
      const response = await axiosInstance.put(`/management/${complaintId}/close`, data);
      return { success: true, data: response.data || response, message: response.message };
    } catch (error) {
      const e = handleApiError(error);
      return { success: false, error: e.message, type: e.type, validationErrors: e.validationErrors };
    }
  },

  // ── Analytics ──────────────────────────────────────────────────────────────

  async getAnalytics(timeRange = 'thismonth') {
    try {
      const response = await axiosInstance.get(`/management/analytics?timeRange=${timeRange}`);
      return { success: true, data: response.data || response };
    } catch (error) {
      const e = handleApiError(error);
      return { success: false, error: e.message, type: e.type };
    }
  },
};

export default managementService;
