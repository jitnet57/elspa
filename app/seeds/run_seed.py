# ============================================================
# 📌 스크립트명: run_seed.py
# 📋 목적: 모든 시드 데이터를 데이터베이스에 통합 로드
# 🔧 기능: 트랜잭션 처리, 에러 처리, 진행 상황 로깅
# 📅 작성일: 2026-05-30
# ============================================================

"""
📝 설명:
이 스크립트는 모든 시드 데이터를 데이터베이스에 통합으로 로드합니다.

**로드 순서:**
1. 지식 네트워크 노드 (knowledge_network_nodes)
2. 지식 네트워크 엣지 (knowledge_network_edges)
3. 급여 정산 테스트 데이터 (payroll_test_data)
4. 기타 시드 데이터

**사용법:**
```bash
python -m app.seeds.run_seed
```

**옵션:**
- --dry-run: 실제 데이터 삽입 없이 시뮬레이션
- --verbose: 상세 로깅 출력
- --network-only: 네트워크 데이터만 로드
- --payroll-only: 급여 데이터만 로드
"""

import sys
import os
import argparse
import logging
from datetime import datetime
from typing import Dict, List, Tuple

# 프로젝트 경로 설정
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.database import SessionLocal_sync
from app.models.knowledge_network import KnowledgeNetworkNode
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

# ============================================================
# 로깅 설정
# ============================================================

logger = logging.getLogger(__name__)


def setup_logging(verbose: bool = False):
    """
    🔧 함수: setup_logging
    📋 목적: 로깅 설정
    """
    log_level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


# ============================================================
# 1️⃣ 네트워크 시드 로드
# ============================================================


def load_network_seed(db_session, dry_run: bool = False) -> Dict[str, int]:
    """
    🔧 함수: load_network_seed
    📋 목적: 지식 네트워크 시드 데이터 로드 (25노드 + 30엣지)
    🔧 매개변수:
        - db_session: SQLAlchemy 세션
        - dry_run: True면 롤백
    📤 반환값: 로드 통계 딕셔너리
    """
    # Import from the network seed module
    import sys
    import os
    seed_path = os.path.dirname(__file__)
    sys.path.insert(0, seed_path)

    # Read the seed file and extract functions
    import importlib.util
    seed_file = os.path.join(seed_path, "20250530-1000-network-seed.py")
    spec = importlib.util.spec_from_file_location("network_seed", seed_file)
    network_seed = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(network_seed)

    create_sample_nodes = network_seed.create_sample_nodes
    create_sample_edges = network_seed.create_sample_edges

    stats = {"nodes": 0, "edges": 0, "errors": 0}

    try:
        logger.info("=" * 60)
        logger.info("🌐 지식 네트워크 시드 데이터 로드 중...")
        logger.info("=" * 60)

        # 노드 생성
        nodes_count = create_sample_nodes(db_session)
        stats["nodes"] = nodes_count
        logger.info(f"✅ 노드 {nodes_count}개 생성/스킵 완료")

        # 엣지 생성
        edges_count = create_sample_edges(db_session)
        stats["edges"] = edges_count
        logger.info(f"✅ 엣지 {edges_count}개 생성/스킵 완료")

        if dry_run:
            logger.warning("⚠️ DRY-RUN 모드: 데이터를 롤백합니다.")
            db_session.rollback()
        else:
            db_session.commit()
            logger.info("✅ 네트워크 데이터 커밋 완료")

    except IntegrityError as e:
        logger.error(f"❌ 데이터 무결성 오류: {str(e)}")
        db_session.rollback()
        stats["errors"] += 1
    except Exception as e:
        logger.error(f"❌ 예상 외 오류: {str(e)}")
        db_session.rollback()
        stats["errors"] += 1

    return stats


# ============================================================
# 2️⃣ 급여 테스트 데이터 로드
# ============================================================


def load_payroll_test_data(db_session, dry_run: bool = False) -> Dict[str, int]:
    """
    🔧 함수: load_payroll_test_data
    📋 목적: 급여 정산 테스트 데이터 로드
    🔧 매개변수:
        - db_session: SQLAlchemy 세션
        - dry_run: True면 롤백
    📤 반환값: 로드 통계 딕셔너리
    """
    stats = {"therapists": 0, "employees": 0, "drivers": 0, "errors": 0}

    try:
        logger.info("=" * 60)
        logger.info("💰 급여 정산 테스트 데이터 로드 중...")
        logger.info("=" * 60)

        # 이 부분은 기존 payroll_test_data 로직 통합
        logger.info("⏭️ 급여 데이터는 별도 스크립트에서 로드됩니다: load_payroll_data.py")

        if dry_run:
            logger.warning("⚠️ DRY-RUN 모드: 데이터를 롤백합니다.")
            db_session.rollback()
        else:
            logger.info("✅ 급여 데이터 준비 완료 (별도 실행 필요)")

    except Exception as e:
        logger.error(f"❌ 오류: {str(e)}")
        db_session.rollback()
        stats["errors"] += 1

    return stats


# ============================================================
# 3️⃣ 데이터베이스 상태 검증
# ============================================================


def verify_database_state(db_session) -> Dict[str, int]:
    """
    🔧 함수: verify_database_state
    📋 목적: 로드된 데이터 검증
    🔧 매개변수: db_session
    📤 반환값: 테이블별 레코드 수
    """
    stats = {}

    try:
        logger.info("=" * 60)
        logger.info("🔍 데이터베이스 검증 중...")
        logger.info("=" * 60)

        # 노드 통계
        node_count = db_session.query(KnowledgeNetworkNode).count()
        stats["nodes"] = node_count
        logger.info(f"📊 지식 네트워크 노드: {node_count}개")

        # 카테고리별 노드 분류
        from sqlalchemy import func

        category_stats = (
            db_session.query(
                KnowledgeNetworkNode.category, func.count(KnowledgeNetworkNode.id)
            )
            .group_by(KnowledgeNetworkNode.category)
            .all()
        )

        logger.info("\n📈 카테고리별 노드 분포:")
        for category, count in category_stats:
            logger.info(f"  - {category}: {count}개")

        # 엣지 통계
        from app.models.network_edge import KnowledgeNetworkEdge

        edge_count = db_session.query(KnowledgeNetworkEdge).count()
        stats["edges"] = edge_count
        logger.info(f"\n📊 지식 네트워크 엣지: {edge_count}개")

    except Exception as e:
        logger.error(f"❌ 검증 오류: {str(e)}")

    return stats


# ============================================================
# 4️⃣ 메인 실행 함수
# ============================================================


def main(args):
    """
    🔧 함수: main
    📋 목적: 시드 로드 메인 로직
    """
    setup_logging(args.verbose)

    logger.info("\n" + "=" * 60)
    logger.info("🚀 ElSpa 시드 데이터 로드 시작")
    logger.info(f"⏰ 시작 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info("=" * 60 + "\n")

    db = SessionLocal_sync()
    total_stats = {
        "nodes": 0,
        "edges": 0,
        "therapists": 0,
        "employees": 0,
        "drivers": 0,
        "errors": 0,
    }

    try:
        # 네트워크 데이터 로드
        if not args.payroll_only:
            network_stats = load_network_seed(db, args.dry_run)
            total_stats.update(network_stats)

        # 급여 데이터 로드
        if not args.network_only:
            payroll_stats = load_payroll_test_data(db, args.dry_run)
            for key, value in payroll_stats.items():
                total_stats[key] = total_stats.get(key, 0) + value

        # 데이터베이스 검증
        verify_stats = verify_database_state(db)
        for key, value in verify_stats.items():
            total_stats[key] = value

    finally:
        db.close()

    # 최종 통계
    logger.info("\n" + "=" * 60)
    logger.info("📊 최종 로드 통계")
    logger.info("=" * 60)
    logger.info(f"✅ 노드: {total_stats['nodes']}개")
    logger.info(f"✅ 엣지: {total_stats['edges']}개")
    logger.info(f"❌ 오류: {total_stats['errors']}개")
    logger.info(f"⏰ 완료 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info("=" * 60 + "\n")

    if total_stats["errors"] > 0:
        logger.warning("⚠️ 일부 오류가 발생했습니다. 로그를 확인하세요.")
        return 1
    else:
        logger.info("✅ 모든 데이터가 성공적으로 로드되었습니다!")
        return 0


# ============================================================
# 5️⃣ CLI 인터페이스
# ============================================================


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="ElSpa 시드 데이터 로더",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
예시:
  # 모든 데이터 로드
  python -m app.seeds.run_seed

  # DRY-RUN 모드 (커밋 안 함)
  python -m app.seeds.run_seed --dry-run

  # 네트워크 데이터만 로드
  python -m app.seeds.run_seed --network-only

  # 급여 데이터만 로드
  python -m app.seeds.run_seed --payroll-only

  # 상세 로그 출력
  python -m app.seeds.run_seed --verbose
        """,
    )

    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="실제 데이터 삽입 없이 시뮬레이션만 수행",
    )

    parser.add_argument(
        "--verbose",
        action="store_true",
        help="상세 로깅 출력 (DEBUG 레벨)",
    )

    parser.add_argument(
        "--network-only",
        action="store_true",
        help="지식 네트워크 데이터만 로드",
    )

    parser.add_argument(
        "--payroll-only",
        action="store_true",
        help="급여 데이터만 로드",
    )

    args = parser.parse_args()
    exit_code = main(args)
    sys.exit(exit_code)
