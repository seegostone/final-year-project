import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap,
  TrendingUp,
  Filter,
  Search,
  Plus,
  ChevronRight,
  AlertTriangle,
  Eye,
  Edit,
} from 'lucide-react';
import Layout from './Layout';
import ManagementQueue from './management/ManagementQueue';
import DashboardStats from './management/DashboardStats';
import ComplaintDetailModal from './management/ComplaintDetailModal';
import AssignModal from './management/modals/AssignModal';
import ValidateModal from './management/modals/ValidateModal';
import TriageModal from './management/modals/TriageModal';
import ScopeModal from './management/modals/ScopeModal';
import QualityCheckModal from './management/modals/QualityCheckModal';
import ScheduleInspectionModal from './management/modals/ScheduleInspectionModal';
import ResidentApprovalModal from './management/modals/ResidentApprovalModal';
import EscalateModal from './management/modals/EscalateModal';
import CloseComplaintModal from './management/modals/CloseComplaintModal';
import ReworkModal from './management/modals/ReworkModal';
import managementService from '../services/managementApi';

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'received', label: 'Received' },
  { value: 'analyzed', label: 'Analyzed' },
  { value: 'triaged', label: 'Triaged' },
  { value: 'scope_defined', label: 'Scope Defined' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'work_completed', label: 'Work Completed' },
  { value: 'ready_for_validation', label: 'Ready for Validation' },
  { value: 'validated', label: 'Validated' },
  { value: 'closed', label: 'Closed' },
];

const priorityOptions = [
  { value: 'all', label: 'All Priorities' },
  { value: 'CRITICAL', label: 'Critical', color: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'LOW', label: 'Low', color: 'bg-blue-100 text-blue-800 border-blue-200' },
];

export default function EstatesOfficerDashboard() {
  // UI State
  const [activeTab, setActiveTab] = useState('queue'); // queue, overdue, rework
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Data State
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({
    totalComplaints: 0,
    priorityBreakdown: {},
    statusBreakdown: {},
    slaBreach: 0,
    avgTimeToResolveHours: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Selected complaint & modal state
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [modalState, setModalState] = useState({
    type: null, // validate, triage, scope, assign, etc.
    visible: false,
  });

  // Load queue data
  const loadQueue = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await managementService.getQueue({
        status: statusFilter,
        priority: priorityFilter,
      });

      if (!result.success) {
        setError(result.error || 'Failed to load complaints');
        setComplaints([]);
        return;
      }

      setComplaints(result.data || []);
    } catch (err) {
      console.error('Queue load error:', err);
      setError('Failed to load complaints. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter]);

  // Load dashboard stats
  const loadStats = useCallback(async () => {
    try {
      const result = await managementService.getDashboardStats();

      if (result.success) {
        setStats(result.data || {});
      }
    } catch (err) {
      console.error('Stats load error:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadQueue();
    loadStats();
  }, [loadQueue, loadStats]);

  // Filter & search
  const filteredComplaints = useMemo(() => {
    return complaints.filter((complaint) => {
      const matchSearch =
        !searchQuery.trim() ||
        complaint.complaintId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complaint.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complaint.location?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchTab =
        activeTab === 'queue' ||
        (activeTab === 'overdue' && new Date(complaint.slaDeadline) < new Date()) ||
        (activeTab === 'rework' && complaint.status === 'rework_required');

      return matchSearch && matchTab;
    });
  }, [complaints, searchQuery, activeTab]);

  // Open modal with context
  const openModal = (type, complaint) => {
    setSelectedComplaint(complaint);
    setModalState({ type, visible: true });
  };

  const closeModal = () => {
    setModalState({ type: null, visible: false });
    setSelectedComplaint(null);
  };

  const handleModalSuccess = () => {
    closeModal();
    loadQueue(); // Refresh queue
  };

  // Render modal content
  const renderModal = () => {
    if (!modalState.visible || !selectedComplaint) return null;

    const props = {
      complaint: selectedComplaint,
      onSuccess: handleModalSuccess,
      onClose: closeModal,
    };

    switch (modalState.type) {
      case 'validate':
        return <ValidateModal {...props} />;
      case 'triage':
        return <TriageModal {...props} />;
      case 'scope':
        return <ScopeModal {...props} />;
      case 'assign':
        return <AssignModal {...props} />;
      case 'quality-check':
        return <QualityCheckModal {...props} />;
      case 'schedule-inspection':
        return <ScheduleInspectionModal {...props} />;
      case 'resident-approval':
        return <ResidentApprovalModal {...props} />;
      case 'rework':
        return <ReworkModal {...props} />;
      case 'escalate':
        return <EscalateModal {...props} />;
      case 'close':
        return <CloseComplaintModal {...props} />;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Management Dashboard</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage complaints from intake to closure
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <DashboardStats stats={stats} />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6">

          {/* Main Queue */}
          <div className="order-1">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <ManagementQueue
              complaints={filteredComplaints}
              loading={loading}
              onSelectComplaint={(complaint) => {
                setSelectedComplaint(complaint);
                setShowDetailModal(true);
              }}
              onAction={openModal}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showDetailModal && selectedComplaint && (
        <ComplaintDetailModal
          complaint={selectedComplaint}
          onClose={() => setShowDetailModal(false)}
          onAction={openModal}
        />
      )}

      {renderModal()}
      </div>
    </Layout>
  );
}
