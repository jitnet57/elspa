# ============================================================
# 📌 라우터명: Knowledge Network Edges Database API
# 📋 목적: PostgreSQL 기반 엣지 관리 API (양방향 관계 지원)
# 🔧 기능: 엣지 CRUD, 양방향 자동 생성, 필터링
# 📅 작성일: 2026-05-29
# ============================================================

"""
📝 설명:
이 라우터는 PostgreSQL 데이터베이스 기반의 지식 네트워크 엣지 API를 제공합니다.

**엔드포인트:**
1. GET /api/network-edges — 모든 엣지 조회 (필터 선택)
2. POST /api/network-edges — 새 엣지 추가 (양방향 옵션)
3. GET /api/network-edges/{edge_id} — 특정 엣지 상세 조회
4. PUT /api/network-edges/{edge_id} — 엣지 수정
5. DELETE /api/network-edges/{edge_id} — 엣지 삭제
6. GET /api/network-edges/source/{source_id} — 출발 노드 기준 조회
7. GET /api/network-edges/target/{target_id} — 도착 노드 기준 조회
8. POST /api/network-edges/batch — 일괄 추가
9. GET /api/nodes/{node_id}/importance — 노드 중요도 계산
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db_sync as get_db
from app.models.network_edge import KnowledgeNetworkEdge
from app.models.knowledge_network import KnowledgeNetworkNode
from app.services.network_edge_service import NetworkEdgeService
from app.utils.logging_config import get_logger
from pydantic import BaseModel, Field

# 로깅
logger = get_logger(__name__)

# 라우터 정의
router = APIRouter(
    prefix="/api/network-edges",
    tags=["Network Edges (DB)"]
)

# ============================================================
# Pydantic 스키마
# ============================================================


class NetworkEdgeCreateSchema(BaseModel):
    """새 엣지 생성 요청"""

    source_id: int = Field(..., example=1, description="출발 노드 ID")
    target_id: int = Field(..., example=2, description="도착 노드 ID")
    relationship_type: str = Field(..., example="제공", description="관계 유형")
    strength: int = Field(3, ge=1, le=5, description="관계 강도 (1-5)")
    label: Optional[str] = Field(None, example="제공", description="선 위 라벨")
    description: Optional[str] = Field(None, description="관계 설명")
    color: Optional[str] = Field("#3b82f6", example="#3b82f6", description="색상")
    is_bidirectional: bool = Field(False, description="양방향 관계 생성 여부")


class NetworkEdgeUpdateSchema(BaseModel):
    """엣지 수정 요청"""

    strength: Optional[int] = Field(None, ge=1, le=5, description="관계 강도")
    label: Optional[str] = Field(None, description="선 위 라벨")
    description: Optional[str] = Field(None, description="관계 설명")
    color: Optional[str] = Field(None, description="색상")
    relationship_type: Optional[str] = Field(None, description="관계 유형")


class NetworkEdgeResponseSchema(BaseModel):
    """엣지 응답 스키마"""

    id: int
    source_id: int
    target_id: int
    relationship_type: str
    label: Optional[str]
    description: Optional[str]
    strength: int
    color: Optional[str]
    is_bidirectional: bool
    created_at: str

    class Config:
        from_attributes = True


class NetworkEdgeListResponseSchema(BaseModel):
    """엣지 목록 응답"""

    edges: List[NetworkEdgeResponseSchema]
    total: int


class NetworkEdgeBatchCreateSchema(BaseModel):
    """일괄 엣지 생성 요청"""

    edges: List[NetworkEdgeCreateSchema]


class NodeImportanceResponseSchema(BaseModel):
    """노드 중요도 응답"""

    node_id: int
    in_degree: int
    out_degree: int
    total_degree: int
    total_strength: int
    avg_strength: float


# ============================================================
# 엔드포인트: GET /api/network-edges
# ============================================================


@router.get("", response_model=NetworkEdgeListResponseSchema)
def get_all_edges(
    source_id: Optional[int] = Query(None, description="출발 노드 필터"),
    target_id: Optional[int] = Query(None, description="도착 노드 필터"),
    relationship_type: Optional[str] = Query(None, description="관계 유형 필터"),
    min_strength: int = Query(1, ge=1, le=5, description="최소 강도"),
    max_strength: int = Query(5, ge=1, le=5, description="최대 강도"),
    skip: int = Query(0, ge=0, description="건너뛸 개수"),
    limit: int = Query(100, ge=1, le=200, description="반환할 최대 개수"),
    db: Session = Depends(get_db),
):
    """
    📌 함수: get_all_edges
    📋 목적: 모든 엣지를 조회합니다 (필터링 옵션 포함)
    """

    logger.info(
        f"📖 엣지 조회: source={source_id}, target={target_id}, "
        f"type={relationship_type}, strength={min_strength}-{max_strength}"
    )

    try:
        service = NetworkEdgeService(db)
        edges, total = service.search_edges(
            source_id=source_id,
            target_id=target_id,
            relationship_type=relationship_type,
            min_strength=min_strength,
            max_strength=max_strength,
            skip=skip,
            limit=limit,
        )

        return NetworkEdgeListResponseSchema(
            edges=[NetworkEdgeResponseSchema.from_orm(e) for e in edges],
            total=total,
        )

    except Exception as e:
        logger.error(f"❌ 엣지 조회 실패: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="엣지 조회 중 오류가 발생했습니다.")


# ============================================================
# 엔드포인트: POST /api/network-edges
# ============================================================


@router.post("", response_model=NetworkEdgeResponseSchema)
def create_edge(
    request: NetworkEdgeCreateSchema,
    db: Session = Depends(get_db),
):
    """
    📌 함수: create_edge
    📋 목적: 새로운 엣지를 추가합니다.
    🔧 특징: is_bidirectional=true면 역방향 엣지도 자동 생성
    """

    logger.info(
        f"➕ 엣지 추가: {request.source_id} → {request.target_id} "
        f"(양방향: {request.is_bidirectional})"
    )

    try:
        service = NetworkEdgeService(db)
        edge = service.create_edge(
            source_id=request.source_id,
            target_id=request.target_id,
            relationship_type=request.relationship_type,
            strength=request.strength,
            label=request.label,
            description=request.description,
            color=request.color,
            is_bidirectional=request.is_bidirectional,
        )

        logger.info(f"✅ 엣지 생성 완료: {edge.id}")

        return NetworkEdgeResponseSchema.from_orm(edge)

    except ValueError as e:
        logger.error(f"⚠️ 엣지 추가 실패: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"❌ 엣지 추가 중 오류: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="엣지 추가 중 오류가 발생했습니다.")


# ============================================================
# 엔드포인트: GET /api/network-edges/{edge_id}
# ============================================================


@router.get("/{edge_id}", response_model=NetworkEdgeResponseSchema)
def get_edge_by_id(
    edge_id: int,
    db: Session = Depends(get_db),
):
    """
    📌 함수: get_edge_by_id
    📋 목적: 특정 엣지의 상세 정보를 조회합니다.
    """

    logger.info(f"🔎 엣지 상세 조회: {edge_id}")

    try:
        service = NetworkEdgeService(db)
        edge = service.get_edge_by_id(edge_id)

        if not edge:
            logger.warning(f"⚠️ 엣지를 찾을 수 없습니다: {edge_id}")
            raise HTTPException(status_code=404, detail=f"엣지를 찾을 수 없습니다: {edge_id}")

        return NetworkEdgeResponseSchema.from_orm(edge)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 엣지 조회 실패: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="엣지 조회 중 오류가 발생했습니다.")


# ============================================================
# 엔드포인트: PUT /api/network-edges/{edge_id}
# ============================================================


@router.put("/{edge_id}", response_model=NetworkEdgeResponseSchema)
def update_edge(
    edge_id: int,
    request: NetworkEdgeUpdateSchema,
    db: Session = Depends(get_db),
):
    """
    📌 함수: update_edge
    📋 목적: 엣지 정보를 수정합니다.
    🔧 주의: 양방향 엣지면 역방향도 자동 업데이트
    """

    logger.info(f"✏️ 엣지 수정: {edge_id}")

    try:
        service = NetworkEdgeService(db)
        edge = service.update_edge(
            edge_id=edge_id,
            strength=request.strength,
            label=request.label,
            description=request.description,
            color=request.color,
            relationship_type=request.relationship_type,
        )

        if not edge:
            raise HTTPException(status_code=404, detail=f"엣지를 찾을 수 없습니다: {edge_id}")

        logger.info(f"✅ 엣지 수정 완료: {edge_id}")

        return NetworkEdgeResponseSchema.from_orm(edge)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 엣지 수정 실패: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="엣지 수정 중 오류가 발생했습니다.")


# ============================================================
# 엔드포인트: DELETE /api/network-edges/{edge_id}
# ============================================================


@router.delete("/{edge_id}")
def delete_edge(
    edge_id: int,
    db: Session = Depends(get_db),
):
    """
    📌 함수: delete_edge
    📋 목적: 엣지를 삭제합니다.
    🔧 주의: 양방향 엣지면 역방향도 함께 삭제
    """

    logger.info(f"🗑️ 엣지 삭제: {edge_id}")

    try:
        service = NetworkEdgeService(db)
        success = service.delete_edge(edge_id)

        if not success:
            raise HTTPException(status_code=404, detail=f"엣지를 찾을 수 없습니다: {edge_id}")

        logger.info(f"✅ 엣지 삭제 완료: {edge_id}")

        return {
            "success": True,
            "message": f"엣지가 삭제되었습니다: {edge_id}",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 엣지 삭제 실패: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="엣지 삭제 중 오류가 발생했습니다.")


# ============================================================
# 엔드포인트: GET /api/network-edges/source/{source_id}
# ============================================================


@router.get("/source/{source_id}", response_model=NetworkEdgeListResponseSchema)
def get_edges_by_source(
    source_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """
    📌 함수: get_edges_by_source
    📋 목적: 출발 노드 기준으로 모든 엣지를 조회합니다.
    """

    logger.info(f"📖 출발 엣지 조회: source_id={source_id}")

    try:
        service = NetworkEdgeService(db)
        edges, total = service.get_edges_by_source(source_id, skip=skip, limit=limit)

        return NetworkEdgeListResponseSchema(
            edges=[NetworkEdgeResponseSchema.from_orm(e) for e in edges],
            total=total,
        )

    except Exception as e:
        logger.error(f"❌ 출발 엣지 조회 실패: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="엣지 조회 중 오류가 발생했습니다.")


# ============================================================
# 엔드포인트: GET /api/network-edges/target/{target_id}
# ============================================================


@router.get("/target/{target_id}", response_model=NetworkEdgeListResponseSchema)
def get_edges_by_target(
    target_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """
    📌 함수: get_edges_by_target
    📋 목적: 도착 노드 기준으로 모든 엣지를 조회합니다.
    """

    logger.info(f"📖 도착 엣지 조회: target_id={target_id}")

    try:
        service = NetworkEdgeService(db)
        edges, total = service.get_edges_by_target(target_id, skip=skip, limit=limit)

        return NetworkEdgeListResponseSchema(
            edges=[NetworkEdgeResponseSchema.from_orm(e) for e in edges],
            total=total,
        )

    except Exception as e:
        logger.error(f"❌ 도착 엣지 조회 실패: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="엣지 조회 중 오류가 발생했습니다.")


# ============================================================
# 엔드포인트: POST /api/network-edges/batch
# ============================================================


@router.post("/batch", response_model=NetworkEdgeListResponseSchema)
def create_edges_batch(
    request: NetworkEdgeBatchCreateSchema,
    db: Session = Depends(get_db),
):
    """
    📌 함수: create_edges_batch
    📋 목적: 여러 엣지를 일괄로 추가합니다.
    🔧 특징: 트랜잭션 처리로 안정성 보장
    """

    logger.info(f"➕ 일괄 엣지 추가: {len(request.edges)}개")

    try:
        service = NetworkEdgeService(db)

        edges_data = [e.dict() for e in request.edges]
        created_edges, success_count = service.create_edges_batch(edges_data)

        logger.info(f"✅ 일괄 추가 완료: {success_count}/{len(request.edges)}")

        return NetworkEdgeListResponseSchema(
            edges=[NetworkEdgeResponseSchema.from_orm(e) for e in created_edges],
            total=success_count,
        )

    except Exception as e:
        logger.error(f"❌ 일괄 추가 중 오류: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="일괄 추가 중 오류가 발생했습니다.")


# ============================================================
# 엔드포인트: GET /api/nodes/{node_id}/importance
# ============================================================


@router.get("/nodes/{node_id}/importance", response_model=NodeImportanceResponseSchema)
def get_node_importance(
    node_id: int,
    db: Session = Depends(get_db),
):
    """
    📌 함수: get_node_importance
    📋 목적: 노드의 중요도를 계산합니다.
    📤 반환값: in_degree, out_degree, 평균 강도 등
    """

    logger.info(f"📊 노드 중요도 계산: {node_id}")

    try:
        service = NetworkEdgeService(db)
        importance = service.calculate_node_importance(node_id)

        return NodeImportanceResponseSchema(**importance)

    except Exception as e:
        logger.error(f"❌ 노드 중요도 계산 실패: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="중요도 계산 중 오류가 발생했습니다.")
