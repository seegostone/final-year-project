// components/TaskResolution/ResolutionModal.jsx
import React from 'react';
import { X, Wrench } from 'lucide-react';
import WorkReportForm from './WorkReportForm';
import StatusBadge from './StatusBadge';
import { formatDate } from '../../utils/taskUtils';

const ResolutionModal = ({ task, onSubmit, onClose, isSubmitting }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className="text-xs font-mono text-[#5D4E37] bg-[#FAF8F2] px-2 py-1 rounded">
                  {task.trackingId}
                </span>
                <StatusBadge status={task.status} size="sm" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">{task.title}</h2>
              <p className="text-gray-500 text-sm mt-1">{task.location}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Task Info */}
          <div className="bg-[#FAF8F2] rounded-xl p-4 mb-6 border border-[#D4C4A8]">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Wrench size={18} className="text-[#006837]" />
              Task Information
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Assigned By:</span>
                <p className="font-medium text-gray-800">{task.assignedBy.name}</p>
              </div>
              <div>
                <span className="text-gray-500">Assigned On:</span>
                <p className="font-medium text-gray-800">{formatDate(task.assignedAt)}</p>
              </div>
              <div>
                <span className="text-gray-500">Deadline:</span>
                <p className="font-medium text-gray-800">{formatDate(task.deadline)}</p>
              </div>
              <div>
                <span className="text-gray-500">Urgency:</span>
                <p className={`font-medium capitalize ${
                  task.urgency === 'critical' ? 'text-[#CE1126]' : 'text-gray-800'
                }`}>{task.urgency}</p>
              </div>
            </div>
          </div>

          {/* Work Report Form */}
          <h3 className="font-semibold text-gray-800 mb-4">Work Report</h3>
          <WorkReportForm
            initialData={task.workReports?.[task.workReports.length - 1]}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
};

export default ResolutionModal;