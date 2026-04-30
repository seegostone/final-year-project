// AssignmentModal.jsx
import { useState } from 'react';
import { UserCheck, Star, X } from 'lucide-react';
import TechnicianRadioCard from './TechnicianRadioCard';

export default function AssignmentModal({ complaint, technicians, onAssign, onClose, loading }) {
  const [selectedTechId, setSelectedTechId] = useState('');
  const [note, setNote] = useState('');

  const getRecommendedTechnicians = () => {
    return technicians.filter(tech => 
      tech.isAvailable && 
      tech.trade === complaint.category &&
      (tech.zone.includes(complaint.zone) || tech.zone.includes('All Zones'))
    ).sort((a, b) => a.currentLoad - b.currentLoad);
  };

  const handleSubmit = () => {
    if (selectedTechId) {
      onAssign(complaint._id, selectedTechId);
    }
  };

  const recommendedTechs = getRecommendedTechnicians();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 sticky top-0 bg-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Assign Task</h2>
              <p className="text-gray-500 text-sm mt-1">{complaint.trackingId} — {complaint.title}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* Complaint Summary */}
        <div className="p-6 bg-gray-50 border-b border-gray-100">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Location</span>
              <p className="font-medium text-gray-800">{complaint.location}</p>
            </div>
            <div>
              <span className="text-gray-500">Zone</span>
              <p className="font-medium text-gray-800">{complaint.zone}</p>
            </div>
            <div>
              <span className="text-gray-500">Category</span>
              <p className="font-medium text-gray-800 capitalize">{complaint.category}</p>
            </div>
            <div>
              <span className="text-gray-500">Urgency</span>
              <p className={`font-medium capitalize ${complaint.urgency === 'critical' ? 'text-red-600' : 'text-gray-800'}`}>
                {complaint.urgency}
              </p>
            </div>
          </div>
        </div>
        
        {/* Technicians List */}
        <div className="p-6">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Star size={16} className="text-yellow-500" />
            Recommended Technicians (based on trade & zone)
          </h3>
          
          <div className="space-y-3 mb-6">
            {recommendedTechs.map(tech => (
              <TechnicianRadioCard
                key={tech._id}
                technician={tech}
                isSelected={selectedTechId === tech._id}
                onSelect={() => setSelectedTechId(tech._id)}
              />
            ))}
          </div>
          
          {/* Assignment Note */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Assignment Note (Optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add any special instructions or notes for the technician..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
            />
          </div>
          
          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedTechId || loading}
              className={`flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl transition-colors flex items-center justify-center gap-2 ${
                !selectedTechId || loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <UserCheck size={18} />
              )}
              {loading ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};