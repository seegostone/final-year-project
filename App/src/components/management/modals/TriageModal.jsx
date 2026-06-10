import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import managementService from '../../../services/managementApi';

export default function TriageModal({ complaint, onSuccess, onClose }) {
  const [priority, setPriority] = useState('MEDIUM');
  const [estimatedDays, setEstimatedDays] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const priorityOptions = [
    { value: 'CRITICAL', label: 'Critical - Immediate action needed' },
    { value: 'HIGH', label: 'High - Within 48 hours' },
    { value: 'MEDIUM', label: 'Medium - Within a week' },
    { value: 'LOW', label: 'Low - Non-urgent' },
  ];

  const handleSubmit = async () => {
    try {
      setError(null);
      setLoading(true);

      if (!estimatedDays) {
        setError('Please enter estimated days to resolve');
        return;
      }

      const result = await managementService.triageComplaint(complaint._id, {
        priority,
        estimatedDays: parseInt(estimatedDays),
        triageNotes: notes,
      });

      if (!result.success) {
        setError(result.error || 'Triage failed');
        return;
      }

      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to triage complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="w-full sm:max-w-md bg-white rounded-t-lg sm:rounded-lg shadow-xl">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Triage Complaint</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority Level</label>
            <div className="space-y-2">
              {priorityOptions.map((option) => (
                <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="priority"
                    value={option.value}
                    checked={priority === option.value}
                    onChange={(e) => setPriority(e.target.value)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Resolution Time (days)
            </label>
            <input
              type="number"
              value={estimatedDays}
              onChange={(e) => setEstimatedDays(e.target.value)}
              placeholder="e.g. 7"
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Triage Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
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

        <div className="p-4 sm:p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Triaging...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
