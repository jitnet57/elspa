# ============================================================
# 📌 서비스명: Knowledge Network Seeder
# 📋 목적: ElSpa 지식 네트워크 초기 데이터 삽입
# 🔧 기능: 16개 샘플 노드 자동 생성 (DB에 삽입)
# 📅 작성일: 2026-05-29
# ============================================================

"""
📝 설명:
Order 048의 16개 지식 네트워크 노드를 PostgreSQL에 자동 삽입합니다.

노드 구성:
1. 시장 정보 (1개): ElSpa 시장
2. 마사지 서비스 (4개): 타이, 시아츠, 스포츠, 아로마테라피
3. 웰니스 (3개): 스파, 요가, 명상
4. 판매자 (3개): 존, 마리아, 데이빗
5. 고객 세그먼트 (3개): 기업, 운동선수, 시니어
6. 경영 지표 (3개): 매출, 예약률, 고객유지율
"""

from sqlalchemy.orm import Session
from app.models.knowledge_network import KnowledgeNetworkNode
from app.utils.logging_config import get_logger

logger = get_logger(__name__)


# ============================================================
# 샘플 노드 데이터
# ============================================================

SAMPLE_NODES = [
    # 📍 시장 정보
    {
        "node_id": "elspa-market",
        "label": "ElSpa 시장",
        "description": "세부(Cebu) 지역의 종합 마사지 및 웰니스 서비스 시장",
        "category": "시장",
        "color": "#ef4444",
    },
    # 💇 마사지 서비스
    {
        "node_id": "massage-thai",
        "label": "타이 마사지",
        "description": "전통 태국식 마사지, 경혈 치료, 근육 이완",
        "category": "마사지",
        "color": "#3b82f6",
    },
    {
        "node_id": "massage-shiatsu",
        "label": "시아츠 마사지",
        "description": "일본식 지압 마사지, 신경계 활성화",
        "category": "마사지",
        "color": "#3b82f6",
    },
    {
        "node_id": "massage-sports",
        "label": "스포츠 마사지",
        "description": "운동 선수 전문 마사지, 근육 회복 치료",
        "category": "마사지",
        "color": "#3b82f6",
    },
    {
        "node_id": "massage-aromatherapy",
        "label": "아로마테라피",
        "description": "향기 요법, 정신 건강 개선, 스트레스 완화",
        "category": "마사지",
        "color": "#3b82f6",
    },
    # 💆 웰니스 서비스
    {
        "node_id": "wellness-spa",
        "label": "스파",
        "description": "고급 휴식 및 피부 관리 서비스",
        "category": "웰니스",
        "color": "#10b981",
    },
    {
        "node_id": "wellness-yoga",
        "label": "요가",
        "description": "신체 단련, 명상, 유연성 증진",
        "category": "웰니스",
        "color": "#10b981",
    },
    {
        "node_id": "wellness-meditation",
        "label": "명상",
        "description": "마음챙김 명상, 스트레스 해소, 정신 수양",
        "category": "웰니스",
        "color": "#10b981",
    },
    # 👥 판매자 정보
    {
        "node_id": "therapist-john",
        "label": "존 (치료사)",
        "description": "경력 10년의 마사지 전문가, 타이 마사지 전공",
        "category": "판매자",
        "color": "#f59e0b",
    },
    {
        "node_id": "therapist-maria",
        "label": "마리아 (치료사)",
        "description": "스파 및 아로마테라피 전문, 5성 평점 유지",
        "category": "판매자",
        "color": "#f59e0b",
    },
    {
        "node_id": "therapist-david",
        "label": "데이빗 (치료사)",
        "description": "스포츠 마사지 전문, 국가대표팀 경험",
        "category": "판매자",
        "color": "#f59e0b",
    },
    # 👤 고객 정보
    {
        "node_id": "customer-segment-corporate",
        "label": "기업 고객",
        "description": "회사원, 임원진, 스트레스 관리 필요",
        "category": "고객",
        "color": "#8b5cf6",
    },
    {
        "node_id": "customer-segment-athletes",
        "label": "운동선수",
        "description": "축구, 농구, 피트니스 선수들",
        "category": "고객",
        "color": "#8b5cf6",
    },
    {
        "node_id": "customer-segment-elderly",
        "label": "시니어",
        "description": "65세 이상, 건강 관리 필요",
        "category": "고객",
        "color": "#8b5cf6",
    },
    # 📊 경영 정보
    {
        "node_id": "business-revenue",
        "label": "매출",
        "description": "월별 총 매출액, 성장률 추이",
        "category": "경영",
        "color": "#ec4899",
    },
    {
        "node_id": "business-occupancy",
        "label": "예약률",
        "description": "침대/방 사용률, 피크 시간",
        "category": "경영",
        "color": "#ec4899",
    },
    {
        "node_id": "business-customer-retention",
        "label": "고객 유지율",
        "description": "재방문 고객 비율, 만족도 지수",
        "category": "경영",
        "color": "#ec4899",
    },
]


# ============================================================
# 시더 함수
# ============================================================


async def seed_knowledge_network(db: Session) -> dict:
    """
    📌 함수: seed_knowledge_network
    📋 목적: 지식 네트워크 샘플 데이터를 데이터베이스에 삽입합니다.
    🔧 매개변수: db (SQLAlchemy Session)
    📤 반환값: {inserted: int, skipped: int, total: int}
    """

    logger.info("🌱 지식 네트워크 시드 시작...")

    inserted_count = 0
    skipped_count = 0

    try:
        for node_data in SAMPLE_NODES:
            # 중복 확인
            existing = db.query(KnowledgeNetworkNode).filter(
                KnowledgeNetworkNode.node_id == node_data["node_id"]
            ).first()

            if existing:
                logger.debug(f"⏭️ 이미 존재하는 노드: {node_data['node_id']}")
                skipped_count += 1
                continue

            # 새 노드 생성
            new_node = KnowledgeNetworkNode(
                node_id=node_data["node_id"],
                label=node_data["label"],
                description=node_data["description"],
                category=node_data["category"],
                color=node_data["color"],
            )

            db.add(new_node)
            inserted_count += 1
            logger.debug(f"✅ 노드 추가: {node_data['node_id']}")

        # 커밋
        db.commit()
        logger.info(
            f"✅ 시드 완료: {inserted_count}개 삽입, {skipped_count}개 스킵"
        )

        return {
            "inserted": inserted_count,
            "skipped": skipped_count,
            "total": len(SAMPLE_NODES),
        }

    except Exception as e:
        db.rollback()
        logger.error(f"❌ 시드 실패: {e}", exc_info=True)
        raise


# ============================================================
# 통계 함수
# ============================================================


def get_knowledge_network_stats(db: Session) -> dict:
    """
    📌 함수: get_knowledge_network_stats
    📋 목적: 지식 네트워크 노드 통계를 반환합니다.
    🔧 매개변수: db (SQLAlchemy Session)
    📤 반환값: {total_nodes: int, categories: dict}
    """

    try:
        # 총 노드 개수
        total_nodes = db.query(KnowledgeNetworkNode).count()

        # 카테고리별 노드 개수
        categories = db.query(
            KnowledgeNetworkNode.category,
            db.func.count(KnowledgeNetworkNode.id).label("count")
        ).group_by(KnowledgeNetworkNode.category).all()

        category_dict = {cat[0]: cat[1] for cat in categories}

        logger.info(f"📊 통계: {total_nodes}개 노드, {len(category_dict)}개 카테고리")

        return {
            "total_nodes": total_nodes,
            "categories": category_dict,
        }

    except Exception as e:
        logger.error(f"❌ 통계 조회 실패: {e}", exc_info=True)
        raise
