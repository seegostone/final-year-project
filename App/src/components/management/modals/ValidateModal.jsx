import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import managementService from '../../../services/managementApi';

export default function ValidateModal({ complaint, onSuccess, onClose }) {
  const [isValid, setIsValid] = useState(null);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    try {
      setError(null);
      setLoading(true);

      if (isValid === null) {
        setError('Please select validation result');
        return;
      }

      const result = await managementService.validateComplaint(complaint._id, {
        isValid,
        validationNotes: comments,
      });

      if (!result.success) {
        setError(result.error || 'Validation failed');
        return;
      }

      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to validate complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="w-full sm:max-w-md bg-white rounded-t-lg sm:rounded-lg shadow-xl">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Validate Complaint</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-3">Is this a legitimate complaint?</p>
            <div className="space-y-2">
              {[
                { value: true, label: '✓ Yes, legitimate' },
                { value: false, label: '✗ No, not legitimate' },
              ].map((option) => (
                <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="validity"
                    value={option.value}
                    checked={isValid === option.value}
                    onChange={(e) => setIsValid(e.target.value === 'true')}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Comments</label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add notes about validation..."
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
            disabled={loading || isValid === null}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Validating...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
