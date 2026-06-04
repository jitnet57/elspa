/**
 * Supabase Server Client (API Routes용)
 * 백엔드에서 데이터베이스 접근
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * 예약 조회
 */
export async function getBookings() {
  const { data, error } = await supabase
    .from('massage_bookings')
    .select('*')
    .order('booking_date', { ascending: false })
    .limit(100)

  if (error) throw error
  return data
}

/**
 * 예약 생성
 */
export async function createBooking(booking: any) {
  const { data, error } = await supabase
    .from('massage_bookings')
    .insert([booking])
    .select()

  if (error) throw error
  return data?.[0]
}

/**
 * 비용 조회
 */
export async function getExpenses() {
  const { data, error } = await supabase
    .from('expense_records')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw error
  return data
}

/**
 * 비용 생성
 */
export async function createExpense(expense: any) {
  const { data, error } = await supabase
    .from('expense_records')
    .insert([expense])
    .select()

  if (error) throw error
  return data?.[0]
}

/**
 * 대시보드 KPI 조회
 */
export async function getDashboardKPI() {
  try {
    // 1. 금주 예약 수
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const { count: bookingCount } = await supabase
      .from('massage_bookings')
      .select('id', { count: 'exact', head: true })
      .gte('booking_date', startOfWeek.toISOString())

    // 2. 금주 비용 합계
    const { data: expenseData } = await supabase
      .from('expense_records')
      .select('amount')
      .gte('created_at', startOfWeek.toISOString())

    const expenseTotal = expenseData?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0

    // 3. 출근한 직원 수
    const { count: attendanceCount } = await supabase
      .from('attendance_logs')
      .select('id', { count: 'exact', head: true })
      .gte('check_in_time', startOfWeek.toISOString())

    // 4. 신규 고객 수
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { count: newCustomerCount } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString())

    return {
      weeklyBookings: bookingCount || 0,
      expenseTotal: Math.round(expenseTotal),
      attendanceCount: attendanceCount || 0,
      newCustomers: newCustomerCount || 0,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Dashboard KPI Error:', error)
    throw error
  }
}
