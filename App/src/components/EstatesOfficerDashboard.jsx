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







import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle, Building2, CheckCircle2, Clock, Filter,
  Search, FileWarning, BarChart3, RefreshCw,
  ChevronLeft, ChevronRight, User,
  Layers, LogOut, ChevronDown, XCircle, WifiOff,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ComplaintDetailDrawer } from './estates/ComplaintDetailDrawer';
import { MOCK_COMPLAINTS, MOCK_STATS, MOCK_TECHNICIANS } from './estates/mockData';
import type { ManagedComplaint, DashboardStats, Technician } from './estates/types';
import authService from '../../services/api';
import managementService from '../../services/managementService';

// ─── Status label map (short names for badges) ────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  triaged: 'Triaged',
  analyzed: 'Analyzed',
  scope_defined: 'Scoped',
  assigned: 'Assigned',
  'in-progress': 'In Progress',
  rework_required: 'Rework',
  escalated: 'Escalated',
  closed: 'Closed',
};

function statusLabel(s: string) {
  return STATUS_LABELS[s] ?? s.replace(/[_-]/g, ' ');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function slaLabel(iso: string | null): { label: string; cls: string } {
  if (!iso) return { label: '—', cls: 'text-slate-400' };
  const diff = (new Date(iso).getTime() - Date.now()) / 3600000;
  if (diff < 0) return { label: `${Math.abs(diff).toFixed(0)}h overdue`, cls: 'text-rose-600 font-semibold' };
  if (diff < 6) return { label: `${diff.toFixed(0)}h left`, cls: 'text-orange-500 font-semibold' };
  if (diff < 24) return { label: `${diff.toFixed(0)}h left`, cls: 'text-amber-600' };
  return { label: `${(diff / 24).toFixed(1)}d left`, cls: 'text-slate-500' };
}

const PRIORITY_BADGE: Record<string, string> = {
  CRITICAL: 'bg-rose-100 text-rose-800 border-rose-300',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
  MEDIUM: 'bg-amber-100 text-amber-800 border-amber-300',
  LOW: 'bg-slate-100 text-slate-600 border-slate-200',
};

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-700 border-slate-300',
  triaged: 'bg-blue-100 text-blue-700 border-blue-300',
  analyzed: 'bg-sky-100 text-sky-700 border-sky-300',
  scope_defined: 'bg-indigo-100 text-indigo-700 border-indigo-300',
  assigned: 'bg-cyan-100 text-cyan-700 border-cyan-300',
  'in-progress': 'bg-violet-100 text-violet-700 border-violet-300',
  rework_required: 'bg-amber-100 text-amber-700 border-amber-300',
  escalated: 'bg-orange-100 text-orange-800 border-orange-300',
  closed: 'bg-emerald-100 text-emerald-700 border-emerald-300',
};

const CATEGORIES = ['all', 'Electrical', 'Plumbing', 'Cleaning', 'Safety', 'Other'];
const PRIORITIES = ['all', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'triaged', label: 'Triaged' },
  { value: 'scope_defined', label: 'Scoped' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'rework_required', label: 'Rework' },
  { value: 'escalated', label: 'Escalated' },
  { value: 'closed', label: 'Closed' },
];

const LIMIT = 8;

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ title, value, sub, icon: Icon, accent }: {
  title: string; value: number | string; sub: string;
  icon: React.ElementType; accent: string;
}) {
  return (
    <Card className="border border-slate-200 shadow-sm hover:shadow transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
        <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</CardTitle>
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${accent}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <p className="text-3xl font-bold text-slate-800 leading-none">{value}</p>
        <p className="text-xs text-slate-500 mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`
        inline-block text-xs px-2 py-0.5 rounded-full border font-medium
        whitespace-nowrap leading-tight
        ${STATUS_BADGE[status] ?? 'bg-slate-100 text-slate-600 border-slate-200'}
      `}
    >
      {statusLabel(status)}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span
      className={`
        inline-block text-xs px-2 py-0.5 rounded-full border font-medium
        whitespace-nowrap
        ${PRIORITY_BADGE[priority] ?? 'bg-slate-100 text-slate-600 border-slate-200'}
      `}
    >
      {priority}
    </span>
  );
}

// ─── Analytics Tab ────────────────────────────────────────────────────────────

function AnalyticsTab({ stats, complaints }: { stats: DashboardStats; complaints: ManagedComplaint[] }) {
  const byCategory = complaints.reduce<Record<string, number>>((acc, c) => {
    acc[c.category] = (acc[c.category] ?? 0) + 1;
    return acc;
  }, {});

  const taskStats = complaints.reduce(
    (acc, c) => {
      acc.total += c.tasks.length;
      acc.done += c.tasks.filter((t) => t.status === 'done').length;
      acc.overdue += c.tasks.filter((t) => t.status !== 'done' && t.deadline && new Date(t.deadline) < new Date()).length;
      return acc;
    },
    { total: 0, done: 0, overdue: 0 }
  );

  const bars = [
    { label: 'CRITICAL', count: stats.priorityBreakdown?.CRITICAL ?? 0, color: 'bg-rose-500' },
    { label: 'HIGH', count: stats.priorityBreakdown?.HIGH ?? 0, color: 'bg-orange-400' },
    { label: 'MEDIUM', count: stats.priorityBreakdown?.MEDIUM ?? 0, color: 'bg-amber-400' },
    { label: 'LOW', count: stats.priorityBreakdown?.LOW ?? 0, color: 'bg-slate-300' },
  ];
  const maxBar = Math.max(...bars.map((b) => b.count), 1);

  const statusEntries = Object.entries(stats.statusBreakdown ?? {}).sort((a, b) => b[1] - a[1]);
  const maxStatus = Math.max(...statusEntries.map(([, v]) => v), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 p-5">
      <Card className="lg:col-span-1 border-slate-200">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-sm font-semibold text-slate-700">By Priority</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          {bars.map(({ label, count, color }) => (
            <div key={label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 font-medium">{label}</span>
                <span className="text-slate-500">{count}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${(count / maxBar) * 100}%` }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="lg:col-span-1 border-slate-200">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-sm font-semibold text-slate-700">By Status</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          {statusEntries.map(([status, count]) => (
            <div key={status} className="flex items-center gap-2">
              <div className="h-1.5 bg-slate-100 rounded-full flex-1 overflow-hidden">
                <div className="h-full bg-[#1e3a5f] rounded-full" style={{ width: `${(count / maxStatus) * 100}%` }} />
              </div>
              <span className="text-xs text-slate-600 w-28 shrink-0">{statusLabel(status)}</span>
              <span className="text-xs font-semibold text-slate-700 w-4 text-right shrink-0">{count}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="border-slate-200">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold text-slate-700">Task Summary</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 grid grid-cols-3 gap-2">
            {[
              { label: 'Total', value: taskStats.total, cls: 'text-slate-800' },
              { label: 'Done', value: taskStats.done, cls: 'text-emerald-600' },
              { label: 'Overdue', value: taskStats.overdue, cls: 'text-rose-600' },
            ].map(({ label, value, cls }) => (
              <div key={label} className="text-center bg-slate-50 rounded-lg p-2 border border-slate-100">
                <p className={`text-xl font-bold ${cls}`}>{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold text-slate-700">By Category</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-1.5">
            {Object.entries(byCategory).map(([cat, count]) => (
              <div key={cat} className="flex justify-between items-center text-xs">
                <span className="text-slate-600">{cat}</span>
                <span className="font-semibold text-[#1e3a5f] bg-[#eef2f7] px-2 py-0.5 rounded-full">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="lg:col-span-3 border-slate-200">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-sm font-semibold text-slate-700">SLA &amp; Performance</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Complaints', value: stats.totalComplaints, cls: 'text-slate-800' },
            { label: 'SLA Breaches', value: stats.slaBreach, cls: 'text-rose-600' },
            { label: 'Avg Resolution', value: `${Number(stats.avgTimeToResolveHours ?? 0).toFixed(0)}h`, cls: 'text-[#1e3a5f]' },
            { label: 'Closed', value: stats.statusBreakdown?.closed ?? 0, cls: 'text-emerald-600' },
          ].map(({ label, value, cls }) => (
            <div key={label} className="text-center bg-slate-50 rounded-lg p-3 border border-slate-100">
              <p className={`text-2xl font-bold ${cls}`}>{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function EstatesOfficerDashboard() {
  const [complaints, setComplaints] = useState<ManagedComplaint[]>([]);
  const [stats, setStats] = useState<DashboardStats>(MOCK_STATS);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);

  // server-side pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalComplaints, setTotalComplaints] = useState(0);

  // filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // drawer
  const [selected, setSelected] = useState<ManagedComplaint | null>(null);

  const user = authService.getCurrentUserFromStorage?.() ?? { name: 'Estates Officer', email: '' };
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── fetch queue ────────────────────────────────────────────────────────────

  const fetchQueue = useCallback(async (currentPage: number) => {
    setLoading(true);
    try {
      const res = await managementService.getQueue({
        status: statusFilter,
        priority: priorityFilter,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        search: search || undefined,
        page: currentPage,
        limit: LIMIT,
      });

      if (res.success && res.data?.data) {
        setComplaints(res.data.data);
        setTotalPages(res.data.pagination?.totalPages ?? 1);
        setTotalComplaints(res.data.pagination?.totalComplaints ?? res.data.data.length);
        setUsingMock(false);
      } else {
        // API not reachable — fall back to mock with client-side filtering
        const filtered = MOCK_COMPLAINTS.filter((c) => {
          if (statusFilter !== 'all' && c.status !== statusFilter) return false;
          if (priorityFilter !== 'all' && c.priority !== priorityFilter) return false;
          if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
          if (search) {
            const q = search.toLowerCase();
            return c.title.toLowerCase().includes(q) || c.location.toLowerCase().includes(q) ||
              c.complaintId.toLowerCase().includes(q) || (c.user?.name?.toLowerCase().includes(q) ?? false);
          }
          return true;
        });
        const start = (currentPage - 1) * LIMIT;
        setComplaints(filtered.slice(start, start + LIMIT));
        setTotalPages(Math.max(1, Math.ceil(filtered.length / LIMIT)));
        setTotalComplaints(filtered.length);
        setUsingMock(true);
      }
    } catch {
      setComplaints(MOCK_COMPLAINTS.slice(0, LIMIT));
      setTotalPages(Math.ceil(MOCK_COMPLAINTS.length / LIMIT));
      setTotalComplaints(MOCK_COMPLAINTS.length);
      setUsingMock(true);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, categoryFilter, search]);

  // ── fetch stats + technicians (once on mount) ──────────────────────────────

  useEffect(() => {
    (async () => {
      const [statsRes, techRes] = await Promise.all([
        managementService.getDashboardStats(),
        managementService.getTechnicians(),
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      } else {
        setStats(MOCK_STATS);
      }

      if (techRes.success && Array.isArray(techRes.data?.data)) {
        setTechnicians(techRes.data.data);
      } else if (techRes.success && Array.isArray(techRes.data)) {
        setTechnicians(techRes.data);
      } else {
        setTechnicians(MOCK_TECHNICIANS);
      }
    })();
  }, []);

  // ── re-fetch on filter/page change with search debounce ───────────────────

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchQueue(1);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  useEffect(() => {
    setPage(1);
    fetchQueue(1);
  }, [statusFilter, priorityFilter, categoryFilter]);

  useEffect(() => {
    fetchQueue(page);
  }, [page]);

  // ── handle complaint update from drawer ────────────────────────────────────

  const handleRefresh = useCallback((_id: string, updated: ManagedComplaint) => {
    setComplaints((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
    setSelected(updated);
    // Refresh stats after state change
    managementService.getDashboardStats().then((r) => { if (r.success) setStats(r.data); });
  }, []);

  const handleLogout = () => authService.logoutAndRedirect?.();

  // ── derived stats from current complaints list ─────────────────────────────
  const slaBreaching = complaints.filter((c) => c.slaDeadline && new Date(c.slaDeadline) < new Date() && c.status !== 'closed').length;

  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      {/* ── Header ── */}
      <header className="bg-[#1e3a5f] text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-6">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-white/15 rounded-lg flex items-center justify-center shrink-0">
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-none">Estates Department</p>
                <p className="text-xs text-blue-200 leading-none mt-0.5">Makerere University · Officer Portal</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {usingMock && (
                <div className="hidden sm:flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/40 rounded-full px-3 py-1 text-xs text-amber-200">
                  <WifiOff className="h-3 w-3" /> Demo mode
                </div>
              )}
              {slaBreaching > 0 && (
                <div className="hidden sm:flex items-center gap-1.5 bg-rose-500/20 border border-rose-400/40 rounded-full px-3 py-1 text-xs text-rose-200 font-medium">
                  <AlertTriangle className="h-3 w-3" />
                  {slaBreaching} SLA {slaBreaching > 1 ? 'breaches' : 'breach'}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-sm text-blue-100 cursor-default">
                <div className="h-7 w-7 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                  <User className="h-3.5 w-3.5" />
                </div>
                <span className="hidden sm:inline text-sm">{user?.name ?? 'Officer'}</span>
                <ChevronDown className="h-3 w-3 text-blue-300" />
              </div>
              <Button
                variant="ghost" size="sm"
                className="text-blue-200 hover:text-white hover:bg-white/10 h-7 px-2"
                onClick={handleLogout}
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-4 md:px-6 py-5">
        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
          <StatCard title="Total" value={stats.totalComplaints} sub="All complaints" icon={Layers} accent="bg-[#eef2f7] text-[#1e3a5f]" />
          <StatCard
            title="Pending"
            value={(stats.statusBreakdown?.pending ?? 0) + (stats.statusBreakdown?.triaged ?? 0)}
            sub="Awaiting action" icon={Clock} accent="bg-blue-50 text-blue-600"
          />
          <StatCard
            title="In Progress"
            value={
              (stats.statusBreakdown?.assigned ?? 0) +
              (stats.statusBreakdown?.['in-progress'] ?? 0) +
              (stats.statusBreakdown?.scope_defined ?? 0) +
              (stats.statusBreakdown?.rework_required ?? 0)
            }
            sub="Active work" icon={RefreshCw} accent="bg-violet-50 text-violet-600"
          />
          <StatCard title="SLA Breaches" value={stats.slaBreach} sub="Overdue" icon={FileWarning} accent="bg-rose-50 text-rose-600" />
          <StatCard title="Closed" value={stats.statusBreakdown?.closed ?? 0} sub="Resolved & closed" icon={CheckCircle2} accent="bg-emerald-50 text-emerald-600" />
        </div>

        {/* ── Tabs ── */}
        <Tabs defaultValue="queue">
          <div className="flex items-center justify-between mb-3 gap-3">
            <TabsList className="bg-white border border-slate-200 shadow-sm h-9 shrink-0">
              <TabsTrigger value="queue" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white h-7 px-4 text-sm">
                <Layers className="h-3.5 w-3.5 mr-1.5" />Queue
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white h-7 px-4 text-sm">
                <BarChart3 className="h-3.5 w-3.5 mr-1.5" />Analytics
              </TabsTrigger>
            </TabsList>
            <span className="text-xs text-slate-400 shrink-0">{totalComplaints} total</span>
          </div>

          {/* ── Queue Tab ── */}
          <TabsContent value="queue" className="m-0">
            <Card className="border-slate-200 shadow-sm">
              {/* Filter bar */}
              <div className="p-4 border-b border-slate-100">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    <Input
                      placeholder="Search ID, title, location, submitter…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 h-8 text-sm bg-slate-50 border-slate-200"
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap shrink-0">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-8 w-[150px] text-xs bg-slate-50 border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                      <SelectTrigger className="h-8 w-[130px] text-xs bg-slate-50 border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p} className="text-xs">
                            {p === 'all' ? 'All Priorities' : p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="h-8 w-[130px] text-xs bg-slate-50 border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c} className="text-xs">
                            {c === 'all' ? 'All Categories' : c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {(search || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all') && (
                      <Button
                        variant="ghost" size="sm" className="h-8 px-2 text-xs text-slate-500 hover:text-slate-800"
                        onClick={() => { setSearch(''); setStatusFilter('all'); setPriorityFilter('all'); setCategoryFilter('all'); }}
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" />Clear
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70">
                      {[
                        { label: 'ID', w: 'w-[90px]' },
                        { label: 'Complaint', w: 'min-w-[200px]' },
                        { label: 'Submitted by', w: 'w-[140px]' },
                        { label: 'Category', w: 'w-[110px]' },
                        { label: 'Priority', w: 'w-[90px]' },
                        { label: 'Status', w: 'w-[110px]' },
                        { label: 'SLA', w: 'w-[110px]' },
                        { label: 'Tasks', w: 'w-[80px]' },
                        { label: 'Submitted', w: 'w-[100px]' },
                      ].map(({ label, w }) => (
                        <th
                          key={label}
                          className={`text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap ${w}`}
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={9} className="text-center py-14 text-slate-400 text-sm">
                          <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-slate-300" />
                          Loading complaints…
                        </td>
                      </tr>
                    ) : complaints.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-14 text-slate-400 text-sm">
                          <Filter className="h-8 w-8 mx-auto mb-2 text-slate-200" />
                          No complaints match your filters
                        </td>
                      </tr>
                    ) : (
                      complaints.map((c) => {
                        const sla = slaLabel(c.slaDeadline ?? null);
                        const doneTasks = c.tasks.filter((t) => t.status === 'done').length;
                        const overdueTasks = c.tasks.filter((t) => t.status !== 'done' && t.deadline && new Date(t.deadline) < new Date()).length;
                        const isSlaBreached = c.slaDeadline && new Date(c.slaDeadline) < new Date() && c.status !== 'closed';

                        return (
                          <tr
                            key={c._id}
                            onClick={() => setSelected(c)}
                            className={`
                              border-b border-slate-100 cursor-pointer transition-colors
                              hover:bg-[#eef2f7]/70
                              ${isSlaBreached ? 'bg-rose-50/25' : ''}
                            `}
                          >
                            {/* ID */}
                            <td className="px-4 py-3">
                              <span className="font-mono text-xs text-[#1e3a5f] font-bold">{c.complaintId}</span>
                            </td>
                            {/* Title */}
                            <td className="px-4 py-3">
                              <p className="font-medium text-slate-800 leading-tight line-clamp-1 max-w-[280px]">{c.title}</p>
                              <p className="text-xs text-slate-400 line-clamp-1 mt-0.5 max-w-[280px]">{c.location}</p>
                            </td>
                            {/* Submitter */}
                            <td className="px-4 py-3">
                              <p className="text-xs text-slate-600 line-clamp-1 max-w-[130px]">{c.user?.name ?? '—'}</p>
                            </td>
                            {/* Category */}
                            <td className="px-4 py-3">
                              <span className="text-xs text-slate-600 bg-slate-100 border border-slate-200 rounded px-2 py-0.5 whitespace-nowrap">
                                {c.category}
                              </span>
                            </td>
                            {/* Priority */}
                            <td className="px-4 py-3">
                              <PriorityBadge priority={c.priority} />
                            </td>
                            {/* Status */}
                            <td className="px-4 py-3">
                              <StatusBadge status={c.status} />
                            </td>
                            {/* SLA */}
                            <td className="px-4 py-3">
                              {c.slaDeadline ? (
                                <span className={`text-xs flex items-center gap-1 whitespace-nowrap ${sla.cls}`}>
                                  {isSlaBreached
                                    ? <AlertTriangle className="h-3 w-3 shrink-0" />
                                    : <Clock className="h-3 w-3 shrink-0" />}
                                  {sla.label}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-300">—</span>
                              )}
                            </td>
                            {/* Tasks */}
                            <td className="px-4 py-3">
                              {c.tasks.length > 0 ? (
                                <div className="flex items-center gap-1.5 whitespace-nowrap">
                                  <span className="text-xs text-slate-600 font-medium">{doneTasks}/{c.tasks.length}</span>
                                  {overdueTasks > 0 && (
                                    <span className="text-xs text-rose-600 flex items-center gap-0.5">
                                      <AlertTriangle className="h-2.5 w-2.5" />{overdueTasks}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-300">—</span>
                              )}
                            </td>
                            {/* Date */}
                            <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                              {formatDate(c.createdAt)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Page {page} of {totalPages} · {totalComplaints} complaint{totalComplaints !== 1 ? 's' : ''}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline" size="sm" className="h-7 px-3 text-xs"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-3 w-3 mr-0.5" />Prev
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        onClick={() => setPage(n)}
                        disabled={loading}
                        className={`h-7 w-7 text-xs rounded-md transition-colors ${
                          n === page ? 'bg-[#1e3a5f] text-white font-semibold' : 'text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                    {totalPages > 7 && <span className="text-xs text-slate-400 px-1">…{totalPages}</span>}
                  </div>
                  <Button
                    variant="outline" size="sm" className="h-7 px-3 text-xs"
                    disabled={page >= totalPages || loading}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next<ChevronRight className="h-3 w-3 ml-0.5" />
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* ── Analytics Tab ── */}
          <TabsContent value="analytics" className="m-0">
            <Card className="border-slate-200 shadow-sm">
              <AnalyticsTab stats={stats} complaints={complaints} />
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Detail Drawer */}
      <ComplaintDetailDrawer
        complaint={selected}
        technicians={technicians}
        onClose={() => setSelected(null)}
        onRefresh={handleRefresh}
      />
    </div>
  );
}
