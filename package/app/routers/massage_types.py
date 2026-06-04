"""
============================================================
📌 라우터: /api/admin/massage-types (마사지 종류 관리)
📋 목적: 관리자가 제공하는 마사지 종류를 CRUD
📅 작성일: 2026-06-03
============================================================

엔드포인트 (6개):
  GET    /api/admin/massage-types                마사지 종류 목록
  GET    /api/admin/massage-types/{id}           마사지 종류 상세 조회
  POST   /api/admin/massage-types                마사지 종류 생성
  PUT    /api/admin/massage-types/{id}           마사지 종류 수정
  DELETE /api/admin/massage-types/{id}           마사지 종류 삭제 (soft delete)
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.massage_service import MassageService
from app.schemas.massage_service import (
    MassageServiceCreate,
    MassageServiceUpdate,
    MassageServiceResponse,
    MassageServiceListResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin/massage-types", tags=["Massage Types"])


# ============================================================
# 1️⃣ GET /api/admin/massage-types - 마사지 종류 목록
# ============================================================
@router.get("", response_model=MassageServiceListResponse)
async def list_massage_types(
    active_only: bool = Query(True, description="활성 서비스만 조회"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """
    마사지 종류 목록 조회

    쿼리 파라미터:
      - active_only: True면 활성 서비스만, False면 모두 조회
      - limit, offset: 페이지네이션

    응답:
      - data: 마사지 종류 배열
      - total_count: 전체 개수
      - active_count: 활성 서비스 개수
    """
    try:
        # 기본 쿼리
        query = select(MassageService)

        # 필터: 활성 여부
        if active_only:
            query = query.where(MassageService.is_active == True)

        # 정렬 (이름순)
        query = query.order_by(MassageService.name)

        # 페이지네이션
        query = query.offset(offset).limit(limit)

        # 실행
        result = await db.execute(query)
        services = result.scalars().all()

        # 전체/활성 개수
        total_query = select(func.count(MassageService.id))
        total_result = await db.execute(total_query)
        total_count = total_result.scalar()

        active_query = select(func.count(MassageService.id)).where(
            MassageService.is_active == True
        )
        active_result = await db.execute(active_query)
        active_count = active_result.scalar()

        return MassageServiceListResponse(
            data=[MassageServiceResponse.from_orm(s) for s in services],
            total_count=total_count,
            active_count=active_count,
        )

    except Exception as e:
        logger.error(f"마사지 종류 목록 조회 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="마사지 종류 목록 조회 실패",
        )


# ============================================================
# 2️⃣ GET /api/admin/massage-types/{id} - 마사지 종류 상세 조회
# ============================================================
@router.get("/{service_id}", response_model=MassageServiceResponse)
async def get_massage_type(
    service_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    특정 마사지 종류 상세 조회

    경로 파라미터:
      - service_id: 마사지 종류 ID

    응답:
      - MassageServiceResponse: 마사지 종류 상세 정보

    에러:
      - 404: 해당 종류가 없음
    """
    try:
        query = select(MassageService).where(MassageService.id == service_id)
        result = await db.execute(query)
        service = result.scalar_one_or_none()

        if not service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="마사지 종류를 찾을 수 없습니다",
            )

        return MassageServiceResponse.from_orm(service)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"마사지 종류 조회 실패 (ID={service_id}): {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="마사지 종류 조회 실패",
        )


# ============================================================
# 3️⃣ POST /api/admin/massage-types - 마사지 종류 생성
# ============================================================
@router.post("", response_model=MassageServiceResponse, status_code=status.HTTP_201_CREATED)
async def create_massage_type(
    data: MassageServiceCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    새로운 마사지 종류 생성

    요청 본문:
      - name: 마사지 종류명 (고유)
      - base_price: 기본 가격
      - base_duration_minutes: 기본 소요 시간
      - description: 설명 (선택사항)
      - is_active: 활성 여부 (기본값: True)
      - icon: 이모지 또는 아이콘 URL (선택사항)

    응답:
      - MassageServiceResponse: 생성된 마사지 종류

    에러:
      - 400: 이름이 이미 존재
    """
    try:
        # 이름 유일성 검사
        existing_query = select(MassageService).where(
            MassageService.name == data.name
        )
        existing_result = await db.execute(existing_query)
        if existing_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"'{data.name}' 이미 존재합니다",
            )

        # 새로운 서비스 생성
        service = MassageService(
            name=data.name,
            base_price=data.base_price,
            base_duration_minutes=data.base_duration_minutes,
            description=data.description,
            is_active=data.is_active,
            icon=data.icon,
        )

        db.add(service)
        await db.commit()
        await db.refresh(service)

        logger.info(f"마사지 종류 생성: {service.name} (ID={service.id})")
        return MassageServiceResponse.from_orm(service)

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"마사지 종류 생성 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="마사지 종류 생성 실패",
        )


# ============================================================
# 4️⃣ PUT /api/admin/massage-types/{id} - 마사지 종류 수정
# ============================================================
@router.put("/{service_id}", response_model=MassageServiceResponse)
async def update_massage_type(
    service_id: int,
    data: MassageServiceUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    마사지 종류 수정

    경로 파라미터:
      - service_id: 마사지 종류 ID

    요청 본문:
      - 모든 필드 선택사항 (null인 필드는 변경 안 함)

    응답:
      - MassageServiceResponse: 수정된 마사지 종류

    에러:
      - 404: 해당 종류가 없음
      - 400: 새로운 이름이 이미 존재
    """
    try:
        # 기존 서비스 조회
        query = select(MassageService).where(MassageService.id == service_id)
        result = await db.execute(query)
        service = result.scalar_one_or_none()

        if not service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="마사지 종류를 찾을 수 없습니다",
            )

        # 이름 변경 시 유일성 검사
        if data.name and data.name != service.name:
            existing_query = select(MassageService).where(
                MassageService.name == data.name
            )
            existing_result = await db.execute(existing_query)
            if existing_result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"'{data.name}' 이미 존재합니다",
                )

        # 필드 업데이트 (None인 필드는 유지)
        update_data = data.dict(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                setattr(service, field, value)

        await db.commit()
        await db.refresh(service)

        logger.info(f"마사지 종류 수정: {service.name} (ID={service.id})")
        return MassageServiceResponse.from_orm(service)

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"마사지 종류 수정 실패 (ID={service_id}): {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="마사지 종류 수정 실패",
        )


# ============================================================
# 5️⃣ DELETE /api/admin/massage-types/{id} - 마사지 종류 삭제
# ============================================================
@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_massage_type(
    service_id: int,
    hard_delete: bool = Query(False, description="True면 완전 삭제, False면 soft delete (is_active=False)"),
    db: AsyncSession = Depends(get_db),
):
    """
    마사지 종류 삭제

    경로 파라미터:
      - service_id: 마사지 종류 ID

    쿼리 파라미터:
      - hard_delete: True면 완전 삭제, False면 is_active=False 처리 (기본값)

    에러:
      - 404: 해당 종류가 없음

    주의:
      - 기본값(soft delete)은 이전 예약 데이터를 보존합니다
      - hard_delete=True는 돌이킬 수 없습니다
    """
    try:
        # 기존 서비스 조회
        query = select(MassageService).where(MassageService.id == service_id)
        result = await db.execute(query)
        service = result.scalar_one_or_none()

        if not service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="마사지 종류를 찾을 수 없습니다",
            )

        if hard_delete:
            # 완전 삭제
            await db.delete(service)
            logger.info(f"마사지 종류 완전 삭제: {service.name} (ID={service.id})")
        else:
            # Soft delete: is_active = False
            service.is_active = False
            logger.info(f"마사지 종류 비활성화: {service.name} (ID={service.id})")

        await db.commit()

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"마사지 종류 삭제 실패 (ID={service_id}): {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="마사지 종류 삭제 실패",
        )
