"""
============================================================
📌 Realtime Monitor WebSocket Endpoints
📋 목적: 침대/예약/테라피스트 실시간 동기화
🔧 포함: 연결, 메시지 처리, 브로드캐스트
📅 작성일: 2026-05-28
============================================================

메시지 형식:
  {
    "type": "bed_status_changed" | "booking_added" | "booking_cancelled" | "therapist_checkin",
    "data": {...},
    "timestamp": "2026-05-28T10:30:00"
  }

클라이언트가 받는 메시지 타입:
  1. bed_status_changed: 침대 상태 변경 (available → occupied → cleaning)
  2. booking_added: 새 예약 추가
  3. booking_completed: 예약 완료
  4. booking_cancelled: 예약 취소
  5. therapist_checkin: 테라피스트 체크인
  6. therapist_checkout: 테라피스트 체크아웃
  7. heartbeat: 하트비트 (30초마다)
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.services.websocket_manager import manager, RealtimeMessageBuilder
import json
import asyncio
import logging

logger = logging.getLogger(__name__)

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/monitor")
async def websocket_monitor_endpoint(
    websocket: WebSocket,
    user_id: str = Query(None, description="사용자 ID"),
    room_zone: str = Query(None, description="모니터링 룸 (모두 보려면 'all')"),
):
    """
    Monitor 실시간 동기화 WebSocket 연결

    클라이언트가 연결하면:
    1. 하트비트 매 30초마다 전송
    2. 침대/예약/테라피스트 변경 시 실시간 동기화
    3. 자동 재연결 지원

    Parameters:
      user_id: 모니터링하는 관리자 ID (optional)
      room_zone: 특정 룸만 모니터링 (optional, 기본값: 'all')
    """
    await manager.connect(websocket, user_id)
    logger.info(f"✅ Monitor WebSocket 연결: {user_id or 'unknown'} (룸: {room_zone or 'all'})")

    try:
        # 연결 확인 메시지
        await manager.send_personal(
            websocket,
            {
                "type": "connected",
                "data": {
                    "message": "Monitor dashboard connected",
                    "userId": user_id,
                    "roomZone": room_zone or "all",
                    "activeConnections": manager.get_connection_count(),
                },
            },
        )

        # 하트비트 태스크
        async def send_heartbeat():
            while True:
                try:
                    await asyncio.sleep(30)  # 30초마다 하트비트
                    await manager.send_personal(
                        websocket, RealtimeMessageBuilder.heartbeat()
                    )
                except Exception:
                    break

        heartbeat_task = asyncio.create_task(send_heartbeat())

        # 메시지 수신 루프
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=120)
                message = json.loads(data)

                # 클라이언트 메시지 처리
                message_type = message.get("type")

                if message_type == "ping":
                    # 핑-퐁 응답
                    await manager.send_personal(websocket, {"type": "pong"})

                elif message_type == "sync":
                    # 전체 상태 동기화 요청
                    await manager.send_personal(
                        websocket,
                        RealtimeMessageBuilder.sync_request(),
                    )

                logger.info(f"📨 클라이언트 메시지 ({user_id}): {message_type}")

            except asyncio.TimeoutError:
                # 120초 동안 메시지가 없으면 연결 유지 중 체크
                pass
            except json.JSONDecodeError as e:
                logger.warning(f"⚠️ 잘못된 JSON 형식: {e}")
            except WebSocketDisconnect:
                break
            except Exception as e:
                logger.error(f"❌ 메시지 처리 오류: {e}")
                break

        heartbeat_task.cancel()

    except Exception as e:
        logger.error(f"❌ WebSocket 오류: {e}")
    finally:
        manager.disconnect(websocket, user_id)
        logger.info(f"❌ Monitor WebSocket 연결 해제: {user_id or 'unknown'}")


# ============================================================
# 브로드캐스트 API 엔드포인트 (내부용)
# ============================================================


@router.post("/api/realtime/broadcast/bed-status")
async def broadcast_bed_status_change(
    bed_id: int,
    status: str,  # 'available', 'occupied', 'cleaning'
    customer_id: int = None,
    customer_name: str = None,
    therapist_id: int = None,
    therapist_name: str = None,
    service_name: str = None,
    starts_at: str = None,
    ends_at: str = None,
):
    """
    침대 상태 변경 브로드캐스트 (내부 API)

    침대 상태가 변경될 때 호출하여 모든 클라이언트에 알립니다.

    예시:
      POST /api/realtime/broadcast/bed-status
      {
        "bed_id": 1,
        "status": "occupied",
        "customer_id": 123,
        "customer_name": "김철수",
        "therapist_id": 456,
        "therapist_name": "이영희",
        "service_name": "스웨디시 60분",
        "starts_at": "2026-05-28T10:00:00"
      }
    """
    message = RealtimeMessageBuilder.bed_status_changed(
        bed_id=bed_id,
        status=status,
        customer_id=customer_id,
        customer_name=customer_name,
        therapist_id=therapist_id,
        therapist_name=therapist_name,
        service_name=service_name,
        starts_at=starts_at,
        ends_at=ends_at,
    )

    await manager.broadcast(message)
    logger.info(f"📢 침대 {bed_id} 상태 변경 브로드캐스트: {status}")

    return {"status": "broadcasted", "connections": manager.get_connection_count()}


@router.post("/api/realtime/broadcast/booking-added")
async def broadcast_booking_added(
    booking_id: int,
    bed_id: int,
    customer_id: int,
    customer_name: str,
    therapist_id: int,
    therapist_name: str,
    service_name: str,
    service_minutes: int,
    service_price: float,
    starts_at: str,
    ends_at: str,
):
    """
    새 예약 추가 브로드캐스트 (내부 API)

    예약이 생성되면 모든 클라이언트에 알립니다.
    """
    message = RealtimeMessageBuilder.booking_added(
        booking_id=booking_id,
        bed_id=bed_id,
        customer_id=customer_id,
        customer_name=customer_name,
        therapist_id=therapist_id,
        therapist_name=therapist_name,
        service_name=service_name,
        service_minutes=service_minutes,
        service_price=service_price,
        starts_at=starts_at,
        ends_at=ends_at,
    )

    await manager.broadcast(message)
    logger.info(f"📢 새 예약 추가 브로드캐스트: Booking #{booking_id}")

    return {"status": "broadcasted", "connections": manager.get_connection_count()}


@router.post("/api/realtime/broadcast/booking-completed")
async def broadcast_booking_completed(
    booking_id: int,
    bed_id: int,
):
    """
    예약 완료 브로드캐스트 (내부 API)

    예약이 완료되면 모든 클라이언트에 알립니다.
    """
    message = RealtimeMessageBuilder.booking_completed(
        booking_id=booking_id,
        bed_id=bed_id,
    )

    await manager.broadcast(message)
    logger.info(f"📢 예약 완료 브로드캐스트: Booking #{booking_id}")

    return {"status": "broadcasted", "connections": manager.get_connection_count()}


@router.post("/api/realtime/broadcast/booking-cancelled")
async def broadcast_booking_cancelled(
    booking_id: int,
    bed_id: int,
    reason: str = None,
):
    """
    예약 취소 브로드캐스트 (내부 API)

    예약이 취소되면 모든 클라이언트에 알립니다.
    """
    message = RealtimeMessageBuilder.booking_cancelled(
        booking_id=booking_id,
        bed_id=bed_id,
        reason=reason,
    )

    await manager.broadcast(message)
    logger.info(f"📢 예약 취소 브로드캐스트: Booking #{booking_id}")

    return {"status": "broadcasted", "connections": manager.get_connection_count()}


@router.post("/api/realtime/broadcast/therapist-checkin")
async def broadcast_therapist_checkin(
    therapist_id: int,
    therapist_name: str,
    check_in_time: str,
):
    """
    테라피스트 체크인 브로드캐스트 (내부 API)

    테라피스트가 체크인하면 모든 클라이언트에 알립니다.
    """
    message = RealtimeMessageBuilder.therapist_checkin(
        therapist_id=therapist_id,
        therapist_name=therapist_name,
        check_in_time=check_in_time,
    )

    await manager.broadcast(message)
    logger.info(f"📢 테라피스트 체크인 브로드캐스트: {therapist_name}")

    return {"status": "broadcasted", "connections": manager.get_connection_count()}


@router.post("/api/realtime/broadcast/therapist-checkout")
async def broadcast_therapist_checkout(
    therapist_id: int,
    therapist_name: str,
    check_out_time: str,
):
    """
    테라피스트 체크아웃 브로드캐스트 (내부 API)

    테라피스트가 체크아웃하면 모든 클라이언트에 알립니다.
    """
    message = RealtimeMessageBuilder.therapist_checkout(
        therapist_id=therapist_id,
        therapist_name=therapist_name,
        check_out_time=check_out_time,
    )

    await manager.broadcast(message)
    logger.info(f"📢 테라피스트 체크아웃 브로드캐스트: {therapist_name}")

    return {"status": "broadcasted", "connections": manager.get_connection_count()}


@router.get("/api/realtime/ws/status")
async def websocket_status():
    """
    Monitor WebSocket 연결 상태 조회 API

    응답:
      {
        "active_connections": 5,
        "active_users": 3,
        "status": "🟢 Ready"
      }
    """
    return {
        "active_connections": manager.get_connection_count(),
        "active_users": manager.get_user_count(),
        "status": "🟢 Ready" if manager.get_connection_count() > 0 else "🟡 No active connections",
    }
