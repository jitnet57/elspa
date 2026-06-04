/**
 * API Route: /api/bookings
 * GET: 예약 목록 조회
 * POST: 새 예약 생성
 */

import { NextRequest, NextResponse } from 'next/server'
import { getBookings, createBooking } from '@/lib/api/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const bookings = await getBookings()
    return NextResponse.json({ data: bookings }, { status: 200 })
  } catch (error: any) {
    console.error('GET /api/bookings error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const booking = await createBooking(body)
    return NextResponse.json({ data: booking }, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/bookings error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create booking' },
      { status: 500 }
    )
  }
}
