/**
 * ============================================================
 * 📌 Settlement Report API 클라이언트
 * 📋 목적: 정산 보고서 데이터 조회 및 정산 완료 처리
 * 🔧 기능:
 *    - getCompanySettlements(): 월별·업체별 정산 데이터 조회
 *    - markSettlementAsSettled(): 정산을 완료 상태로 변경
 *    - getSettlementSummary(): 기간별 정산 요약 통계
 * 📤 반환값: Promise<T>
 * 📅 작성일: 2026-06-02
 * ============================================================
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

// ────────────────────────────────────────────────────────────
// 타입 정의
// ────────────────────────────────────────────────────────────

export interface CompanySettlement {
  id: number;
  company_id: number;
  settlement_period_year: number;
  settlement_period_month: number;
  total_revenue: number;
  guest_revenue: number;
  credit_revenue: number;
  waived_revenue: number;
  recovery_rate: number;
  recovered_amount: number;
  platform_fee_rate: number;
  platform_fee: number;
  total_deductions: number;
  net_settlement: number;
  status: 'draft' | 'approved' | 'settled' | 'rejected' | 'confirmed' | 'pending' | 'waived';
  settlement_date: string | null;
  payment_date: string | null;
  payment_method: string | null;
  notes: string | null;
  dispute_notes: string | null;
  created_at: string;
  updated_at: string;
  transaction_count?: number;
}

export interface SettlementSummary {
  period: string;
  total_records: number;
  gross_total: number;
  actual_collected: number;
  total_deductions: number;
  net_total: number;
  by_status: Record<string, number>;
  by_company: Record<string, any>;
}

export interface MarkSettledRequest {
  payment_date?: string; // YYYY-MM-DD
  payment_method?: 'bank_transfer' | 'gcash' | 'cash' | 'check' | 'manual';
  paid_by?: string;
}

// ────────────────────────────────────────────────────────────
// 📌 getCompanySettlements
// 📋 목적: 정산 데이터 조회 (필터링 옵션)
// 🔧 매개변수:
//    - filters: { year?, month?, company_id?, status? }
//    - limit?: number (기본 100)
//    - offset?: number (기본 0)
// 📤 반환값: CompanySettlement[]
// ────────────────────────────────────────────────────────────
export async function getCompanySettlements(filters?: {
  year?: number;
  month?: number;
  company_id?: number;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<CompanySettlement[]> {
  const params = new URLSearchParams();

  if (filters) {
    if (filters.year) params.append('year', filters.year.toString());
    if (filters.month) params.append('month', filters.month.toString());
    if (filters.company_id) params.append('company_id', filters.company_id.toString());
    if (filters.status) params.append('status', filters.status);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());
  }

  const queryString = params.toString();
  const url = `${API_BASE}/api/settlements${queryString ? `?${queryString}` : ''}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('정산 데이터 조회 오류');
  }

  return res.json();
}

// ────────────────────────────────────────────────────────────
// 📌 markSettlementAsSettled
// 📋 목적: 정산을 완료 상태로 변경 (지급 완료 처리)
// 🔧 매개변수:
//    - settlementId: number
//    - data: MarkSettledRequest
// 📤 반환값: CompanySettlement (업데이트된 정산)
// ────────────────────────────────────────────────────────────
export async function markSettlementAsSettled(
  settlementId: number,
  data: MarkSettledRequest
): Promise<CompanySettlement> {
  const res = await fetch(`${API_BASE}/api/settlements/${settlementId}/mark-settled`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error('정산 상태 업데이트 오류');
  }

  return res.json();
}

// ────────────────────────────────────────────────────────────
// 📌 getSettlementSummary
// 📋 목적: 기간별 정산 요약 통계
// 🔧 매개변수:
//    - year: number
//    - month?: number (특정 월 조회, 없으면 연간 합계)
//    - company_id?: number (특정 업체 필터)
// 📤 반환값: SettlementSummary
// ────────────────────────────────────────────────────────────
export async function getSettlementSummary(
  year: number,
  month?: number,
  company_id?: number
): Promise<SettlementSummary> {
  const params = new URLSearchParams();
  params.append('year', year.toString());
  if (month) params.append('month', month.toString());
  if (company_id) params.append('company_id', company_id.toString());

  const res = await fetch(`${API_BASE}/api/settlements/summary?${params.toString()}`);
  if (!res.ok) {
    throw new Error('정산 요약 조회 오류');
  }

  return res.json();
}

// ────────────────────────────────────────────────────────────
// 📌 getSettlementById
// 📋 목적: 특정 정산 레코드 상세 조회
// 🔧 매개변수: settlementId (number)
// 📤 반환값: CompanySettlement
// ────────────────────────────────────────────────────────────
export async function getSettlementById(settlementId: number): Promise<CompanySettlement> {
  const res = await fetch(`${API_BASE}/api/settlements/${settlementId}`);
  if (!res.ok) {
    throw new Error('정산 조회 오류');
  }

  return res.json();
}

// ────────────────────────────────────────────────────────────
// 📌 updateSettlementStatus
// 📋 목적: 정산 상태 변경 (draft → approved → settled)
// 🔧 매개변수:
//    - settlementId: number
//    - status: 'draft' | 'approved' | 'settled' | 'rejected' | 'pending' | 'waived'
//    - notes?: string (상태 변경 사유)
// 📤 반환값: CompanySettlement
// ────────────────────────────────────────────────────────────
export async function updateSettlementStatus(
  settlementId: number,
  status: string,
  notes?: string
): Promise<CompanySettlement> {
  const res = await fetch(`${API_BASE}/api/settlements/${settlementId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, notes }),
  });

  if (!res.ok) {
    throw new Error('정산 상태 업데이트 오류');
  }

  return res.json();
}

// ────────────────────────────────────────────────────────────
// 📌 batchMarkSettled
// 📋 목적: 여러 정산을 일괄 완료 처리
// 🔧 매개변수:
//    - settlementIds: number[]
//    - payment_date?: string (YYYY-MM-DD)
//    - payment_method?: string
// 📤 반환값: { processed: number; succeeded: number; failed: number }
// ────────────────────────────────────────────────────────────
export async function batchMarkSettled(
  settlementIds: number[],
  payment_date?: string,
  payment_method?: string
): Promise<{ processed: number; succeeded: number; failed: number }> {
  const res = await fetch(`${API_BASE}/api/settlements/batch-mark-settled`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      settlement_ids: settlementIds,
      payment_date,
      payment_method,
    }),
  });

  if (!res.ok) {
    throw new Error('일괄 정산 처리 오류');
  }

  return res.json();
}

// ────────────────────────────────────────────────────────────
// 📌 exportSettlementReport
// 📋 목적: 정산 보고서 Excel 다운로드 (백엔드 생성)
// 🔧 매개변수:
//    - filters: { year?, month?, company_id?, status? }
// 📤 반환값: Blob (Excel 파일)
// ────────────────────────────────────────────────────────────
export async function exportSettlementReport(filters?: {
  year?: number;
  month?: number;
  company_id?: number;
  status?: string;
}): Promise<Blob> {
  const params = new URLSearchParams();

  if (filters) {
    if (filters.year) params.append('year', filters.year.toString());
    if (filters.month) params.append('month', filters.month.toString());
    if (filters.company_id) params.append('company_id', filters.company_id.toString());
    if (filters.status) params.append('status', filters.status);
  }

  const res = await fetch(
    `${API_BASE}/api/settlements/export?${params.toString()}`,
    { headers: { Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' } }
  );

  if (!res.ok) {
    throw new Error('정산 보고서 다운로드 오류');
  }

  return res.blob();
}

// ────────────────────────────────────────────────────────────
// 📌 getCompanySettlementHistory
// 📋 목적: 특정 업체의 정산 이력 조회 (최근 12개월)
// 🔧 매개변수:
//    - company_id: number
//    - months?: number (기본 12)
// 📤 반환값: CompanySettlement[]
// ────────────────────────────────────────────────────────────
export async function getCompanySettlementHistory(
  company_id: number,
  months: number = 12
): Promise<CompanySettlement[]> {
  const res = await fetch(
    `${API_BASE}/api/settlements/company/${company_id}/history?months=${months}`
  );

  if (!res.ok) {
    throw new Error('정산 이력 조회 오류');
  }

  return res.json();
}
