'use client';

import { useState, useEffect, useMemo } from 'react';
import { useStore } from '@/lib/store/store';
import { translations } from '@/lib/translations';

interface AuditLog {
  id: number;
  action: string;
  user_id: string;
  user_email: string | null;
  entity_type: string;
  entity_id: number | null;
  changes: string | null;
  old_value: string | null;
  new_value: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface AuditFilters {
  action: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  dateFrom: string;
  dateTo: string;
}

export default function AuditLogsPage() {
  const { language } = useStore();
  const t = translations[language];

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Hydration fix: ensure client-side only rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  const [filters, setFilters] = useState<AuditFilters>({
    action: '',
    user_id: '',
    entity_type: '',
    entity_id: '',
    dateFrom: '',
    dateTo: '',
  });

  // Fetch audit logs
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams();

        if (filters.action) queryParams.append('action', filters.action);
        if (filters.user_id) queryParams.append('user_id', filters.user_id);
        if (filters.entity_type) queryParams.append('entity_type', filters.entity_type);
        if (filters.entity_id) queryParams.append('entity_id', filters.entity_id);

        const response = await fetch(`https://elspa-api-production.jitnet57.workers.dev/api/admin/audit/logs?${queryParams.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch audit logs');

        const data = await response.json();
        setLogs(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [filters.action, filters.user_id, filters.entity_type, filters.entity_id]);

  // Filter logs by date range
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (filters.dateFrom) {
        const logDate = new Date(log.created_at);
        if (logDate < new Date(filters.dateFrom)) return false;
      }
      if (filters.dateTo) {
        const logDate = new Date(log.created_at);
        const endOfDay = new Date(filters.dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        if (logDate > endOfDay) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [logs, filters.dateFrom, filters.dateTo]);

  const getActionColor = (action: string) => {
    if (action.includes('created')) return 'bg-green-100 text-green-800';
    if (action.includes('updated')) return 'bg-blue-100 text-blue-800';
    if (action.includes('deleted')) return 'bg-red-100 text-red-800';
    if (action.includes('approved')) return 'bg-purple-100 text-purple-800';
    if (action.includes('rejected')) return 'bg-orange-100 text-orange-800';
    if (action.includes('settled') || action.includes('paid')) return 'bg-indigo-100 text-indigo-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getActionLabel = (action: string) => {
    const actionMap: Record<string, string> = {
      // Financial
      expense_created: 'Expense Created',
      expense_updated: 'Expense Updated',
      expense_deleted: 'Expense Deleted',
      budget_set: 'Budget Set',
      budget_updated: 'Budget Updated',
      revenue_recorded: 'Revenue Recorded',

      // Payroll - Employee
      employee_created: 'Employee Created',
      employee_updated: 'Employee Updated',
      employee_deleted: 'Employee Deleted',

      // Payroll - Cash Advance
      cash_advance_created: 'CA Requested',
      cash_advance_approved: 'CA Approved',
      cash_advance_rejected: 'CA Rejected',
      cash_advance_settled: 'CA Settled',

      // Payroll - Attendance
      attendance_created: 'Attendance Created',
      attendance_updated: 'Attendance Updated',

      // Payroll - Period
      payroll_period_created: 'Payroll Period Created',
      payroll_period_approved: 'Payroll Approved',
      payroll_period_paid: 'Payroll Paid',

      // Payroll - Record
      payroll_record_calculated: 'Payroll Calculated',
      payroll_record_updated: 'Payroll Updated',
      payroll_record_approved: 'Payroll Approved',

      // Payroll - Holiday
      holiday_created: 'Holiday Created',
      holiday_deleted: 'Holiday Deleted',
    };
    return actionMap[action] || action;
  };

  const getEntityLabel = (entityType: string) => {
    const entityMap: Record<string, string> = {
      expense: 'Expense',
      budget: 'Budget',
      category: 'Category',
      employee: 'Employee',
      cash_advance: 'Cash Advance',
      attendance_log: 'Attendance',
      payroll_period: 'Payroll Period',
      payroll_record: 'Payroll Record',
      holiday: 'Holiday',
      revenue: 'Revenue',
      export: 'Export',
    };
    return entityMap[entityType] || entityType;
  };

  const parseJSON = (json: string | null) => {
    if (!json) return null;
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  };

  const handleExport = () => {
    if (typeof window === 'undefined') return; // Hydration guard

    const csv = [
      ['Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'Changes'],
      ...filteredLogs.map((log) => [
        new Date(log.created_at).toLocaleString(),
        log.user_email || log.user_id,
        getActionLabel(log.action),
        getEntityLabel(log.entity_type),
        log.entity_id || '-',
        log.changes ? Object.keys(JSON.parse(log.changes)).join('; ') : '-',
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-400 to-indigo-300 text-white p-6 shadow-md">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-4xl">🔍</div>
            <h1 className="text-3xl font-bold">Audit Logs</h1>
          </div>
          <p className="text-indigo-100">Track all system changes for compliance and audit trail</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Filters Section */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Action Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
              <input
                type="text"
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                placeholder="e.g. created, updated"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* User ID Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
              <input
                type="text"
                value={filters.user_id}
                onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}
                placeholder="e.g. admin@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Entity Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
              <input
                type="text"
                value={filters.entity_type}
                onChange={(e) => setFilters({ ...filters, entity_type: e.target.value })}
                placeholder="e.g. employee, expense"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Entity ID Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entity ID</label>
              <input
                type="text"
                value={filters.entity_id}
                onChange={(e) => setFilters({ ...filters, entity_id: e.target.value })}
                placeholder="e.g. 123"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Date From Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Date To Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() =>
                setFilters({
                  action: '',
                  user_id: '',
                  entity_type: '',
                  entity_id: '',
                  dateFrom: '',
                  dateTo: '',
                })
              }
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear Filters
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              📥 Export CSV
            </button>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-4 text-sm text-gray-600">
          Showing <span className="font-semibold text-gray-900">{filteredLogs.length}</span> audit logs
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="animate-spin">⏳</div>
              <p className="text-gray-600 mt-2">Loading audit logs...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">
              <span className="font-semibold">Error:</span> {error}
            </p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredLogs.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-2">📝</div>
            <p className="text-gray-600">No audit logs found matching your filters</p>
          </div>
        )}

        {/* Audit Logs Table */}
        {!loading && !error && filteredLogs.length > 0 && (
          <div className="overflow-x-auto shadow-md rounded-lg">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">Timestamp</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">User</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">Action</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">Entity</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">Changes</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, idx) => (
                  <tr
                    key={log.id}
                    className={`border-b border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-indigo-50`}
                  >
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div className="font-medium">{log.user_email || log.user_id}</div>
                      {log.ip_address && <div className="text-xs text-gray-500">{log.ip_address}</div>}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                        {getActionLabel(log.action)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div className="font-medium">{getEntityLabel(log.entity_type)}</div>
                      {log.entity_id && <div className="text-xs text-gray-500">ID: {log.entity_id}</div>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {log.changes ? (
                        <div className="text-xs">
                          {Object.keys(parseJSON(log.changes) || {}).slice(0, 2).map((key) => (
                            <div key={key}>{key}</div>
                          ))}
                          {Object.keys(parseJSON(log.changes) || {}).length > 2 && (
                            <div className="text-gray-500">+{Object.keys(parseJSON(log.changes) || {}).length - 2} more</div>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => {
                          setSelectedLog(log);
                          setShowDetails(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetails && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-gray-100 border-b border-gray-300 px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">Audit Log Details</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-600 hover:text-gray-900 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Timestamp</label>
                  <p className="text-sm text-gray-900">{new Date(selectedLog.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">User</label>
                  <p className="text-sm text-gray-900">{selectedLog.user_email || selectedLog.user_id}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Action</label>
                  <p className="text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getActionColor(selectedLog.action)}`}>
                      {getActionLabel(selectedLog.action)}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Entity</label>
                  <p className="text-sm text-gray-900">
                    {getEntityLabel(selectedLog.entity_type)} #{selectedLog.entity_id}
                  </p>
                </div>
              </div>

              {selectedLog.ip_address && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">IP Address</label>
                  <p className="text-sm text-gray-900">{selectedLog.ip_address}</p>
                </div>
              )}

              {selectedLog.changes && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Changes</label>
                  <div className="bg-gray-50 p-3 rounded text-xs font-mono overflow-x-auto">
                    <pre className="whitespace-pre-wrap break-words text-gray-900">
                      {JSON.stringify(parseJSON(selectedLog.changes), null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {selectedLog.old_value && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Old Value</label>
                  <div className="bg-red-50 p-3 rounded text-xs font-mono overflow-x-auto">
                    <pre className="whitespace-pre-wrap break-words text-gray-900">
                      {JSON.stringify(parseJSON(selectedLog.old_value), null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {selectedLog.new_value && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">New Value</label>
                  <div className="bg-green-50 p-3 rounded text-xs font-mono overflow-x-auto">
                    <pre className="whitespace-pre-wrap break-words text-gray-900">
                      {JSON.stringify(parseJSON(selectedLog.new_value), null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-100 border-t border-gray-300 px-6 py-3 flex justify-end">
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
