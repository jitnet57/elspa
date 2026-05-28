# ============================================================
# 📌 파일명: payroll_bmad_graph.py
# 📋 목적: BMAD × LangGraph 상태 머신 구성 (4 Phase Orchestration)
# 🔧 기능: Phase 1-4 서브그래프 + interrupt (사용자 승인)
# 📅 작성일: 2026-05-28
# ============================================================

from typing import Literal, Annotated
from operator import add
from langgraph.graph import StateGraph, START, END
from langgraph.types import Command, interrupt
from langgraph.checkpoint.memory import InMemorySaver

from payroll_bmad_state import FullStackState
from payroll_bmad_agents import (
    analyst_node, pm_node, ux_node,
    architect_node, sm_node,
    frontend_dev_node, backend_dev_node, qa_node
)


# ============================================================
# PHASE 1: ANALYSIS (Analyst)
# ============================================================

def build_phase1_graph():
    """Phase 1 서브그래프: 요구사항 분석"""
    graph = StateGraph(FullStackState)

    # 노드
    async def analyze_node(state: FullStackState) -> FullStackState:
        """분석 단계"""
        result = await analyst_node(state)
        return {
            "phase": "analysis",
            "project_brief": result["project_brief"],
            "requirements": result["requirements"],
            "current_features": ["Dashboard", "Payroll Periods", "Payroll Calc"],
            "parallel_needs": ["병렬 검증", "배치 계산", "DB 저장"],
        }

    graph.add_node("analyze", analyze_node)
    graph.add_edge(START, "analyze")
    graph.add_edge("analyze", END)

    return graph.compile()


# ============================================================
# PHASE 2: PLANNING (PM + UX, Parallel)
# ============================================================

def build_phase2_graph():
    """Phase 2 서브그래프: PM + UX 병렬 처리"""
    graph = StateGraph(FullStackState)

    async def pm_planning_node(state: FullStackState) -> FullStackState:
        """PM: PRD 작성"""
        result = await pm_node(state)
        return {
            "prd": result["prd"],
            "user_stories": result["user_stories"],
        }

    async def ux_design_node(state: FullStackState) -> FullStackState:
        """UX: 스펙 작성"""
        result = await ux_node(state)
        return {
            "ux_spec": result["ux_spec"],
        }

    # 병렬 실행: PM과 UX 동시 진행
    graph.add_node("pm", pm_planning_node)
    graph.add_node("ux", ux_design_node)

    graph.add_edge(START, "pm")
    graph.add_edge(START, "ux")
    graph.add_edge("pm", END)
    graph.add_edge("ux", END)

    return graph.compile()


# ============================================================
# PHASE 3: SOLUTIONING (Architect + SM, Parallel then Sequential)
# ============================================================

def build_phase3_graph():
    """Phase 3 서브그래프: Architect 설계 → SM 분해"""
    graph = StateGraph(FullStackState)

    async def architect_design_node(state: FullStackState) -> FullStackState:
        """아키텍처 설계"""
        result = await architect_node(state)
        return {
            "architecture": result["architecture"],
        }

    async def sm_breakdown_node(state: FullStackState) -> FullStackState:
        """SM: 스토리 분해"""
        result = await sm_node(state)
        return {
            "epics": result["epics"],
            "stories": result["stories"],
            "acceptance_criteria": result["acceptance_criteria"],
        }

    # Sequential: Architect 먼저, 그 결과를 SM이 사용
    graph.add_node("architect", architect_design_node)
    graph.add_node("sm", sm_breakdown_node)

    graph.add_edge(START, "architect")
    graph.add_edge("architect", "sm")
    graph.add_edge("sm", END)

    return graph.compile()


# ============================================================
# PHASE 4: IMPLEMENTATION (Dev Loop + QA)
# ============================================================

def build_phase4_graph():
    """Phase 4 서브그래프: 각 스토리마다 Dev → QA 루프"""
    graph = StateGraph(FullStackState)

    async def dev_frontend_node(state: FullStackState) -> FullStackState:
        """Frontend 개발"""
        if state.get("stories"):
            story = state["stories"][0]  # 현재 스토리
            result = await frontend_dev_node(state, story)
            return {
                "frontend_files": result.get("frontend_files", {}),
            }
        return {}

    async def dev_backend_node(state: FullStackState) -> FullStackState:
        """Backend 개발"""
        if state.get("stories"):
            story = state["stories"][0]  # 현재 스토리
            result = await backend_dev_node(state, story)
            return {
                "backend_files": result.get("backend_files", {}),
            }
        return {}

    async def qa_testing_node(state: FullStackState) -> FullStackState:
        """QA & 테스트"""
        result = await qa_node(state)
        completed = state.get("completed_stories", [])
        completed.append(state.get("stories", [""])[0])
        return {
            "qa_report": result["qa_report"],
            "test_results": result["test_results"],
            "completed_stories": completed,
        }

    # 병렬 개발: Frontend + Backend 동시
    graph.add_node("dev_frontend", dev_frontend_node)
    graph.add_node("dev_backend", dev_backend_node)
    graph.add_node("qa", qa_testing_node)

    graph.add_edge(START, "dev_frontend")
    graph.add_edge(START, "dev_backend")
    graph.add_edge("dev_frontend", "qa")
    graph.add_edge("dev_backend", "qa")
    graph.add_edge("qa", END)

    return graph.compile()


# ============================================================
# TOP-LEVEL GRAPH: Phase 1-4 조율
# ============================================================

def build_full_graph():
    """전체 BMAD × LangGraph 오케스트레이션"""
    main_graph = StateGraph(FullStackState)

    # Phase 서브그래프
    phase1 = build_phase1_graph()
    phase2 = build_phase2_graph()
    phase3 = build_phase3_graph()
    phase4 = build_phase4_graph()

    async def phase1_node(state: FullStackState) -> FullStackState:
        """Phase 1: Analysis"""
        result = phase1.invoke(state)
        return result

    async def phase2_node(state: FullStackState) -> FullStackState:
        """Phase 2: Planning"""
        result = phase2.invoke(state)
        return result

    async def phase3_node(state: FullStackState) -> FullStackState:
        """Phase 3: Solutioning"""
        result = phase3.invoke(state)
        return result

    async def phase4_node(state: FullStackState) -> FullStackState:
        """Phase 4: Implementation"""
        result = phase4.invoke(state)
        return result

    # 노드 추가
    main_graph.add_node("phase1", phase1_node)
    main_graph.add_node("phase2", phase2_node)
    main_graph.add_node("phase3", phase3_node)
    main_graph.add_node("phase4", phase4_node)

    # Interrupt: 각 phase 후 사용자 승인
    async def interrupt_after_phase1(state: FullStackState) -> Command:
        """Phase 1 완료 후 승인 대기"""
        return interrupt(
            f"""
Phase 1: Analysis 완료
- Project Brief: {state.get('project_brief', '')[:200]}
- Requirements: {len(state.get('requirements', []))} items

계속 진행할까요? (yes/no)
            """
        )

    async def interrupt_after_phase2(state: FullStackState) -> Command:
        """Phase 2 완료 후 승인 대기"""
        return interrupt(
            f"""
Phase 2: Planning 완료
- PRD: {state.get('prd', '')[:200]}
- UX Spec: {state.get('ux_spec', '')[:200]}

계속 진행할까요? (yes/no)
            """
        )

    async def interrupt_after_phase3(state: FullStackState) -> Command:
        """Phase 3 완료 후 승인 대기"""
        return interrupt(
            f"""
Phase 3: Solutioning 완료
- Architecture: {state.get('architecture', '')[:200]}
- Stories: {len(state.get('stories', []))} items

계속 진행할까요? (yes/no)
            """
        )

    # 연결
    main_graph.add_edge(START, "phase1")

    # Phase 1 → Interrupt → Phase 2
    main_graph.add_edge("phase1", "phase2")

    # Phase 2 → Interrupt → Phase 3
    main_graph.add_edge("phase2", "phase3")

    # Phase 3 → Interrupt → Phase 4
    main_graph.add_edge("phase3", "phase4")

    # Phase 4 → END
    main_graph.add_edge("phase4", END)

    # Checkpointer: 실행 상태 저장
    return main_graph.compile(
        checkpointer=InMemorySaver(),
        interrupt_before=["phase2", "phase3", "phase4"],
    )


# ============================================================
# 실행 함수
# ============================================================

def run_bmad_orchestration(request: str, thread_id: str = "default"):
    """
    BMAD 오케스트레이션 실행

    Args:
        request: 사용자 요청 (급여 정산 시스템)
        thread_id: 실행 스레드 ID (체크포인팅)
    """
    graph = build_full_graph()

    initial_state = {
        "request": request,
        "thread_id": thread_id,
        "phase": "analysis",
        "approved": False,
        "project_brief": "",
        "requirements": [],
        "current_features": [],
        "parallel_needs": [],
        "prd": "",
        "ux_spec": "",
        "user_stories": [],
        "architecture": "",
        "epics": [],
        "stories": [],
        "acceptance_criteria": {},
        "frontend_files": {},
        "backend_files": {},
        "test_results": {},
        "qa_report": "",
        "completed_stories": [],
    }

    # 실행 (interrupt 포함)
    config = {"configurable": {"thread_id": thread_id}}
    result = graph.invoke(initial_state, config)

    return result


if __name__ == "__main__":
    # 테스트 실행
    request = """
    Admin Dashboard에 Payroll Calculation 탭을 추가해줘.
    - 단일 직원 급여 계산
    - 배치 CSV 업로드
    - 검증 & 에러 처리
    - 병렬 처리
    """

    result = run_bmad_orchestration(request, thread_id="payroll-001")
    print("BMAD 오케스트레이션 완료")
    print(f"Project Brief: {result.get('project_brief', '')}")
    print(f"Stories: {len(result.get('stories', []))} items")
