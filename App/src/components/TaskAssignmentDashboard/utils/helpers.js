// utils/helpers.js

export const getTimeAgo = (date) => {
  const diff = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60));
  if (diff < 60) return `${diff} mins ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)} hours ago`;
  return `${Math.floor(diff / 1440)} days ago`;
};

export const formatTrackingId = (id) => {
  return `CMS-${id.padStart(3, '0')}`;
};

export const getUrgencyColorClass = (urgency) => {
  const classes = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };
  return classes[urgency] || 'bg-gray-100 text-gray-800';
};