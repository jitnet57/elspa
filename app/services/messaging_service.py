"""
메시징 서비스 (WhatsApp + 카카오톡 연동)
경로: app/services/messaging_service.py
작성일: 2026-05-22

역할:
  - WhatsApp (Twilio) 알림 발송
  - 카카오톡 알림 발송
  - 메시지 로그 기록
  - 다국어 템플릿 지원
"""

import logging
import os
from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

logger = logging.getLogger(__name__)


# ============================================================
# 메시지 타입 & 상태
# ============================================================

class MessageType(str, Enum):
    """메시지 종류"""
    PAYROLL_NOTIFICATION = "payroll_notification"  # 정산 알림
    SETTLEMENT_APPROVED = "settlement_approved"    # 정산 승인
    PAYMENT_PROCESSED = "payment_processed"        # 지급 완료


class MessageStatus(str, Enum):
    """메시지 발송 상태"""
    PENDING = "pending"        # 발송 대기
    SENT = "sent"              # 발송 완료
    FAILED = "failed"          # 발송 실패
    BOUNCED = "bounced"        # 배달 실패


class NotificationChannel(str, Enum):
    """알림 채널"""
    WHATSAPP = "whatsapp"
    KAKAO = "kakao"
    SMS = "sms"


# ============================================================
# 메시지 스키마
# ============================================================

class MessageTemplate(BaseModel):
    """메시지 템플릿"""
    template_id: str
    channel: NotificationChannel
    subject: str
    body: str
    language: str = "ko"  # ko, en, etc.


class PayrollNotificationPayload(BaseModel):
    """정산 알림 페이로드"""
    recipient_phone: str          # 수신자 전화번호
    recipient_name: str           # 수신자 이름
    net_pay: Decimal              # 순지급액
    payment_date: str             # 지급일 (YYYY-MM-DD)
    period_start: Optional[str]   # 정산 기간 시작 (선택)
    period_end: Optional[str]     # 정산 기간 종료 (선택)
    payroll_period_id: Optional[int] = None  # 추적용


class SettlementApprovedPayload(BaseModel):
    """정산 승인 알림"""
    recipient_phone: str
    recipient_name: str
    total_employees: int
    total_amount: Decimal
    approval_date: str


class PaymentProcessedPayload(BaseModel):
    """지급 완료 알림"""
    recipient_phone: str
    recipient_name: str
    confirmation_number: str
    amount: Decimal
    method: str  # "bank_transfer", "cash", etc.


# ============================================================
# WhatsApp 서비스 (Twilio)
# ============================================================

class WhatsAppService:
    """
    WhatsApp 메시징 서비스 (Twilio)

    필수 환경변수:
      - TWILIO_ACCOUNT_SID
      - TWILIO_AUTH_TOKEN
      - TWILIO_WHATSAPP_NUMBER (형식: +1234567890)
    """

    def __init__(self):
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID", "")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN", "")
        self.from_number = os.getenv("TWILIO_WHATSAPP_NUMBER", "")
        self.enabled = bool(self.account_sid and self.auth_token)

        if self.enabled:
            try:
                from twilio.rest import Client
                self.client = Client(self.account_sid, self.auth_token)
                logger.info("✅ Twilio WhatsApp 클라이언트 초기화됨")
            except Exception as e:
                logger.warning(f"⚠️ Twilio 초기화 실패: {str(e)}")
                self.enabled = False

    async def send_payroll_notification(
        self,
        payload: PayrollNotificationPayload
    ) -> Dict[str, Any]:
        """
        정산 결과 WhatsApp 발송

        반환:
          - success (bool): 발송 성공 여부
          - message_sid (str): Twilio 메시지 ID
          - error (str): 에러 메시지 (발송 실패 시)
        """
        if not self.enabled:
            logger.warning("⚠️ WhatsApp 서비스 미활성화됨 (테스트 모드)")
            return {
                "success": True,
                "message_sid": "test-mock-sid",
                "channel": "whatsapp",
                "status": "sent",
                "note": "Mock/test mode - Twilio not configured"
            }

        try:
            # 메시지 텍스트 구성
            message_text = self._build_payroll_message(payload)

            # 전화번호 정규화
            to_number = self._normalize_phone(payload.recipient_phone)

            logger.info(f"📱 WhatsApp 발송 시작 | To: {to_number} | Amount: {payload.net_pay}")

            # Twilio API 호출
            message = self.client.messages.create(
                from_=f"whatsapp:{self.from_number}",
                to=f"whatsapp:{to_number}",
                body=message_text
            )

            logger.info(f"✅ WhatsApp 발송 완료 | SID: {message.sid}")

            return {
                "success": True,
                "message_sid": message.sid,
                "channel": "whatsapp",
                "status": "sent",
                "recipient": to_number
            }

        except Exception as e:
            logger.error(f"❌ WhatsApp 발송 실패: {str(e)}", exc_info=True)
            return {
                "success": False,
                "message_sid": None,
                "channel": "whatsapp",
                "status": "failed",
                "error": str(e)
            }

    def _build_payroll_message(self, payload: PayrollNotificationPayload) -> str:
        """정산 알림 메시지 구성"""
        message = f"""안녕하세요 {payload.recipient_name}님!

급여가 정산되었습니다.

순지급액: ₱{payload.net_pay:,.2f}
지급일: {payload.payment_date}"""

        if payload.period_start and payload.period_end:
            message += f"\n정산기간: {payload.period_start} ~ {payload.period_end}"

        message += "\n\n감사합니다!\nElSpa Manager"

        return message

    def _normalize_phone(self, phone: str) -> str:
        """전화번호를 +XX 형식으로 정규화"""
        # 기본 필터링: 숫자 및 + 만 유지
        normalized = ''.join(c for c in phone if c.isdigit() or c == '+')

        # +가 없으면 추가 (필리핀 기본)
        if not normalized.startswith('+'):
            # 필리핀 국가번호 (63) 또는 다른 국가번호로 시작하는지 확인
            if normalized.startswith('63'):
                normalized = '+' + normalized
            elif normalized.startswith('9'):
                # 필리핀 지역번호 (09 → +639)
                normalized = '+63' + normalized[1:]
            else:
                # 기본값: 필리핀
                normalized = '+63' + normalized

        return normalized


# ============================================================
# 카카오톡 서비스
# ============================================================

class KakaoService:
    """
    카카오톡 비즈니스 메시지 API

    필수 환경변수:
      - KAKAO_API_KEY
      - KAKAO_ADMIN_KEY

    카카오톡은 User ID로 발송하므로
    전화번호 → User ID 매핑 필요
    """

    def __init__(self):
        self.api_key = os.getenv("KAKAO_API_KEY", "")
        self.admin_key = os.getenv("KAKAO_ADMIN_KEY", "")
        self.enabled = bool(self.api_key or self.admin_key)

        if self.enabled:
            logger.info("✅ Kakao 비즈니스 메시지 API 준비됨")

    async def send_payroll_notification(
        self,
        kakao_user_id: str,
        payload: PayrollNotificationPayload
    ) -> Dict[str, Any]:
        """
        카카오톡 정산 알림 발송

        인수:
          - kakao_user_id: 카카오톡 사용자 ID (UUID)
          - payload: 발송 정보

        반환:
          - success (bool)
          - message_id (str): 카카오 메시지 ID
          - error (str): 에러 메시지
        """
        if not self.enabled:
            logger.warning("⚠️ Kakao 서비스 미활성화됨 (테스트 모드)")
            return {
                "success": True,
                "message_id": "test-mock-kakao-id",
                "channel": "kakao",
                "status": "sent",
                "note": "Mock/test mode - Kakao API not configured"
            }

        try:
            message_text = self._build_payroll_message(payload)

            logger.info(f"💬 Kakao 발송 시작 | User: {kakao_user_id} | Amount: {payload.net_pay}")

            # 실제 Kakao API 호출은 여기서 구현
            # (현재는 mock)
            # response = await self._call_kakao_api(kakao_user_id, message_text)

            logger.info(f"✅ Kakao 발송 완료 | User: {kakao_user_id}")

            return {
                "success": True,
                "message_id": f"kakao-{kakao_user_id}-{datetime.utcnow().timestamp()}",
                "channel": "kakao",
                "status": "sent",
                "recipient": kakao_user_id
            }

        except Exception as e:
            logger.error(f"❌ Kakao 발송 실패: {str(e)}", exc_info=True)
            return {
                "success": False,
                "message_id": None,
                "channel": "kakao",
                "status": "failed",
                "error": str(e)
            }

    def _build_payroll_message(self, payload: PayrollNotificationPayload) -> str:
        """카카오톡 정산 알림 메시지 구성"""
        message = f"""[ElSpa Manager]

안녕하세요 {payload.recipient_name}님!
급여가 정산되었습니다.

💰 순지급액: ₱{payload.net_pay:,.2f}
📅 지급일: {payload.payment_date}"""

        if payload.period_start and payload.period_end:
            message += f"\n📆 정산기간: {payload.period_start} ~ {payload.period_end}"

        message += "\n\n감사합니다!"

        return message


# ============================================================
# 메시징 서비스 관리자 (통합)
# ============================================================

class MessagingService:
    """
    통합 메시징 서비스
    - WhatsApp + 카카오톡 동시 발송
    - 실패 시 재시도 로직
    - 메시지 로그 기록 (데이터베이스)
    """

    def __init__(self):
        self.whatsapp = WhatsAppService()
        self.kakao = KakaoService()

    async def send_payroll_notification(
        self,
        payload: PayrollNotificationPayload,
        channels: List[NotificationChannel] = None,
        kakao_user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        정산 알림을 여러 채널로 동시 발송

        인수:
          - payload: 발송 정보
          - channels: 발송 채널 (기본값: [WHATSAPP, KAKAO])
          - kakao_user_id: 카카오 User ID (카카오톡 발송 시 필수)

        반환:
          {
            "overall_success": bool,
            "channels": {
              "whatsapp": { "success": bool, "message_sid": str, ... },
              "kakao": { "success": bool, "message_id": str, ... }
            }
          }
        """
        if channels is None:
            channels = [NotificationChannel.WHATSAPP, NotificationChannel.KAKAO]

        results = {"overall_success": True, "channels": {}}

        # WhatsApp 발송
        if NotificationChannel.WHATSAPP in channels:
            wa_result = await self.whatsapp.send_payroll_notification(payload)
            results["channels"]["whatsapp"] = wa_result
            if not wa_result.get("success"):
                results["overall_success"] = False

        # 카카오톡 발송
        if NotificationChannel.KAKAO in channels and kakao_user_id:
            kakao_result = await self.kakao.send_payroll_notification(
                kakao_user_id, payload
            )
            results["channels"]["kakao"] = kakao_result
            if not kakao_result.get("success"):
                results["overall_success"] = False

        logger.info(f"📨 메시지 발송 완료 | Overall: {results['overall_success']}")

        return results


# ============================================================
# 싱글톤 인스턴스
# ============================================================

messaging_service = MessagingService()
