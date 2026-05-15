'use client';

import { useDashboardData } from '@/lib/dashboard/hooks';
import { DashboardSidebar } from '@/features/dashboard/components/DashboardSidebar';
import { InfoGuide } from '@/features/dashboard/components/InfoGuide';
import { StatsGrid } from '@/features/dashboard/components/StatsGrid';
import { RecentBookings } from '@/features/dashboard/components/RecentBookings';
import { TherapistsPerformance } from '@/features/dashboard/components/TherapistsPerformance';
import { WeeklyChart } from '@/features/dashboard/components/WeeklyChart';

export default function DashboardPage() {
  const { stats, recentBookings, therapists, weeklyData, days } = useDashboardData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <DashboardSidebar />

      <main className="ml-72 p-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-5xl font-bold text-gray-900 mb-2 tracking-tight">
              ElSpa Dashboard
            </h1>
            <p className="text-sm text-gray-500 font-light">
              {new Date().toLocaleDateString('ko-KR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="flex gap-3">
            <button className="p-3 bg-white rounded-full hover:bg-stone-100 transition-colors shadow-sm border border-stone-200">
              🔔
            </button>
            <button className="p-3 bg-white rounded-full hover:bg-stone-100 transition-colors shadow-sm border border-stone-200">
              👤
            </button>
          </div>
        </div>

        <InfoGuide />
        <StatsGrid stats={stats} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <RecentBookings bookings={recentBookings} />
          <TherapistsPerformance therapists={therapists} />
        </div>

        <WeeklyChart weeklyData={weeklyData} days={days} />

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-stone-200">
          <p className="text-xs text-gray-500 font-light">
            마지막 업데이트: {new Date().toLocaleTimeString('ko-KR')}
          </p>
        </div>
      </main>
    </div>
  );
}
