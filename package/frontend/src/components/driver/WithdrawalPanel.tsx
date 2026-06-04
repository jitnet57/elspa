'use client';

import React, { useState, useEffect } from 'react';
import { useDriverStore } from '@/lib/store/driver-store';

// ============================================================
// 📌 출금 신청 패널
// 📋 목적: 드라이버 수익금 출금 요청
// 🔧 기능: 잔액 조회, 출금 요청, 이력 조회
// 📅 작성일: 2026-05-24
// ============================================================

interface WithdrawalBalance {
  driver_id: number;
  total_earnings: number;
  withdrawn_amount: number;
  available_balance: number;
  pending_withdrawals: number;
}

interface WithdrawalHistory {
  id: number;
  amount: number;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  bank_name: string;
  account_number: string;
  created_at: string;
  completed_at?: string;
}

export function WithdrawalPanel() {
  const { driverId } = useDriverStore();
  const [balance, setBalance] = useState<WithdrawalBalance | null>(null);
  const [history, setHistory] = useState<WithdrawalHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'request' | 'history'>('request');

  // 출금 요청 폼 상태
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 잔액 및 이력 조회
  useEffect(() => {
    if (!driverId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [balanceRes, historyRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/driver/withdrawal/balance?driver_id=${driverId}`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/driver/withdrawal/history?driver_id=${driverId}`),
        ]);

        if (balanceRes.ok) {
          const balanceData = await balanceRes.json();
          setBalance(balanceData);
        }

        if (historyRes.ok) {
          const historyData = await historyRes.json();
          setHistory(historyData.withdrawals || []);
        }
      } catch (err) {
        setError('데이터 조회 실패');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // 30초마다 자동 새로고침
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [driverId]);

  // 출금 요청 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverId || !amount || !bankName || !accountNumber || !accountHolder) {
      setError('모든 필드를 입력해주세요');
      return;
    }

    const withdrawAmount = parseFloat(amount);
    if (withdrawAmount <= 0) {
      setError('0보다 큰 금액을 입력해주세요');
      return;
    }

    if (balance && withdrawAmount > balance.available_balance) {
      setError(`출금 가능 금액(${balance.available_balance.toLocaleString()}원)을 초과했습니다`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        driver_id: driverId.toString(),
        amount: withdrawAmount.toString(),
        bank_name: bankName,
        account_number: accountNumber,
        account_holder: accountHolder,
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/driver/withdrawal/request?${params}`,
        { method: 'POST' }
      );

      if (response.ok) {
        setAmount('');
        setBankName('');
        setAccountNumber('');
        setAccountHolder('');
        // 데이터 새로고침
        const balanceRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/driver/withdrawal/balance?driver_id=${driverId}`
        );
        if (balanceRes.ok) {
          const balanceData = await balanceRes.json();
          setBalance(balanceData);
        }
        setActiveTab('history');
      } else {
        const errorData = await response.json();
        setError(errorData.detail || '출금 요청 실패');
      }
    } catch (err) {
      setError('출금 요청 중 오류가 발생했습니다');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'approved':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: '대기 중',
      approved: '승인됨',
      completed: '완료',
      rejected: '거절됨',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-40 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">💰 수익금 출금</h2>
        <p className="text-sm text-gray-600 mt-1">드라이버 수익금을 출금하세요</p>
      </div>

      {/* 잔액 정보 */}
      {balance && (
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 font-semibold">누적 수익</p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                ₩{balance.total_earnings.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold">출금액</p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                ₩{balance.withdrawn_amount.toLocaleString()}
              </p>
            </div>
            <div className="bg-green-50 rounded p-3 border border-green-200">
              <p className="text-xs text-green-700 font-semibold">출금 가능</p>
              <p className="text-lg font-bold text-green-700 mt-1">
                ₩{balance.available_balance.toLocaleString()}
              </p>
            </div>
          </div>
          {balance.pending_withdrawals > 0 && (
            <div className="mt-3 p-3 bg-yellow-50 rounded border border-yellow-200">
              <p className="text-xs text-yellow-700">
                ⏳ 대기 중인 출금: ₩{balance.pending_withdrawals.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3">
          <p className="text-sm text-red-700">❌ {error}</p>
        </div>
      )}

      {/* 탭 네비게이션 */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('request')}
          className={`flex-1 px-6 py-3 font-semibold text-sm transition-colors ${
            activeTab === 'request'
              ? 'border-b-2 border-purple-600 text-purple-600 bg-purple-50'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📝 출금 신청
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 px-6 py-3 font-semibold text-sm transition-colors ${
            activeTab === 'history'
              ? 'border-b-2 border-purple-600 text-purple-600 bg-purple-50'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📋 출금 이력
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="p-6">
        {activeTab === 'request' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 출금 금액 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                출금 금액 (원) *
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                disabled={isSubmitting}
                min="1000"
                step="1000"
              />
              <p className="text-xs text-gray-500 mt-1">최소: 1,000원</p>
            </div>

            {/* 은행명 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                은행명 *
              </label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                disabled={isSubmitting}
              >
                <option value="">선택해주세요</option>
                <option value="국민">국민은행</option>
                <option value="우리">우리은행</option>
                <option value="신한">신한은행</option>
                <option value="하나">하나은행</option>
                <option value="NH">NH농협</option>
                <option value="기업">기업은행</option>
                <option value="SC">SC은행</option>
                <option value="광주">광주은행</option>
                <option value="전북">전북은행</option>
                <option value="수협">수협</option>
              </select>
            </div>

            {/* 계좌번호 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                계좌번호 (하이픈 제외) *
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="예: 1234567890"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                disabled={isSubmitting}
              />
            </div>

            {/* 예금주명 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                예금주명 (확인이 필수입니다) *
              </label>
              <input
                type="text"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                placeholder="실명 입력"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                disabled={isSubmitting}
              />
            </div>

            {/* 제출 버튼 */}
            <button
              type="submit"
              disabled={isSubmitting || !balance || balance.available_balance === 0}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
            >
              {isSubmitting ? '처리 중...' : '출금 신청하기'}
            </button>
          </form>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            {history.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">출금 이력이 없습니다</p>
              </div>
            ) : (
              history.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-bold text-lg text-gray-900">
                          ₩{item.amount.toLocaleString()}
                        </p>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusBadgeColor(item.status)}`}
                        >
                          {getStatusLabel(item.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {item.bank_name} · {item.account_number}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        신청: {new Date(item.created_at).toLocaleDateString('ko-KR')}
                        {item.completed_at && ` · 완료: ${new Date(item.completed_at).toLocaleDateString('ko-KR')}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
