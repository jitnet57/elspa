'use client';

import { formatPrice } from '@/lib/services/exchange-rate';
import { ExchangeRateState } from '@/lib/store/types';

interface PriceDisplayProps {
  amountUSD: number;
  rates: ExchangeRateState['rates'];
  showPHP?: boolean;
  className?: string;
  compact?: boolean; // 컴팩트 모드: $30 (₱1,695) 형식
}

/**
 * 이중 통화 가격 표시 컴포넌트
 * USD와 PHP 두 가지 통화로 가격을 표시합니다.
 */
export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  amountUSD,
  rates,
  showPHP = true,
  className = '',
  compact = false,
}) => {
  const amountPHP = Math.round(amountUSD * rates.PHP);
  const usdFormatted = formatPrice(amountUSD, 'USD');
  const phpFormatted = formatPrice(amountPHP, 'PHP');

  if (compact) {
    // 컴팩트 모드: $30 (₱1,695)
    return (
      <span className={`inline-flex items-center gap-1 ${className}`}>
        <span className="font-semibold">{usdFormatted}</span>
        {showPHP && (
          <span className="text-sm text-gray-600">
            ({phpFormatted})
          </span>
        )}
      </span>
    );
  }

  // 스택 모드 (세로)
  return (
    <div className={`text-center ${className}`}>
      <div className="text-lg font-bold text-blue-600">{usdFormatted}</div>
      {showPHP && (
        <div className="text-sm text-gray-600">{phpFormatted}</div>
      )}
    </div>
  );
};
