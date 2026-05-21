'use client';

/**
 * 📌 Advanced Filters Component
 * 📋 목적: 지출 데이터 고급 필터링
 * 🔧 포함: 날짜, 카테고리, 금액 범위, 설명 텍스트
 */

import { useState } from 'react';
import { useFinancialStore } from '@/lib/store/financial';

export interface FilterCriteria {
  startDate?: string;
  endDate?: string;
  categoryIds?: number[];
  minAmount?: number;
  maxAmount?: number;
  searchText?: string;
}

export function AdvancedFilters() {
  const store = useFinancialStore();
  const [filters, setFilters] = useState<FilterCriteria>({});
  const [isExpanded, setIsExpanded] = useState(false);

  const applyFilters = () => {
    // Zustand 스토어에서 필터링된 지출 계산
    let filtered = store.expenses;

    // 날짜 범위
    if (filters.startDate) {
      filtered = filtered.filter(
        (e) => new Date(e.expenseDate) >= new Date(filters.startDate!)
      );
    }
    if (filters.endDate) {
      filtered = filtered.filter(
        (e) => new Date(e.expenseDate) <= new Date(filters.endDate!)
      );
    }

    // 카테고리
    if (filters.categoryIds && filters.categoryIds.length > 0) {
      filtered = filtered.filter((e) =>
        filters.categoryIds!.includes(e.categoryId)
      );
    }

    // 금액 범위
    if (filters.minAmount !== undefined) {
      filtered = filtered.filter((e) => e.amount >= filters.minAmount!);
    }
    if (filters.maxAmount !== undefined) {
      filtered = filtered.filter((e) => e.amount <= filters.maxAmount!);
    }

    // 텍스트 검색 (설명)
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.description?.toLowerCase().includes(searchLower) ||
          store.categories
            .find((c) => c.id === e.categoryId)
            ?.name.toLowerCase()
            .includes(searchLower)
      );
    }

    return filtered;
  };

  const filteredExpenses = applyFilters();

  const resetFilters = () => {
    setFilters({});
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 font-semibold text-gray-900 hover:text-blue-600"
        >
          <span>{isExpanded ? '🔽' : '▶️'} Advanced Filters</span>
          <span className="text-sm text-gray-500">
            ({filteredExpenses.length} results)
          </span>
        </button>

        {Object.keys(filters).length > 0 && (
          <button
            onClick={resetFilters}
            className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded"
          >
            ✕ Clear All
          </button>
        )}
      </div>

      {/* 필터 UI */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 시작 날짜 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) =>
                setFilters({ ...filters, startDate: e.target.value || undefined })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* 종료 날짜 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) =>
                setFilters({ ...filters, endDate: e.target.value || undefined })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* 카테고리 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category
            </label>
            <select
              multiple
              value={filters.categoryIds?.map(String) || []}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  categoryIds: Array.from(e.target.selectedOptions, (opt) =>
                    parseInt(opt.value)
                  ),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              size={3}
            >
              {store.categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Ctrl+Click for multiple</p>
          </div>

          {/* 금액 범위 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Amount Range
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.minAmount || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    minAmount: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              />
              <span className="py-2">—</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.maxAmount || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    maxAmount: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* 텍스트 검색 */}
          <div className="lg:col-span-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search in description..."
              value={filters.searchText || ''}
              onChange={(e) =>
                setFilters({ ...filters, searchText: e.target.value || undefined })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      )}

      {/* 필터 요약 */}
      {Object.keys(filters).length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {filters.startDate && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                From: {new Date(filters.startDate).toLocaleDateString('en-PH')}
              </span>
            )}
            {filters.endDate && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                To: {new Date(filters.endDate).toLocaleDateString('en-PH')}
              </span>
            )}
            {filters.categoryIds && filters.categoryIds.length > 0 && (
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                Categories: {filters.categoryIds.length}
              </span>
            )}
            {(filters.minAmount !== undefined || filters.maxAmount !== undefined) && (
              <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">
                Amount: ₱{filters.minAmount || '0'} - ₱{filters.maxAmount || '∞'}
              </span>
            )}
            {filters.searchText && (
              <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                Search: "{filters.searchText}"
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
