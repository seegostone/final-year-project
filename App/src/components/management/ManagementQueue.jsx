import { AlertCircle, Clock, MapPin, ChevronRight, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

export default function ManagementQueue({ complaints, loading, onSelectComplaint, onAction }) {
  const [renderTime] = useState(() => Date.now());

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'received':
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'analyzed':
        return 'bg-blue-100 text-blue-800';
      case 'triaged':
        return 'bg-cyan-100 text-cyan-800';
      case 'scope_defined':
        return 'bg-indigo-100 text-indigo-800';
      case 'assigned':
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'work_completed':
        return 'bg-amber-100 text-amber-800';
      case 'ready_for_validation':
        return 'bg-lime-100 text-lime-800';
      case 'validated':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-emerald-100 text-emerald-800';
      case 'rework_required':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysInQueue = (createdAt) => {
    const days = Math.floor((renderTime - new Date(createdAt)) / (1000 * 60 * 60 * 24));
    return days;
  };

  const isSLABreach = (slaDeadline) => {
    return new Date(slaDeadline) < new Date(renderTime);
  };

  const getNextActions = (status) => {
    const actions = {
      // Initial statuses
      pending: ['validate'],
      received: ['validate'],
      
      // After validation
      analyzed: ['triage'],
      
      // After triage
      triaged: ['scope'],
      
      // After scope definition
      scope_defined: ['assign'],
      
      // After assignment
      assigned: ['quality-check'],
      in_progress: ['schedule-inspection'],
      
      // After work completion
      work_completed: ['quality-check'],
      
      // Ready for validation
      ready_for_validation: ['quality-check'],
      
      // After validation
      validated: ['close'],
      
      // Special cases
      rework_required: ['assign'],
    };
    return actions[status] || [];
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading complaints...</p>
      </div>
    );
  }

  if (complaints.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No complaints found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {complaints.map((complaint) => {
        const daysInQueue = getDaysInQueue(complaint.createdAt);
        const slaBreach = isSLABreach(complaint.slaDeadline);
        const nextActions = getNextActions(complaint.status);

        return (
          <div
            key={complaint._id}
            className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 hover:shadow-md transition-shadow overflow-hidden"
          >
            {/* Top Row: ID, Priority, Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <button
                  onClick={() => onSelectComplaint(complaint)}
                  className="font-semibold text-blue-600 hover:text-blue-800 truncate text-sm sm:text-base"
                >
                  {complaint.complaintId}
                </button>

                <span className={`text-xs font-semibold px-2 py-1 rounded-full border whitespace-nowrap ${getPriorityColor(complaint.priority)}`}>
                  {complaint.priority}
                </span>
              </div>

              <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${getStatusColor(complaint.status)}`}>
                {complaint.status?.replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>

            {/* Middle Row: Title & Location */}
            <div className="mb-3">
              <p className="text-gray-900 font-medium text-sm sm:text-base line-clamp-2 mb-1">
                {complaint.title}
              </p>
              <div className="flex items-center gap-2 text-gray-600 text-xs sm:text-sm">
                <MapPin className="h-3.5 w-3.5" />
                <span className="truncate">{complaint.location || 'N/A'}</span>
              </div>
            </div>

            {/* Bottom Row: SLA, Days in Queue, Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{daysInQueue}d in queue</span>
                </div>

                {slaBreach && (
                  <div className="flex items-center gap-1 text-red-600 font-semibold">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    SLA Breach
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              {nextActions.length > 0 && (
                <div className="flex gap-2">
                  {nextActions.slice(0, 2).map((action) => (
                    <button
                      key={action}
                      onClick={() => onAction(action, complaint)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium text-white transition-colors ${
                        action === 'validate'
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : action === 'triage'
                            ? 'bg-cyan-600 hover:bg-cyan-700'
                            : action === 'scope'
                              ? 'bg-indigo-600 hover:bg-indigo-700'
                              : action === 'assign'
                                ? 'bg-purple-600 hover:bg-purple-700'
                                : action === 'quality-check'
                                  ? 'bg-green-600 hover:bg-green-700'
                                  : action === 'schedule-inspection'
                                    ? 'bg-pink-600 hover:bg-pink-700'
                                    : action === 'close'
                                      ? 'bg-red-600 hover:bg-red-700'
                                      : 'bg-amber-600 hover:bg-amber-700'
                      }`}
                    >
                      {action === 'validate'
                        ? 'Validate'
                        : action === 'triage'
                          ? 'Triage'
                          : action === 'scope'
                            ? 'Scope'
                            : action === 'assign'
                              ? 'Assign'
                              : action === 'quality-check'
                                ? 'Quality Check'
                                : action === 'schedule-inspection'
                                  ? 'Schedule'
                                  : action === 'close'
                                    ? 'Close'
                                    : 'Action'}
                    </button>
                  ))}

                  <button
                    onClick={() => onSelectComplaint(complaint)}
                    className="p-1.5 hover:bg-gray-100 rounded-md"
                    title="View full details"
                  >
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
