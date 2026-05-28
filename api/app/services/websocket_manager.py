"""
📌 WebSocket Connection Manager
📋 목적: 실시간 재무 데이터 동기화
🔧 포함: 클라이언트 연결 추적, 브로드캐스트, 메시지 큐
"""

from typing import Set, Dict, Any, Optional
from fastapi import WebSocket
import json
import asyncio
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    """WebSocket 연결 관리"""

    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.user_connections: Dict[str, Set[WebSocket]] = {}
        self.message_queue: asyncio.Queue = asyncio.Queue()

    async def connect(self, websocket: WebSocket, user_id: Optional[str] = None):
        """클라이언트 연결"""
        await websocket.accept()
        self.active_connections.add(websocket)

        if user_id:
            if user_id not in self.user_connections:
                self.user_connections[user_id] = set()
            self.user_connections[user_id].add(websocket)

        logger.info(f"✅ 클라이언트 연결: {user_id or 'unknown'} (총 {len(self.active_connections)})")

    def disconnect(self, websocket: WebSocket, user_id: Optional[str] = None):
        """클라이언트 연결 해제"""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

        if user_id and user_id in self.user_connections:
            self.user_connections[user_id].discard(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]

        logger.info(f"❌ 클라이언트 연결 해제: {user_id or 'unknown'} (남은 연결: {len(self.active_connections)})")

    async def broadcast(self, message: Dict[str, Any]):
        """모든 클라이언트에 메시지 브로드캐스트"""
        message["timestamp"] = datetime.utcnow().isoformat()
        payload = json.dumps(message)

        # 연결이 끊긴 클라이언트 추적
        dead_connections = set()

        for connection in self.active_connections.copy():
            try:
                await connection.send_text(payload)
            except Exception as e:
                logger.error(f"⚠️ 브로드캐스트 실패: {e}")
                dead_connections.add(connection)

        # 죽은 연결 제거
        for connection in dead_connections:
            self.active_connections.discard(connection)

    async def broadcast_to_user(self, user_id: str, message: Dict[str, Any]):
        """특정 사용자의 모든 연결에 메시지 전송"""
        if user_id not in self.user_connections:
            return

        message["timestamp"] = datetime.utcnow().isoformat()
        payload = json.dumps(message)

        dead_connections = set()

        for connection in self.user_connections[user_id].copy():
            try:
                await connection.send_text(payload)
            except Exception as e:
                logger.error(f"⚠️ 사용자 메시지 전송 실패: {e}")
                dead_connections.add(connection)

        # 죽은 연결 제거
        for connection in dead_connections:
            self.user_connections[user_id].discard(connection)
            self.active_connections.discard(connection)

    async def send_personal(self, websocket: WebSocket, message: Dict[str, Any]):
        """특정 연결에만 메시지 전송"""
        try:
            message["timestamp"] = datetime.utcnow().isoformat()
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            logger.error(f"⚠️ 개인 메시지 전송 실패: {e}")

    def get_connection_count(self) -> int:
        """활성 연결 수"""
        return len(self.active_connections)

    def get_user_count(self) -> int:
        """활성 사용자 수"""
        return len(self.user_connections)


class FinancialMessageBuilder:
    """재무 데이터 메시지 빌더"""

    @staticmethod
    def expense_added(expense_id: int, category_id: int, amount: float, description: str):
        """지출 추가 메시지"""
        return {
            "type": "expense_added",
            "data": {
                "id": expense_id,
                "categoryId": category_id,
                "amount": amount,
                "description": description,
            },
        }

    @staticmethod
    def expense_updated(expense_id: int, category_id: int, amount: float, description: str):
        """지출 수정 메시지"""
        return {
            "type": "expense_updated",
            "data": {
                "id": expense_id,
                "categoryId": category_id,
                "amount": amount,
                "description": description,
            },
        }

    @staticmethod
    def expense_deleted(expense_id: int):
        """지출 삭제 메시지"""
        return {
            "type": "expense_deleted",
            "data": {
                "id": expense_id,
            },
        }

    @staticmethod
    def budget_changed(year: int, month: int, expense_limit: float, target_revenue: float):
        """예산 변경 메시지"""
        return {
            "type": "budget_changed",
            "data": {
                "year": year,
                "month": month,
                "expenseLimit": expense_limit,
                "targetRevenue": target_revenue,
            },
        }

    @staticmethod
    def budget_exceeded(year: int, month: int, actual: float, limit: float):
        """예산 초과 알림 메시지"""
        return {
            "type": "budget_exceeded",
            "data": {
                "year": year,
                "month": month,
                "actual": actual,
                "limit": limit,
                "message": f"예산을 초과했습니다: ₱{actual:,.0f} > ₱{limit:,.0f}",
            },
        }

    @staticmethod
    def category_added(category_id: int, name: str, category_type: str):
        """카테고리 추가 메시지"""
        return {
            "type": "category_added",
            "data": {
                "id": category_id,
                "name": name,
                "categoryType": category_type,
            },
        }

    @staticmethod
    def heartbeat():
        """하트비트 메시지"""
        return {
            "type": "heartbeat",
            "message": "Server is alive",
        }

    @staticmethod
    def sync_request(year: int, month: int):
        """동기화 요청 메시지"""
        return {
            "type": "sync_request",
            "data": {
                "year": year,
                "month": month,
                "message": "전체 데이터 동기화 필요",
            },
        }


# 전역 Connection Manager 인스턴스
manager = ConnectionManager()
