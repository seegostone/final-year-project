
import { Fragment, useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { 
  AlertCircle, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Filter,
  Search,
  Upload,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Trash2,
  //TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import complaintService from '../services/complaintsApi';
import managementService from '../services/managementApi';
import authService from '../services/api';
import { useFormValidation } from '../hooks/useFormValidation';

let lastComplaintDashboardFetch = 0;
const COMPLAINT_DASHBOARD_FETCH_COOLDOWN_MS = 1500;

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
];

const timeOptions = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7days', label: 'Last 7 Days' },
  { value: 'last30days', label: 'Last 30 Days' },
  { value: 'thisweek', label: 'This Week' },
  { value: 'lastweek', label: 'Last Week' },
  { value: 'thismonth', label: 'This Month' },
  { value: 'lastmonth', label: 'Last Month' },
  { value: 'custom', label: 'Custom Range' },
];

const categoryOptions = [
  { value: 'all', label: 'All Categories' },
  { value: 'Electrical', label: 'Electrical' },
  { value: 'Plumbing', label: 'Plumbing' },
  { value: 'Cleaning', label: 'Cleaning' },
  { value: 'Safety', label: 'Safety' },
  { value: 'Other', label: 'Other' },
];

const urgencyOptions = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Critical', label: 'Critical' },
];

const initialFormValues = {
  title: '',
  description: '',
  location: '',
  category: 'Other',
  urgency: 'Medium',
  image: null,
};

const validateComplaintForm = (values) => {
  const errors = {};

  if (!values.title.trim()) {
    errors.title = 'Title is required';
  } else if (values.title.length < 5) {
    errors.title = 'Title must be at least 5 characters';
  }

  if (!values.description.trim()) {
    errors.description = 'Description is required';
  } else if (values.description.length < 15) {
    errors.description = 'Description must be at least 15 characters';
  }

  if (!values.location.trim()) {
    errors.location = 'Location is required';
  }

  if (!values.category || values.category === 'all') {
    errors.category = 'Category is required';
  }

  return errors;
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const normalizeRole = (role) =>
  String(role || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

const formatRangeLabel = ({ timeFilter, customStartDate, customEndDate }) => {
  if (timeFilter === 'custom') {
    if (customStartDate && customEndDate) {
      return `${formatDate(customStartDate)} - ${formatDate(customEndDate)}`;
    }
    return 'Custom Range';
  }
  const option = timeOptions.find((item) => item.value === timeFilter);
  return option?.label || 'All Time';
};

const formatHistoryAction = (action) => {
  switch (action) {
    case 'submitted':
      return 'Submitted';
    case 'status_assigned':
      return 'Assigned';
    case 'status_in-progress':
      return 'In Progress';
    case 'status_resolved':
      return 'Resolved';
    default:
      return action.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  }
};

// Enhanced StatCard with icons
const StatCard = ({ title, value, detail, accent, icon: Icon }) => (
  <div className="relative overflow-hidden border border-[#e2e8f0] bg-white p-6 transition-all">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-600">{title}</p>
        <p className={`mt-3 text-3xl font-bold ${accent}`}>{value}</p>
        <p className="mt-2 text-xs text-slate-500">{detail}</p>
      </div>
      {Icon && (
        <div className={`rounded-lg bg-gradient-to-br p-3 ${
          accent.includes('slate') ? 'from-slate-100 to-slate-200' :
          accent.includes('amber') ? 'from-amber-100 to-amber-200' :
          accent.includes('blue') ? 'from-blue-100 to-blue-200' :
          'from-emerald-100 to-emerald-200'
        }`}>
          <Icon className={`h-6 w-6 ${accent}`} />
        </div>
      )}
    </div>
  </div>
);

// Enhanced Badge with better styling
const Badge = ({ label, isActive, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`group relative border px-4 py-2.5 text-sm font-medium transition ${
      isActive
        ? 'border-slate-800 bg-slate-900 text-white'
        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50'
    }`}
  >
    {label}
  </button>
);

// Status badge colors
const getStatusColor = (status) => {
  switch (status) {
    case 'resolved':
      return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
    case 'in-progress':
      return 'bg-blue-100 text-blue-800 border border-blue-200';
    case 'assigned':
      return 'bg-amber-100 text-amber-800 border border-amber-200';
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
};

// Urgency badge colors
const getUrgencyColor = (urgency) => {
  switch (urgency) {
    case 'Critical':
      return 'bg-rose-100 text-rose-800 border border-rose-200';
    case 'High':
      return 'bg-orange-100 text-orange-800 border border-orange-200';
    case 'Medium':
      return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
};

export default function ComplaintDashboard() {
  const [dashboardStats, setDashboardStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
  });
  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showTimePanel, setShowTimePanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [expandedComplaintId, setExpandedComplaintId] = useState(null);
  const [respondComplaintId, setRespondComplaintId] = useState(null);
  const [approvalStatus, setApprovalStatus] = useState('ACCEPTED');
  const [satisfactionRating, setSatisfactionRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [responseError, setResponseError] = useState(null);
  const [responseSuccess, setResponseSuccess] = useState(null);
  const [responseLoading, setResponseLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [complaintToDelete, setComplaintToDelete] = useState(null);

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
    setServerErrors,
    resetForm,
  } = useFormValidation(initialFormValues, validateComplaintForm);

  const navigate = useNavigate();
  const timePanelRef = useRef(null);
  const responsePanelRef = useRef(null);
  const fileInputRef = useRef(null);
  const initialLoadRef = useRef(true);
  const hasInitialFetchRef = useRef(false);
  // Auto-dismiss notification after 3.5 seconds
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 3500);
    return () => clearTimeout(timer);
  }, [notification]);

  const toggleHistory = (complaintId) => {
    setExpandedComplaintId((current) => (current === complaintId ? null : complaintId));
  };

  const filteredComplaints = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    const result = complaints.filter((complaint) => {
      const matchesSearch =
        !normalizedSearch ||
        complaint.title.toLowerCase().includes(normalizedSearch) ||
        complaint.location.toLowerCase().includes(normalizedSearch) ||
        complaint.category.toLowerCase().includes(normalizedSearch);

      const matchesCategory =
        categoryFilter === 'all' || complaint.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
    
    return result;
  }, [complaints, searchQuery, categoryFilter]);

  const debounceRef = useRef(null);

  const refreshDashboardStats = useCallback(async (timeRangeVal, startDateVal, endDateVal) => {
    try {
      const result = await complaintService.getComplaintStats(
        timeRangeVal,
        startDateVal,
        endDateVal
      );
      if (result.success) {
        setDashboardStats(result.data || {});
      }
    } catch (error) {
      console.error('Failed to load complaint dashboard stats:', error);
    }
  }, []);

  const refreshComplaints = useCallback(
    async (page, statusVal, categoryVal, timeRangeVal, startDateVal, endDateVal, searchVal) => {
      try {
        setLoading(true);
        const result = await complaintService.getMyComplaints({
          page,
          limit: 5,
          status: statusVal,
          category: categoryVal,
          timeRange: timeRangeVal,
          startDate: startDateVal,
          endDate: endDateVal,
          search: searchVal,
        });

        if (result.success) {
          const complaintsArray = result.data || [];
          setComplaints(complaintsArray);
          setPagination(result.pagination || { currentPage: 1, totalPages: 1 });
        } else {
          console.warn('Failed to fetch complaints:', result);
          setComplaints([]);
          setPagination({ currentPage: 1, totalPages: 1 });
        }
      } catch (error) {
        console.error('Failed to load complaints:', error);
        setComplaints([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // ── Initial load on mount ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      authService.logoutAndRedirect();
      return;
    }

    if (hasInitialFetchRef.current) {
      return;
    }
    hasInitialFetchRef.current = true;

    const now = Date.now();
    if (now - lastComplaintDashboardFetch < COMPLAINT_DASHBOARD_FETCH_COOLDOWN_MS) {
      return;
    }
    lastComplaintDashboardFetch = now;

    let isMounted = true;

    const initLoad = async () => {
      if (isMounted) {
        await refreshDashboardStats('all', '', '');
        await refreshComplaints(1, 'all', 'all', 'all', '', '', '');
      }
    };

    initLoad();
    return () => { isMounted = false; };
  }, [refreshDashboardStats, refreshComplaints]); // Only on mount

  // ── Debounced fetch when filters change ────────────────────────────────────────

  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    debounceRef.current = setTimeout(() => {
      if (timeFilter === 'custom' && (!customStartDate || !customEndDate)) {
        return;
      }
      refreshDashboardStats(timeFilter, customStartDate, customEndDate);
      refreshComplaints(1, statusFilter, categoryFilter, timeFilter, customStartDate, customEndDate, searchQuery);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [statusFilter, categoryFilter, searchQuery, timeFilter, customStartDate, customEndDate, refreshDashboardStats, refreshComplaints]);

  // ── Fetch when page changes (no debounce) ───────────────────────────────────────

  useEffect(() => {
    if (pagination.currentPage === 1) return; // Skip: already fetched by filter effect
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshComplaints(pagination.currentPage, statusFilter, categoryFilter, timeFilter, customStartDate, customEndDate, searchQuery);
  }, [pagination.currentPage, statusFilter, categoryFilter, timeFilter, customStartDate, customEndDate, searchQuery, refreshComplaints]);

  const handlePresetFilterChange = (selected) => {
    setTimeFilter(selected);
    if (selected !== 'custom') {
      setShowTimePanel(false);
      setCustomStartDate('');
      setCustomEndDate('');
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
    }
  };

  const handleApplyCustomRange = () => {
    if (!customStartDate || !customEndDate) return;
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    setShowTimePanel(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showTimePanel &&
        timePanelRef.current &&
        !timePanelRef.current.contains(event.target)
      ) {
        setShowTimePanel(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTimePanel]);

  const currentRespondComplaint = useMemo(
    () => complaints.find((complaint) => complaint._id === respondComplaintId) || null,
    [complaints, respondComplaintId]
  );

  useEffect(() => {
    if (respondComplaintId && responsePanelRef.current) {
      responsePanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [respondComplaintId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setNotification(null);
    setErrorMessage(null);

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitLoading(true);
      const submission = {
        title: values.title.trim(),
        description: values.description.trim(),
        location: values.location.trim(),
        category: values.category,
        urgency: values.urgency,
        image: values.image,
      };

      const result = await complaintService.createComplaint(submission);

      if (result.success) {
        setNotification(result.data?.message || 'Complaint submitted successfully');
        resetForm();
        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setStatusFilter('all');
        setCategoryFilter('all');
        setTimeFilter('all');
        setCustomStartDate('');
        setCustomEndDate('');
        setSearchQuery('');
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
        // Add delay to allow database write and state updates to complete
        await new Promise((resolve) => setTimeout(resolve, 500));
        await refreshDashboardStats('all', '', '');
        await refreshComplaints(1, 'all', 'all', 'all', '', '', '');
        window.dispatchEvent(new Event('notificationsUpdated'));
      } else {
        setErrorMessage(result.error || 'Unable to submit complaint.');
        setServerErrors(result.validationErrors);
      }
    } catch (error) {
      console.error('Complaint submit failure:', error);
      setErrorMessage('An unexpected error occurred while submitting the complaint.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleFileChange = (file) => {
    handleChange('image', file);
  };

  const handlePageChange = (direction) => {
    setPagination((prev) => {
      const nextPage = direction === 'next' ? prev.currentPage + 1 : prev.currentPage - 1;
      return {
        ...prev,
        currentPage: Math.max(1, Math.min(prev.totalPages, nextPage)),
      };
    });
  };

  const handleDeleteComplaint = (complaintId) => {
    setComplaintToDelete(complaintId);
    setDeleteModalOpen(true);
  };

  const handleStartResponse = (complaintId) => {
    setRespondComplaintId(complaintId);
    setApprovalStatus('ACCEPTED');
    setSatisfactionRating(5);
    setFeedbackText('');
    setRejectionReason('');
    setResponseError(null);
    setResponseSuccess(null);
  };

  const handleSubmitResponse = async () => {
    setResponseError(null);
    setResponseSuccess(null);

    if (approvalStatus === 'REJECTED' && !rejectionReason.trim()) {
      setResponseError('Please provide a reason for rejection.');
      return;
    }

    setResponseLoading(true);
    try {
      const currentUser = authService.getCurrentUserFromStorage();
      const payload = {
        approvalStatus,
        satisfactionRating: Number(satisfactionRating),
        feedback: feedbackText.trim(),
        rejectionReason: approvalStatus === 'REJECTED' ? rejectionReason.trim() : undefined,
        approvedBy: currentUser?._id,
        approvedByName: currentUser?.name,
      };

      const result = await managementService.recordResidentApproval(respondComplaintId, payload);
      if (result.success) {
        setResponseSuccess('Your response has been submitted.');
        setRespondComplaintId(null);
        await refreshDashboardStats(timeFilter, customStartDate, customEndDate);
        await refreshComplaints(pagination.currentPage, statusFilter, categoryFilter, timeFilter, customStartDate, customEndDate, searchQuery);
      } else {
        setResponseError(result.error || 'Unable to submit your response.');
      }
    } catch (error) {
      console.error('Resident response submit error:', error);
      setResponseError('Unable to submit your response.');
    } finally {
      setResponseLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!complaintToDelete) return;

    try {
      const result = await complaintService.deleteComplaint(complaintToDelete);
      if (result.success) {
        setNotification('Complaint deleted successfully');
        setDeleteModalOpen(false);
        setComplaintToDelete(null);
        // Refresh the list
        await new Promise((resolve) => setTimeout(resolve, 500));
        await refreshDashboardStats(timeFilter, customStartDate, customEndDate);
        await refreshComplaints(pagination.currentPage, statusFilter, categoryFilter, timeFilter, customStartDate, customEndDate, searchQuery);
      } else {
        setErrorMessage(result.error || 'Unable to delete complaint.');
      }
    } catch (error) {
      console.error('Delete complaint error:', error);
      setErrorMessage('An unexpected error occurred while deleting the complaint.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header showAuth={true} />
      
      <div className="mx-auto max-w-7xl p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="space-y-6"
        >
          {/* Page Header */}
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Complaint Management</h1>
              <p className="text-base text-slate-600">
                Submit and track maintenance requests for Makerere University estates.
              </p>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTimePanel((current) => !current)}
                className="inline-flex items-center gap-2 border border-[#e2e8f0] bg-white px-4 py-2 text-sm font-medium text-[#1e2937] transition hover:border-[#1e3a5f]"
              >
                <Calendar className="h-4 w-4 text-[#64748b]" />
                <span>{formatRangeLabel({ timeFilter, customStartDate, customEndDate })}</span>
                <ChevronDown className="h-4 w-4 text-[#64748b]" />
              </button>

              {showTimePanel && (
                <div
                  ref={timePanelRef}
                  className="absolute right-0 z-50 mt-3 w-80 border border-[#e2e8f0] bg-white p-4"
                >
                  <div className="space-y-3">
                    <div className="grid gap-2">
                      {timeOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handlePresetFilterChange(option.value)}
                          className={`w-full px-3 py-2 text-left text-sm font-medium transition ${
                            timeFilter === option.value
                              ? 'bg-[#1e3a5f] text-white'
                              : 'bg-[#f8fafc] text-[#1e2937] hover:bg-[#eef2f7]'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>

                    {timeFilter === 'custom' && (
                      <div className="border border-[#e2e8f0] bg-[#f8fafc] p-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <label htmlFor="customStartDate" className="space-y-2 text-sm font-medium text-[#1e2937]">
                            Start date
                            <input
                              id="customStartDate" name="customStartDate"
                              type="date"
                              value={customStartDate}
                              onChange={(event) => setCustomStartDate(event.target.value)}
                              className="w-full border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#1e2937] outline-none transition focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#eef2f7]"
                            />
                          </label>
                          <label htmlFor="customEndDate" className="space-y-2 text-sm font-medium text-[#1e2937]">
                            End date
                            <input
                              id="customEndDate" name="customEndDate"
                              type="date"
                              value={customEndDate}
                              onChange={(event) => setCustomEndDate(event.target.value)}
                              className="w-full border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#1e2937] outline-none transition focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#eef2f7]"
                            />
                          </label>
                        </div>
                        <div className="mt-4 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={handleApplyCustomRange}
                            disabled={!customStartDate || !customEndDate}
                            className="inline-flex min-w-[120px] items-center justify-center bg-[#7B1A1A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#5A1313] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Update
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setTimeFilter('all');
                              setCustomStartDate('');
                              setCustomEndDate('');
                              setShowTimePanel(false);
                              setPagination((prev) => ({ ...prev, currentPage: 1 }));
                            }}
                            className="inline-flex min-w-[120px] items-center justify-center border border-[#e2e8f0] bg-white px-4 py-2 text-sm font-medium text-[#1e2937] transition hover:bg-[#f8fafc]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

          {/* Stats Cards */}
          {respondComplaintId && (
            <div ref={responsePanelRef} className="mb-8 rounded-none border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Approval Response</p>
                  <h2 className="text-xl font-semibold text-slate-900">Respond to approval request</h2>
                  {currentRespondComplaint && (
                    <p className="mt-1 text-sm text-slate-600">
                      For complaint: <span className="font-medium text-slate-900">{currentRespondComplaint.title}</span>
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setRespondComplaintId(null)}
                  className="rounded-none border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700">Decision</label>
                  <select
                    value={approvalStatus}
                    onChange={(e) => setApprovalStatus(e.target.value)}
                    className="mt-2 block w-full rounded-none border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  >
                    <option value="ACCEPTED">Accept</option>
                    <option value="REJECTED">Request Rework</option>
                    <option value="PARTIAL">Partial Acceptance</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Satisfaction rating</label>
                  <select
                    value={satisfactionRating}
                    onChange={(e) => setSatisfactionRating(Number(e.target.value))}
                    className="mt-2 block w-full rounded-none border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  >
                    {[5, 4, 3, 2, 1].map((value) => (
                      <option key={value} value={value}>{value} / 5</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Comments</label>
                  <textarea
                    rows={4}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    className="mt-2 block w-full rounded-none border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                    placeholder="Optional comments about the completed work"
                  />
                </div>
                {approvalStatus === 'REJECTED' && (
                  <div>
                    <label className="text-sm font-medium text-slate-700">Rejection reason</label>
                    <textarea
                      rows={3}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="mt-2 block w-full rounded-none border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                      placeholder="Please describe why rework is needed"
                    />
                  </div>
                )}
                {responseError && <p className="text-sm text-rose-600">{responseError}</p>}
                {responseSuccess && <p className="text-sm text-emerald-700">{responseSuccess}</p>}
                <button
                  type="button"
                  onClick={handleSubmitResponse}
                  disabled={responseLoading}
                  className="inline-flex w-full items-center justify-center rounded-none bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#16304f] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {responseLoading ? 'Submitting...' : 'Submit response'}
                </button>
              </div>
            </div>
          )}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.08 }}
            className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            <StatCard
              title="Total Complaints"
              value={dashboardStats.total ?? 0}
              detail="All time submissions"
              accent="text-slate-900"
              icon={FileText}
            />
            <StatCard
              title="Pending"
              value={dashboardStats.pending ?? 0}
              detail="Awaiting action"
              accent="text-amber-600"
              icon={Clock}
            />
            <StatCard
              title="In Progress"
              value={dashboardStats.inProgress ?? 0}
              detail="Currently handling"
              accent="text-blue-600"
              icon={AlertCircle}
            />
            <StatCard
              title="Resolved"
              value={dashboardStats.resolved ?? 0}
              detail="Successfully completed"
              accent="text-emerald-600"
              icon={CheckCircle2}
            />
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Submit Form */}
          <div className="lg:col-span-2">
            <div className="border border-[#e2e8f0] bg-white">
              <div className="border-b border-slate-100 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-flex items-center bg-[#f8fafc] px-2.5 py-1 text-xs font-semibold text-[#1e2937]">
                      NEW COMPLAINT
                    </span>
                    <h2 className="mt-3 text-xl font-semibold text-slate-900">Submit a Request</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Report a maintenance issue or safety concern
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {notification && (
                  <div className="mb-6 flex items-start gap-3 border border-emerald-200 bg-emerald-50 p-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                    <p className="text-sm font-medium text-emerald-800">{notification}</p>
                  </div>
                )}

                {errorMessage && (
                  <div className="mb-6 flex items-start gap-3 border border-red-200 bg-red-50 p-4">
                    <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                    <p className="text-sm font-medium text-red-700">{errorMessage}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="title" className="text-sm font-medium text-slate-700">Complaint Title</label>
                      <input
                        id="title" name="title"
                        type="text"
                        value={values.title}
                        onChange={(event) => handleChange('title', event.target.value)}
                        onBlur={() => handleBlur('title')}
                        className="w-full px-4 py-2.5 border border-[#e2e8f0] bg-white text-[#1e2937] outline-none transition focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#eef2f7]"
                        placeholder="e.g., Water leak in block C"
                        autoComplete="organization-title"
                      />
                      {touched.title && errors.title && (
                        <p className="text-xs text-rose-600">{errors.title}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="location" className="text-sm font-medium text-slate-700">Location</label>
                      <input
                        id="location" name="location"
                        type="text"
                        value={values.location}
                        onChange={(event) => handleChange('location', event.target.value)}
                        onBlur={() => handleBlur('location')}
                        className="w-full px-4 py-2.5 border border-[#e2e8f0] bg-white text-[#1e2937] outline-none transition focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#eef2f7]"
                        placeholder="e.g., Block C, Floor 2"
                        autoComplete="street-address"
                      />
                      {touched.location && errors.location && (
                        <p className="text-xs text-rose-600">{errors.location}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="category" className="text-sm font-medium text-slate-700">Category</label>
                    <select
                      id="category" name="category"
                      value={values.category}
                      onChange={(event) => handleChange('category', event.target.value)}
                      onBlur={() => handleBlur('category')}
                      className="w-full px-4 py-2.5 border border-[#e2e8f0] bg-white text-[#1e2937] outline-none transition focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#eef2f7]"
                    >
                      {categoryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {touched.category && errors.category && (
                      <p className="text-xs text-rose-600">{errors.category}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-medium text-slate-700">Description</label>
                    <textarea
                      id="description" name="description"
                      value={values.description}
                      onChange={(event) => handleChange('description', event.target.value)}
                      onBlur={() => handleBlur('description')}
                      rows={4}
                      className="w-full px-4 py-2.5 border border-[#e2e8f0] bg-white text-[#1e2937] outline-none transition focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#eef2f7]"
                      placeholder="Provide detailed information about the issue..."
                    />
                    {touched.description && errors.description && (
                      <p className="text-xs text-rose-600">{errors.description}</p>
                    )}
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="urgency" className="text-sm font-medium text-slate-700">Urgency Level</label>
                      <select
                        id="urgency" name="urgency"
                        value={values.urgency}
                        onChange={(event) => handleChange('urgency', event.target.value)}
                        className="w-full px-4 py-2.5 border border-[#e2e8f0] bg-white text-[#1e2937] outline-none transition focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#eef2f7]"
                      >
                        {urgencyOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="image" className="text-sm font-medium text-slate-700">Attachment</label>
                      <input
                        ref={fileInputRef}
                        id="image" name="image"
                        type="file"
                        accept="image/*"
                        onChange={(event) => handleFileChange(event.target.files?.[0] || null)}
                        className="w-full cursor-pointer border border-[#e2e8f0] bg-white px-4 py-2 text-sm text-[#1e2937] outline-none transition focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#eef2f7]"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={submitLoading}
                      className="flex w-full items-center justify-center gap-2 bg-[#7B1A1A] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#5A1313] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submitLoading ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Submit Complaint
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Complaints List */}
          <div className="lg:col-span-3 space-y-6">
            {/* Filters */}
            <div className="border border-[#e2e8f0] bg-white p-6">
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Complaint History</h2>
                  <p className="mt-1 text-sm text-slate-600">View and filter your submissions</p>
                </div>
                <div className="inline-flex items-center gap-2 bg-[#f8fafc] px-3 py-2">
                  <FileText className="h-4 w-4 text-[#64748b]" />
                  <span className="text-sm font-medium text-[#1e2937]">
                    {filteredComplaints.length} result{filteredComplaints.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <div className="mb-5 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
                  <input
                    id="searchQuery" name="searchQuery"
                    type="search"
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                      setPagination((prev) => ({ ...prev, currentPage: 1 }));
                    }}
                    placeholder="Search complaints..."
                    aria-label="Search complaints"
                    className="w-full border border-[#e2e8f0] bg-[#f8fafc] py-2.5 pl-10 pr-4 text-sm text-[#1e2937] outline-none transition focus:border-[#1e3a5f] focus:bg-white focus:ring-2 focus:ring-[#eef2f7]"
                  />
                </div>
                <div className="relative flex items-center gap-2">
                  <Filter className="h-4 w-4 text-[#64748b]" />
                  <select
                    className="border border-[#e2e8f0] bg-[#f8fafc] px-4 py-2.5 text-sm font-medium text-[#1e2937] outline-none transition focus:border-[#1e3a5f] focus:bg-white focus:ring-2 focus:ring-[#eef2f7]"
                    value={categoryFilter}
                    onChange={(event) => {
                      setCategoryFilter(event.target.value);
                      setPagination((prev) => ({ ...prev, currentPage: 1 }));
                    }}
                  >
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {statusOptions.map((status) => (
                  <Badge
                    key={status.value}
                    label={status.label}
                    isActive={statusFilter === status.value}
                    onClick={() => {
                      setStatusFilter(status.value);
                      setPagination((prev) => ({ ...prev, currentPage: 1 }));
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="border border-[#e2e8f0] bg-white">
              <div className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50">
                      <tr>
                        <th className="px-6 py-3.5 font-semibold text-slate-700">Complaint</th>
                        <th className="px-6 py-3.5 font-semibold text-slate-700">Category</th>
                        <th className="px-6 py-3.5 font-semibold text-slate-700">Status</th>
                        <th className="px-6 py-3.5 font-semibold text-slate-700">Urgency</th>
                        <th className="px-6 py-3.5 font-semibold text-slate-700">Date</th>
                        <th className="px-6 py-3.5 font-semibold text-slate-700">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"></div>
                              <p className="text-sm text-slate-600">Loading complaints...</p>
                            </div>
                          </td>
                        </tr>
                      ) : filteredComplaints.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <div className="bg-[#f8fafc] p-3">
                                <FileText className="h-6 w-6 text-[#cbd5e1]" />
                              </div>
                              <p className="text-sm font-medium text-[#64748b]">No complaints found</p>
                              <p className="text-xs text-[#94a3b8]">Try adjusting your filters</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredComplaints.map((complaint) => (
                          <Fragment key={complaint._id}>
                            <tr className="transition hover:bg-slate-50">
                              <td className="px-6 py-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-medium text-slate-900">{complaint.title}</p>
                                    <p className="mt-0.5 text-xs text-slate-500">{complaint.location}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => toggleHistory(complaint._id)}
                                    className="border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1 text-xs font-semibold text-[#1e2937] transition hover:border-[#1e3a5f] hover:bg-[#eef2f7]"
                                  >
                                    {expandedComplaintId === complaint._id ? (
                                      <span className="inline-flex items-center gap-1">
                                        <ChevronUp className="h-3.5 w-3.5" />
                                        Hide
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1">
                                        <ChevronDown className="h-3.5 w-3.5" />
                                        History
                                      </span>
                                    )}
                                  </button>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center bg-[#f8fafc] px-2.5 py-1 text-xs font-medium text-[#1e2937]">
                                  {complaint.category}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold ${getStatusColor(complaint.status)}`}>
                                  {complaint.status.replace(/-/g, ' ')}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold ${getUrgencyColor(complaint.urgency)}`}>
                                  {complaint.urgency}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-slate-600">{formatDate(complaint.createdAt)}</td>
                              <td className="px-6 py-4 space-y-2">
                                {complaint.residentValidation?.isPending && !complaint.residentValidation?.status && (
                                  <button
                                    type="button"
                                    onClick={() => handleStartResponse(complaint._id)}
                                    className="inline-flex items-center gap-2 bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                                    title="Respond to approval request"
                                  >
                                    Respond
                                  </button>
                                )}
                                {complaint.status === 'pending' && (
                                  <button
                                    onClick={() => handleDeleteComplaint(complaint._id)}
                                    className="inline-flex items-center gap-2 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
                                    title="Delete pending complaint"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                  </button>
                                )}
                              </td>
                            </tr>
                            {expandedComplaintId === complaint._id && (
                              <tr className="bg-slate-50">
                                <td colSpan={6} className="border-t border-slate-200 px-6 py-4">
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-semibold text-slate-900">History details</p>
                                      <p className="text-xs text-slate-500">{complaint.history?.length ?? 0} events</p>
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-2">
                                      {complaint.history?.map((entry, index) => (
                                        <div
                                          key={`${entry.action}-${index}`}
                                          className="border border-[#e2e8f0] bg-white p-4"
                                        >
                                          <div className="flex items-center justify-between gap-3">
                                            <p className="text-sm font-semibold text-slate-900">{formatHistoryAction(entry.action)}</p>
                                            <p className="text-xs text-slate-500">{formatDateTime(entry.at)}</p>
                                          </div>
                                          <p className="mt-1 text-xs text-slate-500">
                                            {entry.from ? `${entry.from.replace(/-/g, ' ')} → ${entry.to.replace(/-/g, ' ')}` : `Set to ${entry.to.replace(/-/g, ' ')}`}
                                          </p>
                                          <p className="mt-1 text-xs text-slate-500">By {entry.byName || entry.byRole || 'System'}</p>
                                          {entry.assignedToName && (
                                            <p className="mt-1 text-xs text-slate-500">Assigned to {entry.assignedToName}</p>
                                          )}
                                          {entry.note && (
                                            <p className="mt-3 text-sm text-slate-700">{entry.note}</p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {filteredComplaints.length > 0 && (
                <div className="flex items-center justify-between border-t border-[#e2e8f0] px-6 py-4">
                  <p className="text-sm text-[#64748b]">
                    Page <span className="font-medium text-[#1e2937]">{pagination.currentPage}</span> of{' '}
                    <span className="font-medium text-[#1e2937]">{pagination.totalPages}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={pagination.currentPage <= 1}
                      onClick={() => handlePageChange('prev')}
                      className="inline-flex items-center gap-2 border border-[#e2e8f0] bg-white px-4 py-2 text-sm font-medium text-[#1e2937] transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={pagination.currentPage >= pagination.totalPages}
                      onClick={() => handlePageChange('next')}
                      className="inline-flex items-center gap-2 border border-[#e2e8f0] bg-white px-4 py-2 text-sm font-medium text-[#1e2937] transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-sm border border-[#e2e8f0] bg-white">
            {/* Modal Header */}
            <div className="border-b border-[#e2e8f0] bg-red-50 px-6 py-4">
              <h2 className="text-lg font-semibold text-[#1e2937]">Delete Complaint</h2>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center bg-red-100">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <p className="text-base font-medium text-[#1e2937]">Are you sure?</p>
              </div>
              <p className="text-sm text-[#64748b] leading-relaxed">
                This will permanently delete this complaint. This action cannot be undone.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-[#e2e8f0] bg-[#f8fafc] px-6 py-4 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setComplaintToDelete(null);
                }}
                className="border border-[#e2e8f0] bg-white px-4 py-2.5 text-sm font-medium text-[#1e2937] hover:bg-[#eef2f7] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}