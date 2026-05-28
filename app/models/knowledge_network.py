# ============================================================
# 📌 모델명: KnowledgeNetwork
# 📋 목적: ElSpa 시장 지식 네트워크 노드 관리
# 🔧 기능: 3D 네트워크 시각화용 노드 데이터 저장 및 조회
# 📅 작성일: 2026-05-29
# ============================================================

from sqlalchemy import Column, Integer, String, Text, DateTime, Index
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()


class KnowledgeNetworkNode(Base):
    """
    📝 설명:
    ElSpa 시장 정보를 표현하는 지식 네트워크 노드입니다.

    각 노드는 마사지 서비스, 웰니스 정보, 판매자, 고객 세그먼트, 경영 지표 등
    다양한 카테고리의 정보를 담고 있습니다.

    예시:
    - 타이 마사지 (마사지 카테고리)
    - 존 치료사 (판매자 카테고리)
    - 기업 고객 (고객 카테고리)
    - 매출 (경영 카테고리)
    """

    __tablename__ = "knowledge_network_nodes"

    # 기본 정보
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    node_id = Column(String(100), unique=True, nullable=False, index=True)  # 고유 식별자 (elspa-market, massage-thai 등)
    label = Column(String(255), nullable=False, index=True)  # 노드 제목 (타이 마사지, 존 치료사 등)
    description = Column(Text, nullable=False)  # 노드 설명 (상세 정보)
    category = Column(String(50), nullable=False, index=True)  # 카테고리 (시장, 마사지, 웰니스, 판매자, 고객, 경영)
    color = Column(String(7), nullable=False)  # 색상 (HEX 형식: #3b82f6)

    # 메타데이터
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # 인덱스 생성 (성능 최적화)
    __table_args__ = (
        Index("idx_category", "category"),
        Index("idx_node_id", "node_id"),
        Index("idx_label", "label"),
    )

    def to_dict(self):
        """
        📝 DB 모델을 딕셔너리로 변환합니다.
        3D 프론트엔드에 JSON 응답으로 반환할 때 사용합니다.
        """
        return {
            "id": self.node_id,
            "label": self.label,
            "description": self.description,
            "category": self.category,
            "color": self.color,
            "created_at": self.created_at.isoformat(),
        }
