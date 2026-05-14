'use client';

import { useEffect } from 'react';
import { useStore } from '@/lib/store/store';

/**
 * 월정산 자동 스케줄링 hook
 * 앱 로드 시 각 업체의 정산일(settlement_day)을 확인하여
 * 정산일이 지났는데 해당 월 정산이 없으면 자동으로 생성합니다.
 */
export const useSettlementScheduler = () => {
  const { companies, guides, monthlySettlements, calculateMonthlySettlements, addNotification } =
    useStore();

  useEffect(() => {
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    // 활성화된 각 업체에 대해 정산일 확인
    companies
      .filter((company: any) => company.status === 'active')
      .forEach((company: any) => {
        const settlementDay = company.settlement_day;

        // 정산일이 아직 오지 않았으면 건너뜀
        if (today.getDate() < settlementDay) {
          return;
        }

        // 해당 업체의 가이드 목록 조회
        const companyGuides = guides.filter((g: any) => g.company_id === company.id);

        if (companyGuides.length === 0) {
          return;
        }

        // 해당 월 정산이 이미 있는지 확인
        const hasSettlement = companyGuides.some((guide: any) =>
          monthlySettlements.some(
            (s: any) => s.guide_id === guide.id && s.settlement_month === currentMonth
          )
        );

        // 정산이 없으면 자동 생성
        if (!hasSettlement) {
          calculateMonthlySettlements(currentMonth);
          addNotification({
            type: 'settlement_ready',
            message: `${company.name}의 ${currentMonth} 월정산이 자동으로 생성되었습니다.`,
            severity: 'info',
            isRead: false,
            action_url: '/admin/monthly-settlement',
          });
        }
      });
  }, []); // 마운트 시에만 1회 실행
};
