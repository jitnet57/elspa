'use client';

/**
 * 📌 Budget Alert Panel Component
 * 📋 목적: 예산 경고 및 임계값 초과 알림 표시
 * 🔧 포함: 경고/위험 상태, 실시간 업데이트
 */

import { useEffect, useState } from 'react';
import { fetchFinancial } from '@/lib/api-client';

interface BudgetAlert {
  year: number;
  month: number;
  alertType: 'warning' | 'critical';
  actualAmount: number;
  budgetLimit: number;
  percentage: number;
  message: string;
}

interface BudgetAlertPanelProps {
  year: number;
  month: number;
}

export function BudgetAlertPanel({ year, month }: BudgetAlertPanelProps) {
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        setLoading(true);
        const alertList = await fetchFinancial<BudgetAlert[]>(
          `/admin/budget-monitor/alerts?year=${year}&month=${month}`
        );
        setAlerts(alertList || []);
      } catch (err) {
        console.error('Failed to load budget alerts:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();
  }, [year, month]);

  if (loading) {
    return (
      <div className="p-4 text-gray-400 text-sm">
        ⏳ 예산 경고 로딩 중...
      </div>
    );
  }

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 p-4 bg-orange-50 border-l-4 border-orange-400 rounded-lg">
      <h3 className="font-semibold text-orange-900 flex items-center gap-2">
        ⚠️ 예산 경고
      </h3>

      <div className="space-y-2">
        {alerts.map((alert, idx) => (
          <div
            key={idx}
            className={`p-3 rounded text-sm font-medium ${
              alert.alertType === 'critical'
                ? 'bg-red-100 text-red-800 border-l-4 border-red-500'
                : 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold">
                  {alert.alertType === 'critical' ? '🚨 위험' : '⚠️ 경고'}
                </div>
                <div className="text-xs mt-1">{alert.message}</div>
              </div>
              <div className="text-xs font-bold bg-white bg-opacity-50 px-2 py-1 rounded">
                {alert.percentage.toFixed(1)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
