// components/TaskResolution/TaskCard.jsx
import React from 'react';
import { MapPin, Calendar, Clock, AlertCircle, User, ChevronRight, CheckCircle } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatDate, getTimeAgo } from '../../utils/taskUtils';
import { MAKERERE_COLORS } from '../../constants/taskConstants';

const getUrgencyColor = (urgency) => {
  switch(urgency) {
    case 'critical': return 'border-l-4 border-l-[#CE1126]';
    case 'high': return 'border-l-4 border-l-orange-500';
    case 'medium': return 'border-l-4 border-l-yellow-500';
    default: return 'border-l-4 border-l-green-500';
  }
};

const getUrgencyBadge = (urgency) => {
  switch(urgency) {
    case 'critical': return 'bg-[#FFEBEE] text-[#CE1126]';
    case 'high': return 'bg-orange-100 text-orange-700';
    case 'medium': return 'bg-yellow-100 text-yellow-700';
    default: return 'bg-green-100 text-green-700';
  }
};

const TaskCard = ({ task, onResolve }) => {
  const isOverdue = new Date(task.deadline) < new Date() && task.status !== 'resolved';
  
  return (
    <div className={`bg-white rounded-xl border border-[#D4C4A8] overflow-hidden hover:shadow-lg transition-all duration-200 ${getUrgencyColor(task.urgency)}`}>
      <div className="p-5">
        {/* Header */}
        <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium text-[#5D4E37] bg-[#FAF8F2] px-2 py-1 rounded">
              {task.trackingId}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full capitalize ${getUrgencyBadge(task.urgency)}`}>
              {task.urgency}
            </span>
          </div>
          <StatusBadge status={task.status} />
        </div>
        
        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">{task.title}</h3>
        
        {/* Description */}
        <p className="text-gray-500 text-sm line-clamp-2 mb-3">{task.description}</p>
        
        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin size={14} className="text-[#5D4E37]" />
            <span className="text-xs">{task.location}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <User size={14} className="text-[#5D4E37]" />
            <span className="text-xs">By: {task.assignedBy.name}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar size={14} className="text-[#5D4E37]" />
            <span className="text-xs">Assigned: {formatDate(task.assignedAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={14} className={isOverdue ? 'text-[#CE1126]' : 'text-[#5D4E37]'} />
            <span className={`text-xs ${isOverdue ? 'text-[#CE1126] font-medium' : 'text-gray-600'}`}>
              Due: {formatDate(task.deadline)}
              {isOverdue && ' (Overdue)'}
            </span>
          </div>
        </div>
        
        {/* Work Report Indicator */}
        {task.workReports && task.workReports.length > 0 && (
          <div className="mb-4 p-3 bg-[#FAF8F2] rounded-lg border border-[#D4C4A8]">
            <p className="text-xs font-medium text-[#006837] mb-1">Last Update:</p>
            <p className="text-xs text-gray-600 line-clamp-2">{task.workReports[task.workReports.length - 1]?.actionsTaken}</p>
            <p className="text-xs text-gray-400 mt-1">{getTimeAgo(task.workReports[task.workReports.length - 1]?.reportedAt)}</p>
          </div>
        )}
        
        {/* Action Button */}
        {task.status !== 'resolved' && (
          <button
            onClick={() => onResolve(task)}
            className="w-full mt-2 py-2.5 bg-[#006837] text-white rounded-lg font-medium hover:bg-[#005630] transition-colors flex items-center justify-center gap-2"
          >
            {task.status === 'in-progress' ? 'Update Work Report' : 'Start Resolution'}
            <ChevronRight size={16} />
          </button>
        )}
        
        {task.status === 'resolved' && (
          <div className="w-full mt-2 py-2.5 bg-[#E8F5E9] text-[#006837] rounded-lg font-medium text-center flex items-center justify-center gap-2">
            <CheckCircle size={16} />
            Resolved on {formatDate(task.resolvedAt)}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;