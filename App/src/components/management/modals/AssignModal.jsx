import { useState, useEffect } from 'react';
import { X, AlertCircle, Search } from 'lucide-react';
import managementService from '../../../services/managementApi';

export default function AssignModal({ complaint, onSuccess, onClose }) {
  const [technicians, setTechnicians] = useState([]);
  const [selectedTech, setSelectedTech] = useState(null);
  const [searchTech, setSearchTech] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingTechs, setLoadingTechs] = useState(false);

  useEffect(() => {
    const loadTechnicians = async () => {
      try {
        setLoadingTechs(true);
        const result = await managementService.getTechnicians();

        if (result.success) {
          setTechnicians(result.data || []);
        } else {
          setError('Could not load technician list');
        }
      } catch (err) {
        console.error('Failed to load technicians:', err);
        setError('Could not load technician list');
      } finally {
        setLoadingTechs(false);
      }
    };

    void loadTechnicians();
  }, []);

  const filteredTechs = technicians.filter(
    (tech) =>
      tech.name?.toLowerCase().includes(searchTech.toLowerCase()) ||
      tech.specialization?.toLowerCase().includes(searchTech.toLowerCase())
  );

  const selectedTechData = technicians.find((t) => t._id === selectedTech);

  const handleSubmit = async () => {
    try {
      setError(null);
      setLoading(true);

      if (!selectedTech) {
        setError('Please select a technician');
        return;
      }

      const result = await managementService.assignComplaint(complaint._id, {
        technicianId: selectedTech,
        notes,
      });

      if (!result.success) {
        setError(result.error || 'Assignment failed');
        return;
      }

      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to assign complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="w-full sm:max-w-md bg-white rounded-t-lg sm:rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-white">
          <h3 className="text-lg font-bold text-gray-900">Assign Technician</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          {/* Technician Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Technician</label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or skill..."
                value={searchTech}
                onChange={(e) => setSearchTech(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Technician List */}
            <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
              {loadingTechs ? (
                <div className="p-4 text-center text-gray-600 text-sm">Loading technicians...</div>
              ) : filteredTechs.length === 0 ? (
                <div className="p-4 text-center text-gray-600 text-sm">No technicians found</div>
              ) : (
                filteredTechs.map((tech) => (
                  <button
                    key={tech._id}
                    onClick={() => setSelectedTech(tech._id)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-200 hover:bg-gray-50 transition-colors last:border-b-0 ${
                      selectedTech === tech._id ? 'bg-blue-50 border-b border-blue-200' : ''
                    }`}
                  >
                    <div className="font-medium text-gray-900">{tech.name}</div>
                    <div className="text-xs text-gray-600">{tech.specialization}</div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Selected Technician Details */}
          {selectedTechData && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
              <div>
                <p className="text-xs font-semibold text-blue-700 uppercase mb-1">Selected Technician</p>
                <p className="text-sm font-medium text-gray-900">{selectedTechData.name}</p>
                <p className="text-xs text-gray-600">{selectedTechData.specialization}</p>
              </div>
              {selectedTechData.phone && (
                <p className="text-xs text-gray-600">📞 {selectedTechData.phone}</p>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assignment Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions for the technician..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 border-t border-gray-200 bg-white p-4 sm:p-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedTech}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Assigning...' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  );
}
