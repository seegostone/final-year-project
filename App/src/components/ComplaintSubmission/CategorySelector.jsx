// components/ComplaintSubmission/CategorySelector.jsx
import { CATEGORIES } from '../../constants/complaintConstants';
import ErrorMessage from './ErrorMessage';

export default function CategorySelector({ selectedCategory, onChange, error }) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-700 mb-3">
        Issue Category <span className="text-red-500">*</span>
      </label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {CATEGORIES.map((cat) => (
          <button
            type="button"
            key={cat.value}
            onClick={() => onChange(cat.value)}
            className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
              selectedCategory === cat.value
                ? `${cat.color} border-current`
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <cat.icon size={18} />
            <span className="text-sm font-medium capitalize">{cat.label}</span>
          </button>
        ))}
      </div>
      <ErrorMessage message={error} />
    </div>
  );
};