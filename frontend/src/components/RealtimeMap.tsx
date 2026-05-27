'use client';

import { useEffect, useRef, useState } from 'react';

let L: any = null;
if (typeof window !== 'undefined') {
  L = require('leaflet');
  require('leaflet/dist/leaflet.css');
}

interface Location {
  id: number;
  entity_type: 'driver' | 'customer';
  entity_id: number;
  latitude: number;
  longitude: number;
  address?: string;
  created_at?: string;
}

// ============================================================
// 📌 정적 마커 인터페이스
// 📋 목적: enableWebSocket=false일 때 mock 데이터로 마커 표시
// ============================================================
interface StaticMarker {
  id: string;
  entity_type: 'driver' | 'customer';
  entity_id: number;
  latitude: number;
  longitude: number;
  label?: string;
  address?: string;
}

interface RealtimeMapProps {
  entityType?: 'driver' | 'customer' | 'admin';
  entityId?: number;
  watchMode?: 'self' | 'target' | 'all'; // self: 자신의 위치, target: 대상 위치, all: 모두
  targetEntityType?: string;
  targetEntityId?: number;
  apiUrl?: string;
  enableWebSocket?: boolean; // default: true - WebSocket 활성화 여부
  staticMarkers?: StaticMarker[]; // enableWebSocket=false일 때 표시할 정적 마커
  onMarkerClick?: (marker: StaticMarker) => void; // 마커 클릭 콜백
}

export function RealtimeMap({
  entityType = 'driver',
  entityId = 0,
  watchMode = 'self',
  targetEntityType,
  targetEntityId,
  apiUrl = 'http://localhost:8000',
  enableWebSocket = true,
  staticMarkers,
  onMarkerClick,
}: RealtimeMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const websocket = useRef<WebSocket | null>(null);
  const markers = useRef<Map<string, L.Marker>>(new Map());
  const [locations, setLocations] = useState<Map<string, Location>>(new Map());

  // 마커 아이콘 설정
  const createMarkerIcon = (type: 'driver' | 'customer' | 'target'): L.Icon => {
    const iconColor = type === 'driver' ? '#2563eb' : type === 'target' ? '#dc2626' : '#16a34a';
    const html = `
      <div style="
        background-color: ${iconColor};
        border: 3px solid white;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        font-size: 18px;
      ">
        ${type === 'driver' ? '🚗' : '👤'}
      </div>
    `;

    return L.icon({
      iconUrl: 'data:image/svg+xml;base64,' + btoa(html),
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    }) as L.Icon;
  };

  // 맵 초기화
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Leaflet 맵 생성
    map.current = L.map(mapContainer.current, {
      center: [37.5665, 126.978], // 서울 기본 위치
      zoom: 15,
      layers: [
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }),
      ],
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // WebSocket 연결
  useEffect(() => {
    if (!map.current || !enableWebSocket) return;

    const wsUrl =
      watchMode === 'all'
        ? `${apiUrl.replace('http', 'ws')}/api/locations/ws/admin/monitor`
        : watchMode === 'target' && targetEntityType && targetEntityId
        ? `${apiUrl.replace('http', 'ws')}/api/locations/ws/${targetEntityType}/${targetEntityId}`
        : `${apiUrl.replace('http', 'ws')}/api/locations/ws/${entityType}/${entityId}`;

    websocket.current = new WebSocket(wsUrl);

    websocket.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'location_update') {
        const location: Location = {
          id: Math.random(),
          entity_type: data.entity_type || 'customer',
          entity_id: data.entity_id,
          latitude: data.latitude,
          longitude: data.longitude,
          address: data.address,
          created_at: data.created_at || data.timestamp,
        };

        const markerKey = `${location.entity_type}:${location.entity_id}`;
        setLocations((prev) => new Map(prev).set(markerKey, location));

        // 기존 마커 업데이트 또는 새로 생성
        const latLng = L.latLng(location.latitude, location.longitude);

        if (markers.current.has(markerKey)) {
          markers.current.get(markerKey)!.setLatLng(latLng);
        } else {
          const iconType =
            location.entity_type === 'driver'
              ? 'driver'
              : location.entity_type === 'customer'
              ? 'target'
              : 'customer';

          const marker = L.marker(latLng, {
            icon: createMarkerIcon(iconType as any),
          })
            .bindPopup(
              `
              <strong>${location.entity_type === 'driver' ? '🚗 드라이버' : '👤 손님'}</strong><br>
              위도: ${location.latitude.toFixed(5)}<br>
              경도: ${location.longitude.toFixed(5)}<br>
              ${location.address ? `주소: ${location.address}<br>` : ''}
              시간: ${new Date(location.created_at || '').toLocaleTimeString('ko-KR')}
            `
            )
            .addTo(map.current!);

          markers.current.set(markerKey, marker);
        }

        // 맵 중심 이동 (첫 위치 또는 자신의 위치)
        if (watchMode === 'self' || markers.current.size === 1) {
          map.current!.setView(latLng, 15);
        }
      }
    };

    websocket.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      if (websocket.current) {
        websocket.current.close();
      }
    };
  }, [watchMode, entityType, entityId, targetEntityType, targetEntityId, apiUrl, enableWebSocket]);

  // 정적 마커 표시 (WebSocket 비활성화 모드)
  useEffect(() => {
    if (!map.current || enableWebSocket || !staticMarkers) return;

    staticMarkers.forEach((markerData) => {
      const markerKey = `${markerData.entity_type}:${markerData.entity_id}`;

      // 기존 마커 제거 (업데이트)
      if (markers.current.has(markerKey)) {
        const oldMarker = markers.current.get(markerKey);
        map.current!.removeLayer(oldMarker!);
      }

      const latLng = L.latLng(markerData.latitude, markerData.longitude);
      const iconType = markerData.entity_type === 'driver' ? 'driver' : 'target';

      const marker = L.marker(latLng, {
        icon: createMarkerIcon(iconType as any),
      })
        .bindPopup(
          `
          <strong>${markerData.entity_type === 'driver' ? '🚗 드라이버' : '👤 손님'}</strong><br>
          ${markerData.label ? `이름: ${markerData.label}<br>` : ''}
          위도: ${markerData.latitude.toFixed(5)}<br>
          경도: ${markerData.longitude.toFixed(5)}<br>
          ${markerData.address ? `주소: ${markerData.address}<br>` : ''}
        `
        )
        .addTo(map.current!);

      // 마커 클릭 콜백
      if (onMarkerClick) {
        marker.on('click', () => onMarkerClick(markerData));
      }

      markers.current.set(markerKey, marker);
    });

    // 첫 번째 마커 위치로 맵 중심 설정
    if (staticMarkers.length > 0) {
      const firstMarker = staticMarkers[0];
      map.current!.setView([firstMarker.latitude, firstMarker.longitude], 15);
    }
  }, [staticMarkers, enableWebSocket, onMarkerClick]);

  return (
    <div className="w-full h-full flex flex-col">
      <div
        ref={mapContainer}
        className="flex-1"
        style={{ minHeight: '400px' }}
      />
      {locations.size > 0 && (
        <div className="p-3 bg-gray-50 border-t text-sm">
          <span className="font-semibold">활성 위치:</span> {locations.size}개
        </div>
      )}
    </div>
  );
}
