/**
 * 📌 테라피스트 일정 & 예약 API
 * 📋 Supabase에서 실시간 데이터 조회
 * 📅 작성일: 2026-06-05
 */

import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { date } = await request.json();

    if (!date) {
      return NextResponse.json({ error: 'Date required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 1️⃣ 모든 테라피스트 조회
    const { data: therapists, error: therapistsError } = await supabase
      .from('therapists')
      .select('id, name, specialty, status')
      .eq('status', 'active')
      .order('id', { ascending: true });

    if (therapistsError) {
      throw therapistsError;
    }

    // 2️⃣ 해당 날짜의 예약 조회
    const { data: bookings, error: bookingsError } = await supabase
      .from('massage_bookings')
      .select('id, therapist_id, service_name, start_time, end_time, status, customer_name, room_number')
      .gte('start_time', `${date}T00:00:00`)
      .lt('start_time', `${date}T23:59:59`)
      .order('start_time', { ascending: true });

    if (bookingsError) {
      throw bookingsError;
    }

    // 3️⃣ 테라피스트별 세션 정렬
    const therapistSessions = therapists?.map(therapist => {
      const sessions = bookings
        ?.filter(b => b.therapist_id === therapist.id)
        .map(b => {
          const startHour = new Date(`${date}T${b.start_time.split('T')[1]}`).getHours() +
            (new Date(`${date}T${b.start_time.split('T')[1]}`).getMinutes() / 60);
          const endHour = new Date(`${date}T${b.end_time.split('T')[1]}`).getHours() +
            (new Date(`${date}T${b.end_time.split('T')[1]}`).getMinutes() / 60);

          return {
            id: String(b.id),
            therapistId: b.therapist_id,
            serviceType: mapServiceType(b.service_name),
            startHour,
            endHour,
            customerName: b.customer_name || 'Guest',
            roomNumber: b.room_number || 'N/A',
            status: mapBookingStatus(b.status),
          };
        }) || [];

      return {
        id: therapist.id,
        name: therapist.name,
        title: 'Therapist',
        status: mapTherapistStatus(therapist.status),
        avatarColor: 'from-slate-700 to-slate-800',
        sessions: sessions.sort((a, b) => a.startHour - b.startHour),
      };
    }) || [];

    return NextResponse.json({
      therapists: therapistSessions,
      date,
      total: therapists?.length || 0,
    });
  } catch (error) {
    console.error('❌ API 오류:', error);
    return NextResponse.json(
      { error: 'Failed to fetch therapist schedule' },
      { status: 500 }
    );
  }
}

// 헬퍼 함수
function mapServiceType(service: string): string {
  const service_lower = (service || '').toLowerCase();
  if (service_lower.includes('thai')) return 'thai';
  if (service_lower.includes('hot') || service_lower.includes('stone')) return 'hotstone';
  if (service_lower.includes('foot')) return 'foot';
  if (service_lower.includes('aroma')) return 'aroma';
  return 'swedish';
}

function mapTherapistStatus(status: string): 'available' | 'in_session' | 'break' | 'off_duty' {
  if (status === 'active') return 'available';
  if (status === 'on_break') return 'break';
  return 'off_duty';
}

function mapBookingStatus(status: string): 'scheduled' | 'in_progress' | 'completed' {
  if (status === 'confirmed') return 'scheduled';
  if (status === 'completed') return 'completed';
  return 'in_progress';
}
