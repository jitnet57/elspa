"""
============================================================
📌 라우터: /api/staff (직원 관리)
📋 목적: 직원 정보 및 분류 관리 (정직원, 드라이버, 계약직 등)
📅 작성일: 2026-06-03
============================================================

엔드포인트:
  GET    /api/staff              직원 목록 (필터 지원)
  POST   /api/staff              새 직원 추가
  GET    /api/staff/{id}         직원 상세 정보
  PUT    /api/staff/{id}         직원 정보 수정
  POST   /api/staff/bulk-import  엑셀 데이터 일괄 임포트
"""

import logging
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.database import get_db
from app.models import Staff

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/staff", tags=["Staff Management"])


# ============================================================
# 📋 Pydantic Schemas
# ============================================================

# 부서별 직책 매핑
DEPARTMENT_JOB_TITLES = {
    "Office": ["manager", "staff"],
    "Hollys Coffee": ["manager", "staff"],
    "Nail": ["manager", "staff"],
    "Maintenance": ["manager", "staff"],
    "Driver": ["manager", "staff"],
    "Therapist": ["manager", "staff"],
    "Yega": ["manager", "staff", "chef"],
}

VALID_DEPARTMENTS = list(DEPARTMENT_JOB_TITLES.keys())


class StaffCreate(BaseModel):
    name: str
    department: str  # Office, Hollys Coffee, Nail, Maintenance, Driver, Therapist, Yega
    job_title: str  # manager, staff, chef (부서별로 다름)
    phone: Optional[str] = None
    position: Optional[str] = None
    employment_type: str = "계약직"  # 정직원, 계약직, 아르바이트, 드라이버 등
    bio: Optional[str] = None


class StaffUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    job_title: Optional[str] = None
    phone: Optional[str] = None
    position: Optional[str] = None
    employment_type: Optional[str] = None
    bio: Optional[str] = None
    is_active: Optional[int] = None


class StaffResponse(BaseModel):
    id: int
    name: str
    department: str
    job_title: str
    phone: Optional[str]
    position: Optional[str]
    employment_type: str
    rating: float
    total_sessions: int
    month_sessions: int
    bio: Optional[str]
    is_active: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StaffListResponse(BaseModel):
    total: int
    count: int
    items: List[StaffResponse]


# ============================================================
# 1️⃣ POST /api/staff/bulk-import - 일괄 임포트
# ============================================================
@router.post("/bulk-import", response_model=dict)
async def bulk_import_staff(
    staff_list: List[StaffCreate],
    db: AsyncSession = Depends(get_db),
):
    """엑셀 데이터에서 추출한 직원 정보를 일괄 추가합니다."""
    try:
        created_count = 0
        skipped_count = 0
        errors = []

        for staff_data in staff_list:
            try:
                # 부서와 직책 검증
                if staff_data.department not in VALID_DEPARTMENTS:
                    errors.append({
                        "name": staff_data.name,
                        "error": f"유효하지 않은 부서: {staff_data.department}"
                    })
                    continue

                if staff_data.job_title not in DEPARTMENT_JOB_TITLES[staff_data.department]:
                    errors.append({
                        "name": staff_data.name,
                        "error": f"'{staff_data.department}' 부서의 유효하지 않은 직책: {staff_data.job_title}"
                    })
                    continue

                # 중복 확인 (이름 기준)
                existing = await db.execute(
                    select(Staff).where(
                        func.lower(Staff.name) == staff_data.name.lower()
                    )
                )
                if existing.scalar():
                    skipped_count += 1
                    continue

                # 새 직원 생성
                new_staff = Staff(
                    name=staff_data.name,
                    department=staff_data.department,
                    job_title=staff_data.job_title,
                    phone=staff_data.phone,
                    position=staff_data.position,
                    employment_type=staff_data.employment_type,
                    bio=staff_data.bio,
                )
                db.add(new_staff)
                created_count += 1

            except Exception as e:
                errors.append({"name": staff_data.name, "error": str(e)})

        await db.commit()

        return {
            "success": True,
            "created": created_count,
            "skipped": skipped_count,
            "errors": errors,
            "message": f"{created_count}명의 직원을 추가했습니다. ({skipped_count}명 중복)",
        }

    except Exception as e:
        await db.rollback()
        logger.error(f"❌ 직원 일괄 임포트 실패: {str(e)}")
        raise HTTPException(status_code=500, detail=f"임포트 실패: {str(e)}")


# ============================================================
# 2️⃣ POST /api/staff - 새 직원 추가
# ============================================================
@router.post("", response_model=StaffResponse, status_code=status.HTTP_201_CREATED)
async def create_staff(
    staff_data: StaffCreate,
    db: AsyncSession = Depends(get_db),
):
    """새 직원을 추가합니다."""
    try:
        # 부서 검증
        if staff_data.department not in VALID_DEPARTMENTS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"유효하지 않은 부서: {staff_data.department}. 유효한 부서: {', '.join(VALID_DEPARTMENTS)}"
            )

        # 직책 검증
        if staff_data.job_title not in DEPARTMENT_JOB_TITLES[staff_data.department]:
            valid_titles = ", ".join(DEPARTMENT_JOB_TITLES[staff_data.department])
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"'{staff_data.department}' 부서의 유효하지 않은 직책: {staff_data.job_title}. 유효한 직책: {valid_titles}"
            )

        # 중복 확인
        existing = await db.execute(
            select(Staff).where(func.lower(Staff.name) == staff_data.name.lower())
        )
        if existing.scalar():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"이미 등록된 직원입니다: {staff_data.name}",
            )

        new_staff = Staff(**staff_data.model_dump())
        db.add(new_staff)
        await db.commit()
        await db.refresh(new_staff)

        logger.info(f"✅ 새 직원 추가: {new_staff.name} ({new_staff.department}/{new_staff.job_title})")
        return new_staff

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"❌ 직원 추가 실패: {str(e)}")
        raise HTTPException(status_code=500, detail=f"직원 추가 실패: {str(e)}")


# ============================================================
# 3️⃣ GET /api/staff - 직원 목록
# ============================================================
@router.get("", response_model=StaffListResponse)
async def get_staff_list(
    department: Optional[str] = Query(None, description="부서 필터"),
    job_title: Optional[str] = Query(None, description="직책 필터"),
    employment_type: Optional[str] = Query(None, description="고용 형태"),
    position: Optional[str] = Query(None, description="직급 필터"),
    is_active: Optional[int] = Query(None, description="활성 여부 (1=활성, 0=비활성)"),
    search: Optional[str] = Query(None, description="이름 검색"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """직원 목록을 조회합니다."""
    try:
        query = select(Staff)

        # 필터 적용
        if department:
            query = query.where(Staff.department == department)
        if job_title:
            query = query.where(Staff.job_title == job_title)
        if employment_type:
            query = query.where(Staff.employment_type == employment_type)
        if position:
            query = query.where(Staff.position.ilike(f"%{position}%"))
        if is_active is not None:
            query = query.where(Staff.is_active == is_active)
        if search:
            query = query.where(Staff.name.ilike(f"%{search}%"))

        # 총 개수
        total_result = await db.execute(select(func.count(Staff.id)))
        total = total_result.scalar() or 0

        # 페이지 처리
        query = query.order_by(Staff.name).offset(offset).limit(limit)
        result = await db.execute(query)
        staff_list = result.scalars().all()

        return StaffListResponse(
            total=total,
            count=len(staff_list),
            items=staff_list,
        )

    except Exception as e:
        logger.error(f"❌ 직원 목록 조회 실패: {str(e)}")
        raise HTTPException(status_code=500, detail=f"조회 실패: {str(e)}")


# ============================================================
# 4️⃣ GET /api/staff/{id} - 직원 상세
# ============================================================
@router.get("/{staff_id}", response_model=StaffResponse)
async def get_staff_detail(
    staff_id: int,
    db: AsyncSession = Depends(get_db),
):
    """직원 상세 정보를 조회합니다."""
    try:
        result = await db.execute(select(Staff).where(Staff.id == staff_id))
        staff = result.scalar()

        if not staff:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"직원을 찾을 수 없습니다: ID {staff_id}",
            )

        return staff

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 직원 조회 실패: {str(e)}")
        raise HTTPException(status_code=500, detail=f"조회 실패: {str(e)}")


# ============================================================
# 5️⃣ PUT /api/staff/{id} - 직원 정보 수정
# ============================================================
@router.put("/{staff_id}", response_model=StaffResponse)
async def update_staff(
    staff_id: int,
    staff_data: StaffUpdate,
    db: AsyncSession = Depends(get_db),
):
    """직원 정보를 수정합니다."""
    try:
        result = await db.execute(select(Staff).where(Staff.id == staff_id))
        staff = result.scalar()

        if not staff:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"직원을 찾을 수 없습니다: ID {staff_id}",
            )

        # 부서 검증
        if staff_data.department and staff_data.department not in VALID_DEPARTMENTS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"유효하지 않은 부서: {staff_data.department}"
            )

        # 직책 검증 (부서가 제공된 경우)
        department = staff_data.department or staff.department
        if staff_data.job_title and staff_data.job_title not in DEPARTMENT_JOB_TITLES[department]:
            valid_titles = ", ".join(DEPARTMENT_JOB_TITLES[department])
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"'{department}' 부서의 유효하지 않은 직책: {staff_data.job_title}. 유효한 직책: {valid_titles}"
            )

        # 수정 필드 적용
        update_data = staff_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                setattr(staff, field, value)

        await db.commit()
        await db.refresh(staff)

        logger.info(f"✅ 직원 정보 수정: {staff.name}")
        return staff

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"❌ 직원 수정 실패: {str(e)}")
        raise HTTPException(status_code=500, detail=f"수정 실패: {str(e)}")


# ============================================================
# 6️⃣ GET /api/staff/config/departments - 부서/직책 설정
# ============================================================
@router.get("/config/departments", response_model=dict)
async def get_department_config():
    """부서별 직책 매핑을 반환합니다."""
    return {
        "departments": VALID_DEPARTMENTS,
        "department_job_titles": DEPARTMENT_JOB_TITLES,
    }


# ============================================================
# 7️⃣ 통계 엔드포인트
# ============================================================
@router.get("/stats/by-department", response_model=dict)
async def get_staff_stats_by_department(
    db: AsyncSession = Depends(get_db),
):
    """부서별 직원 통계"""
    try:
        result = await db.execute(
            select(
                Staff.department,
                Staff.job_title,
                func.count(Staff.id).label("count"),
            ).group_by(Staff.department, Staff.job_title)
        )

        stats = result.all()
        return {
            "stats": [
                {"department": row[0], "job_title": row[1], "count": row[2]}
                for row in stats
            ]
        }

    except Exception as e:
        logger.error(f"❌ 통계 조회 실패: {str(e)}")
        raise HTTPException(status_code=500, detail=f"조회 실패: {str(e)}")


@router.get("/stats/by-type", response_model=dict)
async def get_staff_stats_by_type(
    db: AsyncSession = Depends(get_db),
):
    """직원 분류별 통계 (레거시 호환)"""
    try:
        result = await db.execute(
            select(
                Staff.employment_type,
                func.count(Staff.id).label("count"),
            ).group_by(Staff.employment_type)
        )

        stats = result.all()
        return {
            "stats": [
                {"employment_type": row[0], "count": row[1]} for row in stats
            ]
        }

    except Exception as e:
        logger.error(f"❌ 통계 조회 실패: {str(e)}")
        raise HTTPException(status_code=500, detail=f"조회 실패: {str(e)}")
