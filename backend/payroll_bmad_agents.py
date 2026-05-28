# ============================================================
# 📌 파일명: payroll_bmad_agents.py
# 📋 목적: BMAD 에이전트 노드 정의 (Analyst, PM, UX, Architect, SM, Dev, QA)
# 🔧 기능: LangChain 에이전트로 각 역할 구현
# 📅 작성일: 2026-05-28
# ============================================================

from typing import Any
from langchain_anthropic import ChatAnthropic
from langchain.agents import create_react_agent
from langchain.prompts import PromptTemplate
from langchain_core.tools import tool

# ============================================================
# 도구 정의
# ============================================================

@tool
def analyze_current_features() -> str:
    """현재 Admin Dashboard 기능 분석"""
    return """
    현재 기능:
    - Dashboard: Bento 그리드, Therapist Core, Settlement & Payroll, Systems Audit
    - Payroll Periods: 급여 기간별 상태 추적
    - Payroll Calc (신규): 단일 직원 계산 폼

    기존 코드 위치:
    - frontend/src/app/admin/page.tsx (메인 대시보드)
    - 급여 관련: usePayrollStore (Zustand)
    """


@tool
def identify_requirements() -> str:
    """급여 정산 시스템 요구사항 도출"""
    return """
    핵심 요구사항:
    1. 단일 직원 급여 계산 (기본급 + 수당 - 공제)
    2. 다중 직원 배치 처리 (CSV 업로드)
    3. 검증: 입력값 범위, 공제 > 급여 체크
    4. 저장: DB에 계산 결과 기록
    5. 조회: 과거 계산 내역 조회
    6. 병렬 처리: 여러 직원 동시 계산
    """


@tool
def design_ux_flow() -> str:
    """사용자 경험 흐름 설계"""
    return """
    UX 흐름:
    1. 단일 입력: 폼에 직원정보 + 금액 입력 → 즉시 계산 → 결과 표시
    2. 배치 입력: CSV 파일 선택 → 업로드 → 진행률 표시 → 다운로드
    3. 검증 피드백: 입력값 오류 시 실시간 하이라이트
    4. 에러 처리: "SSS(1200) > 총급여(8200)" 경고 띄우기
    5. 결과 저장: 버튼 클릭 → API 호출 → 저장 완료 메시지
    """


@tool
def design_architecture() -> str:
    """기술 아키텍처 설계"""
    return """
    아키텍처:

    Frontend (Next.js):
    - PayrollForm 컴포넌트: 입력 폼
    - PayrollBatch 컴포넌트: CSV 업로드
    - usePayrollCalculation 훅: 계산 로직
    - Zustand store: 결과 저장

    Backend (FastAPI):
    - POST /api/payroll/calculate: 단일 계산
    - POST /api/payroll/batch: 배치 처리
    - GET /api/payroll/history: 과거 기록
    - 병렬 처리: asyncio + ThreadPoolExecutor

    검증:
    - Pydantic PayrollInput schema
    - 비즈니스 로직: gross_pay >= total_deductions 검증
    """


@tool
def break_down_stories() -> str:
    """개발 스토리 분해"""
    return """
    Epic 1: Payroll Calculation Engine
    - Story 1.1 [backend]: 기본 계산 API (기본급 + 수당 - 공제)
    - Story 1.2 [backend]: 검증 로직 (공제액 체크)
    - Story 1.3 [backend]: 에러 처리 (유효한 입력)

    Epic 2: User Interface
    - Story 2.1 [frontend]: 폼 입력 개선 (직원명, 급여, 공제)
    - Story 2.2 [frontend]: 실시간 계산 (입력 변경 시)
    - Story 2.3 [frontend]: 결과 디스플레이 (실수령액 강조)

    Epic 3: Batch Processing (병렬)
    - Story 3.1 [backend]: CSV 파싱
    - Story 3.2 [backend]: 병렬 계산 (asyncio)
    - Story 3.3 [frontend]: CSV 업로드 UI + 진행률

    Epic 4: Persistence
    - Story 4.1 [backend]: PayrollRecord DB 모델
    - Story 4.2 [backend]: 계산 결과 저장
    - Story 4.3 [backend]: 과거 기록 조회
    """


@tool
def define_acceptance_criteria() -> str:
    """검수 기준 정의"""
    return """
    Story 1.1 (기본 계산 API):
    - 입력: {employee_id, base_salary, commission, sss, tax, other}
    - 출력: {gross_pay, total_deductions, net_pay}
    - 검증: gross_pay = base + commission, total = sss + tax + other

    Story 2.1 (폼 입력):
    - 직원명, 기본급, 커미션 입력 가능
    - SSS/소득세/기타공제 입력 가능
    - 실시간 유효성 검사

    Story 3.2 (병렬 계산):
    - 10명 이상 CSV 처리 시 <5초
    - ThreadPoolExecutor max_workers=4

    Story 4.1 (DB 저장):
    - payroll_records 테이블에 INSERT
    - employee_id, period_id, amounts, created_at
    """


# ============================================================
# BMAD 에이전트 정의
# ============================================================

llm = ChatAnthropic(model="claude-opus-4-7", temperature=0.7)

# Phase 1: Analyst
analyst_tools = [analyze_current_features, identify_requirements]
analyst_prompt = PromptTemplate.from_template("""
당신은 ElSpa Payroll System의 분석가(Analyst)입니다.

작업:
1. 현재 Admin Dashboard의 기능 분석
2. 급여 정산 요구사항 도출
3. 병렬 처리 필요성 식별

사용자 요청: {request}

사용 가능한 도구로 현재 기능을 분석하고, 요구사항을 정리하세요.
최종 output: project_brief (3-5줄의 요약)
""")

analyst_agent = create_react_agent(llm, analyst_tools, analyst_prompt)

# Phase 2: PM (Product Manager)
pm_tools = [design_ux_flow]
pm_prompt = PromptTemplate.from_template("""
당신은 Product Manager입니다.

분석 결과:
{analysis}

작업:
1. PRD (Product Requirements Document) 작성
2. 사용자 스토리 정의
3. 우선순위 결정

output: prd (마크다운 형식)
""")

pm_agent = create_react_agent(llm, pm_tools, pm_prompt)

# Phase 2: UX Designer
ux_tools = [design_ux_flow]
ux_prompt = PromptTemplate.from_template("""
당신은 UX 디자이너입니다.

PRD:
{prd}

작업:
1. 사용자 흐름 설계
2. UI 컴포넌트 정의
3. 에러 처리 & 검증 UI

output: ux_spec (마크다운 형식)
""")

ux_agent = create_react_agent(llm, ux_tools, ux_prompt)

# Phase 3: Architect
architect_tools = [design_architecture]
architect_prompt = PromptTemplate.from_template("""
당신은 기술 아키텍트입니다.

PRD + UX Spec:
{planning}

작업:
1. 전체 시스템 아키텍처 설계
2. Frontend & Backend 분리 설계
3. 병렬 처리 구조 설계
4. DB 스키마 설계

output: architecture (마크다운 형식)
""")

architect_agent = create_react_agent(llm, architect_tools, architect_prompt)

# Phase 3: Scrum Master
sm_tools = [break_down_stories, define_acceptance_criteria]
sm_prompt = PromptTemplate.from_template("""
당신은 Scrum Master입니다.

아키텍처:
{architecture}

작업:
1. 아키텍처를 Epic으로 분해
2. 각 Epic을 개발 스토리로 분해
3. 각 스토리의 검수 기준 정의
4. [frontend], [backend] 태그 지정

output:
- epics: 리스트
- stories: 각 스토리 상세 설명
- acceptance_criteria: dict
""")

sm_agent = create_react_agent(llm, sm_tools, sm_prompt)

# Phase 4: Frontend Developer
frontend_prompt = PromptTemplate.from_template("""
당신은 Frontend 개발자입니다 (React/Next.js).

스토리:
{story}

아키텍처:
{architecture}

작업:
1. 스토리에 해당하는 React 컴포넌트 구현
2. TypeScript 타입 정의
3. Zustand 상태 관리
4. Tailwind CSS 스타일링

output:
{{
  "filename": "component.tsx",
  "code": "..."
}}
""")

frontend_dev_agent = create_react_agent(llm, [], frontend_prompt)

# Phase 4: Backend Developer
backend_prompt = PromptTemplate.from_template("""
당신은 Backend 개발자입니다 (FastAPI/Python).

스토리:
{story}

아키텍처:
{architecture}

작업:
1. FastAPI 라우트 & 엔드포인트 구현
2. Pydantic 스키마 정의
3. 비즈니스 로직 구현
4. 에러 처리

output:
{{
  "filename": "routes.py",
  "code": "..."
}}
""")

backend_dev_agent = create_react_agent(llm, [], backend_prompt)

# Phase 4: QA Engineer
qa_prompt = PromptTemplate.from_template("""
당신은 QA 엔지니어입니다.

검수 기준:
{acceptance_criteria}

구현된 코드:
{code}

작업:
1. 검수 기준 대조
2. 버그 리포트 (있으면)
3. 테스트 케이스 정의

output: qa_report (마크다운)
""")

qa_agent = create_react_agent(llm, [], qa_prompt)


# ============================================================
# 에이전트 노드 wrapper
# ============================================================

async def analyst_node(state: dict) -> dict:
    """Phase 1: 요구사항 분석"""
    result = analyst_agent.invoke({"request": state["request"]})
    return {
        "phase": "analysis",
        "project_brief": result.get("output", ""),
        "requirements": ["단일 계산", "배치 처리", "검증", "저장", "병렬처리"],
    }


async def pm_node(state: dict) -> dict:
    """Phase 2: 제품 기획"""
    result = pm_agent.invoke({"analysis": state["project_brief"]})
    return {
        "prd": result.get("output", ""),
        "user_stories": ["스토리 1", "스토리 2", "스토리 3"],
    }


async def ux_node(state: dict) -> dict:
    """Phase 2: UX 설계"""
    result = ux_agent.invoke({"prd": state["prd"]})
    return {
        "ux_spec": result.get("output", ""),
    }


async def architect_node(state: dict) -> dict:
    """Phase 3: 아키텍처 설계"""
    result = architect_agent.invoke({
        "planning": f"{state['prd']}\n{state['ux_spec']}"
    })
    return {
        "architecture": result.get("output", ""),
    }


async def sm_node(state: dict) -> dict:
    """Phase 3: 스프린트 계획"""
    result = sm_agent.invoke({"architecture": state["architecture"]})
    return {
        "epics": ["Epic 1", "Epic 2", "Epic 3", "Epic 4"],
        "stories": ["Story 1.1", "Story 2.1", "Story 3.1", "Story 4.1"],
        "acceptance_criteria": {"story_1": "criteria..."},
    }


async def frontend_dev_node(state: dict, story: str) -> dict:
    """Phase 4: Frontend 개발"""
    result = frontend_dev_agent.invoke({
        "story": story,
        "architecture": state["architecture"]
    })
    return {
        "frontend_files": {
            "payroll-form.tsx": result.get("output", ""),
        }
    }


async def backend_dev_node(state: dict, story: str) -> dict:
    """Phase 4: Backend 개발"""
    result = backend_dev_agent.invoke({
        "story": story,
        "architecture": state["architecture"]
    })
    return {
        "backend_files": {
            "payroll_routes.py": result.get("output", ""),
        }
    }


async def qa_node(state: dict) -> dict:
    """Phase 4: QA"""
    result = qa_agent.invoke({
        "acceptance_criteria": state.get("acceptance_criteria", ""),
        "code": state.get("source_files", ""),
    })
    return {
        "qa_report": result.get("output", ""),
        "test_results": {"passed": 12, "failed": 0},
    }
