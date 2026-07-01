import React from 'react';
import { RefreshCw, Filter, AlertTriangle, Clock } from 'lucide-react';

function PriorityBadge({ priority }) {
  if (!priority) {
    return <span className="text-xs text-slate-300">—</span>;
  }

  const PRIO = {
    CRITICAL: 'bg-rose-100 text-rose-800 border-rose-300',
    HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
    MEDIUM: 'bg-amber-100 text-amber-800 border-amber-300',
    LOW: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${PRIO[priority] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>{priority}</span>
  );
}

function StatusBadge({ status, STATUS_BADGE, statusLabel }) {
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-none border font-medium whitespace-nowrap leading-tight ${STATUS_BADGE[status] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      {statusLabel(status)}
    </span>
  );
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function slaLabel(iso) {
  if (!iso) return { label: '—', cls: 'text-slate-400' };
  const diff = (new Date(iso).getTime() - Date.now()) / 3600000;
  if (diff < 0) return { label: `${Math.abs(diff).toFixed(0)}h overdue`, cls: 'text-rose-600 font-semibold' };
  if (diff < 6) return { label: `${diff.toFixed(0)}h left`, cls: 'text-orange-500 font-semibold' };
  if (diff < 24) return { label: `${diff.toFixed(0)}h left`, cls: 'text-amber-600' };
  return { label: `${Math.ceil(diff / 24)}d left`, cls: 'text-slate-500' };
}

function ComplaintTable({ complaints = [], loading, onRowClick, STATUS_BADGE, statusLabel }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
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
              <th key={label} className={`text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap ${w}`}>{label}</th>
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
              const tasks = Array.isArray(c.tasks) ? c.tasks : [];
              const doneTasks = tasks.filter((t) => t.status === 'done').length;
              const overdueTasks = tasks.filter((t) => t.status !== 'done' && t.deadline && new Date(t.deadline) < new Date()).length;
              const isFinished = c.status === 'closed' || c.status === 'resolved';
              const isSlaBreached = c.slaDeadline && new Date(c.slaDeadline) < new Date() && !isFinished;

              return (
                <tr key={c._id} onClick={() => onRowClick(c)} className={`border-b border-slate-100 cursor-pointer transition-colors hover:bg-[#eef2f7]/70 ${isSlaBreached ? 'bg-rose-50/25' : ''}`}>
                  <td className="px-4 py-3"><span className="font-mono text-xs text-[#1e3a5f] font-bold">{c.complaintId}</span></td>
                  <td className="px-4 py-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 leading-tight line-clamp-1 max-w-[280px]">{c.title}</p>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5 max-w-[280px]">{c.location}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3"><p className="text-xs text-slate-600 line-clamp-1 max-w-[130px]">{c.user?.name ?? (c.history?.find((h) => h.action === 'submitted')?.byName) ?? '—'}</p></td>
                  <td className="px-4 py-3"><span className="text-xs text-slate-600 bg-slate-100 border border-slate-200 rounded-none px-2 py-0.5 whitespace-nowrap">{c.category}</span></td>
                  <td className="px-4 py-3"><PriorityBadge priority={c.priority} /></td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} STATUS_BADGE={STATUS_BADGE} statusLabel={statusLabel} /></td>
                  <td className="px-4 py-3">{isFinished ? (<span className="text-xs text-emerald-600 font-medium">SLA stopped</span>) : c.slaDeadline ? (<span className={`text-xs flex items-center gap-1 whitespace-nowrap ${sla.cls}`}>{isSlaBreached ? <AlertTriangle className="h-3 w-3 shrink-0" /> : <Clock className="h-3 w-3 shrink-0" />}{sla.label}</span>) : (<span className="text-xs text-slate-300">—</span>)}</td>
                  <td className="px-4 py-3">{tasks.length > 0 ? (<div className="flex items-center gap-1.5 whitespace-nowrap"><span className="text-xs text-slate-600 font-medium">{doneTasks}/{tasks.length}</span>{overdueTasks > 0 && (<span className="text-xs text-rose-600 flex items-center gap-0.5"><AlertTriangle className="h-2.5 w-2.5" />{overdueTasks}</span>)}</div>) : (<span className="text-xs text-slate-300">—</span>)}</td>
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{formatDate(c.createdAt)}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default React.memo(ComplaintTable);
