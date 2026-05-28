# 📦 ElSpa 배포 가이드

## 🏗️ 최종 아키텍처

```
┌─────────────────────────────────────────┐
│  Cloudflare Pages (Frontend)             │
│  https://elspa.pages.dev                 │
│  - Next.js 정적 호스팅                    │
└──────────────┬──────────────────────────┘
               │ API 요청 (/api/*)
               ↓
┌─────────────────────────────────────────┐
│  Railway (Backend)                       │
│  https://[project].railway.app           │
│  - FastAPI 서버                          │
│  - Google Sheets OAuth 2.0               │
│  - Supabase 저장소 연동                   │
└─────────────────────────────────────────┘
```

## 🚀 배포 단계

### 1️⃣ Railway에 FastAPI 배포

**방법 A: Railway 웹 대시보드 (권장)**
```
1. https://railway.app 접속
2. GitHub 로그인
3. New Project → Deploy from GitHub
4. jitnet57/elspa 리포지토리 선택
5. Root Directory: api
6. 환경변수 추가:
   - GOOGLE_CLIENT_ID=104694066545-vtgespl9ho6b4gmcolgdrpuloankttgq.apps.googleusercontent.com
   - GOOGLE_CLIENT_SECRET=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
   - GOOGLE_SHEET_ID=1-WRjYvp33RQ3vJBSJ7RIW1g6P5pZjKqy_vPeVtA7mf8
   - SUPABASE_URL=https://qnqhqrpvqjhqarbufzqd.supabase.co
   - SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
7. Deploy 클릭
8. Railway URL 획득 (예: https://elspa-api-prod.railway.app)
```

**방법 B: 로컬 테스트**
```bash
cd e:\elspa
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2️⃣ Frontend 환경변수 설정

**로컬 (테스트용):**
```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Cloudflare Pages (프로덕션):**
```bash
# Cloudflare Pages 대시보드에서 설정:
Environment Variables:
  NEXT_PUBLIC_API_URL=https://[railway-project].railway.app
```

### 3️⃣ Cloudflare Pages 재배포

```bash
cd frontend
npm run build
wrangler pages deploy out/
```

## 📊 배포된 서비스

| 서비스 | URL | 용도 |
|--------|-----|------|
| Cloudflare Pages | https://elspa.pages.dev | Frontend (Next.js) |
| Railway | https://[project].railway.app | Backend (FastAPI) |
| Supabase | https://qnqhqrpvqjhqarbufzqd.supabase.co | 데이터베이스 & 저장소 |

## 🔐 환경변수 체크리스트

### Frontend (.env)
- ✅ NEXT_PUBLIC_API_URL (Railway URL)

### Backend (api/.env)
- ✅ GOOGLE_CLIENT_ID
- ✅ GOOGLE_CLIENT_SECRET
- ✅ GOOGLE_SHEET_ID
- ✅ GOOGLE_SHEET_RANGE
- ✅ SUPABASE_URL
- ✅ SUPABASE_KEY

## 🧪 테스트

### 로컬 환경
```bash
# Terminal 1: Backend
python -m uvicorn main:app --reload

# Terminal 2: Frontend
npm run dev

# 브라우저: http://localhost:3000/monitor
# 1. "Google로 연결" 버튼 클릭
# 2. Google 로그인
# 3. "Booking with Therapist" 버튼 나타남
# 4. 예약 데이터 입력 & 저장
```

### 프로덕션 환경
```bash
# https://elspa.pages.dev/monitor
# 같은 과정 반복
```

## 📝 주요 파일

### Frontend
- `frontend/src/app/monitor/page.tsx` - 모니터 페이지 (Google 로그인)
- `frontend/src/components/GoogleSheetBookingModal.tsx` - 예약 입력 폼

### Backend
- `api/index.py` - FastAPI 진입점
- `api/app/routers/google_sheets_router.py` - Google Sheets API 엔드포인트
- `api/app/services/google_oauth_service.py` - OAuth 2.0 구현
- `api/app/services/booking_scheduler.py` - 3시간 자동 저장
- `api/app/services/supabase_service.py` - Supabase 저장소

## 🔗 유용한 링크

- [Railway 문서](https://docs.railway.app)
- [Cloudflare Pages 문서](https://developers.cloudflare.com/pages)
- [FastAPI 문서](https://fastapi.tiangolo.com)
- [Google Sheets API](https://developers.google.com/sheets/api)
