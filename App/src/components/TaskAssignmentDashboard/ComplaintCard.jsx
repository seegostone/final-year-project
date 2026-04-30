// ComplaintCard.jsx
import { MapPin, Clock, User, ChevronRight, UserCheck, Zap, Droplet, HardHat, Cpu, Wrench } from 'lucide-react';
import { getTimeAgo, getUrgencyColorClass } from './utils/helpers';

const categoryIcons = {
  electrical: <Zap size={18} className="text-yellow-500" />,
  plumbing: <Droplet size={18} className="text-blue-500" />,
  structural: <HardHat size={18} className="text-orange-500" />,
  mechanical: <Cpu size={18} className="text-purple-500" />,
  civil: <Wrench size={18} className="text-gray-500" />,
};

export default function ComplaintCard({ complaint, onAssign }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            {categoryIcons[complaint.category]}
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {complaint.trackingId}
            </span>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getUrgencyColorClass(complaint.urgency)}`}>
            {complaint.urgency.toUpperCase()}
          </span>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{complaint.title}</h3>
        <p className="text-gray-500 text-sm line-clamp-2">{complaint.description}</p>
      </div>
      
      {/* Details */}
      <div className="px-5 py-3 bg-gray-50 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin size={14} />
          <span>{complaint.location}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Clock size={14} />
          <span>{getTimeAgo(complaint.createdAt)}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <User size={14} />
          <span>{complaint.submittedBy.name}</span>
        </div>
      </div>
      
      {/* Footer */}
      <div className="px-5 py-4 bg-white border-t border-gray-100 flex justify-between items-center">
        <div className="flex gap-2">
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full capitalize">{complaint.category}</span>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{complaint.zone}</span>
        </div>
        <button
          onClick={() => onAssign(complaint)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium text-sm"
        >
          <UserCheck size={16} />
          Assign Task
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};