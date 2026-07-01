import { Camera, MapPin, Clock, User } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { formatDistanceToNow } from 'date-fns';

const statusBorderColors = {
  'In Progress': 'border-l-[3px] border-l-purple-600',
  'Assigned': 'border-l-[3px] border-l-blue-600',
  'Resolved': 'border-l-[3px] border-l-emerald-600',
  'Pending': 'border-l-[3px] border-l-amber-600',
};

export function TaskCard({ task, delay = 0 }) {
  const navigate = useNavigate();
  const dueDate = new Date(task.dueDate);
  const displayStatus = task.displayStatus || task.status;
  const isOverdue = displayStatus !== 'Resolved' && dueDate < new Date();
  const timeLeftLabel = displayStatus === 'Resolved'
    ? 'Resolved'
    : formatDistanceToNow(dueDate, { addSuffix: true });

  const borderClass = isOverdue
    ? 'border-l-[3px] border-l-red-600'
    : statusBorderColors[displayStatus] || 'border-l-[3px] border-l-gray-300';

  const complaintSegment = task.complaintLabel || task.complaintId || task.id;
  const locationLabel = task.location || task.complaintLocation || 'Unknown location';
  const assignedLabel = task.assignedTo || task.assigneeName || (task.assigneeId ? 'Assigned' : 'Unassigned');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.02, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
      onClick={() => navigate(`/task/${complaintSegment}/${task.taskId}`)}
      className={`bg-white border border-[#e2e8f0] ${borderClass} p-5 cursor-pointer transition-all`}
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-[#1e2937] mb-1" style={{ fontFamily: 'Merriweather, serif', fontSize: '16px' }}>
            {task.title}
          </h3>
        </div>
        <PriorityBadge priority={task.priority} />
      </div>

      <div className="space-y-3 text-[#475569] mb-3" style={{ fontSize: '14px' }}>
        <div className="flex flex-wrap items-center gap-2">
          <MapPin className="w-4 h-4" />
          <span>{locationLabel}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <User className="w-4 h-4" />
          <span>{assignedLabel}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <StatusBadge status={displayStatus} />
        <div className={`flex items-center gap-1.5 ${isOverdue ? 'text-red-600' : 'text-[#475569]'}`} style={{ fontSize: '12px' }}>
          <Clock className="w-3.5 h-3.5" />
          <span>{timeLeftLabel}</span>
        </div>
      </div>

      {displayStatus === 'Resolved' && task.workReport && (
        <div className="mt-4 bg-[#f8fafc] border border-[#e2e8f0] p-3 rounded">
          <div className="flex items-center gap-2 text-[#1e2937] font-semibold mb-2" style={{ fontSize: '13px' }}>
            <Camera className="w-4 h-4" />
            <span>Work Report</span>
          </div>
          <p className="text-[#475569] text-sm mb-2" style={{ fontSize: '13px' }}>
            {task.workReport.actionsTaken || 'No summary provided.'}
          </p>
          {task.workReport.images?.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {task.workReport.images.slice(0, 3).map((src, index) => (
                <img
                  key={index}
                  src={src}
                  alt={`Report image ${index + 1}`}
                  className="h-12 w-12 rounded object-cover border border-[#e2e8f0]"
                />
              ))}
              {task.workReport.images.length > 3 && (
                <span className="text-[#475569] text-xs">+{task.workReport.images.length - 3} more</span>
              )}
            </div>
          )}
        </div>
      )}

      {task.submitterName && (
        <div className="mt-3 text-sm text-slate-500">
          <span className="font-semibold text-slate-900">Submitted by:</span> {task.submitterName}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-[#e2e8f0]">
        <span className="font-mono text-[#94a3b8]" style={{ fontSize: '10px' }}>
          {task.complaintLabel || task.complaintId || task.id}
        </span>
      </div>
    </motion.div>
  );
}
 