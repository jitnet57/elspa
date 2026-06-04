# ============================================================
# 📌 라우터명: Knowledge Network API
# 📋 목적: ElSpa 지식 네트워크 CRUD 및 검색 API 엔드포인트
# 🔧 기능: 노드 조회, 검색, 상세 정보 조회
# 📅 작성일: 2026-05-29
# ============================================================

"""
📝 설명:
이 라우터는 지식 네트워크 3D 시각화를 위한 백엔드 API를 제공합니다.

**엔드포인트:**
1. GET /api/knowledge-network/nodes — 모든 노드 조회 (카테고리 필터 선택)
2. POST /api/knowledge-network/search — 키워드 기반 검색
3. GET /api/knowledge-network/nodes/{id} — 특정 노드의 상세 정보
4. GET /api/knowledge-network/categories — 전체 카테고리 목록
5. POST /api/knowledge-network/nodes — 새 노드 추가 (관리자용)
6. PUT /api/knowledge-network/nodes/{id} — 노드 수정 (관리자용)
7. DELETE /api/knowledge-network/nodes/{id} — 노드 삭제 (관리자용)
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.knowledge_network import KnowledgeNetworkNode
from app.utils.logging_config import get_logger

# 로깅
logger = get_logger(__name__)

# 라우터 정의
router = APIRouter(
    prefix="/api/knowledge-network",
    tags=["Knowledge Network"]
)

# ============================================================
# Pydantic 스키마 (요청/응답)
# ============================================================

from pydantic import BaseModel, Field


class KnowledgeNetworkNodeSchema(BaseModel):
    """
    📝 설명:
    지식 네트워크 노드 데이터 스키마입니다.
    프론트엔드 Three.js와 호환성을 위해 id, label, description, category, color를 제공합니다.
    """

    id: str = Field(..., example="massage-thai", description="노드 고유 식별자")
    label: str = Field(..., example="타이 마사지", description="노드 제목")
    description: str = Field(..., example="전통 태국식 마사지", description="노드 상세 설명")
    category: str = Field(..., example="마사지", description="노드 카테고리")
    color: str = Field(..., example="#3b82f6", description="HEX 색상 코드")

    class Config:
        from_attributes = True


class KnowledgeNetworkNodeCreateSchema(BaseModel):
    """
    📝 설명:
    새로운 노드를 생성할 때 사용하는 스키마입니다.
    """

    node_id: str = Field(..., example="massage-thai", description="노드 고유 식별자")
    label: str = Field(..., example="타이 마사지", description="노드 제목")
    description: str = Field(..., example="전통 태국식 마사지", description="노드 상세 설명")
    category: str = Field(..., example="마사지", description="노드 카테고리")
    color: str = Field(..., example="#3b82f6", description="HEX 색상 코드")


class KnowledgeNetworkSearchRequestSchema(BaseModel):
    """
    📝 설명:
    키워드 기반 검색 요청 스키마입니다.
    라벨, 설명, 카테고리에서 검색을 수행합니다.
    """

    query: str = Field(..., min_length=1, example="마사지", description="검색 키워드")
    category: Optional[str] = Field(None, example="마사지", description="카테고리 필터 (선택)")
    limit: int = Field(10, ge=1, le=100, description="결과 최대 개수")


class KnowledgeNetworkResponseSchema(BaseModel):
    """
    📝 설명:
    노드 목록 응답 스키마입니다.
    총 개수와 노드 배열을 포함합니다.
    """

    nodes: List[KnowledgeNetworkNodeSchema]
    total: int = Field(..., example=16, description="전체 노드 개수")


class KnowledgeNetworkSearchResponseSchema(BaseModel):
    """
    📝 설명:
    검색 결과 응답 스키마입니다.
    검색된 노드 배열과 개수를 포함합니다.
    """

    results: List[KnowledgeNetworkNodeSchema]
    count: int = Field(..., example=4, description="검색된 결과 개수")
    query: str = Field(..., example="마사지", description="검색 키워드")


# ============================================================
# 엔드포인트: GET /api/knowledge-network/nodes
# ============================================================


@router.get("/nodes", response_model=KnowledgeNetworkResponseSchema)
async def get_all_nodes(
    category: Optional[str] = Query(None, description="카테고리 필터 (선택)"),
    skip: int = Query(0, ge=0, description="건너뛸 개수"),
    limit: int = Query(100, ge=1, le=100, description="반환할 최대 개수"),
    db: Session = Depends(get_db),
):
    """
    📌 함수: get_all_nodes
    📋 목적: 모든 지식 네트워크 노드를 조회합니다.
    🔧 매개변수:
       - category: 카테고리별 필터링 (선택사항)
       - skip: 페이지네이션 오프셋
       - limit: 페이지네이션 리미트
    📤 반환값: {nodes: NetworkNode[], total: number}
    """

    logger.info(f"📖 노드 조회: category={category}, skip={skip}, limit={limit}")

    try:
        # 쿼리 빌드
        query = db.query(KnowledgeNetworkNode)

        # 카테고리 필터 적용
        if category:
            query = query.filter(KnowledgeNetworkNode.category == category)

        # 전체 개수 조회
        total = query.count()

        # 페이지네이션 적용
        nodes = query.offset(skip).limit(limit).all()

        # 응답 생성
        return KnowledgeNetworkResponseSchema(
            nodes=[KnowledgeNetworkNodeSchema(
                id=node.node_id,
                label=node.label,
                description=node.description,
                category=node.category,
                color=node.color,
            ) for node in nodes],
            total=total,
        )

    except Exception as e:
        logger.error(f"❌ 노드 조회 실패: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="노드 조회 중 오류가 발생했습니다.")


# ============================================================
# 엔드포인트: POST /api/knowledge-network/search
# ============================================================


@router.post("/search", response_model=KnowledgeNetworkSearchResponseSchema)
async def search_nodes(
    request: KnowledgeNetworkSearchRequestSchema,
    db: Session = Depends(get_db),
):
    """
    📌 함수: search_nodes
    📋 목적: 키워드 기반 검색을 수행합니다. (라벨, 설명, 카테고리)
    🔧 매개변수:
       - query: 검색 키워드
       - category: 카테고리 필터 (선택)
       - limit: 결과 최대 개수
    📤 반환값: {results: NetworkNode[], count: number, query: string}
    """

    logger.info(f"🔍 노드 검색: query={request.query}, category={request.category}")

    try:
        # 기본 쿼리 (라벨, 설명에서 검색)
        query = db.query(KnowledgeNetworkNode).filter(
            or_(
                KnowledgeNetworkNode.label.ilike(f"%{request.query}%"),
                KnowledgeNetworkNode.description.ilike(f"%{request.query}%"),
                KnowledgeNetworkNode.category.ilike(f"%{request.query}%"),
            )
        )

        # 카테고리 필터 추가 (선택)
        if request.category:
            query = query.filter(KnowledgeNetworkNode.category == request.category)

        # 결과 조회
        results = query.limit(request.limit).all()

        # 응답 생성
        return KnowledgeNetworkSearchResponseSchema(
            results=[KnowledgeNetworkNodeSchema(
                id=node.node_id,
                label=node.label,
                description=node.description,
                category=node.category,
                color=node.color,
            ) for node in results],
            count=len(results),
            query=request.query,
        )

    except Exception as e:
        logger.error(f"❌ 검색 실패: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="검색 중 오류가 발생했습니다.")


# ============================================================
# 엔드포인트: GET /api/knowledge-network/nodes/{node_id}
# ============================================================


@router.get("/nodes/{node_id}", response_model=KnowledgeNetworkNodeSchema)
async def get_node_by_id(
    node_id: str,
    db: Session = Depends(get_db),
):
    """
    📌 함수: get_node_by_id
    📋 목적: 특정 노드의 상세 정보를 조회합니다.
    🔧 매개변수:
       - node_id: 노드 고유 식별자 (예: massage-thai)
    📤 반환값: NetworkNode 객체 또는 404 에러
    """

    logger.info(f"🔎 노드 상세 조회: node_id={node_id}")

    try:
        # 데이터베이스에서 노드 검색
        node = db.query(KnowledgeNetworkNode).filter(
            KnowledgeNetworkNode.node_id == node_id
        ).first()

        # 노드가 없으면 404 반환
        if not node:
            logger.warning(f"⚠️ 노드를 찾을 수 없습니다: {node_id}")
            raise HTTPException(status_code=404, detail=f"노드를 찾을 수 없습니다: {node_id}")

        # 응답 생성
        return KnowledgeNetworkNodeSchema(
            id=node.node_id,
            label=node.label,
            description=node.description,
            category=node.category,
            color=node.color,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 노드 조회 실패: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="노드 조회 중 오류가 발생했습니다.")


# ============================================================
# 엔드포인트: GET /api/knowledge-network/categories
# ============================================================


@router.get("/categories", response_model=dict)
async def get_categories(
    db: Session = Depends(get_db),
):
    """
    📌 함수: get_categories
    📋 목적: 전체 카테고리 목록을 조회합니다.
    🔧 매개변수: (없음)
    📤 반환값: {categories: string[], count: number}
    """

    logger.info("📋 카테고리 목록 조회")

    try:
        # DISTINCT를 사용하여 모든 카테고리 조회
        categories = db.query(KnowledgeNetworkNode.category).distinct().all()
        category_list = sorted([cat[0] for cat in categories if cat[0]])

        return {
            "categories": category_list,
            "count": len(category_list),
        }

    except Exception as e:
        logger.error(f"❌ 카테고리 조회 실패: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="카테고리 조회 중 오류가 발생했습니다.")


# ============================================================
# 엔드포인트: POST /api/knowledge-network/nodes (관리자용)
# ============================================================


@router.post("/nodes", response_model=KnowledgeNetworkNodeSchema)
async def create_node(
    request: KnowledgeNetworkNodeCreateSchema,
    db: Session = Depends(get_db),
):
    """
    📌 함수: create_node
    📋 목적: 새로운 노드를 추가합니다. (관리자용)
    🔧 매개변수:
       - node_id: 노드 고유 식별자
       - label: 노드 제목
       - description: 노드 설명
       - category: 카테고리
       - color: HEX 색상 코드
    📤 반환값: 생성된 노드
    """

    logger.info(f"➕ 새 노드 추가: node_id={request.node_id}, label={request.label}")

    try:
        # 중복 확인
        existing = db.query(KnowledgeNetworkNode).filter(
            KnowledgeNetworkNode.node_id == request.node_id
        ).first()

        if existing:
            logger.warning(f"⚠️ 이미 존재하는 노드: {request.node_id}")
            raise HTTPException(status_code=400, detail=f"이미 존재하는 노드입니다: {request.node_id}")

        # 새 노드 생성
        new_node = KnowledgeNetworkNode(
            node_id=request.node_id,
            label=request.label,
            description=request.description,
            category=request.category,
            color=request.color,
        )

        db.add(new_node)
        db.commit()
        db.refresh(new_node)

        logger.info(f"✅ 노드 추가 완료: {request.node_id}")

        return KnowledgeNetworkNodeSchema(
            id=new_node.node_id,
            label=new_node.label,
            description=new_node.description,
            category=new_node.category,
            color=new_node.color,
        )

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ 노드 추가 실패: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="노드 추가 중 오류가 발생했습니다.")


# ============================================================
# 엔드포인트: PUT /api/knowledge-network/nodes/{node_id} (관리자용)
# ============================================================


@router.put("/nodes/{node_id}", response_model=KnowledgeNetworkNodeSchema)
async def update_node(
    node_id: str,
    request: KnowledgeNetworkNodeCreateSchema,
    db: Session = Depends(get_db),
):
    """
    📌 함수: update_node
    📋 목적: 기존 노드를 수정합니다. (관리자용)
    🔧 매개변수:
       - node_id: 노드 고유 식별자
       - request: 수정할 노드 데이터
    📤 반환값: 수정된 노드
    """

    logger.info(f"✏️ 노드 수정: node_id={node_id}")

    try:
        # 노드 검색
        node = db.query(KnowledgeNetworkNode).filter(
            KnowledgeNetworkNode.node_id == node_id
        ).first()

        if not node:
            logger.warning(f"⚠️ 노드를 찾을 수 없습니다: {node_id}")
            raise HTTPException(status_code=404, detail=f"노드를 찾을 수 없습니다: {node_id}")

        # 필드 업데이트
        node.label = request.label
        node.description = request.description
        node.category = request.category
        node.color = request.color
        node.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(node)

        logger.info(f"✅ 노드 수정 완료: {node_id}")

        return KnowledgeNetworkNodeSchema(
            id=node.node_id,
            label=node.label,
            description=node.description,
            category=node.category,
            color=node.color,
        )

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ 노드 수정 실패: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="노드 수정 중 오류가 발생했습니다.")


# ============================================================
# 엔드포인트: DELETE /api/knowledge-network/nodes/{node_id} (관리자용)
# ============================================================


@router.delete("/nodes/{node_id}")
async def delete_node(
    node_id: str,
    db: Session = Depends(get_db),
):
    """
    📌 함수: delete_node
    📋 목적: 노드를 삭제합니다. (관리자용)
    🔧 매개변수:
       - node_id: 노드 고유 식별자
    📤 반환값: {success: bool, message: string}
    """

    logger.info(f"🗑️ 노드 삭제: node_id={node_id}")

    try:
        # 노드 검색
        node = db.query(KnowledgeNetworkNode).filter(
            KnowledgeNetworkNode.node_id == node_id
        ).first()

        if not node:
            logger.warning(f"⚠️ 노드를 찾을 수 없습니다: {node_id}")
            raise HTTPException(status_code=404, detail=f"노드를 찾을 수 없습니다: {node_id}")

        # 삭제
        db.delete(node)
        db.commit()

        logger.info(f"✅ 노드 삭제 완료: {node_id}")

        return {
            "success": True,
            "message": f"노드가 삭제되었습니다: {node_id}",
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ 노드 삭제 실패: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="노드 삭제 중 오류가 발생했습니다.")
