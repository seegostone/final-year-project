import { Search, XCircle } from 'lucide-react';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';

export default function FilterBar({
  search, setSearch,
  statusFilter, setStatusFilter,
  priorityFilter, setPriorityFilter,
  categoryFilter, setCategoryFilter,
  STATUSES, PRIO_OPTIONS, CATEGORIES,
  clearFilters,
  queueError,
  fetchQueue,
}) {
  return (
    <div className="p-4 border-b border-slate-100">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Search ID, title, location, submitter…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 h-10 text-sm bg-slate-50 border-slate-200 rounded-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 w-full sm:w-[150px] text-xs bg-slate-50 border-slate-200 rounded-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="h-10 w-full sm:w-[130px] text-xs bg-slate-50 border-slate-200 rounded-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIO_OPTIONS.map((p) => (
                <SelectItem key={p} value={p} className="text-xs">{p === 'all' ? 'All Priorities' : p}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-10 w-full sm:w-[130px] text-xs bg-slate-50 border-slate-200 rounded-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c} className="text-xs">{c === 'all' ? 'All Categories' : c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(search || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all') && (
            <Button
              variant="ghost" size="sm" className="h-10 px-3 text-xs text-slate-500 hover:text-slate-800"
              onClick={clearFilters}
            >
              <XCircle className="h-4 w-4 mr-1" />Clear
            </Button>
          )}
        </div>
      </div>
      {queueError && (
        <div className="mt-3 flex items-center gap-3">
          <div className="text-sm text-rose-600">{queueError}</div>
          <Button size="sm" variant="ghost" onClick={() => fetchQueue?.(1)}>Retry</Button>
        </div>
      )}
    </div>
  );
}
