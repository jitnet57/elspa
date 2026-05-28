"""
📌 Financial WebSocket Endpoints
📋 목적: 실시간 재무 데이터 동기화
🔧 포함: 연결, 메시지 처리, 브로드캐스트
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.services.websocket_manager import manager, FinancialMessageBuilder
import json
import asyncio
import logging

logger = logging.getLogger(__name__)

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/financial")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: str = Query(None, description="사용자 ID"),
    year: int = Query(2026, description="연도"),
    month: int = Query(5, description="월"),
):
    """
    금융 대시보드 WebSocket 연결

    클라이언트가 연결하면:
    1. 하트비트 매 30초마다 전송
    2. 지출/예산 변경 시 실시간 동기화
    3. 자동 재연결 지원
    """
    await manager.connect(websocket, user_id)

    try:
        # 연결 확인 메시지
        await manager.send_personal(
            websocket,
            {
                "type": "connected",
                "data": {
                    "message": "Financial dashboard connected",
                    "userId": user_id,
                    "year": year,
                    "month": month,
                    "activeConnections": manager.get_connection_count(),
                    "activeUsers": manager.get_user_count(),
                },
            },
        )

        # 하트비트 태스크
        async def send_heartbeat():
            while True:
                try:
                    await asyncio.sleep(30)  # 30초마다 하트비트
                    await manager.send_personal(websocket, FinancialMessageBuilder.heartbeat())
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
                    # 동기화 요청
                    sync_year = message.get("year", year)
                    sync_month = message.get("month", month)
                    await manager.send_personal(
                        websocket,
                        FinancialMessageBuilder.sync_request(sync_year, sync_month),
                    )

                elif message_type == "update_period":
                    # 기간 변경
                    year = message.get("year", year)
                    month = message.get("month", month)
                    await manager.send_personal(
                        websocket,
                        {
                            "type": "period_updated",
                            "data": {"year": year, "month": month},
                        },
                    )

                logger.info(f"📨 클라이언트 메시지 ({user_id}): {message_type}")

            except asyncio.TimeoutError:
                # 120초 동안 메시지가 없으면 연결 유지 중 체크
                pass
            except json.JSONDecodeError:
                logger.warning(f"⚠️ 잘못된 JSON 형식: {data}")
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


@router.post("/api/financial/ws/broadcast/expense")
async def broadcast_expense_change(
    change_type: str,  # 'added', 'updated', 'deleted'
    expense_id: int,
    category_id: int = None,
    amount: float = None,
    description: str = None,
):
    """
    지출 변경 브로드캐스트 (내부 API)

    사용: 지출 CRUD 후 이 엔드포인트 호출하여 모든 클라이언트에 알림
    """
    if change_type == "added":
        message = FinancialMessageBuilder.expense_added(expense_id, category_id, amount, description)
    elif change_type == "updated":
        message = FinancialMessageBuilder.expense_updated(expense_id, category_id, amount, description)
    elif change_type == "deleted":
        message = FinancialMessageBuilder.expense_deleted(expense_id)
    else:
        return {"error": "Unknown change_type"}

    await manager.broadcast(message)
    return {"status": "broadcasted", "connections": manager.get_connection_count()}


@router.post("/api/financial/ws/broadcast/budget")
async def broadcast_budget_change(
    year: int,
    month: int,
    expense_limit: float,
    target_revenue: float,
    is_exceeded: bool = False,
    actual_amount: float = None,
):
    """
    예산 변경 브로드캐스트 (내부 API)
    """
    if is_exceeded and actual_amount:
        message = FinancialMessageBuilder.budget_exceeded(year, month, actual_amount, expense_limit)
    else:
        message = FinancialMessageBuilder.budget_changed(year, month, expense_limit, target_revenue)

    await manager.broadcast(message)
    return {"status": "broadcasted", "connections": manager.get_connection_count()}


@router.get("/api/financial/ws/status")
async def websocket_status():
    """WebSocket 연결 상태"""
    return {
        "active_connections": manager.get_connection_count(),
        "active_users": manager.get_user_count(),
        "status": "🟢 Ready" if manager.get_connection_count() > 0 else "🟡 No active connections",
    }
