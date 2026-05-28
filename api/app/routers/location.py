from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_
from datetime import datetime, timedelta
from typing import Optional
import json
import logging

from app.models.location import Location
from app.database import get_db
from app.services.connection_manager import manager
from app.schemas.location import LocationCreate, LocationResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/locations", tags=["Locations"])


# ============================================================
# REST API 엔드포인트
# ============================================================

@router.post("", response_model=LocationResponse)
async def save_location(
    location_data: LocationCreate,
    db: Session = Depends(get_db)
):
    """위치 정보 저장"""
    location = Location(
        entity_type=location_data.entity_type,
        entity_id=location_data.entity_id,
        latitude=location_data.latitude,
        longitude=location_data.longitude,
        accuracy=location_data.accuracy,
        address=location_data.address,
        session_id=location_data.session_id,
    )
    db.add(location)
    db.commit()
    db.refresh(location)
    logger.info(f"📍 Location saved: {location.entity_type}:{location.entity_id}")
    return location


@router.get("/current/{entity_type}/{entity_id}", response_model=LocationResponse)
async def get_current_location(
    entity_type: str,
    entity_id: int,
    db: Session = Depends(get_db)
):
    """최신 위치 정보 조회"""
    location = db.query(Location).filter(
        and_(
            Location.entity_type == entity_type,
            Location.entity_id == entity_id
        )
    ).order_by(desc(Location.created_at)).first()

    if not location:
        return {"error": "Location not found"}
    return location


@router.get("/history/{entity_type}/{entity_id}")
async def get_location_history(
    entity_type: str,
    entity_id: int,
    limit: int = Query(100, ge=1, le=1000),
    minutes: int = Query(60, ge=1, le=1440),
    db: Session = Depends(get_db)
):
    """위치 히스토리 조회 (최근 N분)"""
    since = datetime.utcnow() - timedelta(minutes=minutes)

    locations = db.query(Location).filter(
        and_(
            Location.entity_type == entity_type,
            Location.entity_id == entity_id,
            Location.created_at >= since
        )
    ).order_by(desc(Location.created_at)).limit(limit).all()

    return {
        "entity_type": entity_type,
        "entity_id": entity_id,
        "count": len(locations),
        "locations": [
            {
                "id": loc.id,
                "latitude": loc.latitude,
                "longitude": loc.longitude,
                "address": loc.address,
                "accuracy": loc.accuracy,
                "created_at": loc.created_at.isoformat() if loc.created_at else None,
            }
            for loc in locations
        ],
    }


@router.get("/nearby")
async def get_nearby_locations(
    center_lat: float,
    center_lon: float,
    radius_km: float = Query(5, ge=0.1, le=100),
    entity_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """근처 위치 조회 (간단한 거리 계산 기반)"""
    # 대략적인 거리 계산 (정확하지 않음, 실제는 PostGIS 사용 권장)
    lat_range = radius_km / 111.0  # 1도 ≈ 111km
    lon_range = radius_km / (111.0 * (1 - ((center_lat / 180) ** 2) ** 0.5))

    query = db.query(Location).filter(
        and_(
            Location.latitude.between(center_lat - lat_range, center_lat + lat_range),
            Location.longitude.between(center_lon - lon_range, center_lon + lon_range),
        )
    )

    if entity_type:
        query = query.filter(Location.entity_type == entity_type)

    locations = query.order_by(desc(Location.created_at)).limit(100).all()

    return {
        "center": {"lat": center_lat, "lon": center_lon},
        "radius_km": radius_km,
        "count": len(locations),
        "locations": [
            {
                "id": loc.id,
                "entity_type": loc.entity_type,
                "entity_id": loc.entity_id,
                "latitude": loc.latitude,
                "longitude": loc.longitude,
                "address": loc.address,
                "created_at": loc.created_at.isoformat() if loc.created_at else None,
            }
            for loc in locations
        ],
    }


# ============================================================
# WebSocket 엔드포인트 (실시간 위치 스트림)
# ============================================================

@router.websocket("/ws/{entity_type}/{entity_id}")
async def websocket_location_stream(
    websocket: WebSocket,
    entity_type: str,
    entity_id: int
):
    """
    실시간 위치 스트림

    Usage:
    ws://localhost:8000/api/locations/ws/driver/123

    메시지 형식:
    {
        "type": "location_update",
        "latitude": 37.5665,
        "longitude": 126.9780,
        "accuracy": 10,
        "address": "Seoul, Korea"
    }
    """
    await manager.connect(entity_type, entity_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()

            if data.get("type") == "location_update":
                # 위치 저장
                from app.database import SessionLocal
                db = SessionLocal()
                try:
                    location = Location(
                        entity_type=entity_type,
                        entity_id=entity_id,
                        latitude=data.get("latitude"),
                        longitude=data.get("longitude"),
                        accuracy=data.get("accuracy"),
                        address=data.get("address"),
                        session_id=data.get("session_id"),
                    )
                    db.add(location)
                    db.commit()

                    # 모든 연결에 브로드캐스트
                    await manager.broadcast_location(entity_type, entity_id, {
                        "latitude": location.latitude,
                        "longitude": location.longitude,
                        "accuracy": location.accuracy,
                        "address": location.address,
                        "created_at": location.created_at.isoformat() if location.created_at else None,
                    })

                    # 관리자 대시보드에도 전송
                    await manager.broadcast_to_watchers({
                        "type": "location_update",
                        "entity_type": entity_type,
                        "entity_id": entity_id,
                        "latitude": location.latitude,
                        "longitude": location.longitude,
                        "address": location.address,
                        "timestamp": location.created_at.isoformat() if location.created_at else None,
                    })

                    logger.info(f"📍 {entity_type}:{entity_id} location updated")
                finally:
                    db.close()

    except WebSocketDisconnect:
        await manager.disconnect(entity_type, entity_id, websocket)
    except Exception as e:
        logger.error(f"❌ WebSocket error: {e}")
        await manager.disconnect(entity_type, entity_id, websocket)


@router.websocket("/ws/admin/monitor")
async def websocket_admin_monitor(websocket: WebSocket):
    """
    관리자 모니터 (모든 위치 변경 실시간 감시)

    Usage:
    ws://localhost:8000/api/locations/ws/admin/monitor
    """
    await websocket.accept()
    if "admin" not in manager.watchers:
        manager.watchers["admin"] = set()
    manager.watchers["admin"].add(websocket)
    logger.info("👁️ Admin monitor connected")

    try:
        while True:
            # 웹소켓 연결 유지
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.watchers["admin"].discard(websocket)
        logger.info("👁️ Admin monitor disconnected")
    except Exception as e:
        logger.error(f"❌ Admin monitor error: {e}")
        manager.watchers["admin"].discard(websocket)
