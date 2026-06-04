'use client';

// ============================================================
// 📌 파일명: ExcelFileUpload.example.tsx
// 📋 목적: ExcelFileUpload 컴포넌트 사용 예시 및 데모
// 🔧 기술: React, TypeScript, Excel 파싱
// 📅 작성일: 2025-06-02
// ============================================================

import React, { useState } from 'react';
import ExcelFileUpload from './ExcelFileUpload';
import { ParsedExcelFile } from '@/lib/excel-parser';

/**
 * 📚 ExcelFileUpload 컴포넌트 사용 예시
 *
 * 이 예제에서는 다음을 보여줍니다:
 * 1. 기본 사용법 (onFileUpload 콜백)
 * 2. 에러 처리 (onError 콜백)
 * 3. 파싱된 데이터 활용
 * 4. 다양한 설정 옵션
 */

export const ExcelFileUploadExample: React.FC = () => {
  const [uploadedData, setUploadedData] = useState<ParsedExcelFile | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  /**
   * 📌 콜백: 파일 업로드 성공
   * 파싱된 Excel 데이터를 받으면 여기서 처리합니다
   */
  const handleFileUpload = (data: ParsedExcelFile) => {
    console.log('✅ 파일 업로드 성공:', data);
    setUploadedData(data);
    setLastError(null);

    // 📊 여기서 데이터를 서버로 전송하거나 저장할 수 있습니다
    // 예: API 호출, 상태 업데이트, 데이터베이스 저장 등
  };

  /**
   * 📌 콜백: 에러 처리
   */
  const handleUploadError = (error: string) => {
    console.error('❌ 업로드 오류:', error);
    setLastError(error);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Excel 업로드 데모</h1>
          <p className="text-lg text-gray-600">
            아래에서 Excel 또는 CSV 파일을 업로드하여 헤더와 데이터를 확인해보세요.
          </p>
        </div>

        {/* 업로드 컴포넌트 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <ExcelFileUpload
            onFileUpload={handleFileUpload}
            onError={handleUploadError}
            maxSizeMB={10}
            acceptedFormats={['xlsx', 'xls', 'csv']}
            showPreview={true}
          />
        </div>

        {/* 업로드된 데이터 정보 */}
        {uploadedData && (
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">📊 업로드된 데이터</h2>

            {/* 파일 정보 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">파일 정보</h3>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">시트명:</dt>
                  <dd className="font-medium text-gray-800">{uploadedData.sheetName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">행 수:</dt>
                  <dd className="font-medium text-gray-800">{uploadedData.rowCount}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">열 수:</dt>
                  <dd className="font-medium text-gray-800">{uploadedData.headers.length}</dd>
                </div>
              </dl>
            </div>

            {/* 헤더 목록 */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">열 헤더</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {uploadedData.headers.map((header, idx) => (
                  <div
                    key={idx}
                    className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded text-sm"
                  >
                    {header}
                  </div>
                ))}
              </div>
            </div>

            {/* JSON 형태 데이터 미리보기 */}
            {uploadedData.data.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">첫 번째 행 (JSON)</h3>
                <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                  {JSON.stringify(uploadedData.data[0], null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* 에러 정보 */}
        {lastError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-800 mb-2">마지막 오류</h3>
            <p className="text-red-700">{lastError}</p>
          </div>
        )}

        {/* 사용법 가이드 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">📚 사용법 가이드</h2>

          <div className="space-y-4">
            {/* 기본 사용 */}
            <details className="border border-gray-200 rounded-lg">
              <summary className="cursor-pointer font-semibold text-gray-800 p-4 hover:bg-gray-50">
                1️⃣ 기본 사용법
              </summary>
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
{`'use client';

import ExcelFileUpload from '@/components/ExcelFileUpload';
import { ParsedExcelFile } from '@/lib/excel-parser';

export default function Page() {
  const handleFileUpload = (data: ParsedExcelFile) => {
    console.log('업로드된 데이터:', data);
    // 데이터 처리...
  };

  return (
    <ExcelFileUpload
      onFileUpload={handleFileUpload}
      onError={(error) => console.error(error)}
    />
  );
}`}
                </pre>
              </div>
            </details>

            {/* ParsedExcelFile 인터페이스 */}
            <details className="border border-gray-200 rounded-lg">
              <summary className="cursor-pointer font-semibold text-gray-800 p-4 hover:bg-gray-50">
                2️⃣ ParsedExcelFile 인터페이스
              </summary>
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
{`interface ParsedExcelFile {
  headers: string[];           // 열 헤더 배열
  data: Record<string, any>[]; // 파싱된 데이터
  sheetName: string;           // 시트 이름
  rowCount: number;            // 행 개수
  error?: string;              // 에러 메시지 (선택사항)
}

// 사용 예:
const handleUpload = (parsedFile: ParsedExcelFile) => {
  console.log('헤더:', parsedFile.headers);
  console.log('첫 행:', parsedFile.data[0]);
  console.log('총 행수:', parsedFile.rowCount);
};`}
                </pre>
              </div>
            </details>

            {/* Props 옵션 */}
            <details className="border border-gray-200 rounded-lg">
              <summary className="cursor-pointer font-semibold text-gray-800 p-4 hover:bg-gray-50">
                3️⃣ Props 옵션
              </summary>
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
{`<ExcelFileUpload
  // 파일 업로드 완료 콜백
  onFileUpload={(data) => {...}}

  // 에러 콜백
  onError={(error) => {...}}

  // 최대 파일 크기 (MB, 기본값: 10)
  maxSizeMB={20}

  // 허용된 파일 형식 (기본값: xlsx, xls, csv)
  acceptedFormats={['xlsx', 'xls', 'csv']}

  // 데이터 미리보기 표시 여부 (기본값: true)
  showPreview={true}
/>`}
                </pre>
              </div>
            </details>

            {/* 유틸리티 함수 */}
            <details className="border border-gray-200 rounded-lg">
              <summary className="cursor-pointer font-semibold text-gray-800 p-4 hover:bg-gray-50">
                4️⃣ 유틸리티 함수
              </summary>
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
{`// excel-parser.ts의 공개 함수들

// 1. Excel 파일 파싱
import { parseExcelFile } from '@/lib/excel-parser';
const result = await parseExcelFile(file, 0);

// 2. 파일 유효성 검사
import { validateExcelFile } from '@/lib/excel-parser';
const validation = validateExcelFile(file, 10);

// 3. 시트명 조회
import { getExcelSheets } from '@/lib/excel-parser';
const sheets = await getExcelSheets(file);

// 4. 데이터 포맷팅
import { formatDataForDisplay } from '@/lib/excel-parser';
const preview = formatDataForDisplay(data, 10);`}
                </pre>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcelFileUploadExample;
