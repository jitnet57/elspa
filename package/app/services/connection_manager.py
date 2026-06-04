from typing import Dict, List, Set
from fastapi import WebSocket
import json
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    """WebSocket 연결 관리"""

    def __init__(self):
        # {entity_type}:{entity_id} -> Set[WebSocket]
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # entity -> 시청자 (관리자 등)
        self.watchers: Dict[str, Set[WebSocket]] = {}

    async def connect(self, entity_type: str, entity_id: int, websocket: WebSocket):
        """WebSocket 연결"""
        await websocket.accept()
        key = f"{entity_type}:{entity_id}"
        if key not in self.active_connections:
            self.active_connections[key] = set()
        self.active_connections[key].add(websocket)
        logger.info(f"✅ Connected: {key}")

    async def disconnect(self, entity_type: str, entity_id: int, websocket: WebSocket):
        """WebSocket 연결 해제"""
        key = f"{entity_type}:{entity_id}"
        if key in self.active_connections:
            self.active_connections[key].discard(websocket)
            if not self.active_connections[key]:
                del self.active_connections[key]
        logger.info(f"❌ Disconnected: {key}")

    async def broadcast_location(
        self,
        entity_type: str,
        entity_id: int,
        data: dict
    ):
        """해당 entity의 모든 연결에 위치 정보 브로드캐스트"""
        key = f"{entity_type}:{entity_id}"
        if key not in self.active_connections:
            return

        disconnected = set()
        for websocket in self.active_connections[key]:
            try:
                await websocket.send_json({
                    "type": "location_update",
                    "entity_type": entity_type,
                    "entity_id": entity_id,
                    "data": data,
                })
            except Exception as e:
                logger.error(f"❌ Error broadcasting to {key}: {e}")
                disconnected.add(websocket)

        for ws in disconnected:
            await self.disconnect(entity_type, entity_id, ws)

    async def broadcast_to_watchers(self, data: dict):
        """모든 시청자 (관리자)에게 브로드캐스트"""
        disconnected = set()
        for websocket in self.watchers.get("admin", set()):
            try:
                await websocket.send_json(data)
            except Exception as e:
                logger.error(f"❌ Error broadcasting to watchers: {e}")
                disconnected.add(websocket)

        for ws in disconnected:
            self.watchers["admin"].discard(ws)


# 전역 ConnectionManager 인스턴스
manager = ConnectionManager()
