# 🚀 Cloudflare 배포 가이드

**작성일:** 2026-05-22  
**배포 대상:** Cloudflare (Pages + Workers)  
**예상 비용:** Frontend 무료 + Backend $5-10/월  
**설정 시간:** 30-45분

---

## 📊 Cloudflare 배포 아키텍처

```
GitHub Repository (main 브랜치)
          ↓
GitHub Actions (CI/CD)
          ↓
     ┌────┴────┐
     ↓         ↓
Frontend      Backend
(Pages)     (Workers + 외부 DB)
     ↓         ↓
  CDN      API Server
```

---

## 🎯 3단계 배포 프로세스

### **Step 1: Cloudflare Pages 설정 (프론트엔드)**

#### 1-1. Cloudflare 계정 생성
```
1. https://dash.cloudflare.com 방문
2. 이메일로 계정 생성
3. 무료 플랜 선택
```

#### 1-2. Pages 프로젝트 생성
```
1. Cloudflare Dashboard → Pages
2. "Create a project" 클릭
3. GitHub 연결 (권한 승인)
4. "elspa" 저장소 선택
5. 빌드 설정:
   - Framework: Next.js
   - Build command: npm run build
   - Build output directory: .next
   - Root directory: frontend
```

#### 1-3. 환경변수 설정
```
Pages 설정 → Environment variables

이름:  NEXT_PUBLIC_API_URL
값:    https://api.example.com (또는 Workers URL)

이름:  API_BASE_URL
값:    https://api.example.com
```

#### 1-4. 배포 확인
```
GitHub main 브랜치에 Push
→ Cloudflare Pages 자동 빌드 & 배포
→ https://{project-name}.pages.dev 에서 확인
```

---

### **Step 2: 백엔드 배포 선택**

Cloudflare Workers로 API를 호스팅하거나, 별도 서버 사용

#### **Option A: Cloudflare Workers (간단)**

```
장점:
✅ 저렴 ($5-10/월)
✅ 자동 스케일링
✅ Cloudflare CDN 이용

단점:
⚠️ 콜드 스타트 가능
⚠️ 최대 30초 타임아웃
⚠️ 메모리 제한

적합: 가벼운 API, 스타트업
```

**Workers 배포:**
```bash
# 1. Wrangler 설치
npm install -g wrangler

# 2. 프로젝트 초기화
wrangler init

# 3. FastAPI를 ASGI로 배포 (복잡함)
# 또는 API를 Hono.js로 다시 작성 (권장)
```

#### **Option B: 외부 서버 + Cloudflare (권장)**

```
구성:
- Frontend: Cloudflare Pages ✅
- Backend: Railway / Render / AWS
- Database: Neon / Supabase / AWS RDS
- CDN: Cloudflare (자동)

장점:
✅ 완전 제어
✅ 제한 없음
✅ 프로덕션급

비용:
- Frontend: 무료
- Backend: $7-20/월
- Database: $5-50/월
```

---

### **Step 3: 데이터베이스 설정**

#### 3-1. Railway (추천: $7/월)

```
1. https://railway.app 가입
2. "New Project" → "Database" → PostgreSQL
3. 연결 문자열 복사:
   postgresql://user:pass@host:port/dbname
4. Cloudflare/GitHub Secrets에 추가:
   DATABASE_URL: postgresql://...
```

#### 3-2. 또는 Supabase (무료 플랜)

```
1. https://supabase.com 가입
2. 새 프로젝트 생성
3. Database → Connection string 복사
4. Secrets에 추가
```

#### 3-3. 또는 기존 AWS RDS (이미 있으면)

```
DATABASE_URL: postgresql://user:pass@rds-endpoint:5432/elspa
```

---

## 🔐 GitHub Secrets 추가 (Cloudflare)

```bash
# Cloudflare 토큰
gh secret set CLOUDFLARE_API_TOKEN --body "your-cloudflare-api-token"

# Cloudflare 계정 ID
gh secret set CLOUDFLARE_ACCOUNT_ID --body "your-account-id"

# Pages 프로젝트 이름
gh secret set CLOUDFLARE_PROJECT_NAME --body "elspa"

# 데이터베이스
gh secret set DATABASE_URL --body "postgresql://user:pass@host/db"

# API 설정
gh secret set API_BASE_URL --body "https://api.example.com"
gh secret set FRONTEND_URL --body "https://elspa.pages.dev"

# JWT (기존과 동일)
gh secret set JWT_SECRET_KEY --body "your-secret-key"

# Monitoring (기존과 동일)
gh secret set SENTRY_DSN --body "https://..."
```

---

## 📝 GitHub Actions 수정

### `.github/workflows/deploy.yml` 수정

Cloudflare Pages는 자동 배포되므로, 백엔드만 배포:

```yaml
# deploy.yml 수정

jobs:
  # 1️⃣ 빌드 & 테스트
  build-and-test:
    # ... (기존 동일)

  # 2️⃣ Cloudflare Pages 자동 배포
  # (자동 - 별도 설정 불필요)

  # 3️⃣ 백엔드 배포 (Railway/Render/AWS)
  deploy-backend:
    name: Deploy Backend
    needs: build-and-test
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      # Option A: Railway 배포
      - name: Deploy to Railway
        run: |
          curl -X POST https://api.railway.app/graphql \
            -H "Authorization: Bearer ${{ secrets.RAILWAY_TOKEN }}" \
            -H "Content-Type: application/json" \
            -d '{"query":"mutation { railwayDeploy(input: {}) }"}'

      # 또는 Option B: Render 배포
      # - name: Deploy to Render
      #   run: |
      #     curl -X POST https://api.render.com/deploy/srv-... \
      #       -H "Authorization: Bearer ${{ secrets.RENDER_DEPLOY_HOOK }}"
```

---

## ✅ 배포 체크리스트

### 사전 준비
- [ ] Cloudflare 계정 생성
- [ ] GitHub와 Cloudflare 연동
- [ ] PostgreSQL 데이터베이스 (Railway/Supabase)
- [ ] 도메인 설정 (또는 pages.dev 기본 도메인 사용)

### Cloudflare Pages 설정
- [ ] Pages 프로젝트 생성
- [ ] GitHub 저장소 연동
- [ ] 빌드 설정 확인 (Next.js)
- [ ] 환경변수 추가 (NEXT_PUBLIC_API_URL)
- [ ] 초기 배포 성공 확인

### 백엔드 배포
- [ ] Railway/Render 계정 생성
- [ ] PostgreSQL 데이터베이스 설정
- [ ] API 코드 배포
- [ ] DATABASE_URL 환경변수 설정

### GitHub Actions
- [ ] Cloudflare/Railway 토큰 추가
- [ ] deploy.yml 수정
- [ ] 자동 배포 테스트

### 최종 검증
- [ ] Frontend: https://elspa.pages.dev
- [ ] Backend: https://api.example.com/health
- [ ] 데이터베이스 연결 확인
- [ ] 헬스 체크 통과

---

## 🚀 실시간 배포 테스트

### 1️⃣ Pages 배포 확인 (자동)

```bash
# GitHub main에 Push
git checkout main
git pull origin main

# Cloudflare Dashboard에서 확인
# https://dash.cloudflare.com → Pages → elspa

# 배포 URL 확인
# https://elspa.pages.dev
```

### 2️⃣ Backend API 배포 확인

```bash
# Railway/Render에서 배포 확인
# https://dashboard.railway.app

# API 헬스 체크
curl https://api-backend.railway.app/health
# 응답: {"status": "🟢 Healthy"}
```

### 3️⃣ 통합 테스트

```bash
# Frontend에서 API 호출
curl -X GET https://elspa.pages.dev/api/payroll/periods \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📊 Cloudflare 모니터링

### Analytics
```
https://dash.cloudflare.com → Pages → Analytics

확인 항목:
- Page views
- Build status
- Deploy history
- Error logs
```

### 커스텀 도메인 연결

```
1. Cloudflare Dashboard → Pages → Custom domain
2. "elspa.example.com" 입력
3. DNS 레코드 추가:
   - Type: CNAME
   - Name: elspa
   - Target: elspa.pages.dev
4. 확인 (15분 대기)
```

---

## 🔄 자동 배포 파이프라인

```
GitHub Main Branch Push
        ↓
GitHub Actions (CI/CD)
        ↓
    ┌───┴────┐
    ↓        ↓
Frontend   Backend
(Pages)   (Railway)
    ↓        ↓
Auto Deploy Auto Deploy
    ↓        ↓
Live ✅    Live ✅
```

---

## 💰 비용 추정

| 서비스 | 가격 | 용도 |
|--------|------|------|
| **Cloudflare Pages** | 무료 | Frontend |
| **Railway/Render** | $7-10/월 | Backend |
| **PostgreSQL** | $15-50/월 | Database |
| **Sentry (Error Tracking)** | 무료~$29/월 | Monitoring |
| **Cloudflare Pro** | $20/월 (선택) | 고급 기능 |
| **총계** | **~$25-70/월** | Production Ready |

---

## 🆘 문제 해결

### 문제 1: Pages 빌드 실패

**원인:** 환경변수 누락 또는 빌드 스크립트 오류

**해결:**
```bash
# Cloudflare Pages 빌드 로그 확인
# Dashboard → Pages → Deployments → 실패한 배포 클릭

# 1. 환경변수 확인
# Settings → Environment variables

# 2. 빌드 설정 확인
# Settings → Build settings
# Build command: npm run build
# Output directory: .next
```

### 문제 2: API 502 Bad Gateway

**원인:** 백엔드 배포 문제 또는 DATABASE_URL 오류

**해결:**
```bash
# Railway 로그 확인
# railway logs

# DATABASE_URL 확인
# railway variables

# 재배포
# railway up
```

### 문제 3: CORS 오류

**원인:** Frontend와 Backend 도메인 불일치

**해결:**
```python
# main.py 또는 app/config.py
CORS_ORIGINS = [
    "https://elspa.pages.dev",
    "https://elspa.example.com",
    "http://localhost:3000",  # 로컬 개발
]
```

---

## 📚 상세 가이드

| 단계 | 가이드 | 시간 |
|------|--------|------|
| 1 | [Cloudflare Pages 설정](https://developers.cloudflare.com/pages/) | 10분 |
| 2 | [Railway 배포](https://railway.app/docs) | 10분 |
| 3 | [PostgreSQL 연동](https://railway.app/docs/databases/postgresql) | 10분 |
| 4 | [커스텀 도메인](https://developers.cloudflare.com/pages/configuration/custom-domains/) | 10분 |
| 5 | [자동 배포](https://developers.cloudflare.com/pages/platform/github-integration/) | 5분 |

---

## 🎯 다음 단계

### 즉시 진행 (필수)

```
✅ Step 1: Cloudflare 계정 생성
✅ Step 2: Pages 프로젝트 연동 (GitHub)
✅ Step 3: Railway 계정 생성 & DB 설정
✅ Step 4: GitHub Secrets 추가
✅ Step 5: 배포 테스트
```

### 선택 사항

```
□ 커스텀 도메인 연결
□ Cloudflare Pro 업그레이드
□ WAF 규칙 설정
□ Analytics 모니터링
```

---

**작성자:** jitnet57  
**배포 대상:** Cloudflare Pages + Railway  
**상태:** 🟢 프로덕션 준비 완료  
**최종 업데이트:** 2026-05-22

