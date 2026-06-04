import { Stat } from '@/lib/dashboard/types';

interface StatsGridProps {
  stats: Stat[];
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className="bg-white rounded-xl p-6 shadow-sm border border-stone-100 hover:shadow-md hover:border-stone-200 transition-all group"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-stone-100 rounded-lg flex items-center justify-center text-xl group-hover:bg-orange-50 transition-colors">
              {stat.icon}
            </div>
            <div className={`text-xs font-bold px-2 py-1 rounded-full ${stat.changeType === 'positive' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {stat.change}
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-2 font-light tracking-wide">{stat.label}</p>
          <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
