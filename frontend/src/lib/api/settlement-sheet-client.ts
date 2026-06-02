/**
 * ============================================================
 * 📌 정산 리포트 → Google Sheet 내보내기 클라이언트
 * 📋 정산 행 데이터를 2차원 배열로 만들어 백엔드 append 엔드포인트로 전송
 * 🔌 POST /api/booking/settlement/export
 * 📅 작성일: 2026-06-02
 * ============================================================
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface SettlementRow {
  company_id: number;
  guide_id: number;
  total_sessions: number;
  total_revenue: number;
  commission_rate: number;
  commission_amount: number;
  payment_amount: number;
  status: string;
}
interface NamedEntity { id: number; name: string }

// ============================================================
// 📌 buildSettlementRows: 정산 데이터를 시트용 2차원 배열로 변환
// 📤 [헤더행, ...상세행] — CSV와 유사한 컬럼 구성
// ============================================================
function buildSettlementRows(
  settlements: SettlementRow[],
  companies: NamedEntity[],
  guides: NamedEntity[],
): (string | number)[][] {
  const cname = (id: number) => companies.find((c) => c.id === id)?.name ?? `#${id}`;
  const gname = (id: number) => guides.find((g) => g.id === id)?.name ?? `#${id}`;

  const header = ['업체', '가이드', '세션수', '매출', '커미션율(%)', '커미션액', '지급액', '상태'];
  const rows = settlements.map((s) => [
    cname(s.company_id),
    gname(s.guide_id),
    s.total_sessions,
    s.total_revenue,
    s.commission_rate,
    s.commission_amount,
    s.payment_amount,
    s.status,
  ]);
  return [header, ...rows];
}

// ============================================================
// 📌 exportSettlementToSheet: 정산 리포트를 Google Sheet에 추가
// 🔧 month, reportType, settlements, companies, guides
// 📤 백엔드 응답({status,message,appended_rows})
// ============================================================
export async function exportSettlementToSheet(params: {
  month: string;
  reportType: 'monthly' | 'company' | 'guide';
  settlements: SettlementRow[];
  companies: NamedEntity[];
  guides: NamedEntity[];
}): Promise<{ status: string; message: string; appended_rows: number }> {
  const rows = buildSettlementRows(params.settlements, params.companies, params.guides);

  const res = await fetch(`${API_BASE}/api/booking/settlement/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ month: params.month, report_type: params.reportType, rows }),
  });

  if (res.status === 401) {
    throw new Error('구글 인증이 필요합니다. 먼저 Google 계정 연결(인증)을 진행하세요.');
  }
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail?.detail || 'Google Sheet 내보내기 실패');
  }
  return res.json();
}
