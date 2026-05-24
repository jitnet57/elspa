# ✅ 최종 배포 체크리스트

**작성일:** 2026-05-22  
**배포 방식:** Cloudflare Pages + Railway  
**상태:** 🟢 배포 준비 완료

---

## 📋 배포 전 필수 준비물

### ✅ 기술 준비 (완료)

```
✅ GitHub 저장소 준비
✅ 모든 코드 커밋 완료
✅ CI/CD 워크플로우 생성
✅ 배포 문서 작성
✅ Docker 설정 완료
✅ 테스트 작성 완료
```

### ⏳ 배포 대상 준비 (필요)

```
□ Cloudflare 계정 생성
□ Railway 계정 생성
□ PostgreSQL 데이터베이스 생성
□ API 토큰 생성
```

### ⏳ GitHub Secrets 설정 (필요)

```
□ CLOUDFLARE_API_TOKEN
□ CLOUDFLARE_ACCOUNT_ID
□ CLOUDFLARE_PROJECT_NAME
□ RAILWAY_TOKEN
□ DATABASE_URL
□ JWT_SECRET_KEY
□ API_BASE_URL
□ FRONTEND_URL
```

---

## 🔑 필요한 정보 (사용자 제공 필요)

배포를 진행하려면 다음 정보가 필요합니다:

### 1️⃣ Cloudflare 정보
```
CLOUDFLARE_API_TOKEN:     (Cloudflare 계정 설정 → API Tokens)
CLOUDFLARE_ACCOUNT_ID:    (Cloudflare 계정 ID)
CLOUDFLARE_PROJECT_NAME:  (Pages 프로젝트 이름, 예: elspa)
```

### 2️⃣ Railway 정보
```
RAILWAY_TOKEN:            (Railway 계정 → Account Settings → API Tokens)
DATABASE_URL:             (Railway PostgreSQL 연결 문자열)
```

### 3️⃣ API 설정
```
API_BASE_URL:             (예: https://api-backend.railway.app)
FRONTEND_URL:             (예: https://elspa.pages.dev)
```

### 4️⃣ 보안 설정
```
JWT_SECRET_KEY:           (32자 이상 무작위 문자열)
```

---

## 🎯 배포 진행 방식

### **방식 A: 완전 자동 (추천)**
1. 사용자가 위 정보 제공
2. 자동으로 GitHub Secrets 설정
3. Main 브랜치에 배포 커밋 Push
4. GitHub Actions 자동 배포 시작
5. 결과 리포트 제공

### **방식 B: 단계별 수동**
1. 사용자가 Cloudflare/Railway 계정 생성
2. 사용자가 GitHub Secrets 직접 설정
3. 사용자가 Main에 Push
4. GitHub Actions 자동 배포

---

## 📞 지금 어떻게 진행할까요?

**3가지 선택지:**

### **1️⃣ 정보 제공하고 자동 배포**
```
아래 정보를 입력해주세요:
- CLOUDFLARE_API_TOKEN
- CLOUDFLARE_ACCOUNT_ID
- CLOUDFLARE_PROJECT_NAME
- RAILWAY_TOKEN
- DATABASE_URL
- JWT_SECRET_KEY

그러면 자동으로 Secrets 설정 + 배포 시작!
```

### **2️⃣ 배포 과정을 직접 진행**
```
1단계: Cloudflare 계정 생성
       https://CLOUDFLARE_DEPLOYMENT_STEPS.md 참조

2단계: Railway 계정 생성
       https://CLOUDFLARE_DEPLOYMENT_STEPS.md 참조

3단계: GitHub Secrets 직접 설정
       gh secret set ...

4단계: Main에 Push
       git push origin main

자동 배포 시작!
```

### **3️⃣ 먼저 로컬 테스트 후 배포**
```
로컬에서:
  python main.py
  npm run dev

테스트 후 배포 진행
```

---

## ⏱️ 소요 시간

| 단계 | 시간 | 작업 |
|------|------|------|
| Secrets 설정 | 3분 | GitHub에서 8개 Secret 추가 |
| Cloudflare 설정 | 10분 | Pages 프로젝트 생성 |
| Railway 설정 | 8분 | DB 생성 |
| 배포 | 10분 | GitHub Actions 자동 실행 |
| 검증 | 5분 | Health check |
| **총 시간** | **~30분** | **프로덕션 배포 완료!** |

---

## 🚀 배포 상태 모니터링

배포 시작 후:

```bash
# GitHub Actions 모니터링
gh run watch

# 또는 웹에서
# https://github.com/{owner}/elspa/actions/workflows/deploy-cloudflare.yml

# 배포 단계:
# 1. build-and-test (5분)
# 2. deploy-frontend (3분)  
# 3. deploy-backend (5분)
# 4. health-check (2분)
# 🎉 완료!
```

---

## 🎯 최종 결과

배포 완료 후:

```
Frontend:  https://elspa.pages.dev
Backend:   https://api-backend.railway.app
Docs:      https://api-backend.railway.app/docs
Health:    https://api-backend.railway.app/health
```

---

## 🎉 지금 선택하세요!

**당신의 선택:**

1. ✅ **자동 배포** → 정보 제공해주세요
2. 📖 **수동 배포** → 단계별 진행
3. 🧪 **로컬 테스트** → 먼저 로컬에서 테스트

**응답 예시:**

```
1번 선택 + 정보 제공:

CLOUDFLARE_API_TOKEN: your-token-here
CLOUDFLARE_ACCOUNT_ID: your-account-id
CLOUDFLARE_PROJECT_NAME: elspa
RAILWAY_TOKEN: your-railway-token
DATABASE_URL: postgresql://user:pass@host/db
JWT_SECRET_KEY: your-secret-key-here
API_BASE_URL: https://api-backend.railway.app
FRONTEND_URL: https://elspa.pages.dev
```

---

**대기 중...**

