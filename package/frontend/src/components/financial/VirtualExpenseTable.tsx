'use client';

/**
 * 📌 Expense Table Component (대용량 최적화)
 * 📋 목적: 대용량 지출 데이터를 효율적으로 표시
 * 🔧 포함: 스크롤 가능한 테이블, 페이지네이션
 */

import { useMemo, useState } from 'react';

export interface ExpenseItem {
  id: number;
  categoryId: number;
  categoryName: string;
  amount: number;
  expenseDate: string;
  description: string;
}

interface VirtualExpenseTableProps {
  expenses: ExpenseItem[];
  height?: number;
  itemsPerPage?: number;
  onRowClick?: (expense: ExpenseItem) => void;
}

export function VirtualExpenseTable({
  expenses,
  height = 500,
  itemsPerPage = 20,
  onRowClick,
}: VirtualExpenseTableProps) {
  const [currentPage, setCurrentPage] = useState(0);

  // 페이지네이션 계산
  const { paginatedItems, totalPages } = useMemo(() => {
    const total = Math.ceil(expenses.length / itemsPerPage);
    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;
    return {
      paginatedItems: expenses.slice(start, end),
      totalPages: total,
    };
  }, [expenses, currentPage, itemsPerPage]);

  if (expenses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        📊 지출 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gray-100 px-4 py-3 flex text-sm font-bold text-gray-700 border-b border-gray-200 sticky top-0 z-10">
        <div className="flex-1">날짜</div>
        <div className="flex-1 px-2">카테고리 / 설명</div>
        <div className="w-28 text-right">금액</div>
        <div className="w-16 text-right">ID</div>
      </div>

      {/* Table Body - Scrollable */}
      <div style={{ height: `${height}px`, overflowY: 'auto' }} className="divide-y divide-gray-100">
        {paginatedItems.map((expense, idx) => {
          const isEven = idx % 2 === 0;
          return (
            <div
              key={expense.id}
              onClick={() => onRowClick?.(expense)}
              className={`flex items-center px-4 py-3 text-sm border-b border-gray-100 ${
                isEven ? 'bg-white' : 'bg-gray-50'
              } hover:bg-blue-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
            >
              <div className="flex-1 text-gray-700 font-medium">
                {new Date(expense.expenseDate).toLocaleDateString('en-PH')}
              </div>

              <div className="flex-1 text-gray-600 truncate px-2">
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2">
                  {expense.categoryName}
                </span>
                {expense.description.slice(0, 25)}
                {expense.description.length > 25 ? '...' : ''}
              </div>

              <div className="w-28 text-right font-semibold text-gray-900">
                ₱{expense.amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>

              <div className="w-16 text-right text-xs text-gray-500">
                #{expense.id}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Stats & Pagination */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 space-y-2">
        <div className="text-xs text-gray-600 flex justify-between">
          <span>
            총 {expenses.length}개 항목 | 합계: ₱
            {expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString('en-PH', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span>📄 페이지 {currentPage + 1} / {totalPages}</span>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-2 pt-2">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded transition-colors"
            >
              ← 이전
            </button>

            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                let pageNum = i;
                if (totalPages > 5 && currentPage > 2) {
                  pageNum = currentPage - 2 + i;
                }
                if (pageNum >= totalPages) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      currentPage === pageNum
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
              className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded transition-colors"
            >
              다음 →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
