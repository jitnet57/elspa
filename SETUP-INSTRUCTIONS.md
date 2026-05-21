# 🚀 ElSpa Phase 10-1 CI/CD 설정 가이드

이 문서는 Phase 10-1 CI/CD 파이프라인을 프로덕션 환경에 배포하기 위한 단계별 지침을 제공합니다.

---

## 단계 1: GitHub Secrets 설정

### 1-1. GitHub Repository 접속
- https://github.com/YOUR_ORG/elspa
- Settings > Secrets and variables > Actions

### 1-2. 필수 Secrets 추가

#### DATABASE_URL (필수)
```
postgresql://user:password@host:5432/dbname
```
- Supabase: Settings > Database > Connection string
- 또는 AWS RDS 연결 문자열

#### JWT_SECRET_KEY (필수)
```bash
# 터미널에서 생성
openssl rand -base64 32
```
결과값 (예):
```
aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890ABC=
```

#### SENTRY_DSN (선택)
```
https://key@sentry.io/project_id
```
- Sentry > Projects > Settings > Client Keys

#### VERCEL_* (선택, Vercel 배포 시)
```
VERCEL_TOKEN=...
VERCEL_ORG_ID=...
VERCEL_PROJECT_ID=...
```

### 1-3. Secrets 검증
```bash
# GitHub CLI로 확인
gh secret list
```

---

## 단계 2: 로컬 환경 테스트

### 2-1. 개발 환경 설정
```bash
cd e:\elspa

# 환경 파일 확인
cat .env.development

# Docker Compose 시작
docker-compose up
```

### 2-2. 서비스 헬스 확인
```bash
# Backend API
curl http://localhost:8000/health

# Frontend
curl http://localhost:3000/healthcheck

# Database
psql postgresql://elspa_user:elspa_password@localhost:5432/elspa_dev
```

### 2-3. 로컬 테스트 실행
```bash
# Backend 테스트
cd e:\elspa
pytest tests/ -v

# Frontend 빌드
cd frontend
npm ci
npm run build
```

---

## 단계 3: Docker 빌드 테스트

### 3-1. 개별 이미지 빌드
```bash
# Backend
docker build -f Dockerfile.backend -t elspa-backend:test .

# Frontend
docker build -f Dockerfile.frontend -t elspa-frontend:test .
```

### 3-2. 이미지 검증
```bash
# 이미지 리스트
docker images | grep elspa

# 컨테이너 실행
docker run -p 8000:8000 elspa-backend:test
docker run -p 3000:3000 elspa-frontend:test
```

---

## 단계 4: 첫 번째 배포 테스트

### 4-1. Feature 브랜치 생성
```bash
git checkout -b feature/test-ci-cd
git add .
git commit -m "Test CI/CD pipeline"
git push origin feature/test-ci-cd
```

### 4-2. Pull Request 생성
- GitHub에서 PR 생성
- PR Check 자동 실행 (15-20분 소요)
- 진행상황: https://github.com/YOUR_ORG/elspa/actions

### 4-3. PR Check 결과 확인
```
✅ Backend: All tests passed
✅ Frontend: Build successful
✅ Docker: Image build successful
```

### 4-4. PR 승인 및 병합
```bash
# CLI로 머지 (또는 GitHub UI 사용)
gh pr merge <pr_number> --merge
```

### 4-5. 배포 확인
- GitHub Actions > deploy workflow 자동 실행
- 예상 시간: 25-30분
- 배포 완료 후 헬스 체크 자동 실행

---

## 단계 5: 프로덕션 배포

### 5-1. 배포 전 체크리스트
- ✅ Secrets 모두 설정됨
- ✅ 로컬 테스트 통과
- ✅ Docker 빌드 성공
- ✅ 첫 배포 테스트 완료

### 5-2. 배포 실행
```bash
# 또는 GitHub UI에서 Main 브랜치로 PR 생성

# 프로덕션 데이터베이스 백업 (권장)
# 이후 단계 진행
```

### 5-3. 배포 모니터링
```bash
# GitHub Actions 대시보드
# https://github.com/YOUR_ORG/elspa/actions

# 헬스 체크 모니터링
curl https://api.elspa.com/health
curl https://elspa.com/healthcheck
```

### 5-4. 배포 후 검증
- ✅ API 응답 시간 < 200ms
- ✅ Frontend 로딩 < 3s
- ✅ 에러 로그 없음
- ✅ 사용자 피드백 수집

---

## 트러블슈팅

### Q1: "Docker: image build failed"
```bash
# 로컬에서 재현
docker build -f Dockerfile.backend .

# 에러 메시지 확인 후 수정
pip install -r backend/requirements.txt
```

### Q2: "PR Check: pytest failed"
```bash
# 로컬 테스트 실행
pytest tests/ -v

# 실패한 테스트 수정
# 커밋 후 다시 푸시
```

### Q3: "Deploy: Database migration failed"
```bash
# Staging에서 먼저 테스트
# Rollback 계획 수립 후 재배포
```

---

## 모니터링 설정 (선택)

### Sentry 에러 추적
1. https://sentry.io 가입
2. 프로젝트 생성
3. SENTRY_DSN 복사
4. GitHub Secrets에 추가

### CloudWatch 로그 (AWS)
1. AWS CloudWatch 설정
2. CloudWatch Logs 생성
3. CloudWatch Agent 설정

---

## 정기 유지보수

### 주 1회
- ✅ 헬스 체크 로그 확인
- ✅ 에러 로그 검토
- ✅ 성능 지표 확인

### 월 1회
- ✅ 의존성 업데이트 확인
- ✅ JWT_SECRET_KEY 갱신 (권장)
- ✅ 데이터베이스 백업 확인

### 분기 1회
- ✅ 보안 취약점 스캔
- ✅ DB 비밀번호 변경 (권장)
- ✅ 배포 프로세스 검토

---

## 추가 자료

- [CLAUDE.md](./CLAUDE.md) - 개발 가이드
- [CI-CD-GUIDE.md](./CI-CD-GUIDE.md) - 상세 가이드
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - 체크리스트
- [Docker 공식 문서](https://docs.docker.com/)
- [GitHub Actions 공식 문서](https://docs.github.com/en/actions)

---

**작성일:** 2026-05-22  
**버전:** 1.0.0
