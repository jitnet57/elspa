"""
메시징 서비스 테스트
경로: tests/test_messaging.py
작성일: 2026-05-22

테스트 항목:
  1. WhatsApp 메시지 구성
  2. 카카오톡 메시지 구성
  3. 전화번호 정규화
  4. 메시지 로그 저장
  5. 발송 상태 추적
"""

import pytest
from decimal import Decimal
from datetime import date, datetime
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.services.messaging_service import (
    WhatsAppService, KakaoService, MessagingService,
    PayrollNotificationPayload, NotificationChannel
)
from app.models.payroll import (
    MessageLog, PayrollRecord, PayrollPeriod, Employee, Base,
    EmployeeType, PayGroup
)


# ============================================================
# 테스트 설정
# ============================================================

@pytest.fixture
async def test_db() -> AsyncGenerator[AsyncSession, None]:
    """테스트 데이터베이스 세션"""
    # 임시 SQLite 데이터베이스 생성
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        yield session

    await engine.dispose()


# ============================================================
# WhatsApp 서비스 테스트
# ============================================================

class TestWhatsAppService:
    """WhatsApp 메시지 서비스 테스트"""

    def test_whatsapp_message_formatting(self):
        """WhatsApp 메시지 형식 테스트"""
        service = WhatsAppService()

        payload = PayrollNotificationPayload(
            recipient_phone="09171234567",
            recipient_name="김철수",
            net_pay=Decimal("5000.00"),
            payment_date="2026-05-22",
            period_start="2026-05-01",
            period_end="2026-05-15"
        )

        message = service._build_payroll_message(payload)

        assert "김철수" in message
        assert "₱5,000.00" in message
        assert "2026-05-22" in message
        assert "2026-05-01 ~ 2026-05-15" in message
        assert "ElSpa Manager" in message

    def test_phone_number_normalization(self):
        """전화번호 정규화 테스트"""
        service = WhatsAppService()

        test_cases = [
            ("09171234567", "+639171234567"),      # 09 → +639
            ("639171234567", "+639171234567"),     # 63 → +63
            ("+639171234567", "+639171234567"),    # 이미 정규화됨
            ("9171234567", "+639171234567"),       # 9 → +639
        ]

        for input_phone, expected in test_cases:
            result = service._normalize_phone(input_phone)
            assert result == expected, f"Expected {expected}, got {result} for {input_phone}"

    @pytest.mark.asyncio
    async def test_whatsapp_send_mock(self):
        """WhatsApp Mock 발송 테스트"""
        service = WhatsAppService()

        payload = PayrollNotificationPayload(
            recipient_phone="09171234567",
            recipient_name="테스트 직원",
            net_pay=Decimal("15000.00"),
            payment_date="2026-05-22"
        )

        result = await service.send_payroll_notification(payload)

        assert result["success"] is True
        assert result["channel"] == "whatsapp"
        assert "message_sid" in result


# ============================================================
# 카카오톡 서비스 테스트
# ============================================================

class TestKakaoService:
    """카카오톡 메시지 서비스 테스트"""

    def test_kakao_message_formatting(self):
        """카카오톡 메시지 형식 테스트"""
        service = KakaoService()

        payload = PayrollNotificationPayload(
            recipient_phone="09171234567",
            recipient_name="이영희",
            net_pay=Decimal("8000.00"),
            payment_date="2026-05-22"
        )

        message = service._build_payroll_message(payload)

        assert "이영희" in message
        assert "₱8,000.00" in message
        assert "2026-05-22" in message
        assert "[ElSpa Manager]" in message

    @pytest.mark.asyncio
    async def test_kakao_send_mock(self):
        """Kakao Mock 발송 테스트"""
        service = KakaoService()

        payload = PayrollNotificationPayload(
            recipient_phone="09171234567",
            recipient_name="테스트 직원",
            net_pay=Decimal("12000.00"),
            payment_date="2026-05-22"
        )

        result = await service.send_payroll_notification("kakao-user-id-123", payload)

        assert result["success"] is True
        assert result["channel"] == "kakao"
        assert "message_id" in result


# ============================================================
# 통합 메시징 서비스 테스트
# ============================================================

class TestMessagingService:
    """통합 메시징 서비스 테스트"""

    @pytest.mark.asyncio
    async def test_send_multiple_channels(self):
        """여러 채널 동시 발송 테스트"""
        service = MessagingService()

        payload = PayrollNotificationPayload(
            recipient_phone="09171234567",
            recipient_name="박민수",
            net_pay=Decimal("10000.00"),
            payment_date="2026-05-22"
        )

        result = await service.send_payroll_notification(
            payload,
            channels=[NotificationChannel.WHATSAPP, NotificationChannel.KAKAO],
            kakao_user_id="kakao-user-123"
        )

        assert result["overall_success"] is True
        assert "whatsapp" in result["channels"]
        assert "kakao" in result["channels"]
        assert result["channels"]["whatsapp"]["success"] is True
        assert result["channels"]["kakao"]["success"] is True

    @pytest.mark.asyncio
    async def test_single_channel(self):
        """단일 채널 발송 테스트"""
        service = MessagingService()

        payload = PayrollNotificationPayload(
            recipient_phone="09171234567",
            recipient_name="정수현",
            net_pay=Decimal("20000.00"),
            payment_date="2026-05-22"
        )

        result = await service.send_payroll_notification(
            payload,
            channels=[NotificationChannel.WHATSAPP]
        )

        assert result["overall_success"] is True
        assert "whatsapp" in result["channels"]
        assert result["channels"]["whatsapp"]["success"] is True


# ============================================================
# 메시지 로그 모델 테스트
# ============================================================

class TestMessageLogModel:
    """MessageLog 모델 테스트"""

    @pytest.mark.asyncio
    async def test_message_log_creation(self, test_db: AsyncSession):
        """메시지 로그 생성 테스트"""
        # 직원 생성
        employee = Employee(
            name="테스트 직원",
            phone="09171234567",
            employee_type="therapist",
            pay_group="weekly",
            base_salary=Decimal("10000.00"),
            hire_date=date(2026, 1, 1)
        )
        test_db.add(employee)
        await test_db.flush()

        # 정산 기간 생성
        period = PayrollPeriod(
            period_start=date(2026, 5, 1),
            period_end=date(2026, 5, 15),
            pay_group="weekly",
            status="draft"
        )
        test_db.add(period)
        await test_db.flush()

        # 정산 결과 생성
        record = PayrollRecord(
            payroll_period_id=period.id,
            employee_id=employee.id,
            base_amount=Decimal("10000.00"),
            commission_amount=Decimal("0.00"),
            overtime_amount=Decimal("0.00"),
            holiday_bonus=Decimal("0.00"),
            meal_allowance=Decimal("0.00"),
            late_deduction=Decimal("0.00"),
            absence_deduction=Decimal("0.00"),
            sss_deduction=Decimal("0.00"),
            ca_deduction=Decimal("0.00"),
            health_check_deduction=Decimal("0.00"),
            thirteenth_month_deduction=Decimal("0.00"),
            thirteenth_month_accrual=Decimal("0.00"),
            gross_pay=Decimal("10000.00"),
            total_deductions=Decimal("0.00"),
            net_pay=Decimal("10000.00"),
            status="draft"
        )
        test_db.add(record)
        await test_db.flush()

        # 메시지 로그 생성
        message_log = MessageLog(
            payroll_record_id=record.id,
            employee_id=employee.id,
            message_type="payroll_notification",
            channel="whatsapp",
            recipient_phone="09171234567",
            body="Test message",
            status="sent",
            message_sid="twilio-sid-123",
            amount=Decimal("10000.00"),
            payment_date=date(2026, 5, 15),
            sent_at=datetime.utcnow()
        )
        test_db.add(message_log)
        await test_db.commit()

        # 확인
        assert message_log.id is not None
        assert message_log.status == "sent"
        assert message_log.channel == "whatsapp"
        assert message_log.amount == Decimal("10000.00")

    @pytest.mark.asyncio
    async def test_message_log_error_tracking(self, test_db: AsyncSession):
        """메시지 로그 에러 추적 테스트"""
        employee = Employee(
            name="에러 테스트",
            phone="09171234567",
            employee_type="driver",
            pay_group="biweekly",
            base_salary=Decimal("15000.00"),
            hire_date=date(2026, 1, 1)
        )
        test_db.add(employee)
        await test_db.commit()

        # 실패한 메시지 로그
        message_log = MessageLog(
            employee_id=employee.id,
            message_type="payroll_notification",
            channel="kakao",
            recipient_phone="09171234567",
            body="Failed message",
            status="failed",
            error_message="Kakao API connection timeout"
        )
        test_db.add(message_log)
        await test_db.commit()

        assert message_log.status == "failed"
        assert message_log.error_message == "Kakao API connection timeout"


# ============================================================
# 메시지 템플릿 샘플
# ============================================================

def get_message_templates():
    """메시지 템플릿 샘플"""
    return {
        "payroll_korean": """안녕하세요 {name}님!

급여가 정산되었습니다.

순지급액: ₱{net_pay:,.2f}
지급일: {payment_date}
정산기간: {period_start} ~ {period_end}

자세한 내용은 ElSpa Manager 앱에서 확인하실 수 있습니다.

감사합니다!
ElSpa Manager""",

        "payroll_english": """Hello {name}!

Your salary has been processed.

Net Pay: ₱{net_pay:,.2f}
Payment Date: {payment_date}
Period: {period_start} ~ {period_end}

For details, please check the ElSpa Manager app.

Thank you!
ElSpa Manager""",

        "settlement_approved": """안녕하세요!

정산이 승인되었습니다.

총 직원 수: {total_employees}명
총 금액: ₱{total_amount:,.2f}
승인일: {approval_date}

모든 직원에게 알림이 발송됩니다.

ElSpa Manager""",

        "payment_processed": """안녕하세요 {name}님!

지급이 완료되었습니다.

확인 번호: {confirmation_number}
금액: ₱{amount:,.2f}
지급 방법: {method}

ElSpa Manager"""
    }


if __name__ == "__main__":
    # 테스트 실행: pytest tests/test_messaging.py -v
    print("메시징 서비스 테스트 준비 완료")
