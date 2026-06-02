/**
 * ElSpa Backend - Cloudflare Workers + Hono
 * 초고속 엣지 배포 (전 세계)
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createClient } from '@supabase/supabase-js'

// 타입 정의
interface Env {
  SUPABASE_URL: string
  SUPABASE_KEY: string
  ENVIRONMENT: string
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
  GOOGLE_OAUTH_REDIRECT_URI?: string
  GOOGLE_APPS_SCRIPT_URL?: string
}

const app = new Hono<{ Bindings: Env }>()

// CORS 설정
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length', 'X-Total-Count'],
}))

// ============================================================
// 헬스 체크
// ============================================================
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    environment: c.env.ENVIRONMENT,
    message: 'ElSpa Backend (Cloudflare Workers) is running!',
    timestamp: new Date().toISOString(),
  })
})

app.get('/', (c) => {
  return c.json({
    message: 'ElSpa API v1.0.0',
    docs: '/docs',
    health: '/health',
    endpoints: {
      bookings: '/api/bookings',
      expenses: '/api/expenses',
      dashboard: '/api/dashboard/kpi',
    },
  })
})

// ============================================================
// 예약 API
// ============================================================
app.get('/api/bookings', async (c) => {
  try {
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY)
    const { data, error } = await supabase
      .from('massage_bookings')
      .select('*')
      .order('booking_date', { ascending: false })
      .limit(100)

    if (error) throw error
    return c.json({ data }, { status: 200 })
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to fetch bookings' }, { status: 500 })
  }
})

app.post('/api/bookings', async (c) => {
  try {
    const body = await c.req.json()
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY)
    const { data, error } = await supabase
      .from('massage_bookings')
      .insert([body])
      .select()

    if (error) throw error
    return c.json({ data: data?.[0] }, { status: 201 })
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to create booking' }, { status: 500 })
  }
})

// ============================================================
// 비용 API
// ============================================================
app.get('/api/expenses', async (c) => {
  try {
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY)
    const { data, error } = await supabase
      .from('expense_records')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error
    return c.json({ data }, { status: 200 })
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to fetch expenses' }, { status: 500 })
  }
})

app.post('/api/expenses', async (c) => {
  try {
    const body = await c.req.json()
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY)
    const { data, error } = await supabase
      .from('expense_records')
      .insert([body])
      .select()

    if (error) throw error
    return c.json({ data: data?.[0] }, { status: 201 })
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to create expense' }, { status: 500 })
  }
})

// ============================================================
// 대시보드 KPI
// ============================================================
app.get('/api/dashboard/kpi', async (c) => {
  try {
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY)

    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    // 금주 예약 수
    const { count: bookingCount } = await supabase
      .from('massage_bookings')
      .select('id', { count: 'exact', head: true })
      .gte('booking_date', startOfWeek.toISOString())

    // 금주 비용 합계
    const { data: expenseData } = await supabase
      .from('expense_records')
      .select('amount')
      .gte('created_at', startOfWeek.toISOString())

    const expenseTotal = expenseData?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0

    return c.json({
      data: {
        weeklyBookings: bookingCount || 0,
        expenseTotal: Math.round(expenseTotal),
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to fetch KPI' }, { status: 500 })
  }
})

// ============================================================
// Google OAuth API
// ============================================================

// GET /api/booking/status - Google 연결 상태 확인
app.get('/api/booking/status', (c) => {
  try {
    // 클라이언트에서 Authorization 헤더로 토큰 전달
    const authHeader = c.req.header('Authorization')
    const hasToken = !!authHeader && authHeader.startsWith('Bearer ')

    return c.json({
      connected: hasToken,
      status: hasToken ? 'connected' : 'disconnected',
      message: hasToken ? 'Google 연결됨' : 'Google 미연결',
    })
  } catch (error: any) {
    return c.json({ error: error.message }, { status: 500 })
  }
})

// GET /api/booking/auth/google - Google OAuth 인증 URL
app.get('/api/booking/auth/google', (c) => {
  try {
    const clientId = c.env.GOOGLE_CLIENT_ID || ''
    const redirectUri = c.env.GOOGLE_OAUTH_REDIRECT_URI || 'https://elspa-vercel.app/api/booking/auth/google/callback'

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/spreadsheets',
      access_type: 'offline',
      prompt: 'consent',
    })

    return c.json({
      authorization_url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
      status: 'ok',
    })
  } catch (error: any) {
    return c.json({ error: error.message }, { status: 500 })
  }
})

// DELETE /api/booking/auth/google - Google 연결 해제
app.delete('/api/booking/auth/google', (c) => {
  try {
    return c.json({
      message: 'Google 연결 해제됨',
      status: 'disconnected',
    })
  } catch (error: any) {
    return c.json({ error: error.message }, { status: 500 })
  }
})

// POST /api/booking/auth/google/callback - OAuth 콜백
app.post('/api/booking/auth/google/callback', async (c) => {
  try {
    const { code } = await c.req.json()

    if (!code) {
      return c.json({ error: '인증 코드 필요' }, { status: 400 })
    }

    // 실제 구현: code를 access_token으로 교환
    // 지금은 임시로 성공 응답
    return c.json({
      message: '인증 성공',
      token: `temp_token_${Date.now()}`,
      status: 'connected',
    })
  } catch (error: any) {
    return c.json({ error: error.message }, { status: 500 })
  }
})

// ============================================================
// Google Sheets 자동 저장 (Google Apps Script)
// ============================================================
app.post('/api/booking/drive/export', async (c) => {
  try {
    const body = await c.req.json()
    const scriptUrl = c.env.GOOGLE_APPS_SCRIPT_URL

    if (!scriptUrl) {
      return c.json({ error: 'Google Apps Script URL not configured' }, { status: 500 })
    }

    // Google Apps Script로 데이터 전송
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      return c.json({ error: 'Failed to save to Google Sheets' }, { status: 500 })
    }

    return c.json({
      message: 'Data saved to Google Sheets',
      status: 'success',
    })
  } catch (error: any) {
    return c.json({ error: error.message }, { status: 500 })
  }
})

// ============================================================
// Google Drive 자동 저장 엔드포인트 (7개 탭)
// ============================================================

// POST /api/drive/save-booking - 예약 자동 저장
app.post('/api/drive/save-booking', async (c) => {
  try {
    const body = await c.req.json()
    const scriptUrl = c.env.GOOGLE_APPS_SCRIPT_URL

    if (!scriptUrl) {
      return c.json({ error: 'Google Apps Script URL not configured' }, { status: 500 })
    }

    // Google Apps Script로 예약 데이터 전송
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'booking',
        data: body,
        timestamp: new Date().toISOString(),
      }),
    })

    return c.json({
      message: 'Booking data saved to Google Drive',
      status: response.ok ? 'success' : 'error',
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return c.json({ error: error.message }, { status: 500 })
  }
})

// POST /api/drive/save-attendance - 출결 자동 저장
app.post('/api/drive/save-attendance', async (c) => {
  try {
    const body = await c.req.json()
    const scriptUrl = c.env.GOOGLE_APPS_SCRIPT_URL

    if (!scriptUrl) {
      return c.json({ error: 'Google Apps Script URL not configured' }, { status: 500 })
    }

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'attendance',
        data: body,
        timestamp: new Date().toISOString(),
      }),
    })

    return c.json({
      message: 'Attendance data saved to Google Drive',
      status: response.ok ? 'success' : 'error',
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return c.json({ error: error.message }, { status: 500 })
  }
})

// POST /api/drive/save-expense - 비용 자동 저장
app.post('/api/drive/save-expense', async (c) => {
  try {
    const body = await c.req.json()
    const scriptUrl = c.env.GOOGLE_APPS_SCRIPT_URL

    if (!scriptUrl) {
      return c.json({ error: 'Google Apps Script URL not configured' }, { status: 500 })
    }

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'expense',
        data: body,
        timestamp: new Date().toISOString(),
      }),
    })

    return c.json({
      message: 'Expense data saved to Google Drive',
      status: response.ok ? 'success' : 'error',
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return c.json({ error: error.message }, { status: 500 })
  }
})

// POST /api/drive/save-payroll - 급여 자동 저장
app.post('/api/drive/save-payroll', async (c) => {
  try {
    const body = await c.req.json()
    const scriptUrl = c.env.GOOGLE_APPS_SCRIPT_URL

    if (!scriptUrl) {
      return c.json({ error: 'Google Apps Script URL not configured' }, { status: 500 })
    }

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'payroll',
        data: body,
        timestamp: new Date().toISOString(),
      }),
    })

    return c.json({
      message: 'Payroll data saved to Google Drive',
      status: response.ok ? 'success' : 'error',
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return c.json({ error: error.message }, { status: 500 })
  }
})

export default app
