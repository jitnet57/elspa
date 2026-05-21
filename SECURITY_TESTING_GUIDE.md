# Security Testing Guide (Phase 9-3, Wave 4-3)

**프로젝트:** ElSpa Manager  
**단계:** Phase 9-3 보안 테스트  
**Wave:** 4-3 (QA)  
**작성일:** 2026-05-22

---

## 📚 목차

1. [테스트 환경 설정](#1-테스트-환경-설정)
2. [각 보안 영역 테스트 실행](#2-각-보안-영역-테스트-실행)
3. [취약점 식별 및 보고](#3-취약점-식별-및-보고)
4. [자동화 테스트 파이프라인](#4-자동화-테스트-파이프라인)
5. [수동 테스트 체크리스트](#5-수동-테스트-체크리스트)

---

## 1. 테스트 환경 설정

### 1-1. 의존성 설치

```bash
# 기본 의존성
pip install -r requirements.txt

# 보안 테스트 의존성
pip install -r requirements-security.txt
```

### 1-2. 테스트 환경 변수

```bash
# .env.test 생성
cat > .env.test << 'EOF'
API_ENVIRONMENT=test
JWT_SECRET_KEY=test-secret-key-32-characters-minimum
DATABASE_URL=sqlite:///./test.db
CORS_ORIGINS=["http://localhost:3000"]
DEBUG=false
EOF
```

### 1-3. 테스트 데이터베이스 초기화

```bash
# 테스트 DB 생성 (SQLite)
python -c "from app.database import init_db; asyncio.run(init_db())"

# 테스트 사용자 생성
python scripts/create_test_users.py
```

---

## 2. 각 보안 영역 테스트 실행

### 2-1. SQL Injection 테스트

#### 명령어
```bash
# SQL Injection 테스트만 실행
pytest tests/security/test_sql_injection.py -v

# 상세 보고서
pytest tests/security/test_sql_injection.py -v --tb=short

# 커버리지 포함
pytest tests/security/test_sql_injection.py --cov=app --cov-report=html
```

#### 테스트 케이스
```python
# 1. ORM 쿼리 매개변수화 검증
pytest tests/security/test_sql_injection.py::TestSQLInjectionProtection::test_orm_query_with_user_input -v

# 2. ilike() 안전성 검증
pytest tests/security/test_sql_injection.py::TestSQLInjectionProtection::test_search_parameter_with_ilike -v

# 3. 페이로드 거부 검증
pytest tests/security/test_sql_injection.py::TestSQLInjectionProtection::test_booking_api_with_sql_injection_payload -v
```

#### 예상 결과
```
✅ test_orm_query_with_user_input PASSED
✅ test_search_parameter_with_ilike PASSED
✅ test_booking_api_with_sql_injection_payload PASSED
✅ test_no_string_formatting_in_queries PASSED
✅ test_order_by_clause_injection PASSED
✅ test_limit_offset_injection PASSED

15/15 테스트 통과 ✅
```

---

### 2-2. XSS (Cross-Site Scripting) 테스트

#### 명령어
```bash
# XSS 테스트만 실행
pytest tests/security/test_xss.py -v

# 특정 클래스만 테스트
pytest tests/security/test_xss.py::TestReactAutoEscape -v

# 특정 테스트만 실행
pytest tests/security/test_xss.py::TestPydanticValidation::test_email_field_validation -v
```

#### 테스트 케이스
```python
# 1. React 자동 escape
pytest tests/security/test_xss.py::TestReactAutoEscape::test_react_escapes_content_automatically -v

# 2. Pydantic 이메일 검증
pytest tests/security/test_xss.py::TestPydanticValidation::test_email_field_validation -v

# 3. 전화번호 필드 검증
pytest tests/security/test_xss.py::TestPydanticValidation::test_phone_number_validation -v

# 4. HTML Escaping
pytest tests/security/test_xss.py::TestHTMLEscaping::test_html_escape_special_characters -v
```

#### 예상 결과
```
✅ test_react_escapes_content_automatically PASSED
✅ test_email_field_validation PASSED
✅ test_phone_number_validation PASSED
✅ test_text_field_validation PASSED
✅ test_url_field_validation PASSED
✅ test_html_escape_special_characters PASSED

20개 이상 테스트 통과 ✅
```

---

### 2-3. Authentication & Authorization 테스트

#### 명령어
```bash
# 인증 테스트만 실행
pytest tests/security/test_auth_security.py -v

# 특정 권한 테스트
pytest tests/security/test_auth_security.py::TestAdminOnlyAccess -v

# Token 검증 테스트
pytest tests/security/test_auth_security.py::TestTokenValidation -v
```

#### 테스트 케이스
```python
# 1. 토큰 없이 접근
pytest tests/security/test_auth_security.py::TestAuthenticationRequired::test_unauthorized_access_returns_401 -v

# 2. Admin 권한 검증
pytest tests/security/test_auth_security.py::TestAdminOnlyAccess::test_non_admin_cannot_delete -v

# 3. 토큰 만료 검증
pytest tests/security/test_auth_security.py::TestAuthenticationRequired::test_expired_token_returns_401 -v

# 4. Role-based 접근 제어
pytest tests/security/test_auth_security.py::TestAdminOnlyAccess::test_role_based_access_control -v
```

#### 예상 결과
```
✅ test_unauthorized_access_returns_401 PASSED
✅ test_invalid_token_returns_401 PASSED
✅ test_expired_token_returns_401 PASSED
✅ test_non_admin_cannot_delete PASSED
✅ test_admin_can_delete PASSED
✅ test_role_based_access_control PASSED

15개 이상 테스트 통과 ✅
```

---

### 2-4. Security Headers 테스트

#### 명령어
```bash
# 보안 헤더 테스트만 실행
pytest tests/security/test_security_headers.py -v

# 특정 헤더 테스트
pytest tests/security/test_security_headers.py::TestSecurityHeaders::test_x_frame_options_header -v
```

#### 테스트 케이스
```python
# 1. X-Frame-Options (Clickjacking 방어)
pytest tests/security/test_security_headers.py::TestSecurityHeaders::test_x_frame_options_header -v

# 2. CSP (XSS 방어)
pytest tests/security/test_security_headers.py::TestSecurityHeaders::test_content_security_policy_header -v

# 3. HSTS (HTTPS 강제)
pytest tests/security/test_security_headers.py::TestSecurityHeaders::test_strict_transport_security_header -v

# 4. Cache Control (민감 정보 캐시 금지)
pytest tests/security/test_security_headers.py::TestSecurityHeaders::test_cache_control_for_admin_endpoints -v
```

#### 예상 결과
```
✅ test_x_content_type_options_header PASSED
✅ test_x_frame_options_header PASSED
✅ test_content_security_policy_header PASSED
✅ test_strict_transport_security_header PASSED
✅ test_referrer_policy_header PASSED
✅ test_cache_control_for_admin_endpoints PASSED

10개 이상 테스트 통과 ✅
```

---

## 3. 취약점 식별 및 보고

### 3-1. 정적 분석 (SAST)

#### Bandit (Python 보안 검사)
```bash
# 전체 코드 검사
bandit -r app/ -f json -o bandit-report.json

# 또는 상세 결과 보기
bandit -r app/ -ll  # LOW 이상 보고
```

#### Semgrep (정규식 기반 분석)
```bash
# 보안 규칙 검사
semgrep --config=p/security-audit app/

# 결과 저장
semgrep --config=p/security-audit app/ -o semgrep-report.json
```

### 3-2. 동적 분석 (DAST)

#### 의존성 취약점 검사
```bash
# safety로 취약한 패키지 검사
safety check --json > safety-report.json

# 프로덕션 패키지만 검사
safety check --requirements requirements.txt
```

#### 결과 분석
```bash
# JSON 결과 보기
cat safety-report.json | jq '.vulnerabilities[]'

# 취약한 패키지 목록
safety check --json | jq '.[] | select(.vulnerability)' | jq '.package_name'
```

### 3-3. 통합 보고서 생성

```bash
# 모든 보안 테스트 실행 및 보고서 생성
python scripts/run_security_tests.py --report
```

**생성되는 파일:**
- `security-test-report.json` - 테스트 결과
- `security-vulnerabilities.json` - 발견된 취약점
- `security-recommendations.md` - 권장사항

---

## 4. 자동화 테스트 파이프라인

### 4-1. GitHub Actions (CI/CD)

```yaml
# .github/workflows/security.yml
name: Security Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install -r requirements-security.txt
      
      - name: Run SQL Injection Tests
        run: pytest tests/security/test_sql_injection.py -v
      
      - name: Run XSS Tests
        run: pytest tests/security/test_xss.py -v
      
      - name: Run Authentication Tests
        run: pytest tests/security/test_auth_security.py -v
      
      - name: Run Security Headers Tests
        run: pytest tests/security/test_security_headers.py -v
      
      - name: Bandit Security Check
        run: bandit -r app/ -f json -o bandit-report.json
      
      - name: Safety Check
        run: safety check --json > safety-report.json
      
      - name: Upload reports
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: security-reports
          path: |
            bandit-report.json
            safety-report.json
```

### 4-2. 로컬 사전 커밋 훅

```bash
# .git/hooks/pre-commit 설정
#!/bin/bash

echo "🔒 Running security tests..."

# 보안 테스트 실행
pytest tests/security/ -q

if [ $? -ne 0 ]; then
  echo "❌ Security tests failed!"
  exit 1
fi

echo "✅ Security tests passed!"
exit 0
```

---

## 5. 수동 테스트 체크리스트

### 5-1. SQL Injection 수동 테스트

#### 테스트 엔드포인트
- `GET /api/bookings?customer_id=1' OR '1'='1`
- `GET /api/therapists?q=test'; DROP TABLE therapists; --`
- `POST /api/bookings` (payload에 SQL 코드 포함)

#### 검증 내용
- [ ] 요청이 400 또는 500으로 응답하는가?
- [ ] 데이터베이스 에러 메시지가 노출되지 않는가?
- [ ] 테이블이 삭제되지 않았는가?

#### cURL 예제
```bash
# 안전한 쿼리 (정상 응답)
curl -X GET "http://localhost:8000/api/bookings?customer_id=1" \
  -H "Authorization: Bearer $TOKEN"

# SQL Injection 시도 (거부되어야 함)
curl -X GET "http://localhost:8000/api/bookings?customer_id=1' OR '1'='1" \
  -H "Authorization: Bearer $TOKEN"
```

---

### 5-2. XSS 수동 테스트

#### 테스트 엔드포인트
- `POST /api/users` (name: `<script>alert('XSS')</script>`)
- `PUT /api/profile` (bio: `<img src=x onerror="alert('XSS')">`)
- 응답 HTML에서 스크립트 실행 여부 확인

#### 브라우저 콘솔 테스트
```javascript
// 개발자 도구 > Console에서 실행
// 1. 사용자 입력 데이터 렌더링 확인
console.log(document.body.innerHTML);

// 2. XSS 페이로드 감지
if (document.body.innerHTML.includes('<script>')) {
  console.error('❌ XSS Vulnerability found!');
} else {
  console.log('✅ No XSS detected');
}
```

---

### 5-3. CSRF 수동 테스트

#### 테스트 시나리오
1. 어플리케이션에 로그인
2. 다른 탭에서 악의적인 사이트 방문
3. 악의적 사이트가 `/api/bookings` DELETE 요청 시도

#### 검증
- [ ] DELETE 요청이 거부되는가? (403 Forbidden)
- [ ] 토큰이 없으면 거부되는가? (401 Unauthorized)

#### cURL 테스트
```bash
# 토큰 없이 POST 시도
curl -X POST "http://localhost:8000/api/bookings" \
  -H "Content-Type: application/json" \
  -d '{"customer_id": 1, "therapist_id": 1}'
# 예상: 401 Unauthorized

# 잘못된 토큰으로 시도
curl -X POST "http://localhost:8000/api/bookings" \
  -H "Authorization: Bearer invalid-token" \
  -H "Content-Type: application/json" \
  -d '{"customer_id": 1, "therapist_id": 1}'
# 예상: 401 Unauthorized
```

---

### 5-4. Authentication 수동 테스트

#### 시나리오 1: 로그인 필수
```bash
# 1. 토큰 없이 보호된 엔드포인트 접근
curl -X GET "http://localhost:8000/api/admin/payroll/employees"
# 예상: 401 Unauthorized

# 2. 유효한 토큰으로 접근
curl -X GET "http://localhost:8000/api/admin/payroll/employees" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
# 예상: 200 OK
```

#### 시나리오 2: Admin 권한
```bash
# 1. 일반 사용자로 DELETE 시도
curl -X DELETE "http://localhost:8000/api/payroll/employees/1" \
  -H "Authorization: Bearer $USER_TOKEN"
# 예상: 403 Forbidden (Admin only)

# 2. Admin으로 DELETE
curl -X DELETE "http://localhost:8000/api/payroll/employees/1" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
# 예상: 200 OK
```

---

### 5-5. Security Headers 수동 테스트

#### 브라우저 개발자 도구
```javascript
// Network 탭에서 응답 헤더 확인
// 다음 헤더가 존재하는지 확인:
// ✅ X-Content-Type-Options: nosniff
// ✅ X-Frame-Options: DENY
// ✅ Strict-Transport-Security
// ✅ Content-Security-Policy
```

#### cURL로 확인
```bash
# 응답 헤더만 표시
curl -I "http://localhost:8000/api/test"

# 예상 결과:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# Strict-Transport-Security: max-age=31536000
# Content-Security-Policy: default-src 'self'
```

---

## 📊 테스트 결과 보고서 작성

### 보고서 템플릿

```markdown
# Security Test Report

**테스트 날짜:** 2026-05-22
**테스트 담당자:** QA Team
**테스트 환경:** Staging

## 요약

| 항목 | 상태 | 상세 |
|------|------|------|
| SQL Injection | ✅ PASS | 15/15 테스트 통과 |
| XSS | ✅ PASS | 20/20 테스트 통과 |
| CSRF | ✅ PASS | 권한 검증 완료 |
| Headers | ✅ PASS | 7/7 헤더 적용 |
| Authentication | ✅ PASS | 토큰 검증 완료 |
| **전체** | ✅ **PASS** | **89/100 점수** |

## 상세 결과

### 1. SQL Injection (✅ PASS)

**테스트 방법:**
- SQLAlchemy ORM 쿼리 검증
- 페이로드 거부 테스트
- 문자열 포맷팅 검사

**발견:**
- ✅ 모든 쿼리가 ORM 사용
- ✅ parameterized queries 확인
- ❌ ORDER BY 동적 정렬 시 화이트리스트 추가 권장

**점수:** 95/100

### 2. XSS (✅ PASS)

**테스트 방법:**
- React 자동 escape 확인
- Pydantic 검증 확인
- HTML 이스케이핑 테스트

**발견:**
- ✅ React 자동 escape 정상 작동
- ✅ dangerouslySetInnerHTML 미사용
- ✅ 이메일/전화번호 필드 검증

**점수:** 92/100

## 권장사항

1. **우선순위 높음:** Rate Limiting 전체 API 확대
2. **우선순위 중간:** Token Blacklist 구현
3. **우선순위 낮음:** WAF 도입 검토

## 승인

- [ ] Security Lead 승인
- [ ] DevOps Lead 승인
- [ ] Product Manager 승인
```

---

## 🚀 다음 단계

1. **모든 테스트 실행**
   ```bash
   pytest tests/security/ -v --tb=short
   ```

2. **커버리지 보고서**
   ```bash
   pytest tests/security/ --cov=app --cov-report=html
   ```

3. **정적 분석**
   ```bash
   bandit -r app/ && safety check
   ```

4. **보고서 작성**
   - SECURITY_AUDIT_REPORT.md 검토
   - 발견된 취약점 정리
   - 개선 계획 수립

5. **배포 전 체크리스트**
   - [ ] 모든 보안 테스트 통과
   - [ ] 정적 분석 완료
   - [ ] 의존성 보안 확인
   - [ ] 환경변수 검증
   - [ ] API 문서 보호

---

**문서 버전:** 1.0  
**마지막 업데이트:** 2026-05-22  
**검토자:** jitnet57
