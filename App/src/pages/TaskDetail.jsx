import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, User, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Header from '../components/Header';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { WorkReportModal } from '../components/WorkReportModal';
import { IssueNotesModal } from '../components/IssueNotesModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import technicianService from '../services/technicianApi';

export function TaskDetail() {
  const { taskId, complaintId } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false); // need to track submission state for actions like start work, resolve, or pending
  const [taskStatus, setTaskStatus] = useState(null);
  const [showWorkReport, setShowWorkReport] = useState(false);
  const [showIssueNotes, setShowIssueNotes] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationType, setConfirmationType] = useState('resolved');
  const [confirmationData, setConfirmationData] = useState(null);

  const emitAppEvent = (eventName) => {
    if (typeof window === 'undefined') return;
    try {
      window.dispatchEvent(new Event(eventName));
    } catch (error) {
      console.warn('Unable to dispatch event', eventName, error);
    }

    try {
      const payload = JSON.stringify({ eventName, timestamp: Date.now() });
      window.localStorage.setItem('app-event', payload);
      window.localStorage.removeItem('app-event');
    } catch {
      // ignore localStorage failures
    }
  };

  // Fetch task details on mount
  useEffect(() => {
    const fetchTaskDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Verify we have both IDs
        if (!complaintId || !taskId) {
          setError('Task ID or Complaint ID not provided');
          setLoading(false);
          return;
        }

        // Fetch task details from API
        const taskData = await technicianService.getTaskDetails(complaintId, taskId);
        setTask(taskData);
        setTaskStatus(taskData.displayStatus);
      } catch (err) {
        console.error('Error loading task:', err);
        setError(err.message || 'Failed to load task');
      } finally {
        setLoading(false);
      }
    };

    fetchTaskDetails();
  }, [complaintId, taskId]);

  // Handler: Start work on task
  const handleStartWork = async () => {
    if (!task || !complaintId || !taskId) return;
    
    try {
      setSubmitting(true);
      await technicianService.updateTaskStatus(
        complaintId,
        taskId,
        { status: 'in_progress' }
      );
      const newStatus = technicianService.mapStatusToDisplay('in_progress');
      setTask((prev) => prev ? { ...prev, status: 'in_progress', displayStatus: newStatus } : prev);
      setTaskStatus(newStatus);
      emitAppEvent('notificationsUpdated');
      emitAppEvent('queueUpdated');
      toast.success('Task status updated to In Progress');
    } catch (err) {
      console.error('Error updating task:', err);
      toast.error(err.message || 'Failed to update task');
    } finally {
      setSubmitting(false);
    }
  };

  // Handler: Submit work report and mark as resolved
  const handleResolve = async (report) => {
    if (!task || !complaintId || !taskId) return;
    
    try {
      setSubmitting(true);
      const response = await technicianService.updateTaskStatus(
        complaintId,
        taskId,
        {
          status: 'done',
          workReport: report,
        },
        report.images || []
      );
      const newStatus = technicianService.mapStatusToDisplay('done');
      setTask((prev) => prev ? {
        ...prev,
        status: 'done',
        displayStatus: newStatus,
        workReport: {
          ...report,
          images: response.data?.workReport?.images || report.images || [],
        },
        images: response.data?.images || report.images || [],
      } : prev);
      setTaskStatus(newStatus);
      emitAppEvent('notificationsUpdated');
      emitAppEvent('queueUpdated');
      setConfirmationType('resolved');
      setConfirmationData(report);
      setShowWorkReport(false);
      setShowConfirmation(true);
      toast.success('Task marked as resolved');
    } catch (err) {
      console.error('Error resolving task:', err);
      toast.error(err.message || 'Failed to resolve task');
    } finally {
      setSubmitting(false);
    }
  };

  // Handler: Mark as pending with issue notes
  const handlePending = async (notes) => {
    if (!task || !complaintId || !taskId) return;
    
    try {
      setSubmitting(true);
      await technicianService.updateTaskStatus(
        complaintId,
        taskId,
        {
          status: 'blocked',
          pendingInfo: notes,
        }
      );
      const newStatus = technicianService.mapStatusToDisplay('blocked');
      setTask((prev) => prev ? { ...prev, status: 'blocked', displayStatus: newStatus, pendingInfo: { ...prev.pendingInfo, ...notes } } : prev);
      setTaskStatus(newStatus);
      emitAppEvent('notificationsUpdated');
      emitAppEvent('queueUpdated');
      setConfirmationType('pending');
      setConfirmationData(notes);
      setShowIssueNotes(false);
      setShowConfirmation(true);
      toast.success('Task marked as pending');
    } catch (err) {
      console.error('Error marking pending:', err);
      toast.error(err.message || 'Failed to update task');
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading state
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
            <p className="text-[#475569]" style={{ fontSize: '14px' }}>Loading task...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !task) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <Header />
        <div className="max-w-[1400px] mx-auto p-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-[#475569] hover:text-[#1e2937] mb-4"
            style={{ fontSize: '14px' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <div className="bg-red-50 border border-red-200 p-4 text-red-700" style={{ fontSize: '14px' }}>
            {error || 'Task not found. Please select a task from the dashboard.'}
          </div>
        </div>
      </div>
    );
  }

  const displayStatus = taskStatus || task.displayStatus;
  const activityLogs = task.activityLog || [];
  const dueDate = new Date(task.dueDate || task.deadline);
  const daysLeft = displayStatus === 'Resolved'
    ? null
    : Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const complaintLabel = task.complaintLabel || task.complaintId || complaintId;
  
  // Build readable task code: prefer backend taskCode, fallback to generated format, then raw ID
  let displayTaskCode = task.taskCode;
  if (!displayTaskCode && task.taskNumber && complaintLabel) {
    displayTaskCode = `${complaintLabel}-TASK-${String(task.taskNumber).padStart(3, '0')}`;
  }
  if (!displayTaskCode) {
    displayTaskCode = task.id || taskId;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Header />

      <div className="max-w-[1400px] mx-auto p-6">
        {/* Back Navigation */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-[#475569] hover:text-[#1e2937] mb-4 transition-colors"
            style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <h1 className="text-[#1e2937]" style={{ fontFamily: 'Merriweather, serif', fontSize: '18px', fontWeight: 700 }}>
            {task.title}
          </h1>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-[#e2e8f0] p-6"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <PriorityBadge priority={task.priority} />
                <StatusBadge status={displayStatus} />
                <div className="flex items-center gap-1.5 text-[#475569]" style={{ fontSize: '14px' }}>
                  <Clock className="w-4 h-4" />
                  <span>{daysLeft > 0 ? `${daysLeft}d left` : 'Overdue'}</span>
                </div>
              </div>
              <div className="mb-4 text-sm text-slate-500">
                Complaint: <span className="font-mono text-[#1e2937]">{complaintLabel}</span>
              </div>
              <div className="mb-4 text-sm text-slate-500">
                Task: <span className="font-mono text-[#1e2937]">{displayTaskCode}</span>
              </div>
              <div className="mb-6">
                <h3 className="text-[#94a3b8] mb-2" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.5px' }}>
                  DESCRIPTION
                </h3>
                <p className="text-[#1e2937]" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  {task.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <h3 className="text-[#94a3b8] mb-2" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.5px' }}>
                    LOCATION
                  </h3>
                  <div className="flex items-center gap-2 text-[#1e2937]" style={{ fontSize: '14px' }}>
                    <MapPin className="w-4 h-4" />
                    <span>{task.location || task.complaintLocation || 'Unknown location'}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-[#94a3b8] mb-2" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.5px' }}>
                    ASSIGNED TO
                  </h3>
                  <div className="flex items-center gap-2 text-[#1e2937]" style={{ fontSize: '14px' }}>
                    <User className="w-4 h-4" />
                    <span>{task.assignedTo || task.assigneeName || 'Unassigned'}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-[#94a3b8] mb-2" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.5px' }}>
                    SUBMITTED BY
                  </h3>
                  <div className="flex items-center gap-2 text-[#1e2937]" style={{ fontSize: '14px' }}>
                    <User className="w-4 h-4" />
                    <span>{task.submitterName || 'Resident'}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-[#94a3b8] mb-2" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.5px' }}>
                    DUE DATE
                  </h3>
                  <div className="flex items-center gap-2 text-[#1e2937]" style={{ fontSize: '14px' }}>
                    <Calendar className="w-4 h-4" />
                    <span>{format(dueDate, 'MMM dd, yyyy')}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-[#94a3b8] mb-2" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.5px' }}>
                    SLA STATUS
                  </h3>
                  <div className="flex items-center gap-2 text-[#1e2937]" style={{ fontSize: '14px' }}>
                    <Clock className="w-4 h-4" />
                    <span>{displayStatus === 'Resolved' ? 'SLA stopped' : (daysLeft > 0 ? `${daysLeft}d left` : 'Overdue')}</span>
                  </div>
                </div>
              </div>

              {task.images?.length > 0 && (
                <div>
                  <h3 className="text-[#94a3b8] mb-3" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.5px' }}>
                    IMAGES
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {task.images.map((img, index) => (
                      <img
                        key={index}
                        src={img}
                        alt={`Task image ${index + 1}`}
                        className="w-full h-32 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Actions Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border border-[#e2e8f0] p-6"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <h3 className="text-[#1e2937] mb-4" style={{ fontFamily: 'Merriweather, serif', fontSize: '16px', fontWeight: 700 }}>
                Actions
              </h3>
              <div className="flex flex-wrap gap-3">
                {taskStatus === 'Assigned' && (
                  <button
                    onClick={handleStartWork}
                    disabled={submitting}
                    className="px-6 py-3 bg-[#1e3a5f] text-white hover:bg-[#2d4a6f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontSize: '14px', fontWeight: 500 }}
                  >
                    {submitting ? 'Starting...' : 'Start Work'}
                  </button>
                )}
                {taskStatus === 'In Progress' && (
                  <>
                    <button
                      onClick={() => setShowWorkReport(true)}
                      disabled={submitting}
                      className="px-6 py-3 bg-[#059669] text-white hover:bg-[#047857] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ fontSize: '14px', fontWeight: 500 }}
                    >
                      Resolve Task
                    </button>
                    <button
                      onClick={() => setShowIssueNotes(true)}
                      disabled={submitting}
                      className="px-6 py-3 border border-[#e2e8f0] text-[#475569] hover:bg-[#f8fafc] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ fontSize: '14px', fontWeight: 500 }}
                    >
                      Report Issue
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>

          {/* Activity Log */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white border border-[#e2e8f0] p-6 h-fit"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <h3 className="text-[#1e2937] mb-4" style={{ fontFamily: 'Merriweather, serif', fontSize: '16px', fontWeight: 700 }}>
              Activity Log
            </h3>
            <div className="space-y-4">
              {activityLogs.map((log, index) => (
                <div key={log.id || `${log.timestamp || 'log'}-${index}`} className="relative pl-6">
                  {index < activityLogs.length - 1 && (
                    <div className="absolute left-1.5 top-6 bottom-0 w-0.5 bg-[#e2e8f0]" />
                  )}
                  <div className="absolute left-0 top-1.5 w-3 h-3 bg-[#1e3a5f]" />
                  <div>
                    <p className="text-[#1e2937] mb-1" style={{ fontSize: '14px' }}>
                      {log.action}
                    </p>
                    <p className="text-[#94a3b8]" style={{ fontSize: '12px' }}>
                      {format(new Date(log.timestamp), 'MMM dd, yyyy - h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modals */}
      <WorkReportModal
        isOpen={showWorkReport}
        onClose={() => setShowWorkReport(false)}
        onSubmit={handleResolve}
        taskId={displayTaskCode}
        taskTitle={task.title}
      />

      <IssueNotesModal
        isOpen={showIssueNotes}
        onClose={() => setShowIssueNotes(false)}
        onSubmit={handlePending}
        taskId={displayTaskCode}
        taskTitle={task.title}
      />

      {confirmationData && (
        <ConfirmationModal
          isOpen={showConfirmation}
          type={confirmationType}
          taskId={displayTaskCode}
          taskTitle={task.title}
          data={confirmationData}
        />
      )}
    </div>
  );
}
