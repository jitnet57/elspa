/**
 * API Route: /api/expenses
 * GET: 비용 기록 조회
 * POST: 새 비용 기록 생성
 */

import { NextRequest, NextResponse } from 'next/server'
import { getExpenses, createExpense } from '@/lib/api/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const expenses = await getExpenses()
    return NextResponse.json({ data: expenses }, { status: 200 })
  } catch (error: any) {
    console.error('GET /api/expenses error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch expenses' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const expense = await createExpense(body)
    return NextResponse.json({ data: expense }, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/expenses error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create expense' },
      { status: 500 }
    )
  }
}
