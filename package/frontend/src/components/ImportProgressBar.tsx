/**
 * 가져오기 진행 상황 및 결과 컴포넌트
 * 경로: frontend/src/components/ImportProgressBar.tsx
 * 작성일: 2026-06-02
 *
 * 기능:
 * 1. 진행 중: 진행률 바, 행 카운터, 성공/실패/경고 카운트, 경과 시간 및 예상 시간
 * 2. 완료 후: 최종 요약, 실패한 행 테이블, 에러 로그 다운로드
 *
 * 사용 예시:
 * ```tsx
 * <ImportProgressBar
 *   isImporting={true}
 *   progress={45}
 *   totalRows={100}
 *   successCount={40}
 *   failedCount={5}
 *   warningCount={0}
 *   elapsedSeconds={30}
 *   estimatedSecondsRemaining={35}
 *   failedRows={[]}
 * />
 * ```
 */

import React, { useMemo, useState } from 'react';

export interface ImportFailedRow {
  rowNumber: number;
  data: Record<string, unknown>;
  error: string;
  type?: 'error' | 'warning';
}

export interface ImportProgressBarProps {
  // 진행 상태
  isImporting: boolean;
  progress: number; // 0-100 (%)
  totalRows: number;
  successCount: number;
  failedCount: number;
  warningCount: number;
  elapsedSeconds: number;
  estimatedSecondsRemaining?: number;

  // 완료 후 결과
  failedRows?: ImportFailedRow[];
  title?: string;
  onDownloadLog?: (csvContent: string) => void;
}

/**
 * 📌 함수명: formatTime
 * 📋 목적: 초(seconds)를 HH:MM:SS 형식으로 변환
 * 🔧 매개변수: seconds (number) - 총 초 단위 시간
 * 📤 반환값: string - "HH:MM:SS" 형식
 * 📅 작성일: 2026-06-02
 */
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}시간 ${minutes}분 ${secs}초`;
  }
  if (minutes > 0) {
    return `${minutes}분 ${secs}초`;
  }
  return `${secs}초`;
}

/**
 * 📌 함수명: ImportProgressBar
 * 📋 목적: 파일 가져오기(Import)의 진행 상황을 시각적으로 표시하고 결과를 보여주는 컴포넌트
 * 🔧 매개변수: ImportProgressBarProps
 * 📤 반환값: React.ReactNode - 진행률 바 또는 최종 결과 테이블
 * 📅 작성일: 2026-06-02
 */
export function ImportProgressBar({
  isImporting,
  progress,
  totalRows,
  successCount,
  failedCount,
  warningCount,
  elapsedSeconds,
  estimatedSecondsRemaining = 0,
  failedRows = [],
  title = '파일 가져오기',
  onDownloadLog,
}: ImportProgressBarProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // 진행 중 정보
  const currentRowCount = successCount + failedCount + warningCount;
  const progressPercent = Math.min(Math.round(progress), 100);
  const elapsedTime = formatTime(elapsedSeconds);
  const estimatedTime = estimatedSecondsRemaining
    ? formatTime(estimatedSecondsRemaining)
    : '계산 중...';

  // 에러 로그 CSV 생성
  const generateErrorLog = useMemo(() => {
    return () => {
      // CSV 헤더
      const headers = ['행 번호', '에러 타입', '에러 메시지', '행 데이터'];
      const rows = failedRows.map((row) => [
        row.rowNumber,
        row.type || 'error',
        `"${row.error.replace(/"/g, '""')}"`, // CSV 이스케이프
        `"${JSON.stringify(row.data).replace(/"/g, '""')}"`,
      ]);

      const csv = [headers, ...rows]
        .map((row) => row.join(','))
        .join('\n');

      return csv;
    };
  }, [failedRows]);

  // 에러 로그 다운로드
  const handleDownloadLog = () => {
    const csv = generateErrorLog();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `import-errors-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onDownloadLog) {
      onDownloadLog(csv);
    }
  };

  // 행 확장/축소 토글
  const toggleRowExpanded = (rowNumber: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowNumber)) {
      newExpanded.delete(rowNumber);
    } else {
      newExpanded.add(rowNumber);
    }
    setExpandedRows(newExpanded);
  };

  // ========== 진행 중 상태 ==========
  if (isImporting) {
    return (
      <div className="w-full space-y-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        {/* 제목 */}
        <div className="flex items-center gap-3">
          <div className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>

        {/* 진행률 바 */}
        <div className="space-y-1">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-700">진행률</span>
            <span className="text-sm font-semibold text-blue-600">{progressPercent}%</span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* 행 카운터 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="text-xs text-gray-600 font-medium">처리된 행</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {currentRowCount} <span className="text-sm text-gray-500">/ {totalRows}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {/* 상태 카운트 */}
            <div className="flex gap-2 text-xs">
              <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded font-medium">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                성공 {successCount}
              </div>
              {failedCount > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded font-medium">
                  <span className="w-2 h-2 bg-red-500 rounded-full" />
                  실패 {failedCount}
                </div>
              )}
              {warningCount > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded font-medium">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                  경고 {warningCount}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 시간 정보 */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="text-xs text-gray-600 font-medium">경과 시간</div>
            <div className="font-mono text-gray-900 font-semibold mt-1">{elapsedTime}</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="text-xs text-gray-600 font-medium">예상 남은 시간</div>
            <div className="font-mono text-gray-900 font-semibold mt-1">{estimatedTime}</div>
          </div>
        </div>

        {/* 상세 정보 */}
        <div className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-200">
          <div>
            평균 처리 속도: <span className="font-mono font-semibold text-gray-900">
              {elapsedSeconds > 0
                ? (currentRowCount / (elapsedSeconds / 60)).toFixed(1)
                : '계산 중'}
            </span>{' '}
            행/분
          </div>
        </div>
      </div>
    );
  }

  // ========== 완료 상태 ==========
  const totalProcessed = successCount + failedCount + warningCount;
  const successRate = totalProcessed > 0 ? ((successCount / totalProcessed) * 100).toFixed(1) : '0';

  return (
    <div className="w-full space-y-6 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-300">
      {/* 완료 헤더 */}
      <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-300">
        <div className="text-3xl">✅</div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">{title} 완료</h3>
          <p className="text-sm text-gray-600">총 소요 시간: {elapsedTime}</p>
        </div>
      </div>

      {/* 최종 요약 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-600 font-medium">총 행</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{totalRows}</div>
        </div>

        <div className="bg-white p-4 rounded-lg border-2 border-green-300 shadow-sm bg-green-50">
          <div className="text-sm text-green-700 font-medium">성공</div>
          <div className="text-3xl font-bold text-green-600 mt-1">{successCount}</div>
          <div className="text-xs text-green-600 mt-1 font-semibold">{successRate}%</div>
        </div>

        {failedCount > 0 && (
          <div className="bg-white p-4 rounded-lg border-2 border-red-300 shadow-sm bg-red-50">
            <div className="text-sm text-red-700 font-medium">실패</div>
            <div className="text-3xl font-bold text-red-600 mt-1">{failedCount}</div>
            <div className="text-xs text-red-600 mt-1 font-semibold">
              {((failedCount / totalProcessed) * 100).toFixed(1)}%
            </div>
          </div>
        )}

        {warningCount > 0 && (
          <div className="bg-white p-4 rounded-lg border-2 border-yellow-300 shadow-sm bg-yellow-50">
            <div className="text-sm text-yellow-700 font-medium">경고</div>
            <div className="text-3xl font-bold text-yellow-600 mt-1">{warningCount}</div>
            <div className="text-xs text-yellow-600 mt-1 font-semibold">
              {((warningCount / totalProcessed) * 100).toFixed(1)}%
            </div>
          </div>
        )}
      </div>

      {/* 실패한 행 테이블 */}
      {failedRows.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-red-500">⚠️</span>
              실패한 행 ({failedCount}개)
            </h4>
            <button
              onClick={handleDownloadLog}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
              title="에러 로그를 CSV 파일로 다운로드"
            >
              📥 에러 로그 다운로드
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-300 shadow-sm">
            <table className="w-full text-sm bg-white">
              <thead>
                <tr className="bg-red-100 border-b border-red-200">
                  <th className="px-4 py-3 text-left font-semibold text-red-900 w-12">행</th>
                  <th className="px-4 py-3 text-left font-semibold text-red-900">에러 메시지</th>
                  <th className="px-4 py-3 text-left font-semibold text-red-900 w-20">타입</th>
                  <th className="px-4 py-3 text-center font-semibold text-red-900 w-12">상세</th>
                </tr>
              </thead>
              <tbody>
                {failedRows.slice(0, 50).map((row, index) => (
                  <React.Fragment key={`${row.rowNumber}-${index}`}>
                    <tr className="border-b border-gray-200 hover:bg-red-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-gray-600 font-semibold">
                        {row.rowNumber}
                      </td>
                      <td className="px-4 py-3 text-red-700 font-medium">
                        <span className="truncate inline-block max-w-xs" title={row.error}>
                          {row.error.substring(0, 80)}
                          {row.error.length > 80 ? '...' : ''}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                            row.type === 'warning'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {row.type === 'warning' ? '경고' : '오류'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleRowExpanded(row.rowNumber)}
                          className="text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                          title={expandedRows.has(row.rowNumber) ? '축소' : '확대'}
                        >
                          {expandedRows.has(row.rowNumber) ? '▼' : '▶'}
                        </button>
                      </td>
                    </tr>

                    {/* 확장된 행 - 상세 정보 */}
                    {expandedRows.has(row.rowNumber) && (
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <td colSpan={4} className="px-6 py-4">
                          <div className="space-y-3">
                            <div>
                              <div className="text-xs font-semibold text-gray-600 mb-1">
                                완전한 에러 메시지:
                              </div>
                              <div className="bg-white border border-red-200 rounded p-2 text-xs text-gray-800 font-mono whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                                {row.error}
                              </div>
                            </div>

                            <div>
                              <div className="text-xs font-semibold text-gray-600 mb-1">
                                행 데이터:
                              </div>
                              <div className="bg-white border border-gray-300 rounded p-2 text-xs text-gray-800 font-mono whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                                {JSON.stringify(row.data, null, 2)}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            {failedRows.length > 50 && (
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600 text-center font-medium">
                외 {failedRows.length - 50}개 항목 (CSV 다운로드로 모두 확인 가능)
              </div>
            )}
          </div>
        </div>
      )}

      {/* 성공 메시지 */}
      {failedCount === 0 && warningCount === 0 && (
        <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg">
          <p className="text-green-800 font-semibold text-center">
            🎉 모든 행을 성공적으로 가져왔습니다!
          </p>
        </div>
      )}
    </div>
  );
}

export default ImportProgressBar;
