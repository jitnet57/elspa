import React, { useState } from 'react';
import { ChevronRight, Download, Printer, Menu } from 'lucide-react';

interface PayrollRecord {
  id: string;
  name: string;
  employeeType: 'Full-time' | 'Part-time' | 'Contractor';
  period: string;
  grossPay: number;
  deductions: number;
  netPay: number;
  status: 'Paid' | 'Approved' | 'Draft';
  avatar: string;
}

interface Filters {
  period: string;
  employeeType: string;
  status: string;
}

const mockRecords: PayrollRecord[] = [
  {
    id: '1',
    name: 'John Dela Cruz',
    employeeType: 'Full-time',
    period: 'Oct 01 - Oct 15, 2023',
    grossPay: 45000,
    deductions: 4250,
    netPay: 40750,
    status: 'Paid',
    avatar: 'JD',
  },
  {
    id: '2',
    name: 'Maria Santos',
    employeeType: 'Part-time',
    period: 'Oct 01 - Oct 15, 2023',
    grossPay: 22500,
    deductions: 1120,
    netPay: 21380,
    status: 'Approved',
    avatar: 'MS',
  },
  {
    id: '3',
    name: 'Antonio Reyes',
    employeeType: 'Contractor',
    period: 'Oct 01 - Oct 15, 2023',
    grossPay: 18000,
    deductions: 500,
    netPay: 17500,
    status: 'Draft',
    avatar: 'AR',
  },
];

const statusColors = {
  Paid: 'bg-blue-100 text-blue-800',
  Approved: 'bg-green-100 text-green-800',
  Draft: 'bg-gray-100 text-gray-600',
};

const statusIcons = {
  Paid: '✓',
  Approved: '✓',
  Draft: '◐',
};

export default function PayrollRecords() {
  const [filters, setFilters] = useState<Filters>({
    period: 'October 2023',
    employeeType: 'All Types',
    status: 'All Status',
  });
  const [records, setRecords] = useState(mockRecords);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    // Filter logic would be implemented here
    console.log('Filters applied:', filters);
  };

  return (
    <div className="min-h-screen bg-surface pb-24 md:pb-0 md:pt-16">
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 h-14 bg-white border-b border-outline-variant">
        <div className="flex items-center gap-3">
          <button className="md:hidden text-primary">
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-bold text-primary">ElSpa Payroll</h1>
        </div>
        <nav className="hidden md:flex gap-8 text-on-surface-variant font-body-md">
          <a href="#" className="hover:text-primary transition">Dashboard</a>
          <a href="#" className="hover:text-primary transition">Staff</a>
          <a href="#" className="text-primary font-bold">Records</a>
        </nav>
        <div className="flex items-center gap-2">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuABBQEb6vrwSh-gskLcjcXyc_2HGXhVjpsAF8gYaTW2o4RVA8g6cDIzSZ7n5GfA32GgD8xxa8HEPghL-ZpnVYEiIJIHGfWgCw74aljK_6BtdIkiE2qPTbzdWwhsVzBEom4X2P1UmD5K-dMWTOEuCuPHWDURnQ-0yKA0-O4t_Yx5-ddlC8ld8_d7w47FB_RkWCGvuJuzJq0iYdpJ3qtiuYLB8JMT0D1pgw3DDQhzuYfyEsyae7eKw2kj1ATqbD7p0zKhYXUg9vsmggip"
            alt="Profile"
            className="w-8 h-8 rounded-full"
          />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-on-surface mb-2">Payroll Records</h2>
            <p className="text-body-md text-on-surface-variant">
              Manage and audit finalized salary distributions.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg bg-white hover:bg-surface-container transition">
              <Download size={18} />
              <span className="text-label-sm font-semibold">Download ZIP</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg bg-white hover:bg-surface-container transition">
              <Printer size={18} />
              <span className="text-label-sm font-semibold">Print</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 bg-white p-3 rounded-2xl border border-outline-variant">
          <div className="flex flex-col gap-1">
            <label className="text-label-sm font-semibold text-on-surface-variant uppercase">Period</label>
            <select
              value={filters.period}
              onChange={(e) => handleFilterChange('period', e.target.value)}
              className="px-3 py-2 border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option>October 2023</option>
              <option>September 2023</option>
              <option>August 2023</option>
              <option>Custom Range...</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-label-sm font-semibold text-on-surface-variant uppercase">Employee Type</label>
            <select
              value={filters.employeeType}
              onChange={(e) => handleFilterChange('employeeType', e.target.value)}
              className="px-3 py-2 border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option>All Types</option>
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Contractor</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-label-sm font-semibold text-on-surface-variant uppercase">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option>All Status</option>
              <option>Draft</option>
              <option>Approved</option>
              <option>Paid</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleApplyFilters}
              className="w-full h-11 bg-primary text-on-primary font-body-md rounded-lg hover:opacity-90 transition"
            >
              Apply Filters
            </button>
          </div>
        </section>

        {/* Records List */}
        <div className="space-y-3">
          {records.map((record) => (
            <div
              key={record.id}
              className="group relative bg-white border border-outline-variant rounded-2xl p-4 hover:shadow-md transition-shadow cursor-pointer flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              {/* Employee Info */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-primary font-bold text-sm">
                  {record.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-body-lg font-bold text-on-surface">{record.name}</span>
                    <span className="text-xs px-2 py-0.5 bg-surface-variant text-on-surface-variant rounded-full font-label-sm">
                      {record.employeeType}
                    </span>
                  </div>
                  <p className="text-body-md text-on-surface-variant">{record.period}</p>
                </div>
              </div>

              {/* Payment Amounts */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:flex-1 md:justify-end">
                <div className="flex flex-col md:items-end">
                  <span className="text-label-sm text-on-surface-variant">Gross Pay</span>
                  <span className="text-body-md font-data-mono text-tertiary font-semibold">
                    ₱{record.grossPay.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col md:items-end">
                  <span className="text-label-sm text-on-surface-variant">Deductions</span>
                  <span className="text-body-md font-data-mono text-error font-semibold">
                    -₱{record.deductions.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col md:items-end">
                  <span className="text-label-sm text-on-surface-variant">Net Pay</span>
                  <span className="text-lg font-bold text-green-600 font-data-mono">
                    ₱{record.netPay.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-between md:justify-end md:w-40 gap-2">
                <span className={`px-3 py-1 rounded-full text-label-sm font-bold uppercase ${statusColors[record.status]}`}>
                  {record.status}
                </span>
                <ChevronRight size={20} className="text-outline-variant group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="flex justify-center py-8">
          <button className="px-6 py-2 border border-primary text-primary font-body-md rounded-full hover:bg-primary-container hover:text-on-primary-container transition">
            Load More Records
          </button>
        </div>
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around bg-white border-t border-outline-variant py-2">
        {[
          { icon: '📊', label: 'Dashboard' },
          { icon: '👥', label: 'Staff' },
          { icon: '💳', label: 'Advances' },
          { icon: '📅', label: 'Attendance' },
          { icon: '📝', label: 'Records', active: true },
        ].map((item, idx) => (
          <a
            key={idx}
            href="#"
            className={`flex flex-col items-center justify-center py-2 px-3 ${
              item.active ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-xs font-semibold">{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}
