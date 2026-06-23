import axiosInstance from './axios';

const notificationsApi = {
  async getNotifications({ unread = false, page = 1, limit = 20 } = {}) {
    const params = new URLSearchParams();
    if (unread) params.append('unread', 'true');
    params.append('page', String(page));
    params.append('limit', String(limit));

    const response = await axiosInstance.get(`/notifications?${params.toString()}`);
    return response;
  },

  async markNotificationRead(notificationId) {
    const response = await axiosInstance.patch(`/notifications/${notificationId}/read`);
    return response;
  },

  async markAllNotificationsRead() {
    const response = await axiosInstance.patch('/notifications/read-all');
    return response;
  },
};

export default notificationsApi;
