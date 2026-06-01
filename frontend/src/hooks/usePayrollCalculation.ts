// ============================================================
// 📌 파일명: usePayrollCalculation.ts
// 📋 목적: 급여 정산 API 호출 React 훅
// 🔧 기능: 단일 계산, 배치 처리, CSV 업로드
// 📅 작성일: 2026-05-28
// ============================================================

import { useState } from 'react';

export interface PayrollInput {
  employee_name: string;
  employee_id?: string;
  base_salary: number;
  commission: number;
  sss_tax: number;
  income_tax: number;
  other_deductions: number;
}

export interface PayrollResult {
  employee_name: string;
  employee_id?: string;
  gross_pay: number;
  total_deductions: number;
  net_pay: number;
  breakdown: {
    base: number;
    commission: number;
  };
  deduction_detail: {
    sss: number;
    tax: number;
    other: number;
  };
  validation_warnings: string[];
}

export interface BatchPayrollResponse {
  batch_id: string;
  total_records: number;
  successful: number;
  failed: number;
  warnings: string[];
  results: PayrollResult[];
  processing_time: number;
}

export function usePayrollCalculation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PayrollResult | null>(null);
  const [batchResult, setBatchResult] = useState<BatchPayrollResponse | null>(
    null
  );

  // API 베이스 URL
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

  /**
   * 단일 직원 급여 계산
   */
  const calculateSingle = async (input: PayrollInput) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/payroll/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || `계산 실패: ${response.statusText}`
        );
      }

      const data: PayrollResult = await response.json();
      setResult(data);
      return data;
    } catch (err: any) {
      const errorMessage = err.message || '계산 중 오류 발생';
      setError(errorMessage);
      console.error('급여 계산 오류:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 배치 급여 계산
   */
  const calculateBatch = async (records: PayrollInput[], batchName?: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/payroll/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          records,
          batch_name: batchName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '배치 처리 실패');
      }

      const data: BatchPayrollResponse = await response.json();
      setBatchResult(data);
      return data;
    } catch (err: any) {
      const errorMessage = err.message || '배치 처리 중 오류 발생';
      setError(errorMessage);
      console.error('배치 처리 오류:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * CSV 파일 업로드 및 배치 처리
   */
  const uploadCsv = async (file: File) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/api/payroll/batch-csv`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'CSV 업로드 실패');
      }

      const data: BatchPayrollResponse = await response.json();
      setBatchResult(data);
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'CSV 업로드 중 오류 발생';
      setError(errorMessage);
      console.error('CSV 업로드 오류:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 상태 초기화
   */
  const reset = () => {
    setResult(null);
    setBatchResult(null);
    setError(null);
  };

  return {
    // 상태
    loading,
    error,
    result,
    batchResult,

    // 함수
    calculateSingle,
    calculateBatch,
    uploadCsv,
    reset,
  };
}
