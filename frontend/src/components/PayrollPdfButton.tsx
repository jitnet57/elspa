/**
 * 급여 정산서 PDF 다운로드 버튼
 * 경로: frontend/src/components/PayrollPdfButton.tsx
 * 작성일: 2026-05-22
 *
 * Phase 8-3 Wave 3-1: PDF 정산서 생성
 * - 단일 정산서 PDF 다운로드 버튼
 * - Records 테이블에 추가되어 "다운로드" 버튼으로 사용
 */

import React, { useState } from 'react';

interface PayrollPdfButtonProps {
  recordId: number;
  employeeName?: string;
  periodStart?: string;
  periodEnd?: string;
  disabled?: boolean;
}

/**
 * 급여 정산서 PDF 다운로드 버튼 컴포넌트
 *
 * 사용 예시:
 * ```tsx
 * <PayrollPdfButton
 *   recordId={1}
 *   employeeName="Juan Dela Cruz"
 *   periodStart="2026-05-01"
 *   periodEnd="2026-05-07"
 * />
 * ```
 */
export function PayrollPdfButton({
  recordId,
  employeeName = '',
  periodStart = '',
  periodEnd = '',
  disabled = false,
}: PayrollPdfButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // API 호출
      const response = await fetch(`/api/payroll/records/${recordId}/pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      // PDF 바이너리 데이터 받기
      const blob = await response.blob();

      // 파일 다운로드
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // 파일명: 정산서_{employeeName}_{periodStart}_{periodEnd}.pdf
      const filename =
        employeeName && periodStart && periodEnd
          ? `정산서_${employeeName}_${periodStart}_${periodEnd}.pdf`
          : `정산서_${recordId}.pdf`;

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'PDF 다운로드 실패';
      console.error('PDF download error:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleDownload}
        disabled={disabled || isLoading}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded transition-colors"
        title="PDF 다운로드"
      >
        {isLoading ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            생성 중...
          </>
        ) : (
          <>
            <span>⬇️</span>
            다운로드
          </>
        )}
      </button>

      {error && (
        <span className="text-xs text-red-600" title={error}>
          오류 발생
        </span>
      )}
    </div>
  );
}

export default PayrollPdfButton;
