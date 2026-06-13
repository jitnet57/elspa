---
title: ElSpa 지식 네트워크 (Obsidian 허브)
tags: [MOC, knowledge-network, index]
updated: 2026-06-13
---

# 🧠 ElSpa 지식 네트워크 — Obsidian 허브 (MOC)

> 📚 **전체 노트(모든 md) 보기 → [[📚-ALL-NOTES-INDEX]]** (폴더별 453개 전부 링크, 고립 노드 없음)
>
> 이 레포(`jitnet57/elspa`)의 **마크다운 문서**를 Obsidian **그래프 뷰**로 연결하는
> 중심 허브(Map of Content)입니다. 아래 `[[위키링크]]`가 Obsidian에서 그래프 엣지로 그려집니다.
> 새 노트는 관련 허브에 `[[ ]]`로 링크만 추가하면 자동으로 네트워크에 편입됩니다.
>
> 📌 코드 상의 지식 네트워크 화면: `/admin/knowledge-network` · 관련 문서 [[KNOWLEDGE-NETWORK-USAGE]]

---

## 🗺️ 도메인 허브 (8)

```
                       [[🧠-KNOWLEDGE-NETWORK-OBSIDIAN]]
        ┌──────────┬──────────┬──────────┬──────────┐
     시작/개요   아키텍처   운영(예약)  정산/급여/결제
        └──────────┼──────────┼──────────┼──────────┘
        지식네트워크   배포/인프라   비즈니스/전략   히스토리/기록
```

---

## 🏠 1. 시작 · 개요
- [[README]] — 프로젝트 진입점
- [[📑-MASTER-INDEX-SEARCHABLE]] — 전체 검색 인덱스
- [[START_GUIDE]] · [[QUICK-START-GUIDE]] · [[SETUP-INSTRUCTIONS]]
- [[STATUS]] — 현재 현황 · [[REMAINING_TASKS]] — 남은 작업
- [[CLAUDE]] — 개발 가이드/워크플로우 · [[개발가이드북]]
- [[01-PROJECT-BRIEF]] · [[02-PRD]] · [[05-USER-STORIES-AND-TASKS]]

## 🏗️ 2. 아키텍처 · 기술
- [[04-ARCHITECTURE]] · [[ARCHITECTURE-INDEX]] · [[ARCHITECTURE_DIAGRAMS]]
- [[GLOBAL-TECHNICAL-ARCHITECTURE]] · [[TECHNICAL-ARCHITECTURE-3TRACK]]
- [[DATABASE-SCHEMA]] · [[DATABASE_SCHEMA_GUIDE]] · [[DB_INTEGRITY_REPORT]]
- [[20260513-API-SPECIFICATION]] · [[FRONTEND_API_CLIENT]] · [[API-INTEGRATION-GUIDE]]
- [[AUTH_SYSTEM_GUIDE]] · [[REALTIME_WEBSOCKET_GUIDE]] · [[LOGGING_POLICY]]
- [[00-LANGGRAPH-INDEX]] · [[LANGGRAPH_ARCHITECTURE]] · [[LANGGRAPH-AGENT-IMPLEMENTATION]]

## 💆 3. 운영 — 예약 · 매칭 · 마사지
- [[admin-route-path-42]] — 관리자 화면 42개 경로
- [[MATCHING_POLICY]] · [[MATCHING_ALGORITHM_GUIDE]] · [[MATCHING_SELECTION_GUIDE]] · [[MATCHING_API_SPEC]]
- [[massage-services]] · [[massage-services-menu]] · [[마사지종류]] · [[마사지-목록]] · [[마사지-시간가격]]
- [[MOBILE_RESPONSIVE]] · [[therapist]] · [[FAIRNESS_ANALYSIS]]

## 💰 4. 정산 · 급여 · 결제
- [[payment-settlement-system]] · [[PAYMENT_SETTLEMENT_SUMMARY]] · [[API_PAYMENT_SETTLEMENT_SPEC]]
- [[PAYMENT_METHOD_INPUT_DESIGN]] · [[PAYMENT_METHOD_INPUT_SUMMARY]] · [[PAYMENT_SYSTEM_MIGRATION_CHECKLIST]]
- [[SETTLEMENT_AUTOMATION_SUMMARY]] · [[SETTLEMENT_QUICK_REFERENCE]] · [[CompanySettlement_Design]]
- [[PAYROLL_API_IMPLEMENTATION]] · [[PAYROLL_ANALYTICS_GUIDE]] · [[PAYROLL_PROJECT_COMPLETION]]
- [[PHILIPPINES-PAYROLL-SYSTEM]] · [[INDONESIA-PAYROLL-SYSTEM]] · [[THAILAND-PAYROLL-SYSTEM]] · [[VIETNAM-PAYROLL-SYSTEM]]

## 🕸️ 5. 지식 네트워크 (코드 기능)
- ⭐ [[_지식네트워크-INDEX]] — **앱의 지식 네트워크(15노드)를 Obsidian 그래프로** (`knowledge-network/` 폴더)
- [[KNOWLEDGE-NETWORK-API]] · [[KNOWLEDGE-NETWORK-USAGE]]
- [[NETWORK_EDGES_IMPLEMENTATION]] · [[NETWORK_EDGES_QUICK_START]] · [[NETWORK_EDGES_CHECKLIST]]
- [[NETWORK-STATS-USAGE-GUIDE]]

## 🚀 6. 배포 · 인프라
- [[DEPLOYMENT_GUIDE]] · [[DEPLOY]] · [[배포]] · [[배포방법백엔드와프론트엔드]]
- [[VERCEL-DEPLOYMENT-GUIDE-2026-05-29]] · [[VERCEL_CONFIG]]
- [[CI-CD-GUIDE]] · [[GITHUB_DEPLOYMENT_QUICKSTART]] · [[GITHUB_SECRETS_SETUP]]
- [[SUPABASE_SETUP]] · [[SUPABASE_INIT]] · [[SUPABASE_DATA_REPORT]]
- [[MIGRATION_EXECUTION_GUIDE]] · [[migrations_notes]] · [[환경]]

## 📈 7. 비즈니스 · 전략
- [[BOARD-PITCH-DECK-2026-05-30]] · [[INVESTOR-PITCH-DECK]] · [[EXECUTIVE-SUMMARY]]
- [[IMPLEMENTATION_ROADMAP]] · [[20260511-2200-FINAL-INTEGRATED-ROADMAP]] · [[FINANCIAL-MODEL-12MONTH]]
- [[GLOBAL-EXPANSION-STRATEGY-INDEX]] · [[COMPETITIVE-ANALYSIS-2026]]
- [[PHILIPPINES-EXPANSION-ROADMAP]] · [[INDONESIA-EXPANSION-PLAN]] · [[THAILAND-EXPANSION-PLAN]] · [[VIETNAM-EXPANSION-PLAN]]
- 비즈니스 가치 문서 모음: `00-BUSINESS-VALUE/` (예: START-HERE, EXECUTIVE-SUMMARY)

## 📋 8. 히스토리 · 기록
- [[history-workflow-book]] — 개발 히스토리(Order 기반) · [[히스토리북]]
- [[DECISION_LOG]] · [[CONVERSATION_HISTORY]] · [[완료보고서]]
- [[테스트목록]] · [[명령]]

---

## 🔌 Obsidian 연결 방법 (이 레포 = 볼트)

### 1) 볼트 열기
1. Obsidian 실행 → **"Open folder as vault"**
2. 이 레포 폴더 선택: `/Volumes/무제 - 데이터/elspa/elspa`
3. 좌측 **그래프 뷰(Graph view)** 아이콘 클릭 → 이 허브를 중심으로 문서 네트워크가 보입니다.

### 2) GitHub 동기화 (Obsidian Git 플러그인)
1. Settings → Community plugins → Browse → **"Obsidian Git"** 설치·활성화
2. 이 폴더는 이미 git 레포(`origin = jitnet57/elspa`)라 자동 인식됩니다.
3. Obsidian Git 설정에서 **자동 commit/push 주기**(예: 10분) 지정 → 노트 편집이 GitHub로 자동 반영.
   - 단, **push 인증**은 GitHub 계정(jitnet57)으로 설정돼 있어야 합니다.

### 3) 그래프가 잘 보이게 (권장 설정)
- Graph view 우측 톱니 → **Existing files only** 켜기(누락 링크 숨김)
- **Tags** 그룹 색상 지정: `MOC`, `knowledge-network` 등
- 이 허브 노트를 즐겨찾기(★)에 추가 → 지식 네트워크 진입점으로 사용

### 4) 코드 기능과의 관계
- 앱 안의 **`/admin/knowledge-network`** 는 DB(노드/엣지) 기반의 별도 시각화입니다. ([[KNOWLEDGE-NETWORK-USAGE]])
- 이 Obsidian 그래프는 **문서(.md) 기반** 지식 네트워크로, 둘은 상호 보완적입니다.
- 필요하면 이 허브의 링크 구조를 `/admin/knowledge-network`의 노드·엣지로 내보내는 스크립트도 만들 수 있습니다.

---

## ➕ 확장 규칙
- 새 문서를 만들면 → 위 8개 도메인 중 맞는 곳에 `[[새문서이름]]` 한 줄만 추가하세요. 자동으로 네트워크에 연결됩니다.
- 문서 본문에서도 다른 문서를 `[[이름]]`으로 자유롭게 언급하면 엣지가 늘어나 더 촘촘한 그래프가 됩니다.
