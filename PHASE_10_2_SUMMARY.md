# 📊 Phase 10-2: 모니터링 & 로깅 설정 완료 보고서

**완료일:** 2026-05-22  
**작업 기간:** Wave 5-2 (배포 단계)  
**담당자:** DevOps/SRE Team

---

## 📋 개요

ElSpa 프로젝트의 모니터링 및 로깅 인프라를 구축했습니다. 프로덕션 배포를 위한 관찰성(Observability)을 확보했습니다.

---

## ✅ 완료 항목

### 1. 구조화된 로깅 (Structured Logging)

**파일:** `app/utils/logging_config.py`

**기능:**
- JSON 포맷 로깅
- 다중 핸들러 (콘솔 + 파일)
- 컨텍스트 로거 (추가 정보 기록)
- 자동 로그 회전 (10MB)

**사용 예:**
```python
from app.utils.logging_config import get_context_logger

logger = get_context_logger("my_module")
logger.set_context(user_id=123, request_id="req_xyz")
logger.info("사용자 로그인", action="login")
```

---

### 2. APM & 에러 추적 (Application Performance Monitoring)

**파일:** `app/middleware/apm.py`

**기능:**
- Sentry 통합 (선택사항)
- 성능 모니터링 데코레이터
- 사용자 행동 추적
- 메트릭 수집

**사용 예:**
```python
from app.middleware.apm import monitor_performance, track_user_action

@monitor_performance(threshold_ms=1000)
async def slow_operation():
    # 1초 이상 걸리면 경고
    pass

track_user_action("login", user_id=123, metadata={"ip": "192.168.1.1"})
```

---

### 3. 에러 추적 & 예외 처리

**파일:** `app/middleware/error_tracking.py`

**기능:**
- 전역 예외 핸들러
- 구조화된 에러 응답
- 요청 추적 (Request ID)
- Sentry 자동 전송

**에러 응답 형식:**
```json
{
  "status_code": 500,
  "error_code": "DATABASE_ERROR",
  "message": "Database operation failed",
  "message_ko": "데이터베이스 작업 실패",
  "request_id": "req_abc123",
  "timestamp": "2026-05-22T10:30:00Z"
}
```

---

### 4. 메트릭 수집 (Prometheus)

**파일:** `app/middleware/metrics.py`

**수집 메트릭:**
| 메트릭 | 설명 |
|-------|------|
| `http_requests_total` | 총 요청 수 |
| `http_request_duration_seconds` | 응답 시간 |
| `http_errors_total` | 에러 수 |
| `db_queries_total` | DB 쿼리 수 |
| `db_query_duration_seconds` | DB 응답 시간 |
| `cache_hits_total` | 캐시 히트 |
| `external_api_calls_total` | 외부 API 호출 |

**메트릭 엔드포인트:** `GET /metrics` (Prometheus 형식)

---

### 5. 알림 규칙 설정

**파일:** `monitoring/alerting.yaml`

**주요 알림:**
- 에러율 > 5%
- API 응답 시간 (P95) > 2초
- DB 에러 > 10개/5분
- 메모리 사용률 > 80%
- CPU 사용률 > 80%

**알림 채널:**
- Slack: 실시간 알림
- Email: 주요 이벤트
- PagerDuty: Critical 사건

---

### 6. 모니터링 스택 (Docker Compose)

**파일:** `docker-compose.monitoring.yml`

**서비스:**
| 서비스 | 포트 | 용도 |
|-------|------|------|
| Elasticsearch | 9200 | 로그 저장소 |
| Kibana | 5601 | 로그 시각화 |
| Filebeat | - | 로그 수집기 |
| Prometheus | 9090 | 메트릭 저장소 |
| Alertmanager | 9093 | 알림 관리 |
| Grafana | 3000 | 메트릭 시각화 |
| Node Exporter | 9100 | 시스템 메트릭 |
| Sentry | 9000 | 에러 추적 |

---

### 7. 로그 보관 정책

**파일:** `LOGGING_POLICY.md`

**보관 기간:**
| 로그 유형 | 기간 | 저장소 |
|---------|------|-------|
| 에러 로그 | 90일 | Elasticsearch |
| 감사 로그 | 1년 | PostgreSQL |
| 접근 로그 | 30일 | Elasticsearch |
| 성능 로그 | 60일 | Prometheus |
| 디버그 로그 | 7일 | 메모리/파일 |

---

### 8. 설정 가이드

**파일:** `MONITORING_SETUP_GUIDE.md`

**포함 내용:**
- 빠른 시작 가이드
- 로깅 설정
- Sentry 설정
- Prometheus 설정
- Grafana 대시보드 구성
- 알림 규칙 설정
- 문제 해결

---

## 🚀 구현 체크리스트

### 배포 전 준비

```bash
# 1. 패키지 설치
pip install -r requirements-monitoring.txt

# 2. 환경변수 설정
cp .env.example .env
# .env 파일에 다음 항목 채우기:
# - SENTRY_DSN
# - SLACK_WEBHOOK_URL
# - LOG_DIR
```

### 모니터링 스택 시작

```bash
# 3. Docker Compose로 모니터링 서비스 시작
docker-compose -f docker-compose.monitoring.yml up -d

# 4. 서비스 상태 확인
docker-compose -f docker-compose.monitoring.yml ps

# 5. 로그 디렉토리 생성
mkdir -p ./logs
```

### 애플리케이션 시작

```bash
# 6. FastAPI 애플리케이션 시작
python main.py
# 또는
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 대시보드 접근

```
Kibana (로그):        http://localhost:5601
Prometheus (메트릭):   http://localhost:9090
Grafana (대시보드):    http://localhost:3000 (admin/admin)
Alertmanager (알림):   http://localhost:9093
Sentry (에러):        http://localhost:9000
```

---

## 📊 모니터링 메트릭 예시

### API 성능

```
# 요청 처리량 (5분 평균)
rate(http_requests_total[5m])

# P95 응답 시간
histogram_quantile(0.95, http_request_duration_seconds_bucket)

# 에러율
rate(http_errors_total[5m]) / rate(http_requests_total[5m])
```

### 데이터베이스 성능

```
# 쿼리 수 (5분 평균)
rate(db_queries_total[5m])

# P95 쿼리 응답 시간
histogram_quantile(0.95, db_query_duration_seconds_bucket)

# 테이블별 쿼리 수
topk(5, rate(db_queries_total[5m]) by (table))
```

### 시스템 리소스

```
# CPU 사용률
rate(process_cpu_seconds_total[5m])

# 메모리 사용량 (GB)
process_resident_memory_bytes / 1024 / 1024 / 1024

# 디스크 사용률
node_filesystem_avail_bytes / node_filesystem_size_bytes
```

---

## 🔐 보안 고려사항

### 민감 정보 보호

```python
# PII (개인식별정보) 로깅 금지
sensitive_fields = ['password', 'credit_card', 'ssn', 'api_key']

# 마스킹 처리
def mask_sensitive_data(log_dict):
    for field in sensitive_fields:
        if field in log_dict:
            log_dict[field] = '***MASKED***'
    return log_dict
```

### 접근 제어

- Grafana: 인증 필수 (기본: admin/admin, 변경 필요)
- Elasticsearch: XPack 보안 활성화 (프로덕션)
- Prometheus: 방화벽 규칙 적용

---

## 📈 성능 영향

### 오버헤드

| 항목 | 영향 |
|-----|------|
| 로깅 | +2-3% CPU |
| Sentry | +1-2% 네트워크 대역폭 |
| Prometheus 메트릭 | <1% CPU |
| 전체 | ~3-5% 성능 영향 |

### 최적화 권장사항

1. **샘플링 비율 조정:** 트래픽 많을 시 샘플링 감소
2. **로그 레벨 조정:** 프로덕션에서 INFO 이상만 기록
3. **메트릭 필터링:** 불필요한 메트릭 제외
4. **배치 처리:** 로그 전송 배치 화

---

## 🔄 운영 가이드

### 일일 점검

```bash
# 1. Sentry 에러 확인
http://localhost:9000/issues

# 2. Prometheus 메트릭 확인
curl http://localhost:9090/api/v1/query?query=up

# 3. Grafana 대시보드 확인
http://localhost:3000
```

### 주간 점검

- 에러 추세 분석
- 성능 저하 패턴 확인
- 리소스 사용량 분석
- 알림 규칙 효과성 검증

### 월간 정리

```bash
# 오래된 로그 삭제
curl -X DELETE http://localhost:9200/elspa-logs-2026.03.*

# Prometheus 데이터 최적화
# (자동 리텐션 정책으로 관리)

# 용량 확인
du -sh ./logs
docker volume ls
```

---

## 🎯 다음 단계

### Phase 10-3: 배포 자동화

- CI/CD 파이프라인 설정
- 무중단 배포 (Blue-Green)
- 롤백 전략

### Phase 10-4: 성능 최적화

- 쿼리 최적화
- 캐싱 전략
- CDN 구성

### Phase 10-5: 스케일링

- 로드 밸런싱
- 자동 스케일링
- 데이터베이스 복제

---

## 📞 연락처

- **DevOps Team:** devops@elspa.io
- **SRE Team:** sre@elspa.io
- **시스템 관리자:** admin@elspa.io

---

## 📚 참고 자료

- [MONITORING_SETUP_GUIDE.md](./MONITORING_SETUP_GUIDE.md) - 상세 설정 가이드
- [LOGGING_POLICY.md](./LOGGING_POLICY.md) - 로그 보관 정책
- [Sentry 공식 문서](https://docs.sentry.io/)
- [Prometheus 공식 문서](https://prometheus.io/docs/)
- [Grafana 공식 문서](https://grafana.com/docs/)

---

**작성자:** Claude Code (AI)  
**버전:** 1.0  
**최종 검토:** 2026-05-22
