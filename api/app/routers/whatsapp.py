"""
WhatsApp Business API 봇 라우터 (Meta Cloud API)
- 자동 언어 감지 및 다국어 응답
- Intent 분석 (예약/취소/가격/위치 등)
- Claude API를 통한 자연어 처리
- 채팅 히스토리 저장
"""

import logging
import json
import httpx
from fastapi import APIRouter, Request, Query, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.services.bot_service import bot_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])


# ============================================================
# WhatsApp Meta API 데이터 모델
# ============================================================
class WhatsAppMessage(BaseModel):
    """WhatsApp 메시지"""
    from_phone: str
    message_id: str
    message_text: str
    timestamp: int


class WhatsAppWebhookPayload(BaseModel):
    """WhatsApp 웹훅 페이로드 (Meta Cloud API)"""
    object: str
    entry: List[Dict[str, Any]]


# ============================================================
# 유틸리티 함수
# ============================================================
async def send_whatsapp_message(
    to_phone: str,
    message_text: str,
    message_type: str = "text"
) -> bool:
    """
    WhatsApp 메시지 발송 (Meta Cloud API)

    Args:
        to_phone: 수신자 전화번호 (형식: 1234567890, 국가코드 포함)
        message_text: 메시지 텍스트
        message_type: 메시지 타입 (text/template/interactive)

    Returns:
        발송 성공 여부
    """
    if not settings.whatsapp_token or not settings.whatsapp_phone_number_id:
        logger.error("WhatsApp configuration missing")
        return False

    url = f"https://graph.facebook.com/v18.0/{settings.whatsapp_phone_number_id}/messages"
    headers = {
        "Authorization": f"Bearer {settings.whatsapp_token}",
        "Content-Type": "application/json"
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": to_phone,
        "type": message_type,
        "text": {"body": message_text} if message_type == "text" else None
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(url, json=payload, headers=headers)
            if response.status_code == 200:
                logger.info(f"✅ WhatsApp 메시지 발송 | To: {to_phone}")
                return True
            else:
                logger.error(f"❌ WhatsApp 발송 실패 | Status: {response.status_code} | Body: {response.text}")
                return False
    except Exception as e:
        logger.error(f"❌ WhatsApp 발송 에러: {str(e)}")
        return False


# ============================================================
# WhatsApp 웹훅 검증
# ============================================================
@router.get("/webhook")
async def verify_whatsapp_webhook(
    hub_mode: str = Query(alias="hub.mode", default=None),
    hub_verify_token: str = Query(alias="hub.verify_token", default=None),
    hub_challenge: str = Query(alias="hub.challenge", default=None)
):
    """
    Meta 웹훅 검증 (초기 설정 시 호출됨)

    Meta에서 이 엔드포인트를 GET으로 호출하면서:
    - hub.mode = "subscribe"
    - hub.verify_token = 우리가 설정한 토큰
    - hub.challenge = 랜덤 문자열

    우리는 hub.challenge를 그대로 반환하면 됨
    """
    if hub_mode != "subscribe":
        raise HTTPException(status_code=400, detail="Invalid hub.mode")

    if hub_verify_token != settings.whatsapp_verify_token:
        logger.warning(f"🔐 WhatsApp 검증 토큰 불일치 | Received: {hub_verify_token}")
        raise HTTPException(status_code=403, detail="Invalid verify token")

    logger.info("✅ WhatsApp 웹훅 검증 성공")
    return hub_challenge


# ============================================================
# WhatsApp 메시지 수신
# ============================================================
@router.post("/webhook")
async def receive_whatsapp_message(
    body: WhatsAppWebhookPayload,
    db: AsyncSession = Depends(get_db)
):
    """
    WhatsApp 메시지 수신 (Meta Cloud API webhook)

    Meta에서 POST로 메시지를 보내면:
    1. 메시지 파싱
    2. BotService로 처리
    3. 응답 메시지 발송
    """
    try:
        logger.info(f"📨 WhatsApp 웹훅 수신 | Body: {json.dumps(body.model_dump(), ensure_ascii=False)}")

        for entry in body.entry:
            for change in entry.get("changes", []):
                value = change.get("value", {})
                messages = value.get("messages", [])
                contacts = value.get("contacts", [])
                status_updates = value.get("statuses", [])

                # 메시지 처리
                for msg in messages:
                    from_phone = msg.get("from")
                    message_id = msg.get("id")
                    message_type = msg.get("type")  # text, image, audio, button, etc.

                    if message_type == "text":
                        message_text = msg.get("text", {}).get("body", "")
                    else:
                        message_text = f"[{message_type.upper()} 메시지]"

                    logger.info(f"📨 메시지 | From: {from_phone} | Type: {message_type} | Text: {message_text}")

                    if not from_phone or not message_text:
                        continue

                    # BotService로 메시지 처리
                    response_text = await bot_service.handle_message(
                        channel="whatsapp",
                        user_id=from_phone,
                        user_phone=from_phone,
                        message=message_text,
                        db=db
                    )

                    # 응답 발송
                    await send_whatsapp_message(
                        to_phone=from_phone,
                        message_text=response_text,
                        message_type="text"
                    )

                # 상태 업데이트 처리 (선택사항)
                for status in status_updates:
                    status_id = status.get("id")
                    status_value = status.get("status")  # delivered, read, failed
                    logger.info(f"📦 메시지 상태 업데이트 | ID: {status_id} | Status: {status_value}")

        return {"status": "ok"}

    except Exception as e:
        logger.error(f"❌ WhatsApp 메시지 처리 실패: {str(e)}", exc_info=True)
        return {"status": "error", "message": str(e)}


# ============================================================
# 상태 확인
# ============================================================
@router.get("/health")
async def whatsapp_health():
    """WhatsApp 봇 상태 확인"""
    token_configured = bool(settings.whatsapp_token)
    phone_id_configured = bool(settings.whatsapp_phone_number_id)

    return {
        "status": "ok",
        "service": "whatsapp_bot",
        "configuration": {
            "token_configured": token_configured,
            "phone_number_id_configured": phone_id_configured,
            "ready": token_configured and phone_id_configured
        },
        "endpoints": {
            "webhook_get": "/whatsapp/webhook (GET for Meta verification)",
            "webhook_post": "/whatsapp/webhook (POST for message receiving)",
            "health": "/whatsapp/health"
        }
    }
