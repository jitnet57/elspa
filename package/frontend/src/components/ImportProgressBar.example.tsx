/**
 * ImportProgressBar 사용 예제 & 테스트
 * 경로: frontend/src/components/ImportProgressBar.example.tsx
 * 작성일: 2026-06-02
 *
 * 이 파일은 ImportProgressBar 컴포넌트와 useImportProgress 훅의
 * 실제 사용 방법을 보여주는 완전한 예제입니다.
 */

import React, { useCallback, useState } from 'react';
import ImportProgressBar, { ImportFailedRow } from './ImportProgressBar';
import { useImportProgress } from '@/hooks/useImportProgress';

/**
 * 📌 함수명: ImportExample
 * 📋 목적: 파일 가져오기 기능의 전체 플로우를 시연하는 컴포넌트
 * 🔧 매개변수: 없음
 * 📤 반환값: React.ReactNode
 * 📅 작성일: 2026-06-02
 */
export function ImportExample() {
  const TOTAL_ROWS = 100;
  const progress = useImportProgress(TOTAL_ROWS);

  // 파일 선택 상태
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  /**
   * 시뮬레이션: CSV 파일을 처리하는 함수
   * 실제 환경에서는 API 호출로 대체
   */
  const simulateImport = useCallback(async (file: File) => {
    progress.start();

    try {
      // CSV 파일 읽기
      const text = await file.text();
      const lines = text.split('\n').filter((line) => line.trim());

      // 헤더 스킵
      const dataLines = lines.slice(1);

      for (let i = 0; i < dataLines.length; i++) {
        // 네트워크 지연 시뮬레이션
        await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 200));

        const rowNumber = i + 2; // 헤더를 1이라 가정
        const rowData = { raw: dataLines[i] };

        // 행 파싱 및 검증 (시뮬레이션)
        if (Math.random() > 0.95) {
          // 5% 확률로 실패
          progress.addFailed(rowNumber, rowData, '유효하지 않은 이메일 형식', 'error');
        } else if (Math.random() > 0.98) {
          // 2% 확률로 경고
          progress.addWarning();
        } else {
          // 성공
          progress.addSuccess();
        }
      }

      progress.complete();
    } catch (error) {
      console.error('Import error:', error);
      progress.complete();
    }
  }, [progress]);

  /**
   * 실제 API를 사용한 가져오기 (예시)
   */
  const handleImportWithAPI = useCallback(async (file: File) => {
    progress.start();

    try {
      const formData = new FormData();
      formData.append('file', file);

      // 청크 단위로 파일 처리 (스트리밍)
      const chunkSize = 10; // 한번에 10개 행 처리
      // ... API 호출 로직 ...

      progress.complete();
    } catch (error) {
      console.error('Import error:', error);
      progress.complete();
    }
  }, [progress]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    await simulateImport(file);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">파일 가져오기 예제</h1>

      {/* 파일 선택 영역 */}
      {!progress.isImporting && progress.progress === 0 && (
        <div className="mb-8">
          <label className="block p-8 border-2 border-dashed border-blue-400 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
            <div className="text-center">
              <div className="text-4xl mb-2">📁</div>
              <p className="font-semibold text-gray-800">CSV 파일을 선택하세요</p>
              <p className="text-sm text-gray-600 mt-1">또는 여기에 드래그하세요</p>
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* 진행 중 또는 완료 상태 */}
      <ImportProgressBar
        isImporting={progress.isImporting}
        progress={progress.progress}
        totalRows={TOTAL_ROWS}
        successCount={progress.successCount}
        failedCount={progress.failedCount}
        warningCount={progress.warningCount}
        elapsedSeconds={progress.elapsedSeconds}
        estimatedSecondsRemaining={progress.estimatedSecondsRemaining}
        failedRows={progress.failedRows}
        title="직원 정보 가져오기"
        onDownloadLog={(csv) => {
          console.log('Error log downloaded:', csv);
        }}
      />

      {/* 재설정 버튼 */}
      {!progress.isImporting && progress.progress > 0 && (
        <div className="mt-8 text-center">
          <button
            onClick={() => {
              progress.reset();
              setSelectedFile(null);
            }}
            className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors font-medium"
          >
            새로운 파일 가져오기
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * 📌 함수명: AdvancedImportExample
 * 📋 목적: 실제 프로덕션 환경에서 사용할 수 있는 고급 예제
 * 🔧 매개변수: 없음
 * 📤 반환값: React.ReactNode
 * 📅 작성일: 2026-06-02
 */
export function AdvancedImportExample() {
  const TOTAL_ROWS = 500;
  const progress = useImportProgress(TOTAL_ROWS);

  const [fileInfo, setFileInfo] = useState<{
    name: string;
    size: number;
  } | null>(null);

  /**
   * 실제 API를 호출하는 가져오기 함수
   * 백엔드에서 Server-Sent Events (SSE)로 진행 상황을 실시간 전송
   */
  const handleImportWithSSE = useCallback(async (file: File) => {
    progress.start();

    try {
      const formData = new FormData();
      formData.append('file', file);

      // 서버에 파일 업로드 (멀티파트)
      const response = await fetch('/api/admin/import/therapists', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      // Server-Sent Events로 진행 상황 수신
      const eventSource = new EventSource(
        `/api/admin/import/therapists/progress?uploadId=${response.headers.get('X-Upload-ID')}`
      );

      eventSource.addEventListener('progress', (event) => {
        const data = JSON.parse(event.data);
        progress.setProgress(data.progress);

        if (data.type === 'success') {
          progress.addSuccess();
        } else if (data.type === 'failed') {
          progress.addFailed(data.rowNumber, data.rowData, data.error);
        } else if (data.type === 'warning') {
          progress.addWarning();
        }
      });

      eventSource.addEventListener('complete', () => {
        eventSource.close();
        progress.complete();
      });

      eventSource.addEventListener('error', (error) => {
        console.error('SSE error:', error);
        eventSource.close();
        progress.complete();
      });
    } catch (error) {
      console.error('Import error:', error);
      progress.complete();
    }
  }, [progress]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileInfo({
      name: file.name,
      size: file.size,
    });

    await handleImportWithSSE(file);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">고급 가져오기 (SSE 실시간)</h1>

      {/* 파일 정보 표시 */}
      {fileInfo && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">선택된 파일:</span> {fileInfo.name}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-semibold">파일 크기:</span> {(fileInfo.size / 1024).toFixed(2)} KB
          </p>
        </div>
      )}

      {/* 진행률 표시 */}
      <ImportProgressBar
        isImporting={progress.isImporting}
        progress={progress.progress}
        totalRows={TOTAL_ROWS}
        successCount={progress.successCount}
        failedCount={progress.failedCount}
        warningCount={progress.warningCount}
        elapsedSeconds={progress.elapsedSeconds}
        estimatedSecondsRemaining={progress.estimatedSecondsRemaining}
        failedRows={progress.failedRows}
        title="테라피스트 정보 일괄 가져오기"
        onDownloadLog={(csv) => {
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `import-errors-${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }}
      />

      {/* 파일 선택 버튼 (진행 중이 아닐 때만) */}
      {!progress.isImporting && (
        <div className="mt-8 text-center">
          <label className="inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium cursor-pointer">
            파일 선택
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>

          {progress.progress > 0 && (
            <button
              onClick={() => {
                progress.reset();
                setFileInfo(null);
              }}
              className="ml-4 px-6 py-3 bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors font-medium"
            >
              초기화
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * 📌 함수명: MinimalExample
 * 📋 목적: 최소한의 설정으로 사용하는 간단한 예제
 * 🔧 매개변수: 없음
 * 📤 반환값: React.ReactNode
 * 📅 작성일: 2026-06-02
 */
export function MinimalExample() {
  // 진행 상황 추적
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [counts, setCounts] = useState({ success: 0, failed: 0, warning: 0 });
  const [elapsed, setElapsed] = useState(0);
  const [failedRows, setFailedRows] = useState<ImportFailedRow[]>([]);

  const TOTAL_ROWS = 50;

  // 시뮬레이션 시작
  const startImport = async () => {
    setIsImporting(true);
    setCounts({ success: 0, failed: 0, warning: 0 });
    setProgress(0);
    setElapsed(0);
    setFailedRows([]);

    const startTime = Date.now();

    for (let i = 0; i < TOTAL_ROWS; i++) {
      await new Promise((resolve) => setTimeout(resolve, 100));

      const newProgress = Math.round(((i + 1) / TOTAL_ROWS) * 100);
      setProgress(newProgress);

      // 행 처리 결과 시뮬레이션
      if (Math.random() > 0.95) {
        setFailedRows((prev) => [
          ...prev,
          {
            rowNumber: i + 2,
            data: { id: i, name: `Row ${i}` },
            error: '필수 필드 누락: 이메일',
            type: 'error',
          },
        ]);
        setCounts((prev) => ({ ...prev, failed: prev.failed + 1 }));
      } else {
        setCounts((prev) => ({ ...prev, success: prev.success + 1 }));
      }

      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }

    setIsImporting(false);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">간단한 예제</h1>

      {!isImporting && progress === 0 && (
        <button
          onClick={startImport}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
        >
          가져오기 시작
        </button>
      )}

      <ImportProgressBar
        isImporting={isImporting}
        progress={progress}
        totalRows={TOTAL_ROWS}
        successCount={counts.success}
        failedCount={counts.failed}
        warningCount={counts.warning}
        elapsedSeconds={elapsed}
      />

      {!isImporting && progress > 0 && (
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setProgress(0);
              setCounts({ success: 0, failed: 0, warning: 0 });
              setElapsed(0);
              setFailedRows([]);
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm"
          >
            초기화
          </button>
        </div>
      )}
    </div>
  );
}

export default ImportExample;
