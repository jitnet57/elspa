/**
 * 📌 드라이버 API 클라이언트
 * 📋 목적: 드라이버 API 엔드포인트 호출
 * 🔧 포함: 프로필, 예약, 위치, 수익, 여행
 * 📅 작성일: 2026-05-24
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface DriverProfile {
  id: number;
  name: string;
  phone: string;
  email: string;
  vehicle_type: string;
  vehicle_brand: string;
  license_plate: string;
  status: 'online' | 'offline' | 'on_trip';
  rating: number;
  total_trips: number;
  completed_trips: number;
  total_earnings: number;
  bank_name?: string;
  account_holder?: string;
}

export interface Booking {
  id: number;
  booking_id: number;
  customer_address: string;
  service_type: string;
  scheduled_time: string;
  status: 'pending' | 'accepted' | 'rejected' | 'ongoing' | 'completed';
  earnings: number;
}

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
}

export interface Earnings {
  today: number;
  this_week: number;
  this_month: number;
  breakdown: Array<{
    id: number;
    amount: number;
    source: string;
    earned_date: string;
  }>;
}

class DriverClient {
  /**
   * 드라이버 프로필 조회
   */
  async getProfile(driverId: number): Promise<DriverProfile> {
    const response = await fetch(
      `${API_URL}/api/driver/profile?driver_id=${driverId}`
    );
    if (!response.ok) throw new Error('프로필 조회 실패');
    return response.json();
  }

  /**
   * 오늘의 배정 목록 조회
   */
  async getTodayBookings(driverId: number): Promise<{ count: number; bookings: Booking[] }> {
    const response = await fetch(
      `${API_URL}/api/driver/bookings/today?driver_id=${driverId}`
    );
    if (!response.ok) throw new Error('배정 목록 조회 실패');
    return response.json();
  }

  /**
   * 수익 현황 조회
   */
  async getEarnings(driverId: number): Promise<Earnings> {
    const response = await fetch(
      `${API_URL}/api/driver/earnings?driver_id=${driverId}`
    );
    if (!response.ok) throw new Error('수익 조회 실패');
    return response.json();
  }

  /**
   * 드라이버 위치 업데이트 (GPS)
   */
  async updateLocation(
    driverId: number,
    latitude: number,
    longitude: number,
    accuracy?: number
  ): Promise<Location> {
    const url = new URL(`${API_URL}/api/driver/location`);
    url.searchParams.append('driver_id', driverId.toString());
    url.searchParams.append('latitude', latitude.toString());
    url.searchParams.append('longitude', longitude.toString());
    if (accuracy) url.searchParams.append('accuracy', accuracy.toString());

    const response = await fetch(url.toString(), { method: 'POST' });
    if (!response.ok) throw new Error('위치 업데이트 실패');
    return response.json();
  }

  /**
   * 드라이버 최신 위치 조회
   */
  async getLocation(driverId: number): Promise<Location | null> {
    const response = await fetch(
      `${API_URL}/api/driver/location?driver_id=${driverId}`
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data.latitude ? data : null;
  }

  /**
   * 예약 수락
   */
  async acceptBooking(driverId: number, bookingId: number) {
    const response = await fetch(
      `${API_URL}/api/driver/booking/${bookingId}/accept?driver_id=${driverId}`,
      { method: 'POST' }
    );
    if (!response.ok) throw new Error('예약 수락 실패');
    return response.json();
  }

  /**
   * 예약 거절
   */
  async rejectBooking(driverId: number, bookingId: number) {
    const response = await fetch(
      `${API_URL}/api/driver/booking/${bookingId}/reject?driver_id=${driverId}`,
      { method: 'POST' }
    );
    if (!response.ok) throw new Error('예약 거절 실패');
    return response.json();
  }

  /**
   * 여행 시작
   */
  async startTrip(driverId: number, bookingId: number) {
    const response = await fetch(
      `${API_URL}/api/driver/booking/${bookingId}/start?driver_id=${driverId}`,
      { method: 'POST' }
    );
    if (!response.ok) throw new Error('여행 시작 실패');
    return response.json();
  }

  /**
   * 여행 완료
   */
  async completeTrip(driverId: number, bookingId: number) {
    const response = await fetch(
      `${API_URL}/api/driver/booking/${bookingId}/complete?driver_id=${driverId}`,
      { method: 'POST' }
    );
    if (!response.ok) throw new Error('여행 완료 실패');
    return response.json();
  }

  /**
   * API 헬스 체크
   */
  async healthCheck() {
    const response = await fetch(`${API_URL}/api/driver/health`);
    if (!response.ok) throw new Error('헬스 체크 실패');
    return response.json();
  }
}

export const driverClient = new DriverClient();
