"""
============================================================
📌 라우터: /api/beds (침대 관리)
📋 목적: 86개 침대의 상태, 예약, 서비스 정보 관리
📅 작성일: 2026-05-13
============================================================

엔드포인트 (6개):
  GET    /api/beds                    침대 전체 목록
  GET    /api/beds/{id}               침대 상세 조회
  GET    /api/beds/stats              침대 통계
  POST   /api/beds/{id}/status        침대 상태 업데이트
  POST   /api/beds/bulk-status        대량 상태 변경
"""

import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Bed
from app.schemas.bed import (
    BedResponse,
    BedListResponse,
    BedStatusUpdate,
    BedStatsResponse,
    BedBulkStatusUpdate,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/beds", tags=["Beds"])


# ============================================================
# 1️⃣ GET /api/beds - 침대 목록 조회
# ============================================================
@router.get("", response_model=BedListResponse)
async def get_beds(
    room_zone: Optional[str] = Query(None, description="필터: 마사지룸1, 마사지룸2, VIP룸, 커플룸"),
    status: Optional[str] = Query(None, description="필터: available, reserved, in_service, cleaning"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """
    침대 목록 조회 (필터링, 페이지네이션 지원)

    쿼리 파라미터:
      - room_zone: 특정 룸만 조회
      - status: 특정 상태의 침대만 조회
      - limit, offset: 페이지네이션

    응답:
      - data: 침대 목록 배열
      - total_count: 전체 침대 수
      - filtered_count: 필터링된 침대 수
    """
    try:
        # 기본 쿼리
        query = select(Bed)

        # 필터 적용
        if room_zone:
            query = query.where(Bed.room_zone == room_zone)
        if status:
            query = query.where(Bed.status == status)

        # 페이지네이션
        query = query.offset(offset).limit(limit)

        # 실행
        result = await db.execute(query)
        beds = result.scalars().all()

        # 전체 개수 조회
        total_query = select(func.count(Bed.id))
        total_result = await db.execute(total_query)
        total_count = total_result.scalar()

        # 필터된 개수 조회
        filtered_query = select(func.count(Bed.id))
        if room_zone:
            filtered_query = filtered_query.where(Bed.room_zone == room_zone)
        if status:
            filtered_query = filtered_query.where(Bed.status == status)
        filtered_result = await db.execute(filtered_query)
        filtered_count = filtered_result.scalar()

        logger.info(f"침대 목록 조회: total={total_count}, filtered={filtered_count}")

        return BedListResponse(
            data=[BedResponse.model_validate(bed) for bed in beds],
            total_count=total_count,
            filtered_count=filtered_count,
        )

    except Exception as e:
        logger.error(f"침대 목록 조회 실패: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="침대 목록 조회 중 오류가 발생했습니다"
        )


# ============================================================
# 2️⃣ GET /api/beds/{bed_id} - 특정 침대 조회
# ============================================================
@router.get("/{bed_id}", response_model=BedResponse)
async def get_bed(
    bed_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    특정 침대의 상세 정보 조회

    경로 파라미터:
      - bed_id: 침대 ID (1-86)

    응답:
      - 침대의 모든 정보 (상태, 고객, 테라피스트, 서비스 등)
    """
    try:
        query = select(Bed).where(Bed.id == bed_id)
        result = await db.execute(query)
        bed = result.scalar_one_or_none()

        if not bed:
            logger.warning(f"침대 조회 실패: bed_id={bed_id} (존재하지 않음)")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"침대 {bed_id}를 찾을 수 없습니다"
            )

        # remaining_minutes 계산 (in_service 상태일 때)
        bed_response = BedResponse.model_validate(bed)
        if bed.status == 'in_service' and bed.ends_at:
            remaining = (bed.ends_at - datetime.utcnow()).total_seconds() / 60
            bed_response.remaining_minutes = max(0, int(remaining))

        logger.info(f"침대 조회: bed_id={bed_id}, status={bed.status}")
        return bed_response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"침대 조회 실패: bed_id={bed_id}, error={e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="침대 조회 중 오류가 발생했습니다"
        )


# ============================================================
# 3️⃣ POST /api/beds/{bed_id}/status - 침대 상태 업데이트
# ============================================================
@router.post("/{bed_id}/status", response_model=BedResponse)
async def update_bed_status(
    bed_id: int,
    update: BedStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    침대 상태 업데이트 (예약 → 서비스 → 정리 등)

    경로 파라미터:
      - bed_id: 침대 ID

    요청 본문:
      - status: 변경할 상태
      - customer_name, therapist_id 등 추가 정보

    상태 전환 규칙:
      available → reserved → in_service → cleaning → available
    """
    try:
        # 침대 조회
        query = select(Bed).where(Bed.id == bed_id)
        result = await db.execute(query)
        bed = result.scalar_one_or_none()

        if not bed:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"침대 {bed_id}를 찾을 수 없습니다"
            )

        # 상태 전환 검증
        _validate_status_transition(bed.status, update.status)

        # 상태 업데이트
        bed.status = update.status
        if update.customer_name:
            bed.customer_name = update.customer_name
        if update.customer_id:
            bed.customer_id = update.customer_id
        if update.therapist_id:
            bed.therapist_id = update.therapist_id
        if update.therapist_name:
            bed.therapist_name = update.therapist_name
        if update.service_name:
            bed.service_name = update.service_name
        if update.service_minutes:
            bed.service_minutes = update.service_minutes
        if update.service_price:
            bed.service_price = update.service_price
        if update.starts_at:
            bed.starts_at = update.starts_at
        if update.ends_at:
            bed.ends_at = update.ends_at
        if update.booking_id:
            bed.booking_id = update.booking_id
        if update.notes:
            bed.notes = update.notes

        bed.updated_at = datetime.utcnow()

        # 저장
        await db.commit()
        await db.refresh(bed)

        logger.info(f"침대 상태 업데이트: bed_id={bed_id}, status={update.status}")
        return BedResponse.model_validate(bed)

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"침대 상태 업데이트 실패: bed_id={bed_id}, error={e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="침대 상태 업데이트 중 오류가 발생했습니다"
        )


# ============================================================
# 4️⃣ POST /api/beds/bulk-status - 대량 상태 변경
# ============================================================
@router.post("/bulk/status", response_model=dict)
async def bulk_update_status(
    bulk_update: BedBulkStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    여러 침대의 상태를 한 번에 변경 (정리 완료 등)

    요청 본문:
      - bed_ids: 침대 ID 배열
      - status: 변경할 상태
    """
    try:
        updated_count = 0

        for bed_id in bulk_update.bed_ids:
            query = select(Bed).where(Bed.id == bed_id)
            result = await db.execute(query)
            bed = result.scalar_one_or_none()

            if bed:
                bed.status = bulk_update.status
                bed.updated_at = datetime.utcnow()
                if bulk_update.notes:
                    bed.notes = bulk_update.notes
                updated_count += 1

        await db.commit()

        logger.info(f"대량 상태 업데이트: {updated_count}개 침대, status={bulk_update.status}")
        return {
            "success": True,
            "updated_count": updated_count,
            "status": bulk_update.status,
            "timestamp": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        await db.rollback()
        logger.error(f"대량 상태 업데이트 실패: error={e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="대량 상태 업데이트 중 오류가 발생했습니다"
        )


# ============================================================
# 5️⃣ GET /api/beds/stats - 침대 통계
# ============================================================
@router.get("/stats", response_model=BedStatsResponse)
async def get_bed_stats(
    db: AsyncSession = Depends(get_db),
):
    """
    침대 통계 조회 (가용성, 점유율 등)

    응답:
      - total_beds: 전체 침대 수 (86)
      - available_count: 가용 침대
      - reserved_count: 예약됨
      - in_service_count: 서비스 중
      - cleaning_count: 정리 중
      - occupancy_rate: 점유율 (0.0 ~ 1.0)
    """
    try:
        # 각 상태별 개수 조회
        query = select(
            func.count(Bed.id).filter(Bed.status == 'available').label('available'),
            func.count(Bed.id).filter(Bed.status == 'reserved').label('reserved'),
            func.count(Bed.id).filter(Bed.status == 'in_service').label('in_service'),
            func.count(Bed.id).filter(Bed.status == 'cleaning').label('cleaning'),
            func.count(Bed.id).label('total'),
        )

        result = await db.execute(query)
        stats = result.one()

        total_count = stats.total or 86
        occupied_count = (stats.in_service or 0) + (stats.cleaning or 0)
        occupancy_rate = occupied_count / total_count if total_count > 0 else 0.0

        logger.info(f"침대 통계: occupancy_rate={occupancy_rate:.2%}")

        return BedStatsResponse(
            total_beds=total_count,
            available_count=stats.available or 0,
            reserved_count=stats.reserved or 0,
            in_service_count=stats.in_service or 0,
            cleaning_count=stats.cleaning or 0,
            occupancy_rate=occupancy_rate,
        )

    except Exception as e:
        logger.error(f"침대 통계 조회 실패: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="침대 통계 조회 중 오류가 발생했습니다"
        )


# ============================================================
# 유틸리티 함수
# ============================================================
def _validate_status_transition(current_status: str, new_status: str) -> None:
    """
    침대 상태 전환 검증

    허용된 전환:
      available → reserved, in_service, cleaning
      reserved → in_service
      in_service → cleaning
      cleaning → available
    """
    valid_transitions = {
        'available': ['reserved', 'in_service', 'cleaning'],
        'reserved': ['in_service', 'available', 'cleaning'],
        'in_service': ['cleaning', 'available'],
        'cleaning': ['available'],
    }

    if current_status not in valid_transitions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"알 수 없는 상태: {current_status}"
        )

    if new_status not in valid_transitions[current_status]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"잘못된 상태 전환: {current_status} → {new_status}"
        )
