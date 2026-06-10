import { useState } from 'react';
import { X, ChevronDown, FileText, MapPin, User, Phone, Clock } from 'lucide-react';

export default function ComplaintDetailModal({ complaint, onClose, onAction }) {
  const [expanded, setExpanded] = useState(false);

  const getStatusColor = (status) => {
    const colors = {
      received: 'bg-gray-100 text-gray-800',
      analyzed: 'bg-blue-100 text-blue-800',
      triaged: 'bg-cyan-100 text-cyan-800',
      scope_defined: 'bg-indigo-100 text-indigo-800',
      assigned: 'bg-purple-100 text-purple-800',
      in_progress: 'bg-purple-100 text-purple-800',
      work_completed: 'bg-amber-100 text-amber-800',
      ready_for_validation: 'bg-lime-100 text-lime-800',
      validated: 'bg-green-100 text-green-800',
      closed: 'bg-emerald-100 text-emerald-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="w-full sm:max-w-2xl bg-white rounded-t-lg sm:rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{complaint.complaintId}</h2>
            <p className="text-sm text-gray-600 mt-1">{complaint.title}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Status</p>
              <span className={`inline-block text-xs font-medium px-3 py-1 rounded-full ${getStatusColor(complaint.status)}`}>
                {complaint.status?.replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Priority</p>
              <span className="inline-block text-xs font-medium px-3 py-1 rounded-full bg-red-100 text-red-800 border border-red-200">
                {complaint.priority}
              </span>
            </div>
          </div>

          {/* Key Details - Progressive Disclosure */}
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Location</p>
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="h-4 w-4 text-gray-400" />
                {complaint.location}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Category</p>
              <span className="inline-block px-3 py-1 bg-gray-100 text-gray-800 rounded-lg text-sm">
                {complaint.category}
              </span>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Description</p>
              <p className="text-gray-700 text-sm leading-relaxed">{complaint.description}</p>
            </div>
          </div>

          {/* Expandable Details */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            {expanded ? 'Hide' : 'Show'} More Details
          </button>

          {expanded && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Submitted By</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{complaint.submittedBy?.name || 'N/A'}</span>
                    </div>
                    {complaint.submittedBy?.phone && (
                      <div className="flex items-center gap-2 ml-6">
                        <Phone className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-sm text-gray-600">{complaint.submittedBy.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Submitted On</p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700">
                      {new Date(complaint.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {complaint.assignment && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs font-semibold text-blue-700 uppercase mb-2">Assignment</p>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-gray-600">Technician:</span>{' '}
                      <span className="text-gray-900 font-medium">{complaint.assignment.technicianName}</span>
                    </p>
                    <p>
                      <span className="text-gray-600">Assigned:</span>{' '}
                      <span className="text-gray-900">
                        {new Date(complaint.assignment.assignedAt).toLocaleDateString()}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {complaint.scope && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs font-semibold text-green-700 uppercase mb-2">Scope</p>
                  <p className="text-sm text-gray-700">{complaint.scope}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - Action Buttons */}
        <div className="sticky bottom-0 border-t border-gray-200 bg-white p-4 sm:p-6 flex gap-3 flex-wrap">
          <button
            onClick={onClose}
            className="flex-1 sm:flex-initial px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
          >
            Close
          </button>

          {/* Context-aware action buttons */}
          {complaint.status === 'received' && (
            <button
              onClick={() => {
                onAction('validate', complaint);
                onClose();
              }}
              className="flex-1 sm:flex-initial px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Validate
            </button>
          )}

          {complaint.status === 'analyzed' && (
            <button
              onClick={() => {
                onAction('triage', complaint);
                onClose();
              }}
              className="flex-1 sm:flex-initial px-4 py-2 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700"
            >
              Triage
            </button>
          )}

          {complaint.status === 'triaged' && (
            <button
              onClick={() => {
                onAction('scope', complaint);
                onClose();
              }}
              className="flex-1 sm:flex-initial px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
            >
              Define Scope
            </button>
          )}

          {complaint.status === 'scope_defined' && (
            <button
              onClick={() => {
                onAction('assign', complaint);
                onClose();
              }}
              className="flex-1 sm:flex-initial px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
            >
              Assign Task
            </button>
          )}

          {['assigned', 'in_progress', 'work_completed', 'ready_for_validation'].includes(complaint.status) && (
            <button
              onClick={() => {
                onAction('quality-check', complaint);
                onClose();
              }}
              className="flex-1 sm:flex-initial px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700"
            >
              Quality Check
            </button>
          )}

          {complaint.status === 'validated' && (
            <button
              onClick={() => {
                onAction('close', complaint);
                onClose();
              }}
              className="flex-1 sm:flex-initial px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
