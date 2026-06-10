import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import managementService from '../../../services/managementApi';

export default function QualityCheckModal({ complaint, onSuccess, onClose }) {
  const [qualityStatus, setQualityStatus] = useState('pass');
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    try {
      setError(null);
      setLoading(true);

      const result = await managementService.performQualityCheck(complaint._id, {
        qualityStatus,
        comments,
      });

      if (!result.success) {
        setError(result.error || 'Quality check failed');
        return;
      }

      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to submit quality check');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="w-full sm:max-w-md bg-white rounded-t-lg sm:rounded-lg shadow-xl">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Quality Check</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Is the work completed to standard?
            </label>
            <div className="space-y-2">
              {[
                { value: 'pass', label: '✓ Pass - Work is satisfactory', color: 'bg-green-50 border-green-200' },
                { value: 'fail', label: '✗ Fail - Work needs rework', color: 'bg-red-50 border-red-200' },
              ].map((option) => (
                <label key={option.value} className={`flex items-center gap-3 cursor-pointer p-3 border rounded-lg transition-colors ${option.color}`}>
                  <input
                    type="radio"
                    name="quality"
                    value={option.value}
                    checked={qualityStatus === option.value}
                    onChange={(e) => setQualityStatus(e.target.value)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-medium text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Inspection Comments
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={
                qualityStatus === 'fail'
                  ? 'Describe what needs to be fixed...'
                  : 'Add notes about the completed work...'
              }
              rows={4}
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
            className={`flex-1 px-4 py-2 text-white rounded-lg font-medium ${
              qualityStatus === 'pass'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            } disabled:bg-gray-400 disabled:cursor-not-allowed`}
          >
            {loading ? 'Submitting...' : 'Submit Check'}
          </button>
        </div>
      </div>
    </div>
  );
}
