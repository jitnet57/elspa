"""
📌 드라이버 API 엔드포인트 & WebSocket
📋 목적: 드라이버 대시보드, 예약, 위치, 수익 관리, 실시간 업데이트
📅 작성일: 2026-05-24
"""

import json
from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.driver_service import DriverService

router = APIRouter(prefix="/api/driver", tags=["driver"])


@router.get("/profile")
async def get_driver_profile(driver_id: int = Query(...), db: Session = Depends(get_db)):
    """
    🚗 드라이버 프로필 조회

    **Parameters:**
    - driver_id: 드라이버 ID

    **Response:**
    - 드라이버 정보, 차량 정보, 평점, 누적 수익
    """
    profile = DriverService.get_driver_profile(db, driver_id)
    if not profile:
        raise HTTPException(status_code=404, detail="드라이버를 찾을 수 없습니다")
    return profile


@router.get("/bookings/today")
async def get_today_bookings(driver_id: int = Query(...), db: Session = Depends(get_db)):
    """
    📅 오늘의 배정 목록 조회

    **Parameters:**
    - driver_id: 드라이버 ID

    **Response:**
    - 오늘의 배정 예약 목록 (시간 순서)
    """
    bookings = DriverService.get_today_bookings(db, driver_id)
    return {
        "count": len(bookings),
        "bookings": bookings,
    }


@router.get("/earnings")
async def get_earnings(driver_id: int = Query(...), db: Session = Depends(get_db)):
    """
    💰 수익 현황 조회

    **Parameters:**
    - driver_id: 드라이버 ID

    **Response:**
    - 일일/주간/월간 수익, 수익 내역
    """
    earnings = DriverService.get_earnings_summary(db, driver_id)
    return earnings


@router.post("/location")
async def update_location(
    driver_id: int = Query(...),
    latitude: float = Query(...),
    longitude: float = Query(...),
    accuracy: float = Query(None),
    db: Session = Depends(get_db)
):
    """
    📍 드라이버 위치 업데이트 (GPS)

    **Parameters:**
    - driver_id: 드라이버 ID
    - latitude: 위도
    - longitude: 경도
    - accuracy: 정확도 (미터, 선택)

    **Response:**
    - 저장된 위치 정보
    """
    location = DriverService.update_driver_location(db, driver_id, latitude, longitude, accuracy)
    return location


@router.get("/location")
async def get_location(driver_id: int = Query(...), db: Session = Depends(get_db)):
    """
    📍 드라이버 최신 위치 조회

    **Parameters:**
    - driver_id: 드라이버 ID

    **Response:**
    - 최신 위치 (위도, 경도, 정확도, 타임스탬프)
    """
    location = DriverService.get_driver_location(db, driver_id)
    if not location:
        return {"latitude": None, "longitude": None, "message": "위치 정보 없음"}
    return location


@router.post("/booking/{booking_id}/accept")
async def accept_booking(
    booking_id: int,
    driver_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """
    ✅ 예약 수락

    **Parameters:**
    - booking_id: 예약 ID (경로)
    - driver_id: 드라이버 ID

    **Response:**
    - 수락된 예약 정보
    """
    result = DriverService.accept_booking(db, driver_id, booking_id)
    if not result:
        raise HTTPException(status_code=404, detail="예약을 찾을 수 없습니다")
    return result


@router.post("/booking/{booking_id}/reject")
async def reject_booking(
    booking_id: int,
    driver_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """
    ❌ 예약 거절

    **Parameters:**
    - booking_id: 예약 ID (경로)
    - driver_id: 드라이버 ID

    **Response:**
    - 거절된 예약 정보
    """
    result = DriverService.reject_booking(db, driver_id, booking_id)
    if not result:
        raise HTTPException(status_code=404, detail="예약을 찾을 수 없습니다")
    return result


@router.post("/booking/{booking_id}/start")
async def start_trip(
    booking_id: int,
    driver_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """
    🚗 여행 시작

    **Parameters:**
    - booking_id: 예약 ID (경로)
    - driver_id: 드라이버 ID

    **Response:**
    - 시작된 여행 정보
    """
    result = DriverService.start_trip(db, driver_id, booking_id)
    if not result:
        raise HTTPException(status_code=404, detail="예약을 찾을 수 없습니다")
    return result


@router.post("/booking/{booking_id}/complete")
async def complete_trip(
    booking_id: int,
    driver_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """
    ✨ 여행 완료

    **Parameters:**
    - booking_id: 예약 ID (경로)
    - driver_id: 드라이버 ID

    **Response:**
    - 완료된 여행 정보, 수익 기록
    """
    result = DriverService.complete_trip(db, driver_id, booking_id)
    if not result:
        raise HTTPException(status_code=404, detail="예약을 찾을 수 없습니다")
    return result


@router.get("/health")
async def health_check():
    """
    🏥 드라이버 API 헬스 체크
    """
    return {"status": "🟢 operational", "service": "driver_api"}


@router.post("/withdrawal/request")
async def request_withdrawal(
    driver_id: int = Query(...),
    amount: float = Query(...),
    bank_name: str = Query(...),
    account_number: str = Query(...),
    account_holder: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    💰 출금 요청

    **Parameters:**
    - driver_id: 드라이버 ID
    - amount: 출금 금액
    - bank_name: 은행명
    - account_number: 계좌번호
    - account_holder: 예금주명

    **Response:**
    - 출금 요청 정보
    """
    result = DriverService.request_withdrawal(
        db, driver_id, amount, bank_name, account_number, account_holder
    )
    if not result:
        raise HTTPException(status_code=404, detail="드라이버를 찾을 수 없습니다")
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.get("/withdrawal/history")
async def get_withdrawal_history(driver_id: int = Query(...), db: Session = Depends(get_db)):
    """
    📋 출금 이력 조회

    **Parameters:**
    - driver_id: 드라이버 ID

    **Response:**
    - 출금 요청 이력 (최신순)
    """
    withdrawals = DriverService.get_withdrawals(db, driver_id)
    return {"count": len(withdrawals), "withdrawals": withdrawals}


@router.get("/withdrawal/balance")
async def get_withdrawal_balance(driver_id: int = Query(...), db: Session = Depends(get_db)):
    """
    💵 출금 가능 금액 조회

    **Parameters:**
    - driver_id: 드라이버 ID

    **Response:**
    - 총 수익, 출금액, 가용 잔액, 대기 중인 출금
    """
    balance = DriverService.get_withdrawal_balance(db, driver_id)
    if not balance:
        raise HTTPException(status_code=404, detail="드라이버를 찾을 수 없습니다")
    return balance


# ============================================================
# 🔄 WebSocket 실시간 연결 관리 (Phase 2)
# ============================================================

class DriverConnectionManager:
    """
    📌 드라이버 WebSocket 연결 관리자
    📋 목적: 여러 드라이버의 실시간 연결 유지, 메시지 브로드캐스트
    """
    def __init__(self):
        # 드라이버별 활성 연결: {driver_id: [websocket1, websocket2, ...]}
        self.active_connections: dict[int, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, driver_id: int):
        """드라이버 WebSocket 연결 수락"""
        await websocket.accept()
        if driver_id not in self.active_connections:
            self.active_connections[driver_id] = []
        self.active_connections[driver_id].append(websocket)

    def disconnect(self, websocket: WebSocket, driver_id: int):
        """드라이버 WebSocket 연결 종료"""
        if driver_id in self.active_connections:
            self.active_connections[driver_id].remove(websocket)
            if not self.active_connections[driver_id]:
                del self.active_connections[driver_id]

    async def broadcast_to_driver(self, driver_id: int, message: dict):
        """특정 드라이버의 모든 연결에 메시지 브로드캐스트"""
        if driver_id in self.active_connections:
            for connection in self.active_connections[driver_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"메시지 전송 실패 (드라이버 {driver_id}): {e}")

    async def broadcast_location_update(self, driver_id: int, latitude: float, longitude: float, accuracy: float = None):
        """위치 업데이트 브로드캐스트"""
        message = {
            "type": "location_update",
            "driver_id": driver_id,
            "latitude": latitude,
            "longitude": longitude,
            "accuracy": accuracy,
            "timestamp": str(DriverService._get_timestamp()),
        }
        await self.broadcast_to_driver(driver_id, message)

    async def broadcast_booking_notification(self, driver_id: int, booking_id: int, event_type: str, booking_data: dict = None):
        """예약 알림 브로드캐스트 (assigned, accepted, started, completed)"""
        message = {
            "type": "booking_notification",
            "event": event_type,
            "driver_id": driver_id,
            "booking_id": booking_id,
            "data": booking_data,
            "timestamp": str(DriverService._get_timestamp()),
        }
        await self.broadcast_to_driver(driver_id, message)


# 글로벌 연결 관리자
driver_manager = DriverConnectionManager()


@router.websocket("/ws/{driver_id}")
async def websocket_endpoint(websocket: WebSocket, driver_id: int):
    """
    🔄 드라이버 실시간 WebSocket 연결

    **메시지 타입:**
    - location_update: 드라이버 위치 업데이트
    - booking_notification: 새 배정 알림 또는 상태 변경
    - connection_established: 연결 수립 확인

    **클라이언트에서 보낼 수 있는 메시지:**
    ```json
    {
      "type": "location_update",
      "latitude": 37.4979,
      "longitude": 127.0276,
      "accuracy": 5.0
    }
    ```
    """
    await driver_manager.connect(websocket, driver_id)

    try:
        # 연결 수립 확인
        await websocket.send_json({
            "type": "connection_established",
            "driver_id": driver_id,
            "status": "connected",
            "timestamp": str(DriverService._get_timestamp()),
        })

        # 메시지 수신 루프
        while True:
            data = await websocket.receive_json()

            if data.get("type") == "location_update":
                # 위치 업데이트 메시지
                latitude = data.get("latitude")
                longitude = data.get("longitude")
                accuracy = data.get("accuracy")

                if latitude and longitude:
                    # 위치 정보 저장 (데이터베이스)
                    # db = get_db()에서 취득 불가능하므로, 클라이언트가 REST API로 별도 저장

                    # 모든 연결된 클라이언트에게 브로드캐스트
                    await driver_manager.broadcast_location_update(
                        driver_id, latitude, longitude, accuracy
                    )

            elif data.get("type") == "ping":
                # 헬스 체크
                await websocket.send_json({"type": "pong", "timestamp": str(DriverService._get_timestamp())})

    except WebSocketDisconnect:
        driver_manager.disconnect(websocket, driver_id)
    except Exception as e:
        print(f"WebSocket 에러 (드라이버 {driver_id}): {e}")
        driver_manager.disconnect(websocket, driver_id)
