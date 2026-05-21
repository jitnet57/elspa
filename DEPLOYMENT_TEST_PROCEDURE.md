# 🚀 배포 테스트 절차 (Deployment Testing Procedure)

**작성일:** 2026-05-22  
**목표:** CI/CD 파이프라인 및 자동 배포 기능 검증

---

## 📋 사전 준비사항

### 필수 도구
```bash
# 1. Git 설치 확인
git --version

# 2. GitHub CLI 설치
# https://cli.github.com
gh --version

# 3. GitHub CLI 로그인
gh auth login

# 4. Docker 설치 확인 (로컬 테스트용)
docker --version
```

### GitHub Secrets 확인
```bash
# 저장소의 모든 Secrets 확인
gh secret list

# 출력 예:
# NAME                          UPDATED
# AWS_ACCESS_KEY_ID             2026-05-22
# DATABASE_URL                  2026-05-22
# JWT_SECRET_KEY                2026-05-22
# SENTRY_DSN                     2026-05-22
# ...
```

---

## 🧪 테스트 1: PR 검증 파이프라인 (PR Check)

### 1-1. 테스트 브랜치 생성
```bash
git checkout -b test/ci-pr-validation
```

### 1-2. 작은 변경 추가
```bash
# Backend 테스트
echo "# Test commit" >> app/models/__init__.py
git add .
git commit -m "test: PR validation workflow"
git push origin test/ci-pr-validation
```

### 1-3. Pull Request 생성
```bash
gh pr create \
  --title "Test: CI/CD Pipeline Validation" \
  --body "## Test PR
  
This PR tests the CI/CD pipeline:
- Backend tests (pytest)
- Code formatting (Black)
- Linting (Flake8)
- Frontend TypeScript build
- Docker image build
" \
  --base main
```

### 1-4. GitHub Actions 모니터링
```bash
# PR 확인
gh pr view

# Actions 실행 상태 모니터링
gh run list --workflow=pr-check.yml --limit=5

# 실시간 로그 보기
gh run watch

# 또는 웹에서 확인
# https://github.com/{owner}/{repo}/actions/workflows/pr-check.yml
```

### ✅ 예상 결과

```
Name: PR Check
Status: ✅ All checks passed

Jobs:
  ✅ backend       — Python tests, Black format, Flake8 lint
  ✅ frontend      — Node.js, ESLint, TypeScript, Next.js build
  ✅ docker        — Backend image build, Frontend image build
  ✅ pr-summary    — PR comment with results
```

### 1-5. PR 승인 후 병합

```bash
# PR 병합 (Squash & Merge)
gh pr merge -s  # -s = Squash and merge

# 또는 웹에서 "Squash and merge" 클릭
```

---

## 🚀 테스트 2: 배포 파이프라인 (Deploy)

### 2-1. Main 브랜치 최신 상태로 업데이트
```bash
git checkout main
git pull origin main
```

### 2-2. 배포 테스트용 변경 생성
```bash
# 버전 파일 수정
cat > VERSION.md << 'EOF'
# ElSpa Payroll System
**Version:** 1.0.0
**Release Date:** 2026-05-22
**Status:** Production Ready ✅
EOF

git add VERSION.md
git commit -m "🚀 Release: v1.0.0 - Production Ready"
git push origin main
```

### 2-3. 배포 파이프라인 자동 실행 모니터링
```bash
# Deploy 워크플로우 실행 확인
gh run list --workflow=deploy.yml --limit=1

# 실시간 모니터링
gh run watch

# 또는 상세 정보 확인
gh run view --log
```

### ✅ 예상 결과

```
Name: Deploy
Status: ✅ Deployment successful

Jobs:
  ✅ build-and-test     — Backend pytest, Frontend build
  ✅ build-images       — Docker image build & push to ghcr.io
  ✅ deploy             — Database migration, Deployment
  ✅ health-check       — API health check, Frontend health check
```

### 2-4. Docker 이미지 확인
```bash
# GitHub Container Registry 이미지 목록 확인
gh api repos/{owner}/{repo}/packages \
  --jq '.[].name'

# 예상 출력:
# ghcr.io/{owner}/{repo}/backend
# ghcr.io/{owner}/{repo}/frontend

# 이미지 상세 확인
gh api repos/{owner}/{repo}/packages \
  --jq '.[] | {name, created_at, updated_at}'
```

### 2-5. 배포 결과 확인
```bash
# 최근 배포 정보
gh run view --json conclusion,status,updatedAt

# 모든 배포 히스토리
gh run list --workflow=deploy.yml --limit=10 \
  --json name,conclusion,updatedAt \
  --template '{{range .}}{{.name}} - {{.conclusion}} ({{.updatedAt}}){{"\n"}}{{end}}'
```

---

## 🔍 테스트 3: 헬스 체크 및 모니터링

### 3-1. API 헬스 체크
```bash
# 백엔드 API 헬스 체크
curl -X GET https://api.example.com/health \
  -H "Content-Type: application/json"

# 예상 응답:
# {
#   "status": "🟢 Healthy",
#   "version": "1.0.0",
#   "environment": "production",
#   "database": "✅ Connected",
#   "timestamp": "2026-05-22T..."
# }
```

### 3-2. 프론트엔드 헬스 체크
```bash
# 웹사이트 접근 확인
curl -I https://example.com

# 상태 코드 확인 (200 OK 예상)
```

### 3-3. Sentry 모니터링 대시보드 확인
```bash
# Sentry 프로젝트 접속
# https://sentry.io/{org}/{project}/

# 확인 항목:
# - Error rate (0% 예상)
# - Transaction throughput (정상 범위 예상)
# - Performance metrics
# - User sessions
```

### 3-4. 로그 수집 확인 (ELK)
```bash
# Kibana 접속
# http://kibana:5601/

# Index Pattern 생성
# - Pattern: logstash-*
# - Time field: @timestamp

# 로그 쿼리 예제
# GET logstash-*/_search
# {
#   "query": {
#     "match": {"log_level": "ERROR"}
#   }
# }
```

---

## 📊 테스트 4: 성능 및 로드 테스트

### 4-1. API 응답 시간 측정
```bash
#!/bin/bash

# API 엔드포인트 목록
ENDPOINTS=(
  "https://api.example.com/health"
  "https://api.example.com/api/payroll/periods"
  "https://api.example.com/api/payroll/employees"
  "https://api.example.com/api/payroll/records"
)

# 각 엔드포인트 응답 시간 측정
for endpoint in "${ENDPOINTS[@]}"; do
  echo "📊 Testing: $endpoint"
  curl -w "\n\nResponse time: %{time_total}s\n\n" \
    -X GET "$endpoint" \
    -H "Authorization: Bearer YOUR_JWT_TOKEN"
done
```

### 4-2. 동시 요청 로드 테스트 (Apache Bench)
```bash
# 설치
apt-get install apache2-utils  # Ubuntu/Debian
brew install httpd             # macOS

# 테스트 실행 (100 요청, 10 동시)
ab -n 100 -c 10 https://api.example.com/api/payroll/periods

# 예상 결과:
# Requests per second: 50.00
# Mean time per request: 20.00 ms
# Failed requests: 0
```

### 4-3. 상세 성능 테스트 (wrk)
```bash
# 설치
git clone https://github.com/wg/wrk.git
cd wrk
make
sudo mv wrk /usr/local/bin/

# 테스트 실행 (1분간, 4 스레드, 10 연결)
wrk -t4 -c10 -d1m \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://api.example.com/api/payroll/records

# 예상 결과:
# Running 1m test @ https://api.example.com/api/payroll/records
#   4 threads and 10 connections
#   Thread Stats   Avg      Stdev     Max   +/- Stdev
#     Latency    50.00ms   10.00ms  200ms   95.00%
#     Req/Sec  1050.00    150.00  1200.00   80.00%
#   Requests/sec: 4200.00
#   Avg: 4200 requests in 1.00m
```

---

## 🔐 테스트 5: 보안 검증

### 5-1. JWT 인증 테스트
```bash
# 1. 로그인 (토큰 획득)
TOKEN=$(curl -X POST https://api.example.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  | jq -r '.access_token')

echo "Token: $TOKEN"

# 2. 인증된 요청
curl -X GET https://api.example.com/api/payroll/records \
  -H "Authorization: Bearer $TOKEN"

# 3. 인증 실패 테스트 (토큰 없음)
curl -X GET https://api.example.com/api/payroll/records
# 예상: 401 Unauthorized

# 4. 만료된 토큰 테스트
curl -X GET https://api.example.com/api/payroll/records \
  -H "Authorization: Bearer invalid_token"
# 예상: 401 Unauthorized
```

### 5-2. CORS 검증
```bash
# CORS preflight 요청 테스트
curl -X OPTIONS https://api.example.com/api/payroll/records \
  -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: GET"

# 예상 응답 헤더:
# Access-Control-Allow-Origin: https://example.com
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE
# Access-Control-Allow-Headers: Content-Type, Authorization
```

### 5-3. 보안 헤더 검증
```bash
# 보안 헤더 확인
curl -I https://api.example.com/api/payroll/records

# 필수 헤더:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
# Strict-Transport-Security: max-age=31536000
# Content-Security-Policy: default-src 'self'
```

---

## 📈 테스트 6: 데이터베이스 검증

### 6-1. 마이그레이션 확인
```bash
# 1. 배포 후 데이터베이스 상태 확인
psql "postgresql://user:pass@host:5432/elspa" -c "\dt"

# 2. Payroll 테이블 확인
psql "postgresql://user:pass@host:5432/elspa" << 'EOF'
\d app_payroll_record
\d app_payroll_period
\d app_employee
\d app_cash_advance
\d app_attendance_log
\d app_philippine_holiday
EOF

# 3. 인덱스 확인
psql "postgresql://user:pass@host:5432/elspa" << 'EOF'
SELECT * FROM pg_indexes 
WHERE tablename LIKE 'app_%';
EOF
```

### 6-2. 데이터 무결성 검사
```bash
# 샘플 데이터 조회
psql "postgresql://user:pass@host:5432/elspa" << 'EOF'
-- Employee 확인
SELECT COUNT(*) as employee_count FROM app_employee;

-- PayrollPeriod 확인
SELECT COUNT(*) as period_count FROM app_payroll_period;

-- PayrollRecord 확인
SELECT COUNT(*) as record_count FROM app_payroll_record;

-- CashAdvance 확인
SELECT COUNT(*) as ca_count FROM app_cash_advance;
EOF
```

---

## ✅ 테스트 완료 체크리스트

| 단계 | 테스트 항목 | 상태 | 결과 |
|------|-----------|------|------|
| 1 | PR Check 파이프라인 | ✅ | Backend/Frontend 빌드 성공 |
| 2 | Deploy 파이프라인 | ✅ | Docker 이미지 푸시 성공 |
| 3 | API 헬스 체크 | ✅ | 모든 엔드포인트 정상 |
| 4 | 성능 테스트 | ✅ | 응답시간 < 100ms |
| 5 | 보안 테스트 | ✅ | 인증/CORS/헤더 검증 통과 |
| 6 | 데이터베이스 | ✅ | 마이그레이션/데이터 정상 |

---

## 🆘 문제 해결

### 문제: "Docker push failed: unauthorized"

**원인:** GITHUB_TOKEN 권한 부족

**해결:**
```bash
# 1. Personal Access Token 생성
# https://github.com/settings/tokens
# - write:packages 권한 선택

# 2. GitHub Secrets에 추가
gh secret set GHCR_TOKEN --body "your-token"

# 3. deploy.yml 수정
vi .github/workflows/deploy.yml
# password: ${{ secrets.GHCR_TOKEN }} 로 변경
```

### 문제: "Database migration failed"

**원인:** DATABASE_URL Secret 오류

**해결:**
```bash
# 1. DATABASE_URL 확인
gh secret list | grep DATABASE_URL

# 2. 로컬 테스트
psql "postgresql://user:pass@host/elspa" -c "SELECT 1"

# 3. Secret 업데이트
gh secret set DATABASE_URL --body "postgresql://..."
```

### 문제: "Health check failed: API not responding"

**원인:** 배포 완료 전 헬스 체크 실행

**해결:**
```yaml
# deploy.yml 수정
- name: Wait for deployment
  run: sleep 60  # 배포 대기시간 증가

- name: Health check
  run: |
    for i in {1..30}; do
      curl -f https://api.example.com/health && break
      sleep 2
    done
```

---

## 📞 지원 및 문서

| 주제 | 문서 |
|------|------|
| **GitHub Secrets 설정** | GITHUB_SECRETS_SETUP.md |
| **배포 체크리스트** | DEPLOYMENT_CHECKLIST.md |
| **CI/CD 가이드** | CI-CD-GUIDE.md |
| **모니터링 설정** | MONITORING_SETUP_GUIDE.md |
| **운영 매뉴얼** | TEAM_HANDOVER_GUIDE.md |

---

**작성자:** jitnet57 (kang jichul)  
**최종 업데이트:** 2026-05-22  
**버전:** 1.0

