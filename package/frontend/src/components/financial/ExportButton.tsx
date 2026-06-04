'use client';

/**
 * 📌 ExportButton Component
 * 📋 목적: 지출 데이터를 CSV/Excel로 내보내기
 * 🔧 포함: 2가지 형식 (CSV, Excel)
 */

import { useState } from 'react';
import { useFinancialStore } from '@/lib/store/financial';

export function ExportButton() {
  const store = useFinancialStore();
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = () => {
    setIsExporting(true);
    try {
      // 헤더
      const headers = ['Date', 'Category', 'Description', 'Amount (PHP)'];
      const rows = store.expenses.map((expense) => {
        const category = store.categories.find(c => c.id === expense.categoryId);
        return [
          new Date(expense.expenseDate).toLocaleDateString('en-PH'),
          category?.name || 'Unknown',
          expense.description || '-',
          expense.amount.toFixed(2)
        ];
      });

      // CSV 생성
      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // 다운로드
      downloadFile(
        csv,
        `financial-expenses-${store.selectedYear}-${store.selectedMonth}.csv`,
        'text/csv'
      );

      console.log('✅ CSV 내보내기 완료');
    } catch (error) {
      console.error('❌ CSV 내보내기 실패:', error);
      alert('CSV 내보내기 실패했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToExcel = () => {
    setIsExporting(true);
    try {
      // HTML 테이블 형식
      const html = `
        <table border="1">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Description</th>
              <th>Amount (PHP)</th>
            </tr>
          </thead>
          <tbody>
            ${store.expenses
              .map((expense) => {
                const category = store.categories.find(c => c.id === expense.categoryId);
                return `
                  <tr>
                    <td>${new Date(expense.expenseDate).toLocaleDateString('en-PH')}</td>
                    <td>${category?.name || 'Unknown'}</td>
                    <td>${expense.description || '-'}</td>
                    <td>${expense.amount.toFixed(2)}</td>
                  </tr>
                `;
              })
              .join('')}
          </tbody>
        </table>
      `;

      // Excel MIME 타입 (Excel 자동 감지)
      const blob = new Blob([html], {
        type: 'application/vnd.ms-excel;charset=utf-8'
      });

      downloadFile(
        blob,
        `financial-expenses-${store.selectedYear}-${store.selectedMonth}.xls`,
        'application/vnd.ms-excel'
      );

      console.log('✅ Excel 내보내기 완료');
    } catch (error) {
      console.error('❌ Excel 내보내기 실패:', error);
      alert('Excel 내보내기 실패했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  const downloadFile = (
    content: string | Blob,
    filename: string,
    mimeType: string
  ) => {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={exportToCSV}
        disabled={isExporting || store.expenses.length === 0}
        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
        title="Export as CSV"
      >
        {isExporting ? '⏳ Exporting...' : '📥 CSV'}
      </button>

      <button
        onClick={exportToExcel}
        disabled={isExporting || store.expenses.length === 0}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
        title="Export as Excel"
      >
        {isExporting ? '⏳ Exporting...' : '📊 Excel'}
      </button>
    </div>
  );
}
