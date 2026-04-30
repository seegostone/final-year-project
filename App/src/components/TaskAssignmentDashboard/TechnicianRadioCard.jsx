// TechnicianRadioCard.jsx
import { Phone, Mail, Zap, Droplet, Wrench, HardHat, Cpu, Briefcase } from 'lucide-react';

const tradeIcons = {
  electrical: <Zap size={16} />,
  plumbing: <Droplet size={16} />,
  carpentry: <Wrench size={16} />,
  masonry: <HardHat size={16} />,
  hvac: <Cpu size={16} />,
  general: <Briefcase size={16} />,
};

export default function TechnicianRadioCard({ technician, isSelected, onSelect }) {
  return (
    <label
      className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${
        isSelected 
          ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' 
          : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center gap-4 flex-1">
        <input
          type="radio"
          name="technician"
          value={technician._id}
          checked={isSelected}
          onChange={onSelect}
          className="w-4 h-4 text-indigo-600"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-800">{technician.name}</span>
            <span className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
              {tradeIcons[technician.trade]}
              <span className="capitalize">{technician.trade}</span>
            </span>
            <span className="text-xs text-gray-500">{technician.zone.join(', ')}</span>
          </div>
          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 flex-wrap">
            <span className="flex items-center gap-1"><Phone size={12} /> {technician.phone}</span>
            <span className="flex items-center gap-1"><Mail size={12} /> {technician.email}</span>
            <span>⭐ {technician.rating}</span>
            <span>{technician.currentLoad} active tasks</span>
          </div>
        </div>
        {technician.currentLoad === 0 && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Available now</span>
        )}
      </div>
    </label>
  );
};