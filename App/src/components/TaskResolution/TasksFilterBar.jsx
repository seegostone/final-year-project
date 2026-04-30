// components/TaskResolution/TasksFilterBar.jsx
import React from 'react';
import { Search, Filter, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

const TasksFilterBar = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  urgencyFilter,
  onUrgencyChange
}) => {
  return (
    <div className="bg-[#FAF8F2] rounded-xl p-4 mb-6 border border-[#D4C4A8]">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5D4E37]" size={18} />
            <input
              type="text"
              placeholder="Search by title, ID, or location..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-[#D4C4A8] rounded-xl focus:ring-2 focus:ring-[#006837] focus:border-transparent outline-none bg-white"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={16} className="text-[#5D4E37]" />
          
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="px-3 py-2.5 border border-[#D4C4A8] rounded-xl bg-white focus:ring-2 focus:ring-[#006837] outline-none text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
          
          <select
            value={urgencyFilter}
            onChange={(e) => onUrgencyChange(e.target.value)}
            className="px-3 py-2.5 border border-[#D4C4A8] rounded-xl bg-white focus:ring-2 focus:ring-[#006837] outline-none text-sm"
          >
            <option value="all">All Urgency</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default TasksFilterBar;