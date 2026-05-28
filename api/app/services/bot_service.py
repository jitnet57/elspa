"""
통합 메신저봇 서비스 (Kakao Talk + WhatsApp)
- 자동 언어 감지 (한국어/영어)
- Intent 분석
- FAQ 조회
- 예약/취소 처리
- 채팅 히스토리 저장
"""

import json
import re
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.models import Chat, Booking, Service, Customer
from anthropic import Anthropic

logger = logging.getLogger(__name__)


class BotService:
    """메신저봇 통합 서비스"""

    # 다국어 FAQ 데이터
    FAQ_DATA = {
        "ko": {
            "location": "📍 주소: 서울시 강남구\n🗺️ Google Maps: https://maps.google.com/?q=elspa",
            "hours": "⏰ 영업시간: 월-일 10:00 AM - 10:00 PM\n🔔 예약: 24시간 가능",
            "phone": "📞 전화: +82-10-1234-5678\n💬 카톡/WhatsApp: 이 채팅창으로 문의",
            "services": """💆 마사지 종류:
1️⃣ Swedish 60분 - $80
2️⃣ Thai Massage 90분 - $120
3️⃣ Hot Stone 60분 - $100
4️⃣ Foot Massage 30분 - $50
5️⃣ Aromatherapy 45분 - $70
6️⃣ 종합 90분 - $140""",
            "prices": """💰 가격 안내:
• Swedish 60분: $80
• Thai Massage 90분: $120
• Hot Stone 60분: $100
• Foot Massage 30분: $50
• Aromatherapy 45분: $70
• 종합 90분: $140"""
        },
        "en": {
            "location": "📍 Address: Seoul, Korea\n🗺️ Google Maps: https://maps.google.com/?q=elspa",
            "hours": "⏰ Hours: Mon-Sun 10:00 AM - 10:00 PM\n🔔 Booking: Available 24/7",
            "phone": "📞 Phone: +82-10-1234-5678\n💬 Chat: Use this message window",
            "services": """💆 Service Types:
1️⃣ Swedish 60min - $80
2️⃣ Thai Massage 90min - $120
3️⃣ Hot Stone 60min - $100
4️⃣ Foot Massage 30min - $50
5️⃣ Aromatherapy 45min - $70
6️⃣ Full Body 90min - $140""",
            "prices": """💰 Pricing:
• Swedish 60min: $80
• Thai Massage 90min: $120
• Hot Stone 60min: $100
• Foot Massage 30min: $50
• Aromatherapy 45min: $70
• Full Body 90min: $140"""
        }
    }

    # 키워드 → Intent 매핑 (다국어)
    INTENT_KEYWORDS = {
        "book": {
            "ko": ["예약", "예약하고", "신청", "부탁", "원해"],
            "en": ["book", "reserve", "booking", "appointment", "schedule"]
        },
        "cancel": {
            "ko": ["취소", "취소하고", "예약 취소", "예약 문제"],
            "en": ["cancel", "cancellation", "cancel booking", "remove"]
        },
        "price": {
            "ko": ["가격", "얼마", "비용", "요금", "돈"],
            "en": ["price", "cost", "how much", "charge", "fee"]
        },
        "location": {
            "ko": ["위치", "어디", "주소", "가는길", "오는길"],
            "en": ["location", "address", "where", "map", "direction"]
        },
        "phone": {
            "ko": ["전화", "번호", "연락", "전화번호"],
            "en": ["phone", "call", "contact", "number", "telephone"]
        },
        "hours": {
            "ko": ["시간", "영업", "언제", "열려", "닫혀", "하루"],
            "en": ["hours", "open", "time", "when", "available"]
        },
        "services": {
            "ko": ["종류", "뭐", "서비스", "마사지", "무엇"],
            "en": ["service", "type", "what", "massage", "offer"]
        }
    }

    def __init__(self):
        self.client = Anthropic(api_key=settings.anthropic_api_key)

    async def detect_language(self, message: str) -> str:
        """한국어/영어 자동 감지"""
        korean_chars = len(re.findall(r'[가-힣]', message))
        english_chars = len(re.findall(r'[a-zA-Z]', message))

        if korean_chars > english_chars:
            return "ko"
        return "en"

    async def detect_intent(self, message: str) -> str:
        """사용자 의도 분석 (예약/취소/가격 등)"""
        message_lower = message.lower()
        lang = await self.detect_language(message)

        # 키워드 기반 Intent 감지
        for intent, keywords in self.INTENT_KEYWORDS.items():
            for keyword in keywords.get(lang, []):
                if keyword in message_lower:
                    return intent

        # 명확한 키워드가 없으면 Claude API로 분석
        try:
            response = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=50,
                messages=[{
                    "role": "user",
                    "content": f"""Classify this message intent into ONE category:
                    - book (예약)
                    - cancel (취소)
                    - price (가격)
                    - location (위치)
                    - phone (전화)
                    - hours (영업시간)
                    - services (서비스종류)
                    - other (기타)

Message: "{message}"
Response: just the intent word"""
                }]
            )
            intent = response.content[0].text.strip().lower()
            valid_intents = ["book", "cancel", "price", "location", "phone", "hours", "services", "other"]
            return intent if intent in valid_intents else "other"
        except Exception as e:
            logger.error(f"Claude intent detection failed: {e}")
            return "other"

    async def handle_message(
        self,
        channel: str,
        user_id: str,
        user_phone: str,
        message: str,
        db: AsyncSession
    ) -> str:
        """메시지 처리 및 응답 생성"""
        try:
            lang = await self.detect_language(message)
            intent = await self.detect_intent(message)

            # Intent별 응답 생성
            if intent == "book":
                response = await self._handle_booking(user_id, lang, db)
            elif intent == "cancel":
                response = await self._handle_cancel(user_phone, lang, db)
            elif intent in ["price", "location", "phone", "hours", "services"]:
                response = self.FAQ_DATA[lang].get(intent, "정보를 찾을 수 없습니다.")
            else:
                response = await self._generate_fallback_response(message, lang)

            # 채팅 히스토리 저장
            await self._save_chat(
                channel=channel,
                user_id=user_id,
                message=message,
                response=response,
                intent=intent,
                lang=lang,
                db=db
            )

            return response

        except Exception as e:
            logger.error(f"Bot message handling error: {e}")
            lang = await self.detect_language(message)
            error_msg = "죄송합니다. 처리 중 오류가 발생했습니다." if lang == "ko" else "Sorry, an error occurred."
            return error_msg

    async def _handle_booking(self, user_id: str, lang: str, db: AsyncSession) -> str:
        """예약 처리"""
        prompt = """안녕하세요! 어떤 서비스를 원하세요?

1. Swedish 60분 - $80
2. Thai Massage 90분 - $120
3. Hot Stone 60분 - $100
4. Foot Massage 30분 - $50
5. Aromatherapy 45분 - $70
6. 종합 90분 - $140

[바로 예약하기] → """ + settings.shop_url if lang == "ko" else """Hi! Which service would you like?

1. Swedish 60min - $80
2. Thai Massage 90min - $120
3. Hot Stone 60min - $100
4. Foot Massage 30min - $50
5. Aromatherapy 45min - $70
6. Full Body 90min - $140

[Book Now] → """ + settings.shop_url

        return prompt

    async def _handle_cancel(self, user_phone: str, lang: str, db: AsyncSession) -> str:
        """취소 처리"""
        # 전화번호로 고객 조회
        customer_stmt = select(Customer).where(Customer.phone == user_phone)
        customer_result = await db.execute(customer_stmt)
        customer = customer_result.scalars().first()

        if not customer:
            return ("먼저 고객정보를 등록해주세요." if lang == "ko" else "Please register your phone number first.") + "\n" + ("새로 예약하시겠어요?" if lang == "ko" else "Would you like to make a new booking?")

        # 사용자의 기존 예약 조회
        booking_stmt = select(Booking).where(
            Booking.customer_id == customer.id,
            Booking.status.in_(["confirmed", "pending"])
        ).order_by(Booking.booking_date.desc())
        booking_result = await db.execute(booking_stmt)
        bookings = booking_result.scalars().all()

        if not bookings:
            return ("취소할 예약이 없습니다." if lang == "ko" else "No active bookings found.") + "\n" + ("새로 예약하시겠어요?" if lang == "ko" else "Would you like to make a new booking?")

        # 최근 3개 예약 표시
        booking_list = ""
        for i, b in enumerate(bookings[:3], 1):
            booking_list += f"{i}. {b.booking_date} {b.booking_time}\n"

        prompt = ("어떤 예약을 취소하시겠어요?" if lang == "ko" else "Which booking would you like to cancel?") + "\n\n" + booking_list
        return prompt

    async def _generate_fallback_response(self, message: str, lang: str) -> str:
        """Claude API를 통한 일반 응답"""
        try:
            response = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=200,
                system="""You are a helpful massage shop chatbot assistant.
                Answer briefly in the same language as the user.
                Keep responses under 100 words.
                If you don't know the answer, suggest they call or visit our booking page.""",
                messages=[{"role": "user", "content": message}]
            )
            return response.content[0].text
        except Exception as e:
            logger.error(f"Claude fallback response failed: {e}")
            return ("무엇을 도와드릴까요?" if lang == "ko" else "How can I help you?")

    async def _save_chat(
        self,
        channel: str,
        user_id: str,
        message: str,
        response: str,
        intent: str,
        lang: str,
        db: AsyncSession
    ) -> None:
        """채팅 히스토리 데이터베이스 저장"""
        try:
            # 사용자 메시지 저장
            chat_user = Chat(
                user_id=user_id,
                channel=channel,
                message=message,
                sender="customer",
                intent=intent,
                language=lang,
                status="received",
                extra_data={"timestamp": datetime.utcnow().isoformat()}
            )
            db.add(chat_user)

            # 봇 응답 저장
            chat_bot = Chat(
                user_id=user_id,
                channel=channel,
                message=response,
                sender="bot",
                ai_response=response,
                intent=intent,
                language=lang,
                status="processed",
                extra_data={"timestamp": datetime.utcnow().isoformat()}
            )
            db.add(chat_bot)

            await db.commit()
        except Exception as e:
            logger.error(f"Failed to save chat history: {e}")
            await db.rollback()


# 싱글톤 인스턴스
bot_service = BotService()
