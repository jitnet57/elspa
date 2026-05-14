// CSV 내보내기 유틸리티

interface MonthlySettlement {
  id: number;
  company_id: number;
  guide_id: number;
  settlement_month: string;
  settlement_date: string;
  total_sessions: number;
  total_revenue: number;
  commission_rate: number;
  commission_amount: number;
  payment_amount: number;
  service_breakdown: Record<string, { sessions: number; revenue: number }>;
  status: 'pending' | 'confirmed' | 'paid';
  notes?: string;
  created_at: string;
}

interface Company {
  id: number;
  name: string;
}

interface Guide {
  id: number;
  name: string;
  company_id: number;
}

// CSV 헤더 추가 및 값 이스케이프
const escapeCSV = (value: any): string => {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

// 월정산 CSV 내보내기
export const exportMonthlySettlementCSV = (
  settlements: MonthlySettlement[],
  companies: Company[],
  guides: Guide[],
  month: string
) => {
  const rows: string[] = [];

  // 제목
  rows.push(`월정산 보고서 - ${month}`);
  rows.push('');

  // 요약 통계
  const totals = {
    revenue: settlements.reduce((sum, s) => sum + s.total_revenue, 0),
    commission: settlements.reduce((sum, s) => sum + s.commission_amount, 0),
    payment: settlements.reduce((sum, s) => sum + s.payment_amount, 0),
    sessions: settlements.reduce((sum, s) => sum + s.total_sessions, 0),
  };

  rows.push('📊 월정산 요약');
  rows.push(`총 수익,₩${totals.revenue.toLocaleString()}`);
  rows.push(`총 수수료,₩${totals.commission.toLocaleString()}`);
  rows.push(`총 지급액,₩${totals.payment.toLocaleString()}`);
  rows.push(`총 세션 수,${totals.sessions}`);
  rows.push('');

  // 상세 정산
  rows.push('📋 정산 상세');
  rows.push(
    [
      '업체명',
      '가이드명',
      '세션수',
      '총수익',
      '수수료율',
      '수수료',
      '지급액',
      '상태',
      '정산일',
      '비고',
    ]
      .map(escapeCSV)
      .join(',')
  );

  settlements.forEach(settlement => {
    const company = companies.find(c => c.id === settlement.company_id);
    const guide = guides.find(g => g.id === settlement.guide_id);

    const statusText = {
      pending: '미확정',
      confirmed: '확정',
      paid: '지급완료',
    }[settlement.status];

    rows.push(
      [
        company?.name || '알 수 없음',
        guide?.name || '알 수 없음',
        settlement.total_sessions,
        settlement.total_revenue,
        `${settlement.commission_rate}%`,
        settlement.commission_amount,
        settlement.payment_amount,
        statusText,
        settlement.settlement_date,
        settlement.notes || '',
      ]
        .map(escapeCSV)
        .join(',')
    );
  });

  return rows.join('\n');
};

// 정산 보고서 CSV 내보내기
export const exportSettlementReportCSV = (
  settlements: MonthlySettlement[],
  companies: Company[],
  guides: Guide[],
  month: string,
  reportType: 'monthly' | 'company' | 'guide'
) => {
  const rows: string[] = [];

  rows.push(`정산 보고서 (${month}) - ${reportType === 'monthly' ? '월별' : reportType === 'company' ? '회사별' : '가이드별'}`);
  rows.push('');

  if (reportType === 'monthly') {
    // 월별 보고서
    rows.push('📊 월별 정산 통계');
    rows.push('구분,금액,비율');

    const total_revenue = settlements.reduce((sum, s) => sum + s.total_revenue, 0);
    const total_commission = settlements.reduce((sum, s) => sum + s.commission_amount, 0);
    const total_payment = settlements.reduce((sum, s) => sum + s.payment_amount, 0);

    rows.push(`총 수익,${total_revenue},100%`);
    rows.push(`수수료 차감,${-total_commission},${((total_commission / total_revenue) * 100).toFixed(1)}%`);
    rows.push(`가이드 지급액,${total_payment},${((total_payment / total_revenue) * 100).toFixed(1)}%`);
  } else if (reportType === 'company') {
    // 회사별 보고서
    rows.push('회사명,수익,수수료,지급액,가이드수');

    const companyMap = new Map<number, any>();
    settlements.forEach(s => {
      if (!companyMap.has(s.company_id)) {
        companyMap.set(s.company_id, {
          revenue: 0,
          commission: 0,
          payment: 0,
          guides: new Set(),
        });
      }
      const company = companyMap.get(s.company_id)!;
      company.revenue += s.total_revenue;
      company.commission += s.commission_amount;
      company.payment += s.payment_amount;
      company.guides.add(s.guide_id);
    });

    companyMap.forEach((stats, companyId) => {
      const company = companies.find(c => c.id === companyId);
      rows.push(
        [company?.name || '알 수 없음', stats.revenue, stats.commission, stats.payment, stats.guides.size]
          .map(escapeCSV)
          .join(',')
      );
    });
  } else {
    // 가이드별 보고서
    rows.push('가이드명,회사명,세션,수익,수수료,지급액');

    settlements.forEach(s => {
      const guide = guides.find(g => g.id === s.guide_id);
      const company = companies.find(c => c.id === s.company_id);

      rows.push(
        [
          guide?.name || '알 수 없음',
          company?.name || '알 수 없음',
          s.total_sessions,
          s.total_revenue,
          s.commission_amount,
          s.payment_amount,
        ]
          .map(escapeCSV)
          .join(',')
      );
    });
  }

  return rows.join('\n');
};

// CSV 파일 다운로드
export const downloadCSV = (filename: string, csvContent: string) => {
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};
