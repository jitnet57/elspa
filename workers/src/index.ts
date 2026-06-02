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

export default app
