'use client';

import { useState } from 'react';

interface TherapistFairnessData {
  name: string;
  rating: number;
  bookingsToday: number;
  bookingsWeek: number;
  bookingsMonth: number;
  hoursWorkedToday: number;
  hoursWorkedWeek: number;
  fairnessScore: number;
  workloadPercentage: number;
  restMinutesToday: number;
  earningsMonth: number;
  status: 'ideal' | 'overloaded' | 'underutilized' | 'new';
}

const THERAPIST_FAIRNESS: TherapistFairnessData[] = [
  {
    name: 'Jessica',
    rating: 4.9,
    bookingsToday: 4,
    bookingsWeek: 18,
    bookingsMonth: 45,
    hoursWorkedToday: 7.5,
    hoursWorkedWeek: 32,
    fairnessScore: 35,
    workloadPercentage: 180,
    restMinutesToday: 45,
    earningsMonth: 5000000,
    status: 'overloaded',
  },
  {
    name: 'Sarah',
    rating: 4.8,
    bookingsToday: 2,
    bookingsWeek: 10,
    bookingsMonth: 32,
    hoursWorkedToday: 5.0,
    hoursWorkedWeek: 24,
    fairnessScore: 65,
    workloadPercentage: 130,
    restMinutesToday: 90,
    earningsMonth: 3500000,
    status: 'ideal',
  },
  {
    name: 'Emma',
    rating: 4.6,
    bookingsToday: 1,
    bookingsWeek: 5,
    bookingsMonth: 18,
    hoursWorkedToday: 2.5,
    hoursWorkedWeek: 12,
    fairnessScore: 82,
    workloadPercentage: 70,
    restMinutesToday: 210,
    earningsMonth: 2200000,
    status: 'underutilized',
  },
  {
    name: '이준호',
    rating: 3.8,
    bookingsToday: 2,
    bookingsWeek: 8,
    bookingsMonth: 12,
    hoursWorkedToday: 4.0,
    hoursWorkedWeek: 16,
    fairnessScore: 90,
    workloadPercentage: 45,
    restMinutesToday: 150,
    earningsMonth: 1500000,
    status: 'new',
  },
  {
    name: 'Amanda',
    rating: 4.7,
    bookingsToday: 3,
    bookingsWeek: 12,
    bookingsMonth: 25,
    hoursWorkedToday: 6.0,
    hoursWorkedWeek: 28,
    fairnessScore: 75,
    workloadPercentage: 95,
    restMinutesToday: 120,
    earningsMonth: 2800000,
    status: 'ideal',
  },
];

const FAIRNESS_POLICY_RULES = [
  {
    rule: '3시간 연속 근무 제한',
    description: '3시간 연속으로 일한 후 15분 강제 휴식',
    frequency: '매시간 체크',
    status: '✓ 시행 중',
  },
  {
    rule: '8시간 일일 최대',
    description: '하루 8시간 이상 근무 금지',
    frequency: '일일 체크',
    status: '✓ 시행 중',
  },
  {
    rule: '공평한 일감 분배',
    description: '평균 대비 편차 ±20% 범위 유지',
    frequency: '실시간 체크',
    status: '⚠️ 모니터링',
  },
  {
    rule: '신입 기회 보장',
    description: '신입 테라피스트 월 최소 15건 배정',
    frequency: '월간 체크',
    status: '✓ 달성',
  },
];

export default function FairnessDashboardPage() {
  const [selectedMetric, setSelectedMetric] = useState<'bookings' | 'fairness' | 'earnings'>('bookings');
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('month');

  const avgBookings = Math.round(
    THERAPIST_FAIRNESS.reduce((sum, t) => {
      if (selectedPeriod === 'day') return sum + t.bookingsToday;
      if (selectedPeriod === 'week') return sum + t.bookingsWeek;
      return sum + t.bookingsMonth;
    }, 0) / THERAPIST_FAIRNESS.length
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ideal':
        return 'bg-emerald-50 border-emerald-200 text-emerald-900';
      case 'overloaded':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'underutilized':
        return 'bg-amber-50 border-amber-200 text-amber-900';
      case 'new':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      default:
        return 'bg-stone-50 border-stone-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ideal':
        return '✓ Ideal';
      case 'overloaded':
        return '⚠️ Overloaded';
      case 'underutilized':
        return '◐ Underutilized';
      case 'new':
        return '⭐ New';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">
            📊 Fairness Monitoring Dashboard
          </h1>
          <p className="text-lg text-gray-600 font-light">
            Real-time monitoring of fair work distribution and therapist team health
          </p>
        </div>

        {/* Filters & Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
          {/* Period selection */}
          <div className="bg-white rounded-xl p-4 border border-stone-200">
            <p className="text-xs text-gray-600 font-light mb-3">Period</p>
            <div className="space-y-2">
              {[
                { id: 'day', label: 'Today' },
                { id: 'week', label: 'This Week' },
                { id: 'month', label: 'This Month' },
              ].map(period => (
                <button
                  key={period.id}
                  onClick={() => setSelectedPeriod(period.id as any)}
                  className={`w-full px-3 py-2 rounded text-sm font-semibold transition-all ${
                    selectedPeriod === period.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-stone-100 text-gray-700 hover:bg-stone-200'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

          {/* Metric selection */}
          <div className="bg-white rounded-xl p-4 border border-stone-200 lg:col-span-3">
            <p className="text-xs text-gray-600 font-light mb-3">Analysis Metrics</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'bookings', label: '📋 Work Distribution' },
                { id: 'fairness', label: '⚖️ Fairness Score' },
                { id: 'earnings', label: '💰 Revenue' },
              ].map(metric => (
                <button
                  key={metric.id}
                  onClick={() => setSelectedMetric(metric.id as any)}
                  className={`px-4 py-2 rounded text-sm font-semibold transition-all ${
                    selectedMetric === metric.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-stone-100 text-gray-700 hover:bg-stone-200'
                  }`}
                >
                  {metric.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
          {/* Team Statistics */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-100">
              <p className="text-xs text-gray-600 font-light mb-2">Average Work (Current Period)</p>
              <p className="text-3xl font-bold text-blue-600 mb-2">{avgBookings}</p>
              <p className="text-xs text-gray-600 font-light">Bookings</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-100">
              <p className="text-xs text-gray-600 font-light mb-2">Team Size</p>
              <p className="text-3xl font-bold text-emerald-600 mb-2">{THERAPIST_FAIRNESS.length}</p>
              <p className="text-xs text-gray-600 font-light">Therapists</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-100">
              <p className="text-xs text-gray-600 font-light mb-2">Fairness Rating</p>
              <p className="text-3xl font-bold text-purple-600 mb-2">
                {(
                  THERAPIST_FAIRNESS.reduce((sum, t) => sum + t.fairnessScore, 0) /
                  THERAPIST_FAIRNESS.length
                ).toFixed(1)}
              </p>
              <p className="text-xs text-gray-600 font-light">/ 100</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-6 border-2 border-emerald-200">
              <p className="text-sm font-bold text-emerald-900 mb-2">✓ Status: Healthy</p>
              <p className="text-xs text-emerald-800 font-light">
                All rules are being followed and the team is healthy.
              </p>
            </div>
          </div>

          {/* Therapist Ranking */}
          <div className="lg:col-span-3 bg-white rounded-xl p-8 shadow-sm border border-stone-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {selectedMetric === 'bookings' && '📋 Work Distribution Status'}
              {selectedMetric === 'fairness' && '⚖️ Fairness Ranking'}
              {selectedMetric === 'earnings' && '💰 Revenue Distribution'}
            </h2>

            <div className="space-y-4">
              {THERAPIST_FAIRNESS.map((therapist, idx) => {
                let value: number;
                let maxValue: number;
                let color: string;

                if (selectedMetric === 'bookings') {
                  if (selectedPeriod === 'day') {
                    value = therapist.bookingsToday;
                    maxValue = Math.max(...THERAPIST_FAIRNESS.map(t => t.bookingsToday));
                  } else if (selectedPeriod === 'week') {
                    value = therapist.bookingsWeek;
                    maxValue = Math.max(...THERAPIST_FAIRNESS.map(t => t.bookingsWeek));
                  } else {
                    value = therapist.bookingsMonth;
                    maxValue = Math.max(...THERAPIST_FAIRNESS.map(t => t.bookingsMonth));
                  }
                  color = 'bg-blue-500';
                } else if (selectedMetric === 'fairness') {
                  value = therapist.fairnessScore;
                  maxValue = 100;
                  color = 'bg-emerald-500';
                } else {
                  value = therapist.earningsMonth / 1000000;
                  maxValue = Math.max(...THERAPIST_FAIRNESS.map(t => t.earningsMonth / 1000000));
                  color = 'bg-purple-500';
                }

                const percentage = (value / maxValue) * 100;

                return (
                  <div
                    key={therapist.name}
                    className={`p-4 rounded-lg border-2 ${getStatusColor(therapist.status)}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-sm">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '•'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{therapist.name}</p>
                          <p className="text-xs font-semibold">
                            {getStatusLabel(therapist.status)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">
                          {selectedMetric === 'bookings' && `${value}건`}
                          {selectedMetric === 'fairness' && `${value.toFixed(0)}/100`}
                          {selectedMetric === 'earnings' && `₱${value.toFixed(1)}M`}
                        </p>
                        <p className="text-xs text-gray-600">
                          ⭐ {therapist.rating.toFixed(1)}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${color} rounded-full transition-all`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 font-semibold w-12 text-right">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Fairness Rule Monitoring */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-stone-100 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            🛡️ Fairness Rule Compliance Status
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {FAIRNESS_POLICY_RULES.map((rule, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-lg border-2 ${
                  rule.status.includes('✓')
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-amber-50 border-amber-200'
                }`}
              >
                <p className="font-bold text-gray-900 mb-2">{rule.rule}</p>
                <p className="text-xs text-gray-600 font-light mb-3">{rule.description}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-600">{rule.frequency}</p>
                  <span className="text-sm font-bold">{rule.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alert Items */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Overwork Alert */}
          <div className="bg-red-50 rounded-xl p-8 border-2 border-red-200">
            <h3 className="text-xl font-bold text-red-900 mb-4">⚠️ Overwork Alert</h3>
            <div className="space-y-3">
              {THERAPIST_FAIRNESS.filter(t => t.status === 'overloaded').map(therapist => (
                <div key={therapist.name} className="bg-white rounded-lg p-4 border border-red-200">
                  <p className="font-bold text-gray-900 mb-1">{therapist.name}</p>
                  <p className="text-xs text-gray-600 font-light mb-2">
                    Today: {therapist.hoursWorkedToday} hours worked | {therapist.restMinutesToday} min rest
                  </p>
                  <div className="flex gap-2">
                    <button className="flex-1 px-3 py-2 bg-red-500 text-white rounded text-xs font-semibold hover:bg-red-600">
                      Force Rest
                    </button>
                    <button className="flex-1 px-3 py-2 bg-stone-200 text-gray-900 rounded text-xs font-semibold hover:bg-stone-300">
                      Consult
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Underutilization & New */}
          <div className="bg-blue-50 rounded-xl p-8 border-2 border-blue-200">
            <h3 className="text-xl font-bold text-blue-900 mb-4">💡 Development & Utilization</h3>
            <div className="space-y-3">
              {THERAPIST_FAIRNESS.filter(t =>
                t.status === 'underutilized' || t.status === 'new'
              ).map(therapist => (
                <div key={therapist.name} className="bg-white rounded-lg p-4 border border-blue-200">
                  <p className="font-bold text-gray-900 mb-1">{therapist.name}</p>
                  <p className="text-xs text-gray-600 font-light mb-2">
                    {therapist.status === 'new' ? 'New (New Boost Mode)' : 'Underutilized (Need more opportunities)'}
                  </p>
                  <button className="w-full px-3 py-2 bg-blue-500 text-white rounded text-xs font-semibold hover:bg-blue-600">
                    Prioritize Next Booking
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Policy Explanation */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 border-2 border-blue-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            📚 Fairness Policy Goals
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <p className="font-bold text-blue-900 mb-2">Customer Satisfaction ✓</p>
              <p className="text-sm text-gray-700 font-light">
                Providing highest quality service. All therapists get sufficient rest ensuring service quality.
              </p>
            </div>
            <div>
              <p className="font-bold text-purple-900 mb-2">Therapist Health ✓</p>
              <p className="text-sm text-gray-700 font-light">
                3-hour continuous work limit, 8-hour daily max for fatigue management. Equal opportunities and earnings.
              </p>
            </div>
            <div>
              <p className="font-bold text-blue-900 mb-2">Company Sustainability ✓</p>
              <p className="text-sm text-gray-700 font-light">
                Reduced turnover, new staff growth, enhanced team cohesion. Investment for long-term success.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

