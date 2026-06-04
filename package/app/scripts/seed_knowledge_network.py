# ============================================================
# 📌 스크립트명: Knowledge Network 초기 데이터 삽입
# 📋 목적: 지식 네트워크 노드의 초기 데이터를 데이터베이스에 삽입
# 🔧 사용법: python -m app.scripts.seed_knowledge_network
# 📅 작성일: 2026-05-29
# ============================================================

"""
설명:
이 스크립트는 ElSpa 시장 정보를 표현하는 지식 네트워크 노드의 초기 데이터를 삽입합니다.

카테고리:
- 시장: 전체 시장 개요
- 마사지: 마사지 서비스 유형
- 웰니스: 웰니스 및 건강 관리 서비스
- 판매자: 테라피스트 및 서비스 제공자
- 고객: 고객 세그먼트
- 경영: 경영 지표 (매출, 예약률 등)
"""

from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
import os
import sys

# 프로젝트 루트 추가
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.database import SessionLocal
from app.models.knowledge_network import KnowledgeNetworkNode


SAMPLE_NODES = [
    # 📍 시장 정보
    {
        "node_id": "elspa-market",
        "label": "ElSpa 시장",
        "description": "세부(Cebu) 지역의 종합 마사지 및 웰니스 서비스 시장. 다양한 서비스 유형과 고객 세그먼트를 포함합니다.",
        "category": "시장",
        "color": "#ef4444",
    },

    # 💇 마사지 서비스
    {
        "node_id": "massage-thai",
        "label": "타이 마사지",
        "description": "전통 태국식 마사지, 경혈 치료, 근육 이완. 근골격계 문제 해결에 효과적입니다.",
        "category": "마사지",
        "color": "#3b82f6",
    },
    {
        "node_id": "massage-shiatsu",
        "label": "시아츠 마사지",
        "description": "일본식 지압 마사지, 신경계 활성화. 피로 회복과 스트레스 완화에 효과적입니다.",
        "category": "마사지",
        "color": "#3b82f6",
    },
    {
        "node_id": "massage-sports",
        "label": "스포츠 마사지",
        "description": "운동 선수 전문 마사지, 근육 회복 치료. 부상 예방 및 성능 향상에 도움됩니다.",
        "category": "마사지",
        "color": "#3b82f6",
    },
    {
        "node_id": "massage-aromatherapy",
        "label": "아로마테라피",
        "description": "향기 요법, 정신 건강 개선, 스트레스 완화. 에센셜 오일을 사용한 치료법입니다.",
        "category": "마사지",
        "color": "#3b82f6",
    },
    {
        "node_id": "massage-korean",
        "label": "한식 마사지",
        "description": "한의학 기반 마사지, 경락 치료, 체질 맞춤 관리. 전통 한의학 이론을 적용합니다.",
        "category": "마사지",
        "color": "#3b82f6",
    },

    # 💆 웰니스 서비스
    {
        "node_id": "wellness-spa",
        "label": "스파",
        "description": "고급 휴식 및 피부 관리 서비스. 온열 치료, 수중 마사지, 스킨케어를 포함합니다.",
        "category": "웰니스",
        "color": "#10b981",
    },
    {
        "node_id": "wellness-yoga",
        "label": "요가",
        "description": "신체 단련, 명상, 유연성 증진. 신체와 정신의 조화를 이루는 운동입니다.",
        "category": "웰니스",
        "color": "#10b981",
    },
    {
        "node_id": "wellness-meditation",
        "label": "명상",
        "description": "마음챙김 명상, 스트레스 해소, 정신 수양. 정신 건강 개선에 효과적입니다.",
        "category": "웰니스",
        "color": "#10b981",
    },
    {
        "node_id": "wellness-acupuncture",
        "label": "침술",
        "description": "한의학 침술 치료, 통증 관리, 혈액 순환 개선. 다양한 질환 치료에 사용됩니다.",
        "category": "웰니스",
        "color": "#10b981",
    },

    # 👥 판매자 정보
    {
        "node_id": "therapist-john",
        "label": "존 (치료사)",
        "description": "경력 10년의 마사지 전문가, 타이 마사지 전공. 높은 고객 만족도와 재방문율을 자랑합니다.",
        "category": "판매자",
        "color": "#f59e0b",
    },
    {
        "node_id": "therapist-maria",
        "label": "마리아 (치료사)",
        "description": "스파 및 아로마테라피 전문, 5성 평점 유지. 개인 맞춤 서비스로 유명합니다.",
        "category": "판매자",
        "color": "#f59e0b",
    },
    {
        "node_id": "therapist-david",
        "label": "데이빗 (치료사)",
        "description": "스포츠 마사지 전문, 국가대표팀 경험. 운동선수와 활동적인 고객들의 신뢰를 받습니다.",
        "category": "판매자",
        "color": "#f59e0b",
    },
    {
        "node_id": "therapist-park",
        "label": "박 치료사",
        "description": "한식 마사지 전문, 25년 경력. 전통 한의학 이론을 실무에 적용합니다.",
        "category": "판매자",
        "color": "#f59e0b",
    },

    # 👤 고객 정보
    {
        "node_id": "customer-segment-corporate",
        "label": "기업 고객",
        "description": "회사원, 임원진, 스트레스 관리 필요. 정기적인 웰니스 관리를 선호합니다.",
        "category": "고객",
        "color": "#8b5cf6",
    },
    {
        "node_id": "customer-segment-athletes",
        "label": "운동선수",
        "description": "축구, 농구, 피트니스 선수들. 성능 향상과 부상 회복을 위해 마사지를 이용합니다.",
        "category": "고객",
        "color": "#8b5cf6",
    },
    {
        "node_id": "customer-segment-elderly",
        "label": "시니어",
        "description": "65세 이상, 건강 관리 필요. 통증 완화와 혈액 순환 개선을 위해 이용합니다.",
        "category": "고객",
        "color": "#8b5cf6",
    },
    {
        "node_id": "customer-segment-wellness",
        "label": "웰니스 애호가",
        "description": "건강한 생활방식 추구, 정기적 관리 선호. 예방 의료에 관심 많습니다.",
        "category": "고객",
        "color": "#8b5cf6",
    },
    {
        "node_id": "customer-segment-tourist",
        "label": "관광객",
        "description": "국내외 관광객, 휴가 중 웰니스 관광. 일회성 및 단기 이용이 많습니다.",
        "category": "고객",
        "color": "#8b5cf6",
    },

    # 📊 경영 정보
    {
        "node_id": "business-revenue",
        "label": "매출",
        "description": "월별 총 매출액, 성장률 추이. 서비스 유형별, 고객 세그먼트별 매출 분석을 포함합니다.",
        "category": "경영",
        "color": "#ec4899",
    },
    {
        "node_id": "business-occupancy",
        "label": "예약률",
        "description": "침대/방 사용률, 피크 시간. 시간대별, 요일별 예약 현황을 나타냅니다.",
        "category": "경영",
        "color": "#ec4899",
    },
    {
        "node_id": "business-customer-retention",
        "label": "고객 유지율",
        "description": "재방문 고객 비율, 만족도 지수. 장기 고객의 충성도를 측정합니다.",
        "category": "경영",
        "color": "#ec4899",
    },
    {
        "node_id": "business-service-mix",
        "label": "서비스 구성",
        "description": "서비스 유형별 비율, 인기도 분석. 마사지, 스파, 웰니스 등 서비스 믹스를 분석합니다.",
        "category": "경영",
        "color": "#ec4899",
    },
    {
        "node_id": "business-cost-structure",
        "label": "비용 구조",
        "description": "인건비, 임차료, 재료비, 기타 운영비. 수익성 개선 기회를 파악합니다.",
        "category": "경영",
        "color": "#ec4899",
    },
]


def seed_knowledge_network():
    """
    📌 함수: seed_knowledge_network
    📋 목적: 지식 네트워크 초기 데이터를 데이터베이스에 삽입합니다.
    """
    db: Session = SessionLocal()

    try:
        # 기존 데이터 확인
        existing_count = db.query(KnowledgeNetworkNode).count()
        print(f"📊 기존 노드 개수: {existing_count}")

        if existing_count > 0:
            print("⚠️ 기존 데이터가 있습니다. 생략합니다.")
            return

        # 데이터 삽입
        for node_data in SAMPLE_NODES:
            node = KnowledgeNetworkNode(**node_data)
            db.add(node)

        db.commit()
        print(f"✅ {len(SAMPLE_NODES)}개의 노드가 추가되었습니다.")

        # 카테고리별 통계
        categories = db.query(KnowledgeNetworkNode.category).distinct().all()
        print("\n📋 카테고리별 노드 개수:")
        for cat in categories:
            count = db.query(KnowledgeNetworkNode).filter(
                KnowledgeNetworkNode.category == cat[0]
            ).count()
            print(f"  - {cat[0]}: {count}개")

    except Exception as e:
        db.rollback()
        print(f"❌ 오류 발생: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_knowledge_network()
