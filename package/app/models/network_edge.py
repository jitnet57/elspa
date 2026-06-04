# ============================================================
# 📌 모델명: KnowledgeNetworkEdge
# 📋 목적: ElSpa 지식 네트워크 연결선(엣지) 관리
# 🔧 기능: 노드 간의 관계를 PostgreSQL에 영속화
# 📅 작성일: 2026-05-29
# ============================================================

"""
📝 설명:
이 모델은 지식 네트워크의 연결선(엣지/관계)을 데이터베이스에 저장합니다.

**특징:**
1. 양방향 관계 자동 생성 (is_bidirectional 플래그)
2. 관계 강도 추적 (1-5)
3. 외래키 무결성 유지
4. 인덱싱으로 빠른 조회 성능

**예시:**
- therapist-john → massage-thai (제공)
- 역방향 자동 생성: massage-thai → therapist-john (제공자)
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Index
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()


class KnowledgeNetworkEdge(Base):
    """
    📝 설명:
    지식 네트워크의 노드 간 연결선(엣지)을 표현합니다.

    각 엣지는 두 노드 간의 관계를 나타내며, 관계의 강도와 유형을 기록합니다.
    """

    __tablename__ = "knowledge_network_edges"

    # 기본 정보
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # 노드 참조 (외래키)
    source_id = Column(Integer, ForeignKey("knowledge_network_nodes.id"), nullable=False, index=True)
    target_id = Column(Integer, ForeignKey("knowledge_network_nodes.id"), nullable=False, index=True)

    # 관계 정보
    relationship_type = Column(String(100), nullable=False, index=True)  # 예: "제공", "타겟", "영향"
    label = Column(String(255), nullable=True)  # 선 위에 표시할 라벨
    description = Column(Text, nullable=True)  # 관계 설명

    # 강도 (1-5)
    strength = Column(Integer, default=3, nullable=False)  # 1=약함, 5=매우강함

    # 양방향 관계 플래그
    is_bidirectional = Column(Boolean, default=False, nullable=False)  # True면 역방향 자동 생성됨
    reverse_edge_id = Column(Integer, ForeignKey("knowledge_network_edges.id"), nullable=True)  # 역방향 엣지 ID

    # 시각화 메타데이터
    color = Column(String(7), nullable=True, default="#3b82f6")  # HEX 색상

    # 타임스탐프
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # 인덱스 생성 (성능 최적화)
    __table_args__ = (
        # 복합 인덱스: 출발-도착 노드 쌍으로 빠른 조회
        Index("idx_source_target", "source_id", "target_id", unique=False),
        Index("idx_relationship_type", "relationship_type"),
        Index("idx_strength", "strength"),
    )

    def to_dict(self):
        """
        📝 DB 모델을 딕셔너리로 변환합니다.
        3D 프론트엔드에 JSON 응답으로 반환할 때 사용합니다.
        """
        return {
            "id": self.id,
            "source_id": self.source_id,
            "target_id": self.target_id,
            "relationship_type": self.relationship_type,
            "label": self.label,
            "description": self.description,
            "strength": self.strength,
            "is_bidirectional": self.is_bidirectional,
            "reverse_edge_id": self.reverse_edge_id,
            "color": self.color,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def to_response_dict(self):
        """
        📝 프론트엔드 응답 형식으로 변환합니다.
        Three.js와 호환되는 형식입니다.
        """
        return {
            "id": self.id,
            "source_id": self.source_id,
            "target_id": self.target_id,
            "relationship_type": self.relationship_type,
            "label": self.label,
            "description": self.description,
            "strength": self.strength,
            "color": self.color,
        }
