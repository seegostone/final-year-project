import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import managementService from '../../../services/managementApi';

export default function ResidentApprovalModal({ complaint, onSuccess, onClose }) {
  const [approved, setApproved] = useState(null);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    try {
      setError(null);
      setLoading(true);

      if (approved === null) {
        setError('Please indicate approval status');
        return;
      }

      const result = await managementService.recordResidentApproval(complaint._id, {
        approved,
        feedback: comments,
      });

      if (!result.success) {
        setError(result.error || 'Failed to submit approval');
        return;
      }

      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to submit approval');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="w-full sm:max-w-md bg-white rounded-t-lg sm:rounded-lg shadow-xl">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Resident Approval</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-gray-700">
              Has the resident approved the completed work?
            </p>
          </div>

          <div className="space-y-2">
            {[
              { value: true, label: '✓ Yes, resident approved', color: 'bg-green-50 border-green-200' },
              { value: false, label: '✗ No, needs rework', color: 'bg-red-50 border-red-200' },
            ].map((option) => (
              <label
                key={option.value}
                className={`flex items-center gap-3 cursor-pointer p-3 border rounded-lg transition-colors ${option.color}`}
              >
                <input
                  type="radio"
                  name="approval"
                  value={option.value}
                  checked={approved === option.value}
                  onChange={(e) => setApproved(e.target.value === 'true')}
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {approved === false ? 'Issues reported by resident:' : 'Notes:'}
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={
                approved === false
                  ? 'What needs to be fixed?...'
                  : 'Any additional comments...'
              }
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
            disabled={loading || approved === null}
            className={`flex-1 px-4 py-2 text-white rounded-lg font-medium ${
              approved
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            } disabled:bg-gray-400 disabled:cursor-not-allowed`}
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}
