# 📝 로그 보관 정책 (Logging Retention Policy)

**작성일:** 2026-05-22  
**버전:** 1.0  
**담당자:** DevOps Team

---

## 📋 개요

ElSpa의 로그 보관 정책을 정의합니다. 규정 준수, 비용 최적화, 성능 고려를 균형있게 유지합니다.

---

## 🗂️ 로그 분류 및 보관 기간

### 1. 에러 로그 (Error Logs)

**정의:** 애플리케이션 오류, 예외, 경고

**보관 기간:** 90일

**저장소:** 
- Hot: Elasticsearch (최근 7일)
- Warm: Elasticsearch (8-30일)
- Cold: S3/GCS (31-90일)

**삭제 정책:**
```yaml
# Elasticsearch ILM 정책
DELETE phase: 90일 이후 자동 삭제
```

**접근 권한:**
- 읽기: DevOps, Backend Team
- 쓰기: 애플리케이션만
- 삭제: DevOps Team (관리자)

---

### 2. 감사 로그 (Audit Logs)

**정의:** 사용자 행동, 시스템 변경, 정산 기록

**보관 기간:** 1년 (365일)

**저장소:**
- Hot: PostgreSQL (최근 30일)
- Archive: S3/GCS (31-365일)
- Backup: 월별 아카이브 (7년)

**법적 근거:**
- 전자상거래법: 결제 기록 5년
- 개인정보보호법: 거래 기록 1년 이상
- 세법: 거래 기록 5년

**접근 권한:**
- 읽기: 관련 부서 (회계, 관리자)
- 쓰기: 시스템만
- 삭제: 불가 (보관만)

**쿼리 예시:**

```sql
-- 특정 사용자의 감사 로그 조회
SELECT * FROM audit_logs 
WHERE user_id = ? 
  AND created_at >= NOW() - INTERVAL 1 YEAR
ORDER BY created_at DESC;

-- 정산 관련 감사 로그
SELECT * FROM audit_logs 
WHERE action_type = 'settlement'
  AND created_at >= NOW() - INTERVAL 1 YEAR;
```

---

### 3. 접근 로그 (Access Logs)

**정의:** HTTP 요청, API 호출, 로그인 기록

**보관 기간:** 30일

**저장소:**
- Elasticsearch (최근 30일만 유지)
- Filebeat로 자동 수집

**자동 삭제:**
```yaml
# Filebeat 설정
output.elasticsearch:
  index: "elspa-access-logs-%{+yyyy.MM.dd}"
  # 30일 후 자동 삭제
```

**접근 권한:**
- 읽기: 개발자, DevOps
- 쓰기: 애플리케이션만

---

### 4. 성능 로그 (Performance Logs)

**정의:** API 응답시간, DB 쿼리, 캐시 히트율

**보관 기간:** 60일

**저장소:**
- Prometheus TSDB (최근 60일)
- 요약 데이터: PostgreSQL (1년)

**샘플링:**
```python
# Sentry 샘플링 설정
sentry_sdk.init(
    traces_sample_rate=0.1,  # 10% 샘플링
    profiles_sample_rate=0.1,  # 10% 프로파일링
)
```

**접근 권한:**
- 읽기: 전체 팀
- 삭제: DevOps Team

---

### 5. 디버그 로그 (Debug Logs)

**정의:** 상세한 함수 실행, 변수 값, 데이터 흐름

**보관 기간:** 7일

**저장소:**
- 메모리 버퍼 (실시간)
- 파일 시스템 (최근 1시간)
- 아카이브 안 함 (비용 최적화)

**로그 레벨 설정:**
```python
# 프로덕션
logging.basicConfig(level=logging.INFO)

# 스테이징
logging.basicConfig(level=logging.DEBUG)

# 개발
logging.basicConfig(level=logging.DEBUG)
```

---

## 📊 저장소별 용량 계획

### Elasticsearch

**용량 예상:**
- 일일 로그량: 약 5GB
- 보관 기간: 30일
- 필요 용량: 150GB + 25% 여유 = 200GB

**라이프사이클 정책:**
```yaml
hot:      # 0-7일: 최적화된 검색
  rollover: max_size: 50GB, max_age: 7d
warm:     # 8-30일: 읽기 전용
  set_replicas: 1
cold:     # 31+일: 삭제 또는 아카이브
  delete: min_age: 30d
```

### PostgreSQL (감사 로그)

**용량 예상:**
- 일일 레코드: 약 50,000건
- 연간: 약 1,800만 건
- 필요 용량: 50GB

**인덱스:**
```sql
CREATE INDEX idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_action_type ON audit_logs(action_type);
```

### Prometheus

**용량 예상:**
- 메트릭 수: 약 1,000개
- 스크래이프 간격: 15초
- 보관 기간: 60일
- 필요 용량: 100GB

**설정:**
```yaml
storage:
  tsdb:
    retention:
      time: 60d
      size: 100GB
```

---

## 🔄 자동 정리 정책

### 월별 정리 (매월 1일 00:00)

```bash
#!/bin/bash
# cleanup-logs.sh

# 1. Elasticsearch 오래된 인덱스 삭제
curl -X DELETE "http://localhost:9200/elspa-logs-2026.01.*"

# 2. PostgreSQL 감사 로그 아카이브 (선택)
# psql -U postgres -d elspa -c "
#   COPY audit_logs WHERE created_at < NOW() - INTERVAL 1 YEAR
#   TO '/backups/audit-logs-2025.sql'
# "

# 3. Prometheus 데이터 압축
# promtool query instant http://localhost:9090 'up' 2026-05-22

# 4. S3 백업
# aws s3 sync /var/lib/elasticsearch s3://elspa-backups/elasticsearch/
```

**Cron 설정:**
```
0 0 1 * * /opt/elspa/scripts/cleanup-logs.sh
```

---

## 🔐 보안 및 접근 제어

### 로그 암호화

**전송 중 암호화:**
```yaml
# TLS/SSL 설정
output.elasticsearch:
  hosts: ["https://elasticsearch:9200"]
  ssl.enabled: true
  ssl.certificate_authorities: ["/etc/ssl/certs/ca.pem"]
```

**저장 시 암호화:**
```yaml
# Elasticsearch 암호화
xpack.security.enabled: true
xpack.security.transport.ssl.enabled: true
xpack.security.http.ssl.enabled: true
```

### 민감 정보 마스킹

**PII 제외:**
```python
# 로그에서 민감 정보 제거
def mask_sensitive_data(log_dict):
    sensitive_fields = ['password', 'credit_card', 'ssn', 'api_key']
    for field in sensitive_fields:
        if field in log_dict:
            log_dict[field] = '***MASKED***'
    return log_dict
```

**감사 로그 암호화:**
```sql
-- 민감한 필드 암호화
UPDATE audit_logs 
SET data = pgp_sym_encrypt(data, 'secret_key')
WHERE action_type = 'payment';
```

---

## 📈 모니터링 및 최적화

### 로그 볼륨 모니터링

```python
# 일일 로그 볼륨 추적
daily_log_volume = {
    "2026-05-22": 4.8,  # GB
    "2026-05-21": 5.2,  # GB
    "2026-05-20": 4.5,  # GB
}
```

**경고 조건:**
- 일일 로그 > 10GB: 토론 필요
- 저장소 사용률 > 80%: 정리 실행
- 쿼리 응답 > 5초: 인덱싱 최적화

### 비용 최적화

**전략:**
1. 샘플링 비율 조정 (메모리 vs 정확도)
2. 오래된 데이터 압축 (gzip)
3. 저비용 스토리지 전환 (S3 Glacier)
4. 불필요한 로그 필터링

**예상 월간 비용 (AWS):**
- Elasticsearch: $50/월
- S3: $10/월 (장기 보관)
- RDS PostgreSQL: $100/월
- **합계:** $160/월

---

## 🔍 컴플라이언스

### 규제 요구사항

| 규제 | 로그 종류 | 보관 기간 | 요구사항 |
|-----|---------|---------|---------|
| GDPR | 사용자 데이터 | 제한적 | 암호화 필수 |
| CCPA | 개인정보 | 1년 | 삭제 요청 지원 |
| 전자상거래법 | 거래 기록 | 5년 | 감사 추적 |
| 개인정보보호법 | 접근 로그 | 3년 | 접근 제어 |

### 감사 및 보고

**월간 감사:**
```sql
-- 감사 로그 통계
SELECT 
  DATE(created_at) as date,
  action_type,
  COUNT(*) as count
FROM audit_logs
WHERE created_at >= NOW() - INTERVAL 30 DAYS
GROUP BY date, action_type;
```

**연간 보고:**
- 로그 보관 정책 준수 확인
- 데이터 접근 로그 검토
- 보안 사건 분석
- 비용 최적화 방안

---

## 📋 체크리스트

### 구현 전

- [ ] 로그 분류 체계 확인
- [ ] 저장소 용량 계획 수립
- [ ] 암호화 키 관리 정책 수립
- [ ] 접근 제어 정책 수립

### 배포 시

- [ ] 로그 레벨 설정 확인
- [ ] ILM 정책 적용
- [ ] 백업 자동화 설정
- [ ] 모니터링 대시보드 생성

### 운영 중

- [ ] 일일 로그 볼륨 모니터링
- [ ] 월별 정리 실행
- [ ] 분기별 정책 검토
- [ ] 연간 컴플라이언스 확인

---

## 📞 문의

- **DevOps Team:** devops@elspa.io
- **정보보안팀:** security@elspa.io
- **법무팀:** legal@elspa.io

---

**최종 업데이트:** 2026-05-22  
**다음 검토:** 2026-08-22
