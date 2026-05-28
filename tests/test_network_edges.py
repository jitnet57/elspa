# ============================================================
# 📌 테스트명: Network Edges CRUD & Bidirectional Tests
# 📋 목적: 엣지 생성, 조회, 수정, 삭제 및 양방향 관계 검증
# 🔧 기능: pytest 기반 단위 테스트
# 📅 작성일: 2026-05-29
# ============================================================

"""
📝 설명:
이 테스트 파일은 NetworkEdgeService의 모든 기능을 검증합니다.

**테스트 목록:**
1. test_create_edge_simple - 단방향 엣지 생성
2. test_create_edge_bidirectional - 양방향 엣지 생성
3. test_get_edge_by_id - ID로 엣지 조회
4. test_get_edges_by_source - 출발 노드 기준 조회
5. test_get_edges_by_target - 도착 노드 기준 조회
6. test_update_edge - 엣지 수정 (양방향 자동 업데이트)
7. test_delete_edge - 엣지 삭제 (양방향 함께 삭제)
8. test_search_edges - 다중 필터 검색
9. test_create_edges_batch - 일괄 생성 (트랜잭션)
10. test_node_importance - 노드 중요도 계산

**사용법:**
```bash
pytest tests/test_network_edges.py -v
pytest tests/test_network_edges.py::test_create_edge_bidirectional -v
```
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.models.knowledge_network import KnowledgeNetworkNode
from app.models.network_edge import KnowledgeNetworkEdge, Base
from app.services.network_edge_service import NetworkEdgeService


# ============================================================
# Fixtures
# ============================================================


@pytest.fixture(scope="function")
def test_db():
    """
    🔧 Fixture: test_db
    📋 목적: 테스트용 SQLite 데이터베이스 세션
    """

    # SQLite 메모리 DB
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)

    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    yield db

    db.close()
    Base.metadata.drop_all(engine)


@pytest.fixture(scope="function")
def sample_nodes(test_db: Session):
    """
    🔧 Fixture: sample_nodes
    📋 목적: 테스트용 샘플 노드 생성
    """

    nodes = [
        KnowledgeNetworkNode(
            node_id="therapist-john",
            label="존 치료사",
            description="타이 마사지 전문가",
            category="판매자",
            color="#3b82f6",
        ),
        KnowledgeNetworkNode(
            node_id="massage-thai",
            label="타이 마사지",
            description="전통 태국식 마사지",
            category="마사지",
            color="#10b981",
        ),
        KnowledgeNetworkNode(
            node_id="customer-segment-corporate",
            label="기업 고객",
            description="회사원, 임원진",
            category="고객",
            color="#f59e0b",
        ),
        KnowledgeNetworkNode(
            node_id="wellness-center",
            label="웰니스 센터",
            description="통합 웰니스 시설",
            category="시설",
            color="#8b5cf6",
        ),
    ]

    test_db.add_all(nodes)
    test_db.commit()

    return {node.node_id: node.id for node in nodes}


# ============================================================
# 테스트: 엣지 생성
# ============================================================


def test_create_edge_simple(test_db: Session, sample_nodes):
    """
    📌 테스트: test_create_edge_simple
    📋 목적: 단방향 엣지 생성 검증
    """

    service = NetworkEdgeService(test_db)

    edge = service.create_edge(
        source_id=sample_nodes["therapist-john"],
        target_id=sample_nodes["massage-thai"],
        relationship_type="제공",
        strength=5,
        label="제공",
        is_bidirectional=False,
    )

    # 검증
    assert edge.id is not None
    assert edge.source_id == sample_nodes["therapist-john"]
    assert edge.target_id == sample_nodes["massage-thai"]
    assert edge.relationship_type == "제공"
    assert edge.strength == 5
    assert edge.is_bidirectional == False
    assert edge.reverse_edge_id is None

    print("✅ 단방향 엣지 생성 테스트 통과")


def test_create_edge_bidirectional(test_db: Session, sample_nodes):
    """
    📌 테스트: test_create_edge_bidirectional
    📋 목적: 양방향 엣지 자동 생성 검증
    """

    service = NetworkEdgeService(test_db)

    edge = service.create_edge(
        source_id=sample_nodes["therapist-john"],
        target_id=sample_nodes["wellness-center"],
        relationship_type="제휴",
        strength=4,
        is_bidirectional=True,  # 양방향 자동 생성
    )

    # 정방향 엣지 검증
    assert edge.is_bidirectional == True
    assert edge.reverse_edge_id is not None

    # 역방향 엣지 검증
    reverse_edge = test_db.query(KnowledgeNetworkEdge).filter(
        KnowledgeNetworkEdge.id == edge.reverse_edge_id
    ).first()

    assert reverse_edge is not None
    assert reverse_edge.source_id == sample_nodes["wellness-center"]
    assert reverse_edge.target_id == sample_nodes["therapist-john"]
    assert reverse_edge.relationship_type == "제휴"
    assert reverse_edge.strength == 4  # 동일 강도
    assert reverse_edge.is_bidirectional == True

    print("✅ 양방향 엣지 생성 테스트 통과")


def test_create_edge_duplicate(test_db: Session, sample_nodes):
    """
    📌 테스트: test_create_edge_duplicate
    📋 목적: 중복 엣지 생성 실패 검증
    """

    service = NetworkEdgeService(test_db)

    # 첫 번째 생성
    service.create_edge(
        source_id=sample_nodes["therapist-john"],
        target_id=sample_nodes["massage-thai"],
        relationship_type="제공",
        strength=5,
    )

    # 두 번째 생성 시 에러 발생
    with pytest.raises(ValueError, match="이미 존재하는 엣지"):
        service.create_edge(
            source_id=sample_nodes["therapist-john"],
            target_id=sample_nodes["massage-thai"],
            relationship_type="제공",
            strength=5,
        )

    print("✅ 중복 엣지 생성 실패 테스트 통과")


# ============================================================
# 테스트: 엣지 조회
# ============================================================


def test_get_edge_by_id(test_db: Session, sample_nodes):
    """
    📌 테스트: test_get_edge_by_id
    📋 목적: ID로 엣지 조회 검증
    """

    service = NetworkEdgeService(test_db)

    # 엣지 생성
    created_edge = service.create_edge(
        source_id=sample_nodes["therapist-john"],
        target_id=sample_nodes["massage-thai"],
        relationship_type="제공",
        strength=5,
    )

    # 조회
    edge = service.get_edge_by_id(created_edge.id)

    assert edge is not None
    assert edge.id == created_edge.id
    assert edge.relationship_type == "제공"

    # 존재하지 않는 엣지
    edge = service.get_edge_by_id(999)
    assert edge is None

    print("✅ ID로 엣지 조회 테스트 통과")


def test_get_edges_by_source(test_db: Session, sample_nodes):
    """
    📌 테스트: test_get_edges_by_source
    📋 목적: 출발 노드 기준 조회 검증
    """

    service = NetworkEdgeService(test_db)

    # 엣지 여러 개 생성
    service.create_edge(
        source_id=sample_nodes["therapist-john"],
        target_id=sample_nodes["massage-thai"],
        relationship_type="제공",
        strength=5,
    )

    service.create_edge(
        source_id=sample_nodes["therapist-john"],
        target_id=sample_nodes["customer-segment-corporate"],
        relationship_type="타겟",
        strength=4,
    )

    # 조회
    edges, total = service.get_edges_by_source(sample_nodes["therapist-john"])

    assert total == 2
    assert len(edges) == 2
    assert all(e.source_id == sample_nodes["therapist-john"] for e in edges)

    print("✅ 출발 노드 기준 조회 테스트 통과")


def test_get_edges_by_target(test_db: Session, sample_nodes):
    """
    📌 테스트: test_get_edges_by_target
    📋 목적: 도착 노드 기준 조회 검증
    """

    service = NetworkEdgeService(test_db)

    # 엣지 여러 개 생성
    service.create_edge(
        source_id=sample_nodes["therapist-john"],
        target_id=sample_nodes["massage-thai"],
        relationship_type="제공",
        strength=5,
    )

    service.create_edge(
        source_id=sample_nodes["customer-segment-corporate"],
        target_id=sample_nodes["massage-thai"],
        relationship_type="구매",
        strength=4,
    )

    # 조회
    edges, total = service.get_edges_by_target(sample_nodes["massage-thai"])

    assert total == 2
    assert len(edges) == 2
    assert all(e.target_id == sample_nodes["massage-thai"] for e in edges)

    print("✅ 도착 노드 기준 조회 테스트 통과")


# ============================================================
# 테스트: 엣지 수정
# ============================================================


def test_update_edge(test_db: Session, sample_nodes):
    """
    📌 테스트: test_update_edge
    📋 목적: 엣지 수정 및 양방향 자동 업데이트 검증
    """

    service = NetworkEdgeService(test_db)

    # 양방향 엣지 생성
    edge = service.create_edge(
        source_id=sample_nodes["therapist-john"],
        target_id=sample_nodes["wellness-center"],
        relationship_type="제휴",
        strength=4,
        is_bidirectional=True,
    )

    # 수정
    updated_edge = service.update_edge(
        edge_id=edge.id,
        strength=5,  # 강도 변경
        relationship_type="긴밀한 제휴",
    )

    # 정방향 검증
    assert updated_edge.strength == 5
    assert updated_edge.relationship_type == "긴밀한 제휴"

    # 역방향도 자동 업데이트되었는지 검증
    reverse_edge = test_db.query(KnowledgeNetworkEdge).filter(
        KnowledgeNetworkEdge.id == edge.reverse_edge_id
    ).first()

    assert reverse_edge.strength == 5
    assert reverse_edge.relationship_type == "긴밀한 제휴"

    print("✅ 엣지 수정 (양방향 자동 업데이트) 테스트 통과")


# ============================================================
# 테스트: 엣지 삭제
# ============================================================


def test_delete_edge(test_db: Session, sample_nodes):
    """
    📌 테스트: test_delete_edge
    📋 목적: 엣지 삭제 및 양방향 함께 삭제 검증
    """

    service = NetworkEdgeService(test_db)

    # 양방향 엣지 생성
    edge = service.create_edge(
        source_id=sample_nodes["therapist-john"],
        target_id=sample_nodes["wellness-center"],
        relationship_type="제휴",
        strength=4,
        is_bidirectional=True,
    )

    reverse_edge_id = edge.reverse_edge_id

    # 삭제
    success = service.delete_edge(edge.id)

    assert success == True

    # 정방향 엣지 삭제 확인
    remaining_edge = test_db.query(KnowledgeNetworkEdge).filter(
        KnowledgeNetworkEdge.id == edge.id
    ).first()
    assert remaining_edge is None

    # 역방향 엣지도 함께 삭제되었는지 확인
    remaining_reverse = test_db.query(KnowledgeNetworkEdge).filter(
        KnowledgeNetworkEdge.id == reverse_edge_id
    ).first()
    assert remaining_reverse is None

    print("✅ 엣지 삭제 (양방향 함께 삭제) 테스트 통과")


# ============================================================
# 테스트: 엣지 검색
# ============================================================


def test_search_edges(test_db: Session, sample_nodes):
    """
    📌 테스트: test_search_edges
    📋 목적: 다중 필터 검색 검증
    """

    service = NetworkEdgeService(test_db)

    # 엣지 여러 개 생성
    service.create_edge(
        source_id=sample_nodes["therapist-john"],
        target_id=sample_nodes["massage-thai"],
        relationship_type="제공",
        strength=5,
    )

    service.create_edge(
        source_id=sample_nodes["therapist-john"],
        target_id=sample_nodes["customer-segment-corporate"],
        relationship_type="타겟",
        strength=3,
    )

    service.create_edge(
        source_id=sample_nodes["customer-segment-corporate"],
        target_id=sample_nodes["massage-thai"],
        relationship_type="제공",
        strength=2,
    )

    # 검색 1: 출발 노드 필터
    edges, total = service.search_edges(source_id=sample_nodes["therapist-john"])
    assert total == 2

    # 검색 2: 관계 유형 필터
    edges, total = service.search_edges(relationship_type="제공")
    assert total == 2

    # 검색 3: 강도 범위 필터
    edges, total = service.search_edges(min_strength=4, max_strength=5)
    assert total == 1

    # 검색 4: 복합 필터
    edges, total = service.search_edges(
        source_id=sample_nodes["therapist-john"],
        relationship_type="제공",
    )
    assert total == 1

    print("✅ 다중 필터 검색 테스트 통과")


# ============================================================
# 테스트: 일괄 생성
# ============================================================


def test_create_edges_batch(test_db: Session, sample_nodes):
    """
    📌 테스트: test_create_edges_batch
    📋 목적: 일괄 엣지 생성 (트랜잭션) 검증
    """

    service = NetworkEdgeService(test_db)

    edges_data = [
        {
            "source_id": sample_nodes["therapist-john"],
            "target_id": sample_nodes["massage-thai"],
            "relationship_type": "제공",
            "strength": 5,
        },
        {
            "source_id": sample_nodes["therapist-john"],
            "target_id": sample_nodes["customer-segment-corporate"],
            "relationship_type": "타겟",
            "strength": 4,
        },
        {
            "source_id": sample_nodes["customer-segment-corporate"],
            "target_id": sample_nodes["massage-thai"],
            "relationship_type": "구매",
            "strength": 3,
        },
    ]

    created_edges, success_count = service.create_edges_batch(edges_data)

    assert success_count == 3
    assert len(created_edges) == 3

    # DB에 저장되었는지 확인
    total_edges = test_db.query(KnowledgeNetworkEdge).count()
    assert total_edges == 3

    print("✅ 일괄 엣지 생성 테스트 통과")


# ============================================================
# 테스트: 노드 중요도
# ============================================================


def test_node_importance(test_db: Session, sample_nodes):
    """
    📌 테스트: test_node_importance
    📋 목적: 노드 중요도 계산 검증
    """

    service = NetworkEdgeService(test_db)

    # 엣지 생성
    service.create_edge(
        source_id=sample_nodes["therapist-john"],
        target_id=sample_nodes["massage-thai"],
        relationship_type="제공",
        strength=5,
    )

    service.create_edge(
        source_id=sample_nodes["therapist-john"],
        target_id=sample_nodes["customer-segment-corporate"],
        relationship_type="타겟",
        strength=4,
    )

    service.create_edge(
        source_id=sample_nodes["customer-segment-corporate"],
        target_id=sample_nodes["massage-thai"],
        relationship_type="구매",
        strength=3,
    )

    # 노드 중요도 계산 (출발 도수: 2, 입장 도수: 0)
    importance = service.calculate_node_importance(sample_nodes["therapist-john"])

    assert importance["node_id"] == sample_nodes["therapist-john"]
    assert importance["out_degree"] == 2
    assert importance["in_degree"] == 0
    assert importance["total_degree"] == 2
    assert importance["total_strength"] == 9  # 5 + 4
    assert importance["avg_strength"] == 4.5

    # 마사지 노드 (출발 도수: 1, 입장 도수: 2)
    importance = service.calculate_node_importance(sample_nodes["massage-thai"])

    assert importance["out_degree"] == 1
    assert importance["in_degree"] == 2
    assert importance["total_degree"] == 3

    print("✅ 노드 중요도 계산 테스트 통과")


# ============================================================
# 테스트: 통합 (엣지 개수 검증)
# ============================================================


def test_edge_count_validation(test_db: Session, sample_nodes):
    """
    📌 테스트: test_edge_count_validation
    📋 목적: 양방향 엣지 생성 시 개수 검증
    """

    service = NetworkEdgeService(test_db)

    # 단방향 2개 + 양방향 1개 생성
    service.create_edge(
        source_id=sample_nodes["therapist-john"],
        target_id=sample_nodes["massage-thai"],
        relationship_type="제공",
        strength=5,
        is_bidirectional=False,
    )

    service.create_edge(
        source_id=sample_nodes["customer-segment-corporate"],
        target_id=sample_nodes["massage-thai"],
        relationship_type="구매",
        strength=3,
        is_bidirectional=False,
    )

    service.create_edge(
        source_id=sample_nodes["therapist-john"],
        target_id=sample_nodes["wellness-center"],
        relationship_type="제휴",
        strength=4,
        is_bidirectional=True,  # 양방향 = 2개
    )

    # 총 엣지 개수: 2 + 2 = 4개
    total_edges = test_db.query(KnowledgeNetworkEdge).count()
    assert total_edges == 4

    print("✅ 엣지 개수 검증 테스트 통과")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
