# 📥 3시간마다 자동 Excel 백업 (간단 버전)

## 🎯 무엇을 하는가?

**3시간마다 자동으로:**
1. 예약 데이터 수집
2. 비용 데이터 수집
3. 테라피스트 데이터 수집
4. **Excel 파일로 저장** (다운로드 폴더)

---

## 🚀 사용 방법 (2가지)

### 방법 1️⃣: Monitor 페이지에 추가

**파일**: `frontend/src/app/monitor/page.tsx`

```typescript
'use client';

import { useSimpleAutoBackup } from '@/lib/hooks/useSimpleAutoBackup';

export default function MonitorPage() {
  // 이 줄 추가! (자동 백업 시작)
  useSimpleAutoBackup();

  return (
    <div>
      {/* 기존 코드 유지 */}
    </div>
  );
}
```

### 방법 2️⃣: Root Layout에 추가

**파일**: `frontend/src/app/layout.tsx`

```typescript
import { useSimpleAutoBackup } from '@/lib/hooks/useSimpleAutoBackup';

export default function RootLayout({ children }) {
  useSimpleAutoBackup();

  return (
    <html>
      <body>
        {children}
      </body>
    </html>
  );
}
```

---

## 📊 저장되는 파일

### 파일명 예시
```
Backup_2026-06-05_10-30.xlsx
Backup_2026-06-05_13-30.xlsx  (3시간 후)
Backup_2026-06-05_16-30.xlsx  (6시간 후)
```

### 파일 내용
```
Sheet 1: 예약
├── ID, 날짜, 테라피스트, 서비스, 가격

Sheet 2: 비용
├── ID, 날짜, 카테고리, 금액

Sheet 3: 테라피스트
├── 이름, 상태, 전문분야
```

---

## ⏰ 실행 타이밍

| 시간 | 상태 |
|------|------|
| 10:30 | ✅ 1번째 백업 |
| 13:30 | ✅ 2번째 백업 |
| 16:30 | ✅ 3번째 백업 |
| 19:30 | ✅ 4번째 백업 |

---

## 💡 콘솔 확인

브라우저 콘솔(F12)에서 보이는 메시지:

```
🚀 자동 백업 시작 (3시간마다)
💾 Excel 저장 시작...
✅ Excel 저장 완료: Backup_2026-06-05_10-30.xlsx
```

---

## 📝 주의사항

- 브라우저를 끄면 백업 중지됨
- 모니터 페이지를 열어야 백업 진행
- Excel 파일은 다운로드 폴더에 자동 저장

---

## 🔗 다음 단계

1. ✅ `useSimpleAutoBackup.ts` 생성 완료
2. ⏳ Monitor 페이지 또는 Layout에 추가
3. 🚀 배포

준비되셨나요?
