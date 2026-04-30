// components/ComplaintSubmission/UrgencySelector.jsx
import { CheckCircle } from 'lucide-react';
import { URGENCY_LEVELS } from '../../constants/complaintConstants';
import ErrorMessage from './ErrorMessage';

export default function UrgencySelector({ selectedUrgency, onChange, error }) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-700 mb-3">
        Urgency Level <span className="text-red-500">*</span>
      </label>
      <div className="space-y-3">
        {URGENCY_LEVELS.map((urg) => (
          <button
            type="button"
            key={urg.value}
            onClick={() => onChange(urg.value)}
            className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
              selectedUrgency === urg.value
                ? `${urg.color} border-current`
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-left">
              <span className="font-semibold capitalize">{urg.label}</span>
              <p className="text-xs mt-0.5 opacity-80">{urg.description}</p>
            </div>
            {selectedUrgency === urg.value && <CheckCircle size={20} />}
          </button>
        ))}
      </div>
      <ErrorMessage message={error} />
    </div>
  );
};