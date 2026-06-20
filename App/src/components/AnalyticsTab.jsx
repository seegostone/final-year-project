import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx';

export default function AnalyticsTab({ stats, complaints }) {
  const byCategory = (complaints ?? []).reduce((acc, c) => {
    acc[c.category] = (acc[c.category] ?? 0) + 1;
    return acc;
  }, {});

  const taskStats = (complaints ?? []).reduce(
    (acc, c) => {
      const tasks = c.tasks ?? [];
      acc.total += tasks.length;
      acc.done += tasks.filter((t) => t.status === 'done').length;
      acc.overdue += tasks.filter((t) => t.status !== 'done' && t.deadline && new Date(t.deadline) < new Date()).length;
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
              <span className="text-xs text-slate-600 w-28 shrink-0">{status}</span>
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
