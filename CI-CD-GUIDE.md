# 🚀 ElSpa CI/CD 파이프라인 가이드

> Phase 10-1: 배포 단계 (Wave 5-1)  
> 최종 업데이트: 2026-05-22

---

## 📚 목차

1. [개요](#개요)
2. [구성 요소](#구성-요소)
3. [설정 방법](#설정-방법)
4. [배포 프로세스](#배포-프로세스)
5. [트러블슈팅](#트러블슈팅)
6. [참고 자료](#참고-자료)

---

## 개요

### 목표
ElSpa 프로젝트의 자동화된 배포 파이프라인 구축으로:
- ✅ 코드 품질 자동 검증
- ✅ 테스트 자동 실행
- ✅ Docker 컨테이너 자동 빌드
- ✅ 프로덕션 자동 배포
- ✅ 정기 헬스 체크

### 아키텍처

```
Local Development
    ↓
GitHub Repository
    ↓
Pull Request (PR Check)
    ├── Backend Tests
    ├── Frontend Lint & Build
    └── Docker Build
    ↓
Code Review & Approval
    ↓
Main Branch Push
    ↓
Automatic Deployment (Deploy)
    ├── Build & Test
    ├── Docker Build & Push
    ├── Database Migration
    └── Health Check
    ↓
Production
    ↓
Scheduled Health Check (매시간)
```

---

## 구성 요소

### 1️⃣ Docker 컨테이너화

#### Dockerfile.backend
```dockerfile
FROM python:3.11-slim
# FastAPI + uvicorn 컨테이너
# - 4 workers (프로덕션)
# - 헬스 체크 포함
```

**특징:**
- 최소 크기 (python:3.11-slim)
- 캐시 최적화
- 헬스 체크 자동화

#### Dockerfile.frontend
```dockerfile
FROM node:20-alpine AS builder
# Next.js 멀티 스테이지 빌드
# - 빌드 스테이지에서 컴파일
# - 런타임 스테이지에서 최소 파일만 포함
```

**특징:**
- 멀티 스테이지 빌드로 크기 최소화
- SSG + ISR 지원
- 헬스 체크 자동화

#### docker-compose.yml
```yaml
version: '3.8'
services:
  db: PostgreSQL 15
  backend: FastAPI
  frontend: Next.js
```

**특징:**
- 개발/테스트 환경용 오케스트레이션
- 환경 변수 동적 주입
- 헬스 체크 포함

### 2️⃣ GitHub Actions 워크플로우

#### `.github/workflows/pr-check.yml`
**Trigger:** Pull Request 생성/업데이트

**Job 구성:**
1. Backend (Python 3.11)
   - Black 포맷 검사
   - Flake8 린팅
   - pytest 테스트
   - 커버리지 리포트

2. Frontend (Node.js 20)
   - ESLint 실행
   - TypeScript 타입 검사
   - Next.js 빌드

3. Docker
   - Backend 이미지 빌드
   - Frontend 이미지 빌드

**예상 시간:** 15-20분

#### `.github/workflows/deploy.yml`
**Trigger:** Main 브랜치 푸시

**Job 구성:**
1. Build & Test (5분)
   - Backend 테스트
   - Frontend 빌드

2. Build Images (10분)
   - Backend Docker 이미지
   - Frontend Docker 이미지
   - GitHub Container Registry 푸시

3. Deploy (5분)
   - 마이그레이션 실행
   - 서비스 배포

4. Health Check (5분)
   - API 엔드포인트 확인
   - Frontend 헬스 확인

**예상 시간:** 25-30분

#### `.github/workflows/health-check.yml`
**Trigger:** Cron 스케줄 (매시간)

**Job 구성:**
1. Backend API 확인
2. Frontend 앱 확인
3. 데이터베이스 연결 확인
4. Docker 이미지 상태 확인

### 3️⃣ 환경 설정

#### `.env.development`
로컬 개발 환경
```
DATABASE_URL=sqlite:///elspa.db
DEBUG=true
CORS_ORIGINS=http://localhost:3000
```

#### `.env.staging`
Staging 환경 (테스트 배포)
```
DATABASE_URL=postgresql://...@staging-db
DEBUG=false
CORS_ORIGINS=https://staging.elspa.com
```

#### `.env.production`
프로덕션 환경 ⚠️ .gitignore에 포함
```
DATABASE_URL=postgresql://...@prod-db
JWT_SECRET_KEY=<GitHub Secrets에서 주입>
CORS_ORIGINS=https://elspa.com
```

### 4️⃣ 마이그레이션 자동화

#### `scripts/run_migrations.sh`
배포 전 자동 실행
```bash
#!/bin/bash
# 1. Alembic 마이그레이션
# 2. 초기 데이터 로드
# 3. 상태 확인
```

### 5️⃣ 배포 체크리스트

#### `DEPLOYMENT_CHECKLIST.md`
배포 전/중/후 확인사항
- 코드 품질 & 테스트
- 성능 & 최적화
- 데이터베이스 & 마이그레이션
- 환경 설정 & 보안
- Docker & 컨테이너
- CI/CD 파이프라인
- Rollback 계획

---

## 설정 방법

### Phase 1: GitHub 저장소 설정

#### 1-1. GitHub Secrets 추가

`Settings` → `Secrets and variables` → `Actions`에 다음 추가:

```
DATABASE_URL=postgresql://user:password@host/database
JWT_SECRET_KEY=<생성된 강력한 256비트 값>
SENTRY_DSN=https://...@sentry.io/...
VERCEL_TOKEN=...  # (선택) Vercel 배포
VERCEL_ORG_ID=...
VERCEL_PROJECT_ID=...
```

#### 1-2. GitHub Secrets 생성 명령어

```bash
# 256비트 JWT 키 생성
openssl rand -base64 32

# Supabase 연결 문자열 복사
# Settings > Database > Connection Pooling 참고
```

#### 1-3. 저장소 설정

- ✅ Allow auto-merge: 활성화
- ✅ Require status checks to pass: 활성화
- ✅ Require branches to be up to date: 활성화
- ✅ Require code reviews: 최소 1명 승인

### Phase 2: 로컬 환경 설정

#### 2-1. 환경 파일 생성

```bash
# 개발 환경
cp .env.development .env

# 또는 Docker Compose 사용
docker-compose up
```

#### 2-2. 의존성 설치

```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd ../frontend
npm ci
npm run build
```

#### 2-3. 로컬 테스트

```bash
# Backend 테스트
pytest tests/ -v

# Frontend 빌드
npm run build

# Docker 테스트
docker-compose up
```

### Phase 3: 배포 전 확인

```bash
# 1. 모든 커밋 푸시
git push origin main

# 2. GitHub Actions 확인
# https://github.com/<user>/<repo>/actions

# 3. 배포 완료 대기 (25-30분)
```

---

## 배포 프로세스

### 단계별 흐름

#### 1️⃣ 코드 커밋 (개발자)
```bash
git add .
git commit -m "🌍 Translate remaining Korean UI"
git push origin feature/translate-ui
```

#### 2️⃣ Pull Request (개발자)
- GitHub에서 PR 생성
- PR 설명 작성
- CI/CD 자동 실행 대기

#### 3️⃣ PR Check (자동화)
- Backend 테스트 실행
- Frontend 빌드 확인
- Docker 이미지 빌드
- 예상 시간: 15-20분

#### 4️⃣ 코드 리뷰 (팀)
- 최소 1명 이상 검토
- 피드백 반영
- 승인 (Approve)

#### 5️⃣ Merge to Main (개발자)
```bash
# PR 머지 (GitHub UI)
# 또는 CLI
git checkout main
git pull origin main
git merge feature/translate-ui
git push origin main
```

#### 6️⃣ 자동 배포 (자동화)
- 빌드 & 테스트 실행
- Docker 이미지 빌드 & 푸시
- 데이터베이스 마이그레이션
- 프로덕션 배포
- 예상 시간: 25-30분

#### 7️⃣ 헬스 체크 (자동화)
- API 엔드포인트 확인
- Frontend 앱 확인
- 예상 시간: 5분

#### 8️⃣ 배포 완료 알림
- 배포 완료 메시지
- 배포 로그 링크
- 다음 단계 안내

### 실제 배포 사례

#### 사례 1: 기능 추가
```
브랜치: feature/add-therapist-dashboard
커밋: 3개
변경 파일: 5개 (Backend) + 8개 (Frontend)

⏱️ PR Check: 18분
✅ Backend: 통과 (테스트 45/45)
✅ Frontend: 통과 (빌드 성공)
✅ Docker: 통과 (이미지 빌드 성공)

👥 리뷰: jitnet57 승인
⏰ 머지: 2026-05-22 10:30 UTC

🚀 배포: 자동 시작
✅ 빌드: 5분
✅ Docker 푸시: 3분
✅ 마이그레이션: 2분
✅ 헬스 체크: 2분

총 소요 시간: 12분
```

#### 사례 2: 버그 수정
```
브랜치: bugfix/fix-login-issue
커밋: 1개
변경 파일: 2개 (Backend)

⏱️ PR Check: 12분
✅ Backend: 통과 (테스트 45/45)
✅ Frontend: 통과 (스킵: 변경 없음)
✅ Docker: 통과

👥 리뷰: jitnet57 승인
⏰ 머지: 2026-05-22 11:00 UTC

🚀 배포: 자동 시작
총 소요 시간: 8분
```

---

## 트러블슈팅

### Q1: PR Check 실패 - "Backend tests failed"

**증상:**
```
FAILED tests/test_auth.py::test_login_invalid_credentials
AssertionError: expected status 401, got 200
```

**해결:**
1. 로컬에서 재현
   ```bash
   pytest tests/test_auth.py::test_login_invalid_credentials -v
   ```

2. 원인 파악 & 수정
   ```python
   # app/routers/auth.py
   # 로그인 로직 버그 수정
   ```

3. 테스트 통과 확인 후 커밋
   ```bash
   pytest tests/ -v
   git push origin feature/...
   ```

### Q2: Docker 빌드 실패 - "RUN pip install failed"

**증상:**
```
ERROR: Could not find a version that satisfies the requirement
```

**해결:**
1. requirements.txt 확인
   ```bash
   pip install -r backend/requirements.txt
   ```

2. 로컬에서 재현
   ```bash
   docker build -f Dockerfile.backend .
   ```

3. 문제 패키지 업데이트
   ```bash
   pip install --upgrade <package>
   pip freeze > backend/requirements.txt
   ```

### Q3: 배포 후 헬스 체크 실패

**증상:**
```
❌ curl https://api.elspa.com/health failed
Connection refused
```

**해결:**
1. 서버 상태 확인
   ```bash
   kubectl get pods
   # 또는
   docker ps
   ```

2. 로그 확인
   ```bash
   kubectl logs <pod-name>
   # 또는
   docker logs elspa-backend
   ```

3. 데이터베이스 연결 확인
   ```bash
   psql $DATABASE_URL -c "SELECT 1"
   ```

4. 롤백 (필요시)
   ```bash
   git revert <commit>
   git push origin main
   ```

### Q4: 데이터베이스 마이그레이션 실패

**증상:**
```
alembic.util.exc.CommandError: Can't locate revision identified by ''
```

**해결:**
1. 마이그레이션 상태 확인
   ```bash
   alembic current
   alembic history
   ```

2. 마이그레이션 스크립트 확인
   ```bash
   ls -la alembic/versions/
   ```

3. 스테이징에서 테스트
   ```bash
   # .env.staging 사용
   alembic upgrade head
   ```

4. 수정 후 재배포

---

## 참고 자료

### 공식 문서
- [GitHub Actions](https://docs.github.com/en/actions)
- [Docker Documentation](https://docs.docker.com/)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

### ElSpa 문서
- [CLAUDE.md](./CLAUDE.md) - 개발 가이드
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - 배포 체크리스트
- [history-workflow-book.md](./history-workflow-book.md) - 개발 히스토리

### 유용한 명령어

```bash
# Docker 정리
docker system prune -a

# Docker 이미지 리스트
docker images | grep elspa

# Docker Compose 로그
docker-compose logs -f backend

# GitHub CLI로 배포 상태 확인
gh run list --branch main
gh run view <run_id> --log

# 로컬 마이그레이션 테스트
docker-compose exec backend alembic upgrade head
```

---

**최종 업데이트:** 2026-05-22  
**버전:** 1.0.0  
**담당자:** jitnet57
