'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store/store';
import { translations } from '@/lib/translations';

export default function ChangeLogsPage() {
  const { changeLogs, language } = useStore();
  const t = translations[language];

  const [filters, setFilters] = useState({
    bedNumber: '',
    adminName: '',
    dateFrom: '',
    dateTo: '',
  });

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return changeLogs
      .filter((log) => {
        if (filters.bedNumber && log.bedNumber.toString() !== filters.bedNumber) return false;
        if (filters.adminName && !log.adminName.toLowerCase().includes(filters.adminName.toLowerCase())) {
          return false;
        }
        if (filters.dateFrom) {
          const logDate = new Date(log.timestamp);
          if (logDate < new Date(filters.dateFrom)) return false;
        }
        if (filters.dateTo) {
          const logDate = new Date(log.timestamp);
          const endOfDay = new Date(filters.dateTo);
          endOfDay.setHours(23, 59, 59, 999);
          if (logDate > endOfDay) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [changeLogs, filters]);

  const handleExport = () => {
    const csv = [
      ['Bed', 'Previous Status', 'New Status', 'Customer', 'Admin', 'Timestamp', 'Notes'],
      ...filteredLogs.map((log) => [
        `Bed ${log.bedNumber}`,
        log.previousStatus,
        log.newStatus,
        log.newCustomer || log.previousCustomer || '-',
        log.adminName,
        new Date(log.timestamp).toLocaleString(),
        log.notes || '-',
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `change-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'in_service':
        return 'bg-blue-100 text-blue-800';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800';
      case 'cleaning':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      available: 'Available',
      in_service: 'In Service',
      reserved: 'Reserved',
      cleaning: 'Cleaning',
    };
    return statusMap[status] || status;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-400 to-blue-300 text-white p-6 shadow-md">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-4xl">📋</div>
            <h1 className="text-3xl font-bold">Change Logs</h1>
          </div>
          <p className="text-blue-100">Track all bed status changes for audit and verification</p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-6">
        {/* Filter section */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Bed Number</label>
              <input
                type="number"
                min="1"
                value={filters.bedNumber}
                onChange={(e) => setFilters({ ...filters, bedNumber: e.target.value })}
                placeholder="Search by bed..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Admin Name</label>
              <input
                type="text"
                value={filters.adminName}
                onChange={(e) => setFilters({ ...filters, adminName: e.target.value })}
                placeholder="Search by admin..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setFilters({ bedNumber: '', adminName: '', dateFrom: '', dateTo: '' })}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold rounded-lg transition-colors"
            >
              Clear Filters
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors"
            >
              📥 Export CSV
            </button>
          </div>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-gray-600">Total Changes</div>
            <div className="text-2xl font-bold text-blue-600">{filteredLogs.length}</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm text-gray-600">Made Available</div>
            <div className="text-2xl font-bold text-green-600">
              {filteredLogs.filter((log) => log.newStatus === 'available').length}
            </div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="text-sm text-gray-600">Now Cleaning</div>
            <div className="text-2xl font-bold text-orange-600">
              {filteredLogs.filter((log) => log.newStatus === 'cleaning').length}
            </div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="text-sm text-gray-600">Unique Admins</div>
            <div className="text-2xl font-bold text-purple-600">
              {new Set(filteredLogs.map((log) => log.adminName)).size}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-2">📭</div>
              <p className="text-gray-500">No change logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Timestamp</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Bed</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Status Change</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Customer</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Admin</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, idx) => (
                    <tr
                      key={log.id}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="font-mono text-xs">
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">
                        Bed {log.bedNumber}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(log.previousStatus)}`}>
                            {getStatusLabel(log.previousStatus)}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(log.newStatus)}`}>
                            {getStatusLabel(log.newStatus)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {log.newCustomer || log.previousCustomer || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {log.adminName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {log.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination info */}
        {filteredLogs.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 text-center">
            Showing {filteredLogs.length} of {changeLogs.length} change logs
          </div>
        )}
      </main>
    </div>
  );
}
