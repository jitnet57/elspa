# Cloudflare Pages 연동 완료 (ElSpa)

## ✅ 현재 상태

- ✅ GitHub ↔ Cloudflare Pages 자동 배포 연동됨
- ✅ 코드 커밋 → 자동으로 https://elspa.pages.dev 배포
- ⏳ 환경변수 설정 필요
- ⏳ API Key 발급 필요

---

## 📋 다음 단계 (5분 소요)

### 1️⃣ Cloudflare 대시보드 접속
```
https://dash.cloudflare.com → Pages → elspa
```

### 2️⃣ 환경변수 설정

**Settings** → **Environment variables** → **Production** 클릭 후 추가:

| 변수명 | 값 | 출처 |
|--------|-----|------|
| `NEXT_PUBLIC_GOOGLE_SHEET_ID` | 스프레드시트 ID | Google Sheets URL에서 추출 |
| `GOOGLE_API_TOKEN` | 서비스 계정 private_key | Google Cloud Console |
| `NEXT_PUBLIC_KAKAO_API_KEY` | 카카오 Admin Key | KakaoTalk Business |
| `EMAIL_API_KEY` | SendGrid API Key | SendGrid Dashboard |
| `ADMIN_EMAILS` | admin1@elspa.com,admin2@elspa.com | 쉼표로 구분 |
| `ADMIN_PHONES` | 010-0000-0000,010-1111-1111 | 쉼표로 구분 |

### 3️⃣ 각 서비스에서 API Key 발급

#### 🔑 Google Sheets API Token 발급 (5분)
1. https://console.cloud.google.com 접속
2. 프로젝트 선택 (또는 생성)
3. "Google Sheets API" 활성화
4. **왼쪽 메뉴** → **인증 정보** → **+ 인증 정보 만들기**
5. **서비스 계정** 선택
   - 서비스 계정 이름: "ElSpa Settlement"
   - 지역: 자동 (기본값)
6. **생성 및 계속** → **완료**
7. 생성된 서비스 계정 클릭
8. **키** 탭 → **키 추가** → **새 키 만들기**
   - 형식: **JSON**
9. 다운로드된 JSON 파일에서:
   ```json
   {
     "private_key": "-----BEGIN PRIVATE KEY-----\nMIIE...==\n-----END PRIVATE KEY-----\n"
   }
   ```
   - `private_key` 전체 복사 (따옴표 포함) → `GOOGLE_API_TOKEN`

#### 💬 KakaoTalk Business API Key (3분)
1. https://business.kakao.com 접속
2. **비즈니스 채널** → 해당 채널 선택
3. **설정** → **기본 정보** → **Admin Key** 복사
4. `NEXT_PUBLIC_KAKAO_API_KEY`에 붙여넣기

#### ✉️ SendGrid API Key (2분)
1. https://app.sendgrid.com 접속 (또는 가입)
2. **Settings** → **API Keys** → **Create API Key**
3. 이름: "ElSpa Settlement Report"
4. 권한: **Full Access** 선택
5. **Create & Copy** → `EMAIL_API_KEY`에 붙여넣기

#### 📊 Google Sheets 공유
1. Google Sheets 생성 (이름: "ElSpa 정산 보고서")
2. 서비스 계정 이메일 복사 (JSON 파일의 `client_email`)
3. 시트 공유 → **편집 권한** 추가

---

## 🚀 배포 확인

### 현재 상태 확인
```bash
# 최신 커밋 확인
git log --oneline -3

# Cloudflare 빌드 확인
https://dash.cloudflare.com → Pages → elspa → Deployments
```

### 배포 완료 후
```
✅ 자동 배포됨: https://elspa.pages.dev
✅ Admin: https://elspa.pages.dev/admin/billing
✅ 예약: https://elspa.pages.dev/customer/booking
```

---

## ⏰ Cron 트리거 설정 (선택사항)

자동 정산 보고서를 매일 00:00, 12:00에 보내려면:

### 옵션 A: Cloudflare Workers (권장)
```bash
cd frontend
npm install -g @cloudflare/wrangler
wrangler login
wrangler publish src/workers/daily-settlement-report.ts
```

### 옵션 B: 외부 서비스 (지금은 스킵해도 됨)
- Uptime Robot, PagerDuty, Cron Job 등에서
- 다음 URL을 매일 00:00, 12:00에 호출:
```
https://elspa.pages.dev/api/scheduler/daily-settlement-report
```

---

## 📝 환경변수 설정 예시

```env
NEXT_PUBLIC_GOOGLE_SHEET_ID=1ABC123...XYZ
GOOGLE_API_TOKEN=-----BEGIN PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...\n-----END PRIVATE KEY-----\n
NEXT_PUBLIC_KAKAO_API_KEY=abcd1234efgh5678...
EMAIL_API_KEY=SG.1234567890abcdef...
ADMIN_EMAILS=admin@elspa.com,manager@elspa.com
ADMIN_PHONES=010-1234-5678,010-8765-4321
```

---

## 🧪 테스트

모든 환경변수 설정 후:

### 1. 배포 테스트
```bash
git push origin main
# Cloudflare가 자동으로 배포
# https://elspa.pages.dev 접속
```

### 2. 보고서 수동 생성 테스트
```bash
curl https://elspa.pages.dev/api/scheduler/daily-settlement-report?period=morning
```

### 3. 이메일 발송 테스트
```bash
curl -X POST https://elspa.pages.dev/api/messaging/email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@example.com",
    "subject": "테스트",
    "html": "<p>테스트 이메일</p>"
  }'
```

### 4. Google Sheets 업로드 테스트
Cloudflare 대시보드 → Workers → Logs 확인

---

## 🆘 도움말

### Q: API Key는 어디서 확인하나요?
A: DEPLOY.md의 "API Key 발급 가이드" 참고

### Q: 배포가 안 되나요?
```bash
# 로컬에서 빌드 테스트
npm run build

# 에러 확인
npm run lint
```

### Q: 카카오톡 메시지가 안 와요?
1. `NEXT_PUBLIC_KAKAO_API_KEY` 확인
2. `ADMIN_PHONES` 형식 확인 (010-0000-0000)
3. 비즈니스 채널에서 수신자 등록됨?

### Q: Google Sheets에 데이터가 안 올라가요?
1. 서비스 계정 이메일 공유 확인
2. `GOOGLE_API_TOKEN` 형식 확인 (따옴표 포함)
3. 시트 이름 "정산보고서" 확인

---

## 📞 지원

문제가 있으면:
1. DEPLOY.md의 "문제 해결" 섹션 확인
2. Cloudflare 대시보드 → Pages → Deployments에서 로그 확인
3. 환경변수 모두 설정되었는지 재확인

**모든 준비가 완료되었습니다!** 🎉

환경변수만 설정하면 즉시 사용 가능합니다.
