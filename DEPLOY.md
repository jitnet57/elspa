# ElSpa 배포 가이드

## 🚀 빠른 배포 (Vercel)

### 1단계: Vercel 연결
```bash
cd frontend
npm install -g vercel
vercel login
vercel
```

### 2단계: 환경변수 설정
Vercel 대시보드에서 다음 환경변수 추가:

```env
# API 연동
NEXT_PUBLIC_API_URL=https://api.elspa.com

# KakaoTalk Business API
NEXT_PUBLIC_KAKAO_API_KEY=your-kakao-api-key
# Kakao API 얻기: https://developers.kakao.com

# SMS Provider (예: Naver Sens, Coolsms)
NEXT_PUBLIC_SMS_API_KEY=your-sms-api-key

# Google Sheets API
NEXT_PUBLIC_GOOGLE_API_KEY=your-google-api-key
NEXT_PUBLIC_GOOGLE_SHEET_ID=your-spreadsheet-id
GOOGLE_API_TOKEN=your-service-account-token
# 설정: https://console.cloud.google.com

# Email (SendGrid, AWS SES 등)
EMAIL_API_KEY=your-email-api-key
EMAIL_API_ENDPOINT=https://api.sendgrid.com/v3/mail/send
EMAIL_SMTP_SERVER=smtp.sendgrid.net

# 정산 보고서 자동 발송
CRON_SECRET=your-secret-token-for-crons
ADMIN_EMAILS=admin1@elspa.com,admin2@elspa.com
ADMIN_PHONES=010-0000-0000,010-1111-1111
```

### 3단계: 배포
```bash
# 자동 배포 (push 시)
git push origin main

# 또는 수동 배포
vercel --prod
```

---

## 📋 환경변수 설정 상세

### KakaoTalk Business API
1. https://business.kakao.com 접속
2. 비즈니스 채널 생성
3. API Key 발급

**Messaging 테스트:**
```bash
curl -X POST http://localhost:3000/api/messaging/kakao \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "010-0000-0000",
    "content": "테스트 메시지"
  }'
```

### Google Sheets API
1. https://console.cloud.google.com 접속
2. "Sheets API" 활성화
3. 서비스 계정 생성 → JSON 키 다운로드
4. `GOOGLE_API_TOKEN` = JSON 키의 `private_key`

**스프레드시트 공유:**
- 서비스 계정 이메일을 시트에 공유자로 추가

### SendGrid (이메일)
1. https://sendgrid.com 가입
2. API Key 생성
3. `EMAIL_API_KEY` 환경변수에 저장

---

## ⏰ 정산 보고서 자동 발송

### 예약 설정
- **아침 12시 (00:00)** → 전일 정산 보고서
- **저녁 12시 (12:00)** → 당일 정산 진행 상황

### Vercel Crons 확인
```bash
vercel logs
```

### 수동 테스트
```bash
# 아침 보고서 테스트
curl -X GET http://localhost:3000/api/scheduler/daily-settlement-report?period=morning

# 저녁 보고서 테스트
curl -X GET http://localhost:3000/api/scheduler/daily-settlement-report?period=evening
```

---

## 🔧 배포 후 체크리스트

- [ ] 환경변수 모두 설정됨
- [ ] KakaoTalk 메시지 발송 테스트
- [ ] SMS 발송 테스트
- [ ] 이메일 발송 테스트
- [ ] Google Sheets 업로드 테스트
- [ ] 정산 보고서 수동 생성 테스트
- [ ] Cron Jobs 활성화 (Vercel Pro 이상)

---

## 📊 배포된 URL

```
Production: https://elspa.vercel.app
또는 커스텀 도메인: https://elspa.pages.dev
```

---

## 🐛 문제 해결

### 배포 실패
```bash
npm run build  # 로컬에서 빌드 테스트
npm run lint   # 린트 확인
```

### Cron 실행 안됨
- Vercel Pro 플랜 필요
- 환경변수 `CRON_SECRET` 설정 확인

### 메시지 발송 실패
- API Key 유효성 확인
- 수신자 번호/이메일 형식 확인
- API 할당량 확인

---

## 📚 참고 자료

- [Next.js 배포](https://nextjs.org/docs/deployment)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [KakaoTalk Business API](https://developers.kakao.com/docs/latest/ko/kakao-business)
- [Google Sheets API](https://developers.google.com/sheets)
