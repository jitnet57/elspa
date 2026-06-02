/**
 * API Route: /api/dashboard/kpi
 * GET: 대시보드 KPI 지표 조회
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDashboardKPI } from '@/lib/api/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const kpi = await getDashboardKPI()
    return NextResponse.json({ data: kpi }, { status: 200 })
  } catch (error: any) {
    console.error('GET /api/dashboard/kpi error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch KPI data' },
      { status: 500 }
    )
  }
}
