# ELSPA 모니터 — Supabase + Google Sheet 동기화 셋업 (백엔드 없음)

> 작성일: 2026-05-31
> 구조: 프론트엔드(Next 정적 export) → **Supabase 직접 연동**, Google Apps Script가 **1시간 단위**로 Sheet 백업. FastAPI 백엔드/WebSocket 불필요.

## 아키텍처

```
[Monitor (브라우저)]
   │  5초 폴링 조회 / 변경 즉시 저장 (supabase-js, anon 키)
   ▼
[Supabase: beds / therapists / bookings]
   ▲
   │  매시간 REST 읽기 (time-driven trigger)
[Google Apps Script] ──기록──▶ [Google Sheet 탭: beds/therapists/bookings]
```

- 조회 실패 시 **로컬 스냅샷(localStorage)** 으로 폴백 → "우선 저장하고 다시 불러옴".
- 변경(침대 상태/예약 등록·수정·삭제)은 **즉시 Supabase 반영**. Sheet 반영은 1시간 배치.

## 1) Supabase

1. Supabase 프로젝트 생성
2. SQL Editor에 [`supabase/schema.sql`](../supabase/schema.sql) 붙여넣고 Run (테이블 + RLS + 침대 86개 시드)
3. Project Settings → API 에서 **anon public 키**와 **Project URL** 복사

## 2) 프론트엔드 환경변수

`frontend/.env.local` (또는 배포 플랫폼 환경변수):

```
NEXT_PUBLIC_USE_SUPABASE=true
NEXT_PUBLIC_SUPABASE_URL=https://<your>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public 키>
```

> ⚠️ service_role/secret 키는 절대 프론트에 넣지 말 것 (anon 키 + RLS만 사용).

## 3) Google Apps Script (1시간 단위 Sheet 백업)

1. 백업용 Google Sheet → 확장 프로그램 → Apps Script
2. [`apps-script/Code.gs`](../apps-script/Code.gs) 붙여넣기
3. 프로젝트 설정 → 스크립트 속성:
   - `SUPABASE_URL` = `https://<your>.supabase.co`
   - `SUPABASE_ANON_KEY` = `<anon public 키>`
4. `setupHourlyTrigger()` 1회 실행 → 매시간 자동 동기화 (수동: `syncAll()`)

## 4) 빌드 & 배포

```bash
cd frontend
npm install
npm run build            # 정적 export → frontend/out/
npm run deploy           # wrangler pages deploy out (Cloudflare Pages)
```

## 관련 파일

| 파일 | 역할 |
|------|------|
| `frontend/src/lib/supabase/client.ts` | Supabase 클라이언트(싱글톤) |
| `frontend/src/lib/api/supabase-adapter.ts` | beds/therapists/bookings 조회·쓰기 + 폴백 캐시 |
| `frontend/src/lib/api/get-client.ts` | Mock ⇄ Supabase 전환 seam |
| `frontend/src/hooks/useBookings.ts` | 예약 CRUD + 30개 페이지(1st/2nd/3rd) |
| `frontend/src/hooks/useUpdateBed.ts` | 침대 변경 즉시 저장 |
| `supabase/schema.sql` | 테이블/RLS/시드 |
| `apps-script/Code.gs` | 매시간 Supabase→Sheet |
