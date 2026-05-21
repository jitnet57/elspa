# 🔐 GitHub Secrets 설정 가이드

**작성일:** 2026-05-22  
**목적:** GitHub Actions CI/CD 파이프라인 자동 배포를 위한 환경변수 설정

---

## 📋 필수 Secrets 목록

### 1️⃣ 데이터베이스 (Database)

| Secret 이름 | 값 | 설명 |
|---|---|---|
| `DATABASE_URL` | `postgresql://user:password@host:5432/elspa` | PostgreSQL 프로덕션 연결 주소 |
| `TEST_DATABASE_URL` | `postgresql://test_user:test_pass@localhost:5432/test_elspa` | 테스트용 DB (선택) |

**예시:**
```
postgresql://elspa_prod:SecurePassword123!@db.example.com:5432/elspa_production
```

---

### 2️⃣ JWT 인증 (Authentication)

| Secret 이름 | 값 | 설명 |
|---|---|---|
| `JWT_SECRET_KEY` | `your-secret-key-here` | JWT 토큰 서명 키 (32자 이상) |
| `JWT_ALGORITHM` | `HS256` | JWT 알고리즘 (기본: HS256) |
| `JWT_ACCESS_EXPIRE_MINUTES` | `15` | Access token 유효시간 (분) |
| `JWT_REFRESH_EXPIRE_DAYS` | `7` | Refresh token 유효시간 (일) |

**생성 방법 (Python):**
```python
import secrets
secret_key = secrets.token_urlsafe(32)
print(secret_key)
```

---

### 3️⃣ 모니터링 & 로깅 (Monitoring)

| Secret 이름 | 값 | 설명 |
|---|---|---|
| `SENTRY_DSN` | `https://key@sentry.io/projectid` | Sentry 에러 추적 |
| `SENTRY_ENVIRONMENT` | `production` | 환경명 (production/staging) |
| `LOG_LEVEL` | `INFO` | 로그 레벨 (DEBUG/INFO/WARNING/ERROR) |

**Sentry 셋업:**
1. https://sentry.io 가입
2. 새 프로젝트 생성 (Python + FastAPI)
3. DSN 복사 → Secret에 저장

---

### 4️⃣ API & 외부 서비스 (External APIs)

| Secret 이름 | 값 | 설명 |
|---|---|---|
| `TWILIO_ACCOUNT_SID` | `AC...` | Twilio WhatsApp SID |
| `TWILIO_AUTH_TOKEN` | `auth_token` | Twilio 인증 토큰 |
| `TWILIO_WHATSAPP_NUMBER` | `+1234567890` | Twilio WhatsApp 발신 번호 |
| `KAKAO_BOT_TOKEN` | `bot_token` | 카카오톡 봇 토큰 |
| `KAKAO_CHANNEL_ID` | `channel_id` | 카카오톡 채널 ID |

---

### 5️⃣ 배포 & DevOps (Deployment)

| Secret 이름 | 값 | 설명 |
|---|---|---|
| `VERCEL_TOKEN` | `vercel_token` | Vercel 배포 토큰 (선택) |
| `VERCEL_ORG_ID` | `org_id` | Vercel 조직 ID (선택) |
| `VERCEL_PROJECT_ID` | `project_id` | Vercel 프로젝트 ID (선택) |
| `AWS_ACCESS_KEY_ID` | `AKIA...` | AWS IAM 키 (선택) |
| `AWS_SECRET_ACCESS_KEY` | `secret_key` | AWS 보안 키 (선택) |
| `AWS_REGION` | `us-east-1` | AWS 리전 (선택) |

---

### 6️⃣ 환경 변수 (Environment)

| Secret 이름 | 값 | 설명 |
|---|---|---|
| `ENVIRONMENT` | `production` | 환경 (development/staging/production) |
| `DEBUG` | `false` | 디버그 모드 |
| `CORS_ORIGINS` | `https://example.com,https://api.example.com` | CORS 허용 도메인 |
| `API_BASE_URL` | `https://api.example.com` | API 기본 URL |
| `FRONTEND_URL` | `https://example.com` | 프론트엔드 URL |

---

## 🔧 GitHub Secrets 추가 방법

### 방법 1: GitHub 웹 인터페이스

1. **저장소 접속**
   ```
   https://github.com/{owner}/{repo}/settings/secrets/actions
   ```

2. **"New repository secret" 클릭**

3. **정보 입력**
   - **Name:** `SECRET_NAME` (예: `DATABASE_URL`)
   - **Value:** `secret_value` (예: `postgresql://...`)

4. **"Add secret" 클릭**

### 방법 2: GitHub CLI

```bash
# GitHub CLI 설치 (설치된 경우 스킵)
# https://cli.github.com

# Secret 추가
gh secret set DATABASE_URL --body "postgresql://..."
gh secret set JWT_SECRET_KEY --body "your-secret-key"

# Secret 목록 조회
gh secret list
```

### 방법 3: 배치 추가 스크립트

```bash
#!/bin/bash

# 저장소 설정
OWNER="your-github-username"
REPO="elspa"

# Secrets 배열
declare -A SECRETS=(
    ["DATABASE_URL"]="postgresql://..."
    ["JWT_SECRET_KEY"]="your-32-char-secret-key"
    ["SENTRY_DSN"]="https://..."
    ["TWILIO_ACCOUNT_SID"]="AC..."
    ["TWILIO_AUTH_TOKEN"]="token"
)

# Secret 추가
for name in "${!SECRETS[@]}"; do
    gh secret set "$name" --repo "$OWNER/$REPO" --body "${SECRETS[$name]}"
    echo "✅ $name 추가 완료"
done

echo "🎉 모든 Secrets 추가 완료!"
```

---

## 📊 Secrets 검증 체크리스트

```bash
# ✅ 모든 Secret이 추가되었는지 확인
gh secret list

# ✅ 각 Secret 값이 올바른지 확인 (웹 인터페이스)
# Settings > Secrets and variables > Actions에서 각 Secret 클릭 → "Update" 클릭
# (값 자체는 보이지 않지만, 이름과 마지막 수정일은 확인 가능)

# ✅ CI/CD 로그에서 Secret 사용 확인
# Actions 탭 → 최근 실행 → 각 Job 로그 확인
# "DATABASE_URL" 참조 부분에서 "***" 마스킹 확인 (보안)
```

---

## 🚀 CI/CD 파이프라인 검증

### 1단계: PR 검증 파이프라인 (PR Check)

**Trigger:** Pull Request 생성/업데이트  
**파일:** `.github/workflows/pr-check.yml`

**검증 항목:**
- ✅ Backend: Python 테스트 (pytest)
- ✅ Backend: 코드 포맷 검사 (Black)
- ✅ Backend: Linting (Flake8)
- ✅ Frontend: 의존성 설치
- ✅ Frontend: TypeScript 타입 검사
- ✅ Frontend: Next.js 빌드
- ✅ Docker: Backend 이미지 빌드
- ✅ Docker: Frontend 이미지 빌드

**테스트 방법:**
```bash
# 1. 새 브랜치 생성
git checkout -b feature/test-ci

# 2. 작은 변경 커밋
echo "# Test" >> README.md
git add .
git commit -m "test: CI/CD validation"

# 3. Push
git push origin feature/test-ci

# 4. GitHub에서 Pull Request 생성
# https://github.com/{owner}/{repo}/pull/new/feature/test-ci

# 5. GitHub Actions 탭에서 PR Check 실행 확인
# https://github.com/{owner}/{repo}/actions
```

### 2단계: 배포 파이프라인 (Deploy)

**Trigger:** Main 브랜치 Push 또는 수동 트리거  
**파일:** `.github/workflows/deploy.yml`

**배포 단계:**
1. **빌드 & 테스트** — Backend 테스트 + Frontend 빌드
2. **Docker 이미지 빌드** — Backend/Frontend 이미지 생성
3. **이미지 푸시** — GitHub Container Registry (ghcr.io)에 푸시
4. **데이터베이스 마이그레이션** — (선택) Alembic 마이그레이션 실행
5. **배포** — 프로덕션 환경에 배포
6. **헬스 체크** — API 및 Frontend 헬스 체크

**테스트 방법:**
```bash
# 1. Main 브랜치에서 코드 수정
git checkout main
echo "# Production Ready" >> VERSION.md
git add .
git commit -m "feat: ready for production"

# 2. Push (자동으로 배포 파이프라인 시작)
git push origin main

# 3. GitHub Actions 탭에서 Deploy 실행 확인
# https://github.com/{owner}/{repo}/actions/workflows/deploy.yml

# 4. 실행 로그 확인
# - Build & Test 완료
# - Docker 이미지 빌드 & 푸시
# - 배포 완료
# - 헬스 체크 통과

# 5. Docker 이미지 확인
# https://github.com/{owner}/{repo}/pkgs/container
# ghcr.io/{owner}/{repo}/backend/latest
# ghcr.io/{owner}/{repo}/frontend/latest
```

### 3단계: 수동 배포 트리거

```bash
# GitHub CLI를 사용한 수동 배포 트리거
gh workflow run deploy.yml --ref main

# 실행 상태 확인
gh run list --workflow=deploy.yml --limit=5
```

---

## 🔐 Secrets 보안 모범 사례

| 항목 | 권장사항 |
|------|---------|
| **Secret 노출** | 절대 Repository/Commit 메시지에 직접 입력하지 말 것 |
| **로그 마스킹** | GitHub Actions는 자동으로 Secret 값을 `***`로 마스킹 |
| **정기 갱신** | 3개월마다 JWT_SECRET_KEY, 암호 등 갱신 |
| **액세스 제어** | Organization Secrets 사용 → 여러 저장소 공유 가능 |
| **감사 로그** | Organization Settings → Audit log에서 Secret 사용 이력 확인 |
| **삭제 절차** | Secret 삭제 후 해당 값 즉시 변경 (배포 서버에서도) |

---

## 🐛 문제 해결

### 문제 1: "Secrets not found" 에러

**원인:** Workflow 파일에서 참조하는 Secret이 추가되지 않음

**해결:**
```bash
# Secret 목록 확인
gh secret list

# 누락된 Secret 추가
gh secret set MISSING_SECRET --body "value"
```

### 문제 2: 배포 실패 (AUTH_ERROR)

**원인:** Docker Registry 인증 실패 (GITHUB_TOKEN 문제)

**해결:**
```yaml
# deploy.yml에서 GITHUB_TOKEN 자동 제공 확인
- name: Log in to Container Registry
  uses: docker/login-action@v2
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}  # 자동 제공됨
```

### 문제 3: 데이터베이스 연결 실패

**원인:** DATABASE_URL Secret 형식 오류

**해결:**
```bash
# 올바른 형식 확인
postgresql://username:password@hostname:5432/database_name

# 특수문자 이스케이프 필요 시
# 예: password에 @가 있으면 %40으로 변환
postgresql://username:pass%40word@hostname:5432/database_name

# 연결 테스트
psql "postgresql://username:password@hostname:5432/database_name" -c "SELECT 1"
```

---

## ✅ 최종 체크리스트

- [ ] 모든 필수 Secrets 추가 완료
- [ ] `gh secret list`로 Secret 목록 확인
- [ ] PR Check 워크플로우 테스트 완료 (성공)
- [ ] Deploy 워크플로우 테스트 완료 (성공)
- [ ] Docker 이미지 ghcr.io에 푸시 확인
- [ ] 헬스 체크 통과 확인
- [ ] 모니터링 대시보드 (Sentry/Grafana) 정상 작동 확인

---

## 📚 참고 자료

- [GitHub Secrets 공식 문서](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [GitHub Actions 환경변수](https://docs.github.com/en/actions/learn-github-actions/environment-variables)
- [GitHub CLI Secret 관리](https://cli.github.com/manual/gh_secret)

---

**작성자:** jitnet57 (kang jichul)  
**최종 업데이트:** 2026-05-22  
**버전:** 1.0

