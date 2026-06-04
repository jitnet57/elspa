'use client';

export interface ExchangeRate {
  USD: number;  // USD to PHP rate
  PHP: number;  // PHP (always 1)
  lastUpdated: string;
}

// Mock 환율 데이터 (실제로는 API에서 조회)
const MOCK_RATES: ExchangeRate = {
  USD: 1,
  PHP: 56.5,  // 1 USD = 56.5 PHP
  lastUpdated: new Date().toISOString(),
};

export async function getExchangeRates(): Promise<ExchangeRate> {
  try {
    // 실시간 환율 API 예시 (exchangerate-api.com 무료 플랜)
    // const response = await fetch(
    //   'https://api.exchangerate-api.com/v4/latest/USD',
    //   { cache: 'no-store' }
    // );
    // const data = await response.json();
    // return {
    //   USD: 1,
    //   PHP: data.rates.PHP,
    //   lastUpdated: new Date().toISOString(),
    // };

    // 현재는 Mock 데이터 사용
    return MOCK_RATES;
  } catch (error) {
    console.error('환율 조회 실패:', error);
    return MOCK_RATES;
  }
}

export function convertPrice(amount: number, fromCurrency: 'USD' | 'PHP', rates: ExchangeRate): number {
  if (fromCurrency === 'PHP') {
    return amount / rates.PHP;  // PHP to USD
  } else {
    return amount * rates.PHP;  // USD to PHP
  }
}

export function formatPrice(amount: number, currency: 'USD' | 'PHP'): string {
  if (currency === 'USD') {
    return `$${amount.toFixed(2)}`;
  } else {
    return `₱${Math.round(amount).toLocaleString('en-US')}`;
  }
}
