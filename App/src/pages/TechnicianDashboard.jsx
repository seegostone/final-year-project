import { useState, useEffect } from 'react';
import { Search, Filter, ChevronDown, XCircle, Layers, Clock, Clipboard, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import Header from '../components/Header';
import { StatCard } from '../components/StatCard';
import { TaskCard } from '../components/TaskCard';
import { EmptyState } from '../components/EmptyState';
import technicianService from '../services/technicianApi';
import { onTaskUnassigned } from '../utils/eventBus';

export function TechnicianDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTasks = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      const tasksData = await technicianService.getTechnicianTasks();
      setTasks(tasksData);
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError(err.message || 'Failed to load tasks');
      if (showLoading) {
        toast.error('Failed to load tasks');
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // Fetch tasks on component mount and refresh after task unassign events
  useEffect(() => {
    fetchTasks();

    const unsubscribe = onTaskUnassigned(() => {
      fetchTasks(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredTasks = tasks.filter(task => {
    const normalizedQuery = searchQuery.toLowerCase();
    const complaintLabel = (task.complaintLabel || task.complaintId || task.id || '').toLowerCase();
    const matchesSearch = 
      task.title.toLowerCase().includes(normalizedQuery) ||
      complaintLabel.includes(normalizedQuery) ||
      task.location.toLowerCase().includes(normalizedQuery);
    
    const matchesStatus = statusFilter === 'All' || task.displayStatus === statusFilter;
    const matchesPriority = priorityFilter === 'All' || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const stats = {
    total: tasks.length,
    inProgress: tasks.filter(t => t.displayStatus === 'In Progress').length,
    assigned: tasks.filter(t => t.displayStatus === 'Assigned').length,
    resolved: tasks.filter(t => t.displayStatus === 'Resolved').length,
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'All' || priorityFilter !== 'All';

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setPriorityFilter('All');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <Header />
        <div className="max-w-[1400px] mx-auto p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-[#475569]" style={{ fontSize: '14px' }}>Loading tasks...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <Header />
        <div className="max-w-[1400px] mx-auto p-6">
          <div className="bg-red-50 border border-red-200 p-4 text-red-700" style={{ fontSize: '14px' }}>
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Header />

      <div className="max-w-[1400px] mx-auto p-6">
        {/* Page Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-[#1e2937] mb-2" style={{ fontFamily: 'Merriweather, serif', fontSize: '24px', fontWeight: 700 }}>
            My Tasks
          </h1>
          <p className="text-[#475569]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px' }}>
            View and manage all tasks assigned to you
          </p>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Layers}
            iconBg="bg-[#eef2f7]"
            iconColor="text-[#1e3a5f]"
            count={stats.total}
            label="All tasks"
            delay={0.1}
          />
          <StatCard
            icon={Clock}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
            count={stats.inProgress}
            label="Working on"
            delay={0.2}
          />
          <StatCard
            icon={Clipboard}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            count={stats.assigned}
            label="Pending start"
            delay={0.3}
          />
          <StatCard
            icon={CheckCircle}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            count={stats.resolved}
            label="Completed"
            delay={0.4}
          />
        </div>

        {/* Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white border border-[#e2e8f0] p-4 mb-6"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks by ID, title, location..."
                className="w-full pl-10 pr-4 py-2 border border-[#e2e8f0] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                style={{ fontSize: '14px' }}
              />
            </div>

            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-[#e2e8f0] bg-white cursor-pointer hover:bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                style={{ fontSize: '14px' }}
              >
                <option>All</option>
                <option>Assigned</option>
                <option>In Progress</option>
                <option>Resolved</option>
                <option>Pending</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-4 py-2 border border-[#e2e8f0] bg-white cursor-pointer hover:bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                style={{ fontSize: '14px' }}
              >
                <option>All</option>
                <option>CRITICAL</option>
                <option>HIGH</option>
                <option>MEDIUM</option>
                <option>LOW</option>
              </select>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-[#475569] hover:bg-[#f8fafc] transition-colors flex items-center gap-2"
                  style={{ fontSize: '14px' }}
                >
                  <XCircle className="w-4 h-4" />
                  Clear
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Task Cards Grid */}
        {filteredTasks.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map((task, index) => (
              <TaskCard key={task.id} task={task} delay={0.1 * index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
