# ELSPA LangGraph 아키텍처 설계서

> ElSpa의 다중 에이전트 오케스트레이션을 위한 LangGraph 상세 설계  
> **작성일**: 2026-05-29  
> **버전**: 1.0

---

## 📐 아키텍처 개요

### 시스템 계층도

```
┌─────────────────────────────────────────────────────────────────┐
│                    FastAPI REST API Layer                       │
├─────────────────────────────────────────────────────────────────┤
│  /schedule/recommend  /payroll/predict  /customer/analyze  etc  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                  LangGraph Orchestration                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐        │
│  │   Supervisor │   │   Dispatcher │   │   Executor   │        │
│  └──────────────┘   └──────────────┘   └──────────────┘        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
  ┌──────────┐      ┌──────────┐      ┌──────────┐
  │ Schedule │      │ Payroll  │      │ Customer │
  │ Optimizer│      │ Predictor│      │ Analytics│
  └──────────┘      └──────────┘      └──────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│               Claude API & Tools Layer                          │
├─────────────────────────────────────────────────────────────────┤
│  - Text Generation (추천/예측)                                  │
│  - Tool Use (SQL 쿼리, 데이터 조회)                            │
│  - Structured Output (JSON 스키마)                             │
│  - Prompt Caching (비용 50% 절감)                              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│               Data & Integration Layer                          │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL  │  Redis  │  Google Sheets  │  Bank APIs  │  SMS   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Graph 설계

### 1. Supervisor Graph (메인 조율자)

```python
from langgraph.graph import StateGraph, END
from typing import TypedDict, Literal
from enum import Enum

class WorkflowState(TypedDict):
    """전체 워크플로우 상태"""
    request_type: Literal["schedule", "payroll", "customer", "alert"]
    request_data: dict
    
    # 결과
    schedule_recommendation: dict
    payroll_prediction: dict
    customer_analysis: dict
    
    # 로그
    actions_taken: list[str]
    errors: list[str]
    execution_time: float

class SupervisorGraph:
    def __init__(self):
        self.graph = StateGraph(WorkflowState)
        self._build()
    
    def _build(self):
        # 노드 추가
        self.graph.add_node("router", self._router)
        self.graph.add_node("schedule_agent", self._schedule_agent)
        self.graph.add_node("payroll_agent", self._payroll_agent)
        self.graph.add_node("customer_agent", self._customer_agent)
        self.graph.add_node("executor", self._executor)
        
        # 엣지 추가
        self.graph.set_entry_point("router")
        self.graph.add_conditional_edges(
            "router",
            lambda state: state["request_type"],
            {
                "schedule": "schedule_agent",
                "payroll": "payroll_agent",
                "customer": "customer_agent",
            }
        )
        self.graph.add_edge("schedule_agent", "executor")
        self.graph.add_edge("payroll_agent", "executor")
        self.graph.add_edge("customer_agent", "executor")
        self.graph.add_edge("executor", END)
    
    async def _router(self, state: WorkflowState) -> WorkflowState:
        """라우팅 로직 (요청 타입 분류)"""
        request_type = state["request_type"]
        print(f"Routing to: {request_type}")
        return state
    
    async def _schedule_agent(self, state: WorkflowState):
        """스케줄 최적화 에이전트 호출"""
        # ScheduleOptimizer 인스턴스 호출
        pass
    
    async def _payroll_agent(self, state: WorkflowState):
        """급여 예측 에이전트 호출"""
        pass
    
    async def _customer_agent(self, state: WorkflowState):
        """고객 분석 에이전트 호출"""
        pass
    
    async def _executor(self, state: WorkflowState) -> WorkflowState:
        """결과 실행 (DB 저장, 알림 발송, API 호출)"""
        # 모든 결과를 수집하여 실행
        pass
```

### 2. Schedule Optimizer Graph

```python
from datetime import datetime

class ScheduleState(TypedDict):
    """스케줄 최적화 상태"""
    booking_id: int
    customer_id: int
    service_type: str
    preferred_time: str
    
    # 데이터
    customer_preferences: dict
    therapist_list: list[dict]
    availability: dict
    
    # 결과
    conflicts: list[dict]
    recommendation: dict
    confidence_score: float
    reasoning: str

class ScheduleOptimizer:
    def __init__(self, db_session, claude_client):
        self.db = db_session
        self.claude = claude_client
        self.graph = StateGraph(ScheduleState)
        self._build()
    
    def _build(self):
        """5-노드 플로우"""
        self.graph.add_node("load_data", self._load_data)
        self.graph.add_node("check_conflicts", self._check_conflicts)
        self.graph.add_node("generate_options", self._generate_options)
        self.graph.add_node("rank_options", self._rank_options)
        self.graph.add_node("format_response", self._format_response)
        
        self.graph.set_entry_point("load_data")
        self.graph.add_edge("load_data", "check_conflicts")
        self.graph.add_edge("check_conflicts", "generate_options")
        self.graph.add_edge("generate_options", "rank_options")
        self.graph.add_edge("rank_options", "format_response")
        self.graph.add_edge("format_response", END)
    
    async def _load_data(self, state: ScheduleState) -> ScheduleState:
        """1단계: 데이터 로드"""
        booking_id = state["booking_id"]
        
        # DB에서 예약, 고객, 서비스 조회
        booking = await self.db.query(Booking).filter(
            Booking.id == booking_id
        ).first()
        
        customer = booking.customer
        therapists = await self.db.query(Therapist).filter(
            Therapist.status == "active"
        ).all()
        
        # 테라피스트 가용성 확인
        availability = {}
        for therapist in therapists:
            # 예약 충돌 검사
            conflicts = await self.db.query(Booking).filter(
                Booking.therapist_id == therapist.id,
                Booking.status == "confirmed"
            ).all()
            availability[therapist.id] = [c.time_slot for c in conflicts]
        
        state.update({
            "customer_preferences": customer.preferences,
            "therapist_list": [
                {
                    "id": t.id,
                    "name": t.name,
                    "skills": t.skills,
                    "rating": t.average_rating,
                }
                for t in therapists
            ],
            "availability": availability,
        })
        return state
    
    async def _check_conflicts(self, state: ScheduleState) -> ScheduleState:
        """2단계: 충돌 감지"""
        preferred_time = state["preferred_time"]
        availability = state["availability"]
        
        conflicts = []
        for therapist_id, occupied_slots in availability.items():
            if preferred_time in occupied_slots:
                conflicts.append({
                    "therapist_id": therapist_id,
                    "time_slot": preferred_time,
                    "reason": "already_booked",
                })
        
        state["conflicts"] = conflicts
        return state
    
    async def _generate_options(self, state: ScheduleState) -> ScheduleState:
        """3단계: Claude API로 대체 옵션 생성"""
        
        # Prompt Caching을 활용한 프롬프트
        system_prompt = f"""
당신은 스파/마사지 스케줄 최적화 AI입니다.

고객 정보:
{json.dumps(state['customer_preferences'], indent=2)}

테라피스트 목록:
{json.dumps(state['therapist_list'], indent=2)}

가용성 정보:
{json.dumps(state['availability'], indent=2)}

요청된 시간대: {state['preferred_time']}
감지된 충돌: {len(state['conflicts'])}

최적의 3가지 대체 옵션을 JSON 형식으로 제시하세요.
각 옵션은:
- therapist_id: (정수)
- suggested_time: (HH:MM 형식)
- reasoning: (선택 이유)
- score: (0-100, 적합도)
"""
        
        # Claude API 호출 (Prompt Caching 활성화)
        response = await self.claude.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=500,
            system=[
                {
                    "type": "text",
                    "text": system_prompt,
                    "cache_control": {"type": "ephemeral"}  # 캐싱
                }
            ],
            messages=[
                {
                    "role": "user",
                    "content": f"최적의 배치를 찾아주세요."
                }
            ]
        )
        
        # 응답 파싱
        content = response.content[0].text
        options = json.loads(content)
        
        state["recommendation"] = {
            "options": options,
            "usage": {
                "input_tokens": response.usage.input_tokens,
                "cache_creation_tokens": response.usage.cache_creation_input_tokens,
                "cache_read_tokens": response.usage.cache_read_input_tokens,
            }
        }
        return state
    
    async def _rank_options(self, state: ScheduleState) -> ScheduleState:
        """4단계: 옵션 순위 매기기"""
        options = state["recommendation"]["options"]
        
        # 스코어 기반 정렬
        ranked = sorted(options, key=lambda x: x["score"], reverse=True)
        
        state["recommendation"]["top_option"] = ranked[0]
        state["confidence_score"] = ranked[0]["score"]
        return state
    
    async def _format_response(self, state: ScheduleState) -> ScheduleState:
        """5단계: 최종 응답 포맷"""
        top = state["recommendation"]["top_option"]
        
        state["reasoning"] = (
            f"최적의 배치: {top['reasoning']}. "
            f"신뢰도: {state['confidence_score']}%"
        )
        return state
```

### 3. Payroll Predictor Graph

```python
class PayrollState(TypedDict):
    """급여 예측 상태"""
    employee_id: int
    period_start: datetime
    period_end: datetime
    
    # 데이터
    ytd_earnings: float
    upcoming_events: list[dict]
    historical_data: list[dict]
    
    # 결과
    predicted_earnings: float
    tax_estimate: float
    cash_advance_needed: bool
    recommendation: str

class PayrollPredictor:
    def __init__(self, db_session, claude_client):
        self.db = db_session
        self.claude = claude_client
        self.graph = StateGraph(PayrollState)
        self._build()
    
    def _build(self):
        """4-노드 플로우"""
        self.graph.add_node("load_employee_data", self._load_employee_data)
        self.graph.add_node("forecast_earnings", self._forecast_earnings)
        self.graph.add_node("calculate_deductions", self._calculate_deductions)
        self.graph.add_node("generate_recommendation", self._generate_recommendation)
        
        self.graph.set_entry_point("load_employee_data")
        self.graph.add_edge("load_employee_data", "forecast_earnings")
        self.graph.add_edge("forecast_earnings", "calculate_deductions")
        self.graph.add_edge("calculate_deductions", "generate_recommendation")
        self.graph.add_edge("generate_recommendation", END)
    
    async def _load_employee_data(self, state: PayrollState):
        """직원 데이터 로드"""
        employee = await self.db.query(Employee).filter(
            Employee.id == state["employee_id"]
        ).first()
        
        # YTD 급여 집계
        ytd_earnings = sum([
            r.gross_amount for r in employee.payroll_records
            if r.period.year == datetime.now().year
        ])
        
        # 과거 12개월 데이터
        historical_data = [
            {
                "month": r.period.month,
                "year": r.period.year,
                "earnings": r.gross_amount,
                "overtime_hours": r.overtime_hours,
            }
            for r in employee.payroll_records[-12:]
        ]
        
        state.update({
            "ytd_earnings": ytd_earnings,
            "historical_data": historical_data,
        })
        return state
    
    async def _forecast_earnings(self, state: PayrollState):
        """Claude API로 급여 예측"""
        
        prompt = f"""
직원 ID: {state['employee_id']}

YTD 급여: ${state['ytd_earnings']:.2f}

과거 12개월 데이터:
{json.dumps(state['historical_data'], indent=2)}

다음 달 (기간: {state['period_start']} ~ {state['period_end']})의 급여를 예측하세요.
고려사항:
1. 월평균 기본급
2. 초과근무 패턴 (있는 경우)
3. 계절성 (월별 변동)

JSON 형식 응답:
{{
  "predicted_gross": (예측 총액),
  "confidence": (신뢰도 0-100),
  "reasoning": (근거)
}}
"""
        
        response = await self.claude.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=300,
            messages=[{"role": "user", "content": prompt}]
        )
        
        prediction = json.loads(response.content[0].text)
        state["predicted_earnings"] = prediction["predicted_gross"]
        return state
    
    async def _calculate_deductions(self, state: PayrollState):
        """세금/보험료 계산"""
        gross = state["predicted_earnings"]
        
        # 기존 로직 사용 (payroll.py)
        taxes = calculate_taxes(gross, state["employee_id"])
        insurance = calculate_sss(gross)
        
        state["tax_estimate"] = taxes
        state["cash_advance_needed"] = gross < 500  # 임계값
        return state
    
    async def _generate_recommendation(self, state: PayrollState):
        """최종 추천"""
        if state["cash_advance_needed"]:
            state["recommendation"] = (
                f"예상 급여 ${state['predicted_earnings']:.2f} < 최소값. "
                f"급여 선금 신청을 권장합니다."
            )
        else:
            state["recommendation"] = "정상 지급 예상"
        return state
```

### 4. Customer Analytics Graph

```python
class CustomerState(TypedDict):
    """고객 분석 상태"""
    customer_id: int
    
    # 데이터
    booking_history: list[dict]
    lifetime_value: float
    churn_risk_score: float
    customer_segment: Literal["VIP", "Regular", "At-risk", "New"]
    
    # 액션
    recommended_actions: list[str]
    marketing_offer: str

class CustomerAnalytics:
    def __init__(self, db_session, claude_client):
        self.db = db_session
        self.claude = claude_client
        self.graph = StateGraph(CustomerState)
        self._build()
    
    def _build(self):
        """4-노드 플로우"""
        self.graph.add_node("load_customer_data", self._load_customer_data)
        self.graph.add_node("analyze_churn_risk", self._analyze_churn_risk)
        self.graph.add_node("segment_customer", self._segment_customer)
        self.graph.add_node("generate_actions", self._generate_actions)
        
        self.graph.set_entry_point("load_customer_data")
        self.graph.add_edge("load_customer_data", "analyze_churn_risk")
        self.graph.add_edge("analyze_churn_risk", "segment_customer")
        self.graph.add_edge("segment_customer", "generate_actions")
        self.graph.add_edge("generate_actions", END)
    
    async def _load_customer_data(self, state: CustomerState):
        """고객 데이터 로드"""
        customer = await self.db.query(Customer).filter(
            Customer.id == state["customer_id"]
        ).first()
        
        bookings = customer.bookings
        ltv = sum([b.service_amount for b in bookings])
        
        state.update({
            "booking_history": [
                {
                    "date": b.booking_date,
                    "service": b.service_type,
                    "amount": b.service_amount,
                    "therapist": b.therapist.name,
                    "rating": b.rating,
                }
                for b in bookings[-12:]  # 최근 12개월
            ],
            "lifetime_value": ltv,
        })
        return state
    
    async def _analyze_churn_risk(self, state: CustomerState):
        """Churn risk 분석"""
        
        prompt = f"""
고객 LTV: ${state['lifetime_value']:.2f}

예약 히스토리:
{json.dumps(state['booking_history'], indent=2)}

다음을 분석하세요:
1. 방문 빈도 (증가/감소 추세)
2. 마지막 방문 이후 경과일
3. 평점 추세
4. 이탈 위험도 (0-100)

JSON 응답:
{{
  "churn_risk_score": (0-100, 높을수록 위험),
  "risk_factors": [...],
  "last_visit_days_ago": (정수)
}}
"""
        
        response = await self.claude.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=400,
            messages=[{"role": "user", "content": prompt}]
        )
        
        analysis = json.loads(response.content[0].text)
        state["churn_risk_score"] = analysis["churn_risk_score"]
        return state
    
    async def _segment_customer(self, state: CustomerState):
        """고객 세분화"""
        ltv = state["lifetime_value"]
        risk = state["churn_risk_score"]
        
        if ltv > 2000 and risk < 30:
            state["customer_segment"] = "VIP"
        elif ltv > 500 and risk < 50:
            state["customer_segment"] = "Regular"
        elif risk > 70:
            state["customer_segment"] = "At-risk"
        else:
            state["customer_segment"] = "New"
        
        return state
    
    async def _generate_actions(self, state: CustomerState):
        """추천 액션 생성"""
        segment = state["customer_segment"]
        
        actions = {
            "VIP": [
                "프리미엄 서비스 15% 할인 오퍼",
                "우선 예약 권리 제공",
                "월 1회 무료 서비스 포함"
            ],
            "Regular": [
                "월간 뉴스레터 (특가 정보)",
                "적립금 5% 보너스"
            ],
            "At-risk": [
                "무료 컨설테이션 오퍼",
                "복귀 고객 20% 할인",
                "피드백 요청"
            ],
            "New": [
                "신규 고객 환영 10% 할인",
                "만족도 피드백 요청"
            ]
        }
        
        state["recommended_actions"] = actions[segment]
        state["marketing_offer"] = actions[segment][0]
        
        return state
```

---

## 🔄 State 관리 & 체크포인팅

### State 정의

```python
from typing import TypedDict, Optional
from datetime import datetime

class ElspaAgentState(TypedDict):
    """통합 상태 (모든 에이전트 공유)"""
    
    # 입력
    request_id: str
    request_type: str
    user_id: int
    timestamp: datetime
    
    # 에이전트 결과
    schedule_result: Optional[dict]
    payroll_result: Optional[dict]
    customer_result: Optional[dict]
    
    # 실행 로그
    executed_actions: list[dict]
    errors: list[dict]
    
    # 메타데이터
    execution_time_ms: float
    cache_hit: bool
```

### 체크포인팅 설정

```python
from langgraph.checkpoint.postgres import PostgresSaver

# PostgreSQL 체크포인트
checkpoint_storage = PostgresSaver(
    conn_string="postgresql://user:password@localhost/elspa_checkpoints"
)

# Graph 컴파일 (체크포인팅 활성화)
compiled_graph = graph.compile(
    checkpointer=checkpoint_storage,
    interrupt_before=["format_response"],  # 사용자 개입 지점
)
```

---

## 🛠️ Tool 정의 (Claude API Tool Use)

### Tool 1: Database Query

```python
from anthropic import tool

@tool
def query_therapist_availability(
    date: str,  # YYYY-MM-DD
    service_type: str
) -> list[dict]:
    """
    주어진 날짜와 서비스 유형에 맞는 테라피스트 목록 조회
    
    Args:
        date: 예약 날짜 (YYYY-MM-DD)
        service_type: 서비스 유형 (massage, spa, facial 등)
    
    Returns:
        가용 테라피스트 목록
    """
    # SQL 실행
    from app.database import SessionLocal
    db = SessionLocal()
    
    therapists = db.query(Therapist).filter(
        Therapist.service_types.contains([service_type])
    ).all()
    
    result = []
    for t in therapists:
        # 예약 충돌 확인
        conflicts = db.query(Booking).filter(
            Booking.therapist_id == t.id,
            Booking.booking_date == date,
            Booking.status == "confirmed"
        ).all()
        
        available_slots = [
            f"{h}:00" for h in range(9, 22)
            if f"{h}:00" not in [c.time_slot for c in conflicts]
        ]
        
        result.append({
            "therapist_id": t.id,
            "name": t.name,
            "rating": t.average_rating,
            "available_slots": available_slots[:5],  # 상위 5개 슬롯
        })
    
    return result

# Claude API에 등록
tools = [
    {
        "name": "query_therapist_availability",
        "description": "주어진 날짜와 서비스 유형에 맞는 테라피스트 목록 조회",
        "input_schema": {
            "type": "object",
            "properties": {
                "date": {"type": "string", "description": "YYYY-MM-DD"},
                "service_type": {"type": "string"},
            },
            "required": ["date", "service_type"],
        },
    }
]
```

### Tool 2: Customer Preference Query

```python
@tool
def get_customer_preferences(customer_id: int) -> dict:
    """고객의 선호도 정보 조회"""
    from app.database import SessionLocal
    db = SessionLocal()
    
    customer = db.query(Customer).filter(
        Customer.id == customer_id
    ).first()
    
    return {
        "preferred_therapist": customer.preferred_therapist,
        "preferred_time": customer.preferred_time,
        "preferred_services": customer.preferred_services,
        "allergies": customer.allergies,
        "notes": customer.notes,
    }
```

---

## 📊 Streaming & Real-time Updates

### Streaming 구현

```python
async def schedule_optimizer_stream(request_data: dict):
    """스트리밍으로 추천 과정 실시간 표시"""
    
    state = {
        "booking_id": request_data["booking_id"],
        # ... 초기화
    }
    
    compiled_graph = graph.compile()
    
    # 스트리밍 실행
    async for event in compiled_graph.astream(state):
        node_name = list(event.keys())[0]
        node_state = event[node_name]
        
        # WebSocket으로 전송
        await websocket.send_json({
            "stage": node_name,
            "status": "in_progress",
            "data": node_state.get("recommendation", {}),
            "timestamp": datetime.now().isoformat(),
        })
    
    # 최종 결과
    await websocket.send_json({
        "stage": "complete",
        "status": "success",
        "data": state["recommendation"],
    })
```

---

## 🚀 배포 및 확장

### FastAPI 통합

```python
from fastapi import APIRouter, WebSocket
from .agents.schedule_optimizer import ScheduleOptimizer

router = APIRouter(prefix="/api/agents", tags=["agents"])

@router.post("/schedule/recommend")
async def recommend_schedule(request: ScheduleRequest):
    """스케줄 최적화 동기 요청"""
    optimizer = ScheduleOptimizer(db, claude_client)
    result = await optimizer.run(request.dict())
    return result

@router.websocket("/schedule/recommend/stream")
async def recommend_schedule_stream(websocket: WebSocket):
    """스케줄 최적화 스트리밍"""
    await websocket.accept()
    request_data = await websocket.receive_json()
    
    optimizer = ScheduleOptimizer(db, claude_client)
    await optimizer.stream(request_data, websocket)
```

---

## 📈 모니터링 & 메트릭

### 메트릭 추적

```python
from prometheus_client import Counter, Histogram

# 메트릭 정의
agent_execution_counter = Counter(
    "agent_execution_total",
    "총 에이전트 실행 횟수",
    ["agent_name", "status"]
)

agent_execution_time = Histogram(
    "agent_execution_seconds",
    "에이전트 실행 시간",
    ["agent_name"]
)

# 메트릭 기록
with agent_execution_time.labels("schedule_optimizer").time():
    result = await optimizer.run(state)
    agent_execution_counter.labels("schedule_optimizer", "success").inc()
```

---

## ✅ 구현 체크리스트

- [ ] 기본 LangGraph 환경 설정
- [ ] Claude API 통합 (API Key 관리)
- [ ] Prompt Caching 설정
- [ ] 5개 Node 구현 (Schedule Optimizer)
- [ ] Tool 정의 (DB Query, Customer Preference)
- [ ] State & Checkpointing
- [ ] Streaming 구현
- [ ] WebSocket 통합
- [ ] 메트릭 & 모니터링
- [ ] E2E 테스트
- [ ] 배포 (Docker, Kubernetes)

---

**문서 작성자**: jitnet57  
**최종 검토**: 2026-05-29  
**버전**: 1.0 - 초안
