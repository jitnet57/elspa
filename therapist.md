# 🧘 ElSpa 테라피스트 목록 (40명)

> El Spa 마사지샵 근무 테라피스트 현황
> - **작성일**: 2026-06-05
> - **총 인원**: 40명
> - **상태**: 활성 (All Active)

---

## 📋 1️⃣ 1ST 시트 (18명)

| # | 이름 | 상태 |
|---|------|------|
| 1 | SUL AMOR TORREON | ✅ Active |
| 2 | FATIMA TAMPAN | ✅ Active |
| 3 | NARSING ATILLO | ✅ Active |
| 4 | JANEL IGOT | ✅ Active |
| 5 | JENALYN BACULE | ✅ Active |
| 6 | JESSICA FRANCIS | ✅ Active |
| 7 | WELLA CABALHUG | ✅ Active |
| 8 | WILFREDA ROSAS | ✅ Active |
| 9 | ROSELYN TAMSE | ✅ Active |
| 10 | CRISTY DEJITO | ✅ Active |
| 11 | SHEILA | ✅ Active |
| 12 | WILMA BENSIG | ✅ Active |
| 13 | GINA DESTURA | ✅ Active |
| 14 | JOY | ✅ Active |
| 15 | ARCELEY PEJO | ✅ Active |
| 16 | EVELYN DINAPO | ✅ Active |
| 17 | RITCHEL UMBLERO | ✅ Active |
| 18 | LAURA CALLINO | ✅ Active |

---

## 📋 2️⃣ 2ND 시트 (18명)

| # | 이름 | 상태 |
|---|------|------|
| 19 | ADELAIDA ESCOBIDO | ✅ Active |
| 20 | JANICE | ✅ Active |
| 21 | JENNY | ✅ Active |
| 22 | JOSEPHINE | ✅ Active |
| 23 | TURA | ✅ Active |
| 24 | TAMPUS | ✅ Active |
| 25 | PEREZ | ✅ Active |
| 26 | LIZA | ✅ Active |
| 27 | RUDELYN | ✅ Active |
| 28 | MARY ANN | ✅ Active |
| 29 | MJ | ✅ Active |
| 30 | EKIT | ✅ Active |
| 31 | FARA | ✅ Active |
| 32 | NENETH | ✅ Active |
| 33 | MARY | ✅ Active |
| 34 | LENNY | ✅ Active |
| 35 | MARICEL | ✅ Active |
| 36 | JUVY | ✅ Active |

---

## 📋 3️⃣ 3RD 시트 (4명)

| # | 이름 | 상태 |
|---|------|------|
| 37 | CRISTINA | ✅ Active |
| 38 | ROSELA | ✅ Active |
| 39 | MAHUSAY | ✅ Active |
| 40 | ARA | ✅ Active |

---

## 📊 요약

- **1ST 시트**: 18명
- **2ND 시트**: 18명
- **3RD 시트**: 4명
- **총 인원**: 40명 ✅

---

## 🔄 상태 관리

### 테라피스트 상태 (Therapist Status)

```
- idle (출근) 🟢 Available
- in_service (마사지중) 🔵 In Session
- resting (휴식) 🟠 Break
- checked_out (퇴근) ⚫ Off Duty
```

### 정렬 규칙 (Sorting Rules)

1. **출근순 정렬** (Check-in Order)
   - `checked_in_at` 시간 기준 (earliest first)

2. **마사지중은 맨뒤로** (In-Service Last)
   - `status = 'in_service'` → 목록 끝

3. **같은 상태면 ID 순** (Same Status = ID Order)
   - Secondary sort by `id`

---

## 🎯 전문 분야 (Specialties)

테라피스트별 전문 마사지 종류:

- **Swedish Massage** (스웨디시)
- **Thai Massage** (타이마사지)
- **Hot Stone** (핫스톤)
- **Foot Massage** (발마사지)
- **Aromatherapy** (아로마테라피)
- **Deep Tissue** (딥티슈)
- **Facial Treatment** (페이셜)

---

## 📌 데이터베이스 연동

### Supabase `therapists` 테이블

```sql
CREATE TABLE therapists (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  specialty VARCHAR(100),
  status VARCHAR(50),          -- idle, in_service, resting, checked_out
  checked_in_at TIME,          -- HH:MM 출근시각
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### API 조회

```typescript
// GET /api/therapists - 모든 테라피스트 조회
// 자동으로 출근순 정렬 (in_service는 맨뒤)
const therapists = await supabaseApiAdapter.getTherapists();
```

---

## 📝 수정 이력

| 날짜 | 작업 | 비고 |
|------|------|------|
| 2026-06-05 | 40명 초기 등록 | 1ST: 18 / 2ND: 18 / 3RD: 4 |

---

**마지막 업데이트**: 2026-06-05  
**파일 위치**: `/elspa/therapist.md`
