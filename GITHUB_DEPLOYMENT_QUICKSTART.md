# 🚀 GitHub 자동 배포 빠른 시작 가이드

**작성일:** 2026-05-22  
**목표:** 5분 안에 GitHub Secrets 설정 및 CI/CD 자동 배포 활성화

---

## ⚡ 5단계 빠른 시작

### 📍 Step 1: GitHub 저장소 설정 열기 (1분)

**PC/Mac에서:**
```
https://github.com/{github-username}/elspa/settings/secrets/actions
```

또는 GitHub 웹사이트에서:
1. 저장소 → **Settings** 클릭
2. 좌측 메뉴 → **Secrets and variables** → **Actions**

---

### 📍 Step 2: 필수 Secrets 10개 추가하기 (3분)

모두 "New repository secret" 클릭 후 아래 정보 입력:

#### 1️⃣ 데이터베이스
```
Name:  DATABASE_URL
Value: postgresql://YOUR_USER:YOUR_PASSWORD@YOUR_HOST:5432/elspa_prod
```

#### 2️⃣ JWT 비밀 키
```
Name:  JWT_SECRET_KEY
Value: (Python에서 생성)
  python -c "import secrets; print(secrets.token_urlsafe(32))"
```

#### 3️⃣ Sentry (에러 추적)
```
Name:  SENTRY_DSN
Value: https://YOUR_KEY@sentry.io/YOUR_PROJECT_ID
```

#### 4️⃣ Twilio (WhatsApp 발송)
```
Name:  TWILIO_ACCOUNT_SID
Value: AC...
```

#### 5️⃣ Twilio Auth Token
```
Name:  TWILIO_AUTH_TOKEN
Value: your_token_here
```

#### 6️⃣ Twilio WhatsApp 번호
```
Name:  TWILIO_WHATSAPP_NUMBER
Value: +1234567890
```

#### 7️⃣ Kakao 봇 토큰
```
Name:  KAKAO_BOT_TOKEN
Value: your_kakao_bot_token
```

#### 8️⃣ 환경 설정
```
Name:  ENVIRONMENT
Value: production
```

#### 9️⃣ API URL
```
Name:  API_BASE_URL
Value: https://api.example.com
```

#### 🔟 Frontend URL
```
Name:  FRONTEND_URL
Value: https://example.com
```

**🎯 TIP:** GitHub CLI로 빠르게 추가하기
```bash
gh secret set DATABASE_URL --body "postgresql://..."
gh secret set JWT_SECRET_KEY --body "your-secret-key"
gh secret set SENTRY_DSN --body "https://..."
# ... 반복
```

---

### 📍 Step 3: Secrets 확인하기 (1분)

**GitHub CLI:**
```bash
gh secret list
```

**웹에서:** Settings → Secrets → 목록 확인 (값은 보이지 않음, 이름만 표시)

---

### 📍 Step 4: CI/CD 파이프라인 테스트하기 (프롤로그)

#### 테스트 A: PR Check (Pull Request 검증)

```bash
# 1. 테스트 브랜치 생성
git checkout -b test/ci-validation

# 2. 작은 변경 추가
echo "# Test" >> README.md
git add .
git commit -m "test: CI validation"
git push origin test/ci-validation

# 3. Pull Request 생성
# https://github.com/{owner}/elspa/pull/new/test/ci-validation
# "Create Pull Request" 클릭

# 4. GitHub Actions 탭에서 PR Check 실행 확인
# https://github.com/{owner}/elspa/actions
```

**✅ 예상 결과:**
- Backend tests ✅
- Frontend build ✅
- Docker build ✅
- PR comment with results ✅

#### 테스트 B: Deploy (Main 브랜치 배포)

```bash
# 1. PR 병합
gh pr merge -s  # 또는 웹에서 병합

# 2. Main 브랜치 확인
git checkout main
git pull origin main

# 3. 배포 파이프라인 자동 시작 확인
# https://github.com/{owner}/elspa/actions/workflows/deploy.yml

# 4. 실시간 로그 보기
gh run watch
```

**✅ 예상 결과:**
- Build & Test ✅
- Docker Build ✅
- Push to ghcr.io ✅
- Database Migration ✅
- Health Check ✅

---

### 📍 Step 5: 배포 검증하기 (프롤로그)

#### ✅ API 헬스 체크
```bash
curl https://api.example.com/health
# 응답: {"status": "🟢 Healthy", "database": "✅ Connected"}
```

#### ✅ Docker 이미지 확인
```bash
# GitHub Container Registry에 이미지 확인
# https://github.com/{owner}/elspa/pkgs/container

# 또는 CLI로 확인
gh api repos/{owner}/elspa/packages --jq '.[].name'
```

#### ✅ 모니터링 대시보드
- **Sentry:** https://sentry.io (에러 추적)
- **Kibana:** http://localhost:5601 (로그 보기)
- **Grafana:** http://localhost:3000 (메트릭 보기)

---

## 🎯 배포 완료!

### 이제 다음이 자동으로 진행됩니다:

| 이벤트 | 작동 | 결과 |
|--------|------|------|
| **Pull Request 생성** | PR Check 자동 실행 | Backend/Frontend 검증 |
| **Main 브랜치 Push** | Deploy 자동 실행 | Docker 빌드 → 배포 |
| **배포 완료** | 헬스 체크 실행 | API 및 Frontend 검증 |

---

## 🛠️ 수동 배포 트리거

필요시 수동으로 배포 파이프라인 실행:

```bash
# GitHub CLI로 수동 트리거
gh workflow run deploy.yml --ref main

# 상태 확인
gh run list --workflow=deploy.yml
```

또는 GitHub 웹에서:
1. Actions 탭 → Deploy
2. "Run workflow" → main 선택 → "Run workflow"

---

## ❓ 자주 하는 질문

### Q1: Secrets를 추가했는데 배포가 실패합니다.

**A:** 다음을 확인하세요:
```bash
# 1. Secrets 목록 확인
gh secret list

# 2. DATABASE_URL 형식 확인
# postgresql://user:pass@host:5432/database (특수문자는 URL 인코딩)

# 3. 배포 로그 확인
gh run view --log  # 또는 웹에서 Actions 탭

# 4. Secret 값 수정
gh secret set DATABASE_URL --body "corrected_value"
```

### Q2: Docker 이미지가 ghcr.io에 푸시되지 않습니다.

**A:** GITHUB_TOKEN 권한 확인:
```bash
# 1. GitHub CLI 재인증
gh auth refresh

# 2. 또는 Personal Access Token 생성
# https://github.com/settings/tokens
# write:packages 권한 선택

# 3. Secret에 추가
gh secret set GHCR_TOKEN --body "your_pat_token"

# 4. deploy.yml 수정
# password: ${{ secrets.GHCR_TOKEN }}
```

### Q3: 배포 후 API가 응답하지 않습니다.

**A:** 헬스 체크 타임아웃 증가:
```bash
# .github/workflows/deploy.yml 수정
# sleep 30 → sleep 60
# curl 재시도 로직 추가
```

### Q4: 로그를 어디서 확인합니까?

**A:** 3가지 방법:
```bash
# 방법 1: GitHub CLI
gh run view --log

# 방법 2: GitHub 웹
# https://github.com/{owner}/elspa/actions

# 방법 3: 실시간 모니터링
gh run watch
```

---

## 📊 CI/CD 파이프라인 상태 모니터링

### 대시보드 확인

```
GitHub: https://github.com/{owner}/elspa/actions
├─ PR Check: Pull Request 생성 시 자동 실행
│  ├─ Backend (Python, pytest)
│  ├─ Frontend (Node.js, npm build)
│  └─ Docker (이미지 빌드 검증)
│
└─ Deploy: Main 브랜치 Push 시 자동 실행
   ├─ Build & Test
   ├─ Docker Build & Push
   ├─ Database Migration
   └─ Health Check
```

### 상태 배지 추가 (선택)

README.md에 추가:
```markdown
![PR Check](https://github.com/{owner}/{repo}/actions/workflows/pr-check.yml/badge.svg)
![Deploy](https://github.com/{owner}/{repo}/actions/workflows/deploy.yml/badge.svg)
```

---

## 🔐 보안 체크리스트

- [ ] 모든 Secrets 추가 확인
- [ ] Secrets 값이 git에 커밋되지 않음 확인
- [ ] .env, .env.local 파일이 .gitignore에 있음 확인
- [ ] JWT_SECRET_KEY가 프로덕션 환경에서 강력함 확인
- [ ] DATABASE_URL의 비밀번호가 강력함 확인
- [ ] SENTRY_DSN이 올바름 확인

---

## 📞 다음 단계

1. ✅ **완료:** GitHub Secrets 설정
2. ✅ **완료:** CI/CD 파이프라인 테스트
3. **다음:** 모니터링 대시보드 설정
   - Sentry 설정: MONITORING_SETUP_GUIDE.md
   - ELK 스택 설정: docker-compose.monitoring.yml
   - Grafana 대시보드: monitoring/grafana-dashboard.json

---

## 📚 상세 문서

| 문서 | 용도 |
|------|------|
| **GITHUB_SECRETS_SETUP.md** | Secrets 설정의 상세 가이드 |
| **DEPLOYMENT_TEST_PROCEDURE.md** | 배포 검증 절차 및 테스트 |
| **CI-CD-GUIDE.md** | CI/CD 파이프라인 상세 가이드 |
| **DEPLOYMENT_CHECKLIST.md** | 배포 전/후 체크리스트 |

---

**작성자:** jitnet57  
**마지막 업데이트:** 2026-05-22  
**소요 시간:** 약 5분

🎉 **축하합니다! 자동 배포가 준비되었습니다.**

