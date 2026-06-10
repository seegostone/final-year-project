import { TrendingUp, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

export default function DashboardStats({ stats }) {
  const statCards = [
    {
      title: 'Total Complaints',
      value: stats.totalComplaints || 0,
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'SLA Breaches',
      value: stats.slaBreach || 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      title: 'Resolved',
      value: stats.statusBreakdown?.closed || 0,
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'Avg Resolution',
      value: `${Math.round(stats.avgTimeToResolveHours || 0)}h`,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{card.value}</p>
              </div>
              <div className={`p-2 sm:p-3 rounded-lg ${card.bg}`}>
                <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${card.color}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
