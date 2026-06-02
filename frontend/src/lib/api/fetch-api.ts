/**
 * ============================================================
 * 📌 유틸: fetchAPI
 * 📋 목적: 모든 API 호출을 Cloudflare Workers로 리다이렉트
 *          상대 경로 /api/... → 전체 Workers URL로 변환
 * 📅 작성일: 2026-06-02
 * ============================================================
 */

const BACKEND_URL = 'https://elspa-api-production.jitnet57.workers.dev';

/**
 * 모든 API 호출을 Workers 백엔드로 통일
 * @example
 *   fetchAPI('/api/booking/status')
 *   → https://elspa-api-production.jitnet57.workers.dev/api/booking/status
 */
export async function fetchAPI(
  endpoint: string,
  options?: RequestInit
): Promise<Response> {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${BACKEND_URL}${endpoint}`;

  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
}

export default fetchAPI;
