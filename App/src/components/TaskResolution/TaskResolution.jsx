// components/TaskResolution/TaskResolution.jsx
import React from 'react';
import { Wrench } from 'lucide-react';
import { useTaskResolution } from '../../hooks/useTaskResolution';
import TechnicianHeader from './TechnicianHeader';
import TaskStats from './TaskStats';
import TasksFilterBar from './TasksFilterBar';
import TasksGrid from './TasksGrid';
import ResolutionModal from './ResolutionModal';
import ToastNotification from './ToastNotification';

const TaskResolution = () => {
  const {
    tasks,
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
  } = useTaskResolution();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAF8F2] to-[#F5F0E6] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D4C4A8] border-t-[#006837] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#5D4E37]">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF8F2] to-[#F5F0E6] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#006837] rounded-xl flex items-center justify-center">
              <Wrench size={22} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Task Resolution</h1>
          </div>
          <p className="text-[#5D4E37] ml-13">
            View assigned tasks, update work progress, and submit completion reports
          </p>
        </div>

        {/* Technician Header */}
        <TechnicianHeader technician={currentTechnician} stats={stats} />

        {/* Task Statistics */}
        <TaskStats tasks={tasks} filteredCount={tasks.length} />

        {/* Filter Bar */}
        <TasksFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          urgencyFilter={urgencyFilter}
          onUrgencyChange={setUrgencyFilter}
        />

        {/* Tasks Grid */}
        <TasksGrid tasks={tasks} onResolve={handleResolveClick} />
      </div>

      {/* Resolution Modal */}
      {showModal && selectedTask && (
        <ResolutionModal
          task={selectedTask}
          onSubmit={handleSubmitWorkReport}
          onClose={() => setShowModal(false)}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Toast Notification */}
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

export default TaskResolution;