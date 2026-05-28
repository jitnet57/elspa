# ============================================================
# 📌 네트워크 WebSocket 라우터
# 📋 목적: 실시간 네트워크 데이터 동기화
# 🔧 기능: 클라이언트 연결, 메시지 브로드캐스트, 상태 관리
# 📅 작성일: 2025-05-29
# ============================================================

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import List, Dict, Set
import json
import logging
from datetime import datetime
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ws", tags=["websocket"])

# ============================================================
# 📊 메시지 모델
# ============================================================


class NodeData(BaseModel):
    """노드 데이터 모델"""

    id: str
    label: str
    type: str
    x: float | None = None
    y: float | None = None
    z: float | None = None


class EdgeData(BaseModel):
    """엣지 데이터 모델"""

    source: str
    target: str
    weight: float | None = 1.0
    type: str | None = None


class NetworkMessage(BaseModel):
    """네트워크 메시지 모델"""

    type: str  # 'edge_added', 'edge_deleted', 'node_added', 'init', 'error'
    data: Dict | None = None
    timestamp: str | None = None


# ============================================================
# 🔌 WebSocket 연결 관리자
# ============================================================


class ConnectionManager:
    """
    WebSocket 연결을 관리하는 클래스
    - 클라이언트 연결/해제
    - 메시지 브로드캐스트
    - 현재 상태 추적
    """

    def __init__(self, max_connections: int = 100):
        self.active_connections: List[WebSocket] = []
        self.client_data: Dict[WebSocket, Dict] = {}
        self.max_connections = max_connections
        self.message_history: List[NetworkMessage] = []

    async def connect(self, websocket: WebSocket) -> bool:
        """클라이언트 연결"""
        if len(self.active_connections) >= self.max_connections:
            await websocket.close(code=1008, reason="Server at max capacity")
            return False

        await websocket.accept()
        self.active_connections.append(websocket)
        self.client_data[websocket] = {
            "connected_at": datetime.now().isoformat(),
            "message_count": 0,
        }
        logger.info(f"✅ 클라이언트 연결: {len(self.active_connections)}/{self.max_connections}")
        return True

    def disconnect(self, websocket: WebSocket):
        """클라이언트 연결 해제"""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if websocket in self.client_data:
            del self.client_data[websocket]
        logger.info(f"❌ 클라이언트 연결 해제: {len(self.active_connections)} 남음")

    async def broadcast(self, message: NetworkMessage):
        """모든 클라이언트에 메시지 브로드캐스트"""
        if not message.timestamp:
            message.timestamp = datetime.now().isoformat()

        # 메시지 히스토리에 추가 (최대 1000개)
        self.message_history.append(message)
        if len(self.message_history) > 1000:
            self.message_history.pop(0)

        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message.dict())
                self.client_data[connection]["message_count"] += 1
            except Exception as e:
                logger.error(f"❌ 브로드캐스트 에러: {e}")
                disconnected.append(connection)

        # 연결 끊긴 클라이언트 제거
        for connection in disconnected:
            self.disconnect(connection)

    async def send_initial_state(self, websocket: WebSocket, state: Dict):
        """클라이언트에 초기 상태 전송"""
        message = NetworkMessage(
            type="init",
            data=state,
            timestamp=datetime.now().isoformat(),
        )
        try:
            await websocket.send_json(message.dict())
        except Exception as e:
            logger.error(f"❌ 초기 상태 전송 에러: {e}")

    def get_stats(self) -> Dict:
        """연결 통계 반환"""
        return {
            "total_connections": len(self.active_connections),
            "max_connections": self.max_connections,
            "message_history_length": len(self.message_history),
            "clients": [
                {
                    "connected_at": data["connected_at"],
                    "message_count": data["message_count"],
                }
                for data in self.client_data.values()
            ],
        }


# 전역 연결 관리자
manager = ConnectionManager(max_connections=100)

# ============================================================
# 🔌 WebSocket 엔드포인트
# ============================================================


@router.websocket("/network")
async def websocket_network_endpoint(websocket: WebSocket):
    """
    네트워크 WebSocket 엔드포인트
    클라이언트가 연결하면 현재 네트워크 상태를 전송하고
    실시간으로 변경 사항을 브로드캐스트
    """

    # 연결 수락
    connected = await manager.connect(websocket)
    if not connected:
        return

    try:
        # 초기 상태 전송 (실제로는 DB에서 조회)
        initial_state = {
            "nodes": [],
            "edges": [],
            "timestamp": datetime.now().isoformat(),
        }
        await manager.send_initial_state(websocket, initial_state)

        # 클라이언트로부터 메시지 수신
        while True:
            data = await websocket.receive_text()
            message = NetworkMessage(**json.loads(data))

            logger.info(f"📨 메시지 수신: {message.type}")

            # 메시지 타입별 처리
            if message.type == "edge_added":
                # 모든 클라이언트에 엣지 추가 브로드캐스트
                await manager.broadcast(message)

            elif message.type == "edge_deleted":
                # 모든 클라이언트에 엣지 삭제 브로드캐스트
                await manager.broadcast(message)

            elif message.type == "node_added":
                # 모든 클라이언트에 노드 추가 브로드캐스트
                await manager.broadcast(message)

            else:
                logger.warning(f"⚠️  알 수 없는 메시지 타입: {message.type}")

    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info("📴 WebSocket 연결 종료")

    except Exception as e:
        logger.error(f"❌ WebSocket 에러: {e}")
        manager.disconnect(websocket)


# ============================================================
# 📊 통계 엔드포인트 (REST)
# ============================================================


@router.get("/stats")
async def get_websocket_stats():
    """
    WebSocket 연결 통계 조회

    반환값:
    - total_connections: 현재 연결된 클라이언트 수
    - max_connections: 최대 연결 가능 수
    - message_history_length: 저장된 메시지 개수
    """
    return manager.get_stats()


@router.get("/history")
async def get_message_history(limit: int = 10):
    """
    최근 메시지 히스토리 조회

    쿼리 파라미터:
    - limit: 반환할 최근 메시지 수 (기본값: 10)
    """
    return {
        "total": len(manager.message_history),
        "messages": [
            msg.dict() for msg in manager.message_history[-limit:]
        ],
    }


@router.post("/broadcast")
async def broadcast_message(message: NetworkMessage):
    """
    관리자용 메시지 브로드캐스트 엔드포인트

    body:
    - type: 메시지 타입
    - data: 메시지 데이터
    """
    if not message.timestamp:
        message.timestamp = datetime.now().isoformat()

    await manager.broadcast(message)

    return {
        "status": "success",
        "message": "메시지 브로드캐스트 완료",
        "clients_notified": len(manager.active_connections),
    }


# ============================================================
# 🧹 서버 라이프사이클
# ============================================================


async def shutdown_handler():
    """서버 종료 시 모든 연결 종료"""
    logger.info("🛑 WebSocket 서버 종료 중...")
    for connection in manager.active_connections[:]:
        await connection.close()
    manager.active_connections.clear()
    logger.info("✅ 모든 WebSocket 연결 종료됨")
