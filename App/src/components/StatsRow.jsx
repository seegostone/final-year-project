import React from 'react';
import { Layers, RefreshCw, Clock, FileWarning, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx';

function StatsRow({ stats = {} }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
      <Card className="border border-slate-200 shadow-sm hover:shadow transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
          <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</CardTitle>
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center bg-[#eef2f7] text-[#1e3a5f]`}>
            <Layers className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-3xl font-bold text-slate-800 leading-none">{stats.totalComplaints}</p>
          <p className="text-xs text-slate-500 mt-1">All complaints</p>
        </CardContent>
      </Card>

      <Card className="border border-slate-200 shadow-sm hover:shadow transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
          <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending</CardTitle>
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600`}>
            <Clock className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-3xl font-bold text-slate-800 leading-none">{(stats.statusBreakdown?.pending ?? 0) + (stats.statusBreakdown?.triaged ?? 0)}</p>
          <p className="text-xs text-slate-500 mt-1">Awaiting action</p>
        </CardContent>
      </Card>

      <Card className="border border-slate-200 shadow-sm hover:shadow transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
          <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">In Progress</CardTitle>
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center bg-violet-50 text-violet-600`}>
            <RefreshCw className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-3xl font-bold text-slate-800 leading-none">{(stats.statusBreakdown?.assigned ?? 0) + (stats.statusBreakdown?.['in-progress'] ?? 0) + (stats.statusBreakdown?.scope_defined ?? 0) + (stats.statusBreakdown?.rework_required ?? 0)}</p>
          <p className="text-xs text-slate-500 mt-1">Active work</p>
        </CardContent>
      </Card>

      <Card className="border border-slate-200 shadow-sm hover:shadow transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
          <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">SLA Breaches</CardTitle>
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center bg-rose-50 text-rose-600`}>
            <FileWarning className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-3xl font-bold text-slate-800 leading-none">{stats.slaBreach}</p>
          <p className="text-xs text-slate-500 mt-1">Overdue</p>
        </CardContent>
      </Card>

      <Card className="border border-slate-200 shadow-sm hover:shadow transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
          <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Closed</CardTitle>
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600`}>
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-3xl font-bold text-slate-800 leading-none">{stats.statusBreakdown?.closed ?? 0}</p>
          <p className="text-xs text-slate-500 mt-1">Resolved & closed</p>
        </CardContent>
      </Card>
    </div>
  );
}
export default React.memo(StatsRow);
