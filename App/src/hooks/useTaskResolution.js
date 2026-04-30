// hooks/useTaskResolution.js
import { useState, useEffect } from 'react';
import { fetchTechnicianTasks, updateTaskStatus, currentTechnician } from '../services/taskService';

export const useTaskResolution = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');

  // Load tasks
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    const data = await fetchTechnicianTasks(currentTechnician._id);
    setTasks(data);
    setFilteredTasks(data);
    setLoading(false);
  };

  // Apply filters
  useEffect(() => {
    let filtered = tasks;
    
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.trackingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }
    
    if (urgencyFilter !== 'all') {
      filtered = filtered.filter(t => t.urgency === urgencyFilter);
    }
    
    setFilteredTasks(filtered);
  }, [searchTerm, statusFilter, urgencyFilter, tasks]);

  const handleResolveClick = (task) => {
    setSelectedTask(task);
    setShowModal(true);
  };

  const handleSubmitWorkReport = async (workReport) => {
    setIsSubmitting(true);
    
    try {
      const result = await updateTaskStatus(selectedTask._id, workReport.status, workReport);
      
      // Update local state
      const updatedTasks = tasks.map(t => {
        if (t._id === selectedTask._id) {
          return {
            ...t,
            status: workReport.status,
            workReports: [...(t.workReports || []), {
              ...workReport,
              id: `wr_${Date.now()}`,
              reportedBy: currentTechnician.name,
              reportedAt: new Date().toISOString()
            }],
            resolvedAt: workReport.status === 'resolved' ? new Date().toISOString() : t.resolvedAt
          };
        }
        return t;
      });
      
      setTasks(updatedTasks);
      setToast({ 
        type: 'success', 
        message: workReport.status === 'resolved' 
          ? 'Task marked as resolved! Great work!' 
          : 'Work report submitted successfully!'
      });
      setShowModal(false);
      setSelectedTask(null);
    } catch (error) {
      setToast({ type: 'error', message: 'Failed to submit work report. Please try again.' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    resolved: tasks.filter(t => t.status === 'resolved').length
  };

  return {
    tasks: filteredTasks,
    allTasks: tasks,
    loading,
    selectedTask,
    showModal,
    isSubmitting,
    toast,
    stats,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    urgencyFilter,
    setUrgencyFilter,
    handleResolveClick,
    handleSubmitWorkReport,
    setShowModal,
    currentTechnician
  };
};