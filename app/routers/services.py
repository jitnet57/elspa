from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.database import get_db
from app.models import Service
from app.schemas.service import ServiceCreate, ServiceUpdate, ServiceResponse

router = APIRouter(prefix="/api/services", tags=["services"])


@router.get("", response_model=List[ServiceResponse])
async def list_services(db: AsyncSession = Depends(get_db)):
    """서비스 목록"""
    result = await db.execute(select(Service).where(Service.is_active == 1))
    services = result.scalars().all()
    return services


@router.get("/{service_id}", response_model=ServiceResponse)
async def get_service(service_id: int, db: AsyncSession = Depends(get_db)):
    """서비스 상세"""
    result = await db.execute(select(Service).where(Service.id == service_id))
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="서비스를 찾을 수 없습니다")
    return service


@router.post("", response_model=ServiceResponse)
async def create_service(service: ServiceCreate, db: AsyncSession = Depends(get_db)):
    """서비스 등록"""
    db_service = Service(**service.dict())
    db.add(db_service)
    await db.commit()
    await db.refresh(db_service)
    return db_service


@router.put("/{service_id}", response_model=ServiceResponse)
async def update_service(service_id: int, service: ServiceUpdate, db: AsyncSession = Depends(get_db)):
    """서비스 수정"""
    result = await db.execute(select(Service).where(Service.id == service_id))
    db_service = result.scalar_one_or_none()
    if not db_service:
        raise HTTPException(status_code=404, detail="서비스를 찾을 수 없습니다")

    update_data = service.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_service, key, value)

    db.add(db_service)
    await db.commit()
    await db.refresh(db_service)
    return db_service
