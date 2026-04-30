// components/ComplaintSubmission/DescriptionInput.jsx
import ErrorMessage from './ErrorMessage';

export default function DescriptionInput({ value, onChange, error }) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Description <span className="text-red-500">*</span>
      </label>
      <textarea
        name="description"
        value={value}
        onChange={onChange}
        rows={4}
        placeholder="Please provide detailed information about the issue..."
        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none ${
          error ? 'border-red-400 bg-red-50' : 'border-gray-200'
        }`}
      />
      <ErrorMessage message={error} />
    </div>
  );
};