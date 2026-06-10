import { useState } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import managementService from '../../../services/managementApi';

export default function CloseComplaintModal({ complaint, onSuccess, onClose }) {
  const [closureStatus, setClosureStatus] = useState('resolved');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const closureStatuses = [
    { value: 'resolved', label: '✓ Resolved - Issue fixed', color: 'bg-green-50 border-green-200' },
    { value: 'not_resolvable', label: '○ Not Resolvable - Beyond scope', color: 'bg-yellow-50 border-yellow-200' },
    { value: 'closed_by_resident', label: '○ Closed by Resident - Withdrew complaint', color: 'bg-blue-50 border-blue-200' },
  ];

  const handleSubmit = async () => {
    try {
      setError(null);
      setLoading(true);

      if (!resolutionNotes.trim()) {
        setError('Please provide resolution notes');
        return;
      }

      const result = await managementService.closeComplaint(complaint._id, {
        closureReason: closureStatus,
        resolutionNotes,
        feedback,
      });

      if (!result.success) {
        setError(result.error || 'Failed to close complaint');
        return;
      }

      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to close complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="w-full sm:max-w-md bg-white rounded-t-lg sm:rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-white">
          <h3 className="text-lg font-bold text-gray-900">Close Complaint</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">
              This will permanently close the complaint and record the resolution
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Closure Status
            </label>
            <div className="space-y-2">
              {closureStatuses.map((status) => (
                <label
                  key={status.value}
                  className={`flex items-start gap-3 cursor-pointer p-3 border rounded-lg transition-colors ${status.color}`}
                >
                  <input
                    type="radio"
                    name="closure"
                    value={status.value}
                    checked={closureStatus === status.value}
                    onChange={(e) => setClosureStatus(e.target.value)}
                    className="h-4 w-4 mt-0.5"
                  />
                  <span className="text-sm font-medium text-gray-700">{status.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resolution Notes <span className="text-red-500">*</span>
            </label>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Summarize how the complaint was resolved..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Feedback
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Any additional feedback or lessons learned..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
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
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Closing...' : 'Close Complaint'}
          </button>
        </div>
      </div>
    </div>
  );
}
