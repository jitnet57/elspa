#!/usr/bin/env python3
"""
ElSpa 급여 정산 시스템 — BMAD-LangGraph 실행 스크립트
"""

import os
import json
from datetime import datetime
from pathlib import Path
from app.agents.payroll_orchestrator import create_payroll_graph

def save_bmad_outputs(final_state):
    """BMAD 단계별 결과를 파일로 저장"""
    output_dir = Path("e:/elspa/bmad_outputs")
    output_dir.mkdir(exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    # 1. Analyst 출력
    analyst_file = output_dir / f"01_analyst_business_rules_{timestamp}.md"
    with open(analyst_file, "w", encoding="utf-8") as f:
        f.write("# BMAD Phase 1: Analyst — 비즈니스 로직 명세서\n\n")
        if isinstance(final_state.get("business_rules"), dict):
            f.write(final_state["business_rules"].get("rules", ""))
        else:
            f.write(str(final_state.get("business_rules", "")))
    print(f"✅ 저장: {analyst_file}")

    # 2. PM 출력
    pm_file = output_dir / f"02_pm_prd_{timestamp}.md"
    with open(pm_file, "w", encoding="utf-8") as f:
        f.write("# BMAD Phase 2: PM — PRD 및 기능 명세서\n\n")
        f.write(final_state.get("prd", ""))
    print(f"✅ 저장: {pm_file}")

    # 3. UX 출력
    ux_file = output_dir / f"03_ux_screen_design_{timestamp}.md"
    with open(ux_file, "w", encoding="utf-8") as f:
        f.write("# BMAD Phase 3: UX — 화면 설계\n\n")
        if isinstance(final_state.get("screen_design"), dict):
            f.write(final_state["screen_design"].get("designs", ""))
        else:
            f.write(str(final_state.get("screen_design", "")))
    print(f"✅ 저장: {ux_file}")

    # 4. Architect 출력
    arch_file = output_dir / f"04_architect_tech_spec_{timestamp}.md"
    with open(arch_file, "w", encoding="utf-8") as f:
        f.write("# BMAD Phase 4: Architect — 기술 설계\n\n")
        if isinstance(final_state.get("tech_spec"), dict):
            f.write(final_state["tech_spec"].get("spec", ""))
        else:
            f.write(str(final_state.get("tech_spec", "")))
    print(f"✅ 저장: {arch_file}")

    # 5. SM 출력
    sm_file = output_dir / f"05_sm_sprint_plan_{timestamp}.json"
    with open(sm_file, "w", encoding="utf-8") as f:
        if isinstance(final_state.get("sprint_plan"), dict):
            json.dump(final_state["sprint_plan"], f, ensure_ascii=False, indent=2)
        else:
            f.write(str(final_state.get("sprint_plan", "")))
    print(f"✅ 저장: {sm_file}")

    # 6. Dev Backend 출력
    backend_file = output_dir / f"06_dev_backend_models_{timestamp}.py"
    with open(backend_file, "w", encoding="utf-8") as f:
        f.write("# BMAD Phase 6: Dev Backend — FastAPI SQLAlchemy 모델\n\n")
        if isinstance(final_state.get("backend_code"), dict):
            f.write(final_state["backend_code"].get("models", ""))
        else:
            f.write(str(final_state.get("backend_code", "")))
    print(f"✅ 저장: {backend_file}")

    # 7. Dev Frontend 출력
    frontend_file = output_dir / f"07_dev_frontend_components_{timestamp}.tsx"
    with open(frontend_file, "w", encoding="utf-8") as f:
        f.write("// BMAD Phase 6: Dev Frontend — React/Next.js 컴포넌트\n\n")
        if isinstance(final_state.get("frontend_code"), dict):
            f.write(final_state["frontend_code"].get("components", ""))
        else:
            f.write(str(final_state.get("frontend_code", "")))
    print(f"✅ 저장: {frontend_file}")

    # 8. QA 출력
    qa_file = output_dir / f"08_qa_validation_report_{timestamp}.json"
    with open(qa_file, "w", encoding="utf-8") as f:
        f.write("# BMAD Phase 7: QA — 검증 리포트\n\n")
        if isinstance(final_state.get("qa_report"), dict):
            f.write(final_state["qa_report"].get("report", ""))
        else:
            f.write(str(final_state.get("qa_report", "")))
    print(f"✅ 저장: {qa_file}")

    # 통합 요약 리포트
    summary_file = output_dir / f"BMAD_SUMMARY_{timestamp}.md"
    with open(summary_file, "w", encoding="utf-8") as f:
        f.write("# ElSpa 급여 정산 시스템 — BMAD 통합 결과 보고서\n\n")
        f.write(f"**실행 일시**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write("## 완료된 BMAD 단계\n\n")
        f.write("- ✅ Phase 1: Analyst — 비즈니스 로직 명세\n")
        f.write("- ✅ Phase 2: PM — PRD 및 기능 명세\n")
        f.write("- ✅ Phase 3: UX — 화면 설계\n")
        f.write("- ✅ Phase 4: Architect — 기술 설계\n")
        f.write("- ✅ Phase 5: SM — 스프린트 계획\n")
        f.write("- ✅ Phase 6: Dev (Backend + Frontend) — 코드 생성\n")
        f.write("- ✅ Phase 7: QA — 검증 리포트\n\n")
        f.write("## 생성된 파일\n\n")
        f.write(f"- {analyst_file.name}\n")
        f.write(f"- {pm_file.name}\n")
        f.write(f"- {ux_file.name}\n")
        f.write(f"- {arch_file.name}\n")
        f.write(f"- {sm_file.name}\n")
        f.write(f"- {backend_file.name}\n")
        f.write(f"- {frontend_file.name}\n")
        f.write(f"- {qa_file.name}\n\n")
        f.write("## 다음 단계\n\n")
        f.write("1. BMAD 출력 파일 검토\n")
        f.write("2. 스프린트 계획에 따라 실제 코드 구현 시작\n")
        f.write("3. MVP (1주차) 태스크 우선 처리\n")

    print(f"✅ 저장: {summary_file}")
    return output_dir


def main():
    print("\n" + "=" * 100)
    print("🚀 ElSpa 급여 정산 시스템 — BMAD-LangGraph 멀티에이전트 오케스트레이션")
    print("=" * 100)

    # LangGraph 생성
    graph = create_payroll_graph()

    initial_state = {
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
    print("\n▶️ LangGraph 실행 중...\n")
    final_state = graph.invoke(initial_state)

    # 결과 저장
    print("\n📁 결과 파일 저장 중...\n")
    output_dir = save_bmad_outputs(final_state)

    print("\n" + "=" * 100)
    print("✅ BMAD-LangGraph 오케스트레이션 완료!")
    print("=" * 100)
    print(f"\n📂 모든 결과물이 저장됨: {output_dir}\n")

    print("📊 생성된 산출물:")
    print("  ✓ 비즈니스 로직 명세서 (Analyst)")
    print("  ✓ PRD 및 기능 명세서 (PM)")
    print("  ✓ 화면 설계/Wireframe (UX)")
    print("  ✓ 기술 설계 & DB 스키마 (Architect)")
    print("  ✓ 스프린트 계획 (Scrum Master)")
    print("  ✓ FastAPI 모델 & 엔진 코드 (Dev Backend)")
    print("  ✓ React/Next.js 컴포넌트 (Dev Frontend)")
    print("  ✓ QA 검증 리포트 (QA)")
    print("\n🎯 다음 단계: 생성된 코드를 실제 프로젝트에 통합\n")


if __name__ == "__main__":
    main()
