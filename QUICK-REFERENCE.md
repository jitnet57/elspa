# 🎯 Phase 10-1 CI/CD 빠른 참고 가이드

## 📋 주요 파일 위치

```
elspa/
├── .github/workflows/
│   ├── pr-check.yml          ← PR 자동 검증
│   ├── deploy.yml            ← 자동 배포
│   └── health-check.yml      ← 정기 헬스 체크
├── Dockerfile.backend        ← Backend 컨테이너
├── Dockerfile.frontend       ← Frontend 컨테이너
├── docker-compose.yml        ← 로컬 환경
├── .env.development          ← 개발 환경 설정
├── .env.staging              ← Staging 환경 설정
├── .env.production           ← 프로덕션 설정 (비밀)
├── scripts/run_migrations.sh ← DB 마이그레이션
├── CI-CD-GUIDE.md            ← 상세 가이드
├── DEPLOYMENT_CHECKLIST.md   ← 배포 체크리스트
└── SETUP-INSTRUCTIONS.md     ← 설정 방법
```

---

## 🚀 자주 사용하는 명령어

### Docker

```bash
# 로컬 환경 시작
docker-compose up

# 로컬 환경 중지
docker-compose down

# 이미지 빌드 (Backend)
docker build -f Dockerfile.backend -t elspa-backend .

# 이미지 빌드 (Frontend)
docker build -f Dockerfile.frontend -t elspa-frontend .

# 컨테이너 로그
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Git & GitHub

```bash
# Feature 브랜치 생성
git checkout -b feature/name

# 커밋 & 푸시
git add .
git commit -m "message"
git push origin feature/name

# PR 상태 확인 (CLI)
gh pr view <number>
gh pr checks <number>

# 배포 상태 확인
gh run list --branch main
gh run view <run_id> --log
```

### 테스트

```bash
# Backend 테스트
pytest tests/ -v

# Frontend 빌드
cd frontend && npm run build

# 린팅
npm run lint
```

---

## 🔐 GitHub Secrets 체크리스트

- [ ] DATABASE_URL
- [ ] JWT_SECRET_KEY
- [ ] SENTRY_DSN (선택)
- [ ] VERCEL_TOKEN (선택)

**생성 방법:**
```bash
openssl rand -base64 32  # JWT_SECRET_KEY
```

---

## 📊 배포 단계별 시간

| 단계 | 시간 | 상태 |
|------|------|------|
| PR Check | 15-20분 | 자동 |
| 코드 리뷰 | 자유 | 수동 |
| 배포 | 25-30분 | 자동 |
| 헬스 체크 | 5분 | 자동 |
| **총 시간** | **45-60분** | |

---

## ⚡ 빠른 배포 프로세스

```
1. 작업 완료
   git add . && git commit -m "message"

2. 브랜치 푸시
   git push origin feature/name

3. PR 생성 (GitHub UI)
   
4. PR Check 확인 (15-20분)
   
5. 코드 리뷰 & 승인
   
6. Main 브랜치 병합
   git push origin main
   
7. 자동 배포 (25-30분)
   
8. 프로덕션 확인 완료!
```

---

## 🔧 주요 환경 변수

### 개발 환경
```
DEBUG=true
DATABASE_URL=sqlite:///elspa.db
CORS_ORIGINS=http://localhost:3000
```

### Staging 환경
```
DEBUG=false
DATABASE_URL=postgresql://user:pass@staging-db
CORS_ORIGINS=https://staging.elspa.com
```

### 프로덕션 환경
```
DEBUG=false
DATABASE_URL=<GitHub Secrets>
JWT_SECRET_KEY=<GitHub Secrets>
CORS_ORIGINS=https://elspa.com
```

---

## 🔍 헬스 체크

```bash
# Backend API
curl http://localhost:8000/health

# Frontend
curl http://localhost:3000/healthcheck

# Database
psql $DATABASE_URL -c "SELECT 1"
```

---

## 🆘 긴급 상황

### 배포 실패 시
1. GitHub Actions 로그 확인
2. 에러 메시지 검색
3. 로컬에서 재현
4. 수정 후 재커밋

### 프로덕션 장애 시
1. 헬스 체크 확인
2. 서버 로그 확인
3. 긴급 롤백
   ```bash
   git revert <commit>
   git push origin main
   ```

---

## 📞 연락처 & 문서

- **가이드:** [CI-CD-GUIDE.md](./CI-CD-GUIDE.md)
- **체크리스트:** [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- **설정:** [SETUP-INSTRUCTIONS.md](./SETUP-INSTRUCTIONS.md)
- **개발:** [CLAUDE.md](./CLAUDE.md)

---

**최종 업데이트:** 2026-05-22  
**버전:** 1.0.0
