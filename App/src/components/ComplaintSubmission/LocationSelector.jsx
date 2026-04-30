// components/ComplaintSubmission/LocationSelector.jsx
import { LOCATIONS } from '../../constants/complaintConstants';
import ErrorMessage from './ErrorMessage';

export default function LocationSelector({ 
  locationCategory, 
  specificLocation, 
  onCategoryChange, 
  onLocationChange,
  errors 
}) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-700 mb-3">
        Location <span className="text-red-500">*</span>
      </label>
      
      {/* Location Category Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        {LOCATIONS.map((loc) => (
          <button
            type="button"
            key={loc.value}
            onClick={() => onCategoryChange(loc.value)}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
              locationCategory === loc.value
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-600'
            }`}
          >
            <loc.icon size={18} />
            <span className="text-sm font-medium">{loc.label}</span>
          </button>
        ))}
      </div>
      <ErrorMessage message={errors.locationCategory} />
      
      {/* Specific Location */}
      <input
        type="text"
        name="specificLocation"
        value={specificLocation}
        onChange={onLocationChange}
        placeholder="Specific building/room number/area (e.g., Block A, Room 203)"
        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none ${
          errors.specificLocation ? 'border-red-400 bg-red-50' : 'border-gray-200'
        }`}
      />
      <ErrorMessage message={errors.specificLocation} />
    </div>
  );
};