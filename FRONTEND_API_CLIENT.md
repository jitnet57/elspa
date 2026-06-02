# 프론트엔드 API 클라이언트 가이드

**작성일:** 2026-06-02  
**대상:** 프론트엔드 개발자 (TypeScript/Next.js)

---

## 📦 설치

### 의존성

```bash
npm install axios zod zustand
# 또는
yarn add axios zod zustand
```

---

## 🔧 API 클라이언트 생성

### 1. Zod 타입 정의

**파일:** `src/lib/api/payment-settlement-types.ts`

```typescript
import { z } from 'zod';
import { Decimal } from 'decimal.js';

// ============================================================
// 열거형
// ============================================================

export const PaymentMethodTypeSchema = z.enum([
  'bank_transfer',
  'gcash',
  'cash',
  'check',
  'card',
  'manual',
]);

export const SSSStatusSchema = z.enum([
  'not_applicable',
  'prepaid',
  'gov_invoice',
  'full_recovery',
]);

export const PaymentFromTypeSchema = z.enum([
  'customer',
  'company_credit',
  'voucher',
  'membership',
  'promo',
]);

export const SettlementStatusSchema = z.enum([
  'pending',
  'draft',
  'approved',
  'settled',
  'confirmed',
  'rejected',
]);

// ============================================================
// 요청 스키마
// ============================================================

export const PaymentMethodCreateSchema = z.object({
  payment_method: PaymentMethodTypeSchema,
  account_number: z.string().optional(),
  account_name: z.string().optional(),
  bank_name: z.string().optional(),
  gcash_number: z.string().optional(),
  notes: z.string().optional(),
});

export const SSSOptionUpdateSchema = z.object({
  sss_status: SSSStatusSchema,
  sss_contribution_percent: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
});

export const PaymentSourceUpdateSchema = z.object({
  payment_from: PaymentFromTypeSchema,
  company_credit_id: z.number().optional(),
  voucher_id: z.number().optional(),
  notes: z.string().optional(),
});

export const SettlementMarkSettledRequestSchema = z.object({
  payment_method: PaymentMethodTypeSchema,
  payment_date: z.string().date(),
  notes: z.string().optional(),
  paid_by: z.string().optional(),
});

// ============================================================
// 응답 스키마
// ============================================================

export const PaymentMethodResponseSchema = z.object({
  id: z.number(),
  booking_id: z.number(),
  payment_method: PaymentMethodTypeSchema,
  account_number: z.string().nullable(),
  account_name: z.string().nullable(),
  bank_name: z.string().nullable(),
  gcash_number: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const SSSOptionResponseSchema = z.object({
  booking_id: z.number(),
  sss_status: SSSStatusSchema,
  sss_contribution_percent: z.number().nullable(),
  notes: z.string().nullable(),
  updated_at: z.string().datetime(),
});

export const PaymentSourceResponseSchema = z.object({
  booking_id: z.number(),
  payment_from: PaymentFromTypeSchema,
  company_credit_id: z.number().nullable(),
  voucher_id: z.number().nullable(),
  notes: z.string().nullable(),
  updated_at: z.string().datetime(),
});

export const SettlementTransactionDetailSchema = z.object({
  id: z.number(),
  booking_id: z.number().nullable(),
  transaction_type: z.string(),
  settlement_category: z.string(),
  amount: z.string(), // Decimal로 처리
  recovery_rate: z.string(),
  recovered_amount: z.string(),
  transaction_date: z.string().date(),
  notes: z.string().nullable(),
});

export const SettlementPendingSchema = z.object({
  id: z.number(),
  company_id: z.number(),
  settlement_period_year: z.number(),
  settlement_period_month: z.number(),
  total_revenue: z.string(),
  guest_revenue: z.string(),
  credit_revenue: z.string(),
  waived_revenue: z.string(),
  recovery_rate: z.string(),
  platform_fee: z.string(),
  net_settlement: z.string(),
  status: SettlementStatusSchema,
  transactions: z.array(SettlementTransactionDetailSchema),
  created_at: z.string().datetime(),
});

export const SettlementListResponseSchema = z.object({
  total: z.number(),
  pending_count: z.number(),
  items: z.array(SettlementPendingSchema),
});

export const SettlementMarkedSettledSchema = z.object({
  id: z.number(),
  status: SettlementStatusSchema,
  payment_method: PaymentMethodTypeSchema,
  payment_date: z.string().date(),
  net_settlement: z.string(),
  updated_at: z.string().datetime(),
});

export const BookingPaymentInfoSchema = z.object({
  booking_id: z.number(),
  payment_method: PaymentMethodTypeSchema.nullable(),
  payment_from: PaymentFromTypeSchema.nullable(),
  sss_status: SSSStatusSchema.nullable(),
  payment_method_details: PaymentMethodResponseSchema.nullable(),
  updated_at: z.string().datetime(),
});

// ============================================================
// TypeScript 타입 추출
// ============================================================

export type PaymentMethodType = z.infer<typeof PaymentMethodTypeSchema>;
export type SSSStatus = z.infer<typeof SSSStatusSchema>;
export type PaymentFromType = z.infer<typeof PaymentFromTypeSchema>;
export type SettlementStatus = z.infer<typeof SettlementStatusSchema>;

export type PaymentMethodCreate = z.infer<typeof PaymentMethodCreateSchema>;
export type SSSOptionUpdate = z.infer<typeof SSSOptionUpdateSchema>;
export type PaymentSourceUpdate = z.infer<typeof PaymentSourceUpdateSchema>;
export type SettlementMarkSettledRequest = z.infer<typeof SettlementMarkSettledRequestSchema>;

export type PaymentMethodResponse = z.infer<typeof PaymentMethodResponseSchema>;
export type SSSOptionResponse = z.infer<typeof SSSOptionResponseSchema>;
export type PaymentSourceResponse = z.infer<typeof PaymentSourceResponseSchema>;
export type SettlementPending = z.infer<typeof SettlementPendingSchema>;
export type SettlementListResponse = z.infer<typeof SettlementListResponseSchema>;
export type SettlementMarkedSettled = z.infer<typeof SettlementMarkedSettledSchema>;
export type BookingPaymentInfo = z.infer<typeof BookingPaymentInfoSchema>;
```

### 2. API 클라이언트

**파일:** `src/lib/api/payment-settlement-client.ts`

```typescript
import axios, { AxiosInstance } from 'axios';
import {
  PaymentMethodCreate,
  PaymentMethodResponse,
  SSSOptionUpdate,
  SSSOptionResponse,
  PaymentSourceUpdate,
  PaymentSourceResponse,
  SettlementListResponse,
  SettlementPending,
  SettlementMarkSettledRequest,
  SettlementMarkedSettled,
  BookingPaymentInfo,
  PaymentMethodResponseSchema,
  SSSOptionResponseSchema,
  PaymentSourceResponseSchema,
  SettlementPendingSchema,
  SettlementListResponseSchema,
  SettlementMarkedSettledSchema,
  BookingPaymentInfoSchema,
} from './payment-settlement-types';


class PaymentSettlementClient {
  private client: AxiosInstance;

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 응답 인터셉터: 토큰 추가
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // ============================================================
  // 결제 방법 API
  // ============================================================

  /**
   * 예약에 결제 방법 추가
   */
  async addPaymentMethod(
    bookingId: number,
    payload: PaymentMethodCreate,
  ): Promise<PaymentMethodResponse> {
    const response = await this.client.post(
      `/api/bookings/${bookingId}/payment-methods`,
      payload,
    );
    return PaymentMethodResponseSchema.parse(response.data);
  }

  // ============================================================
  // SSS 옵션 API
  // ============================================================

  /**
   * SSS 정산 옵션 업데이트
   */
  async updateSSSOption(
    bookingId: number,
    payload: SSSOptionUpdate,
  ): Promise<SSSOptionResponse> {
    const response = await this.client.patch(
      `/api/bookings/${bookingId}/sss-option`,
      payload,
    );
    return SSSOptionResponseSchema.parse(response.data);
  }

  // ============================================================
  // 결제 출처 API
  // ============================================================

  /**
   * 결제 출처 업데이트
   */
  async updatePaymentSource(
    bookingId: number,
    payload: PaymentSourceUpdate,
  ): Promise<PaymentSourceResponse> {
    const response = await this.client.patch(
      `/api/bookings/${bookingId}/payment-from`,
      payload,
    );
    return PaymentSourceResponseSchema.parse(response.data);
  }

  // ============================================================
  // 예약 결제 정보 API
  // ============================================================

  /**
   * 예약의 결제 정보 조회
   */
  async getBookingPaymentInfo(bookingId: number): Promise<BookingPaymentInfo> {
    const response = await this.client.get(
      `/api/bookings/${bookingId}/payment-info`,
    );
    return BookingPaymentInfoSchema.parse(response.data);
  }

  // ============================================================
  // 정산 API
  // ============================================================

  /**
   * 정산 대기 목록 조회
   */
  async getPendingSettlements(
    skip: number = 0,
    limit: number = 100,
    companyId?: number,
    statusFilter?: string,
  ): Promise<SettlementListResponse> {
    const response = await this.client.get('/api/settlements/pending', {
      params: {
        skip,
        limit,
        ...(companyId && { company_id: companyId }),
        ...(statusFilter && { status_filter: statusFilter }),
      },
    });
    return SettlementListResponseSchema.parse(response.data);
  }

  /**
   * 정산 상세 조회
   */
  async getSettlementDetails(settlementId: number): Promise<SettlementPending> {
    const response = await this.client.get(`/api/settlements/${settlementId}`);
    return SettlementPendingSchema.parse(response.data);
  }

  /**
   * 정산 완료 처리
   */
  async markSettlementAsSettled(
    settlementId: number,
    payload: SettlementMarkSettledRequest,
  ): Promise<SettlementMarkedSettled> {
    const response = await this.client.patch(
      `/api/settlements/${settlementId}/mark-settled`,
      payload,
    );
    return SettlementMarkedSettledSchema.parse(response.data);
  }
}

export const paymentSettlementClient = new PaymentSettlementClient();
```

### 3. Zustand 스토어

**파일:** `src/lib/stores/payment-settlement-store.ts`

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  BookingPaymentInfo,
  SettlementListResponse,
  SettlementPending,
} from '@/lib/api/payment-settlement-types';
import { paymentSettlementClient } from '@/lib/api/payment-settlement-client';


interface PaymentSettlementState {
  // 상태
  bookingPaymentInfo: Record<number, BookingPaymentInfo>;
  pendingSettlements: SettlementListResponse | null;
  selectedSettlement: SettlementPending | null;
  isLoading: boolean;
  error: string | null;

  // 액션
  fetchBookingPaymentInfo: (bookingId: number) => Promise<void>;
  fetchPendingSettlements: (skip?: number, limit?: number) => Promise<void>;
  fetchSettlementDetails: (settlementId: number) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const usePaymentSettlementStore = create<PaymentSettlementState>()(
  devtools((set) => ({
    bookingPaymentInfo: {},
    pendingSettlements: null,
    selectedSettlement: null,
    isLoading: false,
    error: null,

    fetchBookingPaymentInfo: async (bookingId: number) => {
      set({ isLoading: true, error: null });
      try {
        const data = await paymentSettlementClient.getBookingPaymentInfo(bookingId);
        set((state) => ({
          bookingPaymentInfo: {
            ...state.bookingPaymentInfo,
            [bookingId]: data,
          },
        }));
      } catch (error) {
        set({ error: (error as Error).message });
      } finally {
        set({ isLoading: false });
      }
    },

    fetchPendingSettlements: async (skip = 0, limit = 100) => {
      set({ isLoading: true, error: null });
      try {
        const data = await paymentSettlementClient.getPendingSettlements(skip, limit);
        set({ pendingSettlements: data });
      } catch (error) {
        set({ error: (error as Error).message });
      } finally {
        set({ isLoading: false });
      }
    },

    fetchSettlementDetails: async (settlementId: number) => {
      set({ isLoading: true, error: null });
      try {
        const data = await paymentSettlementClient.getSettlementDetails(settlementId);
        set({ selectedSettlement: data });
      } catch (error) {
        set({ error: (error as Error).message });
      } finally {
        set({ isLoading: false });
      }
    },

    clearError: () => set({ error: null }),
    reset: () =>
      set({
        bookingPaymentInfo: {},
        pendingSettlements: null,
        selectedSettlement: null,
        isLoading: false,
        error: null,
      }),
  })),
);
```

---

## 🎨 React 컴포넌트 예제

### 1. 결제 방법 추가 폼

**파일:** `src/app/admin/payment/AddPaymentMethodForm.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  PaymentMethodCreate,
  PaymentMethodCreateSchema,
  PaymentMethodTypeSchema,
} from '@/lib/api/payment-settlement-types';
import { paymentSettlementClient } from '@/lib/api/payment-settlement-client';


interface AddPaymentMethodFormProps {
  bookingId: number;
  onSuccess?: () => void;
}

export function AddPaymentMethodForm({
  bookingId,
  onSuccess,
}: AddPaymentMethodFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PaymentMethodCreate>({
    resolver: zodResolver(PaymentMethodCreateSchema),
  });

  const paymentMethod = watch('payment_method');

  const onSubmit = async (data: PaymentMethodCreate) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await paymentSettlementClient.addPaymentMethod(bookingId, data);
      alert('결제 방법이 추가되었습니다.');
      onSuccess?.();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="payment_method" className="block text-sm font-medium">
          지급 방법
        </label>
        <select
          {...register('payment_method')}
          className="mt-1 block w-full rounded border px-3 py-2"
        >
          <option value="">선택...</option>
          <option value="bank_transfer">은행 송금</option>
          <option value="gcash">GCash</option>
          <option value="cash">현금</option>
          <option value="check">수표</option>
          <option value="card">카드</option>
          <option value="manual">수기 기록</option>
        </select>
        {errors.payment_method && (
          <p className="text-red-500">{errors.payment_method.message}</p>
        )}
      </div>

      {paymentMethod === 'bank_transfer' && (
        <>
          <div>
            <label htmlFor="account_number" className="block text-sm font-medium">
              계좌번호
            </label>
            <input
              {...register('account_number')}
              type="text"
              className="mt-1 block w-full rounded border px-3 py-2"
            />
            {errors.account_number && (
              <p className="text-red-500">{errors.account_number.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="account_name" className="block text-sm font-medium">
              계좌 소유자명
            </label>
            <input
              {...register('account_name')}
              type="text"
              className="mt-1 block w-full rounded border px-3 py-2"
            />
            {errors.account_name && (
              <p className="text-red-500">{errors.account_name.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="bank_name" className="block text-sm font-medium">
              은행명 (선택)
            </label>
            <input
              {...register('bank_name')}
              type="text"
              className="mt-1 block w-full rounded border px-3 py-2"
            />
          </div>
        </>
      )}

      {paymentMethod === 'gcash' && (
        <div>
          <label htmlFor="gcash_number" className="block text-sm font-medium">
            GCash 번호
          </label>
          <input
            {...register('gcash_number')}
            type="text"
            className="mt-1 block w-full rounded border px-3 py-2"
          />
        </div>
      )}

      <div>
        <label htmlFor="notes" className="block text-sm font-medium">
          비고 (선택)
        </label>
        <textarea
          {...register('notes')}
          className="mt-1 block w-full rounded border px-3 py-2"
          rows={3}
        />
      </div>

      {error && <div className="text-red-500">{error}</div>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded bg-blue-500 px-4 py-2 text-white disabled:opacity-50"
      >
        {isSubmitting ? '처리 중...' : '추가'}
      </button>
    </form>
  );
}
```

### 2. 정산 목록 테이블

**파일:** `src/app/admin/settlement/SettlementTable.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import { usePaymentSettlementStore } from '@/lib/stores/payment-settlement-store';
import { SettlementPending } from '@/lib/api/payment-settlement-types';
import { Decimal } from 'decimal.js';


export function SettlementTable() {
  const {
    pendingSettlements,
    isLoading,
    error,
    fetchPendingSettlements,
  } = usePaymentSettlementStore();

  useEffect(() => {
    fetchPendingSettlements();
  }, [fetchPendingSettlements]);

  if (isLoading) return <div>로딩 중...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!pendingSettlements) return <div>정산 데이터가 없습니다.</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-4 py-2 text-left">ID</th>
            <th className="border px-4 py-2 text-left">업체</th>
            <th className="border px-4 py-2 text-left">기간</th>
            <th className="border px-4 py-2 text-right">총 매출</th>
            <th className="border px-4 py-2 text-right">수수료</th>
            <th className="border px-4 py-2 text-right">순정산액</th>
            <th className="border px-4 py-2 text-left">상태</th>
          </tr>
        </thead>
        <tbody>
          {pendingSettlements.items.map((settlement: SettlementPending) => (
            <tr key={settlement.id}>
              <td className="border px-4 py-2">{settlement.id}</td>
              <td className="border px-4 py-2">{settlement.company_id}</td>
              <td className="border px-4 py-2">
                {settlement.settlement_period_year}-
                {String(settlement.settlement_period_month).padStart(2, '0')}
              </td>
              <td className="border px-4 py-2 text-right">
                {new Decimal(settlement.total_revenue).toFixed(2)}
              </td>
              <td className="border px-4 py-2 text-right">
                {new Decimal(settlement.platform_fee).toFixed(2)}
              </td>
              <td className="border px-4 py-2 text-right font-bold">
                {new Decimal(settlement.net_settlement).toFixed(2)}
              </td>
              <td className="border px-4 py-2">
                <span className={`rounded px-2 py-1 text-white ${
                  settlement.status === 'draft' ? 'bg-yellow-500' :
                  settlement.status === 'approved' ? 'bg-blue-500' :
                  'bg-gray-500'
                }`}>
                  {settlement.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 🧪 테스트 예제

**파일:** `src/lib/api/__tests__/payment-settlement-client.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { paymentSettlementClient } from '../payment-settlement-client';
import axios from 'axios';


vi.mock('axios');

describe('PaymentSettlementClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should add payment method', async () => {
    const mockResponse = {
      data: {
        id: 1,
        booking_id: 12345,
        payment_method: 'bank_transfer',
        account_number: '123456789',
        account_name: 'John Doe',
        bank_name: 'BDO',
        created_at: '2026-06-02T10:30:00Z',
        updated_at: '2026-06-02T10:30:00Z',
      },
    };

    vi.mocked(axios.post).mockResolvedValue(mockResponse);

    const result = await paymentSettlementClient.addPaymentMethod(12345, {
      payment_method: 'bank_transfer',
      account_number: '123456789',
      account_name: 'John Doe',
      bank_name: 'BDO',
    });

    expect(result.payment_method).toBe('bank_transfer');
    expect(result.account_number).toBe('123456789');
  });

  it('should fetch pending settlements', async () => {
    const mockResponse = {
      data: {
        total: 5,
        pending_count: 3,
        items: [],
      },
    };

    vi.mocked(axios.get).mockResolvedValue(mockResponse);

    const result = await paymentSettlementClient.getPendingSettlements();

    expect(result.total).toBe(5);
    expect(result.pending_count).toBe(3);
  });
});
```

---

## 📋 체크리스트

- [ ] 스키마 파일 생성 (`payment-settlement-types.ts`)
- [ ] API 클라이언트 생성 (`payment-settlement-client.ts`)
- [ ] Zustand 스토어 생성
- [ ] React 컴포넌트 생성
- [ ] 테스트 작성
- [ ] API 엔드포인트 테스트
- [ ] 타입 검증 확인

---

**최종 수정:** 2026-06-02
