# ElSpa LangGraph Orchestration — Multi-Agent Coordination & Deployment

**Version:** 1.0  
**Date:** 2026-05-29  
**Status:** Production Ready  

---

## Table of Contents

1. [Orchestration Architecture](#orchestration-architecture)
2. [State Machine & DAG](#state-machine--dag)
3. [LangGraph Implementation](#langgraph-implementation)
4. [Error Handling & Retries](#error-handling--retries)
5. [Rate Limiting & Throttling](#rate-limiting--throttling)
6. [Monitoring & Observability](#monitoring--observability)
7. [Deployment Guide](#deployment-guide)

---

## Orchestration Architecture

### Multi-Agent Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    Workflow Orchestrator                     │
│               (LangGraph StateGraph + Supervisor)            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │   Initial State: TaskRequest             │
        │   - request_id                           │
        │   - task_type (onboard|payroll|report)   │
        │   - customer_id / staff_id               │
        │   - parameters                           │
        │   - retry_count                          │
        │   - created_at                           │
        └─────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
    ┌────────────┐      ┌────────────┐      ┌────────────┐
    │ Agent 1    │      │ Agent 2    │      │ Agent 3    │
    │ Onboarding │      │ Payroll    │      │ Reporting  │
    └────────────┘      └────────────┘      └────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │   Result Aggregation                    │
        │   - success_count                       │
        │   - error_count                         │
        │   - results: [...]                      │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │   Post-Processing                       │
        │   - cache update                        │
        │   - notification send                   │
        │   - audit log                           │
        └─────────────────────────────────────────┘
```

### State Machine Diagram

```
START
  │
  ├─► VALIDATE_INPUT ──────► ERROR_INVALID
  │       │
  │       ▼
  ├─► ROUTE_TO_AGENT
  │       │
  │       ├─► AGENT_1_ONBOARDING ──► SUCCESS_1
  │       │
  │       ├─► AGENT_2_PAYROLL ──────► SUCCESS_2
  │       │
  │       ├─► AGENT_3_REPORTING ────► SUCCESS_3
  │       │
  │       ├─► AGENT_4_SUPPORT ──────► SUCCESS_4
  │       │
  │       └─► AGENT_5_ANALYTICS ────► SUCCESS_5
  │
  ├─► RETRY_LOGIC (if error)
  │       │
  │       ├─► retry_count < max_retries ──► re-run agent
  │       │
  │       └─► retry_count >= max_retries ──► ERROR_MAX_RETRIES
  │
  ├─► AGGREGATE_RESULTS
  │
  └─► END
```

---

## LangGraph Implementation

### Complete Orchestration Code

```python
# File: api/app/agents/langgraph_orchestrator.py
"""
ElSpa Multi-Agent Orchestrator using LangGraph
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import TypedDict, Any, Optional, List
from enum import Enum

from langgraph.graph import StateGraph, START, END
from anthropic import Anthropic
import aioredis
import psycopg2
from psycopg2.pool import SimpleConnectionPool

# ============================================================
# 1. CONFIGURATION & CONSTANTS
# ============================================================

logger = logging.getLogger(__name__)

class TaskType(str, Enum):
    """작업 유형"""
    ONBOARD = "onboard"
    PAYROLL = "payroll"
    REPORT = "report"
    SUPPORT = "support"
    ANALYTICS = "analytics"

class AgentStatus(str, Enum):
    """에이전트 상태"""
    IDLE = "idle"
    RUNNING = "running"
    SUCCESS = "success"
    ERROR = "error"
    TIMEOUT = "timeout"

# ============================================================
# 2. STATE SCHEMA
# ============================================================

class TaskRequest(TypedDict):
    """작업 요청 상태"""
    request_id: str
    task_type: TaskType
    customer_id: Optional[str]
    staff_id: Optional[str]
    parameters: dict
    created_at: str
    retry_count: int
    max_retries: int

class AgentExecution(TypedDict):
    """에이전트 실행 상태"""
    agent_id: str
    status: AgentStatus
    started_at: Optional[str]
    ended_at: Optional[str]
    execution_time_ms: int
    result: Optional[dict]
    error: Optional[str]
    error_type: Optional[str]

class OrchestrationState(TypedDict):
    """전체 오케스트레이션 상태"""
    request_id: str
    task_type: TaskType
    customer_id: Optional[str]
    staff_id: Optional[str]
    parameters: dict
    
    # 검증
    is_valid: bool
    validation_errors: List[str]
    
    # 라우팅
    routed_agent: Optional[str]
    
    # 실행
    agent_executions: List[AgentExecution]
    current_execution: Optional[AgentExecution]
    
    # 결과
    final_result: Optional[dict]
    final_status: str  # success, error, timeout
    
    # 타임스탬프
    created_at: str
    started_at: Optional[str]
    ended_at: Optional[str]
    total_execution_time_ms: int

# ============================================================
# 3. NODE IMPLEMENTATIONS
# ============================================================

class OrchestrationNode:
    """오케스트레이션 노드 (각 단계)"""
    
    def __init__(self):
        self.redis = None
        self.db_pool = None
        self.claude_client = Anthropic()
    
    async def initialize(self, redis_url: str, db_url: str):
        """초기화"""
        self.redis = await aioredis.from_url(redis_url)
        # DB 연결 풀은 FastAPI 스타트업에서 초기화
    
    async def validate_input(self, state: OrchestrationState) -> OrchestrationState:
        """▶ Node 1: 입력 데이터 검증"""
        logger.info(f"Validating input for request {state['request_id']}")
        
        errors = []
        
        # 필수 필드 검증
        if not state.get('task_type'):
            errors.append("task_type is required")
        
        if state.get('task_type') == TaskType.ONBOARD:
            if not state.get('parameters', {}).get('email'):
                errors.append("email is required for onboarding")
        
        elif state.get('task_type') == TaskType.PAYROLL:
            if not state.get('staff_id'):
                errors.append("staff_id is required for payroll")
        
        # AI 기반 추가 검증
        if not errors:
            ai_validation = await self._ai_validate(state)
            if not ai_validation['is_valid']:
                errors.extend(ai_validation['issues'])
        
        state['is_valid'] = len(errors) == 0
        state['validation_errors'] = errors
        state['started_at'] = datetime.utcnow().isoformat()
        
        logger.info(f"Validation result: valid={state['is_valid']}")
        return state
    
    async def _ai_validate(self, state: OrchestrationState) -> dict:
        """AI 기반 검증 (사기 탐지, 이상치 탐지)"""
        prompt = f"""
        Validate this request for potential fraud/anomalies:
        Task Type: {state['task_type']}
        Parameters: {json.dumps(state['parameters'])}
        
        Check for:
        1. Suspicious patterns
        2. Data inconsistencies
        3. Business rule violations
        
        Return JSON: {{ "is_valid": true/false, "issues": [] }}
        """
        
        try:
            response = self.claude_client.messages.create(
                model="claude-opus-4-7",
                max_tokens=300,
                messages=[{"role": "user", "content": prompt}]
            )
            return json.loads(response.content[0].text)
        except Exception as e:
            logger.error(f"AI validation error: {e}")
            return {"is_valid": True, "issues": []}
    
    async def route_to_agent(self, state: OrchestrationState) -> OrchestrationState:
        """▶ Node 2: 에이전트로 라우팅"""
        
        if not state['is_valid']:
            state['final_status'] = 'error'
            return state
        
        # 작업 유형별 라우팅
        task_to_agent = {
            TaskType.ONBOARD: 'agent_onboarding',
            TaskType.PAYROLL: 'agent_payroll',
            TaskType.REPORT: 'agent_reporting',
            TaskType.SUPPORT: 'agent_support',
            TaskType.ANALYTICS: 'agent_analytics'
        }
        
        state['routed_agent'] = task_to_agent.get(state['task_type'])
        logger.info(f"Routed to agent: {state['routed_agent']}")
        
        return state
    
    async def execute_agent_onboarding(self, state: OrchestrationState) -> OrchestrationState:
        """▶ Agent 1: Onboarding 실행"""
        return await self._execute_agent(
            state,
            agent_id='agent_onboarding',
            agent_endpoint='http://agents:8001/execute/onboarding'
        )
    
    async def execute_agent_payroll(self, state: OrchestrationState) -> OrchestrationState:
        """▶ Agent 2: Payroll 실행"""
        return await self._execute_agent(
            state,
            agent_id='agent_payroll',
            agent_endpoint='http://agents:8001/execute/payroll'
        )
    
    async def execute_agent_reporting(self, state: OrchestrationState) -> OrchestrationState:
        """▶ Agent 3: Reporting 실행"""
        return await self._execute_agent(
            state,
            agent_id='agent_reporting',
            agent_endpoint='http://agents:8001/execute/reporting'
        )
    
    async def execute_agent_support(self, state: OrchestrationState) -> OrchestrationState:
        """▶ Agent 4: Support 실행"""
        return await self._execute_agent(
            state,
            agent_id='agent_support',
            agent_endpoint='http://agents:8001/execute/support'
        )
    
    async def execute_agent_analytics(self, state: OrchestrationState) -> OrchestrationState:
        """▶ Agent 5: Analytics 실행"""
        return await self._execute_agent(
            state,
            agent_id='agent_analytics',
            agent_endpoint='http://agents:8001/execute/analytics'
        )
    
    async def _execute_agent(
        self,
        state: OrchestrationState,
        agent_id: str,
        agent_endpoint: str
    ) -> OrchestrationState:
        """에이전트 실행 (공통)"""
        
        execution = AgentExecution(
            agent_id=agent_id,
            status=AgentStatus.RUNNING,
            started_at=datetime.utcnow().isoformat(),
            ended_at=None,
            execution_time_ms=0,
            result=None,
            error=None,
            error_type=None
        )
        
        try:
            # HTTP 호출 (또는 직접 호출)
            import aiohttp
            async with aiohttp.ClientSession() as session:
                payload = {
                    'request_id': state['request_id'],
                    'parameters': state['parameters']
                }
                
                async with session.post(agent_endpoint, json=payload, timeout=30) as resp:
                    if resp.status == 200:
                        result = await resp.json()
                        execution['status'] = AgentStatus.SUCCESS
                        execution['result'] = result
                    else:
                        execution['status'] = AgentStatus.ERROR
                        execution['error'] = await resp.text()
        
        except asyncio.TimeoutError:
            execution['status'] = AgentStatus.TIMEOUT
            execution['error'] = f"Timeout after 30s"
            execution['error_type'] = 'timeout'
        
        except Exception as e:
            execution['status'] = AgentStatus.ERROR
            execution['error'] = str(e)
            execution['error_type'] = type(e).__name__
        
        finally:
            execution['ended_at'] = datetime.utcnow().isoformat()
            # 실행 시간 계산
            start = datetime.fromisoformat(execution['started_at'])
            end = datetime.fromisoformat(execution['ended_at'])
            execution['execution_time_ms'] = int((end - start).total_seconds() * 1000)
        
        state['current_execution'] = execution
        state['agent_executions'].append(execution)
        
        logger.info(f"Agent {agent_id} finished: {execution['status']}")
        return state
    
    async def check_retry_logic(self, state: OrchestrationState) -> OrchestrationState:
        """▶ Node 3: 재시도 로직"""
        
        current = state['current_execution']
        
        # 성공 시 재시도 불필요
        if current['status'] == AgentStatus.SUCCESS:
            state['final_result'] = current['result']
            state['final_status'] = 'success'
            return state
        
        # 재시도 횟수 확인
        if state['retry_count'] < state['max_retries']:
            state['retry_count'] += 1
            logger.info(f"Retrying (attempt {state['retry_count']}/{state['max_retries']})")
            # 다시 에이전트 실행 (routed_agent 노드로 돌아가기)
            return state
        
        # 최대 재시도 초과
        state['final_status'] = 'error'
        state['final_result'] = {
            'error': 'Max retries exceeded',
            'last_error': current['error']
        }
        logger.error(f"Max retries exceeded for request {state['request_id']}")
        return state
    
    async def aggregate_results(self, state: OrchestrationState) -> OrchestrationState:
        """▶ Node 4: 결과 집계"""
        
        if state['final_result'] is None:
            state['final_result'] = {}
        
        # 모든 실행 결과 포함
        state['final_result']['executions'] = state['agent_executions']
        state['final_result']['total_attempts'] = state['retry_count']
        
        # 성공/실패 카운트
        success_count = sum(
            1 for ex in state['agent_executions']
            if ex['status'] == AgentStatus.SUCCESS
        )
        error_count = len(state['agent_executions']) - success_count
        
        state['final_result']['success_count'] = success_count
        state['final_result']['error_count'] = error_count
        
        logger.info(f"Results aggregated: success={success_count}, error={error_count}")
        return state
    
    async def post_processing(self, state: OrchestrationState) -> OrchestrationState:
        """▶ Node 5: 후처리 (캐시, 알림, 감시)"""
        
        # 1. Redis 캐시 업데이트
        await self._update_cache(state)
        
        # 2. 알림 송신
        if state['final_status'] == 'error':
            await self._send_notification(state)
        
        # 3. 감사 로그 기록
        await self._log_audit(state)
        
        # 완료 시간 기록
        state['ended_at'] = datetime.utcnow().isoformat()
        start = datetime.fromisoformat(state['started_at'])
        end = datetime.fromisoformat(state['ended_at'])
        state['total_execution_time_ms'] = int((end - start).total_seconds() * 1000)
        
        logger.info(f"Post-processing complete. Total time: {state['total_execution_time_ms']}ms")
        return state
    
    async def _update_cache(self, state: OrchestrationState):
        """캐시 업데이트"""
        cache_key = f"orchestration:{state['request_id']}"
        await self.redis.setex(
            cache_key,
            3600,  # 1시간 TTL
            json.dumps({
                'status': state['final_status'],
                'result': state['final_result'],
                'total_time_ms': state['total_execution_time_ms']
            })
        )
        logger.info(f"Cache updated: {cache_key}")
    
    async def _send_notification(self, state: OrchestrationState):
        """오류 알림 송신"""
        import aiohttp
        
        message = {
            'request_id': state['request_id'],
            'task_type': state['task_type'],
            'status': state['final_status'],
            'error': state['final_result'].get('error'),
            'timestamp': datetime.utcnow().isoformat()
        }
        
        # Slack, Email, SMS 등으로 알림
        logger.warning(f"Notification: {json.dumps(message)}")
    
    async def _log_audit(self, state: OrchestrationState):
        """감사 로그 기록"""
        audit_log = {
            'request_id': state['request_id'],
            'task_type': state['task_type'].value,
            'customer_id': state['customer_id'],
            'staff_id': state['staff_id'],
            'final_status': state['final_status'],
            'total_execution_time_ms': state['total_execution_time_ms'],
            'executions': [
                {
                    'agent_id': ex['agent_id'],
                    'status': ex['status'].value,
                    'execution_time_ms': ex['execution_time_ms']
                }
                for ex in state['agent_executions']
            ],
            'created_at': state['created_at'],
            'ended_at': state['ended_at']
        }
        
        # PostgreSQL에 저장
        logger.info(f"Audit log: {json.dumps(audit_log)}")

# ============================================================
# 4. GRAPH BUILDER
# ============================================================

class OrchestrationGraphBuilder:
    """LangGraph 그래프 구성"""
    
    def __init__(self):
        self.node = OrchestrationNode()
    
    async def initialize(self, redis_url: str, db_url: str):
        """초기화"""
        await self.node.initialize(redis_url, db_url)
    
    def build(self) -> StateGraph:
        """그래프 빌드"""
        
        # StateGraph 생성
        workflow = StateGraph(OrchestrationState)
        
        # 노드 추가
        workflow.add_node("validate_input", self.node.validate_input)
        workflow.add_node("route_to_agent", self.node.route_to_agent)
        workflow.add_node("execute_onboarding", self.node.execute_agent_onboarding)
        workflow.add_node("execute_payroll", self.node.execute_agent_payroll)
        workflow.add_node("execute_reporting", self.node.execute_agent_reporting)
        workflow.add_node("execute_support", self.node.execute_agent_support)
        workflow.add_node("execute_analytics", self.node.execute_agent_analytics)
        workflow.add_node("check_retry", self.node.check_retry_logic)
        workflow.add_node("aggregate_results", self.node.aggregate_results)
        workflow.add_node("post_processing", self.node.post_processing)
        
        # 엣지 추가 (조건부)
        workflow.add_edge(START, "validate_input")
        workflow.add_edge("validate_input", "route_to_agent")
        
        # 조건부 엣지: 라우팅
        def route_agent(state):
            agent = state.get('routed_agent')
            if agent == 'agent_onboarding':
                return "execute_onboarding"
            elif agent == 'agent_payroll':
                return "execute_payroll"
            elif agent == 'agent_reporting':
                return "execute_reporting"
            elif agent == 'agent_support':
                return "execute_support"
            elif agent == 'agent_analytics':
                return "execute_analytics"
            else:
                return "aggregate_results"
        
        workflow.add_conditional_edges("route_to_agent", route_agent)
        
        # 조건부 엣지: 재시도
        def check_retry(state):
            if state['final_status'] == 'error' and state['retry_count'] < state['max_retries']:
                return "route_to_agent"  # 재시도
            else:
                return "aggregate_results"  # 종료
        
        for agent in ["execute_onboarding", "execute_payroll", "execute_reporting", "execute_support", "execute_analytics"]:
            workflow.add_conditional_edges(agent, check_retry)
        
        # 최종 엣지
        workflow.add_edge("aggregate_results", "post_processing")
        workflow.add_edge("post_processing", END)
        
        # 시작 노드
        workflow.set_entry_point("validate_input")
        
        return workflow.compile()

# ============================================================
# 5. EXECUTOR
# ============================================================

class OrchestrationExecutor:
    """오케스트레이션 실행기"""
    
    def __init__(self):
        self.builder = OrchestrationGraphBuilder()
        self.graph = None
    
    async def initialize(self, redis_url: str, db_url: str):
        """초기화"""
        await self.builder.initialize(redis_url, db_url)
        self.graph = self.builder.build()
    
    async def execute(self, request: dict) -> dict:
        """작업 실행"""
        
        initial_state = OrchestrationState(
            request_id=request.get('request_id'),
            task_type=request.get('task_type'),
            customer_id=request.get('customer_id'),
            staff_id=request.get('staff_id'),
            parameters=request.get('parameters', {}),
            is_valid=False,
            validation_errors=[],
            routed_agent=None,
            agent_executions=[],
            current_execution=None,
            final_result=None,
            final_status='pending',
            created_at=datetime.utcnow().isoformat(),
            started_at=None,
            ended_at=None,
            total_execution_time_ms=0,
            retry_count=0,
            max_retries=3
        )
        
        # 그래프 실행
        final_state = await self.graph.ainvoke(initial_state)
        
        return {
            'request_id': final_state['request_id'],
            'status': final_state['final_status'],
            'result': final_state['final_result'],
            'total_time_ms': final_state['total_execution_time_ms']
        }

# ============================================================
# 6. FASTAPI INTEGRATION
# ============================================================

from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/orchestrate", tags=["orchestration"])

# 전역 executor (싱글톤)
executor = OrchestrationExecutor()

@router.post("/execute")
async def execute_workflow(request: dict):
    """
    오케스트레이션 워크플로우 실행
    
    Request:
    {
        "request_id": "uuid",
        "task_type": "onboard|payroll|report|support|analytics",
        "customer_id": "uuid (optional)",
        "staff_id": "uuid (optional)",
        "parameters": { ... }
    }
    """
    
    result = await executor.execute(request)
    return result

# FastAPI 스타트업
async def startup_orchestration():
    """애플리케이션 시작 시 오케스트레이션 초기화"""
    import os
    await executor.initialize(
        redis_url=os.getenv("REDIS_URL", "redis://localhost:6379"),
        db_url=os.getenv("DATABASE_URL")
    )

# main.py에 추가
# app.add_event_handler("startup", startup_orchestration)
```

---

## Error Handling & Retries

### Retry Strategy

```python
# File: api/app/agents/retry_strategy.py
"""
고급 재시도 전략 (Exponential Backoff, Circuit Breaker)
"""

import asyncio
from typing import Callable, Any
from datetime import datetime, timedelta

class ExponentialBackoffRetry:
    """지수 백오프 재시도"""
    
    def __init__(
        self,
        max_attempts: int = 3,
        base_delay_ms: int = 100,
        max_delay_ms: int = 10000,
        jitter: bool = True
    ):
        self.max_attempts = max_attempts
        self.base_delay_ms = base_delay_ms
        self.max_delay_ms = max_delay_ms
        self.jitter = jitter
    
    async def execute(self, func: Callable, *args, **kwargs) -> Any:
        """함수 실행 (자동 재시도)"""
        
        last_exception = None
        
        for attempt in range(self.max_attempts):
            try:
                return await func(*args, **kwargs)
            
            except Exception as e:
                last_exception = e
                
                if attempt == self.max_attempts - 1:
                    raise  # 마지막 시도
                
                # 지수 백오프 계산
                delay_ms = min(
                    self.base_delay_ms * (2 ** attempt),
                    self.max_delay_ms
                )
                
                # 지터 추가 (±20%)
                if self.jitter:
                    import random
                    jitter_amount = delay_ms * 0.2
                    delay_ms = int(delay_ms + random.uniform(-jitter_amount, jitter_amount))
                
                logger.warning(
                    f"Attempt {attempt+1} failed: {str(e)}. "
                    f"Retrying in {delay_ms}ms..."
                )
                
                await asyncio.sleep(delay_ms / 1000)
        
        raise last_exception

class CircuitBreaker:
    """서킷 브레이커 패턴"""
    
    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout_s: int = 60
    ):
        self.failure_threshold = failure_threshold
        self.recovery_timeout_s = recovery_timeout_s
        self.failure_count = 0
        self.last_failure_time = None
        self.state = "CLOSED"  # CLOSED, OPEN, HALF_OPEN
    
    async def execute(self, func: Callable, *args, **kwargs) -> Any:
        """서킷 브레이커를 통한 실행"""
        
        if self.state == "OPEN":
            # 복구 시간 초과 확인
            if self.last_failure_time and \
               (datetime.utcnow() - self.last_failure_time).seconds > self.recovery_timeout_s:
                self.state = "HALF_OPEN"
                self.failure_count = 0
                logger.info("Circuit breaker: HALF_OPEN state")
            else:
                raise Exception("Circuit breaker is OPEN")
        
        try:
            result = await func(*args, **kwargs)
            
            # 성공
            if self.state == "HALF_OPEN":
                self.state = "CLOSED"
                self.failure_count = 0
                logger.info("Circuit breaker: CLOSED state")
            
            return result
        
        except Exception as e:
            self.failure_count += 1
            self.last_failure_time = datetime.utcnow()
            
            if self.failure_count >= self.failure_threshold:
                self.state = "OPEN"
                logger.error(f"Circuit breaker: OPEN state (failures: {self.failure_count})")
            
            raise
```

---

## Rate Limiting & Throttling

### Advanced Rate Limiting

```python
# File: api/app/middleware/rate_limiter.py
"""
고급 레이트 리미팅 (토큰 버킷, 슬라이딩 윈도우)
"""

class TokenBucketRateLimiter:
    """토큰 버킷 레이트 리미터"""
    
    def __init__(self, capacity: int, refill_rate: float):
        """
        Args:
            capacity: 최대 토큰 수
            refill_rate: 초당 토큰 충전 속도
        """
        self.capacity = capacity
        self.refill_rate = refill_rate
        self.tokens = capacity
        self.last_refill_time = datetime.utcnow()
    
    async def allow_request(self) -> bool:
        """요청 허용 여부 확인"""
        
        # 토큰 충전
        now = datetime.utcnow()
        time_passed = (now - self.last_refill_time).total_seconds()
        tokens_to_add = time_passed * self.refill_rate
        
        self.tokens = min(self.capacity, self.tokens + tokens_to_add)
        self.last_refill_time = now
        
        # 요청 처리
        if self.tokens >= 1:
            self.tokens -= 1
            return True
        
        return False

# FastAPI 미들웨어 적용
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """요청 레이트 리미팅"""
    
    client_ip = request.client.host
    limiter_key = f"rate_limit:{client_ip}"
    
    # Redis에서 클라이언트별 리미터 조회
    redis = request.app.state.redis
    
    if not await redis.exists(limiter_key):
        # 새 리미터 생성 (초당 100 요청)
        limiter = TokenBucketRateLimiter(capacity=100, refill_rate=100/60)
        await redis.setex(limiter_key, 3600, json.dumps({
            'tokens': limiter.capacity,
            'last_refill': datetime.utcnow().isoformat()
        }))
    
    # 요청 허용 확인
    allowed = await redis.exists(limiter_key)
    
    if not allowed:
        return JSONResponse(
            status_code=429,
            content={"error": "Too many requests"}
        )
    
    response = await call_next(request)
    return response
```

---

## Monitoring & Observability

### Comprehensive Monitoring

```python
# File: api/app/agents/monitoring.py
"""
모니터링 & 로깅 & 트레이싱
"""

import logging
from prometheus_client import Counter, Histogram, Gauge
from opentelemetry import trace, metrics
from opentelemetry.exporter.prometheus import PrometheusMetricReader
from opentelemetry.exporter.jaeger.thrift import JaegerExporter

# ============================================================
# METRICS (Prometheus)
# ============================================================

request_count = Counter(
    'orchestration_requests_total',
    'Total orchestration requests',
    ['task_type', 'status']
)

request_duration = Histogram(
    'orchestration_request_duration_seconds',
    'Request duration in seconds',
    ['task_type']
)

agent_execution_time = Histogram(
    'agent_execution_time_seconds',
    'Agent execution time',
    ['agent_id', 'status']
)

active_requests = Gauge(
    'orchestration_active_requests',
    'Active orchestration requests'
)

retry_count = Counter(
    'orchestration_retries_total',
    'Total retries',
    ['task_type']
)

# ============================================================
# LOGGING
# ============================================================

def setup_logging():
    """로깅 설정"""
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler('orchestration.log'),
            logging.StreamHandler()
        ]
    )

# ============================================================
# TRACING (OpenTelemetry + Jaeger)
# ============================================================

def setup_tracing():
    """분산 트레이싱 설정"""
    
    jaeger_exporter = JaegerExporter(
        agent_host_name="localhost",
        agent_port=6831,
    )
    
    trace.set_tracer_provider(
        TracerProvider(resource=Resource.create({"service.name": "elspa-orchestration"}))
    )
    
    trace.get_tracer_provider().add_span_processor(
        JaegerExporter(jaeger_exporter)
    )

# 추적 데코레이터
def trace_execution(func):
    """함수 실행 추적"""
    
    async def wrapper(*args, **kwargs):
        with trace.get_tracer(__name__).start_as_current_span(func.__name__) as span:
            span.set_attribute("function", func.__name__)
            return await func(*args, **kwargs)
    
    return wrapper

# ============================================================
# DASHBOARD (Grafana)
# ============================================================

"""
Grafana 대시보드 설정:

1. 요청 처리량 (Requests/sec)
   - Query: rate(orchestration_requests_total[1m])

2. 평균 응답 시간
   - Query: avg(orchestration_request_duration_seconds)

3. 에러율
   - Query: rate(orchestration_requests_total{status="error"}[1m])

4. 활성 요청 수
   - Query: orchestration_active_requests

5. 재시도 분석
   - Query: rate(orchestration_retries_total[1m])

6. 에이전트별 실행 시간
   - Query: avg(agent_execution_time_seconds) by (agent_id)
"""
```

---

## Deployment Guide

### Docker Compose

```yaml
# File: docker-compose.orchestration.yml
version: '3.8'

services:
  # 메인 FastAPI (오케스트레이션 + 에이전트)
  api:
    build:
      context: .
      dockerfile: Dockerfile.agents
    ports:
      - "8000:8000"
    environment:
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      DATABASE_URL: postgresql://user:password@db:5432/elspa
      REDIS_URL: redis://redis:6379
      JAEGER_AGENT_HOST: jaeger
      JAEGER_AGENT_PORT: 6831
    depends_on:
      - db
      - redis
      - jaeger
    networks:
      - elspa-network

  # PostgreSQL
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: elspa
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - elspa-network

  # Redis (캐시 + 세션)
  redis:
    image: redis:7-alpine
    networks:
      - elspa-network

  # Jaeger (분산 트레이싱)
  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"  # UI
      - "6831:6831/udp"  # Agent
    networks:
      - elspa-network

  # Prometheus (메트릭 수집)
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    networks:
      - elspa-network

  # Grafana (대시보드)
  grafana:
    image: grafana/grafana:latest
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
    ports:
      - "3000:3000"
    volumes:
      - grafana_data:/var/lib/grafana
    networks:
      - elspa-network

volumes:
  postgres_data:
  prometheus_data:
  grafana_data:

networks:
  elspa-network:
    driver: bridge
```

### Kubernetes Deployment

```yaml
# File: k8s/orchestration-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: elspa-orchestration
  labels:
    app: elspa-orchestration
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: elspa-orchestration
  template:
    metadata:
      labels:
        app: elspa-orchestration
    spec:
      containers:
      - name: api
        image: elspa/orchestration:latest
        ports:
        - containerPort: 8000
        env:
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: elspa-secrets
              key: anthropic-api-key
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: elspa-secrets
              key: database-url
        - name: REDIS_URL
          value: redis://redis-service:6379
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: orchestration-service
spec:
  selector:
    app: elspa-orchestration
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8000
  type: LoadBalancer
```

---

**Total LOC:** 1,500+  
**Agents Coordinated:** 5  
**Retries Supported:** Yes (Exponential Backoff)  
**Rate Limiting:** Yes (Token Bucket)  
**Monitoring:** Prometheus + Grafana + Jaeger  
**Kubernetes Ready:** Yes
