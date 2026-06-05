'use client';

/**
 * 📌 실시간 회사/업체 정보 동기화 Hook
 * 📋 Supabase guides 테이블 실시간 구독
 * 🔄 업체 추가/수정/삭제 시 자동 반영
 * 📅 작성일: 2026-06-06
 */

import { useEffect, useState, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase/client';

interface Company {
  id: number;
  name: string;
  referralFeePercentage: number;
  status: string;
}

interface CompaniesSummary {
  totalCompanies: number;
  activeCompanies: number;
  inactiveCompanies: number;
  totalReferralFee: number;
  averageReferralFee: number;
}

export function useRealtimeCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [summary, setSummary] = useState<CompaniesSummary>({
    totalCompanies: 0,
    activeCompanies: 0,
    inactiveCompanies: 0,
    totalReferralFee: 0,
    averageReferralFee: 0,
  });

  const [loading, setLoading] = useState(true);

  // 📊 회사 데이터 계산
  const calculateCompaniesData = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      setLoading(true);

      // 📋 모든 회사/업체 조회 (companies 테이블)
      const { data: companiesData } = await supabase
        .from('companies')
        .select('id, name, commission_rate, status')
        .order('id', { ascending: true });

      const companiesList: Company[] = (companiesData || []).map(c => ({
        id: c.id,
        name: c.name,
        referralFeePercentage: c.commission_rate || 0,
        status: c.status || 'active',
      }));

      setCompanies(companiesList);

      // 📊 통계 계산
      const totalCompanies = companiesList.length;
      const activeCompanies = companiesList.filter(c => c.status === 'active').length;
      const inactiveCompanies = totalCompanies - activeCompanies;
      const totalReferralFee = companiesList.reduce((sum, c) => sum + (c.referralFeePercentage || 0), 0);
      const averageReferralFee = totalCompanies > 0 ? totalReferralFee / totalCompanies : 0;

      setSummary({
        totalCompanies,
        activeCompanies,
        inactiveCompanies,
        totalReferralFee,
        averageReferralFee,
      });
    } catch (error) {
      console.error('❌ 회사 데이터 계산 실패:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 📌 초기 로드
  useEffect(() => {
    calculateCompaniesData();
  }, [calculateCompaniesData]);

  // 🔄 실시간 구독
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    // companies(회사/업체) 변경 감지
    const companySubscription = supabase
      .channel('companies:all')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'companies',
        },
        () => {
          console.log('🏢 회사 정보 변경 감지, 재계산...');
          calculateCompaniesData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(companySubscription);
    };
  }, [calculateCompaniesData]);

  return { companies, summary, loading, recalculate: calculateCompaniesData };
}
