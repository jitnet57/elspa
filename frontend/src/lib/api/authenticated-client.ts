/**
 * ============================================================
 * 📌 인증된 API 클라이언트
 * 📋 목적: 모든 API 요청에 Authorization 헤더 자동 추가
 * 🔧 기능:
 *   - 자동 토큰 갱신 (401 응답 시)
 *   - 재시도 로직
 * 📅 작성일: 2026-05-22
 * ============================================================
 */

import { useAuthStore } from '@/lib/store/auth-store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
  isRetry?: boolean;
}

/**
 * 인증된 API 요청 수행
 *
 * @param endpoint - API 엔드포인트 (예: /api/payroll/employees)
 * @param options - fetch 옵션
 * @returns Response
 *
 * @example
 * const response = await authenticatedFetch('/api/payroll/employees');
 * const data = await response.json();
 */
export async function authenticatedFetch(
  endpoint: string,
  options: FetchOptions = {}
): Promise<Response> {
  const store = useAuthStore.getState();
  const accessToken = store.accessToken;

  // 토큰이 없으면 에러 throw
  if (!accessToken) {
    throw new Error('No access token available');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
    'Authorization': `Bearer ${accessToken}`,
  };

  const url = `${API_BASE_URL}${endpoint}`;

  let response = await fetch(url, {
    ...options,
    headers,
  });

  // 401 응답 시 토큰 갱신 후 재시도
  if (response.status === 401 && !options.isRetry) {
    try {
      // ✅ 토큰 갱신 시도
      if (store && 'performTokenRefresh' in store && typeof (store as any).performTokenRefresh === 'function') {
        await (store as any).performTokenRefresh();
      }

      const newAccessToken = useAuthStore.getState().accessToken;

      if (newAccessToken) {
        // 새 토큰으로 재시도
        headers['Authorization'] = `Bearer ${newAccessToken}`;
        const retryOptions = { ...options, headers };
        response = await fetch(url, {
          ...retryOptions,
        } as RequestInit);
      } else {
        // 토큰 갱신 실패
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      throw error;
    }
  }

  return response;
}

/**
 * GET 요청 (with authentication)
 */
export async function authenticatedGet<T = any>(
  endpoint: string,
  options?: FetchOptions
): Promise<T> {
  const response = await authenticatedFetch(endpoint, {
    ...options,
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

/**
 * POST 요청 (with authentication)
 */
export async function authenticatedPost<T = any>(
  endpoint: string,
  data?: any,
  options?: FetchOptions
): Promise<T> {
  const response = await authenticatedFetch(endpoint, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

/**
 * PUT 요청 (with authentication)
 */
export async function authenticatedPut<T = any>(
  endpoint: string,
  data?: any,
  options?: FetchOptions
): Promise<T> {
  const response = await authenticatedFetch(endpoint, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

/**
 * DELETE 요청 (with authentication)
 */
export async function authenticatedDelete<T = any>(
  endpoint: string,
  options?: FetchOptions
): Promise<T | void> {
  const response = await authenticatedFetch(endpoint, {
    ...options,
    method: 'DELETE',
  });

  if (!response.ok && response.status !== 204) {
    throw new Error(`API error: ${response.status}`);
  }

  if (response.status === 204) {
    return; // No content
  }

  return response.json() as Promise<T>;
}
