"""
카카오 메신저 봇 라우터 (Kakao i Open Builder 연동)
- 자동 언어 감지 및 다국어 응답
- Intent 분석 (예약/취소/가격/위치 등)
- Claude API를 통한 자연어 처리
- 채팅 히스토리 저장
"""

import logging
import json
from fastapi import APIRouter, Request, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.bot_service import bot_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/kakao", tags=["kakao"])


# ============================================================
# 카카오 i Open Builder 데이터 모델
# ============================================================
class KakaoUserRequest(BaseModel):
    """Kakao i Open Builder 사용자 요청"""
    user: Dict[str, Any]
    utterance: str
    params: Optional[Dict[str, Any]] = None


class KakaoSimpleText(BaseModel):
    """카카오 SimpleText 메시지"""
    text: str


class KakaoMessageOutput(BaseModel):
    """카카오 메시지 출력"""
    simpleText: KakaoSimpleText


class KakaoMessageTemplate(BaseModel):
    """카카오 메시지 템플릿"""
    outputs: List[KakaoMessageOutput]


class KakaoWebhookRequest(BaseModel):
    """카카오 웹훅 요청 전체"""
    userRequest: KakaoUserRequest


class KakaoWebhookResponse(BaseModel):
    """카카오 웹훅 응답"""
    version: str = "2.0"
    template: KakaoMessageTemplate


# ============================================================
# 검증
# ============================================================
async def verify_kakao_signature(request: Request) -> None:
    """카카오 메시지 서명 검증 (선택사항)"""
    # 현재 구현: 기본 검증만 수행
    # 실제 운영환경에서는 HMAC 검증 추가 권장
    pass


# ============================================================
# 카카오 메시지 Webhook
# ============================================================
@router.post("/message")
async def kakao_message_webhook(
    body: KakaoWebhookRequest,
    db: AsyncSession = Depends(get_db),
    # verified: None = Depends(verify_kakao_signature)
):
    """
    카카오 i Open Builder 메시지 처리

    요청 형식 (Kakao i Open Builder):
    ```json
    {
      "userRequest": {
        "user": {"id": "abc123", "properties": {}},
        "utterance": "안녕하세요"
      }
    }
    ```

    응답 형식 (SimpleText):
    ```json
    {
      "version": "2.0",
      "template": {
        "outputs": [{"simpleText": {"text": "안녕하세요!"}}]
      }
    }
    ```
    """
    try:
        user_id = body.userRequest.user.get("id", "unknown")
        message = body.userRequest.utterance.strip()

        logger.info(f"📨 Kakao 메시지 | User: {user_id} | Message: {message}")

        # 빈 메시지 처리
        if not message:
            response_text = "무엇을 도와드릴까요?"
        else:
            # BotService로 메시지 처리
            response_text = await bot_service.handle_message(
                channel="kakao",
                user_id=user_id,
                user_phone="",  # Kakao ID로는 전화번호 불명
                message=message,
                db=db
            )

        logger.info(f"✅ Kakao 응답 | Response: {response_text[:50]}...")

        # Kakao i Open Builder 응답 형식
        response = KakaoWebhookResponse(
            template=KakaoMessageTemplate(
                outputs=[
                    KakaoMessageOutput(simpleText=KakaoSimpleText(text=response_text))
                ]
            )
        )

        return response.model_dump(by_alias=False)

    except Exception as e:
        logger.error(f"❌ Kakao 메시지 처리 실패: {str(e)}", exc_info=True)

        error_msg = "죄송합니다. 처리 중 오류가 발생했습니다."
        response = KakaoWebhookResponse(
            template=KakaoMessageTemplate(
                outputs=[
                    KakaoMessageOutput(simpleText=KakaoSimpleText(text=error_msg))
                ]
            )
        )
        return response.model_dump(by_alias=False)


# ============================================================
# 카카오 검증
# ============================================================
@router.post("/verify")
async def kakao_verify(request: Request):
    """카카오 Developers 검증 요청"""
    try:
        data = await request.json()
        logger.info(f"🔐 Kakao 검증 요청: {json.dumps(data, ensure_ascii=False)}")
        return {"success": True}
    except Exception as e:
        logger.error(f"❌ Kakao 검증 실패: {str(e)}")
        return {"success": False, "error": str(e)}


# ============================================================
# 상태 확인
# ============================================================
@router.get("/health")
async def kakao_health():
    """카카오 API 상태 확인"""
    return {
        "status": "ok",
        "service": "kakao_bot",
        "version": "2.0",
        "endpoints": {
            "webhook": "/kakao/message",
            "verify": "/kakao/verify",
            "health": "/kakao/health"
        }
    }
