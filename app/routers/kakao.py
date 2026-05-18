"""
카카오 API 통합 라우터
- 카카오톡/채널에서 오는 메시지 처리
- 예약/취소 키워드 감지 및 링크 제공
"""

import logging
from fastapi import APIRouter, Request, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/kakao", tags=["kakao"])


# ============================================================
# 데이터 모델
# ============================================================
class KakaoButton(BaseModel):
    """카카오 버튼"""
    title: str
    type: str = "WEB_URL"
    url: str


class KakaoResponse(BaseModel):
    """카카오 메시지 응답"""
    message: str
    buttons: Optional[List[KakaoButton]] = None

    class Config:
        json_schema_extra = {
            "example": {
                "message": "안녕하세요! 무엇을 도와드릴까요?",
                "buttons": [
                    {
                        "title": "📅 예약하기",
                        "type": "WEB_URL",
                        "url": "https://yoursite.com/booking"
                    }
                ]
            }
        }


class KakaoWebhookRequest(BaseModel):
    """카카오 웹훅 요청"""
    user_id: str
    content: str


# ============================================================
# 카카오 메시지 Webhook
# ============================================================
@router.post("/message")
async def kakao_message_webhook(request: Request):
    """
    카카오톡/채널에서 메시지 수신
    - 예약 키워드 감지 → 예약 페이지 링크
    - 취소 키워드 감지 → 취소 페이지 링크
    """
    try:
        data = await request.json()
        user_id = data.get("user_id", "unknown")
        content = data.get("content", "").lower()

        logger.info(f"📨 카카오 메시지 수신 | User: {user_id} | Content: {content}")

        # 기본 응답
        response_text = "안녕하세요! 무엇을 도와드릴까요?"
        buttons = []

        # 키워드 감지
        if "예약" in content:
            response_text = "📅 예약 페이지로 이동해주세요!"
            buttons.append(
                KakaoButton(
                    title="📅 예약하기",
                    type="WEB_URL",
                    url=f"https://yoursite.com/booking?user_id={user_id}"
                )
            )

        if "취소" in content:
            response_text = "❌ 예약 취소 페이지로 이동해주세요!"
            buttons.append(
                KakaoButton(
                    title="❌ 예약 취소",
                    type="WEB_URL",
                    url=f"https://yoursite.com/cancel?user_id={user_id}"
                )
            )

        # 버튼이 없으면 기본 메뉴 제공
        if not buttons:
            buttons = [
                KakaoButton(
                    title="📅 예약하기",
                    type="WEB_URL",
                    url=f"https://yoursite.com/booking?user_id={user_id}"
                ),
                KakaoButton(
                    title="❌ 예약 취소",
                    type="WEB_URL",
                    url=f"https://yoursite.com/cancel?user_id={user_id}"
                )
            ]

        response = KakaoResponse(message=response_text, buttons=buttons)

        logger.info(f"✅ 카카오 응답 발송 | Buttons: {len(buttons)}")

        return response.model_dump()

    except Exception as e:
        logger.error(f"❌ 카카오 메시지 처리 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="메시지 처리 실패"
        )


# ============================================================
# 카카오 인증 테스트
# ============================================================
@router.post("/verify")
async def kakao_verify(request: Request):
    """
    카카오 Developers에서 검증을 위해 호출하는 엔드포인트
    """
    try:
        data = await request.json()
        logger.info(f"🔐 카카오 검증 요청: {data}")
        return {"success": True}
    except Exception as e:
        logger.error(f"❌ 카카오 검증 실패: {str(e)}")
        return {"success": False, "error": str(e)}


# ============================================================
# 상태 확인
# ============================================================
@router.get("/health")
async def kakao_health():
    """카카오 API 상태 확인"""
    return {
        "status": "ok",
        "service": "kakao_integration",
        "endpoints": [
            "/kakao/message",
            "/kakao/verify",
            "/kakao/health"
        ]
    }
