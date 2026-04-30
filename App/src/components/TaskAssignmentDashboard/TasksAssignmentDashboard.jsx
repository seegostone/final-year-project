//TaskAssignmentDashboard.jsx
import { useState, useMemo } from 'react';
import Header from './Header';
import FilterBar from './FilterBar';
import ComplaintsGrid from './ComplaintsGrid';
import AssignmentModal from './AssignmentModal';
import ToastNotification from './ToastNotification';
import { mockComplaints, mockTechnicians } from './data/mockData';

export default function TaskAssignmentDashboard() {
  const [complaints, setComplaints] = useState(mockComplaints);
  const [technicians] = useState(mockTechnicians);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');

  // Apply filters using useMemo
  const filteredComplaints = useMemo(() => {
    let filtered = complaints;
    
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.trackingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(c => c.category === categoryFilter);
    }
    if (urgencyFilter !== 'all') {
      filtered = filtered.filter(c => c.urgency === urgencyFilter);
    }
    if (zoneFilter !== 'all') {
      filtered = filtered.filter(c => c.zone === zoneFilter);
    }
    
    return filtered;
  }, [searchTerm, categoryFilter, urgencyFilter, zoneFilter, complaints]);

  const handleAssignClick = (complaint) => {
    setSelectedComplaint(complaint);
    setShowModal(true);
  };

  const handleAssignTask = async (complaintId, technicianId) => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const technician = technicians.find(t => t._id === technicianId);
      const updatedComplaints = complaints.map(c => 
        c._id === complaintId 
          ? { ...c, status: 'assigned', assignedTo: technician }
          : c
      );
      
      setComplaints(updatedComplaints);
      setToast({ type: 'success', message: `Task assigned to ${technician.name} successfully!` });
      setShowModal(false);
      setSelectedComplaint(null);
      setLoading(false);
    }, 800);
  };

  const uniqueZones = ['all', ...new Set(complaints.map(c => c.zone))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <Header 
          pendingCount={filteredComplaints.length}
          availableTechsCount={technicians.filter(t => t.isAvailable).length}
        />
        
        <FilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          urgencyFilter={urgencyFilter}
          onUrgencyChange={setUrgencyFilter}
          zoneFilter={zoneFilter}
          onZoneChange={setZoneFilter}
          zones={uniqueZones.slice(1)}
        />
        
        <ComplaintsGrid 
          complaints={filteredComplaints}
          onAssign={handleAssignClick}
        />
      </div>
      
      {showModal && selectedComplaint && (
        <AssignmentModal
          complaint={selectedComplaint}
          technicians={technicians}
          onAssign={handleAssignTask}
          onClose={() => {
            setShowModal(false);
            setSelectedComplaint(null);
          }}
          loading={loading}
        />
      )}
      
      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};