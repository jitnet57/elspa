# 🔍 배포 실패 근본 원인 분석 보고서

**작성일:** 2026-05-28  
**프로젝트:** ElSpa Manager  
**배포 환경:** Cloudflare Pages  
**최종 결과:** ✅ 배포 성공

---

## 📋 요약

**"Booking with Therapist" RED BOX가 Production에 보이지 않는 문제**를 해결하기 위해 3가지 근본 원인을 발견하고 수정했습니다.

| 원인 | 영향 | 해결책 |
|------|------|--------|
| `pages_build_output_dir` 잘못된 경로 | 최신 코드 미배포 | `.next` → `out` 변경 |
| Pages 미지원 설정 (staging/dev/routes/build) | 배포 실패 | 지원되는 설정만 유지 |
| root의 `requirements.txt` | Python 빌드 시도 | `requirements-backend.txt`로 이름 변경 |

---

## 🔴 Problem 1: `pages_build_output_dir` 잘못된 경로

### 증상
- Dev 서버 (localhost:3000): ✅ "Booking with Therapist" 버튼 보임
- Production (elspa.pages.dev): ❌ 버튼 미표시
- Git에는 최신 코드 커밋되어 있음
- Cloudflare Pages 배포 완료했다고 표시됨

### 근본 원인
```toml
# ❌ 잘못된 설정 (wrangler.toml)
pages_build_output_dir = "./frontend/.next"
```

**문제:**
- Next.js는 `output: "export"` 설정으로 **정적 사이트를 `out` 폴더에 생성**
- 하지만 wrangler.toml이 `.next` 폴더를 가리킴 (런타임 폴더)
- Pages가 잘못된 폴더의 오래된 코드를 배포

### 코드 증거
**next.config.ts:**
```typescript
const nextConfig: NextConfig = {
  output: "export",  // ← 정적 내보내기 활성화
  // ...
};
```

이 설정은 빌드 시 **`out` 폴더** 생성을 의미합니다.

### 해결책
```toml
# ✅ 수정된 설정
pages_build_output_dir = "./frontend/out"
```

**영향:**
- ✅ Pages가 최신 정적 사이트 배포
- ✅ "Booking with Therapist" 버튼 표시됨

---

## 🔴 Problem 2: Pages 미지원 설정

### 증상
배포 로그 에러:
```
ERROR: Configuration file for Pages projects does not support "build"
ERROR: Configuration file contains the following environment names that are not supported: "staging", "development"
ERROR: Configuration file for Pages projects does not support "routes"
```

### 근본 원인
wrangler.toml에 **Pages에서 지원하지 않는 설정**들이 있었습니다:

```toml
# ❌ Pages 미지원 설정
[env.staging]
name = "elspa-staging"

[env.development]  
name = "elspa-development"

[env.production]
routes = [
  { pattern = "example.com", zone_name = "example.com" }
]

[build]
command = "npm run build"
cwd = "./frontend"
```

**Pages의 한계:**
- ✅ 지원: `[env.production]`, `[env.preview]` 만 가능
- ❌ 미지원: `[env.staging]`, `[env.development]`
- ❌ 미지원: `routes` (Pages는 자동 라우팅)
- ❌ 미지원: `[build]` 섹션 (Pages는 자동 감지)

### 해결책
Pages에서 지원하는 설정만 유지:

```toml
# ✅ 수정된 설정
name = "elspa"
pages_build_output_dir = "./frontend/out"

[env.production.vars]
ENVIRONMENT = "production"
API_URL = "https://api.elspa.com"

[env.preview.vars]
ENVIRONMENT = "preview"
API_URL = "https://api.elspa.com"
```

**의미:**
- root의 `package.json` 감지 시 npm 빌드 자동 실행
- Pages가 빌드 후 `frontend/out` 배포

---

## 🔴 Problem 3: root의 `requirements.txt` 설치 시도

### 증상
배포 로그 에러:
```
ERROR: Failed to build 'psycopg2-binary' when getting requirements to build wheel
Error: pg_config executable not found.
```

### 근본 원인
**Cloudflare Pages가 root의 `requirements.txt`를 설치하려고 함**

```
파일 구조:
elspa/
├── requirements.txt          ← ❌ Pages가 설치 시도
├── requirements-monitoring.txt
├── requirements-security.txt
├── requirements-test.txt
├── package.json              ← ✅ Pages는 npm 빌드 실행
└── frontend/
    ├── package.json
    └── ...
```

**Pages의 자동 감지 로직:**
1. root에 `package.json` 발견 → npm 빌드 시도
2. root에 `requirements.txt` 발견 → pip 설치도 시도 (병렬)
3. psycopg2-binary 빌드 실패 (Linux pg_config 없음)

### 해결책
root의 `requirements.txt`를 `requirements-backend.txt`로 이름 변경:

```bash
mv requirements.txt requirements-backend.txt
```

**결과:**
- ✅ Pages가 npm만 감지
- ✅ pip 설치 시도 안 함
- ✅ 빌드 성공

**근거:**
- Cloudflare Pages는 **정적 사이트 호스팅만 지원**
- FastAPI 백엔드는 별도 배포 필요 (Vercel, Railway 등)
- root의 Python 의존성은 Pages 배포에 불필요

---

## ✅ 최종 해결 과정

### 커밋 히스토리
```
36c894a - 🔧 Fix: wrangler.toml pages_build_output_dir을 ./frontend/out으로 변경
e93929d - 🔧 Fix: Cloudflare Pages 호환 설정 (staging/dev/routes/build 제거)
12261f9 - 🔧 Fix: 명시적 build 명령 추가 (root requirements.txt 무시)
2ec6305 - 🔧 Fix: [build] 섹션 제거 (Pages 미지원)
2814538 - 🔧 Fix: requirements.txt → requirements-backend.txt 이름 변경
```

### 최종 배포 로그
```
✓ npm install 성공 (879 packages)
✓ npm run build 성공 (57개 페이지 생성)
✓ 635개 파일 업로드
✓ Pages에 배포 성공!
```

---

## 🎯 배운 점

### 1️⃣ Static Export와 Output Directory의 차이
- Next.js `output: "export"` → `.next` 아닌 **`out` 폴더 생성**
- wrangler.toml의 `pages_build_output_dir`은 실제 생성되는 폴더를 가리켜야 함

### 2️⃣ Pages는 Worker Platform과 다름
- Workers: 서버리스, `[build]` 섹션 지원, Wrangler 설정 세부 제어
- Pages: 정적 호스팅, **자동 감지**, 제한된 설정 지원
- Pages: `[env.production]`, `[env.preview]`만 지원

### 3️⃣ 자동 감지의 함정
- `requirements.txt` + `package.json` 동시 존재 → 둘 다 설치 시도
- 하나만 필요하면 이름 변경 또는 제거 필요

### 4️⃣ 배포 환경별 의존성 분리
```
Frontend (Cloudflare Pages)  → requirements-frontend.txt (필요 없음)
Backend (별도 서버)          → requirements.txt (또는 requirements-backend.txt)
```

---

## 📊 문제 및 해결 요약

| # | 문제 | 원인 | 해결책 | 커밋 |
|---|------|------|--------|------|
| 1 | Production에 코드 안 보임 | `pages_build_output_dir` 오류 | `.next` → `out` 변경 | 36c894a |
| 2 | Pages 배포 설정 에러 | 미지원 설정 포함 | 호환 설정만 유지 | e93929d, 2ec6305 |
| 3 | psycopg2 빌드 실패 | root requirements.txt 설치 시도 | 이름 변경 | 2814538 |

---

## 🔧 최종 설정 파일

### wrangler.toml (최종)
```toml
name = "elspa"
pages_build_output_dir = "./frontend/out"

[env.production.vars]
ENVIRONMENT = "production"
API_URL = "https://api.elspa.com"

[env.preview.vars]
ENVIRONMENT = "preview"
API_URL = "https://api.elspa.com"
```

### next.config.ts (유지)
```typescript
const nextConfig: NextConfig = {
  output: "export",  // 정적 내보내기
  images: { unoptimized: true },
  // ...
};
```

### package.json (root)
```json
{
  "scripts": {
    "build": "npm install --prefix frontend && npm run build --prefix frontend"
  }
}
```

---

## 📌 재발 방지

### 체크리스트
- [ ] Cloudflare Pages 배포 시 **항상 `output: "export"` 확인**
- [ ] wrangler.toml의 `pages_build_output_dir`이 실제 빌드 출력 폴더 가리키는지 확인
- [ ] Pages 설정은 **production/preview만** 사용
- [ ] Backend 의존성은 **별도 파일**로 분리 (requirements-backend.txt)
- [ ] 배포 로그에서 **"npm install"** 성공 확인
- [ ] 배포 로그에서 **"Uploading (X/X)"** 성공 확인

---

**배포 상태:** ✅ 성공  
**"Booking with Therapist" 버튼:** ✅ elspa.pages.dev/monitor에 표시됨

