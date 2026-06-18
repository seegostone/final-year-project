import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, BarChart3, Layers } from 'lucide-react';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ComplaintDetailDrawer } from './estates/ComplaintDetailDrawer';
import Header from './Header';
import StatsRow from './StatsRow';
import QueueTab from './QueueTab';
import AnalyticsTab from './AnalyticsTab';
import managementService from '../services/managementApi';

// ─── Status label map (short names for badges) ────────────────────────────────

const STATUS_LABELS = {
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

function statusLabel(s) {
  return STATUS_LABELS[s] ?? s.replace(/[_-]/g, ' ');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// formatDate and slaLabel are implemented in table components

// priority badge classes moved into table component

const STATUS_BADGE = {
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

// Small UI helpers moved into subcomponents (StatRow, ComplaintTable, etc.)

// ─── Analytics Tab ────────────────────────────────────────────────────────────

// AnalyticsTab moved to separate file (AnalyticsTab.jsx)

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function EstatesOfficerDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({});
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [queueError, setQueueError] = useState('');

  // server-side pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalComplaints, setTotalComplaints] = useState(0);

  // filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const clearFilters = () => { setSearch(''); setStatusFilter('all'); setPriorityFilter('all'); setCategoryFilter('all'); };

  // drawer
  const [selected, setSelected] = useState(null);

  // current user not required in this component
  const debounceRef = useRef(null);

  // ── fetch queue ────────────────────────────────────────────────────────────

  const fetchQueue = useCallback(async (currentPage) => {
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

      const queueData = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
          ? res.data
          : [];

      if (res.success) {
        setComplaints(queueData);
        setTotalPages(res.pagination?.totalPages ?? 1);
        setTotalComplaints(res.pagination?.totalComplaints ?? queueData.length);
        setQueueError('');
      } else {
        const message = res.error || 'Unable to fetch management queue';
        console.error('Management queue API returned failure:', message, res.type, res.status, res);
        setQueueError(`${res.type || 'ERROR'}: ${message}`);
        setComplaints([]);
        setTotalPages(1);
        setTotalComplaints(0);
      }
    } catch (error) {
      const message = error?.message || 'Failed to load management queue';
      console.error('Failed to load management queue:', error);
      setQueueError(message);
      setComplaints([]);
      setTotalPages(1);
      setTotalComplaints(0);
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
        setStats({});
      }

      // Normalize technician records from backend so UI fields match
      const normalizeTech = (t) => ({
        _id: t._id || t.id || null,
        name: t.name || t.fullName || t.user?.name || '',
        email: t.email || '',
        phone: t.phone || t.phoneNumber || '',
        role: t.role || '',
        specialization: t.specialization || t.trade || '',
        // Some parts of the UI expect `trade`/`zone` (mock data); keep them in sync
        trade: t.trade || t.specialization || '',
        zone: t.zone || '',
        avatar: t.avatar || null,
        ...t,
      });

      if (techRes.success && Array.isArray(techRes.data?.data)) {
        setTechnicians(techRes.data.data.map(normalizeTech));
      } else if (techRes.success && Array.isArray(techRes.data)) {
        setTechnicians(techRes.data.map(normalizeTech));
      } else {
        setTechnicians([]);
      }
    })();
  }, []);

  // ── re-fetch on filter/page change with search debounce ───────────────────

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchQueue(1);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, fetchQueue]);

  useEffect(() => {
    // filters changed — fetch first page (defer to avoid sync setState in effect)
    const id = setTimeout(() => fetchQueue(1), 0);
    return () => clearTimeout(id);
  }, [statusFilter, priorityFilter, categoryFilter, fetchQueue]);

  useEffect(() => {
    // defer to avoid sync setState-in-effect warning
    const id = setTimeout(() => fetchQueue(page), 0);
    return () => clearTimeout(id);
  }, [page, fetchQueue]);

  // ── handle complaint update from drawer ────────────────────────────────────

  const handleRefresh = useCallback((_id, updated) => {
    setComplaints((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
    setSelected(updated);
    // Refresh stats after state change
    managementService.getDashboardStats().then((r) => { if (r.success) setStats(r.data); });
  }, []);

  // const handleLogout = () => authService.logoutAndRedirect?.(); // not used

  // ── derived stats from current complaints list ─────────────────────────────
  const slaBreaching = complaints.filter((c) => c.slaDeadline && new Date(c.slaDeadline) < new Date() && c.status !== 'closed').length;

  return (
    <div className="min-h-screen bg-white">
      {/* ── Shared Header ── */}
      <Header onHamburgerClick={() => {}} />

      {/* ── Content Header ── */}
      <div className="sticky top-[76px] z-30 bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Management Queue</h1>
            <p className="text-sm text-slate-500 mt-0.5">Oversee complaints and workflow</p>
          </div>
          <div className="flex items-center gap-2">
            {slaBreaching > 0 && (
              <div className="flex items-center gap-1.5 bg-rose-100 border border-rose-300 rounded-full px-3 py-1 text-xs text-rose-800 font-medium">
                <AlertTriangle className="h-3 w-3" />
                {slaBreaching} SLA {slaBreaching > 1 ? 'breaches' : 'breach'}
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-screen-2xl mx-auto px-4 md:px-6 py-5">
        <StatsRow stats={stats} />

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

          <TabsContent value="queue" className="m-0">
              <QueueTab
              search={search} setSearch={setSearch}
              statusFilter={statusFilter} setStatusFilter={setStatusFilter}
              priorityFilter={priorityFilter} setPriorityFilter={setPriorityFilter}
              categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter}
              STATUSES={STATUSES} PRIO_OPTIONS={PRIORITIES} CATEGORIES={CATEGORIES}
              clearFilters={clearFilters}
              queueError={queueError}
              fetchQueue={fetchQueue}
              complaints={complaints} loading={loading} onRowClick={setSelected}
              page={page} setPage={setPage} totalPages={totalPages} totalComplaints={totalComplaints}
              STATUS_BADGE={STATUS_BADGE} statusLabel={statusLabel}
            />
          </TabsContent>

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
