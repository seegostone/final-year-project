// FilterBar.jsx
import { Search, Filter } from 'lucide-react';
import { CATEGORIES, URGENCIES } from './utils/constants';

export default function FilterBar({ 
  searchTerm, 
  onSearchChange, 
  categoryFilter, 
  onCategoryChange,
  urgencyFilter,
  onUrgencyChange,
  zoneFilter,
  onZoneChange,
  zones 
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by title, ID, or location..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={16} className="text-gray-400" />
          
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
          >
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          
          <select
            value={urgencyFilter}
            onChange={(e) => onUrgencyChange(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
          >
            {URGENCIES.map(urg => (
              <option key={urg.value} value={urg.value}>{urg.label}</option>
            ))}
          </select>
          
          <select
            value={zoneFilter}
            onChange={(e) => onZoneChange(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
          >
            <option value="all">All Zones</option>
            {zones.map(zone => (
              <option key={zone} value={zone}>{zone}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};