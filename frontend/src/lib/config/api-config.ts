/**
 * API 설정 (Cloudflare Workers 백엔드)
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ||
  'https://elspa-api-production.jitnet57.workers.dev'

export const API_ENDPOINTS = {
  bookingStatus: `${API_BASE_URL}/api/booking/status`,
  bookingAuthGoogle: `${API_BASE_URL}/api/booking/auth/google`,
  bookingDriveExport: `${API_BASE_URL}/api/booking/drive/export`,
  bookings: `${API_BASE_URL}/api/bookings`,
  expenses: `${API_BASE_URL}/api/expenses`,
  dashboardKpi: `${API_BASE_URL}/api/dashboard/kpi`,
}
