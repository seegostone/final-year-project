// components/TaskResolution/StatusBadge.jsx
import React from 'react';
import { getStatusConfig } from '../../utils/taskUtils';

const StatusBadge = ({ status, size = 'sm' }) => {
  const config = getStatusConfig(status);
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };
  
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses[size]} ${config.badgeClass}`}>
      <Icon size={size === 'sm' ? 12 : 16} />
      {config.label}
    </span>
  );
};

export default StatusBadge;