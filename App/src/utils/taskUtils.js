// utils/taskUtils.js
import { MAKERERE_COLORS, TASK_STATUS } from '../constants/taskConstants';

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-UG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getTimeAgo = (date) => {
  const diff = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60));
  if (diff < 60) return `${diff} mins ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)} hours ago`;
  return `${Math.floor(diff / 1440)} days ago`;
};

export const getStatusConfig = (status) => {
  return TASK_STATUS[status] || TASK_STATUS.pending;
};

export const calculateTotalHours = (workReports) => {
  return workReports?.reduce((total, report) => total + (report.hoursSpent || 0), 0) || 0;
};

export const generateWorkReportId = () => {
  return `WR-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`.toUpperCase();
};