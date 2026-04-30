// components/ComplaintSubmission/TitleInput.jsx
import ErrorMessage from './ErrorMessage';

export default function TitleInput({ value, onChange, error }) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Complaint Title <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        name="title"
        value={value}
        onChange={onChange}
        placeholder="e.g., Leaking ceiling in Lecture Hall B, Power outage in Block A"
        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition ${
          error ? 'border-red-400 bg-red-50' : 'border-gray-200'
        }`}
      />
      <ErrorMessage message={error} />
    </div>
  );
};