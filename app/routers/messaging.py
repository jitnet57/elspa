"""
메시지 발송 API 라우터
경로: app/routers/messaging.py
작성일: 2026-05-22

엔드포인트:
  - POST /api/messaging/periods/{period_id}/send-notifications
  - GET /api/messaging/message-logs
  - GET /api/messaging/message-logs/{log_id}
"""

import logging
from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

logger = logging.getLogger(__name__)

from app.database import get_db
from app.auth.dependencies import require_admin, get_current_user
from app.models.payroll import (
    PayrollPeriod, PayrollRecord, Employee, MessageLog, EmployeeType
)
from app.services.messaging_service import (
    messaging_service, PayrollNotificationPayload, NotificationChannel
)

router = APIRouter(prefix="/api/messaging", tags=["messaging"])


# ============================================================
# 메시지 발송 엔드포인트
# ============================================================

@router.post("/periods/{period_id}/send-notifications", dependencies=[Depends(require_admin)])
async def send_payroll_notifications(
    period_id: int,
    channels: Optional[List[str]] = None,  # ["whatsapp", "kakao"]
    dry_run: bool = False,  # True: 실제 발송 없이 시뮬레이션
    db: AsyncSession = Depends(get_db)
):
    """
    정산 기간의 모든 직원에게 WhatsApp + 카카오톡 알림 발송

    인수:
      - period_id: 정산 기간 ID
      - channels: 발송 채널 (기본: ["whatsapp", "kakao"])
      - dry_run: 시뮬레이션 모드

    반환:
      - total_employees: 총 직원 수
      - sent_count: 발송 성공 수
      - failed_count: 발송 실패 수
      - message_logs: 발송 로그 목록

    예시:
      POST /api/messaging/periods/1/send-notifications
      {
        "channels": ["whatsapp"],
        "dry_run": true
      }
    """
    if channels is None:
        channels = ["whatsapp", "kakao"]

    # 유효한 채널만 필터링
    valid_channels = []
    for ch in channels:
        if ch == "whatsapp":
            valid_channels.append(NotificationChannel.WHATSAPP)
        elif ch == "kakao":
            valid_channels.append(NotificationChannel.KAKAO)

    if not valid_channels:
        raise HTTPException(status_code=400, detail="유효한 채널이 없습니다")

    # 정산 기간 조회
    result = await db.execute(select(PayrollPeriod).where(PayrollPeriod.id == period_id))
    period = result.scalar_one_or_none()
    if not period:
        raise HTTPException(status_code=404, detail="정산 기간을 찾을 수 없습니다")

    # 정산 결과 조회 (approved/paid 상태만)
    payroll_result = await db.execute(
        select(PayrollRecord, Employee).join(Employee).where(
            PayrollRecord.payroll_period_id == period_id,
            PayrollRecord.status.in_(["approved", "paid"])
        )
    )
    records = payroll_result.all()

    if not records:
        raise HTTPException(status_code=404, detail="이 기간의 정산 결과가 없습니다")

    sent_count = 0
    failed_count = 0
    message_logs = []

    logger.info(
        f"📨 메시지 발송 시작 | Period: {period_id} | Total: {len(records)} | "
        f"Channels: {[ch.value for ch in valid_channels]} | DryRun: {dry_run}"
    )

    for payroll_record, employee in records:
        try:
            # WhatsApp/카카오톡 페이로드 구성
            payload = PayrollNotificationPayload(
                recipient_phone=employee.phone,
                recipient_name=employee.name,
                net_pay=payroll_record.net_pay,
                payment_date=period.period_end.isoformat(),
                period_start=period.period_start.isoformat(),
                period_end=period.period_end.isoformat(),
                payroll_period_id=period_id
            )

            if dry_run:
                # 시뮬레이션: 실제 발송하지 않고 로그만 기록
                logger.info(
                    f"🔄 DRY RUN | Employee: {employee.name} ({employee.phone}) | "
                    f"Amount: ₱{payroll_record.net_pay:,.2f}"
                )
                sent_count += 1

                # 로그 기록 (pending 상태)
                for channel in valid_channels:
                    log = MessageLog(
                        payroll_record_id=payroll_record.id,
                        employee_id=employee.id,
                        message_type="payroll_notification",
                        channel=channel.value,
                        recipient_phone=employee.phone,
                        body=f"정산액: ₱{payroll_record.net_pay:,.2f}",
                        amount=payroll_record.net_pay,
                        payment_date=period.period_end,
                        status="pending"  # DRY RUN은 pending 상태로 저장
                    )
                    db.add(log)
                    message_logs.append(log)

            else:
                # 실제 발송
                result = await messaging_service.send_payroll_notification(
                    payload,
                    channels=valid_channels
                )

                if result.get("overall_success"):
                    sent_count += 1
                    logger.info(f"✅ 발송 성공 | Employee: {employee.name}")
                else:
                    failed_count += 1
                    logger.warning(f"❌ 발송 실패 | Employee: {employee.name}")

                # 각 채널별 로그 기록
                for channel_name, channel_result in result.get("channels", {}).items():
                    log = MessageLog(
                        payroll_record_id=payroll_record.id,
                        employee_id=employee.id,
                        message_type="payroll_notification",
                        channel=channel_name,
                        recipient_phone=employee.phone,
                        body=f"정산액: ₱{payroll_record.net_pay:,.2f}",
                        amount=payroll_record.net_pay,
                        payment_date=period.period_end,
                        status=channel_result.get("status", "failed"),
                        message_sid=channel_result.get("message_sid"),
                        error_message=channel_result.get("error"),
                        sent_at=datetime.utcnow() if channel_result.get("success") else None
                    )
                    db.add(log)
                    message_logs.append(log)

        except Exception as e:
            failed_count += 1
            logger.error(
                f"❌ 발송 처리 실패 | Employee: {employee.name} | Error: {str(e)}",
                exc_info=True
            )

            # 에러 로그 기록
            for channel in valid_channels:
                log = MessageLog(
                    payroll_record_id=payroll_record.id,
                    employee_id=employee.id,
                    message_type="payroll_notification",
                    channel=channel.value,
                    recipient_phone=employee.phone,
                    body=f"정산액: ₱{payroll_record.net_pay:,.2f}",
                    amount=payroll_record.net_pay,
                    payment_date=period.period_end,
                    status="failed",
                    error_message=str(e)
                )
                db.add(log)
                message_logs.append(log)

    # 데이터베이스 저장
    await db.commit()

    # 로그 새로고침
    for log in message_logs:
        await db.refresh(log)

    logger.info(
        f"📊 메시지 발송 완료 | "
        f"Total: {len(records)} | Sent: {sent_count} | Failed: {failed_count}"
    )

    return {
        "total_employees": len(records),
        "sent_count": sent_count,
        "failed_count": failed_count,
        "channels": [ch.value for ch in valid_channels],
        "dry_run": dry_run,
        "message_logs": [
            {
                "id": log.id,
                "employee_id": log.employee_id,
                "channel": log.channel,
                "status": log.status,
                "error": log.error_message
            }
            for log in message_logs
        ]
    }


# ============================================================
# 메시지 로그 조회 엔드포인트
# ============================================================

@router.get("/message-logs", dependencies=[Depends(require_admin)])
async def list_message_logs(
    payroll_period_id: Optional[int] = None,
    status: Optional[str] = None,
    channel: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """
    메시지 발송 로그 조회

    쿼리 파라미터:
      - payroll_period_id: 정산 기간 필터
      - status: pending/sent/failed/bounced
      - channel: whatsapp/kakao/sms

    예시:
      GET /api/messaging/message-logs?status=sent&channel=whatsapp
    """
    stmt = select(MessageLog)

    if payroll_period_id:
        stmt = stmt.join(PayrollRecord).where(
            PayrollRecord.payroll_period_id == payroll_period_id
        )

    if status:
        stmt = stmt.where(MessageLog.status == status)

    if channel:
        stmt = stmt.where(MessageLog.channel == channel)

    stmt = stmt.order_by(MessageLog.created_at.desc()).offset(skip).limit(limit)

    result = await db.execute(stmt)
    logs = result.scalars().all()

    return {
        "total": len(logs),
        "logs": [
            {
                "id": log.id,
                "payroll_record_id": log.payroll_record_id,
                "employee_id": log.employee_id,
                "message_type": log.message_type,
                "channel": log.channel,
                "recipient_phone": log.recipient_phone,
                "status": log.status,
                "message_sid": log.message_sid,
                "error_message": log.error_message,
                "amount": str(log.amount) if log.amount else None,
                "payment_date": log.payment_date.isoformat() if log.payment_date else None,
                "sent_at": log.sent_at.isoformat() if log.sent_at else None,
                "created_at": log.created_at.isoformat(),
                "updated_at": log.updated_at.isoformat()
            }
            for log in logs
        ]
    }


@router.get("/message-logs/{log_id}", dependencies=[Depends(require_admin)])
async def get_message_log(log_id: int, db: AsyncSession = Depends(get_db)):
    """
    메시지 로그 상세 조회

    예시:
      GET /api/messaging/message-logs/123
    """
    result = await db.execute(select(MessageLog).where(MessageLog.id == log_id))
    log = result.scalar_one_or_none()

    if not log:
        raise HTTPException(status_code=404, detail="메시지 로그를 찾을 수 없습니다")

    return {
        "id": log.id,
        "payroll_record_id": log.payroll_record_id,
        "employee_id": log.employee_id,
        "message_type": log.message_type,
        "channel": log.channel,
        "recipient_phone": log.recipient_phone,
        "recipient_kakao_id": log.recipient_kakao_id,
        "subject": log.subject,
        "body": log.body,
        "status": log.status,
        "message_sid": log.message_sid,
        "error_message": log.error_message,
        "amount": str(log.amount) if log.amount else None,
        "payment_date": log.payment_date.isoformat() if log.payment_date else None,
        "sent_at": log.sent_at.isoformat() if log.sent_at else None,
        "created_at": log.created_at.isoformat(),
        "updated_at": log.updated_at.isoformat()
    }


# ============================================================
# 메시지 통계
# ============================================================

@router.get("/stats", dependencies=[Depends(require_admin)])
async def get_messaging_stats(
    period_days: int = 7,
    db: AsyncSession = Depends(get_db)
):
    """
    최근 N일간의 메시지 발송 통계

    인수:
      - period_days: 조회 기간 (기본값: 7일)

    반환:
      - total_sent: 총 발송 건수
      - total_failed: 총 실패 건수
      - by_channel: 채널별 통계
      - by_status: 상태별 통계
    """
    from datetime import timedelta

    # 최근 N일 데이터만 조회
    days_ago = datetime.utcnow() - timedelta(days=period_days)

    result = await db.execute(
        select(MessageLog).where(MessageLog.created_at >= days_ago)
    )
    logs = result.scalars().all()

    # 채널별 통계
    by_channel = {}
    for channel in ["whatsapp", "kakao", "sms"]:
        channel_logs = [log for log in logs if log.channel == channel]
        by_channel[channel] = {
            "total": len(channel_logs),
            "sent": len([log for log in channel_logs if log.status == "sent"]),
            "failed": len([log for log in channel_logs if log.status == "failed"]),
            "pending": len([log for log in channel_logs if log.status == "pending"])
        }

    # 상태별 통계
    by_status = {}
    for status in ["pending", "sent", "failed", "bounced"]:
        status_logs = [log for log in logs if log.status == status]
        by_status[status] = len(status_logs)

    return {
        "period_days": period_days,
        "total_sent": len([log for log in logs if log.status == "sent"]),
        "total_failed": len([log for log in logs if log.status == "failed"]),
        "total_pending": len([log for log in logs if log.status == "pending"]),
        "total_logs": len(logs),
        "by_channel": by_channel,
        "by_status": by_status
    }
