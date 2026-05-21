# 📊 ElSpa 모니터링 설정 가이드

**작성일:** 2026-05-22  
**버전:** 1.0  
**담당자:** DevOps Team

---

## 📋 목차

1. [빠른 시작](#빠른-시작)
2. [로깅 설정](#로깅-설정)
3. [APM 설정](#apm-설정-sentry)
4. [메트릭 수집](#메트릭-수집-prometheus)
5. [대시보드 설정](#대시보드-설정-grafana)
6. [알림 규칙](#알림-규칙)
7. [모니터링 체크리스트](#모니터링-체크리스트)

---

## 빠른 시작

### 1. 모니터링 스택 시작

```bash
# 모니터링 서비스 시작 (ELK + Prometheus + Grafana)
docker-compose -f docker-compose.monitoring.yml up -d

# 상태 확인
docker-compose -f docker-compose.monitoring.yml ps
```

### 2. 접근 가능한 대시보드

| 서비스 | URL | 기본 인증 |
|-------|-----|---------|
| Kibana (로그) | http://localhost:5601 | 없음 |
| Prometheus | http://localhost:9090 | 없음 |
| Grafana (메트릭) | http://localhost:3000 | admin/admin |
| Alertmanager | http://localhost:9093 | 없음 |
| Sentry (에러) | http://localhost:9000 | 설정 필요 |

---

## 로깅 설정

### 1. Python 로깅 구성

**파일:** `app/utils/logging_config.py`

```python
from app.utils.logging_config import setup_logging, get_context_logger

# 애플리케이션 시작 시 로깅 초기화
setup_logging(
    log_level="INFO",
    log_dir="./logs",  # 로그 파일 저장 경로
    json_format=True,  # JSON 포맷 로그
)

# 컨텍스트 로거 사용
logger = get_context_logger("my_module")
logger.set_context(user_id=123, request_id="req_xyz")
logger.info("사용자 행동", action="login")
```

### 2. main.py에 통합

```python
# main.py
from app.utils.logging_config import setup_logging

@app.on_event("startup")
async def startup():
    setup_logging(
        log_level="INFO",
        log_dir="./logs",
        json_format=True,
    )
    logger.info("🚀 ElSpa API 시작 중...")
```

### 3. Filebeat로 Elasticsearch에 전송

```bash
# 로그 디렉토리 생성
mkdir -p ./logs

# Docker Compose로 Filebeat 시작
docker-compose -f docker-compose.monitoring.yml up -d filebeat

# Elasticsearch 확인
curl http://localhost:9200/_cat/indices
```

### 4. Kibana에서 로그 조회

1. Kibana (http://localhost:5601) 접속
2. "Discover" 클릭
3. "elspa-logs-*" 인덱스 선택
4. 로그 검색

**검색 쿼리 예시:**

```
# 에러 로그만 조회
level: "ERROR"

# 특정 사용자 로그
user_id: 123

# 느린 요청
duration_ms > 2000

# 특정 엔드포인트
path: "/api/therapists/*"
```

---

## APM 설정 (Sentry)

### 1. Sentry 계정 생성

```bash
# 로컬에서 Sentry 실행 (또는 sentry.io 가입)
docker-compose -f docker-compose.monitoring.yml up -d sentry

# Sentry 초기 설정
# http://localhost:9000 접속
# 계정 생성 및 프로젝트 생성

# DSN 확인 (설정 → 클라이언트 키)
# 예: https://key@sentry.io/project-id
```

### 2. 환경변수 설정

```bash
# .env 파일
SENTRY_DSN="https://key@sentry.io/project-id"
SENTRY_ENVIRONMENT="production"  # 또는 development
```

### 3. main.py에 Sentry 통합

```python
# main.py
from app.middleware.apm import init_sentry

# 시작 시 Sentry 초기화
@app.on_event("startup")
async def startup():
    init_sentry(environment="production")
    logger.info("✅ Sentry 초기화 완료")
```

### 4. 에러 추적

**자동 추적:**
- 처리되지 않은 예외는 자동으로 Sentry에 전송됨

**수동 추적:**

```python
import sentry_sdk

try:
    # 코드
    do_something()
except Exception as e:
    # 에러 수동으로 전송
    sentry_sdk.capture_exception(e)
    
    # 또는 메시지 전송
    sentry_sdk.capture_message("Custom message", level="warning")
```

**성능 모니터링:**

```python
from app.middleware.apm import monitor_performance

@monitor_performance(threshold_ms=1000)  # 1초 이상 느리면 경고
async def slow_function():
    await expensive_operation()
```

### 5. Sentry 대시보드

1. Sentry (http://localhost:9000) 접속
2. "Issues" - 에러 목록 조회
3. "Releases" - 배포 추적
4. "Performance" - 성능 분석

---

## 메트릭 수집 (Prometheus)

### 1. FastAPI에 메트릭 엔드포인트 추가

**파일:** `app/middleware/metrics.py`

```python
from app.middleware.metrics import setup_metrics_endpoint, metrics_middleware

# main.py에서 미들웨어 등록
@app.middleware("http")
async def metrics_middleware_wrapper(request: Request, call_next):
    return await metrics_middleware(request, call_next)

# 메트릭 엔드포인트 추가
setup_metrics_endpoint(app)
```

### 2. Prometheus 설정

**파일:** `monitoring/prometheus.yml`

```yaml
scrape_configs:
  - job_name: elspa-api
    metrics_path: /metrics
    static_configs:
      - targets: ["localhost:8000"]
```

### 3. 수집되는 메트릭

| 메트릭 | 설명 | 예시 |
|-------|------|------|
| `http_requests_total` | 총 HTTP 요청 수 | method, endpoint, status_code |
| `http_request_duration_seconds` | 요청 응답 시간 | method, endpoint |
| `http_errors_total` | 총 에러 수 | method, endpoint, error_code |
| `db_queries_total` | 총 DB 쿼리 수 | operation, table |
| `db_query_duration_seconds` | DB 쿼리 응답 시간 | operation, table |

### 4. 메트릭 확인

```bash
# Prometheus 웹 UI
http://localhost:9090

# 쿼리 예시
rate(http_requests_total[5m])  # 5분간 요청율
histogram_quantile(0.95, http_request_duration_seconds_bucket)  # P95 응답시간
```

---

## 대시보드 설정 (Grafana)

### 1. Grafana 시작

```bash
# Docker로 Grafana 시작
docker-compose -f docker-compose.monitoring.yml up -d grafana

# http://localhost:3000 접속
# 기본 인증: admin / admin
```

### 2. 데이터 소스 추가

1. "Configuration" → "Data Sources"
2. "Add data source"
3. "Prometheus" 선택
4. URL: `http://prometheus:9090`
5. "Save & test"

### 3. 대시보드 생성

**1) API 성능 대시보드**

```
패널 1: 요청 처리량
- 쿼리: rate(http_requests_total[5m])
- 차트: Graph

패널 2: 응답 시간 (P50, P95, P99)
- 쿼리: histogram_quantile(0.50, http_request_duration_seconds_bucket)
- 차트: Graph

패널 3: 에러율
- 쿼리: rate(http_errors_total[5m])
- 차트: Gauge
```

**2) 데이터베이스 성능 대시보드**

```
패널 1: DB 쿼리 수
- 쿼리: rate(db_queries_total[5m])
- 그룹: operation, table

패널 2: DB 응답 시간
- 쿼리: histogram_quantile(0.95, db_query_duration_seconds_bucket)
- 차트: Heatmap
```

**3) 시스템 리소스 대시보드**

```
패널 1: CPU 사용률
- 쿼리: rate(process_cpu_seconds_total[5m])

패널 2: 메모리 사용량
- 쿼리: process_resident_memory_bytes / 1024 / 1024

패널 3: 디스크 사용량
- 쿼리: node_filesystem_avail_bytes
```

### 4. 대시보드 공유

```bash
# Grafana UI에서
1. 대시보드 열기
2. "Share" 클릭
3. "Export" 또는 "Link" 생성
```

---

## 알림 규칙

### 1. 알림 규칙 설정

**파일:** `monitoring/alerting.yaml`

주요 알림:
- **High Error Rate**: 에러율 > 5%
- **Slow API Response**: P95 응답시간 > 2초
- **Database Errors**: DB 에러 > 10개/5분
- **High Memory Usage**: 메모리 > 80%
- **High CPU Usage**: CPU > 80%

### 2. Prometheus 알림 규칙

```bash
# Prometheus에 알림 규칙 로드
curl -X POST http://localhost:9090/-/reload
```

### 3. Slack 알림 설정

```bash
# .env 파일
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

**Slack 웹훅 생성:**
1. Slack Workspace 접속
2. "Apps" → "Custom Integrations"
3. "Incoming Webhooks" 클릭
4. 채널 선택 및 웹훅 URL 생성

### 4. 알림 테스트

```bash
# Alertmanager API를 통해 테스트 알림 발송
curl -XPOST http://localhost:9093/api/v1/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "alerts": [{
      "labels": {
        "alertname": "TestAlert",
        "severity": "critical"
      },
      "annotations": {
        "summary": "Test Alert"
      }
    }]
  }'
```

---

## 모니터링 체크리스트

### 배포 전 확인사항

- [ ] Prometheus 메트릭 엔드포인트 활성화
- [ ] Sentry DSN 환경변수 설정
- [ ] Slack 웹훅 URL 설정
- [ ] Elasticsearch 데이터 경로 설정
- [ ] Grafana 대시보드 생성
- [ ] 알림 규칙 설정 및 테스트
- [ ] 로그 보관 정책 확인
- [ ] 민감 정보 로깅 제외 확인

### 일일 점검

- [ ] Sentry 에러 확인
- [ ] Prometheus 메트릭 수집 확인
- [ ] Grafana 대시보드 이상 여부 확인
- [ ] 알림 수신 확인

### 주간 점검

- [ ] 에러 추세 분석
- [ ] 성능 저하 패턴 확인
- [ ] 리소스 사용량 분석
- [ ] 로그 스토리지 용량 확인

### 월간 점검

- [ ] 오래된 로그 정리
- [ ] Prometheus 데이터 리텐션 정책 검토
- [ ] 대시보드 및 알림 규칙 업데이트
- [ ] 모니터링 성능 최적화

---

## 문제 해결

### Prometheus가 메트릭을 수집하지 못함

```bash
# 1. Prometheus UI에서 Status → Targets 확인
http://localhost:9090/targets

# 2. 엔드포인트가 정상인지 확인
curl http://localhost:8000/metrics

# 3. Prometheus 설정 재로드
curl -X POST http://localhost:9090/-/reload
```

### Elasticsearch 디스크 용량 부족

```bash
# 1. 오래된 인덱스 삭제
curl -X DELETE http://localhost:9200/elspa-logs-2026.04.*

# 2. 인덱스 라이프사이클 정책 설정
curl -X PUT http://localhost:9200/_ilm/policy/elspa-logs-policy \
  -H 'Content-Type: application/json' \
  -d '{
    "policy": "elspa-logs-policy",
    "phases": {
      "hot": {
        "min_age": "0d",
        "actions": {"rollover": {"max_size": "50GB", "max_age": "30d"}}
      },
      "delete": {
        "min_age": "90d",
        "actions": {"delete": {}}
      }
    }
  }'
```

### Grafana 대시보드 느림

```bash
# 1. Prometheus 쿼리 최적화
# - 범위 줄이기
# - 스크래이프 간격 증가

# 2. 대시보드 패널 수 감소
# - 불필요한 패널 제거
# - 패널 새로고침 간격 조정
```

---

## 참고 자료

- [Prometheus 공식 문서](https://prometheus.io/docs/)
- [Grafana 공식 문서](https://grafana.com/docs/)
- [Elasticsearch 공식 문서](https://www.elastic.co/guide/en/elasticsearch/reference/)
- [Sentry 공식 문서](https://docs.sentry.io/)
- [ELK Stack 튜토리얼](https://www.elastic.co/guide/en/logstash/current/)

---

**버전 업데이트:** 2026-05-22  
**담당자:** DevOps Team
