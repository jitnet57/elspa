// ============================================================
// 📌 픽업 시스템 타입 정의 (Pickup Domain Types)
// 📋 목적: Monitor 페이지 및 Customer Pickup 페이지 공용 타입
// 📅 작성일: 2026-05-28
// ⚠️ 주의: 기존 Booking 인터페이스와 별도 유지
// ============================================================

/** 픽업 요청의 생명주기 상태 */
export type PickupRequestStatus = 'pending' | 'assigned' | 'en_route' | 'completed' | 'cancelled';

/** 드라이버의 가용성 상태 */
export type DriverStatus = 'available' | 'on_trip' | 'offline';

/** 지도에 표시될 마커 (정적 데이터 모드) */
export interface StaticMarker {
  id: string;
  entity_type: 'driver' | 'customer';
  entity_id: number;
  latitude: number;
  longitude: number;
  label?: string;
  address?: string;
}

/** 고객 픽업 요청 */
export interface PickupRequest {
  id: string;
  customerId: number;
  customerName: string;
  customerPhone: string;
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string;
  serviceType: 'home_visit' | 'transport_to_spa' | 'airport_pickup' | 'airport_dropoff';
  requestedAt: string; // ISO timestamp
  status: PickupRequestStatus;
  assignedDriverId?: number;
  assignedAt?: string;
  estimatedArrival?: string; // "5분" style for UI
  flightNumber?: string; // 항공편 번호 (공항 픽업/드롭 시)
  flightArrivalTime?: string; // 비행기 착륙 예정 시간 (ISO, 공항 픽업 시)
  passengerCount?: number; // 탑승객 수 (공항 픽업 시)
  luggageCount?: number; // 짐 개수 (공항 픽업 시)
}

/** 드라이버 요약 (dispatch center용) */
export interface DriverSummary {
  id: number;
  name: string;
  phone: string;
  vehicleBrand: string;
  licensePlate: string;
  status: DriverStatus;
  lat: number;
  lng: number;
  rating: number;
  completedTripsToday: number;
  currentCustomerId?: number; // set when on_trip
}

/** 진행중 트립 (Active Trips 탭용) */
export interface ActiveTrip {
  id: string;
  driverId: number;
  driverName: string;
  customerId: number;
  customerName: string;
  serviceType: string;
  startedAt: string;
  estimatedCompletion: string;
  status: 'en_route' | 'arrived' | 'in_service';
}

/** 모니터 페이지 통계 */
export interface MonitorStats {
  activeDrivers: number;
  pendingPickups: number;
  activeTrips: number;
  completedToday: number;
}
