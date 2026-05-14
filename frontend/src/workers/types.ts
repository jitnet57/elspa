/**
 * Cloudflare Workers 환경 타입 정의
 */

export interface Env {
  // Google Sheets API
  NEXT_PUBLIC_GOOGLE_SHEET_ID: string;
  NEXT_PUBLIC_GOOGLE_API_KEY: string;
  GOOGLE_API_TOKEN: string;

  // Email
  EMAIL_API_KEY: string;
  EMAIL_API_ENDPOINT?: string;
  ADMIN_EMAILS: string;

  // KakaoTalk
  NEXT_PUBLIC_KAKAO_API_KEY: string;
  ADMIN_PHONES: string;

  // SMS
  NEXT_PUBLIC_SMS_API_KEY: string;

  // API
  NEXT_PUBLIC_API_URL: string;

  // KV Storage (선택사항)
  SETTLEMENTS?: any;
  INVOICES?: any;
  REPORTS?: any;

  // D1 Database (선택사항)
  DB?: any;
}

export interface ScheduledEvent {
  scheduledTime: number;
  cron: string;
}

export interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}
