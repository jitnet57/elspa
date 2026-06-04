// ============================================================
// 📌 픽업 Mock 데이터
// 📋 목적: Monitor 페이지와 Customer Pickup 페이지 공용 mock data
// 📅 작성일: 2026-05-28
// ⚠️ 주의: 실제 백엔드 연동 전까지 사용하는 테스트 데이터
// ============================================================

import type {
  PickupRequest,
  DriverSummary,
  ActiveTrip,
  StaticMarker,
  MonitorStats,
} from '@/lib/types/pickup-types';

// ============================================================
// 드라이버 목록 (5명: 2 available, 2 on_trip, 1 offline)
// ============================================================
export const MOCK_DRIVERS: DriverSummary[] = [
  {
    id: 1,
    name: '김철수',
    phone: '010-1234-5678',
    vehicleBrand: '기아 K5',
    licensePlate: '12가 3456',
    status: 'available',
    lat: 37.499,
    lng: 127.028,
    rating: 4.9,
    completedTripsToday: 3,
  },
  {
    id: 2,
    name: '이영희',
    phone: '010-2345-6789',
    vehicleBrand: '현대 소나타',
    licensePlate: '34나 5678',
    status: 'on_trip',
    lat: 37.512,
    lng: 127.043,
    rating: 4.7,
    completedTripsToday: 5,
    currentCustomerId: 101,
  },
  {
    id: 3,
    name: '박민수',
    phone: '010-3456-7890',
    vehicleBrand: '쌍용 티볼리',
    licensePlate: '56다 7890',
    status: 'available',
    lat: 37.487,
    lng: 127.015,
    rating: 4.8,
    completedTripsToday: 2,
  },
  {
    id: 4,
    name: '최지은',
    phone: '010-4567-8901',
    vehicleBrand: '기아 카니발',
    licensePlate: '78라 9012',
    status: 'offline',
    lat: 37.502,
    lng: 127.052,
    rating: 4.6,
    completedTripsToday: 0,
  },
  {
    id: 5,
    name: '강호준',
    phone: '010-5678-9012',
    vehicleBrand: '현대 그랜저',
    licensePlate: '90마 1234',
    status: 'on_trip',
    lat: 37.495,
    lng: 127.037,
    rating: 4.95,
    completedTripsToday: 7,
    currentCustomerId: 102,
  },
];

// ============================================================
// 픽업 요청 목록 (6개: 3 pending, 1 assigned, 1 completed, 1 airport)
// ============================================================
export const MOCK_PICKUP_REQUESTS: PickupRequest[] = [
  {
    id: 'req-001',
    customerId: 201,
    customerName: '박미영',
    customerPhone: '010-1111-2222',
    pickupLat: 37.504,
    pickupLng: 127.031,
    pickupAddress: '서울시 강남구 도곡동 스타타워 앞',
    serviceType: 'transport_to_spa',
    requestedAt: new Date(Date.now() - 5 * 60000).toISOString(),
    status: 'pending',
  },
  {
    id: 'req-002',
    customerId: 202,
    customerName: '이지은',
    customerPhone: '010-3333-4444',
    pickupLat: 37.491,
    pickupLng: 127.019,
    pickupAddress: '서울시 강남구 압구정동 현대아파트',
    serviceType: 'home_visit',
    requestedAt: new Date(Date.now() - 12 * 60000).toISOString(),
    status: 'pending',
  },
  {
    id: 'req-003',
    customerId: 203,
    customerName: '최수진',
    customerPhone: '010-5555-6666',
    pickupLat: 37.516,
    pickupLng: 127.047,
    pickupAddress: '서울시 서초구 반포동 JW메리어트 호텔',
    serviceType: 'transport_to_spa',
    requestedAt: new Date(Date.now() - 2 * 60000).toISOString(),
    status: 'pending',
  },
  {
    id: 'req-004',
    customerId: 101,
    customerName: '정다영',
    customerPhone: '010-7777-8888',
    pickupLat: 37.512,
    pickupLng: 127.043,
    pickupAddress: '서울시 강남구 삼성동 아이파크',
    serviceType: 'transport_to_spa',
    requestedAt: new Date(Date.now() - 20 * 60000).toISOString(),
    status: 'assigned',
    assignedDriverId: 2,
    assignedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    estimatedArrival: '3분',
  },
  {
    id: 'req-005',
    customerId: 204,
    customerName: '한소희',
    customerPhone: '010-9999-0000',
    pickupLat: 37.508,
    pickupLng: 127.025,
    pickupAddress: '서울시 강남구 논현동 신논현역',
    serviceType: 'home_visit',
    requestedAt: new Date(Date.now() - 45 * 60000).toISOString(),
    status: 'completed',
    assignedDriverId: 1,
  },
  {
    id: 'req-006',
    customerId: 205,
    customerName: '김준호',
    customerPhone: '010-6666-7777',
    pickupLat: 37.461,
    pickupLng: 126.401,
    pickupAddress: '인천국제공항 제2터미널',
    serviceType: 'airport_pickup',
    requestedAt: new Date(Date.now() - 8 * 60000).toISOString(),
    status: 'pending',
    flightNumber: 'KE789',
    flightArrivalTime: new Date(Date.now() + 22 * 60000).toISOString(), // 22분 후 착륙
    passengerCount: 2,
    luggageCount: 3,
  },
  {
    id: 'req-007',
    customerId: 206,
    customerName: '이민준',
    customerPhone: '010-8888-9999',
    pickupLat: 10.313,
    pickupLng: 124.009,
    pickupAddress: '세부 막탄 국제공항 메인 터미널',
    serviceType: 'airport_pickup',
    requestedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    status: 'pending',
    flightNumber: 'PR412',
    flightArrivalTime: new Date(Date.now() + 45 * 60000).toISOString(), // 45분 후 착륙
    passengerCount: 4,
    luggageCount: 5,
  },
];

// ============================================================
// 진행중 트립 목록
// ============================================================
export const MOCK_ACTIVE_TRIPS: ActiveTrip[] = [
  {
    id: 'trip-001',
    driverId: 2,
    driverName: '이영희',
    customerId: 101,
    customerName: '정다영',
    serviceType: 'transport_to_spa',
    startedAt: new Date(Date.now() - 8 * 60000).toISOString(),
    estimatedCompletion: '약 7분 후',
    status: 'en_route',
  },
  {
    id: 'trip-002',
    driverId: 5,
    driverName: '강호준',
    customerId: 102,
    customerName: '한소희',
    serviceType: 'home_visit',
    startedAt: new Date(Date.now() - 25 * 60000).toISOString(),
    estimatedCompletion: '서비스 진행 중',
    status: 'in_service',
  },
];

// ============================================================
// 모니터 페이지 통계
// ============================================================
export const MOCK_STATS: MonitorStats = {
  activeDrivers: 3,
  pendingPickups: 5,
  activeTrips: 2,
  completedToday: 15,
};

// ============================================================
// 지도 마커 (드라이버 + 대기중인 고객)
// ============================================================
export const MOCK_STATIC_MAP_MARKERS: StaticMarker[] = [
  // 드라이버들
  ...MOCK_DRIVERS.map((driver) => ({
    id: `driver-${driver.id}`,
    entity_type: 'driver' as const,
    entity_id: driver.id,
    latitude: driver.lat,
    longitude: driver.lng,
    label: `${driver.name} (${driver.status})`,
  })),
  // 대기중인 픽업 요청 (pending + assigned만 표시)
  ...MOCK_PICKUP_REQUESTS.filter((req) => req.status === 'pending' || req.status === 'assigned').map(
    (req) => ({
      id: `customer-${req.id}`,
      entity_type: 'customer' as const,
      entity_id: req.customerId,
      latitude: req.pickupLat,
      longitude: req.pickupLng,
      label: `${req.customerName} (${req.serviceType})`,
      address: req.pickupAddress,
    })
  ),
];

// ============================================================
// 가용 드라이버 (customer pickup 페이지용)
// ============================================================
export const MOCK_AVAILABLE_DRIVERS = MOCK_DRIVERS.filter(
  (d) => d.status === 'available'
);
