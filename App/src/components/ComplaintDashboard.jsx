
import { Fragment, useEffect, useMemo, useState, useRef, useCallback } from 'react';
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
  //TrendingUp
} from 'lucide-react';
import Header from './Header';
import complaintService from '../services/complaintsApi';
import { useFormValidation } from '../hooks/useFormValidation';
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
  <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
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
    className={`group relative rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
      isActive
        ? 'border-slate-800 bg-slate-900 text-white shadow-md'
        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 hover:shadow-sm'
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

  const timePanelRef = useRef(null);
  const toggleHistory = (complaintId) => {
    setExpandedComplaintId((current) => (current === complaintId ? null : complaintId));
  };

  const filteredComplaints = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return complaints.filter((complaint) => {
      const matchesSearch =
        !normalizedSearch ||
        complaint.title.toLowerCase().includes(normalizedSearch) ||
        complaint.location.toLowerCase().includes(normalizedSearch) ||
        complaint.category.toLowerCase().includes(normalizedSearch);

      const matchesCategory =
        categoryFilter === 'all' || complaint.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [complaints, searchQuery, categoryFilter]);

  const refreshDashboardStats = useCallback(async (overrideTimeRange = null, overrideStartDate = undefined, overrideEndDate = undefined) => {
    try {
      const result = await complaintService.getComplaintStats(
        overrideTimeRange ?? timeFilter,
        overrideStartDate !== undefined ? overrideStartDate : customStartDate,
        overrideEndDate !== undefined ? overrideEndDate : customEndDate
      );
      if (result.success) {
        setDashboardStats(result.data || {});
      }
    } catch (error) {
      console.error('Failed to load complaint dashboard stats:', error);
    }
  }, [timeFilter, customStartDate, customEndDate]);

  const refreshComplaints = useCallback(
    async (page, overrideTimeRange = null, overrideStartDate = undefined, overrideEndDate = undefined) => {
      page = page ?? pagination.currentPage;
      try {
        setLoading(true);
        const result = await complaintService.getMyComplaints({
          page,
          limit: 10,
          status: statusFilter,
          category: categoryFilter,
          timeRange: overrideTimeRange ?? timeFilter,
          startDate: overrideStartDate !== undefined ? overrideStartDate : customStartDate,
          endDate: overrideEndDate !== undefined ? overrideEndDate : customEndDate,
          search: searchQuery,
        });

        if (result.success) {
          setComplaints(result.data || []);
          setPagination(result.pagination || { currentPage: 1, totalPages: 1 });
        } else {
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
    [statusFilter, timeFilter, categoryFilter, searchQuery, pagination.currentPage, customStartDate, customEndDate]
  );

  useEffect(() => {
    const t = setTimeout(() => {
      refreshDashboardStats();
    }, 0);
    return () => clearTimeout(t);
  }, [refreshDashboardStats]);

  useEffect(() => {
    const t = setTimeout(() => {
      refreshComplaints(pagination.currentPage);
    }, 0);
    return () => clearTimeout(t);
  }, [refreshComplaints, pagination.currentPage]);

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
    const timer = setTimeout(() => {
      if (timeFilter === 'custom' && (!customStartDate || !customEndDate)) {
        return;
      }
      refreshDashboardStats();
      refreshComplaints(1);
    }, 0);

    return () => clearTimeout(timer);
  }, [statusFilter, categoryFilter, searchQuery, timeFilter, customStartDate, customEndDate, refreshDashboardStats, refreshComplaints]);

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
        setStatusFilter('all');
        setCategoryFilter('all');
        setTimeFilter('all');
        setCustomStartDate('');
        setCustomEndDate('');
        setSearchQuery('');
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
        await refreshDashboardStats('all', '', '');
        await refreshComplaints(1, 'all', '', '');
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

  return (
    <div className="min-h-screen bg-slate-50">
      <Header showAuth={true} />
      
      <div className="mx-auto max-w-7xl p-6 md:p-8">
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
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <Calendar className="h-4 w-4 text-slate-500" />
              <span>{formatRangeLabel({ timeFilter, customStartDate, customEndDate })}</span>
              <ChevronDown className="h-4 w-4 text-slate-500" />
            </button>

            {showTimePanel && (
              <div
                ref={timePanelRef}
                className="absolute right-0 z-50 mt-3 w-80 rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl"
              >
                <div className="space-y-3">
                  <div className="grid gap-2">
                    {timeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handlePresetFilterChange(option.value)}
                        className={`w-full rounded-2xl px-3 py-2 text-left text-sm font-medium transition ${
                          timeFilter === option.value
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  {timeFilter === 'custom' && (
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="space-y-2 text-sm font-medium text-slate-700">
                          Start date
                          <input
                            type="date"
                            value={customStartDate}
                            onChange={(event) => setCustomStartDate(event.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                          />
                        </label>
                        <label className="space-y-2 text-sm font-medium text-slate-700">
                          End date
                          <input
                            type="date"
                            value={customEndDate}
                            onChange={(event) => setCustomEndDate(event.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                          />
                        </label>
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={handleApplyCustomRange}
                          disabled={!customStartDate || !customEndDate}
                          className="inline-flex min-w-[120px] items-center justify-center rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
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
                          className="inline-flex min-w-[120px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
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

        {/* Stats Cards */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Submit Form */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
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
                  <div className="mb-6 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                    <p className="text-sm font-medium text-emerald-800">{notification}</p>
                  </div>
                )}

                {errorMessage && (
                  <div className="mb-6 flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4">
                    <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-600" />
                    <p className="text-sm font-medium text-rose-800">{errorMessage}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Complaint Title</label>
                      <input
                        type="text"
                        value={values.title}
                        onChange={(event) => handleChange('title', event.target.value)}
                        onBlur={() => handleBlur('title')}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
                        placeholder="e.g., Water leak in block C"
                      />
                      {touched.title && errors.title && (
                        <p className="text-xs text-rose-600">{errors.title}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Location</label>
                      <input
                        type="text"
                        value={values.location}
                        onChange={(event) => handleChange('location', event.target.value)}
                        onBlur={() => handleBlur('location')}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
                        placeholder="e.g., Block C, Floor 2"
                      />
                      {touched.location && errors.location && (
                        <p className="text-xs text-rose-600">{errors.location}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Category</label>
                    <select
                      value={values.category}
                      onChange={(event) => handleChange('category', event.target.value)}
                      onBlur={() => handleBlur('category')}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
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
                    <label className="text-sm font-medium text-slate-700">Description</label>
                    <textarea
                      value={values.description}
                      onChange={(event) => handleChange('description', event.target.value)}
                      onBlur={() => handleBlur('description')}
                      rows={4}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
                      placeholder="Provide detailed information about the issue..."
                    />
                    {touched.description && errors.description && (
                      <p className="text-xs text-rose-600">{errors.description}</p>
                    )}
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Urgency Level</label>
                      <select
                        value={values.urgency}
                        onChange={(event) => handleChange('urgency', event.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
                      >
                        {urgencyOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Attachment</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => handleFileChange(event.target.files?.[0] || null)}
                        className="w-full cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-slate-800 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={submitLoading}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
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
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Complaint History</h2>
                  <p className="mt-1 text-sm text-slate-600">View and filter your submissions</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2">
                  <FileText className="h-4 w-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">
                    {filteredComplaints.length} result{filteredComplaints.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <div className="mb-5 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                      setPagination((prev) => ({ ...prev, currentPage: 1 }));
                    }}
                    placeholder="Search complaints..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
                  />
                </div>
                <div className="relative flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-500" />
                  <select
                    className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
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
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
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
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loading ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"></div>
                              <p className="text-sm text-slate-600">Loading complaints...</p>
                            </div>
                          </td>
                        </tr>
                      ) : filteredComplaints.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <div className="rounded-full bg-slate-100 p-3">
                                <FileText className="h-6 w-6 text-slate-400" />
                              </div>
                              <p className="text-sm font-medium text-slate-600">No complaints found</p>
                              <p className="text-xs text-slate-500">Try adjusting your filters</p>
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
                                    className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-200"
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
                                <span className="inline-flex items-center rounded-md bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                                  {complaint.category}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${getStatusColor(complaint.status)}`}>
                                  {complaint.status.replace(/-/g, ' ')}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${getUrgencyColor(complaint.urgency)}`}>
                                  {complaint.urgency}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-slate-600">{formatDate(complaint.createdAt)}</td>
                            </tr>
                            {expandedComplaintId === complaint._id && (
                              <tr className="bg-slate-50">
                                <td colSpan={5} className="border-t border-slate-200 px-6 py-4">
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-semibold text-slate-900">History details</p>
                                      <p className="text-xs text-slate-500">{complaint.history?.length ?? 0} events</p>
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-2">
                                      {complaint.history?.map((entry, index) => (
                                        <div
                                          key={`${entry.action}-${index}`}
                                          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
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
                <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
                  <p className="text-sm text-slate-600">
                    Page <span className="font-medium text-slate-900">{pagination.currentPage}</span> of{' '}
                    <span className="font-medium text-slate-900">{pagination.totalPages}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={pagination.currentPage <= 1}
                      onClick={() => handlePageChange('prev')}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={pagination.currentPage >= pagination.totalPages}
                      onClick={() => handlePageChange('next')}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
    </div>
  );
}