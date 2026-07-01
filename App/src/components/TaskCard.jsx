import { Camera, MapPin, Clock, User } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { formatDistanceToNow } from 'date-fns';

const statusBorderColors = {
  'In Progress': 'border-l-[4px] border-l-purple-600',
  'Assigned': 'border-l-[4px] border-l-blue-600',
  'Resolved': 'border-l-[4px] border-l-emerald-600',
  'Pending': 'border-l-[4px] border-l-amber-600',
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
    ? 'border-l-[4px] border-l-red-600'
    : statusBorderColors[displayStatus] || 'border-l-[4px] border-l-slate-300';

  const complaintSegment = task.complaintLabel || task.complaintId || task.id;
  const locationLabel = task.location || task.complaintLocation || 'Unknown location';
  const assignedLabel = task.assignedTo || task.assigneeName || (task.assigneeId ? 'Assigned' : 'Unassigned');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.02, boxShadow: '0 18px 45px rgba(15, 23, 42, 0.08)' }}
      onClick={() => navigate(`/task/${complaintSegment}/${task.taskId}`)}
      className={`group cursor-pointer rounded-[28px] border border-slate-200 bg-white p-5 transition-all duration-200 ${borderClass}`}
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-slate-900" style={{ fontFamily: 'Merriweather, serif' }}>
            {task.title}
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            {task.complaintLabel && (
              <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">{task.complaintLabel}</span>
            )}
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-500">{task.taskId}</span>
          </div>
        </div>
        <PriorityBadge priority={task.priority} />
      </div>

      <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
        <div className="flex items-center gap-2 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
          <MapPin className="h-4 w-4 text-slate-500" />
          <span>{locationLabel}</span>
        </div>
        <div className="flex items-center gap-2 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
          <User className="h-4 w-4 text-slate-500" />
          <span>{assignedLabel}</span>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <StatusBadge status={displayStatus} />
        <div className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium ${isOverdue ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
          <Clock className="h-3.5 w-3.5" />
          {timeLeftLabel}
        </div>
      </div>

      {displayStatus === 'Resolved' && task.workReport && (
        <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Camera className="h-4 w-4 text-slate-700" />
            <span>Work Report Summary</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {task.workReport.actionsTaken || 'No summary provided.'}
          </p>
          {task.workReport.images?.length > 0 && (
            <div className="mt-4 flex items-center gap-2 overflow-x-auto py-1">
              {task.workReport.images.slice(0, 3).map((src, index) => (
                <img
                  key={index}
                  src={src}
                  alt={`Report image ${index + 1}`}
                  className="h-14 w-14 rounded-2xl object-cover border border-slate-200"
                />
              ))}
              {task.workReport.images.length > 3 && (
                <span className="text-xs text-slate-500">+{task.workReport.images.length - 3} more</span>
              )}
            </div>
          )}
        </div>
      )}

      {task.submitterName && (
        <div className="mt-5 text-sm text-slate-500">
          <span className="font-medium text-slate-800">Submitted by:</span> {task.submitterName}
        </div>
      )}
    </motion.div>
  );
}
 