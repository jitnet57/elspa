// ============================================================
// 📌 API Client: 백엔드 FastAPI와 통신하는 유틸리티
// 📋 목적: 재사용 가능한 HTTP 요청 함수 제공 (therapists, bookings, reviews)
// 📅 작성일: 2026-05-18
// ============================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

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

// ============================================================
// Financial API (Generic)
// ============================================================

export async function fetchFinancial<T = any>(
  endpoint: string,
  options?: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: Record<string, any>;
  }
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const fetchOptions: RequestInit = {
    cache: 'no-store',
    method: options?.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Role': 'admin', // TODO: Extract from JWT token
    },
  };

  if (options?.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error_message ||
      errorData.detail ||
      `재무 API 요청 실패 (${response.status})`
    );
  }

  return response.json();
}

// ============================================================
// Knowledge Network API
// ============================================================

export interface KnowledgeNetworkNode {
  id: string;
  label: string;
  description: string;
  category: string;
  color: string;
}

export interface KnowledgeNetworkResponse {
  nodes: KnowledgeNetworkNode[];
  total: number;
}

export interface KnowledgeNetworkSearchResponse {
  results: KnowledgeNetworkNode[];
  count: number;
  query: string;
}

/**
 * 📌 함수: getKnowledgeNetworkNodes
 * 📋 목적: 모든 지식 네트워크 노드 조회 (카테고리 필터 선택)
 * 🔧 매개변수:
 *    - category: 카테고리 필터 (선택)
 *    - skip: 페이지네이션 오프셋
 *    - limit: 페이지네이션 리미트
 * 📤 반환값: {nodes: KnowledgeNetworkNode[], total: number}
 */
export async function getKnowledgeNetworkNodes(params?: {
  category?: string;
  skip?: number;
  limit?: number;
}): Promise<KnowledgeNetworkResponse> {
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.append('category', params.category);
  if (params?.skip !== undefined) searchParams.append('skip', params.skip.toString());
  if (params?.limit) searchParams.append('limit', params.limit.toString());

  const response = await fetch(
    `${API_BASE_URL}/api/knowledge-network/nodes?${searchParams.toString()}`,
    { cache: 'no-store' }
  );

  if (!response.ok) {
    throw new Error('지식 네트워크 노드를 불러올 수 없습니다');
  }

  return response.json();
}

/**
 * 📌 함수: searchKnowledgeNetworkNodes
 * 📋 목적: 키워드 기반 검색 수행
 * 🔧 매개변수:
 *    - query: 검색 키워드
 *    - category: 카테고리 필터 (선택)
 *    - limit: 결과 최대 개수
 * 📤 반환값: {results: KnowledgeNetworkNode[], count: number, query: string}
 */
export async function searchKnowledgeNetworkNodes(params: {
  query: string;
  category?: string;
  limit?: number;
}): Promise<KnowledgeNetworkSearchResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/knowledge-network/search`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: params.query,
        category: params.category,
        limit: params.limit || 10,
      }),
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    throw new Error('검색에 실패했습니다');
  }

  return response.json();
}

/**
 * 📌 함수: getKnowledgeNetworkNodeById
 * 📋 목적: 특정 노드의 상세 정보 조회
 * 🔧 매개변수:
 *    - nodeId: 노드 고유 식별자
 * 📤 반환값: KnowledgeNetworkNode 객체
 */
export async function getKnowledgeNetworkNodeById(
  nodeId: string
): Promise<KnowledgeNetworkNode> {
  const response = await fetch(
    `${API_BASE_URL}/api/knowledge-network/nodes/${nodeId}`,
    { cache: 'no-store' }
  );

  if (!response.ok) {
    throw new Error('노드 정보를 불러올 수 없습니다');
  }

  return response.json();
}

/**
 * 📌 함수: getKnowledgeNetworkCategories
 * 📋 목적: 전체 카테고리 목록 조회
 * 🔧 매개변수: (없음)
 * 📤 반환값: {categories: string[], count: number}
 */
export async function getKnowledgeNetworkCategories(): Promise<{
  categories: string[];
  count: number;
}> {
  const response = await fetch(
    `${API_BASE_URL}/api/knowledge-network/categories`,
    { cache: 'no-store' }
  );

  if (!response.ok) {
    throw new Error('카테고리 목록을 불러올 수 없습니다');
  }

  return response.json();
}
