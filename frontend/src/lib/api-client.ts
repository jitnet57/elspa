// ============================================================
// 📌 API Client: 백엔드 FastAPI와 통신하는 유틸리티
// 📋 목적: 재사용 가능한 HTTP 요청 함수 제공 (therapists, bookings, reviews)
// 📅 작성일: 2026-05-18
// ============================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Therapist {
  id: number;
  name: string;
  specialty: string;
  bio?: string;
  experience_years: number;
  rating: number;
  review_count: number;
  phone?: string;
  email?: string;
  location?: string;
  available: boolean;
  created_at: string;
}

export interface Service {
  id: number;
  name: string;
  description?: string;
  base_price: number;
  duration_minutes: number;
  icon?: string;
  category?: string;
}

export interface Booking {
  id: number;
  customer_id: number;
  therapist_id: number;
  service_id: number;
  booking_date: string;
  booking_time: string;
  duration_minutes: number;
  location?: string;
  special_request?: string;
  status: string;
  total_price?: number;
  payment_method?: string;
  created_at: string;
}

export interface Review {
  id: number;
  booking_id: number;
  customer_id: number;
  therapist_id: number;
  rating: number;
  comment?: string;
  created_at: string;
}

// ============================================================
// Therapist API
// ============================================================

export async function getTherapists(params?: {
  skip?: number;
  limit?: number;
  sort_by?: string;
}): Promise<Therapist[]> {
  const searchParams = new URLSearchParams();
  if (params?.skip) searchParams.append('skip', params.skip.toString());
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.sort_by) searchParams.append('sort_by', params.sort_by);

  const response = await fetch(
    `${API_BASE_URL}/api/therapists/?${searchParams.toString()}`,
    { cache: 'no-store' }
  );

  if (!response.ok) throw new Error('테라피스트 목록을 불러올 수 없습니다');
  return response.json();
}

export async function getTherapist(id: number): Promise<Therapist> {
  const response = await fetch(
    `${API_BASE_URL}/api/therapists/${id}`,
    { cache: 'no-store' }
  );

  if (!response.ok) throw new Error('테라피스트 정보를 불러올 수 없습니다');
  return response.json();
}

export async function searchTherapists(params: {
  q?: string;
  specialty?: string;
  min_rating?: number;
  location?: string;
}): Promise<Therapist[]> {
  const searchParams = new URLSearchParams();
  if (params.q) searchParams.append('q', params.q);
  if (params.specialty) searchParams.append('specialty', params.specialty);
  if (params.min_rating) searchParams.append('min_rating', params.min_rating.toString());
  if (params.location) searchParams.append('location', params.location);

  const response = await fetch(
    `${API_BASE_URL}/api/therapists/search/?${searchParams.toString()}`,
    { cache: 'no-store' }
  );

  if (!response.ok) throw new Error('검색 결과를 불러올 수 없습니다');
  return response.json();
}

// ============================================================
// Booking API
// ============================================================

export async function getBookings(params?: {
  customer_id?: number;
  status?: string;
  skip?: number;
  limit?: number;
}): Promise<Booking[]> {
  const searchParams = new URLSearchParams();
  if (params?.customer_id) searchParams.append('customer_id', params.customer_id.toString());
  if (params?.status) searchParams.append('status', params.status);
  if (params?.skip) searchParams.append('skip', params.skip.toString());
  if (params?.limit) searchParams.append('limit', params.limit.toString());

  const response = await fetch(
    `${API_BASE_URL}/api/bookings/?${searchParams.toString()}`,
    { cache: 'no-store' }
  );

  if (!response.ok) throw new Error('예약 목록을 불러올 수 없습니다');
  return response.json();
}

export async function getBooking(id: number): Promise<Booking> {
  const response = await fetch(
    `${API_BASE_URL}/api/bookings/${id}`,
    { cache: 'no-store' }
  );

  if (!response.ok) throw new Error('예약 정보를 불러올 수 없습니다');
  return response.json();
}

export async function createBooking(data: {
  customer_id: number;
  therapist_id: number;
  service_id: number;
  booking_date: string;
  booking_time: string;
  duration_minutes: number;
  location?: string;
  special_request?: string;
}): Promise<Booking> {
  const response = await fetch(
    `${API_BASE_URL}/api/bookings/`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) throw new Error('예약 생성에 실패했습니다');
  return response.json();
}

export async function updateBooking(
  id: number,
  data: {
    status?: string;
    special_request?: string;
    notes?: string;
  }
): Promise<Booking> {
  const response = await fetch(
    `${API_BASE_URL}/api/bookings/${id}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) throw new Error('예약 수정에 실패했습니다');
  return response.json();
}

// ============================================================
// Review API
// ============================================================

export async function getTherapistReviews(
  therapistId: number,
  params?: { skip?: number; limit?: number }
): Promise<Review[]> {
  const searchParams = new URLSearchParams();
  if (params?.skip) searchParams.append('skip', params.skip.toString());
  if (params?.limit) searchParams.append('limit', params.limit.toString());

  const response = await fetch(
    `${API_BASE_URL}/api/reviews/therapist/${therapistId}?${searchParams.toString()}`,
    { cache: 'no-store' }
  );

  if (!response.ok) throw new Error('리뷰를 불러올 수 없습니다');
  return response.json();
}

export async function createReview(data: {
  booking_id: number;
  customer_id: number;
  therapist_id: number;
  rating: number;
  comment?: string;
}): Promise<Review> {
  const response = await fetch(
    `${API_BASE_URL}/api/reviews/`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) throw new Error('리뷰 작성에 실패했습니다');
  return response.json();
}

export async function getReview(id: number): Promise<Review> {
  const response = await fetch(
    `${API_BASE_URL}/api/reviews/${id}`,
    { cache: 'no-store' }
  );

  if (!response.ok) throw new Error('리뷰를 불러올 수 없습니다');
  return response.json();
}
