# ============================================================
# 📌 스크립트명: Seed Network Edges
# 📋 목적: 더미 데이터를 PostgreSQL에 마이그레이션
# 🔧 기능: 12개 링크 + 15개 노드를 DB에 저장
# 📅 작성일: 2026-05-29
# ============================================================

"""
📝 설명:
이 스크립트는 메모리의 MOCK_EDGES 데이터를 PostgreSQL 데이터베이스로 마이그레이션합니다.

**처리 순서:**
1. 기존 엣지 데이터 삭제
2. 노드 데이터 확인 (15개)
3. 엣지 데이터 생성 (12개)
4. 양방향 관계 자동 생성
5. 데이터 무결성 검증

**사용법:**
```bash
python -m app.scripts.seed_network_edges
```
"""

import sys
import os

# 프로젝트 경로 설정
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.database import SessionLocal_sync
from app.services.network_edge_service import NetworkEdgeService
from app.models.knowledge_network import KnowledgeNetworkNode
from app.utils.logging_config import get_logger

logger = get_logger(__name__)

# ============================================================
# 더미 데이터 (메모리 → DB 마이그레이션)
# ============================================================

MOCK_EDGES_DATA = [
    {
        "source_node_id": "therapist-john",
        "target_node_id": "massage-thai",
        "relationship_type": "제공",
        "strength": 5,
        "description": "존이 타이 마사지 전문가로서 고객에게 제공합니다.",
        "label": "제공",
        "color": "#3b82f6",
        "is_bidirectional": False,
    },
    {
        "source_node_id": "therapist-john",
        "target_node_id": "customer-segment-corporate",
        "relationship_type": "타겟",
        "strength": 4,
        "description": "존의 마사지는 기업 고객에게 매우 인기가 높습니다.",
        "label": "타겟",
        "color": "#10b981",
        "is_bidirectional": False,
    },
    {
        "source_node_id": "massage-thai",
        "target_node_id": "customer-segment-corporate",
        "relationship_type": "영향",
        "strength": 4,
        "description": "타이 마사지는 기업 고객들이 가장 많이 선호하는 서비스입니다.",
        "label": "영향",
        "color": "#8b5cf6",
        "is_bidirectional": False,
    },
    {
        "source_node_id": "therapist-maria",
        "target_node_id": "massage-aromatherapy",
        "relationship_type": "전문",
        "strength": 5,
        "description": "마리아는 아로마테라피 전문가로서 5성 평점을 유지합니다.",
        "label": "전문",
        "color": "#f59e0b",
        "is_bidirectional": False,
    },
    {
        "source_node_id": "massage-aromatherapy",
        "target_node_id": "wellness-spa",
        "relationship_type": "통합",
        "strength": 4,
        "description": "아로마테라피는 스파 서비스와 함께 제공되며 웰니스 경험을 향상시킵니다.",
        "label": "통합",
        "color": "#ec4899",
        "is_bidirectional": False,
    },
    {
        "source_node_id": "therapist-david",
        "target_node_id": "massage-sports",
        "relationship_type": "전문",
        "strength": 5,
        "description": "데이빗은 스포츠 마사지 전문가로서 국가대표팀 경험이 있습니다.",
        "label": "전문",
        "color": "#f59e0b",
        "is_bidirectional": False,
    },
    {
        "source_node_id": "therapist-david",
        "target_node_id": "customer-segment-athletes",
        "relationship_type": "타겟",
        "strength": 5,
        "description": "데이빗의 스포츠 마사지는 운동선수들에게 매우 인기가 높습니다.",
        "label": "타겟",
        "color": "#10b981",
        "is_bidirectional": False,
    },
    {
        "source_node_id": "therapist-park",
        "target_node_id": "massage-korean",
        "relationship_type": "전문",
        "strength": 5,
        "description": "박 치료사는 한식 마사지 전문가로서 25년의 경력을 가집니다.",
        "label": "전문",
        "color": "#f59e0b",
        "is_bidirectional": False,
    },
    {
        "source_node_id": "massage-korean",
        "target_node_id": "customer-segment-elderly",
        "relationship_type": "영향",
        "strength": 4,
        "description": "한식 마사지는 시니어 고객들에게 매우 인기가 높습니다.",
        "label": "영향",
        "color": "#8b5cf6",
        "is_bidirectional": False,
    },
    {
        "source_node_id": "massage-sports",
        "target_node_id": "customer-segment-athletes",
        "relationship_type": "영향",
        "strength": 5,
        "description": "스포츠 마사지는 운동선수들의 최고 선호 서비스입니다.",
        "label": "영향",
        "color": "#8b5cf6",
        "is_bidirectional": False,
    },
    {
        "source_node_id": "therapist-john",
        "target_node_id": "wellness-center",
        "relationship_type": "제휴",
        "strength": 4,
        "description": "존은 웰니스 센터와 파트너십을 유지하며 고품질 서비스를 제공합니다.",
        "label": "제휴",
        "color": "#ec4899",
        "is_bidirectional": True,  # 양방향
    },
    {
        "source_node_id": "customer-segment-corporate",
        "target_node_id": "revenue",
        "relationship_type": "기여",
        "strength": 5,
        "description": "기업 고객은 ElSpa의 주요 수익원입니다.",
        "label": "기여",
        "color": "#06b6d4",
        "is_bidirectional": False,
    },
]


def seed_edges(db):
    """
    🔧 함수: seed_edges
    📋 목적: 엣지 데이터를 데이터베이스에 저장
    """

    logger.info("=" * 60)
    logger.info("📊 네트워크 엣지 데이터 마이그레이션 시작")
    logger.info("=" * 60)

    try:
        # 서비스 초기화
        service = NetworkEdgeService(db)

        # 노드 매핑 (node_id → DB id)
        nodes = db.query(KnowledgeNetworkNode).all()
        node_map = {node.node_id: node.id for node in nodes}

        logger.info(f"📋 DB에 저장된 노드 개수: {len(nodes)}")
        logger.info(f"📋 마이그레이션할 엣지 개수: {len(MOCK_EDGES_DATA)}")

        # 기존 엣지 삭제 (테스트용)
        db.query(KnowledgeNetworkEdge).delete()
        db.commit()
        logger.info("🗑️ 기존 엣지 데이터 삭제 완료")

        # 엣지 생성
        created_edges = []
        failed_count = 0

        for idx, edge_data in enumerate(MOCK_EDGES_DATA, 1):
            try:
                # node_id → DB id로 변환
                source_id = node_map.get(edge_data["source_node_id"])
                target_id = node_map.get(edge_data["target_node_id"])

                if not source_id:
                    logger.warning(
                        f"⚠️ 출발 노드를 찾을 수 없습니다: {edge_data['source_node_id']}"
                    )
                    failed_count += 1
                    continue

                if not target_id:
                    logger.warning(
                        f"⚠️ 도착 노드를 찾을 수 없습니다: {edge_data['target_node_id']}"
                    )
                    failed_count += 1
                    continue

                # 엣지 생성
                edge = service.create_edge(
                    source_id=source_id,
                    target_id=target_id,
                    relationship_type=edge_data["relationship_type"],
                    strength=edge_data["strength"],
                    label=edge_data.get("label"),
                    description=edge_data.get("description"),
                    color=edge_data.get("color"),
                    is_bidirectional=edge_data.get("is_bidirectional", False),
                )

                created_edges.append(edge)
                logger.info(
                    f"  [{idx:2d}] ✅ {edge_data['source_node_id']} "
                    f"→ {edge_data['target_node_id']} "
                    f"({edge_data['relationship_type']})"
                )

                # 양방향이면 역방향도 기록
                if edge_data.get("is_bidirectional", False):
                    logger.info(
                        f"       ↔️ 역방향 자동 생성: {edge_data['target_node_id']} "
                        f"→ {edge_data['source_node_id']}"
                    )

            except Exception as e:
                logger.error(f"  ❌ 엣지 생성 실패: {edge_data} - {e}")
                failed_count += 1

        # 결과 요약
        logger.info("=" * 60)
        logger.info("📊 마이그레이션 완료")
        logger.info("=" * 60)
        logger.info(f"✅ 성공: {len(created_edges)}/{len(MOCK_EDGES_DATA)}")
        logger.info(f"❌ 실패: {failed_count}/{len(MOCK_EDGES_DATA)}")

        # 데이터 무결성 검증
        total_edges = db.query(KnowledgeNetworkEdge).count()
        logger.info(f"📊 DB 현재 엣지 개수: {total_edges}")

        # 양방향 엣지 확인
        bidirectional_edges = db.query(KnowledgeNetworkEdge).filter(
            KnowledgeNetworkEdge.is_bidirectional == True
        ).count()
        logger.info(f"↔️ 양방향 엣지 개수: {bidirectional_edges}")

        logger.info("=" * 60)

        return len(created_edges), failed_count

    except Exception as e:
        logger.error(f"❌ 마이그레이션 중 오류: {e}", exc_info=True)
        db.rollback()
        raise


def main():
    """
    🔧 함수: main
    📋 목적: 마이그레이션 실행
    """

    print("\n" + "=" * 60)
    print("🚀 Network Edges 데이터 마이그레이션 시작")
    print("=" * 60 + "\n")

    db = SessionLocal_sync()

    try:
        # 엣지 마이그레이션
        success, failed = seed_edges(db)

        print(f"\n✅ 마이그레이션 완료!")
        print(f"   성공: {success}개")
        print(f"   실패: {failed}개\n")

    except Exception as e:
        print(f"\n❌ 마이그레이션 실패: {e}\n")
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()
