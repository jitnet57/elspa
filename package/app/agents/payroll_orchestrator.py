"""
ElSpa 급여 정산 시스템 — BMAD-LangGraph 멀티에이전트 오케스트레이션
"""

import os
from typing import TypedDict, Any
from langgraph.graph import StateGraph, END
from anthropic import Anthropic

# API 키 설정
api_key = os.environ.get("ANTHROPIC_API_KEY")
if not api_key:
    raise ValueError("ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다. 'export ANTHROPIC_API_KEY=sk-...'를 실행하세요.")

client = Anthropic(api_key=api_key)

class PayrollState(TypedDict):
    current_phase: str
    business_rules: dict
    prd: str
    screen_design: dict
    tech_spec: dict
    sprint_plan: list
    backend_code: dict
    frontend_code: dict
    qa_report: dict
    human_approved: bool
    phase_output: str


def analyst_node(state: PayrollState) -> PayrollState:
    """Phase 1: 요구사항 분석 → 비즈니스 로직 명세서"""
    print("\n[ANALYST] 업무 시작: 비즈니스 요구사항 분석")

    prompt = """당신은 ElSpa 급여 정산 시스템의 비즈니스 분석가입니다.
다음 급여 정산 규칙을 정리하세요:

1. 직원 분류:
   - White (Manager): 2주급, 기본급 고정
   - Blue (Maintenance, Driver, Hollys): 2주급, 기본급 고정
   - Commission (Therapist, Nail): 1주급(일요일), 기본급 + 커미션

2. 차감 항목:
   - SSS 회사 선지급
   - CA (Cash Advance) 개인별
   - 13개월 보너스 선지급
   - 보건소 검사비 (Therapist 분기별)
   - 지각 (10분 초과 시 1분당 10 Peso)
   - 결근 (Manager만, 급여/15 계산)

3. 추가 지급:
   - OT (40분 이상, 1시간당 70 Peso, 정직원만)
   - 드라이버 식대 (2주당 200 Peso)
   - 공휴일 가산 (국가: 200%, 특정: 130%)

JSON 형태로 비즈니스 규칙을 정리하세요. 엣지케이스도 명시하세요."""

    response = client.messages.create(
        model="claude-opus-4-7",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}]
    )

    state["business_rules"] = {
        "rules": response.content[0].text,
        "status": "completed"
    }
    state["current_phase"] = "analyst"
    state["phase_output"] = response.content[0].text
    print("✅ 비즈니스 로직 명세서 작성 완료")
    return state


def pm_node(state: PayrollState) -> PayrollState:
    """Phase 2: PM → PRD 및 기능 명세서"""
    print("\n[PM] 업무 시작: PRD 및 기능 명세서 작성")

    prompt = f"""당신은 ElSpa의 제품 관리자입니다.

다음 비즈니스 규칙을 바탕으로 PRD를 작성하세요:

{state['business_rules']['rules']}

PRD는 다음을 포함해야 합니다:
1. 관리자 화면 6개 (payroll, employees, cash-advance, attendance, holidays, records)
2. API 엔드포인트 설계 (CRUD 포함)
3. MVP vs Phase 2 우선순위
4. 핵심 사용 시나리오 3개

Markdown 형식으로 작성하세요."""

    response = client.messages.create(
        model="claude-opus-4-7",
        max_tokens=2500,
        messages=[{"role": "user", "content": prompt}]
    )

    state["prd"] = response.content[0].text
    state["current_phase"] = "pm"
    state["phase_output"] = response.content[0].text
    print("✅ PRD 및 기능 명세서 작성 완료")
    return state


def ux_node(state: PayrollState) -> PayrollState:
    """Phase 3: UX → 화면 설계 (Wireframe)"""
    print("\n[UX] 업무 시작: 화면 설계")

    prompt = f"""당신은 ElSpa의 UX 디자이너입니다.

다음 PRD를 바탕으로 화면 설계를 작성하세요:

{state['prd']}

각 화면에 대한 컴포넌트 구조와 레이아웃을 텍스트 다이어그램으로 작성하세요:
1. /admin/payroll/ — 메인 대시보드 (주간/격주 탭)
2. /admin/payroll/employees/ — 직원 마스터
3. /admin/payroll/cash-advance/ — CA 관리
4. /admin/payroll/attendance/ — 출퇴근 입력
5. /admin/payroll/holidays/ — 공휴일 관리
6. /admin/payroll/records/ — 정산 결과

각 화면마다 주요 입력 필드, 버튼, 테이블 열을 명시하세요."""

    response = client.messages.create(
        model="claude-opus-4-7",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}]
    )

    state["screen_design"] = {
        "designs": response.content[0].text,
        "status": "completed"
    }
    state["current_phase"] = "ux"
    state["phase_output"] = response.content[0].text
    print("✅ 화면 설계 완료")
    return state


def architect_node(state: PayrollState) -> PayrollState:
    """Phase 4: 아키텍트 → 기술 설계 & DB 스키마"""
    print("\n[ARCHITECT] 업무 시작: 기술 설계")

    prompt = f"""당신은 ElSpa의 기술 아키텍트입니다.

다음 비즈니스 규칙과 화면 설계를 바탕으로 기술 설계를 작성하세요:

비즈니스 규칙:
{state['business_rules']['rules']}

화면 설계:
{state['screen_design']['designs']}

다음을 포함하는 상세 기술 설계를 작성하세요:
1. SQLAlchemy 모델 6개의 필드 정의 (Employee, CashAdvance, AttendanceLog, PayrollPeriod, PayrollRecord, PhilippineHoliday)
2. API 라우터 구조 (/api/payroll/*)
3. 급여 계산 엔진 (calculate_payroll 함수 로직)
4. 기존 모델(Staff, Therapist, Attendance)과의 연동 방식
5. 데이터베이스 마이그레이션 전략

Python/FastAPI 기준으로 작성하세요."""

    response = client.messages.create(
        model="claude-opus-4-7",
        max_tokens=3000,
        messages=[{"role": "user", "content": prompt}]
    )

    state["tech_spec"] = {
        "spec": response.content[0].text,
        "status": "completed"
    }
    state["current_phase"] = "architect"
    state["phase_output"] = response.content[0].text
    print("✅ 기술 설계 완료")
    return state


def sm_node(state: PayrollState) -> PayrollState:
    """Phase 5: 스크럼 마스터 → 스프린트 계획"""
    print("\n[SCRUM MASTER] 업무 시작: 스프린트 계획 수립")

    prompt = f"""당신은 ElSpa의 스크럼 마스터입니다.

다음 기술 설계를 바탕으로 스프린트 계획을 작성하세요:

{state['tech_spec']['spec']}

다음을 포함하는 상세 스프린트 계획을 JSON 형식으로 작성하세요:
1. MVP (1주차) 태스크 리스트 (백엔드/프론트엔드 분리)
2. Phase 2 (2주차) 태스크 리스트
3. 각 태스크의 의존성 및 예상 소요시간
4. 병렬 실행 가능한 태스크 식별
5. 위험 요소 및 완화 방안

JSON 스키마:
{{
  "mvp": [{{"task": "", "owner": "backend|frontend", "duration": "hours", "dependencies": []}}],
  "phase2": [{{"task": "", "owner": "", "duration": "", "dependencies": []}}],
  "risks": [{{"risk": "", "impact": "", "mitigation": ""}}]
}}"""

    response = client.messages.create(
        model="claude-opus-4-7",
        max_tokens=2500,
        messages=[{"role": "user", "content": prompt}]
    )

    state["sprint_plan"] = {
        "plan": response.content[0].text,
        "status": "completed"
    }
    state["current_phase"] = "sm"
    state["phase_output"] = response.content[0].text
    print("✅ 스프린트 계획 수립 완료")
    return state


def dev_backend_node(state: PayrollState) -> PayrollState:
    """Phase 6-1: 백엔드 개발 → FastAPI 코드"""
    print("\n[DEV BACKEND] 업무 시작: FastAPI 모델 & 라우터 작성")

    prompt = f"""당신은 ElSpa의 백엔드 개발자입니다. FastAPI 전문가입니다.

다음 기술 설계를 바탕으로 Python FastAPI 코드를 작성하세요:

{state['tech_spec']['spec']}

다음 6개 모델의 SQLAlchemy 정의를 Python 코드로 작성하세요:
1. Employee (통합 직원 마스터)
2. CashAdvance (CA 선지급)
3. AttendanceLog (출퇴근 로그)
4. PayrollPeriod (정산 기간)
5. PayrollRecord (개인별 정산 결과)
6. PhilippineHoliday (공휴일)

각 모델은:
- from_date/to_date 형식 타입은 datetime.date
- amount 필드는 Numeric(10,2)
- 필요한 FK/관계 정의
- created_at/updated_at 타임스탬프 포함
- 한국어 주석 포함

또한 다음 함수의 스켈레톤을 작성하세요:
- calculate_payroll(payroll_period_id) → 급여 계산 엔진
  * 직원 유형별 계산 로직
  * 모든 차감/추가 항목 포함
  * 반환: PayrollRecord 리스트

전체 코드를 Python 코드 블록으로 작성하세요."""

    response = client.messages.create(
        model="claude-opus-4-7",
        max_tokens=4000,
        messages=[{"role": "user", "content": prompt}]
    )

    state["backend_code"] = {
        "models": response.content[0].text,
        "status": "completed"
    }
    state["current_phase"] = "dev_backend"
    state["phase_output"] = response.content[0].text
    print("✅ 백엔드 코드 작성 완료")
    return state


def dev_frontend_node(state: PayrollState) -> PayrollState:
    """Phase 6-2: 프론트엔드 개발 → React 컴포넌트"""
    print("\n[DEV FRONTEND] 업무 시작: Next.js/React 컴포넌트 작성")

    prompt = f"""당신은 ElSpa의 프론트엔드 개발자입니다. Next.js/React/TypeScript 전문가입니다.

다음 화면 설계를 바탕으로 React 컴포넌트를 작성하세요:

{state['screen_design']['designs']}

다음 6개 페이지의 컴포넌트 구조를 TypeScript로 작성하세요:
1. /admin/payroll/page.tsx — 메인 대시보드
2. /admin/payroll/employees/page.tsx — 직원 마스터
3. /admin/payroll/cash-advance/page.tsx — CA 관리
4. /admin/payroll/attendance/page.tsx — 출퇴근 입력
5. /admin/payroll/holidays/page.tsx — 공휴일 관리
6. /admin/payroll/records/page.tsx — 정산 결과

각 페이지는:
- "use client" 선언 (Client Component)
- Zustand 스토어 기반 상태 관리
- React 훅 사용 (useState, useEffect)
- API 호출 (fetch /api/payroll/*)
- Tailwind CSS 스타일링
- 타입 안전성 (TypeScript interface)

또한 다음 커스텀 훅을 작성하세요:
- usePayrollData() — 정산 데이터 조회
- usePayrollCalculate() — 급여 계산 실행
- useAttendanceInput() — 출퇴근 입력 핸들링

각 컴포넌트의 기본 구조(return JSX 포함)만 작성하세요. 전체 코드를 TypeScript 코드 블록으로 제시하세요."""

    response = client.messages.create(
        model="claude-opus-4-7",
        max_tokens=4000,
        messages=[{"role": "user", "content": prompt}]
    )

    state["frontend_code"] = {
        "components": response.content[0].text,
        "status": "completed"
    }
    state["current_phase"] = "dev_frontend"
    state["phase_output"] = response.content[0].text
    print("✅ 프론트엔드 코드 작성 완료")
    return state


def qa_node(state: PayrollState) -> PayrollState:
    """Phase 7: QA → 검증 리포트"""
    print("\n[QA] 업무 시작: 검증 리포트 작성")

    prompt = f"""당신은 ElSpa의 QA 엔지니어입니다.

다음 백엔드/프론트엔드 코드를 검증하세요:

백엔드 코드:
{state['backend_code']['models']}

프론트엔드 코드:
{state['frontend_code']['components']}

다음을 포함하는 QA 검증 리포트를 작성하세요:
1. 계산 정확도 테스트 케이스 5개
   - Therapist 주급 정산 (기본급+커미션, CA 차감)
   - Manager 격주급 (기본급, OT 추가, 지각 차감)
   - Driver 격주급 (기본급, 식대 추가)
   - 공휴일 중복 처리 (국가공휴일 + OT)
   - 결근 처리 (Manager 13일 미만)

2. 엣지케이스 검증
   - OT 39분 vs 40분 경계
   - 지각 9분 vs 11분 경계
   - CA 정산 후 음수 금액 처리

3. API 응답 구조 검증
4. TypeScript 타입 안전성 검증
5. 데이터베이스 무결성 검증

JSON 형식으로 작성하세요:
{{
  "test_cases": [{{"name": "", "input": {{}}, "expected_output": {{}}, "status": "pass|fail"}}],
  "edge_cases": [{{"case": "", "validation": ""}}],
  "issues": []
}}"""

    response = client.messages.create(
        model="claude-opus-4-7",
        max_tokens=2500,
        messages=[{"role": "user", "content": prompt}]
    )

    state["qa_report"] = {
        "report": response.content[0].text,
        "status": "completed"
    }
    state["current_phase"] = "qa"
    state["phase_output"] = response.content[0].text
    state["human_approved"] = True  # 자동 승인
    print("✅ QA 검증 완료")
    return state


def create_payroll_graph():
    """LangGraph StateGraph 생성"""
    workflow = StateGraph(PayrollState)

    # 노드 추가
    workflow.add_node("analyst", analyst_node)
    workflow.add_node("pm", pm_node)
    workflow.add_node("ux", ux_node)
    workflow.add_node("architect", architect_node)
    workflow.add_node("sm", sm_node)
    workflow.add_node("dev_backend", dev_backend_node)
    workflow.add_node("dev_frontend", dev_frontend_node)
    workflow.add_node("qa", qa_node)

    # 엣지 추가 (순차 실행)
    workflow.add_edge("analyst", "pm")
    workflow.add_edge("pm", "ux")
    workflow.add_edge("ux", "architect")
    workflow.add_edge("architect", "sm")
    workflow.add_edge("sm", "dev_backend")
    workflow.add_edge("dev_backend", "dev_frontend")
    workflow.add_edge("dev_frontend", "qa")
    workflow.add_edge("qa", END)

    # 시작 노드 설정
    workflow.set_entry_point("analyst")

    return workflow.compile()


def run_payroll_orchestration():
    """전체 BMAD-LangGraph 오케스트레이션 실행"""
    print("=" * 80)
    print("ElSpa 급여 정산 시스템 — BMAD-LangGraph 멀티에이전트 오케스트레이션 시작")
    print("=" * 80)

    graph = create_payroll_graph()

    initial_state: PayrollState = {
        "current_phase": "start",
        "business_rules": {},
        "prd": "",
        "screen_design": {},
        "tech_spec": {},
        "sprint_plan": [],
        "backend_code": {},
        "frontend_code": {},
        "qa_report": {},
        "human_approved": False,
        "phase_output": ""
    }

    # 그래프 실행
    final_state = graph.invoke(initial_state)

    print("\n" + "=" * 80)
    print("✅ 모든 BMAD 단계 완료!")
    print("=" * 80)

    return final_state


if __name__ == "__main__":
    result = run_payroll_orchestration()
    print("\n최종 결과:")
    print(f"- 비즈니스 규칙: {len(str(result['business_rules']))} chars")
    print(f"- PRD: {len(result['prd'])} chars")
    print(f"- 화면 설계: {len(str(result['screen_design']))} chars")
    print(f"- 기술 설계: {len(str(result['tech_spec']))} chars")
    print(f"- 스프린트 계획: {len(str(result['sprint_plan']))} chars")
    print(f"- 백엔드 코드: {len(str(result['backend_code']))} chars")
    print(f"- 프론트엔드 코드: {len(str(result['frontend_code']))} chars")
    print(f"- QA 리포트: {len(str(result['qa_report']))} chars")
