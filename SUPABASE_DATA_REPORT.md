# Supabase 데이터 현황 리포트

**작성일**: 2026-06-05
**버전**: v1.0.0
**상태**: ✅ Production Data

---

## 📊 데이터 요약

| 항목 | 현황 | 저장소 |
|------|------|--------|
| **테라피스트** | 40명 | Local (therapists.ts) |
| **마사지 서비스** | 32개 | Supabase (massage_services) |
| **업체** | 26개 | Supabase (companies) |
| **예약** | 유동적 | Supabase (bookings) |

---

## 👥 테라피스트 데이터 (40명)

### 구조
```typescript
interface TherapistData {
  id: number;
  name: string;
  specialty: string;
  status: 'checked_in' | 'checked_out';
  rating: number;
  totalClients: number;
  totalRevenue: string;
  commissionRate: number;
  phone: string;
  email: string;
}
```

### 1ST Shift (1-18명, 40% 수수료)
1. SUL AMOR TORREON - 스웨디시
2. FATIMA TAMPAN - 타이마사지
3. NARSING ATILLO - 핫스톤
4. JANEL IGOT - 발마사지
5. JENALYN BACULE - 아로마테라피
6. JESSICA FRANCIS - 종합
7. WELLA CABALHUG - 스웨디시
8. WILFREDA ROSAS - 타이마사지
9. ROSELYN TAMSE - 핫스톤
10. CRISTY DEJITO - 발마사지
11. SHEILA - 아로마테라피
12. WILMA BENSIG - 종합
13. GINA DESTURA - 스웨디시
14. JOY - 타이마사지
15. ARCELEY PEJO - 핫스톤
16. EVELYN DINAPO - 발마사지
17. RITCHEL UMBLERO - 아로마테라피
18. LAURA CALLINO - 종합

### 2ND Shift (19-36명, 45% 수수료)
19. ADELAIDA ESCOBIDO - 스웨디시
20. AGNES CALING - 타이마사지
21. ALICIA BUSMONTE - 핫스톤
22. ALONA PANDI - 발마사지
23. AMELIA CASIO - 아로마테라피
24. ANALIZA GAHONG - 종합
25. ANDREA CAPULONG - 스웨디시
26. ANNA PANAD - 타이마사지
27. ANTONIETA YONG - 핫스톤
28. APRIL CABALLES - 발마사지
29. AVELINA OSMAN - 아로마테라피
30. BELEN LINA - 종합
31. BENEDICTA MOLINA - 스웨디시
32. BERRY BUNGOS - 타이마사지
33. BETTE ABUTIN - 핫스톤
34. BLANCHE CUTING - 발마사지
35. BONITA CORADO - 아로마테라피
36. BRENDA ALEC - 종합

### 3RD Shift (37-40명, 50% 수수료)
37. CARLA COSIO - 스웨디시
38. CARMELA RIOS - 타이마사지
39. CAROLINE OLIVO - 핫스톤
40. CELIA ABALORIA - 발마사지

**정렬 기준**: 출근 순서 (checked_in 시간 기준) → 진행 중인 테라피스트는 마지막 순번으로 표시

---

## 💆 마사지 서비스 (32개)

### 데이터 구조
```typescript
interface MassageService {
  id: number;
  name: string;
  base_price: number;
  base_duration_minutes: number;
  is_active: boolean;
  created_at: string;
}
```

### 기본 마사지 (6가지 × 3시간)
**60분/90분/120분 기본 옵션**

| # | 서비스명 | 60분 | 90분 | 120분 |
|---|---------|------|------|-------|
| 1-3 | 스웨디시 (Swedish) | ₱800 | ₱1,000 | ₱1,200 |
| 4-6 | 타이마사지 (Thai) | ₱850 | ₱1,050 | ₱1,250 |
| 7-9 | 핫스톤 (Hot Stone) | ₱900 | ₱1,100 | ₱1,300 |
| 10-12 | 발마사지 (Foot) | ₱700 | ₱900 | ₱1,100 |
| 13-15 | 아로마테라피 (Aroma) | ₱850 | ₱1,050 | ₱1,250 |
| 16-18 | 종합마사지 (Full Body) | ₱950 | ₱1,150 | ₱1,350 |

### 특화 마사지 (5가지 × 3시간)

| # | 서비스명 | 60분 | 90분 | 120분 |
|---|---------|------|------|-------|
| 19-21 | 드라이 마사지 (Dry) | ₱600 | ₱750 | ₱900 |
| 22-24 | 남성 마사지 (Male) | ₱700 | ₱900 | ₱1,100 |
| 25-27 | 커플 마사지 (Couple) | ₱1,500 | ₱2,000 | ₱2,500 |
| 28-30 | VIP 마사지 (VIP) | ₱1,200 | ₱1,600 | ₱2,000 |
| 31-32 | 헤드/숄더 (Head/Shoulder) | ₱500 | ₱650 | ₱800 |

**총 32개 서비스** (6 × 3 + 5 × 3 + 1 = 32개)

**가격 범위**: ₱500 ~ ₱2,500
**기본 통화**: Philippine Peso (₱)

---

## 🏢 업체 정보 (26개)

### 여행사 (4개)
1. **WEGO** - 여행사
2. **PETERPAN** - 여행사
3. **JTB** - 여행사
4. **HIS** - 여행사

### 가이드 서비스 (1개)
5. **SIW** - 가이드 서비스

### 패키지/투어 (21개)
6. **PTF** - 투어 패키지
7. **아라다이브** - 다이빙 투어
8. **호핑따요** - 아일랜드 호핑
9. **필버디** - 필리핀 여행사
10. **핑크데이** - 투어 패키지
11. **트레블포레스트** - 여행 패키지
12. **투어스타** - 투어 운영사
13. **투어레주르** - 투어 패키지
14. **유한필곳** - 투어 가이드
15. **예스투어** - 투어 운영사
16. **아시아트립** - 아시아 여행사
17. **로맨스투어** - 로맨틱 투어
18. **락빌리지** - 리조트 투어
19. **디프리** - 쇼핑 투어
20. **더세부** - 세부 투어
21. **가이드맨** - 투어 가이드
22. **세브랑** - 투어 패키지
23-26. *추가 업체 4개* (추후 등록 예정)

**데이터 저장소**: Supabase `companies` 테이블

---

## 📋 데이터 마이그레이션 기록

### ✅ 완료된 작업

| 작업 | 날짜 | 스크립트 | 상태 |
|------|------|---------|------|
| 테라피스트 40명 등록 | 2026-06-05 | therapists.ts | ✅ 완료 |
| 마사지 서비스 32개 등록 | 2026-06-05 | import_massage_services_final.py | ✅ 완료 |
| 업체 정보 26개 등록 | 2026-06-05 | import_companies.py | ✅ 완료 (22/26) |
| 예약 데이터 동기화 | 2026-06-05 | BookingSheetTable.tsx | ✅ 진행 중 |

---

## 🔧 데이터 접근 방식

### 테라피스트
```typescript
// 로컬 파일에서 로드
import { therapistRecords } from '@/lib/data/therapists';
```

### 마사지 서비스
```typescript
// Supabase에서 로드
const { data } = await supabase
  .from('massage_services')
  .select('*')
  .eq('is_active', true);
```

### 업체
```typescript
// Supabase에서 로드
const companies = await getCompanies();
```

### 예약
```typescript
// Supabase에서 로드/저장
const { data } = await supabase
  .from('bookings')
  .select('*')
  .eq('date', targetDate);
```

---

## 📊 데이터 통계

### 테라피스트 분포
- **1ST Shift**: 18명 (45%) - 40% 수수료
- **2ND Shift**: 18명 (45%) - 45% 수수료
- **3RD Shift**: 4명 (10%) - 50% 수수료

### 마사지 서비스 분포
- **기본 마사지**: 18개 (56.3%)
- **특화 마사지**: 14개 (43.7%)

### 업체 분포
- **여행사**: 4개 (15.4%)
- **가이드 서비스**: 1개 (3.8%)
- **투어/패키지**: 21개 (80.8%)

---

## 🚀 배포 현황

### 환경 변수
```env
NEXT_PUBLIC_SUPABASE_URL=<설정됨>
NEXT_PUBLIC_SUPABASE_KEY=<설정됨>
NEXT_PUBLIC_API_URL=<설정됨>
```

### 테이블 상태
- `therapists` - ✅ 미사용 (로컬)
- `massage_services` - ✅ 32개 등록됨
- `companies` - ✅ 22-26개 등록됨
- `bookings` - ✅ 동기화 중

---

## 📝 향후 계획

- [ ] 업체 정보 26개 전부 등록 확인 (현재 22개)
- [ ] 예약 데이터 Excel 내보내기 통합 확인
- [ ] 비용/결제 시스템 Supabase 완전 마이그레이션
- [ ] 월정산 기능 구현
- [ ] 리포팅 대시보드 추가

---

**Last Updated**: 2026-06-05
**Maintained By**: ElSpa Development Team
