# 🚀 Cloudflare 배포 - 5단계 빠른 가이드

**목표:** 30분 안에 프로덕션 배포 완료  
**배포 방식:** Cloudflare Pages (Frontend) + Railway (Backend)

---

## 📍 Step 1: Cloudflare 계정 & Pages 설정 (10분)

### 1-1. Cloudflare 가입

```
1. https://dash.cloudflare.com/sign-up 방문
2. 이메일로 계정 생성
3. 무료 플랜 선택
```

### 1-2. Pages 프로젝트 생성

```
1. Cloudflare Dashboard 로그인
2. 좌측 메뉴 → "Pages"
3. "Create a project" 클릭
4. "Connect to Git" 선택
5. GitHub 권한 승인
6. "elspa" 저장소 선택
```

### 1-3. 빌드 설정

```
Build settings:
  Build command:      npm run build
  Build output dir:   .next
  Root directory:     frontend

Environment:
  NEXT_PUBLIC_API_URL: https://api-backend.railway.app
```

### 1-4. 배포 시작

```
"Save and Deploy" 클릭
→ 첫 번째 배포 시작 (3-5분)
→ https://elspa.pages.dev 확인
```

---

## 📍 Step 2: Railway 설정 & PostgreSQL (8분)

### 2-1. Railway 가입

```
1. https://railway.app/register 방문
2. GitHub로 로그인
3. 프로젝트 생성
```

### 2-2. PostgreSQL 데이터베이스 추가

```
1. Railway Dashboard
2. "Create" → "Database" → "PostgreSQL"
3. 자동 생성된 DB 확인
4. "Connect" → "Postgres CLI" 또는 "Connection string" 복사
```

### 2-3. 연결 문자열 확인

```
설정 → Variables → DATABASE_URL 복사

형식: postgresql://user:password@host:port/dbname

예: postgresql://postgres:abc123@containers-us-west.railway.app:5432/railway
```

---

## 📍 Step 3: GitHub Secrets 추가 (5분)

```bash
# 터미널에서 실행

# 1. Cloudflare Secrets
gh secret set CLOUDFLARE_API_TOKEN --body "your-cloudflare-api-token"
gh secret set CLOUDFLARE_ACCOUNT_ID --body "your-account-id"
gh secret set CLOUDFLARE_PROJECT_NAME --body "elspa"

# 2. Railway Secrets
gh secret set RAILWAY_TOKEN --body "your-railway-token"

# 3. Database
gh secret set DATABASE_URL --body "postgresql://user:pass@host/db"

# 4. API 설정
gh secret set API_BASE_URL --body "https://api-backend.railway.app"
gh secret set FRONTEND_URL --body "https://elspa.pages.dev"

# 5. JWT & 모니터링 (기존과 동일)
gh secret set JWT_SECRET_KEY --body "your-secret-key"
gh secret set SENTRY_DSN --body "https://..."
```

### Secrets 확인

```bash
gh secret list

# 출력:
# NAME                           UPDATED
# CLOUDFLARE_ACCOUNT_ID         2026-05-22
# CLOUDFLARE_API_TOKEN          2026-05-22
# CLOUDFLARE_PROJECT_NAME       2026-05-22
# DATABASE_URL                  2026-05-22
# JWT_SECRET_KEY                2026-05-22
# RAILWAY_TOKEN                 2026-05-22
# ...
```

---

## 📍 Step 4: GitHub Actions 자동 배포 (테스트)

### 4-1. Main 브랜치에 Push

```bash
git checkout main
git pull origin main

# 작은 변경 추가 (배포 트리거용)
echo "# Cloudflare Deployment Ready" >> README.md

git add README.md
git commit -m "🚀 Deploy: Cloudflare Pages + Railway"
git push origin main
```

### 4-2. 배포 모니터링

```bash
# GitHub Actions 워크플로우 확인
gh run list --workflow=deploy-cloudflare.yml

# 실시간 로그 보기
gh run watch

# 또는 웹에서 확인
# https://github.com/{owner}/elspa/actions/workflows/deploy-cloudflare.yml
```

### 예상 단계:

```
✅ build-and-test       (5분)
   └─ Frontend 빌드 (Next.js)
   └─ Backend 테스트 (pytest)

✅ deploy-frontend       (3분)
   └─ Cloudflare Pages에 배포

✅ deploy-backend        (5분)
   └─ Railway에 배포
   └─ 환경변수 설정

✅ health-check          (2분)
   └─ Frontend 헬스 체크
   └─ Backend 헬스 체크
   └─ API 연결성 테스트

🎉 배포 완료!
```

---

## 📍 Step 5: 배포 결과 확인 (5분)

### 5-1. Frontend 확인

```bash
# 웹 브라우저에서
https://elspa.pages.dev

# 또는 CLI에서
curl https://elspa.pages.dev
```

### 5-2. Backend API 확인

```bash
# 헬스 체크
curl https://api-backend.railway.app/health

# 응답 예:
# {
#   "status": "🟢 Healthy",
#   "database": "✅ Connected",
#   "version": "1.0.0"
# }
```

### 5-3. API 엔드포인트 테스트

```bash
# JWT 토큰 발급 (테스트)
curl -X POST https://api-backend.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# 급여 기간 조회
curl -X GET https://api-backend.railway.app/api/payroll/periods \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5-4. Cloudflare 대시보드 확인

```
Dashboard → Pages → elspa

확인 항목:
✅ Deployment history (배포 이력)
✅ Build status (빌드 상태)
✅ Analytics (트래픽)
✅ Environment variables (환경변수)
```

---

## 🎯 완료 체크리스트

```
Step 1: Cloudflare
  ✅ 계정 생성
  ✅ Pages 프로젝트 생성
  ✅ GitHub 연동
  ✅ 초기 배포 성공

Step 2: Railway
  ✅ 계정 생성
  ✅ PostgreSQL 생성
  ✅ DATABASE_URL 확인

Step 3: GitHub Secrets
  ✅ Cloudflare 토큰 추가
  ✅ Railway 토큰 추가
  ✅ DATABASE_URL 추가
  ✅ API 설정 추가

Step 4: 자동 배포
  ✅ GitHub Actions 워크플로우 트리거
  ✅ 빌드 성공
  ✅ Frontend 배포 성공
  ✅ Backend 배포 성공
  ✅ 헬스 체크 통과

Step 5: 최종 확인
  ✅ Frontend: https://elspa.pages.dev 접속 가능
  ✅ Backend: https://api-backend.railway.app/health 응답
  ✅ API: 모든 엔드포인트 정상 작동
  ✅ Database: PostgreSQL 연결 성공

🎉 배포 완료!
```

---

## 📊 배포 아키텍처

```
GitHub Repository (main 브랜치)
        ↓
GitHub Actions (deploy-cloudflare.yml)
        ↓
    ┌───┴────┐
    ↓        ↓
Frontend   Backend
(Pages)   (Railway)
    ↓        ↓
CDN+Cache API Server
    ↓        ↓
     ─────┬─────
          ↓
    PostgreSQL
    (Railway DB)
```

---

## 🔗 배포 후 주소

| 서비스 | URL |
|--------|-----|
| **Frontend** | https://elspa.pages.dev |
| **Backend API** | https://api-backend.railway.app |
| **API Docs** | https://api-backend.railway.app/docs |
| **Health Check** | https://api-backend.railway.app/health |

---

## 🆘 문제 해결

### 문제: Cloudflare Pages 빌드 실패

```
1. Pages 대시보드 → Deployments
2. 실패한 배포 클릭
3. 빌드 로그 확인
4. 일반적인 원인:
   - NEXT_PUBLIC_API_URL 누락
   - Node.js 캐시 문제 (Clear cache)
   - package.json 오류

해결:
- Settings → Environment → NEXT_PUBLIC_API_URL 확인
- Clear build cache → Retry deployment
```

### 문제: Railway 배포 실패

```
1. Railway Dashboard
2. Deployments → 실패한 배포 클릭
3. 로그 확인

일반적인 원인:
- DATABASE_URL 오류
- Python 의존성 누락
- 포트 설정

해결:
- railway logs (실시간 로그)
- railway variables (환경변수 확인)
- railway up (재배포)
```

### 문제: API 502 오류

```
원인: Backend 응답 시간 초과 (콜드 스타트)

해결:
1. Railway 로그 확인
2. 데이터베이스 연결 확인
3. 30초 대기 후 재시도
```

---

## 🎓 다음 학습

1. **커스텀 도메인 연결**
   ```
   Cloudflare → Pages → Custom domain
   elspa.example.com 추가
   ```

2. **모니터링 대시보드**
   - Sentry: 에러 추적
   - Grafana: 성능 메트릭
   - Railway Analytics: 트래픽

3. **성능 최적화**
   - Cloudflare: 캐싱 규칙
   - Railway: 동시성 조정
   - Database: 인덱스 최적화

4. **보안 강화**
   - WAF 규칙 (Cloudflare)
   - Rate limiting (Cloudflare)
   - CORS 설정 (Backend)

---

## 📞 지원

**배포 관련 문서:**
- [CLOUDFLARE_DEPLOYMENT_GUIDE.md](./CLOUDFLARE_DEPLOYMENT_GUIDE.md) — 상세 가이드
- [DEPLOYMENT_SUPPORT_CENTER.md](./DEPLOYMENT_SUPPORT_CENTER.md) — 지원 센터

**외부 링크:**
- [Cloudflare Pages](https://pages.cloudflare.com/)
- [Railway Docs](https://railway.app/docs)
- [PostgreSQL](https://www.postgresql.org/)

---

**작성자:** jitnet57  
**배포 방식:** Cloudflare + Railway  
**예상 시간:** 30분  
**상태:** 🟢 프로덕션 배포 준비 완료

🚀 **지금 바로 배포를 시작하세요!**

