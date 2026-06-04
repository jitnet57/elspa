/**
 * 📌 수익 차트 컴포넌트
 * 📋 목적: 드라이버 일일/주간/월간 수익 시각화
 * 🔧 포함: 차트, 통계, 추세
 * 📅 작성일: 2026-05-24
 */

'use client';

import React from 'react';
import { Earnings } from '@/lib/api/driver-client';

interface EarningsChartProps {
  earnings: Earnings | null;
  isLoading?: boolean;
}

export function EarningsChart({ earnings, isLoading = false }: EarningsChartProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!earnings) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm text-center text-gray-500">
        수익 데이터가 없습니다.
      </div>
    );
  }

  // 최대값을 기준으로 차트 높이 계산
  const maxEarnings = Math.max(earnings.today, earnings.this_week, earnings.this_month, 1000000);
  const getHeight = (amount: number) => (amount / maxEarnings) * 100;

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
          <p className="text-xs sm:text-sm text-green-700 font-semibold mb-2">오늘의 수익</p>
          <p className="text-2xl sm:text-3xl font-bold text-green-700">
            ₩{Math.floor(earnings.today).toLocaleString()}
          </p>
          <p className="text-xs text-green-600 mt-2">{earnings.breakdown.length}건</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <p className="text-xs sm:text-sm text-blue-700 font-semibold mb-2">이번주 수익</p>
          <p className="text-2xl sm:text-3xl font-bold text-blue-700">
            ₩{Math.floor(earnings.this_week).toLocaleString()}
          </p>
          <p className="text-xs text-blue-600 mt-2">
            평균 ₩{Math.floor(earnings.this_week / 7).toLocaleString()}/일
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
          <p className="text-xs sm:text-sm text-purple-700 font-semibold mb-2">이번달 수익</p>
          <p className="text-2xl sm:text-3xl font-bold text-purple-700">
            ₩{Math.floor(earnings.this_month).toLocaleString()}
          </p>
          <p className="text-xs text-purple-600 mt-2">
            평균 ₩{Math.floor(earnings.this_month / 30).toLocaleString()}/일
          </p>
        </div>
      </div>

      {/* 막대 차트 */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-6">📊 수익 추세</h3>
        <div className="flex items-end justify-around gap-4 h-64">
          {/* 일일 */}
          <div className="flex flex-col items-center flex-1">
            <div className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg relative" style={{ height: `${getHeight(earnings.today)}%` }}>
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs font-bold text-gray-900">
                ₩{Math.floor(earnings.today / 1000).toFixed(0)}K
              </div>
            </div>
            <p className="text-xs font-semibold text-gray-700 mt-4">오늘</p>
          </div>

          {/* 주간 */}
          <div className="flex flex-col items-center flex-1">
            <div className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg relative" style={{ height: `${getHeight(earnings.this_week)}%` }}>
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs font-bold text-gray-900">
                ₩{Math.floor(earnings.this_week / 1000).toFixed(0)}K
              </div>
            </div>
            <p className="text-xs font-semibold text-gray-700 mt-4">이번주</p>
          </div>

          {/* 월간 */}
          <div className="flex flex-col items-center flex-1">
            <div className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg relative" style={{ height: `${getHeight(earnings.this_month)}%` }}>
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs font-bold text-gray-900">
                ₩{Math.floor(earnings.this_month / 1000).toFixed(0)}K
              </div>
            </div>
            <p className="text-xs font-semibold text-gray-700 mt-4">이번달</p>
          </div>
        </div>
      </div>

      {/* 상세 내역 */}
      {earnings.breakdown.length > 0 && (
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📝 오늘의 상세 내역</h3>
          <div className="space-y-2">
            {earnings.breakdown.map((item) => (
              <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.source}</p>
                  <p className="text-xs text-gray-500">{new Date(item.earned_date).toLocaleTimeString('ko-KR')}</p>
                </div>
                <p className="text-sm font-bold text-green-600">+₩{Math.floor(item.amount).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
