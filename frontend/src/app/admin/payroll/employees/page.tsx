'use client';

/**
 * 📌 Employee Management Page
 * 📋 목적: 직원 목록 조회, 검색, 필터링, CRUD 작업 (API 연동)
 * 🔧 포함: 직원 테이블, 타입 필터, 추가/수정/삭제 버튼, 모달
 * 📌 개선: Zustand store로 상태 관리, API 연동, Retry logic
 * 📅 작성일: 2026-05-22
 */

import { useState, useEffect } from 'react';
import { usePayrollStore } from '@/lib/store/payroll-store';
import { Employee } from '@/lib/api/payroll-client';

const EMPLOYEE_TYPES = [
  { value: 'manager', label: '👔 매니저', color: 'bg-purple-100 text-purple-700' },
  { value: 'hollys', label: '☕ 할리스커피', color: 'bg-amber-100 text-amber-700' },
  { value: 'nail', label: '💅 네일', color: 'bg-pink-100 text-pink-700' },
  { value: 'maintenance', label: '🔧 메인테넌스', color: 'bg-slate-100 text-slate-700' },
  { value: 'driver', label: '🚗 드라이버', color: 'bg-orange-100 text-orange-700' },
  { value: 'therapist', label: '👨‍⚕️ 테라피스트', color: 'bg-blue-100 text-blue-700' },
];

export default function EmployeesPage() {
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Employee>>({});

  // Zustand store
  const {
    employees,
    loading,
    error,
    fetchEmployees,
    createNewEmployee,
    updateExistingEmployee,
    deleteExistingEmployee,
    clearError,
  } = usePayrollStore();

  // Load employees on mount
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Filter employees when type or search changes
  useEffect(() => {
    let filtered = employees;

    if (filterType !== 'all') {
      filtered = filtered.filter(e => e.employee_type === filterType);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        e =>
          e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.phone.includes(searchQuery)
      );
    }

    setFilteredEmployees(filtered);
  }, [filterType, searchQuery, employees]);

  const handleOpenNewModal = () => {
    setSelectedEmployee(null);
    setFormData({
      employee_type: 'manager',
      pay_group: 'biweekly',
      commission_rate: 0,
      base_salary: 0,
      daily_wage: 0,
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleOpenEditModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData(employee);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSaveEmployee = async () => {
    if (!formData.name || !formData.employee_type) {
      alert('직원명과 직군을 입력하세요');
      return;
    }

    try {
      if (isEditing && selectedEmployee) {
        await updateExistingEmployee(selectedEmployee.id, formData);
        alert('Employee updated successfully');
      } else {
        await createNewEmployee({
          name: formData.name || '',
          phone: formData.phone || '',
          employee_type: formData.employee_type || 'manager',
          pay_group: formData.pay_group || 'biweekly',
          base_salary: formData.base_salary || 0,
          daily_wage: formData.daily_wage || 0,
          commission_rate: formData.commission_rate || 0,
          hire_date: formData.hire_date || new Date().toISOString().split('T')[0],
          is_active: true,
        } as any);
        alert('Employee created successfully');
      }
      setShowModal(false);
      setFormData({});
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error saving employee';
      alert(errorMsg);
    }
  };

  const handleDeleteEmployee = async (employeeId: number) => {
    if (!window.confirm('Are you sure you want to deactivate this employee?')) return;

    try {
      await deleteExistingEmployee(employeeId);
      alert('Employee deactivated successfully');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error deactivating employee';
      alert(errorMsg);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTypeColor = (type: string) => {
    const found = EMPLOYEE_TYPES.find(t => t.value === type);
    return found?.color || 'bg-gray-100 text-gray-700';
  };

  const getTypeLabel = (type: string) => {
    const found = EMPLOYEE_TYPES.find(t => t.value === type);
    return found?.label || type;
  };

  const activeCount = employees.filter(e => e.is_active).length;
  const inactiveCount = employees.filter(e => !e.is_active).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b-2 border-gray-200 px-4 py-6">
        <h1 className="text-3xl font-bold text-gray-900">👥 Employee Management</h1>
        <p className="text-gray-600 mt-1">Manage employee records, salary, and commission information</p>

        {/* Statistics */}
        <div className="flex gap-3 mt-4">
          <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-bold">
            Active: {activeCount}
          </div>
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-bold">
            Inactive: {inactiveCount}
          </div>
        </div>
      </div>

      <main className="px-4 py-6 pb-24">
        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <input
            type="text"
            placeholder="🔍 Search by name or phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-base font-medium"
          />

          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-full font-bold whitespace-nowrap transition-all ${
                filterType === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All Types
            </button>
            {EMPLOYEE_TYPES.map(type => (
              <button
                key={type.value}
                onClick={() => setFilterType(type.value)}
                className={`px-4 py-2 rounded-full font-bold whitespace-nowrap transition-all ${
                  filterType === type.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Employee List - Mobile */}
        <div className="lg:hidden space-y-3">
          {filteredEmployees.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-500 border-2 border-gray-200">
              No employees found
            </div>
          ) : (
            filteredEmployees.map(employee => (
              <div
                key={employee.id}
                className="bg-white rounded-2xl p-4 border-2 border-gray-100 shadow-sm"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                    {employee.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900">{employee.name}</h3>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-1 ${getTypeColor(employee.employee_type)}`}>
                      {getTypeLabel(employee.employee_type)}
                    </span>
                  </div>
                  {!employee.is_active && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-bold">
                      INACTIVE
                    </span>
                  )}
                </div>

                <div className="space-y-2 mb-3 pb-3 border-b border-gray-100">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Phone:</span>
                    <span className="text-sm font-bold text-gray-900">{employee.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Pay Group:</span>
                    <span className="text-sm font-bold text-gray-900 uppercase">{employee.pay_group}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Base Salary:</span>
                    <span className="text-sm font-bold text-blue-600">{formatCurrency(employee.base_salary)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Commission:</span>
                    <span className="text-sm font-bold text-orange-600">{employee.commission_rate}%</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEditModal(employee)}
                    className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg text-sm"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDeleteEmployee(employee.id)}
                    disabled={!employee.is_active}
                    className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-bold rounded-lg text-sm"
                  >
                    🗑️ Deactivate
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Employee List - Desktop Table */}
        <div className="hidden lg:block">
          {filteredEmployees.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-500 border-2 border-gray-200">
              No employees found
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Phone</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Pay Group</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">Base Salary</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Commission</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Hire Date</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Status</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map(employee => (
                    <tr
                      key={employee.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        !employee.is_active ? 'opacity-60' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {employee.name[0]}
                          </div>
                          <span className="font-bold text-gray-900">{employee.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${getTypeColor(employee.employee_type)}`}>
                          {getTypeLabel(employee.employee_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{employee.phone}</td>
                      <td className="px-6 py-4 text-center text-sm font-bold text-gray-900 uppercase">
                        {employee.pay_group}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-blue-600">
                        {formatCurrency(employee.base_salary)}
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-bold text-orange-600">
                        {employee.commission_rate}%
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-700">
                        {formatDate(employee.hire_date)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                            employee.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {employee.is_active ? '✅ Active' : '❌ Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(employee)}
                          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded text-xs transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(employee.id)}
                          disabled={!employee.is_active}
                          className="px-3 py-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-bold rounded text-xs transition-all"
                        >
                          Deactivate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add Button */}
      <button
        onClick={handleOpenNewModal}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:shadow-xl transition-all active:scale-95 z-50 font-bold"
      >
        +
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end lg:items-center justify-center z-50">
          <div className="bg-white w-full lg:max-w-2xl rounded-t-3xl lg:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b-2 border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {isEditing ? '✏️ Edit Employee' : '➕ New Employee'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setFormData({});
                }}
                className="text-4xl text-gray-400 hover:text-gray-600 leading-none"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">Name *</label>
                <input
                  type="text"
                  placeholder="Full name"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">Phone *</label>
                <input
                  type="tel"
                  placeholder="+63-917-1234-5678"
                  value={formData.phone || ''}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">Employee Type *</label>
                <select
                  value={formData.employee_type || 'therapist'}
                  onChange={e => setFormData({ ...formData, employee_type: e.target.value as any })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  {EMPLOYEE_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 block">Pay Group *</label>
                  <select
                    value={formData.pay_group || 'weekly'}
                    onChange={e => setFormData({ ...formData, pay_group: e.target.value as any })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-Weekly</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 block">Hire Date *</label>
                  <input
                    type="date"
                    value={formData.hire_date || ''}
                    onChange={e => setFormData({ ...formData, hire_date: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 block">기본급 (정직원, ₱)</label>
                  <input
                    type="number"
                    placeholder="30000"
                    value={formData.base_salary || ''}
                    onChange={e => setFormData({ ...formData, base_salary: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 block">개별 일급 (다른직원, ₱)</label>
                  <input
                    type="number"
                    placeholder="1400"
                    value={(formData as any).daily_wage || ''}
                    onChange={e => setFormData({ ...formData, daily_wage: parseFloat(e.target.value) || 0 } as any)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1">
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 block">커미션율 (%) — 가이드/수수료직 한정</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.commission_rate || ''}
                    onChange={e => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-8">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setFormData({});
                  }}
                  className="px-6 py-4 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEmployee}
                  disabled={loading}
                  className="px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold rounded-xl transition-colors"
                >
                  {loading ? '💫 Saving...' : isEditing ? '✏️ Update' : '➕ Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
