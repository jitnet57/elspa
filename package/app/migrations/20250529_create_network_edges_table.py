# ============================================================
# 📌 마이그레이션: Create Network Edges Table
# 📋 목적: knowledge_network_edges 테이블 생성
# 🔧 기능: 노드 간 관계 영속화, 양방향 지원
# 📅 작성일: 2026-05-29
# ============================================================

"""
📝 설명:
이 마이그레이션은 PostgreSQL에 knowledge_network_edges 테이블을 생성합니다.

**테이블 구조:**
- id (PK): 엣지 고유 ID
- source_id (FK): 출발 노드
- target_id (FK): 도착 노드
- relationship_type: 관계 유형
- strength: 관계 강도 (1-5)
- label: 선 위 라벨
- description: 관계 설명
- is_bidirectional: 양방향 여부
- reverse_edge_id (FK): 역방향 엣지 ID
- color: HEX 색상
- created_at: 생성 시간
- updated_at: 수정 시간

**인덱스:**
- (source_id, target_id): 빠른 쌍 조회
- relationship_type: 유형별 조회 최적화
- strength: 강도별 조회 최적화
"""

from app.database import engine
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    Boolean,
    Index,
    MetaData,
    Table,
)
from datetime import datetime


def create_network_edges_table():
    """
    🔧 함수: create_network_edges_table
    📋 목적: 테이블 생성
    """

    metadata = MetaData()

    # 테이블 정의
    knowledge_network_edges = Table(
        "knowledge_network_edges",
        metadata,
        Column("id", Integer, primary_key=True, autoincrement=True),
        Column(
            "source_id",
            Integer,
            ForeignKey("knowledge_network_nodes.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        Column(
            "target_id",
            Integer,
            ForeignKey("knowledge_network_nodes.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        Column("relationship_type", String(100), nullable=False, index=True),
        Column("label", String(255), nullable=True),
        Column("description", Text, nullable=True),
        Column("strength", Integer, default=3, nullable=False),
        Column("is_bidirectional", Boolean, default=False, nullable=False),
        Column("reverse_edge_id", Integer, ForeignKey("knowledge_network_edges.id"), nullable=True),
        Column("color", String(7), nullable=True, default="#3b82f6"),
        Column("created_at", DateTime, default=datetime.utcnow, nullable=False),
        Column("updated_at", DateTime, default=datetime.utcnow, nullable=False),
        # 복합 인덱스
        Index("idx_source_target", "source_id", "target_id", unique=False),
        Index("idx_relationship_type", "relationship_type"),
        Index("idx_strength", "strength"),
    )

    # 테이블 생성
    metadata.create_all(engine)
    print("✅ knowledge_network_edges 테이블이 생성되었습니다.")


def drop_network_edges_table():
    """
    🔧 함수: drop_network_edges_table
    📋 목적: 테이블 삭제 (테스트용)
    """

    metadata = MetaData()
    metadata.reflect(bind=engine)

    if "knowledge_network_edges" in metadata.tables:
        metadata.tables["knowledge_network_edges"].drop(engine)
        print("✅ knowledge_network_edges 테이블이 삭제되었습니다.")
    else:
        print("⚠️ 테이블을 찾을 수 없습니다.")


if __name__ == "__main__":
    # 테이블 생성
    create_network_edges_table()
