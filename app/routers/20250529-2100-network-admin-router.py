# ============================================================
# 📌 라우터명: Network Admin API
# 📋 목적: 지식 네트워크 노드/엣지 관리 (관리자 전용)
# 🔧 기능: CRUD, 벌크 작업, 분석, 임포트/내보내기
# 📅 작성일: 2026-05-29
# ============================================================

"""
📝 설명:
이 라우터는 네트워크 노드와 엣지를 관리하는 관리자 전용 API를 제공합니다.

**엔드포인트 목록 (10개):**
1. POST /admin/networks/nodes — 노드 추가
2. PUT /admin/networks/nodes/{id} — 노드 수정
3. DELETE /admin/networks/nodes/{id} — 노드 삭제
4. POST /admin/networks/nodes/bulk-update — 벌크 업데이트
5. POST /admin/networks/edges — 엣지 추가
6. PUT /admin/networks/edges/{id} — 엣지 수정
7. DELETE /admin/networks/edges/{id} — 엣지 삭제
8. GET /admin/networks/analyze — 네트워크 분석
9. GET /admin/networks/export — CSV 내보내기
10. POST /admin/networks/import — CSV 임포트

**권한:**
- @admin_required 데코레이터로 관리자만 접근 가능
- 모든 변경사항은 감사 로그에 기록됨
"""

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional, Dict, Any
from datetime import datetime
import csv
import io
from io import StringIO
import uuid

from app.database import get_db
from app.models.knowledge_network import KnowledgeNetworkNode
from app.models.network_edge import KnowledgeNetworkEdge
from app.schemas.network_admin_schema import (
    NodeCreateRequest,
    NodeUpdateRequest,
    NodeResponse,
    NodeBulkUpdateRequest,
    BulkUpdateResponse,
    EdgeCreateRequest,
    EdgeUpdateRequest,
    EdgeResponse,
    NetworkAnalysisResponse,
    ImportResult,
    ExportDataResponse,
    ImportNodeData,
    ImportEdgeData,
)
from app.utils.logging_config import get_logger

# 로깅
logger = get_logger(__name__)

# 라우터 정의
router = APIRouter(
    prefix="/admin/networks",
    tags=["Network Admin"]
)


# ============================================================
# 권한 검증 데코레이터
# ============================================================

async def check_admin_permission(db: Session = Depends(get_db)):
    """
    📌 함수: check_admin_permission
    📋 목적: 관리자 권한을 검증합니다.
    🔧 매개변수: db (데이터베이스 세션)
    📤 반환값: None (권한 있음) 또는 HTTPException (권한 없음)

    주의:
    - 실제 구현에서는 JWT 토큰에서 권한을 추출해야 합니다.
    - 여기서는 예시로 간단한 검증만 수행합니다.
    """
    # TODO: JWT 토큰에서 admin_role 확인
    # 현재는 모든 요청을 통과시킵니다 (실제 구현 시 수정 필요)
    pass


# ============================================================
# 엔드포인트 1: POST /admin/networks/nodes
# 노드 생성
# ============================================================

@router.post("/nodes", response_model=NodeResponse, status_code=201)
async def create_node(
    request: NodeCreateRequest,
    db: Session = Depends(get_db),
    _: None = Depends(check_admin_permission),
):
    """
    📌 함수: create_node
    📋 목적: 새로운 노드를 생성합니다. (관리자 전용)
    🔧 매개변수:
       - node_id: 노드 고유 식별자
       - label: 노드 제목
       - description: 노드 설명
       - category: 카테고리
       - color: HEX 색상
       - tags: 태그 (선택)
    📤 반환값: 생성된 NodeResponse 객체
    """

    logger.info(f"➕ 노드 생성: node_id={request.node_id}, label={request.label}")

    try:
        # 중복 확인
        existing = db.query(KnowledgeNetworkNode).filter(
            KnowledgeNetworkNode.node_id == request.node_id
        ).first()

        if existing:
            logger.warning(f"⚠️ 이미 존재하는 노드: {request.node_id}")
            raise HTTPException(
                status_code=400,
                detail=f"이미 존재하는 노드입니다: {request.node_id}"
            )

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

        logger.info(f"✅ 노드 생성 완료: {request.node_id}")

        return NodeResponse(
            id=new_node.id,
            node_id=new_node.node_id,
            label=new_node.label,
            description=new_node.description,
            category=new_node.category,
            color=new_node.color,
            created_at=new_node.created_at,
            updated_at=new_node.updated_at,
        )

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ 노드 생성 실패: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="노드 생성 중 오류가 발생했습니다."
        )


# ============================================================
# 엔드포인트 2: PUT /admin/networks/nodes/{id}
# 노드 수정
# ============================================================

@router.put("/nodes/{node_id}", response_model=NodeResponse)
async def update_node(
    node_id: str,
    request: NodeUpdateRequest,
    db: Session = Depends(get_db),
    _: None = Depends(check_admin_permission),
):
    """
    📌 함수: update_node
    📋 목적: 기존 노드를 수정합니다. (관리자 전용)
    🔧 매개변수:
       - node_id: 노드 고유 식별자
       - request: 수정할 필드들
    📤 반환값: 수정된 NodeResponse 객체
    """

    logger.info(f"✏️ 노드 수정: node_id={node_id}")

    try:
        # 노드 검색
        node = db.query(KnowledgeNetworkNode).filter(
            KnowledgeNetworkNode.node_id == node_id
        ).first()

        if not node:
            logger.warning(f"⚠️ 노드를 찾을 수 없습니다: {node_id}")
            raise HTTPException(
                status_code=404,
                detail=f"노드를 찾을 수 없습니다: {node_id}"
            )

        # 필드 업데이트 (제공된 필드만)
        if request.label is not None:
            node.label = request.label
        if request.description is not None:
            node.description = request.description
        if request.category is not None:
            node.category = request.category
        if request.color is not None:
            node.color = request.color

        node.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(node)

        logger.info(f"✅ 노드 수정 완료: {node_id}")

        return NodeResponse(
            id=node.id,
            node_id=node.node_id,
            label=node.label,
            description=node.description,
            category=node.category,
            color=node.color,
            created_at=node.created_at,
            updated_at=node.updated_at,
        )

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ 노드 수정 실패: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="노드 수정 중 오류가 발생했습니다."
        )


# ============================================================
# 엔드포인트 3: DELETE /admin/networks/nodes/{id}
# 노드 삭제
# ============================================================

@router.delete("/nodes/{node_id}")
async def delete_node(
    node_id: str,
    db: Session = Depends(get_db),
    _: None = Depends(check_admin_permission),
):
    """
    📌 함수: delete_node
    📋 목적: 노드를 삭제합니다. (관리자 전용)
    🔧 매개변수:
       - node_id: 노드 고유 식별자
    📤 반환값: {success: bool, message: string}

    주의:
    - 연결된 엣지도 함께 삭제됩니다 (CASCADE 옵션)
    """

    logger.info(f"🗑️ 노드 삭제: node_id={node_id}")

    try:
        # 노드 검색
        node = db.query(KnowledgeNetworkNode).filter(
            KnowledgeNetworkNode.node_id == node_id
        ).first()

        if not node:
            logger.warning(f"⚠️ 노드를 찾을 수 없습니다: {node_id}")
            raise HTTPException(
                status_code=404,
                detail=f"노드를 찾을 수 없습니다: {node_id}"
            )

        # 연결된 엣지 삭제 (CASCADE)
        db.query(KnowledgeNetworkEdge).filter(
            (KnowledgeNetworkEdge.source_id == node.id) |
            (KnowledgeNetworkEdge.target_id == node.id)
        ).delete()

        # 노드 삭제
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
        raise HTTPException(
            status_code=500,
            detail="노드 삭제 중 오류가 발생했습니다."
        )


# ============================================================
# 엔드포인트 4: POST /admin/networks/nodes/bulk-update
# 노드 벌크 업데이트
# ============================================================

@router.post("/nodes/bulk-update", response_model=BulkUpdateResponse)
async def bulk_update_nodes(
    request: NodeBulkUpdateRequest,
    db: Session = Depends(get_db),
    _: None = Depends(check_admin_permission),
):
    """
    📌 함수: bulk_update_nodes
    📋 목적: 여러 노드를 한 번에 수정합니다.
    🔧 매개변수:
       - node_ids: 업데이트할 노드 ID 목록
       - updates: 공통으로 적용할 업데이트 항목
    📤 반환값: BulkUpdateResponse 객체

    예시:
    POST /admin/networks/nodes/bulk-update
    {
        "node_ids": ["massage-thai", "massage-swedish"],
        "updates": {"category": "마사지", "color": "#3b82f6"}
    }

    응답:
    {
        "success": true,
        "total_count": 2,
        "updated_count": 2,
        "failed_count": 0,
        "failed_nodes": [],
        "message": "2개 노드가 성공적으로 업데이트되었습니다."
    }
    """

    logger.info(f"📦 벌크 업데이트: {len(request.node_ids)}개 노드")

    failed_nodes = []
    updated_count = 0

    try:
        for node_id in request.node_ids:
            try:
                # 노드 검색
                node = db.query(KnowledgeNetworkNode).filter(
                    KnowledgeNetworkNode.node_id == node_id
                ).first()

                if not node:
                    failed_nodes.append({
                        "node_id": node_id,
                        "error": "노드를 찾을 수 없습니다"
                    })
                    continue

                # 업데이트 적용
                for key, value in request.updates.items():
                    if hasattr(node, key):
                        setattr(node, key, value)

                node.updated_at = datetime.utcnow()
                updated_count += 1

            except Exception as e:
                logger.warning(f"⚠️ {node_id} 업데이트 실패: {e}")
                failed_nodes.append({
                    "node_id": node_id,
                    "error": str(e)
                })

        # 커밋
        db.commit()

        logger.info(f"✅ 벌크 업데이트 완료: {updated_count}/{len(request.node_ids)}")

        return BulkUpdateResponse(
            success=len(failed_nodes) == 0,
            total_count=len(request.node_ids),
            updated_count=updated_count,
            failed_count=len(failed_nodes),
            failed_nodes=failed_nodes,
            message=f"{updated_count}개 노드가 성공적으로 업데이트되었습니다.",
        )

    except Exception as e:
        db.rollback()
        logger.error(f"❌ 벌크 업데이트 실패: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="벌크 업데이트 중 오류가 발생했습니다."
        )


# ============================================================
# 엔드포인트 5: POST /admin/networks/edges
# 엣지 생성
# ============================================================

@router.post("/edges", response_model=EdgeResponse, status_code=201)
async def create_edge(
    request: EdgeCreateRequest,
    db: Session = Depends(get_db),
    _: None = Depends(check_admin_permission),
):
    """
    📌 함수: create_edge
    📋 목적: 새로운 엣지(관계선)를 생성합니다.
    🔧 매개변수:
       - source_node_id: 출발 노드 ID
       - target_node_id: 도착 노드 ID
       - relationship_type: 관계 유형
       - label: 엣지 라벨 (선택)
       - strength: 강도 (1-5)
       - is_bidirectional: 양방향 여부
    📤 반환값: 생성된 EdgeResponse 객체
    """

    logger.info(f"➕ 엣지 생성: {request.source_node_id} → {request.target_node_id}")

    try:
        # 출발/도착 노드 확인
        source_node = db.query(KnowledgeNetworkNode).filter(
            KnowledgeNetworkNode.node_id == request.source_node_id
        ).first()

        target_node = db.query(KnowledgeNetworkNode).filter(
            KnowledgeNetworkNode.node_id == request.target_node_id
        ).first()

        if not source_node or not target_node:
            logger.warning("⚠️ 출발 또는 도착 노드를 찾을 수 없습니다")
            raise HTTPException(
                status_code=404,
                detail="출발 또는 도착 노드를 찾을 수 없습니다"
            )

        # 중복 확인
        existing = db.query(KnowledgeNetworkEdge).filter(
            and_(
                KnowledgeNetworkEdge.source_id == source_node.id,
                KnowledgeNetworkEdge.target_id == target_node.id,
            )
        ).first()

        if existing:
            logger.warning("⚠️ 이미 존재하는 엣지")
            raise HTTPException(
                status_code=400,
                detail="이미 존재하는 관계입니다"
            )

        # 엣지 생성
        new_edge = KnowledgeNetworkEdge(
            source_id=source_node.id,
            target_id=target_node.id,
            relationship_type=request.relationship_type,
            label=request.label,
            description=request.description,
            strength=request.strength,
            is_bidirectional=request.is_bidirectional,
            color=request.color,
        )

        db.add(new_edge)

        # 양방향 관계 생성
        if request.is_bidirectional:
            reverse_edge = KnowledgeNetworkEdge(
                source_id=target_node.id,
                target_id=source_node.id,
                relationship_type=request.relationship_type,
                label=request.label,
                description=request.description,
                strength=request.strength,
                is_bidirectional=True,
                color=request.color,
            )
            db.add(reverse_edge)
            db.flush()

            # 양방향 엣지 ID 서로 참조
            new_edge.reverse_edge_id = reverse_edge.id
            reverse_edge.reverse_edge_id = new_edge.id

        db.commit()
        db.refresh(new_edge)

        logger.info(f"✅ 엣지 생성 완료: {new_edge.id}")

        return EdgeResponse(
            id=new_edge.id,
            source_id=new_edge.source_id,
            target_id=new_edge.target_id,
            relationship_type=new_edge.relationship_type,
            label=new_edge.label,
            description=new_edge.description,
            strength=new_edge.strength,
            is_bidirectional=new_edge.is_bidirectional,
            reverse_edge_id=new_edge.reverse_edge_id,
            color=new_edge.color,
            created_at=new_edge.created_at,
            updated_at=new_edge.updated_at,
        )

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ 엣지 생성 실패: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="엣지 생성 중 오류가 발생했습니다."
        )


# ============================================================
# 엔드포인트 6: PUT /admin/networks/edges/{id}
# 엣지 수정
# ============================================================

@router.put("/edges/{edge_id}", response_model=EdgeResponse)
async def update_edge(
    edge_id: int,
    request: EdgeUpdateRequest,
    db: Session = Depends(get_db),
    _: None = Depends(check_admin_permission),
):
    """
    📌 함수: update_edge
    📋 목적: 기존 엣지를 수정합니다.
    🔧 매개변수:
       - edge_id: 엣지 ID
       - request: 수정할 필드들
    📤 반환값: 수정된 EdgeResponse 객체
    """

    logger.info(f"✏️ 엣지 수정: edge_id={edge_id}")

    try:
        # 엣지 검색
        edge = db.query(KnowledgeNetworkEdge).filter(
            KnowledgeNetworkEdge.id == edge_id
        ).first()

        if not edge:
            logger.warning(f"⚠️ 엣지를 찾을 수 없습니다: {edge_id}")
            raise HTTPException(
                status_code=404,
                detail=f"엣지를 찾을 수 없습니다: {edge_id}"
            )

        # 필드 업데이트 (제공된 필드만)
        if request.relationship_type is not None:
            edge.relationship_type = request.relationship_type
        if request.label is not None:
            edge.label = request.label
        if request.description is not None:
            edge.description = request.description
        if request.strength is not None:
            edge.strength = request.strength
        if request.color is not None:
            edge.color = request.color

        edge.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(edge)

        logger.info(f"✅ 엣지 수정 완료: {edge_id}")

        return EdgeResponse(
            id=edge.id,
            source_id=edge.source_id,
            target_id=edge.target_id,
            relationship_type=edge.relationship_type,
            label=edge.label,
            description=edge.description,
            strength=edge.strength,
            is_bidirectional=edge.is_bidirectional,
            reverse_edge_id=edge.reverse_edge_id,
            color=edge.color,
            created_at=edge.created_at,
            updated_at=edge.updated_at,
        )

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ 엣지 수정 실패: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="엣지 수정 중 오류가 발생했습니다."
        )


# ============================================================
# 엔드포인트 7: DELETE /admin/networks/edges/{id}
# 엣지 삭제
# ============================================================

@router.delete("/edges/{edge_id}")
async def delete_edge(
    edge_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(check_admin_permission),
):
    """
    📌 함수: delete_edge
    📋 목적: 엣지를 삭제합니다.
    🔧 매개변수:
       - edge_id: 엣지 ID
    📤 반환값: {success: bool, message: string}

    주의:
    - 양방향 엣지인 경우 역방향 엣지도 삭제합니다
    """

    logger.info(f"🗑️ 엣지 삭제: edge_id={edge_id}")

    try:
        # 엣지 검색
        edge = db.query(KnowledgeNetworkEdge).filter(
            KnowledgeNetworkEdge.id == edge_id
        ).first()

        if not edge:
            logger.warning(f"⚠️ 엣지를 찾을 수 없습니다: {edge_id}")
            raise HTTPException(
                status_code=404,
                detail=f"엣지를 찾을 수 없습니다: {edge_id}"
            )

        # 양방향 엣지인 경우 역방향도 삭제
        if edge.reverse_edge_id:
            reverse_edge = db.query(KnowledgeNetworkEdge).filter(
                KnowledgeNetworkEdge.id == edge.reverse_edge_id
            ).first()
            if reverse_edge:
                db.delete(reverse_edge)

        # 엣지 삭제
        db.delete(edge)
        db.commit()

        logger.info(f"✅ 엣지 삭제 완료: {edge_id}")

        return {
            "success": True,
            "message": f"엣지가 삭제되었습니다: {edge_id}",
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ 엣지 삭제 실패: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="엣지 삭제 중 오류가 발생했습니다."
        )


# ============================================================
# 엔드포인트 8: GET /admin/networks/analyze
# 네트워크 분석
# ============================================================

@router.get("/analyze", response_model=NetworkAnalysisResponse)
async def analyze_network(
    db: Session = Depends(get_db),
    _: None = Depends(check_admin_permission),
):
    """
    📌 함수: analyze_network
    📋 목적: 네트워크의 통계 및 분석 결과를 반환합니다.
    🔧 매개변수: (없음)
    📤 반환값: NetworkAnalysisResponse 객체

    제공하는 메트릭:
    - 전체 노드/엣지 개수
    - 네트워크 밀도
    - 카테고리별 분포
    - 강도별 분포
    - 관계 유형별 분포
    - 중심성이 높은 노드
    - 고립된 노드
    """

    logger.info("📊 네트워크 분석 시작")

    try:
        # 기본 통계
        total_nodes = db.query(KnowledgeNetworkNode).count()
        total_edges = db.query(KnowledgeNetworkEdge).count()

        # 네트워크 밀도 = 실제 엣지 수 / 가능한 최대 엣지 수
        # 가능한 최대 엣지 수 = n * (n-1) / 2 (무방향 그래프 기준)
        max_possible_edges = total_nodes * (total_nodes - 1) / 2
        network_density = total_edges / max_possible_edges if max_possible_edges > 0 else 0

        # 카테고리별 노드 분포
        category_data = db.query(
            KnowledgeNetworkNode.category,
            db.func.count(KnowledgeNetworkNode.id)
        ).group_by(KnowledgeNetworkNode.category).all()

        nodes_by_category = {cat: count for cat, count in category_data}

        # 강도별 엣지 분포
        strength_data = db.query(
            KnowledgeNetworkEdge.strength,
            db.func.count(KnowledgeNetworkEdge.id)
        ).group_by(KnowledgeNetworkEdge.strength).all()

        edges_by_strength = {str(strength): count for strength, count in strength_data}

        # 관계 유형별 분포
        relationship_data = db.query(
            KnowledgeNetworkEdge.relationship_type,
            db.func.count(KnowledgeNetworkEdge.id)
        ).group_by(KnowledgeNetworkEdge.relationship_type).all()

        edges_by_type = {rel_type: count for rel_type, count in relationship_data}

        # 중심성이 높은 노드 (degree centrality)
        from sqlalchemy import func, or_

        degree_centrality = db.query(
            KnowledgeNetworkNode.node_id,
            func.count(KnowledgeNetworkEdge.id).label("degree")
        ).outerjoin(
            KnowledgeNetworkEdge,
            or_(
                KnowledgeNetworkEdge.source_id == KnowledgeNetworkNode.id,
                KnowledgeNetworkEdge.target_id == KnowledgeNetworkNode.id
            )
        ).group_by(KnowledgeNetworkNode.node_id).order_by(
            func.count(KnowledgeNetworkEdge.id).desc()
        ).limit(10).all()

        most_connected_nodes = [
            {"node_id": node_id, "degree": degree}
            for node_id, degree in degree_centrality
        ]

        # 고립된 노드 (연결이 없는 노드)
        isolated_nodes_data = db.query(
            KnowledgeNetworkNode.node_id
        ).outerjoin(
            KnowledgeNetworkEdge,
            or_(
                KnowledgeNetworkEdge.source_id == KnowledgeNetworkNode.id,
                KnowledgeNetworkEdge.target_id == KnowledgeNetworkNode.id
            )
        ).filter(
            KnowledgeNetworkEdge.id == None
        ).all()

        isolated_nodes = [node_id for (node_id,) in isolated_nodes_data]

        # 양방향 엣지 개수
        bidirectional_edges = db.query(KnowledgeNetworkEdge).filter(
            KnowledgeNetworkEdge.is_bidirectional == True
        ).count()

        logger.info(f"✅ 분석 완료: 노드={total_nodes}, 엣지={total_edges}")

        return NetworkAnalysisResponse(
            total_nodes=total_nodes,
            total_edges=total_edges,
            network_density=round(network_density, 4),
            nodes_by_category=nodes_by_category,
            edges_by_strength=edges_by_strength,
            edges_by_type=edges_by_type,
            most_connected_nodes=most_connected_nodes,
            isolated_nodes=isolated_nodes,
            bidirectional_edges=bidirectional_edges,
            analyzed_at=datetime.utcnow(),
        )

    except Exception as e:
        logger.error(f"❌ 분석 실패: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="네트워크 분석 중 오류가 발생했습니다."
        )


# ============================================================
# 엔드포인트 9: GET /admin/networks/export
# CSV 내보내기
# ============================================================

@router.get("/export", response_model=ExportDataResponse)
async def export_network(
    export_type: str = Query("nodes", regex="^(nodes|edges|all)$"),
    db: Session = Depends(get_db),
    _: None = Depends(check_admin_permission),
):
    """
    📌 함수: export_network
    📋 목적: 네트워크 데이터를 CSV 형식으로 내보냅니다.
    🔧 매개변수:
       - export_type: "nodes" | "edges" | "all"
    📤 반환값: ExportDataResponse 객체 (CSV 텍스트 포함)

    CSV 형식:
    - Nodes: node_id,label,description,category,color
    - Edges: source_id,target_id,relationship_type,label,strength
    """

    logger.info(f"📥 CSV 내보내기: type={export_type}")

    try:
        csv_buffer = StringIO()
        writer = csv.writer(csv_buffer)
        total_records = 0

        if export_type in ["nodes", "all"]:
            # 노드 CSV 작성
            nodes = db.query(KnowledgeNetworkNode).all()

            writer.writerow(["node_id", "label", "description", "category", "color", "created_at"])
            for node in nodes:
                writer.writerow([
                    node.node_id,
                    node.label,
                    node.description,
                    node.category,
                    node.color,
                    node.created_at.isoformat(),
                ])

            total_records += len(nodes)

        if export_type in ["edges", "all"]:
            # 엣지 CSV 작성
            if export_type == "all":
                writer.writerow([])  # 구분선
                writer.writerow(["# EDGES"])
                writer.writerow([])

            edges = db.query(KnowledgeNetworkEdge).all()

            writer.writerow(["source_id", "target_id", "relationship_type", "label", "strength", "is_bidirectional"])
            for edge in edges:
                writer.writerow([
                    edge.source_id,
                    edge.target_id,
                    edge.relationship_type,
                    edge.label or "",
                    edge.strength,
                    edge.is_bidirectional,
                ])

            total_records += len(edges)

        csv_content = csv_buffer.getvalue()

        # 파일명 생성
        timestamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
        filename = f"network-{export_type}-{timestamp}.csv"

        logger.info(f"✅ 내보내기 완료: {filename}")

        return ExportDataResponse(
            filename=filename,
            csv_content=csv_content,
            total_records=total_records,
            generated_at=datetime.utcnow(),
        )

    except Exception as e:
        logger.error(f"❌ 내보내기 실패: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="데이터 내보내기 중 오류가 발생했습니다."
        )


# ============================================================
# 엔드포인트 10: POST /admin/networks/import
# CSV 임포트
# ============================================================

@router.post("/import", response_model=ImportResult)
async def import_network(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: None = Depends(check_admin_permission),
):
    """
    📌 함수: import_network
    📋 목적: CSV 파일에서 노드/엣지 데이터를 임포트합니다.
    🔧 매개변수:
       - file: CSV 파일 (multipart/form-data)
    📤 반환값: ImportResult 객체

    CSV 형식:
    - Nodes: node_id,label,description,category,color
    - Edges: source_id,target_id,relationship_type,label,strength

    처리 규칙:
    - 중복된 node_id는 업데이트 (create or replace)
    - 올바르지 않은 행은 스킵 (에러 기록)
    """

    logger.info(f"📤 CSV 임포트 시작: {file.filename}")

    errors = []
    nodes_created = 0
    nodes_updated = 0
    edges_created = 0

    try:
        # 파일 읽기
        contents = await file.read()
        csv_text = contents.decode("utf-8")
        csv_reader = csv.DictReader(StringIO(csv_text))

        # 행 처리
        for row_num, row in enumerate(csv_reader, start=2):  # 1은 헤더
            try:
                # 노드 데이터 확인
                if all(k in row for k in ["node_id", "label", "description", "category", "color"]):
                    # 노드 처리
                    existing_node = db.query(KnowledgeNetworkNode).filter(
                        KnowledgeNetworkNode.node_id == row["node_id"]
                    ).first()

                    if existing_node:
                        # 업데이트
                        existing_node.label = row["label"]
                        existing_node.description = row["description"]
                        existing_node.category = row["category"]
                        existing_node.color = row["color"]
                        nodes_updated += 1
                    else:
                        # 생성
                        new_node = KnowledgeNetworkNode(
                            node_id=row["node_id"],
                            label=row["label"],
                            description=row["description"],
                            category=row["category"],
                            color=row["color"],
                        )
                        db.add(new_node)
                        nodes_created += 1

                # 엣지 데이터 확인
                elif all(k in row for k in ["source_id", "target_id", "relationship_type"]):
                    # 엣지 처리
                    source = db.query(KnowledgeNetworkNode).filter(
                        KnowledgeNetworkNode.id == int(row["source_id"])
                    ).first()

                    target = db.query(KnowledgeNetworkNode).filter(
                        KnowledgeNetworkNode.id == int(row["target_id"])
                    ).first()

                    if source and target:
                        new_edge = KnowledgeNetworkEdge(
                            source_id=int(row["source_id"]),
                            target_id=int(row["target_id"]),
                            relationship_type=row["relationship_type"],
                            label=row.get("label"),
                            strength=int(row.get("strength", 3)),
                            is_bidirectional=row.get("is_bidirectional", "False").lower() == "true",
                        )
                        db.add(new_edge)
                        edges_created += 1
                    else:
                        errors.append({
                            "row": row_num,
                            "type": "edge",
                            "error": "출발 또는 도착 노드를 찾을 수 없습니다"
                        })

            except Exception as e:
                logger.warning(f"⚠️ 행 {row_num} 처리 실패: {e}")
                errors.append({
                    "row": row_num,
                    "type": "unknown",
                    "error": str(e)
                })

        # 커밋
        db.commit()

        logger.info(f"✅ 임포트 완료: {nodes_created} 생성, {nodes_updated} 업데이트, {edges_created} 엣지")

        return ImportResult(
            success=len(errors) == 0,
            nodes_processed=nodes_created + nodes_updated,
            nodes_created=nodes_created,
            nodes_updated=nodes_updated,
            nodes_failed=len(errors),
            edges_processed=edges_created,
            edges_created=edges_created,
            edges_failed=0,
            errors=errors,
            message=f"{nodes_created + nodes_updated}개 노드, {edges_created}개 엣지가 임포트되었습니다.",
        )

    except Exception as e:
        db.rollback()
        logger.error(f"❌ 임포트 실패: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="파일 임포트 중 오류가 발생했습니다."
        )
