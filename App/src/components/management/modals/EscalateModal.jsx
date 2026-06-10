import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import managementService from '../../../services/managementApi';

export default function EscalateModal({ complaint, onSuccess, onClose }) {
  const [escalationLevel, setEscalationLevel] = useState('manager');
  const [reason, setReason] = useState('');
  const [urgency, setUrgency] = useState('HIGH');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const escalationLevels = [
    { value: 'manager', label: 'Department Manager' },
    { value: 'director', label: 'Director' },
    { value: 'external', label: 'External Contractor' },
  ];

  const reasons = [
    'Beyond technician expertise',
    'Specialized equipment needed',
    'Structural issues',
    'Safety hazard',
    'Delayed resolution',
    'Resident dissatisfaction',
    'Other',
  ];

  const handleSubmit = async () => {
    try {
      setError(null);
      setLoading(true);

      if (!reason.trim()) {
        setError('Please provide escalation reason');
        return;
      }

      const result = await managementService.escalateComplaint(complaint._id, {
        escalationLevel,
        escalationReason: reason,
        urgencyLevel: urgency,
      });

      if (!result.success) {
        setError(result.error || 'Failed to escalate complaint');
        return;
      }

      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to escalate complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="w-full sm:max-w-md bg-white rounded-t-lg sm:rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-white">
          <h3 className="text-lg font-bold text-gray-900">Escalate Complaint</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-gray-700">
              This complaint will be escalated to a higher authority for resolution
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Escalate To <span className="text-red-500">*</span>
            </label>
            <select
              value={escalationLevel}
              onChange={(e) => setEscalationLevel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {escalationLevels.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Escalation <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a reason...</option>
              {reasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Urgency Level
            </label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 border-t border-gray-200 bg-white p-4 sm:p-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Escalating...' : 'Escalate'}
          </button>
        </div>
      </div>
    </div>
  );
}
