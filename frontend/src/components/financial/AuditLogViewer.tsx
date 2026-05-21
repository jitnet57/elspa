'use client';

/**
 * 📌 Audit Log Viewer Component
 * 📋 목적: 감사 로그 조회 및 분석 표시
 * 🔧 포함: 로그 테이블, 필터, 상세 뷰
 */

import { useState, useEffect } from 'react';

interface AuditLog {
  id: number;
  action: string;
  user_id: string;
  user_email?: string;
  entity_type: string;
  entity_id?: number;
  changes?: string;
  old_value?: string;
  new_value?: string;
  ip_address?: string;
  created_at: string;
}

interface AuditLogViewerProps {
  limit?: number;
  entityType?: string;
  userId?: string;
  showDetails?: boolean;
}

export function AuditLogViewer({
  limit = 50,
  entityType,
  userId,
  showDetails = false,
}: AuditLogViewerProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [filterAction, setFilterAction] = useState<string>('');

  useEffect(() => {
    fetchLogs();
  }, [limit, entityType, userId, filterAction]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      if (entityType) params.append('entity_type', entityType);
      if (userId) params.append('user_id', userId);
      if (filterAction) params.append('action', filterAction);

      // TODO: Replace with actual API call
      // const response = await fetch(`/api/admin/audit/logs?${params}`);
      // const data = await response.json();
      // setLogs(data);

      // Mock data for demonstration
      setLogs([]);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAction = (action: string) => {
    const actionMap: Record<string, string> = {
      'expense_created': '지출 생성',
      'expense_updated': '지출 수정',
      'expense_deleted': '지출 삭제',
      'category_created': '카테고리 생성',
      'budget_set': '예산 설정',
      'budget_updated': '예산 수정',
      'revenue_recorded': '수익 기록',
      'export_generated': '내보내기',
    };
    return actionMap[action] || action;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-PH');
  };

  const actionBadgeColor = (action: string): string => {
    if (action.includes('created')) return 'bg-green-100 text-green-800';
    if (action.includes('updated')) return 'bg-blue-100 text-blue-800';
    if (action.includes('deleted')) return 'bg-red-100 text-red-800';
    if (action.includes('set')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin mb-3">⏳</div>
        <p className="text-gray-500">Loading audit logs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex gap-2 items-center bg-gray-50 p-3 rounded-lg">
        <label className="text-sm font-semibold text-gray-700">Filter:</label>
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="">All Actions</option>
          <option value="EXPENSE_CREATED">지출 생성</option>
          <option value="EXPENSE_UPDATED">지출 수정</option>
          <option value="EXPENSE_DELETED">지출 삭제</option>
          <option value="BUDGET_SET">예산 설정</option>
        </select>
      </div>

      {/* Logs Table */}
      {logs.length > 0 ? (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Date/Time
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Action
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  User
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Entity
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Details
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(log.created_at)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${actionBadgeColor(
                        log.action
                      )}`}
                    >
                      {formatAction(log.action)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {log.user_email || log.user_id}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {log.entity_type}
                    {log.entity_id && ` #${log.entity_id}`}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {showDetails && log.changes && (
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        View
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No audit logs found</p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Audit Log Details</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <p className="font-semibold text-gray-700">Action</p>
                <p className="text-gray-600">{formatAction(selectedLog.action)}</p>
              </div>

              <div>
                <p className="font-semibold text-gray-700">User</p>
                <p className="text-gray-600">{selectedLog.user_email || selectedLog.user_id}</p>
              </div>

              <div>
                <p className="font-semibold text-gray-700">Entity</p>
                <p className="text-gray-600">
                  {selectedLog.entity_type} #{selectedLog.entity_id}
                </p>
              </div>

              <div>
                <p className="font-semibold text-gray-700">Changes</p>
                {selectedLog.changes ? (
                  <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(JSON.parse(selectedLog.changes), null, 2)}
                  </pre>
                ) : (
                  <p className="text-gray-600">No changes recorded</p>
                )}
              </div>

              <div>
                <p className="font-semibold text-gray-700">Timestamp</p>
                <p className="text-gray-600">{formatDate(selectedLog.created_at)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
