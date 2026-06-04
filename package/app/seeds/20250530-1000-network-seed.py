# ============================================================
# 📌 파일명: 20250530-1000-network-seed.py
# 📋 목적: 지식 네트워크 샘플 데이터 (25개 노드 + 30개 엣지)
# 🔧 기능: ElSpa 시장 구조를 표현하는 확장 네트워크 시드 데이터
# 📅 작성일: 2026-05-30
# ============================================================

"""
📝 설명:
이 파일은 ElSpa 지식 네트워크의 샘플 데이터를 제공합니다.

**노드 구조 (25개):**
1. 시장 (1): 전체 시장
2. 마사지 서비스 (5): 타이, 시아츠, 스포츠, 아로마, 핫스톤
3. 웰니스 서비스 (3): 피트니스, 수치료, 명상
4. 테라피스트 (6): 여러 전문 분야의 치료사
5. 환자/고객 (5): 다양한 세그먼트 (기업, 개인, 노인, 청년, VIP)
6. 시설/인프라 (3): 지점, 장비, 관리시스템
7. 경영 지표 (2): 매출, 예약률

**엣지 구조 (30개):**
- 서비스 제공 관계
- 타겟 고객 관계
- 경쟁/대체 관계
- 협력/지원 관계
- 경영 지표 추적 관계
"""

from datetime import datetime
from decimal import Decimal

# ============================================================
# 1️⃣ 25개 샘플 노드 데이터
# ============================================================

SAMPLE_NODES = [
    # 📍 시장 정보 (1개)
    {
        "node_id": "elspa-market",
        "label": "ElSpa 시장",
        "description": "세부(Cebu) 지역의 종합 마사지 및 웰니스 서비스 시장. 기업 고객과 개인 고객을 모두 수용합니다.",
        "category": "시장",
        "color": "#ef4444",
    },

    # 💇 마사지 서비스 (5개)
    {
        "node_id": "massage-thai",
        "label": "타이 마사지",
        "description": "전통 태국식 마사지로, 경혈 치료와 근육 이완을 통해 근골격계 문제를 해결합니다.",
        "category": "마사지",
        "color": "#3b82f6",
    },
    {
        "node_id": "massage-shiatsu",
        "label": "시아츠 마사지",
        "description": "일본식 지압 마사지로, 신경계를 활성화하고 피로 회복을 돕습니다.",
        "category": "마사지",
        "color": "#3b82f6",
    },
    {
        "node_id": "massage-sports",
        "label": "스포츠 마사지",
        "description": "운동선수와 피트니스 열정가를 위한 근육 복구 및 성능 향상 마사지입니다.",
        "category": "마사지",
        "color": "#3b82f6",
    },
    {
        "node_id": "massage-aroma",
        "label": "아로마 테라피",
        "description": "향기 치료를 통한 스트레스 해소 및 정신 건강 증진 서비스입니다.",
        "category": "마사지",
        "color": "#3b82f6",
    },
    {
        "node_id": "massage-hotstone",
        "label": "핫스톤 마사지",
        "description": "따뜻한 돌을 이용한 이완 마사지로, 깊은 근육 이완과 혈액 순환 촉진을 도웁니다.",
        "category": "마사지",
        "color": "#3b82f6",
    },

    # 🧘 웰니스 서비스 (3개)
    {
        "node_id": "wellness-fitness",
        "label": "피트니스 프로그램",
        "description": "개인 맞춤형 운동 프로그램으로 신체 건강을 증진합니다.",
        "category": "웰니스",
        "color": "#8b5cf6",
    },
    {
        "node_id": "wellness-hydrotherapy",
        "label": "수치료",
        "description": "물 기반 치료로 근육 이완과 순환계 건강을 개선합니다.",
        "category": "웰니스",
        "color": "#8b5cf6",
    },
    {
        "node_id": "wellness-meditation",
        "label": "명상 프로그램",
        "description": "마음 챙김과 명상을 통한 정신 건강 및 스트레스 관리 프로그램입니다.",
        "category": "웰니스",
        "color": "#8b5cf6",
    },

    # 👨‍⚕️ 테라피스트 (6개)
    {
        "node_id": "therapist-john",
        "label": "존 테라피스트",
        "description": "타이 마사지와 스포츠 마사지 전문, 기업 고객 선호도 높음.",
        "category": "테라피스트",
        "color": "#10b981",
    },
    {
        "node_id": "therapist-maria",
        "label": "마리아 테라피스트",
        "description": "아로마 테라피와 이완 마사지 전문, VIP 고객 관리 경험 풍부.",
        "category": "테라피스트",
        "color": "#10b981",
    },
    {
        "node_id": "therapist-lee",
        "label": "이 테라피스트",
        "description": "시아츠 마사지 전문가, 신경계 건강 치료에 탁월.",
        "category": "테라피스트",
        "color": "#10b981",
    },
    {
        "node_id": "therapist-sara",
        "label": "사라 테라피스트",
        "description": "핫스톤 마사지와 웰니스 프로그램 통합 제공 전문.",
        "category": "테라피스트",
        "color": "#10b981",
    },
    {
        "node_id": "therapist-carlos",
        "label": "카를로스 테라피스트",
        "description": "스포츠 마사지와 피트니스 프로그램 통합 제공.",
        "category": "테라피스트",
        "color": "#10b981",
    },
    {
        "node_id": "therapist-ana",
        "label": "아나 테라피스트",
        "description": "수치료와 명상 프로그램 전문, 건강 증진에 초점.",
        "category": "테라피스트",
        "color": "#10b981",
    },

    # 👥 환자/고객 (5개)
    {
        "node_id": "customer-corporate",
        "label": "기업 고객",
        "description": "회사 직원 웰니스 프로그램과 출장 마사지 서비스 이용 고객.",
        "category": "환자",
        "color": "#f59e0b",
    },
    {
        "node_id": "customer-individual",
        "label": "개인 고객",
        "description": "개인 웰니스를 위해 정기적으로 마사지 서비스를 이용하는 고객.",
        "category": "환자",
        "color": "#f59e0b",
    },
    {
        "node_id": "customer-senior",
        "label": "노인 고객",
        "description": "의료 마사지와 재활 치료가 필요한 고령층 고객.",
        "category": "환자",
        "color": "#f59e0b",
    },
    {
        "node_id": "customer-athlete",
        "label": "운동선수 고객",
        "description": "스포츠 마사지와 성능 향상 프로그램 이용 고객.",
        "category": "환자",
        "color": "#f59e0b",
    },
    {
        "node_id": "customer-vip",
        "label": "VIP 고객",
        "description": "개인 전담 테라피스트와 맞춤형 서비스 이용 프리미엄 고객.",
        "category": "환자",
        "color": "#f59e0b",
    },

    # 🏢 시설/인프라 (3개)
    {
        "node_id": "facility-branch-cebu",
        "label": "세부 지점",
        "description": "ElSpa 본사 및 주요 서비스 제공 시설.",
        "category": "시설",
        "color": "#6366f1",
    },
    {
        "node_id": "facility-equipment",
        "label": "마사지 장비",
        "description": "핫스톤, 테이핑, 정형도구 등 각종 마사지 도구.",
        "category": "시설",
        "color": "#6366f1",
    },
    {
        "node_id": "facility-management-system",
        "label": "예약 관리 시스템",
        "description": "고객 예약 관리, 테라피스트 일정 조율, 결제 처리 시스템.",
        "category": "시설",
        "color": "#6366f1",
    },

    # 📊 경영 지표 (2개)
    {
        "node_id": "metric-revenue",
        "label": "월별 매출",
        "description": "마사지 서비스 판매액, 웰니스 프로그램 수수료, 부가 서비스 매출을 합산한 월별 매출 지표.",
        "category": "경영",
        "color": "#ec4899",
    },
    {
        "node_id": "metric-booking-rate",
        "label": "예약률",
        "description": "테라피스트 가용 슬롯 대비 실제 예약 비율. 높을수록 효율성 좋음.",
        "category": "경영",
        "color": "#ec4899",
    },
]

# ============================================================
# 2️⃣ 30개 샘플 엣지 데이터
# ============================================================

SAMPLE_EDGES = [
    # 🔗 시장 관계 (시장 ↔ 마사지 서비스)
    {
        "source_node_id": "elspa-market",
        "target_node_id": "massage-thai",
        "relationship_type": "포함",
        "strength": 5,
        "label": "포함",
        "description": "타이 마사지는 ElSpa 시장의 핵심 서비스입니다.",
        "color": "#3b82f6",
        "is_bidirectional": False,
    },
    {
        "source_node_id": "elspa-market",
        "target_node_id": "massage-shiatsu",
        "relationship_type": "포함",
        "strength": 5,
        "label": "포함",
        "description": "시아츠 마사지는 ElSpa 시장의 핵심 서비스입니다.",
        "color": "#3b82f6",
        "is_bidirectional": False,
    },
    {
        "source_node_id": "elspa-market",
        "target_node_id": "massage-sports",
        "relationship_type": "포함",
        "strength": 4,
        "label": "포함",
        "description": "스포츠 마사지는 ElSpa 시장의 특화 서비스입니다.",
        "color": "#3b82f6",
        "is_bidirectional": False,
    },
    {
        "source_node_id": "elspa-market",
        "target_node_id": "wellness-fitness",
        "relationship_type": "포함",
        "strength": 4,
        "label": "포함",
        "description": "피트니스 프로그램은 웰니스 포트폴리오의 일부입니다.",
        "color": "#8b5cf6",
        "is_bidirectional": False,
    },

    # 🔗 서비스 제공 관계 (테라피스트 → 마사지 서비스)
    {
        "source_node_id": "therapist-john",
        "target_node_id": "massage-thai",
        "relationship_type": "제공",
        "strength": 5,
        "label": "제공",
        "description": "존은 타이 마사지 전문가로서 고객에게 서비스합니다.",
        "color": "#10b981",
        "is_bidirectional": False,
    },
    {
        "source_node_id": "therapist-john",
        "target_node_id": "massage-sports",
        "relationship_type": "제공",
        "strength": 4,
        "label": "제공",
        "description": "존은 스포츠 마사지도 제공합니다.",
        "color": "#10b981",
        "is_bidirectional": False,
    },
    {
        "source_node_id": "therapist-maria",
        "target_node_id": "massage-aroma",
        "relationship_type": "제공",
        "strength": 5,
        "label": "제공",
        "description": "마리아는 아로마 테라피 전문가입니다.",
        "color": "#10b981",
        "is_bidirectional": False,
    },
    {
        "source_node_id": "therapist-lee",
        "target_node_id": "massage-shiatsu",
        "relationship_type": "제공",
        "strength": 5,
        "label": "제공",
        "description": "이는 시아츠 마사지 전문가입니다.",
        "color": "#10b981",
        "is_bidirectional": False,
    },
    {
        "source_node_id": "therapist-sara",
        "target_node_id": "massage-hotstone",
        "relationship_type": "제공",
        "strength": 5,
        "label": "제공",
        "description": "사라는 핫스톤 마사지 전문가입니다.",
        "color": "#10b981",
        "is_bidirectional": False,
    },
    {
        "source_node_id": "therapist-carlos",
        "target_node_id": "wellness-fitness",
        "relationship_type": "제공",
        "strength": 4,
        "label": "제공",
        "description": "카를로스는 피트니스 프로그램을 제공합니다.",
        "color": "#10b981",
        "is_bidirectional": False,
    },
    {
        "source_node_id": "therapist-ana",
        "target_node_id": "wellness-hydrotherapy",
        "relationship_type": "제공",
        "strength": 4,
        "label": "제공",
        "description": "아나는 수치료 프로그램을 제공합니다.",
        "color": "#10b981",
        "is_bidirectional": False,
    },

    # 🔗 타겟 고객 관계 (서비스 → 고객)
    {
        "source_node_id": "massage-thai",
        "target_node_id": "customer-corporate",
        "relationship_type": "타겟",
        "strength": 4,
        "label": "타겟",
        "description": "타이 마사지는 기업 고객에게 매우 인기입니다.",
        "color": "#f59e0b",
        "is_bidirectional": False,
    },
    {
        "source_node_id": "massage-sports",
        "target_node_id": "customer-athlete",
        "relationship_type": "타겟",
        "strength": 5,
        "label": "타겟",
        "description": "스포츠 마사지는 운동선수 고객을 주요 타겟입니다.",
        "color": "#f59e0b",
        "is_bidirectional": False,
    },
    {
        "source_node_id": "wellness-fitness",
        "target_node_id": "customer-individual",
        "relationship_type": "타겟",
        "strength": 4,
        "label": "타겟",
        "description": "피트니스 프로그램은 개인 고객을 주로 대상합니다.",
        "color": "#f59e0b",
        "is_bidirectional": False,
    },
    {
        "source_node_id": "wellness-meditation",
        "target_node_id": "customer-senior",
        "relationship_type": "타겟",
        "strength": 3,
        "label": "타겟",
        "description": "명상 프로그램은 노인 고객의 정신 건강을 돕습니다.",
        "color": "#f59e0b",
        "is_bidirectional": False,
    },

    # 🔗 테라피스트 ↔ 고객 관계
    {
        "source_node_id": "therapist-john",
        "target_node_id": "customer-corporate",
        "relationship_type": "담당",
        "strength": 5,
        "label": "담당",
        "description": "존은 주로 기업 고객을 담당합니다.",
        "color": "#10b981",
        "is_bidirectional": False,
    },
    {
        "source_node_id": "therapist-maria",
        "target_node_id": "customer-vip",
        "relationship_type": "담당",
        "strength": 5,
        "label": "담당",
        "description": "마리아는 VIP 고객 전담 테라피스트입니다.",
        "color": "#10b981",
        "is_bidirectional": False,
    },
    {
        "source_node_id": "therapist-lee",
        "target_node_id": "customer-senior",
        "relationship_type": "담당",
        "strength": 4,
        "label": "담당",
        "description": "이는 노인 고객의 재활 치료를 담당합니다.",
        "color": "#10b981",
        "is_bidirectional": False,
    },
    {
        "source_node_id": "therapist-carlos",
        "target_node_id": "customer-athlete",
        "relationship_type": "담당",
        "strength": 5,
        "label": "담당",
        "description": "카를로스는 운동선수 고객의 성능 향상을 담당합니다.",
        "color": "#10b981",
        "is_bidirectional": False,
    },

    # 🔗 시설 관계
    {
        "source_node_id": "facility-branch-cebu",
        "target_node_id": "facility-equipment",
        "relationship_type": "소유",
        "strength": 5,
        "label": "소유",
        "description": "세부 지점은 모든 마사지 장비를 보유하고 있습니다.",
        "color": "#6366f1",
        "is_bidirectional": False,
    },
    {
        "source_node_id": "facility-branch-cebu",
        "target_node_id": "facility-management-system",
        "relationship_type": "사용",
        "strength": 5,
        "label": "사용",
        "description": "세부 지점은 예약 관리 시스템을 적극 활용합니다.",
        "color": "#6366f1",
        "is_bidirectional": False,
    },

    # 🔗 경영 지표 관계
    {
        "source_node_id": "therapist-john",
        "target_node_id": "metric-revenue",
        "relationship_type": "기여",
        "strength": 4,
        "label": "기여",
        "description": "존의 서비스는 월별 매출의 15%를 기여합니다.",
        "color": "#ec4899",
        "is_bidirectional": False,
    },
    {
        "source_node_id": "facility-management-system",
        "target_node_id": "metric-booking-rate",
        "relationship_type": "추적",
        "strength": 5,
        "label": "추적",
        "description": "예약 관리 시스템은 예약률을 실시간으로 추적합니다.",
        "color": "#ec4899",
        "is_bidirectional": False,
    },
    {
        "source_node_id": "customer-vip",
        "target_node_id": "metric-revenue",
        "relationship_type": "기여",
        "strength": 5,
        "label": "기여",
        "description": "VIP 고객은 월별 매출의 35%를 기여하는 최고 가치 세그먼트입니다.",
        "color": "#ec4899",
        "is_bidirectional": False,
    },

    # 🔗 서비스 간 보완 관계
    {
        "source_node_id": "massage-thai",
        "target_node_id": "wellness-fitness",
        "relationship_type": "보완",
        "strength": 3,
        "label": "보완",
        "description": "마사지와 피트니스는 함께 종합 웰니스 프로그램을 구성합니다.",
        "color": "#3b82f6",
        "is_bidirectional": True,
    },
    {
        "source_node_id": "massage-hotstone",
        "target_node_id": "wellness-meditation",
        "relationship_type": "보완",
        "strength": 3,
        "label": "보완",
        "description": "핫스톤 마사지와 명상은 이완과 정신 안정을 함께 제공합니다.",
        "color": "#8b5cf6",
        "is_bidirectional": True,
    },
]

# ============================================================
# 3️⃣ 노드/엣지 생성 함수
# ============================================================


def create_sample_nodes(db_session) -> int:
    """
    🔧 함수: create_sample_nodes
    📋 목적: 25개의 샘플 노드를 데이터베이스에 생성
    📤 반환값: 생성된 노드 개수
    """
    from app.models.knowledge_network import KnowledgeNetworkNode

    created_count = 0
    for node_data in SAMPLE_NODES:
        # 기존 노드 확인
        existing_node = (
            db_session.query(KnowledgeNetworkNode)
            .filter(KnowledgeNetworkNode.node_id == node_data["node_id"])
            .first()
        )

        if not existing_node:
            new_node = KnowledgeNetworkNode(**node_data)
            db_session.add(new_node)
            created_count += 1

    db_session.commit()
    return created_count


def create_sample_edges(db_session) -> int:
    """
    🔧 함수: create_sample_edges
    📋 목적: 30개의 샘플 엣지를 데이터베이스에 생성
    📤 반환값: 생성된 엣지 개수
    """
    from app.models.knowledge_network import KnowledgeNetworkNode
    from app.models.network_edge import KnowledgeNetworkEdge

    created_count = 0
    for edge_data in SAMPLE_EDGES:
        # 노드 조회
        source_node = (
            db_session.query(KnowledgeNetworkNode)
            .filter(KnowledgeNetworkNode.node_id == edge_data["source_node_id"])
            .first()
        )
        target_node = (
            db_session.query(KnowledgeNetworkNode)
            .filter(KnowledgeNetworkNode.node_id == edge_data["target_node_id"])
            .first()
        )

        if source_node and target_node:
            # 기존 엣지 확인
            existing_edge = (
                db_session.query(KnowledgeNetworkEdge)
                .filter(
                    (KnowledgeNetworkEdge.source_id == source_node.id)
                    & (KnowledgeNetworkEdge.target_id == target_node.id)
                )
                .first()
            )

            if not existing_edge:
                new_edge = KnowledgeNetworkEdge(
                    source_id=source_node.id,
                    target_id=target_node.id,
                    relationship_type=edge_data.get("relationship_type"),
                    strength=edge_data.get("strength", 3),
                    label=edge_data.get("label"),
                    description=edge_data.get("description"),
                    is_bidirectional=edge_data.get("is_bidirectional", False),
                    color=edge_data.get("color", "#3b82f6"),
                )
                db_session.add(new_edge)
                created_count += 1

                # 양방향 엣지 생성
                if edge_data.get("is_bidirectional", False):
                    reverse_edge = KnowledgeNetworkEdge(
                        source_id=target_node.id,
                        target_id=source_node.id,
                        relationship_type=edge_data.get("relationship_type"),
                        strength=edge_data.get("strength", 3),
                        label=edge_data.get("label"),
                        description=edge_data.get("description"),
                        is_bidirectional=True,
                        color=edge_data.get("color", "#3b82f6"),
                    )
                    db_session.add(reverse_edge)
                    created_count += 1

    db_session.commit()
    return created_count


if __name__ == "__main__":
    from app.database import SessionLocal_sync

    db = SessionLocal_sync()
    try:
        nodes_created = create_sample_nodes(db)
        edges_created = create_sample_edges(db)
        print(f"✅ 노드 {nodes_created}개 생성 완료")
        print(f"✅ 엣지 {edges_created}개 생성 완료")
    finally:
        db.close()
