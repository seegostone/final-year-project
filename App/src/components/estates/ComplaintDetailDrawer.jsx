import { useCallback, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs.jsx';
import { Button } from '../ui/button.jsx';
import { Progress } from '../ui/progress.jsx';
import { Alert, AlertDescription } from '../ui/alert.jsx';
import {
  AlertTriangle, CheckCircle2, Clock, User, MapPin, Tag, Calendar,
  Wrench, Plus, AlertCircle, ChevronRight, RotateCcw, TrendingUp,
  ClipboardList, History, RefreshCw, Loader2,
} from 'lucide-react';
import {
  DefineScopeModal, CreateTaskModal, AssignTaskModal,
  RequestReworkModal, EscalateModal, CloseComplaintModal,
} from './EstatesModals';
import managementService from '../../services/managementApi';
import complaintService from '../../services/complaintsApi';
import axiosInstance from '../../services/axios';import { emitTaskUnassigned } from '../../utils/eventBus';
// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatDateTime(iso) {
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
function isOverdue(deadline, status) {
  return status !== 'done' && new Date(deadline) < new Date();
}
function daysUntil(iso) {
  return (new Date(iso).getTime() - Date.now()) / 86400000;
}

const PRIORITY_COLORS = {
  CRITICAL: 'bg-rose-100 text-rose-800 border-rose-300',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
  MEDIUM: 'bg-amber-100 text-amber-800 border-amber-300',
  LOW: 'bg-slate-100 text-slate-700 border-slate-300',
};

const STATUS_COLORS = {
  pending: 'bg-slate-100 text-slate-700 border-slate-300',
  triaged: 'bg-blue-100 text-blue-700 border-blue-300',
  scope_defined: 'bg-indigo-100 text-indigo-700 border-indigo-300',
  assigned: 'bg-cyan-100 text-cyan-700 border-cyan-300',
  'in-progress': 'bg-violet-100 text-violet-700 border-violet-300',
  rework_required: 'bg-amber-100 text-amber-700 border-amber-300',
  escalated: 'bg-orange-100 text-orange-800 border-orange-300',
  closed: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  analyzed: 'bg-sky-100 text-sky-700 border-sky-300',
};

const STATUS_LABELS = {
  pending: 'Pending', triaged: 'Triaged', analyzed: 'Analyzed',
  scope_defined: 'Scoped', assigned: 'Assigned', 'in-progress': 'In Progress',
  rework_required: 'Rework', escalated: 'Escalated', closed: 'Closed',
};

const TASK_STATUS_DISPLAY = {
  open: { label: 'Open', color: 'bg-slate-100 text-slate-600' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  done: { label: 'Done', color: 'bg-emerald-100 text-emerald-700' },
  blocked: { label: 'Blocked', color: 'bg-rose-100 text-rose-700' },
};

function TaskDeadlineChip({ task }) {
  const overdue = task.deadline ? isOverdue(task.deadline, task.status) : false;
  const days = task.deadline ? daysUntil(task.deadline) : null;

  if (task.status === 'done') {
    return <span className="inline-flex items-center gap-1 text-xs text-emerald-700 whitespace-nowrap"><CheckCircle2 className="h-3 w-3" />Done</span>;
  }
  if (overdue) {
    return <span className="inline-flex items-center gap-1 text-xs text-rose-700 font-semibold whitespace-nowrap"><AlertTriangle className="h-3 w-3" />Overdue {days !== null ? Math.abs(days).toFixed(1) : ''}d</span>;
  }
  if (days !== null && days < 1) {
    return <span className="inline-flex items-center gap-1 text-xs text-orange-600 font-semibold whitespace-nowrap"><Clock className="h-3 w-3" />&lt;24h left</span>;
  }
  return <span className="inline-flex items-center gap-1 text-xs text-slate-500 whitespace-nowrap"><Calendar className="h-3 w-3" />{days !== null ? days.toFixed(1) : '—'}d left</span>;
}

// ─── Drawer ───────────────────────────────────────────────────────────────────

export function ComplaintDetailDrawer({ complaint: complaint, technicians, onClose, onRefresh }) {
  const [activeModal, setActiveModal] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const refreshComplaintData = useCallback(async () => {
    if (!complaint || !complaint._id) return null;
    try {
      const res = await complaintService.getComplaintById(complaint._id);
      if (res.success && res.data) {
        onRefresh(complaint._id, res.data);
        return res.data;
      }
    } catch (err) {
      console.error('Failed to refresh complaint:', err);
    }
    return null;
  }, [complaint, onRefresh]);

  if (!complaint) return null;

  const tasks = complaint.tasks ?? [];
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const totalTasks = tasks.length;
  const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const overdueTasks = tasks.filter((t) => t.deadline && isOverdue(t.deadline, t.status));
  const scopeUsed = tasks.reduce((s, t) => s + (t.estimatedDurationDays ?? 0), 0);
  const scopeTotal = complaint.scopeDefinition?.estimatedDuration ?? 0;
  const scopePercent = scopeTotal > 0 ? Math.min(100, (scopeUsed / scopeTotal) * 100) : 0;

  const canDefineScope = ['pending', 'triaged', 'analyzed'].includes(complaint.status) && !complaint.scopeDefinition;
  const canCreateTask = !!complaint.scopeDefinition && !['closed'].includes(complaint.status);
  const canRework = ['in-progress', 'assigned', 'scope_defined'].includes(complaint.status) && (complaint.reworkCount ?? 0) < 2;
  const canEscalate = !['closed', 'escalated'].includes(complaint.status);
  const canClose = !['closed', 'pending'].includes(complaint.status);

  const badgePriority = complaint.priority ?? null;
  const rawImagePath = complaint.attachments?.[0]?.url ?? complaint.imageData ?? null;
  const backendOrigin = axiosInstance.defaults.baseURL.replace(/\/api\/?$/, '');
  const attachmentUrl = rawImagePath ?
    rawImagePath.startsWith('http') ? rawImagePath : `${backendOrigin}${rawImagePath}` :
    null;

  const callApi = async (fn, optimisticUpdate = null, onSuccess = null) => {
    setActionLoading(true);
    setApiError(null);
    try {
      const res = await fn();
      if (res.success) {
        if (typeof onSuccess === 'function') {
          onSuccess(res.data);
        }
        await refreshComplaintData();
        return res;
      }
      if (typeof optimisticUpdate === 'function') {
        const optimistic = optimisticUpdate(res.data ?? {});
        onRefresh(complaint._id, optimistic);
      }
      return res;
    } catch (err) {
      console.error('API call failed:', err);
      setApiError('Action could not be completed. Please try again.');
      return { success: false };
    } finally {
      setActionLoading(false);
    }
  };

  const handleDefineScope = async (_id, data) => {
    await callApi(
      () => managementService.defineScopeComplaint(_id, {
        scopeDescription: data.scopeDescription,
        estimatedDuration: data.estimatedDuration,
        requiredSkills: data.requiredSkills,
        estimatedCost: data.estimatedCost,
      }),
      () => ({
        ...complaint,
        status: 'scope_defined',
        scopeDefinition: {
          description: data.scopeDescription,
          estimatedDuration: data.estimatedDuration,
          requiredSkills: data.requiredSkills,
          estimatedCost: data.estimatedCost,
        },
      })
    );
  };

  const handleCreateTask = async (_id, data) => {
    await callApi(
      () => managementService.createTask(_id, {
        title: data.title,
        description: data.description,
        priority: data.priority,
        estimatedDurationDays: data.estimatedDurationDays,
        startDate: data.startDate,
        notes: data.notes,
        assigneeId: data.assigneeId,
        assigneeName: data.assigneeName,
      }),
      () => {
        // Create an optimistic task representation that includes a human-friendly taskCode
        const nextNumber = (complaint.tasks ?? []).length + 1;
        const complaintLabel = complaint.complaintId || 'CMP-000';
        const optimisticTaskCode = `${complaintLabel}-TASK-${String(nextNumber).padStart(3, '0')}`;

        const newTask = {
          _id: `task_${Date.now()}`,
          taskNumber: nextNumber,
          taskCode: optimisticTaskCode,
          title: data.title,
          description: data.description,
          status: 'open',
          priority: data.priority,
          estimatedDurationDays: data.estimatedDurationDays,
          startDate: data.startDate,
          deadline: data.deadline,
          completedAt: null,
          assigneeId: data.assigneeId,
          assigneeName: data.assigneeName,
          assignedAt: data.assigneeId ? new Date().toISOString() : null,
          notes: data.notes,
          createdAt: new Date().toISOString(),
        };

        return { ...complaint, tasks: [...(complaint.tasks ?? []), newTask] };
      }
    );
  };

  const handleAssignTask = async (_complaintId, taskId, data) => {
    await callApi(
      () => managementService.assignTask(_complaintId, taskId, data),
      () => ({
        ...complaint,
        tasks: (complaint.tasks ?? []).map((t) =>
          t._id === taskId ? { ...t, assigneeId: data.technicianId, assigneeName: data.technicianName, assignedAt: new Date().toISOString() } : t
        ),
      })
    );
  };

  const handleUnassignTask = async (_complaintId, taskId) => {
    const confirmed = window.confirm('Unassign technician from this task? This will reopen the task.');
    if (!confirmed) return;

    await callApi(
      () => managementService.unassignTask(_complaintId, taskId),
      null,
      () => {
        emitTaskUnassigned(taskId, _complaintId);
      }
    );
  };

  const handleRework = async (_id, data) => {
    await callApi(
      () => managementService.requestRework(_id, data),
      () => ({ ...complaint, status: 'rework_required', reworkCount: (complaint.reworkCount ?? 0) + 1 })
    );
  };

  const handleEscalate = async (_id, data) => {
    await callApi(
      () => managementService.escalateComplaint(_id, data),
      () => ({
        ...complaint,
        status: 'escalated',
        escalation: { status: 'ESCALATED', reason: data.escalationReason, escalatedAt: new Date().toISOString() },
      })
    );
  };

  const handleClose = async (_id, data) => {
    await callApi(
      () => managementService.closeComplaint(_id, data),
      () => ({ ...complaint, status: 'closed' })
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <Sheet open={!!complaint} onOpenChange={(v) => !v && onClose()}>
        <SheetContent side="right" className="w-full sm:max-w-xl lg:max-w-2xl flex flex-col overflow-hidden p-0">
          {/* Header */}
          <div className="bg-[#e8fbf4] text-slate-900 px-5 py-4 shrink-0 border-b border-slate-200">
            <SheetHeader>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-1.5 mb-1.5">
                    <span className="font-mono text-xs text-slate-500">{complaint.complaintId}</span>
                    <span
                      className={`
                        text-xs px-2 py-0.5 rounded-full border font-medium whitespace-nowrap
                        ${STATUS_COLORS[complaint.status] ?? 'bg-slate-100 text-slate-700 border-slate-300'}
                      `}
                    >
                      {STATUS_LABELS[complaint.status] ?? complaint.status.replace(/[_-]/g, ' ')}
                    </span>
                    {badgePriority ? (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${PRIORITY_COLORS[badgePriority]}`}
                      >
                        {badgePriority}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </div>
                  <SheetTitle className="text-slate-900 leading-tight text-base">{complaint.title}</SheetTitle>
                  <p className="text-slate-600 text-xs mt-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="line-clamp-1">{complaint.location}</span>
                  </p>
                </div>
                {actionLoading && <Loader2 className="h-4 w-4 animate-spin text-slate-500 shrink-0 mt-1" />}
              </div>
            </SheetHeader>

            {/* API error alert */}
            {apiError && (
              <Alert className="mt-3 border-rose-400/40 bg-rose-500/20">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-300" />
                <AlertDescription className="text-rose-200 text-xs">{apiError}</AlertDescription>
              </Alert>
            )}

            {/* Action toolbar */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {canDefineScope && (
                <Button size="sm" variant="outline"
                  className="h-7 text-xs rounded-md border border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100"
                  onClick={() => setActiveModal('scope')} disabled={actionLoading}>
                  <ClipboardList className="h-3 w-3 mr-1" />Define Scope
                </Button>
              )}
              {canCreateTask && (
                <Button size="sm" variant="outline"
                  className="h-7 text-xs rounded-md border border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100"
                  onClick={() => setActiveModal('createTask')} disabled={actionLoading}>
                  <Plus className="h-3 w-3 mr-1" />New Task
                </Button>
              )}
              {canRework && (
                <Button size="sm" variant="outline"
                  className="h-7 text-xs rounded-md border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                  onClick={() => setActiveModal('rework')} disabled={actionLoading}>
                  <RotateCcw className="h-3 w-3 mr-1" />Rework
                </Button>
              )}
              {canEscalate && (
                <Button size="sm" variant="outline"
                  className="h-7 text-xs rounded-md border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
                  onClick={() => setActiveModal('escalate')} disabled={actionLoading}>
                  <TrendingUp className="h-3 w-3 mr-1" />Escalate
                </Button>
              )}
              {canClose && (
                <Button size="sm" variant="outline"
                  className="h-7 text-xs rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  onClick={() => setActiveModal('close')} disabled={actionLoading}>
                  <CheckCircle2 className="h-3 w-3 mr-1" />Close
                </Button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="details">
              <TabsList className="w-full rounded-none border-b h-11 bg-white justify-start px-2 gap-0">
                {[
                  { value: 'details', label: 'Details' },
                  {
                    value: 'tasks', label: 'Tasks',
                    badge: overdueTasks.length > 0 ? overdueTasks.length : totalTasks > 0 ? totalTasks : null,
                    badgeClass: overdueTasks.length > 0 ? 'bg-rose-500' : 'bg-[#1e3a5f]',
                  },
                  { value: 'history', label: 'History' },
                ].map(({ value, label, badge, badgeClass }) => (
                  <TabsTrigger
                    key={value} value={value}
                    className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-[#1e3a5f] data-[state=active]:text-[#1e3a5f] data-[state=active]:shadow-none px-4 gap-1.5 h-11"
                  >
                    {label}
                    {badge !== null && badge !== undefined && (
                      <span className={`text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 ${badgeClass}`}>
                        {badge}
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* ── Details Tab ── */}
              <TabsContent value="details" className="p-5 space-y-5 m-0">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Tag, label: 'Category', value: complaint.category },
                    { icon: AlertCircle, label: 'Urgency', value: complaint.urgency },
                    { icon: User, label: 'Submitted by', value: complaint.user?.name ?? complaint.history?.find((h) => h.action === 'submitted')?.byName ?? '—' },
                    { icon: Calendar, label: 'Date submitted', value: formatDate(complaint.createdAt) },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                        <Icon className="h-3 w-3" />{label}
                      </div>
                      <p className="text-sm font-medium text-slate-800">{value}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Description</h4>
                  <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-lg p-3 border border-slate-100">
                    {complaint.description}
                  </p>
                </div>

                {attachmentUrl && (
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                    <img src={attachmentUrl} alt="Complaint attachment" className="w-full h-auto object-contain" />
                  </div>
                )}

                {complaint.slaDeadline && (
                  <div className={`rounded-lg p-3 border ${new Date(complaint.slaDeadline) < new Date() ? 'bg-rose-50 border-rose-200' : 'bg-sky-50 border-sky-200'}`}>
                    <div className="flex items-center gap-2">
                      {new Date(complaint.slaDeadline) < new Date()
                        ? <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                        : <Clock className="h-4 w-4 text-sky-600 shrink-0" />}
                      <div>
                        <p className={`text-xs font-semibold ${new Date(complaint.slaDeadline) < new Date() ? 'text-rose-700' : 'text-sky-700'}`}>
                          {new Date(complaint.slaDeadline) < new Date() ? 'SLA BREACHED' : 'SLA Deadline'}
                        </p>
                        <p className="text-sm font-medium text-slate-800">{formatDateTime(complaint.slaDeadline)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {complaint.scopeDefinition ? (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Scope Definition</h4>
                    <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100 space-y-2">
                      <p className="text-sm text-slate-700">{complaint.scopeDefinition.description}</p>
                      <div className="flex flex-wrap gap-3 text-xs">
                        <span className="text-indigo-700 font-medium">⏱ {complaint.scopeDefinition.estimatedDuration} days total</span>
                        <span className="text-indigo-700 font-medium">💰 UGX {complaint.scopeDefinition.estimatedCost.toLocaleString()}</span>
                      </div>
                      {complaint.scopeDefinition.requiredSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {complaint.scopeDefinition.requiredSkills.map((s) => (
                            <span key={s} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">{s}</span>
                          ))}
                        </div>
                      )}
                      {totalTasks > 0 && (
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-600">Scope used: {scopeUsed.toFixed(1)} / {scopeTotal} days</span>
                            <span className={scopePercent > 90 ? 'text-rose-600 font-semibold' : 'text-slate-500'}>{scopePercent.toFixed(0)}%</span>
                          </div>
                          <Progress value={scopePercent} className="h-1.5" />
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg p-4 text-center">
                    <ClipboardList className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Scope not yet defined</p>
                    {canDefineScope && (
                      <Button size="sm" className="mt-2 bg-[#1e3a5f] hover:bg-[#16304f] text-white" onClick={() => setActiveModal('scope')}>
                        Define Scope Now
                      </Button>
                    )}
                  </div>
                )}

                {complaint.assignment && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Lead Assignment</h4>
                    <div className="bg-cyan-50 rounded-lg p-3 border border-cyan-100 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-cyan-100 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-cyan-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{complaint.assignment.technicianName}</p>
                        <p className="text-xs text-slate-500">Assigned {formatDate(complaint.assignment.assignedAt)}</p>
                      </div>
                      {complaint.assignment.confirmed && (
                        <span className="ml-auto text-xs text-emerald-700 flex items-center gap-1 whitespace-nowrap shrink-0">
                          <CheckCircle2 className="h-3 w-3" />Confirmed
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {complaint.escalation && (
                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-orange-600 shrink-0" />
                      <span className="text-sm font-semibold text-orange-800">Escalated</span>
                    </div>
                    <p className="text-xs text-orange-700">
                      {complaint.escalation.reason.replace(/_/g, ' ')} · {formatDate(complaint.escalation.escalatedAt)}
                    </p>
                  </div>
                )}

                {(complaint.reworkCount ?? 0) > 0 && (
                  <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-amber-600 shrink-0" />
                      <span className="text-sm font-semibold text-amber-800">Rework Cycle {complaint.reworkCount}/2</span>
                    </div>
                    {complaint.reworkHistory?.[complaint.reworkHistory.length - 1] && (
                      <p className="text-xs text-amber-700 mt-1">{complaint.reworkHistory[complaint.reworkHistory.length - 1].feedback}</p>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* ── Tasks Tab ── */}
              <TabsContent value="tasks" className="p-5 space-y-3 m-0">
                {totalTasks > 0 && (
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">{completedTasks} of {totalTasks} tasks complete</span>
                      <span className="font-semibold text-[#1e3a5f]">{taskProgress}%</span>
                    </div>
                    <Progress value={taskProgress} className="h-2" />
                    {overdueTasks.length > 0 && (
                      <p className="text-xs text-rose-600 flex items-center gap-1 font-medium">
                        <AlertTriangle className="h-3 w-3" />{overdueTasks.length} task{overdueTasks.length > 1 ? 's' : ''} overdue
                      </p>
                    )}
                  </div>
                )}

                {canCreateTask && (
                  <Button size="sm" variant="outline"
                    className="w-full border-dashed border-[#1e3a5f]/40 text-[#1e3a5f] hover:bg-[#eef2f7]"
                    onClick={() => setActiveModal('createTask')} disabled={actionLoading}>
                    <Plus className="h-3.5 w-3.5 mr-1.5" />Add New Task
                  </Button>
                )}

                {tasks.length === 0 ? (
                  <div className="text-center py-10">
                    <Wrench className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">No tasks yet</p>
                    {!complaint.scopeDefinition && (
                      <p className="text-xs text-slate-400 mt-1">Define scope first to enable task creation</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tasks.map((task) => {
                      // Build readable task code: prefer stored `taskCode`, then `taskNumber` with complaint label, otherwise fallback to string id
                      let displayTaskCode = null;
                      if (task.taskCode) {
                        displayTaskCode = task.taskCode;
                      } else if (typeof task.taskNumber === 'number' || task.taskNumber) {
                        const complaintLabel = complaint.complaintId || 'CMP-000';
                        displayTaskCode = `${complaintLabel}-TASK-${String(task.taskNumber).padStart(3, '0')}`;
                      } else {
                        displayTaskCode = task._id?.toString();
                      }
                      const taskOverdue = task.deadline ? isOverdue(task.deadline, task.status) : false;
                      const ts = TASK_STATUS_DISPLAY[task.status] ?? { label: task.status, color: 'bg-slate-100 text-slate-600' };
                      return (
                        <div
                          key={task._id}
                          className={`rounded-lg border p-3 transition-colors ${
                            taskOverdue ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-slate-800 leading-tight">{task.title}</span>
                                <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                  {displayTaskCode}
                                </span>
                                <span className={`text-xs px-1.5 py-0.5 rounded whitespace-nowrap ${ts.color}`}>{ts.label}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded border whitespace-nowrap ${PRIORITY_COLORS[task.priority] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                  {task.priority}
                                </span>
                              </div>
                              {task.description && (
                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{task.description}</p>
                              )}
                              <div className="flex flex-wrap items-center gap-3 mt-2">
                                <span className="text-xs text-slate-500 flex items-center gap-1 whitespace-nowrap">
                                  <Clock className="h-3 w-3" />{task.estimatedDurationDays}d
                                </span>
                                {(task.assigneeName || task.assigneeId) ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                      <User className="h-3 w-3 shrink-0" />
                                      <span className="truncate max-w-[120px]">
                                        {task.assigneeName ?? (technicians.find((t) => t._id === task.assigneeId)?.name ?? 'Assigned')}
                                      </span>
                                    </span>
                                    <button
                                      className="text-xs text-rose-600 hover:underline whitespace-nowrap"
                                      onClick={() => handleUnassignTask(complaint._id, task._id)}
                                    >
                                      Unassign
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    className="text-xs text-[#1e3a5f] underline hover:no-underline whitespace-nowrap"
                                    onClick={() => { setSelectedTask(task); setActiveModal('assignTask'); }}
                                  >
                                    Assign technician
                                  </button>
                                )}
                                {task.deadline && (
                                  <span className="text-xs text-slate-400 whitespace-nowrap">Due {formatDate(task.deadline)}</span>
                                )}
                              </div>
                            </div>
                            <div className="shrink-0">
                              <TaskDeadlineChip task={task} />
                            </div>
                          </div>
                          {task.notes && (
                            <p className="text-xs text-slate-500 mt-2 bg-slate-100 rounded px-2 py-1 italic">{task.notes}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* ── History Tab ── */}
              <TabsContent value="history" className="p-5 m-0">
                {(!complaint.history || complaint.history.length === 0) ? (
                  <div className="text-center py-10">
                    <History className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">No history recorded yet</p>
                  </div>
                ) : (
                  <div className="relative pl-2">
                    <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200" />
                    <div className="space-y-4">
                      {[...complaint.history].reverse().map((entry, i) => (
                        <div key={i} className="flex gap-4 relative">
                          <div className="h-7 w-7 rounded-full bg-[#1e3a5f] flex-shrink-0 flex items-center justify-center z-10">
                            <ChevronRight className="h-3 w-3 text-white" />
                          </div>
                          <div className="pb-2 min-w-0">
                            <p className="text-sm font-medium text-slate-800 capitalize">
                              {entry.action.replace(/_/g, ' ')}
                            </p>
                            <p className="text-xs text-slate-500">{entry.byName} · {formatDateTime(entry.at)}</p>
                            {entry.note && <p className="text-xs text-slate-600 mt-1 italic">{entry.note}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      {/* Modals */}
      <DefineScopeModal open={activeModal === 'scope'} complaint={complaint} onClose={() => setActiveModal(null)} onSubmit={handleDefineScope} />
      <CreateTaskModal open={activeModal === 'createTask'} complaint={complaint} technicians={technicians} onClose={() => setActiveModal(null)} onSubmit={handleCreateTask} />
      <AssignTaskModal open={activeModal === 'assignTask'} task={selectedTask} complaint={complaint} technicians={technicians}
        onClose={() => { setActiveModal(null); setSelectedTask(null); }} onSubmit={handleAssignTask} onUnassign={handleUnassignTask} />
      <RequestReworkModal open={activeModal === 'rework'} complaint={complaint} onClose={() => setActiveModal(null)} onSubmit={handleRework} />
      <EscalateModal open={activeModal === 'escalate'} complaint={complaint} onClose={() => setActiveModal(null)} onSubmit={handleEscalate} />
      <CloseComplaintModal open={activeModal === 'close'} complaint={complaint} onClose={() => setActiveModal(null)} onSubmit={handleClose} />
    </>
  );
}
