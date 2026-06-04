# ============================================================
# 📌 라우터명: Knowledge Network Edges API
# 📋 목적: ElSpa 지식 네트워크의 연결선(엣지) CRUD 및 검색 API
# 🔧 기능: 연결선 생성, 조회, 수정, 삭제, 검색
# 📅 작성일: 2026-05-29
# ============================================================

"""
📝 설명:
이 라우터는 지식 네트워크의 연결선(엣지/관계) 정보를 관리합니다.

**엔드포인트:**
1. GET /api/knowledge-network/edges — 모든 연결선 조회 (필터 선택)
2. POST /api/knowledge-network/edges — 새 연결선 추가 (관리자용)
3. GET /api/knowledge-network/edges/{edge_id} — 특정 연결선 상세 조회
4. PUT /api/knowledge-network/edges/{edge_id} — 연결선 수정 (관리자용)
5. DELETE /api/knowledge-network/edges/{edge_id} — 연결선 삭제 (관리자용)
6. POST /api/knowledge-network/edges/search — 검색 및 필터링
7. GET /api/knowledge-network/nodes/{node_id}/edges — 특정 노드의 모든 연결선
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
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
    tags=["Knowledge Network Edges"]
)

# ============================================================
# Pydantic 스키마 (요청/응답)
# ============================================================

from pydantic import BaseModel, Field


class KnowledgeNetworkEdgeSchema(BaseModel):
    """
    📝 설명:
    지식 네트워크 연결선(엣지) 데이터 스키마입니다.
    노드 간의 관계 및 상호작용을 표현합니다.
    """

    id: str = Field(..., example="therapist-john_massage-thai", description="엣지 고유 식별자")
    source: str = Field(..., example="therapist-john", description="출발 노드 ID")
    target: str = Field(..., example="massage-thai", description="도착 노드 ID")
    relationship: str = Field(..., example="제공자", description="관계 유형")
    type: str = Field(..., example="서비스 제공", description="관계 분류")
    strength: int = Field(..., ge=1, le=5, example=4, description="관계 강도 (1-5)")
    description: str = Field(..., example="존이 타이 마사지를 제공합니다", description="관계 설명")
    label: Optional[str] = Field(None, example="제공", description="선 위 라벨 텍스트")
    color: Optional[str] = Field(None, example="#3b82f6", description="HEX 색상 코드")

    class Config:
        from_attributes = True


class KnowledgeNetworkEdgeCreateSchema(BaseModel):
    """
    📝 설명:
    새로운 연결선을 생성할 때 사용하는 스키마입니다.
    """

    edge_id: str = Field(..., example="therapist-john_massage-thai", description="엣지 고유 식별자")
    source: str = Field(..., example="therapist-john", description="출발 노드 ID")
    target: str = Field(..., example="massage-thai", description="도착 노드 ID")
    relationship: str = Field(..., example="제공자", description="관계 유형")
    type: str = Field(..., example="서비스 제공", description="관계 분류")
    strength: int = Field(..., ge=1, le=5, example=4, description="관계 강도 (1-5)")
    description: str = Field(..., example="존이 타이 마사지를 제공합니다", description="관계 설명")
    label: Optional[str] = Field(None, example="제공", description="선 위 라벨 텍스트")
    color: Optional[str] = Field(None, example="#3b82f6", description="HEX 색상 코드")


class KnowledgeNetworkEdgeResponseSchema(BaseModel):
    """
    📝 설명:
    연결선 목록 응답 스키마입니다.
    """

    edges: List[KnowledgeNetworkEdgeSchema]
    total: int = Field(..., example=20, description="전체 연결선 개수")


class KnowledgeNetworkEdgeSearchRequestSchema(BaseModel):
    """
    📝 설명:
    연결선 검색 요청 스키마입니다.
    """

    query: str = Field(..., min_length=1, example="마사지", description="검색 키워드")
    node_id: Optional[str] = Field(None, example="therapist-john", description="노드 ID 필터")
    relationship: Optional[str] = Field(None, example="제공자", description="관계 유형 필터")
    min_strength: int = Field(1, ge=1, le=5, description="최소 강도")
    max_strength: int = Field(5, ge=1, le=5, description="최대 강도")
    limit: int = Field(50, ge=1, le=200, description="결과 최대 개수")


class KnowledgeNetworkEdgeSearchResponseSchema(BaseModel):
    """
    📝 설명:
    연결선 검색 결과 응답 스키마입니다.
    """

    results: List[KnowledgeNetworkEdgeSchema]
    count: int = Field(..., example=5, description="검색된 결과 개수")
    query: str = Field(..., example="마사지", description="검색 키워드")


# ============================================================
# 더미 데이터 (임시 - 추후 DB 마이그레이션)
# ============================================================

# 🛠️ 주의: 실제로는 데이터베이스 테이블이 필요합니다.
# 현재는 메모리에 더미 데이터를 저장하고 있습니다.

MOCK_EDGES = [
    {
        "id": "therapist-john_massage-thai",
        "source": "therapist-john",
        "target": "massage-thai",
        "relationship": "제공자",
        "type": "서비스 제공",
        "strength": 5,
        "description": "존이 타이 마사지 전문가로서 고객에게 제공합니다. 경력 10년 이상의 경험을 바탕으로 최고 품질의 서비스를 제공합니다.",
        "label": "제공",
        "color": "#3b82f6",
    },
    {
        "id": "therapist-john_customer-segment-corporate",
        "source": "therapist-john",
        "target": "customer-segment-corporate",
        "relationship": "주요 고객층",
        "type": "타겟 고객",
        "strength": 4,
        "description": "존의 마사지는 기업 고객(회사원, 임원진)에게 매우 인기가 높습니다. 스트레스 관리와 웰니스 관리를 원하는 그룹입니다.",
        "label": "타겟",
        "color": "#10b981",
    },
    {
        "id": "massage-thai_customer-segment-corporate",
        "source": "massage-thai",
        "target": "customer-segment-corporate",
        "relationship": "주요 서비스",
        "type": "마사지 제공",
        "strength": 4,
        "description": "타이 마사지는 기업 고객들이 가장 많이 선호하는 서비스입니다. 근골격계 문제 해결과 스트레스 완화에 효과적입니다.",
        "label": "영향",
        "color": "#8b5cf6",
    },
    {
        "id": "therapist-maria_massage-aromatherapy",
        "source": "therapist-maria",
        "target": "massage-aromatherapy",
        "relationship": "전문 분야",
        "type": "서비스 제공",
        "strength": 5,
        "description": "마리아는 아로마테라피 전문가로서 5성 평점을 유지하고 있습니다. 개인 맞춤 서비스로 매우 유명합니다.",
        "label": "전문",
        "color": "#f59e0b",
    },
    {
        "id": "massage-aromatherapy_wellness-spa",
        "source": "massage-aromatherapy",
        "target": "wellness-spa",
        "relationship": "연계 서비스",
        "type": "웰니스 통합",
        "strength": 4,
        "description": "아로마테라피는 스파 서비스와 함께 제공되며, 전체적인 웰니스 경험을 향상시킵니다.",
        "label": "통합",
        "color": "#ec4899",
    },
    {
        "id": "therapist-david_massage-sports",
        "source": "therapist-david",
        "target": "massage-sports",
        "relationship": "전문 분야",
        "type": "서비스 제공",
        "strength": 5,
        "description": "데이빗은 스포츠 마사지 전문가로서 국가대표팀 경험이 있습니다. 운동선수들의 부상 회복에 전문화되어 있습니다.",
        "label": "전문",
        "color": "#f59e0b",
    },
    {
        "id": "therapist-david_customer-segment-athletes",
        "source": "therapist-david",
        "target": "customer-segment-athletes",
        "relationship": "주요 고객층",
        "type": "타겟 고객",
        "strength": 5,
        "description": "데이빗의 스포츠 마사지는 운동선수들에게 매우 인기가 높습니다. 성능 향상과 부상 회복에 도움이 됩니다.",
        "label": "타겟",
        "color": "#10b981",
    },
    {
        "id": "therapist-park_massage-korean",
        "source": "therapist-park",
        "target": "massage-korean",
        "relationship": "전문 분야",
        "type": "서비스 제공",
        "strength": 5,
        "description": "박 치료사는 한식 마사지 전문가로서 25년의 경력을 가지고 있습니다. 전통 한의학 이론을 실무에 적용합니다.",
        "label": "전문",
        "color": "#f59e0b",
    },
    {
        "id": "massage-korean_customer-segment-elderly",
        "source": "massage-korean",
        "target": "customer-segment-elderly",
        "relationship": "주요 서비스",
        "type": "마사지 제공",
        "strength": 4,
        "description": "한식 마사지는 시니어 고객들에게 매우 인기가 높습니다. 통증 완화와 혈액 순환 개선에 효과적입니다.",
        "label": "영향",
        "color": "#8b5cf6",
    },
    {
        "id": "massage-sports_customer-segment-athletes",
        "source": "massage-sports",
        "target": "customer-segment-athletes",
        "relationship": "주요 서비스",
        "type": "마사지 제공",
        "strength": 5,
        "description": "스포츠 마사지는 운동선수들의 최고 선호 서비스입니다. 성능 향상과 부상 회복을 지원합니다.",
        "label": "영향",
        "color": "#8b5cf6",
    },
]

# ============================================================
# 엔드포인트: GET /api/knowledge-network/edges
# ============================================================


@router.get("/edges", response_model=KnowledgeNetworkEdgeResponseSchema)
async def get_all_edges(
    source: Optional[str] = Query(None, description="출발 노드 필터"),
    target: Optional[str] = Query(None, description="도착 노드 필터"),
    relationship: Optional[str] = Query(None, description="관계 유형 필터"),
    min_strength: int = Query(1, ge=1, le=5, description="최소 강도"),
    max_strength: int = Query(5, ge=1, le=5, description="최대 강도"),
    skip: int = Query(0, ge=0, description="건너뛸 개수"),
    limit: int = Query(100, ge=1, le=200, description="반환할 최대 개수"),
    db: Session = Depends(get_db),
):
    """
    📌 함수: get_all_edges
    📋 목적: 모든 지식 네트워크 연결선을 조회합니다.
    🔧 매개변수:
       - source: 출발 노드 필터 (선택)
       - target: 도착 노드 필터 (선택)
       - relationship: 관계 유형 필터 (선택)
       - min_strength / max_strength: 강도 범위
    📤 반환값: {edges: Edge[], total: number}
    """

    logger.info(
        f"📖 연결선 조회: source={source}, target={target}, "
        f"relationship={relationship}, strength={min_strength}-{max_strength}"
    )

    try:
        # 필터링 적용
        filtered_edges = MOCK_EDGES[:]

        if source:
            filtered_edges = [e for e in filtered_edges if e["source"] == source]

        if target:
            filtered_edges = [e for e in filtered_edges if e["target"] == target]

        if relationship:
            filtered_edges = [
                e for e in filtered_edges
                if e["relationship"].lower() == relationship.lower()
            ]

        # 강도 범위 필터
        filtered_edges = [
            e for e in filtered_edges
            if min_strength <= e["strength"] <= max_strength
        ]

        # 전체 개수
        total = len(filtered_edges)

        # 페이지네이션
        edges = filtered_edges[skip : skip + limit]

        return KnowledgeNetworkEdgeResponseSchema(
            edges=[KnowledgeNetworkEdgeSchema(**edge) for edge in edges],
            total=total,
        )

    except Exception as e:
        logger.error(f"❌ 연결선 조회 실패: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="연결선 조회 중 오류가 발생했습니다.")


# ============================================================
# 엔드포인트: GET /api/knowledge-network/edges/{edge_id}
# ============================================================


@router.get("/edges/{edge_id}", response_model=KnowledgeNetworkEdgeSchema)
async def get_edge_by_id(
    edge_id: str,
    db: Session = Depends(get_db),
):
    """
    📌 함수: get_edge_by_id
    📋 목적: 특정 연결선의 상세 정보를 조회합니다.
    🔧 매개변수:
       - edge_id: 연결선 고유 식별자
    📤 반환값: Edge 객체 또는 404 에러
    """

    logger.info(f"🔎 연결선 상세 조회: edge_id={edge_id}")

    try:
        # 더미 데이터에서 검색
        edge = next((e for e in MOCK_EDGES if e["id"] == edge_id), None)

        if not edge:
            logger.warning(f"⚠️ 연결선을 찾을 수 없습니다: {edge_id}")
            raise HTTPException(
                status_code=404,
                detail=f"연결선을 찾을 수 없습니다: {edge_id}"
            )

        return KnowledgeNetworkEdgeSchema(**edge)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 연결선 조회 실패: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="연결선 조회 중 오류가 발생했습니다.")


# ============================================================
# 엔드포인트: GET /api/knowledge-network/nodes/{node_id}/edges
# ============================================================


@router.get("/nodes/{node_id}/edges", response_model=KnowledgeNetworkEdgeResponseSchema)
async def get_edges_by_node(
    node_id: str,
    direction: Optional[str] = Query(
        None,
        description="방향 필터 (incoming=도착, outgoing=출발, both=양쪽)"
    ),
    skip: int = Query(0, ge=0, description="건너뛸 개수"),
    limit: int = Query(100, ge=1, le=200, description="반환할 최대 개수"),
    db: Session = Depends(get_db),
):
    """
    📌 함수: get_edges_by_node
    📋 목적: 특정 노드와 연결된 모든 연결선을 조회합니다.
    🔧 매개변수:
       - node_id: 노드 고유 식별자
       - direction: 방향 필터 (incoming/outgoing/both)
    📤 반환값: {edges: Edge[], total: number}
    """

    logger.info(f"📖 노드 연결선 조회: node_id={node_id}, direction={direction}")

    try:
        # 필터링
        filtered_edges = MOCK_EDGES[:]

        if direction == "outgoing":
            filtered_edges = [e for e in filtered_edges if e["source"] == node_id]
        elif direction == "incoming":
            filtered_edges = [e for e in filtered_edges if e["target"] == node_id]
        else:  # both 또는 None
            filtered_edges = [
                e for e in filtered_edges
                if e["source"] == node_id or e["target"] == node_id
            ]

        total = len(filtered_edges)
        edges = filtered_edges[skip : skip + limit]

        return KnowledgeNetworkEdgeResponseSchema(
            edges=[KnowledgeNetworkEdgeSchema(**edge) for edge in edges],
            total=total,
        )

    except Exception as e:
        logger.error(f"❌ 노드 연결선 조회 실패: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="노드 연결선 조회 중 오류가 발생했습니다.")


# ============================================================
# 엔드포인트: POST /api/knowledge-network/edges/search
# ============================================================


@router.post("/edges/search", response_model=KnowledgeNetworkEdgeSearchResponseSchema)
async def search_edges(
    request: KnowledgeNetworkEdgeSearchRequestSchema,
    db: Session = Depends(get_db),
):
    """
    📌 함수: search_edges
    📋 목적: 키워드 기반으로 연결선을 검색합니다.
    🔧 매개변수:
       - query: 검색 키워드
       - node_id: 노드 필터 (선택)
       - relationship: 관계 유형 필터 (선택)
       - min_strength / max_strength: 강도 범위
    📤 반환값: {results: Edge[], count: number, query: string}
    """

    logger.info(f"🔍 연결선 검색: query={request.query}, node_id={request.node_id}")

    try:
        # 초기 필터링
        results = MOCK_EDGES[:]

        # 텍스트 검색
        query_lower = request.query.lower()
        results = [
            e for e in results
            if (
                query_lower in e["source"].lower()
                or query_lower in e["target"].lower()
                or query_lower in e["relationship"].lower()
                or query_lower in e["type"].lower()
                or query_lower in e["description"].lower()
                or query_lower in e["label"].lower() if e.get("label") else False
            )
        ]

        # 노드 필터
        if request.node_id:
            results = [
                e for e in results
                if e["source"] == request.node_id or e["target"] == request.node_id
            ]

        # 관계 필터
        if request.relationship:
            results = [
                e for e in results
                if e["relationship"].lower() == request.relationship.lower()
            ]

        # 강도 범위
        results = [
            e for e in results
            if request.min_strength <= e["strength"] <= request.max_strength
        ]

        # 결과 제한
        results = results[: request.limit]

        return KnowledgeNetworkEdgeSearchResponseSchema(
            results=[KnowledgeNetworkEdgeSchema(**edge) for edge in results],
            count=len(results),
            query=request.query,
        )

    except Exception as e:
        logger.error(f"❌ 연결선 검색 실패: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="연결선 검색 중 오류가 발생했습니다.")


# ============================================================
# 엔드포인트: POST /api/knowledge-network/edges (관리자용)
# ============================================================


@router.post("/edges", response_model=KnowledgeNetworkEdgeSchema)
async def create_edge(
    request: KnowledgeNetworkEdgeCreateSchema,
    db: Session = Depends(get_db),
):
    """
    📌 함수: create_edge
    📋 목적: 새로운 연결선을 추가합니다. (관리자용)
    🔧 매개변수:
       - edge_id, source, target, relationship, type, strength, description
    📤 반환값: 생성된 Edge 객체
    """

    logger.info(f"➕ 새 연결선 추가: {request.edge_id}")

    try:
        # 중복 확인
        if any(e["id"] == request.edge_id for e in MOCK_EDGES):
            logger.warning(f"⚠️ 이미 존재하는 연결선: {request.edge_id}")
            raise HTTPException(
                status_code=400,
                detail=f"이미 존재하는 연결선입니다: {request.edge_id}"
            )

        # 새 연결선 추가 (메모리)
        new_edge = {
            "id": request.edge_id,
            "source": request.source,
            "target": request.target,
            "relationship": request.relationship,
            "type": request.type,
            "strength": request.strength,
            "description": request.description,
            "label": request.label,
            "color": request.color,
        }

        MOCK_EDGES.append(new_edge)

        logger.info(f"✅ 연결선 추가 완료: {request.edge_id}")

        return KnowledgeNetworkEdgeSchema(**new_edge)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 연결선 추가 실패: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="연결선 추가 중 오류가 발생했습니다.")


# ============================================================
# 엔드포인트: PUT /api/knowledge-network/edges/{edge_id} (관리자용)
# ============================================================


@router.put("/edges/{edge_id}", response_model=KnowledgeNetworkEdgeSchema)
async def update_edge(
    edge_id: str,
    request: KnowledgeNetworkEdgeCreateSchema,
    db: Session = Depends(get_db),
):
    """
    📌 함수: update_edge
    📋 목적: 기존 연결선을 수정합니다. (관리자용)
    """

    logger.info(f"✏️ 연결선 수정: {edge_id}")

    try:
        # 엣지 검색
        edge = next((e for e in MOCK_EDGES if e["id"] == edge_id), None)

        if not edge:
            logger.warning(f"⚠️ 연결선을 찾을 수 없습니다: {edge_id}")
            raise HTTPException(
                status_code=404,
                detail=f"연결선을 찾을 수 없습니다: {edge_id}"
            )

        # 업데이트
        edge.update({
            "source": request.source,
            "target": request.target,
            "relationship": request.relationship,
            "type": request.type,
            "strength": request.strength,
            "description": request.description,
            "label": request.label,
            "color": request.color,
        })

        logger.info(f"✅ 연결선 수정 완료: {edge_id}")

        return KnowledgeNetworkEdgeSchema(**edge)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 연결선 수정 실패: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="연결선 수정 중 오류가 발생했습니다.")


# ============================================================
# 엔드포인트: DELETE /api/knowledge-network/edges/{edge_id} (관리자용)
# ============================================================


@router.delete("/edges/{edge_id}")
async def delete_edge(
    edge_id: str,
    db: Session = Depends(get_db),
):
    """
    📌 함수: delete_edge
    📋 목적: 연결선을 삭제합니다. (관리자용)
    """

    logger.info(f"🗑️ 연결선 삭제: {edge_id}")

    try:
        global MOCK_EDGES

        # 엣지 검색 및 삭제
        original_len = len(MOCK_EDGES)
        MOCK_EDGES = [e for e in MOCK_EDGES if e["id"] != edge_id]

        if len(MOCK_EDGES) == original_len:
            logger.warning(f"⚠️ 연결선을 찾을 수 없습니다: {edge_id}")
            raise HTTPException(
                status_code=404,
                detail=f"연결선을 찾을 수 없습니다: {edge_id}"
            )

        logger.info(f"✅ 연결선 삭제 완료: {edge_id}")

        return {
            "success": True,
            "message": f"연결선이 삭제되었습니다: {edge_id}",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 연결선 삭제 실패: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="연결선 삭제 중 오류가 발생했습니다.")
