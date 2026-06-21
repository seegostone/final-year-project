import axiosInstance from './axios';
import { handleApiError } from './api';

// Simple in-memory cache to debounce identical task requests for a short window
let _tasksRequestCache = { timestamp: 0, promise: null, key: '' };
const TASKS_DEBOUNCE_MS = parseInt(import.meta.env.VITE_TASKS_DEBOUNCE_MS || '700', 10);

const technicianService = {
  // Get all tasks for the logged-in technician (debounced)
  async getTechnicianTasks(filters = {}) {
    const key = JSON.stringify(filters || {});
    const now = Date.now();

    if (
      _tasksRequestCache.promise &&
      _tasksRequestCache.key === key &&
      now - _tasksRequestCache.timestamp < TASKS_DEBOUNCE_MS
    ) {
      return _tasksRequestCache.promise;
    }

    const promise = (async () => {
      try {
        const params = new URLSearchParams();
        if (filters.status) params.append('status', filters.status);

        const response = await axiosInstance.get(`/technician/tasks?${params.toString()}`);

        if (response.success) {
          // Convert backend status to frontend display status
          return response.data.map(task => {
            // Ensure taskCode is always present
            let taskCode = task.taskCode;
            if (!taskCode && task.taskNumber && task.complaintLabel) {
              taskCode = `${task.complaintLabel}-TASK-${String(task.taskNumber).padStart(3, '0')}`;
            }
            if (!taskCode) {
              taskCode = task.taskId || task.id;
            }

            return {
              ...task,
              taskCode,
              displayStatus: technicianService.mapStatusToDisplay(task.status),
            };
          });
        }
        throw new Error(response.message || 'Failed to fetch tasks');
      } catch (error) {
        console.error('Error fetching technician tasks:', error);
        throw handleApiError(error);
      }
    })();

    _tasksRequestCache = { timestamp: now, promise, key };
    return promise;
  },

  // Get task details
  async getTaskDetails(complaintId, taskId) {
    try {
      const response = await axiosInstance.get(
        `/technician/tasks/${complaintId}/${taskId}`
      );
      
      if (response.success) {
        return {
          ...response.data,
          displayStatus: this.mapStatusToDisplay(response.data.status),
          dueDate: response.data.dueDate || response.data.deadline,
          complaintLabel: response.data.complaintLabel || response.data.complaintId,
          taskCode: response.data.taskCode || response.data.id,
        };
      }
      throw new Error(response.message || 'Failed to fetch task details');
    } catch (error) {
      console.error('Error fetching task details:', error);
      throw handleApiError(error);
    }
  },

  // Update task status with work report
  async updateTaskStatus(complaintId, taskId, statusUpdate) {
    try {
      const response = await axiosInstance.patch(
        `/technician/tasks/${complaintId}/${taskId}/status`,
        statusUpdate
      );
      
      if (response.success) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to update task status');
    } catch (error) {
      console.error('Error updating task status:', error);
      throw handleApiError(error);
    }
  },

  // Helper: Map backend status to frontend display status
  mapStatusToDisplay(backendStatus) {
    const statusMap = {
      'open': 'Assigned',
      'in_progress': 'In Progress',
      'done': 'Resolved',
      'blocked': 'Pending',
    };
    return statusMap[backendStatus] || backendStatus;
  },

  // Helper: Map frontend status to backend status
  mapStatusToBackend(displayStatus) {
    const statusMap = {
      'Assigned': 'open',
      'In Progress': 'in_progress',
      'Resolved': 'done',
      'Pending': 'blocked',
    };
    return statusMap[displayStatus] || displayStatus;
  },
};

export default technicianService;
