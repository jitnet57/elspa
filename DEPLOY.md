# ElSpa 배포 가이드 (Cloudflare Pages)

## 🚀 Cloudflare Pages 배포

### 1단계: GitHub 연동 확인
Cloudflare 대시보드 → Pages → 연결된 저장소 확인

### 2단계: 환경변수 설정
Cloudflare Pages 대시보드:
- **Settings** → **Environment variables** 클릭
- Production 환경에 다음 추가:

```env
# API 연동
NEXT_PUBLIC_API_URL=https://elspa.pages.dev

# KakaoTalk Business API
NEXT_PUBLIC_KAKAO_API_KEY=your-kakao-api-key

# SMS Provider
NEXT_PUBLIC_SMS_API_KEY=your-sms-api-key

# Google Sheets API
NEXT_PUBLIC_GOOGLE_API_KEY=your-google-api-key
NEXT_PUBLIC_GOOGLE_SHEET_ID=your-spreadsheet-id
GOOGLE_API_TOKEN=your-service-account-token

# Email (SendGrid)
EMAIL_API_KEY=your-sendgrid-api-key

# 정산 보고서
ADMIN_EMAILS=admin1@elspa.com,admin2@elspa.com
ADMIN_PHONES=010-0000-0000,010-1111-1111
```

### 3단계: 자동 배포
```bash
# 자동으로 배포됨 (main 브랜치 push 시)
git push origin main
```

### 4단계: Cron 트리거 설정 (Cloudflare Workers)
**아래 중 하나 선택:**

**옵션 A: Cloudflare Workers 사용 (권장)**
```bash
# wrangler CLI 설치
npm install -g @cloudflare/wrangler

# 로그인
wrangler login

# Workers 배포
wrangler publish src/workers/daily-settlement-report.ts
```

**옵션 B: 외부 서비스 (PagerDuty, Uptime Robot)**
```bash
# 매일 00:00 & 12:00에 아래 URL 호출
POST https://elspa.pages.dev/api/scheduler/daily-settlement-report?secret=CRON_SECRET
```

---

## 📋 API Key 발급 가이드

### 1️⃣ KakaoTalk Business API
1. https://business.kakao.com 접속
2. 비즈니스 채널 생성 / 기존 채널에서 API 활성화
3. Admin Key 발급 → `NEXT_PUBLIC_KAKAO_API_KEY`

**카카오톡 메시징 흐름:**
```
메시지 생성 → KakaoTalk API → 비즈니스 채널 → 수신자 휴대폰
```

### 2️⃣ Google Sheets API
1. https://console.cloud.google.com 접속
2. "Google Sheets API" 활성화
3. 서비스 계정 생성 → JSON 키 다운로드
4. `GOOGLE_API_TOKEN` = JSON 키의 `private_key` (큰따옴표 포함)
5. `NEXT_PUBLIC_GOOGLE_SHEET_ID` = 스프레드시트 URL의 ID

**공유 설정:**
- 서비스 계정 이메일을 Sheets에 "수정자" 권한으로 추가

### 3️⃣ SendGrid (이메일)
1. https://sendgrid.com 가입
2. **Settings** → **API Keys** → **Create API Key**
3. Full Access 권한으로 생성
4. `EMAIL_API_KEY`에 저장

**테스트:**
```bash
curl https://api.sendgrid.com/v3/mail/send \
  -X POST \
  -H "Authorization: Bearer $EMAIL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "personalizations": [{
      "to": [{"email": "your-email@example.com"}]
    }],
    "from": {"email": "noreply@elspa.com"},
    "subject": "테스트",
    "html": "<p>테스트</p>"
  }'
```

---

## ⏰ 자동 정산 보고서 (Cloudflare Cron)

### 실행 시간
- **매일 00:00 (자정)** → 전일 정산 보고서 ✅
- **매일 12:00 (정오)** → 당일 정산 진행 상황 ✅

### 발송 채널
```
정산 보고서 생성
  ├─ 📊 Google Sheets: 자동 추가
  ├─ ✉️  이메일: admin1@elspa.com, admin2@elspa.com
  └─ 💬 카카오톡: 010-0000-0000, 010-1111-1111
```

### 수동 테스트
```bash
# 로컬 테스트 (개발 환경)
npm run dev
curl http://localhost:3000/api/scheduler/daily-settlement-report?period=morning

# 프로덕션 테스트
curl https://elspa.pages.dev/api/scheduler/daily-settlement-report?secret=YOUR_CRON_SECRET
```

### Cron 로그 확인
Cloudflare 대시보드:
- **Workers** → **Triggers** → **Cron** 확인

---

## 🔧 배포 후 체크리스트

- [ ] Cloudflare Pages 자동 배포 확인
- [ ] 모든 환경변수 설정됨
- [ ] KakaoTalk 메시지 발송 테스트
- [ ] 이메일 발송 테스트
- [ ] Google Sheets 연동 테스트
- [ ] 정산 보고서 수동 생성 테스트 (`?period=morning`)
- [ ] Cloudflare Cron 트리거 활성화
- [ ] Cron 실행 로그 확인

---

## 🌐 배포된 URL

```
Production: https://elspa.pages.dev
Admin: https://elspa.pages.dev/admin/billing
```

---

## 🐛 문제 해결

### 배포 안됨
```bash
# 로컬 빌드 확인
npm run build

# 린트 오류 확인
npm run lint

# Git 상태 확인
git status
```

### Cron 실행 안됨
- ✅ 환경변수 확인: `ADMIN_EMAILS`, `ADMIN_PHONES` 설정됨?
- ✅ Cloudflare Workers 배포됨?
- ✅ wrangler.toml의 crons 설정 확인?

### 메시지 발송 실패
```bash
# API Key 테스트
curl -X POST https://elspa.pages.dev/api/messaging/kakao \
  -H "Content-Type: application/json" \
  -d '{"phone":"010-0000-0000","content":"테스트"}'

# 결과 확인
# {"success": true, "messageId": "..."} → 성공
# {"error": "..."} → API Key 확인
```

### Google Sheets 업로드 안됨
- 서비스 계정 이메일이 시트에 공유됨?
- `GOOGLE_API_TOKEN`이 올바른 값?
- `NEXT_PUBLIC_GOOGLE_SHEET_ID`가 올바른 ID?

---

## 📚 참고 자료

- 🌐 [Cloudflare Pages](https://pages.cloudflare.com)
- 🔧 [Cloudflare Workers](https://workers.cloudflare.com)
- 💬 [KakaoTalk Biz API](https://developers.kakao.com/docs/latest/ko/kakao-business)
- 📊 [Google Sheets API](https://developers.google.com/sheets)
- ✉️ [SendGrid](https://sendgrid.com/docs/)
