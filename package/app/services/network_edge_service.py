# ============================================================
# 📌 서비스명: NetworkEdgeService
# 📋 목적: 지식 네트워크 연결선의 비즈니스 로직 처리
# 🔧 기능: 양방향 관계 자동 생성, CRUD, 강도 계산
# 📅 작성일: 2026-05-29
# ============================================================

"""
📝 설명:
이 서비스는 지식 네트워크 엣지의 모든 비즈니스 로직을 처리합니다.

**주요 기능:**
1. 양방향 엣지 자동 생성
2. 엣지 CRUD 작업 (데이터베이스와의 상호작용)
3. 강도 기반 필터링 및 검색
4. 트랜잭션 처리 (일괄 추가 시 안정성 보장)

**사용 예:**
```python
service = NetworkEdgeService(db)
edge = service.create_edge(
    source_id=1,
    target_id=2,
    relationship_type="제공",
    strength=4,
    is_bidirectional=True  # 역방향도 자동 생성
)
```
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.network_edge import KnowledgeNetworkEdge
from app.models.knowledge_network import KnowledgeNetworkNode
from app.utils.logging_config import get_logger
from typing import List, Optional, Dict
from datetime import datetime

logger = get_logger(__name__)


class NetworkEdgeService:
    """
    📌 클래스: NetworkEdgeService
    📋 목적: 엣지 관리 비즈니스 로직
    """

    def __init__(self, db: Session):
        """
        🔧 초기화
        - db: SQLAlchemy Session
        """
        self.db = db

    # ============================================================
    # 1. 생성 (CREATE)
    # ============================================================

    def create_edge(
        self,
        source_id: int,
        target_id: int,
        relationship_type: str,
        strength: int = 3,
        label: Optional[str] = None,
        description: Optional[str] = None,
        color: Optional[str] = None,
        is_bidirectional: bool = False,
    ) -> KnowledgeNetworkEdge:
        """
        📌 함수: create_edge
        📋 목적: 새로운 엣지를 생성하고, 필요시 역방향 엣지도 자동 생성
        🔧 매개변수:
           - source_id: 출발 노드 ID
           - target_id: 도착 노드 ID
           - relationship_type: 관계 유형 (예: "제공", "타겟")
           - strength: 관계 강도 (1-5)
           - is_bidirectional: 양방향 관계 생성 여부
        📤 반환값: 생성된 KnowledgeNetworkEdge 객체
        """

        try:
            # 1. 노드 존재 여부 확인
            source = self.db.query(KnowledgeNetworkNode).filter(
                KnowledgeNetworkNode.id == source_id
            ).first()
            target = self.db.query(KnowledgeNetworkNode).filter(
                KnowledgeNetworkNode.id == target_id
            ).first()

            if not source:
                logger.error(f"❌ 출발 노드를 찾을 수 없습니다: {source_id}")
                raise ValueError(f"출발 노드를 찾을 수 없습니다: {source_id}")

            if not target:
                logger.error(f"❌ 도착 노드를 찾을 수 없습니다: {target_id}")
                raise ValueError(f"도착 노드를 찾을 수 없습니다: {target_id}")

            # 2. 중복 확인
            existing = self.db.query(KnowledgeNetworkEdge).filter(
                and_(
                    KnowledgeNetworkEdge.source_id == source_id,
                    KnowledgeNetworkEdge.target_id == target_id,
                )
            ).first()

            if existing:
                logger.warning(f"⚠️ 이미 존재하는 엣지: {source_id} → {target_id}")
                raise ValueError(f"이미 존재하는 엣지입니다: {source_id} → {target_id}")

            # 3. 정방향 엣지 생성
            forward_edge = KnowledgeNetworkEdge(
                source_id=source_id,
                target_id=target_id,
                relationship_type=relationship_type,
                strength=strength,
                label=label,
                description=description,
                color=color,
                is_bidirectional=is_bidirectional,
            )

            self.db.add(forward_edge)
            self.db.flush()  # ID 할당받기 위해 flush

            # 4. 양방향 엣지 생성 (if is_bidirectional)
            if is_bidirectional:
                reverse_edge = KnowledgeNetworkEdge(
                    source_id=target_id,
                    target_id=source_id,
                    relationship_type=relationship_type,  # 동일 유형
                    strength=strength,  # 동일 강도
                    label=label,
                    description=description,
                    color=color,
                    is_bidirectional=True,
                    reverse_edge_id=forward_edge.id,  # 역방향 참조
                )

                self.db.add(reverse_edge)
                self.db.flush()

                # 역참조 설정
                forward_edge.reverse_edge_id = reverse_edge.id

            # 5. 커밋
            self.db.commit()
            self.db.refresh(forward_edge)

            logger.info(
                f"✅ 엣지 생성 완료: {source_id} → {target_id} "
                f"(양방향: {is_bidirectional})"
            )

            return forward_edge

        except ValueError as e:
            self.db.rollback()
            logger.error(f"❌ 엣지 생성 실패: {e}")
            raise
        except Exception as e:
            self.db.rollback()
            logger.error(f"❌ 엣지 생성 중 오류: {e}", exc_info=True)
            raise

    def create_edges_batch(
        self,
        edges: List[Dict],
    ) -> tuple[List[KnowledgeNetworkEdge], int]:
        """
        📌 함수: create_edges_batch
        📋 목적: 여러 엣지를 일괄로 생성 (트랜잭션 처리)
        🔧 매개변수:
           - edges: 엣지 정보 딕셔너리 리스트
        📤 반환값: (생성된 엣지 목록, 성공 개수)

        예시:
        ```python
        edges_data = [
            {
                "source_id": 1,
                "target_id": 2,
                "relationship_type": "제공",
                "strength": 4,
                "is_bidirectional": True,
            },
            {...}
        ]
        created, count = service.create_edges_batch(edges_data)
        ```
        """

        created_edges = []
        success_count = 0

        try:
            for edge_data in edges:
                try:
                    edge = self.create_edge(**edge_data)
                    created_edges.append(edge)
                    success_count += 1
                except (ValueError, Exception) as e:
                    logger.warning(f"⚠️ 엣지 생성 스킵: {edge_data} - {e}")
                    # 실패한 엣지는 스킵하고 계속 진행

            logger.info(f"✅ 일괄 엣지 생성 완료: {success_count}/{len(edges)}")
            return created_edges, success_count

        except Exception as e:
            self.db.rollback()
            logger.error(f"❌ 일괄 엣지 생성 중 오류: {e}", exc_info=True)
            raise

    # ============================================================
    # 2. 조회 (READ)
    # ============================================================

    def get_edge_by_id(self, edge_id: int) -> Optional[KnowledgeNetworkEdge]:
        """
        📌 함수: get_edge_by_id
        📋 목적: ID로 특정 엣지를 조회
        """

        try:
            edge = self.db.query(KnowledgeNetworkEdge).filter(
                KnowledgeNetworkEdge.id == edge_id
            ).first()

            if not edge:
                logger.warning(f"⚠️ 엣지를 찾을 수 없습니다: {edge_id}")
                return None

            return edge

        except Exception as e:
            logger.error(f"❌ 엣지 조회 실패: {e}", exc_info=True)
            raise

    def get_edges_by_source(
        self,
        source_id: int,
        skip: int = 0,
        limit: int = 100,
    ) -> tuple[List[KnowledgeNetworkEdge], int]:
        """
        📌 함수: get_edges_by_source
        📋 목적: 출발 노드 기준으로 모든 엣지 조회
        """

        try:
            query = self.db.query(KnowledgeNetworkEdge).filter(
                KnowledgeNetworkEdge.source_id == source_id
            )

            total = query.count()
            edges = query.offset(skip).limit(limit).all()

            logger.info(f"📖 출발 엣지 조회: source_id={source_id}, 개수={total}")

            return edges, total

        except Exception as e:
            logger.error(f"❌ 출발 엣지 조회 실패: {e}", exc_info=True)
            raise

    def get_edges_by_target(
        self,
        target_id: int,
        skip: int = 0,
        limit: int = 100,
    ) -> tuple[List[KnowledgeNetworkEdge], int]:
        """
        📌 함수: get_edges_by_target
        📋 목적: 도착 노드 기준으로 모든 엣지 조회
        """

        try:
            query = self.db.query(KnowledgeNetworkEdge).filter(
                KnowledgeNetworkEdge.target_id == target_id
            )

            total = query.count()
            edges = query.offset(skip).limit(limit).all()

            logger.info(f"📖 도착 엣지 조회: target_id={target_id}, 개수={total}")

            return edges, total

        except Exception as e:
            logger.error(f"❌ 도착 엣지 조회 실패: {e}", exc_info=True)
            raise

    def get_edges_by_relationship_type(
        self,
        relationship_type: str,
        skip: int = 0,
        limit: int = 100,
    ) -> tuple[List[KnowledgeNetworkEdge], int]:
        """
        📌 함수: get_edges_by_relationship_type
        📋 목적: 관계 유형으로 엣지 필터링
        """

        try:
            query = self.db.query(KnowledgeNetworkEdge).filter(
                KnowledgeNetworkEdge.relationship_type == relationship_type
            )

            total = query.count()
            edges = query.offset(skip).limit(limit).all()

            logger.info(
                f"📖 유형별 엣지 조회: type={relationship_type}, 개수={total}"
            )

            return edges, total

        except Exception as e:
            logger.error(f"❌ 유형별 엣지 조회 실패: {e}", exc_info=True)
            raise

    def get_all_edges(
        self,
        skip: int = 0,
        limit: int = 100,
    ) -> tuple[List[KnowledgeNetworkEdge], int]:
        """
        📌 함수: get_all_edges
        📋 목적: 모든 엣지 조회 (페이지네이션)
        """

        try:
            query = self.db.query(KnowledgeNetworkEdge)
            total = query.count()
            edges = query.offset(skip).limit(limit).all()

            logger.info(f"📖 모든 엣지 조회: 전체={total}, 반환={len(edges)}")

            return edges, total

        except Exception as e:
            logger.error(f"❌ 모든 엣지 조회 실패: {e}", exc_info=True)
            raise

    # ============================================================
    # 3. 수정 (UPDATE)
    # ============================================================

    def update_edge(
        self,
        edge_id: int,
        strength: Optional[int] = None,
        label: Optional[str] = None,
        description: Optional[str] = None,
        color: Optional[str] = None,
        relationship_type: Optional[str] = None,
    ) -> Optional[KnowledgeNetworkEdge]:
        """
        📌 함수: update_edge
        📋 목적: 엣지 정보 수정
        🔧 주의: 양방향 엣지의 경우 역방향도 업데이트됨
        """

        try:
            edge = self.db.query(KnowledgeNetworkEdge).filter(
                KnowledgeNetworkEdge.id == edge_id
            ).first()

            if not edge:
                logger.warning(f"⚠️ 엣지를 찾을 수 없습니다: {edge_id}")
                return None

            # 필드 업데이트
            if strength is not None:
                edge.strength = strength
            if label is not None:
                edge.label = label
            if description is not None:
                edge.description = description
            if color is not None:
                edge.color = color
            if relationship_type is not None:
                edge.relationship_type = relationship_type

            edge.updated_at = datetime.utcnow()

            # 양방향 엣지면 역방향도 업데이트
            if edge.is_bidirectional and edge.reverse_edge_id:
                reverse_edge = self.db.query(KnowledgeNetworkEdge).filter(
                    KnowledgeNetworkEdge.id == edge.reverse_edge_id
                ).first()

                if reverse_edge:
                    if strength is not None:
                        reverse_edge.strength = strength
                    if relationship_type is not None:
                        reverse_edge.relationship_type = relationship_type
                    reverse_edge.updated_at = datetime.utcnow()

            self.db.commit()
            self.db.refresh(edge)

            logger.info(f"✅ 엣지 수정 완료: {edge_id}")

            return edge

        except Exception as e:
            self.db.rollback()
            logger.error(f"❌ 엣지 수정 실패: {e}", exc_info=True)
            raise

    # ============================================================
    # 4. 삭제 (DELETE)
    # ============================================================

    def delete_edge(self, edge_id: int) -> bool:
        """
        📌 함수: delete_edge
        📋 목적: 엣지 삭제
        🔧 주의: 양방향 엣지면 역방향도 함께 삭제
        """

        try:
            edge = self.db.query(KnowledgeNetworkEdge).filter(
                KnowledgeNetworkEdge.id == edge_id
            ).first()

            if not edge:
                logger.warning(f"⚠️ 엣지를 찾을 수 없습니다: {edge_id}")
                return False

            # 양방향 엣지면 역방향도 삭제
            if edge.reverse_edge_id:
                reverse_edge = self.db.query(KnowledgeNetworkEdge).filter(
                    KnowledgeNetworkEdge.id == edge.reverse_edge_id
                ).first()

                if reverse_edge:
                    self.db.delete(reverse_edge)

            # 정방향 엣지 삭제
            self.db.delete(edge)
            self.db.commit()

            logger.info(f"✅ 엣지 삭제 완료: {edge_id}")

            return True

        except Exception as e:
            self.db.rollback()
            logger.error(f"❌ 엣지 삭제 실패: {e}", exc_info=True)
            raise

    # ============================================================
    # 5. 검색 (SEARCH)
    # ============================================================

    def search_edges(
        self,
        source_id: Optional[int] = None,
        target_id: Optional[int] = None,
        relationship_type: Optional[str] = None,
        min_strength: int = 1,
        max_strength: int = 5,
        skip: int = 0,
        limit: int = 100,
    ) -> tuple[List[KnowledgeNetworkEdge], int]:
        """
        📌 함수: search_edges
        📋 목적: 여러 조건으로 엣지 검색
        """

        try:
            query = self.db.query(KnowledgeNetworkEdge)

            # 필터 적용
            if source_id is not None:
                query = query.filter(KnowledgeNetworkEdge.source_id == source_id)

            if target_id is not None:
                query = query.filter(KnowledgeNetworkEdge.target_id == target_id)

            if relationship_type is not None:
                query = query.filter(
                    KnowledgeNetworkEdge.relationship_type == relationship_type
                )

            # 강도 범위
            query = query.filter(
                KnowledgeNetworkEdge.strength.between(min_strength, max_strength)
            )

            total = query.count()
            edges = query.offset(skip).limit(limit).all()

            logger.info(f"📖 엣지 검색 완료: 결과={total}")

            return edges, total

        except Exception as e:
            logger.error(f"❌ 엣지 검색 실패: {e}", exc_info=True)
            raise

    # ============================================================
    # 6. 유틸리티
    # ============================================================

    def get_node_connections(
        self,
        node_id: int,
        direction: str = "both",
    ) -> Dict:
        """
        📌 함수: get_node_connections
        📋 목적: 특정 노드의 모든 연결 정보 조회
        🔧 매개변수:
           - direction: "incoming" (입장), "outgoing" (출장), "both" (양쪽)
        📤 반환값: {incoming: Edge[], outgoing: Edge[], total: int}
        """

        try:
            incoming = []
            outgoing = []

            if direction in ["incoming", "both"]:
                incoming, _ = self.get_edges_by_target(node_id, limit=1000)

            if direction in ["outgoing", "both"]:
                outgoing, _ = self.get_edges_by_source(node_id, limit=1000)

            return {
                "incoming": incoming,
                "outgoing": outgoing,
                "total": len(incoming) + len(outgoing),
                "node_id": node_id,
            }

        except Exception as e:
            logger.error(f"❌ 노드 연결 조회 실패: {e}", exc_info=True)
            raise

    def calculate_node_importance(self, node_id: int) -> Dict:
        """
        📌 함수: calculate_node_importance
        📋 목적: 노드의 중요도 계산 (연결 수, 평균 강도 등)
        📤 반환값: {in_degree, out_degree, avg_strength, total_strength}
        """

        try:
            incoming, _ = self.get_edges_by_target(node_id, limit=1000)
            outgoing, _ = self.get_edges_by_source(node_id, limit=1000)

            all_edges = incoming + outgoing
            total_strength = sum(e.strength for e in all_edges) if all_edges else 0
            avg_strength = total_strength / len(all_edges) if all_edges else 0

            return {
                "node_id": node_id,
                "in_degree": len(incoming),
                "out_degree": len(outgoing),
                "total_degree": len(incoming) + len(outgoing),
                "total_strength": total_strength,
                "avg_strength": round(avg_strength, 2),
            }

        except Exception as e:
            logger.error(f"❌ 노드 중요도 계산 실패: {e}", exc_info=True)
            raise
