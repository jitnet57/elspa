"""
============================================================
📌 Review API Router
📋 목적: 리뷰 작성, 조회, 수정
📅 작성일: 2026-05-18
============================================================
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List

from app.database import get_db
from app.models.review import Review
from app.schemas.review import (
    ReviewResponse,
    ReviewCreate
)

router = APIRouter(prefix="/api/reviews", tags=["reviews"])


@router.get("/therapist/{therapist_id}", response_model=List[ReviewResponse])
async def get_therapist_reviews(
    therapist_id: int,
    skip: int = 0,
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    """테라피스트 리뷰 조회"""
    query = (
        select(Review)
        .where(Review.therapist_id == therapist_id)
        .order_by(desc(Review.created_at))
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    review_data: ReviewCreate,
    db: AsyncSession = Depends(get_db)
):
    """리뷰 작성"""
    # 중복 리뷰 확인
    query = select(Review).where(
        Review.booking_id == review_data.booking_id,
        Review.customer_id == review_data.customer_id
    )
    result = await db.execute(query)
    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 작성한 리뷰입니다"
        )

    new_review = Review(**review_data.dict())
    db.add(new_review)
    await db.commit()
    await db.refresh(new_review)
    return new_review


@router.get("/{review_id}", response_model=ReviewResponse)
async def get_review(
    review_id: int,
    db: AsyncSession = Depends(get_db)
):
    """리뷰 조회"""
    query = select(Review).where(Review.id == review_id)
    result = await db.execute(query)
    review = result.scalar_one_or_none()

    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="리뷰를 찾을 수 없습니다"
        )

    return review
