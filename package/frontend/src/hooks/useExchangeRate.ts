'use client';

import { useEffect } from 'react';
import { useStore } from '@/lib/store/store';
import { getExchangeRates } from '@/lib/services/exchange-rate';

/**
 * 환율 자동 갱신 hook
 * 5분마다 환율을 조회하고 store에 반영합니다.
 * 앱 로드 시와 5분마다 자동으로 환율을 업데이트합니다.
 */
export const useExchangeRate = () => {
  const { rates, updateExchangeRate } = useStore();

  useEffect(() => {
    // 초기 환율 조회
    const fetchRates = async () => {
      try {
        const exchangeRate = await getExchangeRates();
        updateExchangeRate({
          USD: exchangeRate.USD,
          PHP: exchangeRate.PHP,
        });
      } catch (error) {
        console.error('환율 조회 실패:', error);
      }
    };

    // 마운트 시 즉시 조회
    fetchRates();

    // 5분(300초)마다 자동 갱신
    const interval = setInterval(fetchRates, 5 * 60 * 1000);

    // 언마운트 시 interval 정리
    return () => clearInterval(interval);
  }, [updateExchangeRate]);

  return rates;
};
