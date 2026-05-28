"""
============================================================
📌 파일명: beds_split.py
📋 목적: 침대 그룹 분할 API 엔드포인트
🔧 엔드포인트: PUT /api/admin/beds/reorganize
📅 작성일: 2026-05-28
============================================================
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional
from app.database import get_db
from app.models import BedGroup, Bed
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin/beds", tags=["beds"])


class BedGroupSplit(BaseModel):
    """침대 그룹 분할 요청 스키마"""
    name: str = Field(..., description="그룹명")
    description: Optional[str] = Field(None, description="그룹 설명")
    bedIds: List[str] = Field(..., description="침대 ID 리스트")


class BedSplitRequest(BaseModel):
    """그룹 분할 API 요청 스키마"""
    groupId: str = Field(..., description="분할할 그룹 ID")
    splitInto: int = Field(..., ge=2, le=10, description="분할할 그룹 수")
    newGroups: List[BedGroupSplit] = Field(..., description="분할된 새로운 그룹들")


class BedSplitResponse(BaseModel):
    """그룹 분할 API 응답 스키마"""
    success: bool
    message: str
    newGroupIds: Optional[List[str]] = None
    error: Optional[str] = None


# ============================================================
# 📌 엔드포인트: PUT /api/admin/beds/reorganize
# 📋 목적: 침대 그룹 분할
# 🔧 요청 본문: BedSplitRequest
# 📤 응답: BedSplitResponse
# 📅 작성일: 2026-05-28
# ============================================================
@router.put("/reorganize", response_model=BedSplitResponse)
async def reorganize_beds(
    request: BedSplitRequest,
    db: Session = Depends(get_db)
):
    """
    침대 그룹을 분할하는 API

    **요청 매개변수:**
    - `groupId`: 분할할 그룹의 ID
    - `splitInto`: 분할할 그룹의 수 (2~10)
    - `newGroups`: 분할된 새로운 그룹 정보 (각 그룹의 이름, 설명, 침대 ID)

    **응답:**
    - `success`: 분할 성공 여부
    - `message`: 결과 메시지
    - `newGroupIds`: 생성된 새로운 그룹 ID 리스트
    - `error`: 오류 메시지 (실패 시)

    **예시:**
    ```json
    {
      "groupId": "group-001",
      "splitInto": 2,
      "newGroups": [
        {
          "name": "마사지실1 - Group A - Part 1",
          "description": "분할 파트 1",
          "bedIds": ["BED-001", "BED-002", ..., "BED-007"]
        },
        {
          "name": "마사지실1 - Group A - Part 2",
          "description": "분할 파트 2",
          "bedIds": ["BED-008", "BED-009", ..., "BED-015"]
        }
      ]
    }
    ```
    """
    try:
        # 1. 기존 그룹 조회 및 검증
        existing_group = db.query(BedGroup).filter(
            BedGroup.id == request.groupId
        ).first()

        if not existing_group:
            logger.warning(f"그룹을 찾을 수 없습니다: {request.groupId}")
            raise HTTPException(
                status_code=404,
                detail="해당 그룹을 찾을 수 없습니다."
            )

        # 2. 분할 수 유효성 검사
        if request.splitInto < 2 or request.splitInto > 10:
            raise HTTPException(
                status_code=400,
                detail="분할 수는 2~10 사이여야 합니다."
            )

        if request.splitInto != len(request.newGroups):
            raise HTTPException(
                status_code=400,
                detail=f"분할 수({request.splitInto})와 제공된 그룹 수({len(request.newGroups)})가 일치하지 않습니다."
            )

        # 3. 침대 총합 검증
        total_beds_in_request = sum(len(group.bedIds) for group in request.newGroups)
        if total_beds_in_request != len(existing_group.bedIds):
            raise HTTPException(
                status_code=400,
                detail=f"분할된 침대 총합({total_beds_in_request})이 기존 그룹의 침대 수({len(existing_group.bedIds)})와 일치하지 않습니다."
            )

        # 4. 기존 그룹 삭제
        db.delete(existing_group)
        logger.info(f"기존 그룹 삭제: {request.groupId}")

        # 5. 새로운 그룹 생성
        new_group_ids = []
        for idx, new_group_data in enumerate(request.newGroups):
            new_group = BedGroup(
                name=new_group_data.name,
                description=new_group_data.description or "",
                bedIds=new_group_data.bedIds,
            )
            db.add(new_group)
            db.flush()  # ID 생성
            new_group_ids.append(str(new_group.id))
            logger.info(f"새로운 그룹 생성: {new_group.id} ({len(new_group_data.bedIds)}개 침대)")

        # 6. 변경 사항 저장
        db.commit()
        logger.info(f"침대 그룹 분할 완료: {request.groupId} → {len(new_group_ids)}개 그룹")

        return BedSplitResponse(
            success=True,
            message=f"그룹을 성공적으로 {request.splitInto}개로 분할했습니다.",
            newGroupIds=new_group_ids,
        )

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"침대 그룹 분할 중 오류 발생: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"그룹 분할 중 오류가 발생했습니다: {str(e)}"
        )


# ============================================================
# 📌 엔드포인트: GET /api/admin/beds/groups
# 📋 목적: 모든 침대 그룹 조회
# 📤 응답: List[BedGroupDetail]
# 📅 작성일: 2026-05-28
# ============================================================
@router.get("/groups")
async def get_all_bed_groups(db: Session = Depends(get_db)):
    """모든 침대 그룹 조회"""
    try:
        groups = db.query(BedGroup).all()
        return {
            "success": True,
            "groups": [
                {
                    "id": str(group.id),
                    "name": group.name,
                    "description": group.description,
                    "bedIds": group.bedIds,
                    "bedCount": len(group.bedIds),
                    "createdAt": group.createdAt.isoformat() if hasattr(group, 'createdAt') else None,
                    "updatedAt": group.updatedAt.isoformat() if hasattr(group, 'updatedAt') else None,
                }
                for group in groups
            ]
        }
    except Exception as e:
        logger.error(f"침대 그룹 조회 중 오류 발생: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="침대 그룹을 조회할 수 없습니다."
        )
