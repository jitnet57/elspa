"""
============================================================
📌 Therapist API Router
📋 목적: 테라피스트 검색, 프로필, 예약 관리
📅 작성일: 2026-05-18
============================================================
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List, Optional

from app.database import get_db
from app.models.therapist import Therapist
from app.schemas.therapist import (
    TherapistResponse,
    TherapistDetailResponse,
    TherapistCreate,
    TherapistUpdate
)

router = APIRouter(prefix="/api/therapists", tags=["therapists"])


# ============================================================
# 🔍 조회 API
# ============================================================

@router.get("/", response_model=List[TherapistResponse])
async def get_therapists(
    skip: int = 0,
    limit: int = 20,
    sort_by: str = "rating",
    db: AsyncSession = Depends(get_db)
):
    """
    테라피스트 목록 조회

    **쿼리 파라미터:**
    - `skip`: 건너뛸 개수 (기본값: 0)
    - `limit`: 조회 개수 (기본값: 20)
    - `sort_by`: 정렬 기준 (rating, review_count, name)

    **반환값:**
    - List[TherapistResponse]: 테라피스트 목록
    """
    query = select(Therapist).where(Therapist.available == True)

    # 정렬
    if sort_by == "rating":
        query = query.order_by(desc(Therapist.rating))
    elif sort_by == "review_count":
        query = query.order_by(desc(Therapist.review_count))
    else:
        query = query.order_by(Therapist.name)

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    therapists = result.scalars().all()

    return therapists


@router.get("/{therapist_id}", response_model=TherapistDetailResponse)
async def get_therapist_detail(
    therapist_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    특정 테라피스트 상세 정보 조회

    **경로 파라미터:**
    - `therapist_id`: 테라피스트 ID

    **반환값:**
    - TherapistDetailResponse: 상세 정보
    """
    query = select(Therapist).where(Therapist.id == therapist_id)
    result = await db.execute(query)
    therapist = result.scalar_one_or_none()

    if not therapist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="테라피스트를 찾을 수 없습니다"
        )

    return therapist


@router.get("/search/", response_model=List[TherapistResponse])
async def search_therapists(
    q: Optional[str] = None,
    specialty: Optional[str] = None,
    min_rating: Optional[float] = None,
    location: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    테라피스트 검색

    **쿼리 파라미터:**
    - `q`: 검색어 (이름)
    - `specialty`: 전문분야 (스웨디시, 타이 등)
    - `min_rating`: 최소 평점
    - `location`: 위치

    **반환값:**
    - List[TherapistResponse]: 검색 결과
    """
    query = select(Therapist).where(Therapist.available == True)

    if q:
        query = query.where(Therapist.name.ilike(f"%{q}%"))

    if specialty:
        query = query.where(Therapist.specialty.ilike(f"%{specialty}%"))

    if min_rating:
        query = query.where(Therapist.rating >= min_rating)

    if location:
        query = query.where(Therapist.location.ilike(f"%{location}%"))

    query = query.order_by(desc(Therapist.rating))
    result = await db.execute(query)
    therapists = result.scalars().all()

    return therapists


# ============================================================
# ✏️ 수정 API (Admin)
# ============================================================

@router.post("/", response_model=TherapistResponse, status_code=status.HTTP_201_CREATED)
async def create_therapist(
    therapist_data: TherapistCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    새 테라피스트 생성 (Admin만)
    """
    new_therapist = Therapist(**therapist_data.dict())
    db.add(new_therapist)
    await db.commit()
    await db.refresh(new_therapist)
    return new_therapist


@router.put("/{therapist_id}", response_model=TherapistResponse)
async def update_therapist(
    therapist_id: int,
    therapist_data: TherapistUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    테라피스트 정보 수정 (Admin만)
    """
    query = select(Therapist).where(Therapist.id == therapist_id)
    result = await db.execute(query)
    therapist = result.scalar_one_or_none()

    if not therapist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="테라피스트를 찾을 수 없습니다"
        )

    update_data = therapist_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(therapist, key, value)

    await db.commit()
    await db.refresh(therapist)
    return therapist
