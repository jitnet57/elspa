# ============================================================
# 📌 파일명: payroll_bmad_state.py
# 📋 목적: BMAD × LangGraph 급여 정산 시스템 상태 스키마
# 🔧 기능: Phase 1-4 아티팩트를 TypedDict로 정의
# 📅 작성일: 2026-05-28
# ============================================================

from typing import TypedDict, Annotated, List, Optional
from operator import add


class AnalysisState(TypedDict):
    """Phase 1: Analyst가 생성하는 요구사항 분석"""
    request: str  # 사용자 입력 (급여 정산 요청)
    current_features: List[str]  # 기존 기능 목록
    requirements: List[str]  # 도출된 요구사항
    parallel_needs: List[str]  # 병렬 처리 필요 항목
    project_brief: str  # 분석 결과 요약


class PlanState(TypedDict):
    """Phase 2: PM + UX가 생성하는 계획 및 설계"""
    project_brief: str  # Phase 1 인수
    prd: str  # PRD (Product Requirements Document)
    ux_spec: str  # UX 스펙 (폼 설계, 에러 처리, 배치 UI)
    user_stories: List[str]  # 사용자 스토리 목록


class SolutionState(TypedDict):
    """Phase 3: Architect + SM이 생성하는 솔루션 설계"""
    prd: str  # Phase 2 인수
    ux_spec: str  # Phase 2 인수
    architecture: str  # 아키텍처 설계 (API, 병렬 처리, DB 스키마)
    epics: List[str]  # Epic 분해
    stories: List[str]  # 구체적 개발 스토리 (frontend/backend 태그 포함)
    acceptance_criteria: dict  # 각 스토리의 검수 기준


class ImplementationState(TypedDict):
    """Phase 4: Dev + QA가 생성하는 구현 및 검증"""
    stories: List[str]  # Phase 3 인수
    architecture: str  # Phase 3 인수
    completed_stories: Annotated[List[str], add]  # 완료된 스토리 (누적)
    source_files: dict  # {"frontend": {...}, "backend": {...}}
    test_results: dict  # 테스트 결과
    qa_report: str  # QA 최종 보고서


class FullStackState(TypedDict):
    """
    전체 상태 컨텍스트 (모든 phase 공유)

    Phase 1: Analyst → analysis 필드 채우기
    Phase 2: PM, UX → plan 필드 채우기
    Phase 3: Architect, SM → solution 필드 채우기
    Phase 4: Dev, QA → implementation 필드 채우기
    """
    # 입력
    request: str

    # Phase 1 (Analysis)
    project_brief: str
    requirements: List[str]
    current_features: List[str]
    parallel_needs: List[str]

    # Phase 2 (Planning)
    prd: str
    ux_spec: str
    user_stories: List[str]

    # Phase 3 (Solutioning)
    architecture: str
    epics: List[str]
    stories: List[str]
    acceptance_criteria: dict

    # Phase 4 (Implementation)
    frontend_files: dict  # {filename: code}
    backend_files: dict   # {filename: code}
    test_results: dict
    qa_report: str
    completed_stories: Annotated[List[str], add]

    # Meta
    thread_id: str
    phase: str  # "analysis" | "planning" | "solutioning" | "implementation"
    approved: bool


# ============================================================
# 상태 필드 정의
# ============================================================

ANALYSIS_OUTPUT = """
분석 결과 (Phase 1 Analyst):
- 현재 기능: Dashboard, Payroll Periods, Payroll Calc (기본)
- 요구사항:
  1. 다중 직원 병렬 급여 계산
  2. 배치 처리 (CSV 업로드 지원)
  3. 검증 & 에러 처리
  4. 계산 결과 저장 & 조회
- 병렬 처리:
  1. 입력값 검증 병렬화
  2. 다중 직원 동시 계산
  3. DB 배치 저장
"""

PLANNING_OUTPUT = """
계획 (Phase 2 PM + UX):
- PRD: Payroll Calculation System v1.0
- UX Spec:
  1. 단일 직원 계산 폼 개선
  2. 배치 업로드 UI (CSV)
  3. 계산 진행률 표시
  4. 에러 메시지 & 유효성 검사
  5. 결과 다운로드 기능
- 스토리:
  1. 단일 직원 급여 계산
  2. 배치 CSV 업로드
  3. 계산 결과 저장
  4. 병렬 검증 & 에러 처리
"""

SOLUTION_OUTPUT = """
솔루션 (Phase 3 Architect + SM):
- Architecture:
  1. Frontend: React 폼 + 배치 UI
  2. Backend: FastAPI payroll routes
  3. 병렬 처리: asyncio + ProcessPoolExecutor
  4. 검증: Pydantic schemas
- Epics:
  1. Payroll Input & Validation
  2. Batch Processing
  3. Calculation Engine
  4. Storage & Reporting
- Stories (태그 포함):
  1. [frontend] 폼 입력 개선
  2. [frontend] 배치 CSV 업로드
  3. [backend] 급여 계산 API
  4. [backend] 배치 처리 엔드포인트
  5. [backend] 검증 로직
  6. [backend] 병렬 계산 (asyncio)
"""

IMPLEMENTATION_OUTPUT = """
구현 (Phase 4 Dev + QA):
- Frontend:
  1. payroll-form.tsx: 단일 계산 폼
  2. payroll-batch.tsx: 배치 업로드
  3. payroll-hooks.ts: 상태 관리
- Backend:
  1. payroll_routes.py: API 엔드포인트
  2. payroll_service.py: 계산 로직
  3. payroll_models.py: DB 모델
  4. payroll_schemas.py: Pydantic 검증
- 테스트:
  1. test_payroll_calc.py
  2. test_payroll_api.py
  3. e2e 테스트
"""
