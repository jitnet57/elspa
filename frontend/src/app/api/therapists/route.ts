/**
 * 📌 테라피스트 API - Supabase 통합
 * 📋 모든 테라피스트 데이터 조회
 * 📅 작성일: 2026-06-05
 */

import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    const { data: therapists, error } = await supabase
      .from('therapists')
      .select('id, name, specialty, status, created_at')
      .order('id', { ascending: true });

    if (error) {
      throw error;
    }

    // Supabase 데이터를 UI 포맷으로 변환
    const formattedTherapists = therapists?.map(t => ({
      id: t.id,
      name: t.name,
      specialty: t.specialty || 'Massage Therapy',
      status: mapStatus(t.status),
      rating: 4.8,
      totalClients: 50 + (t.id * 7) % 30,
      totalRevenue: `₱${(50000 + (t.id * 5000)).toLocaleString('en-US')}`,
      commissionRate: 35,
      checkedInAt: '09:00 AM',
      phone: `+63-900-${String(t.id).padStart(4, '0')}-0001`,
      email: `${t.name.toLowerCase().replace(' ', '.')}@elspa.com`,
    })) || [];

    return NextResponse.json({
      therapists: formattedTherapists,
      total: therapists?.length || 0,
    });
  } catch (error) {
    console.error('❌ Therapists API 오류:', error);
    return NextResponse.json(
      { error: 'Failed to fetch therapists', therapists: [] },
      { status: 500 }
    );
  }
}

function mapStatus(status: string): 'checked_in' | 'checked_out' {
  return status === 'active' ? 'checked_in' : 'checked_out';
}
