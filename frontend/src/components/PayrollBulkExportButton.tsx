/**
 * 급여 정산서 일괄 내보내기 버튼 (ZIP)
 * 경로: frontend/src/components/PayrollBulkExportButton.tsx
 * 작성일: 2026-05-22
 *
 * Phase 8-3 Wave 3-1: PDF 정산서 생성
 * - 정산 기간의 모든 정산서를 ZIP 파일로 다운로드
 * - Admin 전용 기능
 */

import React, { useState } from 'react';
import { Download, Loader, Package } from 'lucide-react';

interface PayrollBulkExportButtonProps {
  periodId: number;
  periodStart?: string;
  periodEnd?: string;
  disabled?: boolean;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * 정산 기간 일괄 내보내기 (ZIP) 버튼 컴포넌트
 *
 * 사용 예시:
 * ```tsx
 * <PayrollBulkExportButton
 *   periodId={1}
 *   periodStart="2026-05-01"
 *   periodEnd="2026-05-07"
 *   onSuccess={() => console.log('Export completed')}
 * />
 * ```
 */
export function PayrollBulkExportButton({
  periodId,
  periodStart = '',
  periodEnd = '',
  disabled = false,
  onSuccess,
  onError,
}: PayrollBulkExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBulkExport = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // API 호출
      const response = await fetch(`/api/payroll/periods/${periodId}/pdf-export`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      // ZIP 바이너리 데이터 받기
      const blob = await response.blob();

      // 파일 다운로드
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // 파일명: 정산서_{periodStart}_{periodEnd}.zip
      const filename =
        periodStart && periodEnd
          ? `정산서_${periodStart}_${periodEnd}.zip`
          : `정산서_${periodId}.zip`;

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Success callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ZIP 파일 내보내기 실패';
      console.error('Bulk export error:', errorMessage);
      setError(errorMessage);

      // Error callback
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleBulkExport}
        disabled={disabled || isLoading}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded transition-colors"
        title="정산 기간의 모든 정산서를 ZIP 파일로 다운로드"
      >
        {isLoading ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            처리 중...
          </>
        ) : (
          <>
            <Package className="w-4 h-4" />
            일괄 내보내기 (ZIP)
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

export default PayrollBulkExportButton;
