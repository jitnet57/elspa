# Supabase 초기화 가이드

## 📋 작업 순서

### Phase 1️⃣: Supabase 테이블 생성

#### 단계 1: Supabase 콘솔 접속
1. [Supabase Dashboard](https://app.supabase.com) 접속
2. 프로젝트 "elspa" 선택
3. **SQL Editor** 메뉴 클릭

#### 단계 2: SQL 스크립트 실행
1. `SUPABASE_SCHEMA.sql` 파일 전체 복사
2. SQL Editor에 붙여넣기
3. **Run** 버튼 클릭
4. 스크립트 실행 완료 확인

```sql
-- SUPABASE_SCHEMA.sql 내용 전체 실행
-- 21개 테이블 + 인덱스 + 트리거 + RLS + SSS 구간 시드 (이 파일 하나면 끝)
```

**생성되는 테이블 (21개, 프론트 전수 대응):**
- 코어/모니터/대시보드: `employees` `beds` `massage_services` `companies` `bookings` `massage_bookings` `expenses` `expense_records`
- 급여(payroll): `payroll_periods` `cash_advances` `attendance_logs` `philippine_holidays` `payroll_records`
- 업체정산: `guides` `monthly_settlements`
- 공제/선지급: `sss_brackets` `health_check_logs` `thirteenth_month_advances`
- 기타: `sss_records` `management_metrics` `app_settings`

> 🔗 기존 `supabase/*.sql`(10개)을 이 단일 파일로 통합했습니다. **이 파일 하나만 Run** 하면 됩니다.
> employees·companies·bookings는 흩어져 있던 정의를 **superset(통합 컬럼)** 으로 합쳐 충돌을 제거했습니다.

---

### Phase 2️⃣: 초기 데이터 삽입

#### 단계 1: Python 스크립트 실행
```bash
cd /Users/kwangseobpark/elspa
python3 scripts/20250605-supabase-init-data.py
```

**삽입되는 데이터:**
- 테라피스트 40명
  - 1ST: 18명 (40% 수수료)
  - 2ND: 18명 (45% 수수료)
  - 3RD: 4명 (50% 수수료)
- 침대 4개
  - Massage Room 1-2
  - VIP Room
  - Other Room

#### 단계 2: 확인
Supabase 콘솔에서:
1. **Table Editor** 클릭
2. `employees` → 40명 등록 확인
3. `beds` → 4개 등록 확인

---

### Phase 3️⃣: 백엔드 API 엔드포인트 구현

대시보드에서 필요한 엔드포인트:

#### 1. 마사지 예약 조회
```
GET /api/massage-bookings/revenue/range?start=2026-06-05&end=2026-06-05
Response: { total: 1000, count: 5 }
```

#### 2. 지출 조회
```
GET /api/expense/range?start=2026-06-05&end=2026-06-05
Response: { total: 500, count: 3 }
```

#### 3. 예약 현황
```
GET /api/bookings/pending
Response: [{ id: 1, date: "2026-06-05", status: "pending" }, ...]
```

---

### Phase 4️⃣: 프로덕션 파일 서버 제거

#### 파일 서버 참조 제거
```bash
grep -r "localhost:5001\|file_server\|file-save" /Users/kwangseobpark/elspa/frontend/src --include="*.ts" --include="*.tsx"
```

**제거할 파일들:**
- `src/lib/hooks/useFileSave.ts`
- `src/lib/api/file-server-client.ts`
- 모든 파일 저장 관련 import 제거

---

## ✅ 체크리스트

### Supabase 테이블 생성
- [ ] SQL 스크립트 실행 완료
- [ ] 8개 테이블 생성 확인
- [ ] 인덱스 생성 확인

### 초기 데이터 삽입
- [ ] Python 스크립트 실행
- [ ] 테라피스트 40명 등록 확인
- [ ] 침대 4개 등록 확인

### 백엔드 API 구현
- [ ] `/api/massage-bookings/revenue/range` 구현
- [ ] `/api/expense/range` 구현
- [ ] `/api/bookings/pending` 구현
- [ ] 에러 핸들링 추가

### 프로덕션 최적화
- [ ] 파일 서버 참조 제거
- [ ] localhost:5001 CORS 에러 해결
- [ ] 빌드 & 배포

---

## 📝 Supabase RLS (Row Level Security) 설정 (선택)

현재는 공개 테이블이므로 필요시 나중에 추가:

```sql
-- employees: 모두 읽기 가능
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "employees_select" ON employees
  FOR SELECT USING (true);

-- bookings: 인증된 사용자만
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookings_select" ON bookings
  FOR SELECT USING (auth.role() = 'authenticated');
```

---

## 🚀 다음 단계

1. ✅ Phase 1: Supabase 테이블 생성
2. ✅ Phase 2: 초기 데이터 삽입
3. ⏳ Phase 3: 백엔드 API 구현 (다음 작업)
4. ⏳ Phase 4: 프로덕션 최적화 (다음 작업)

---

**완료일**: 2026-06-05
**상태**: Phase 1-2 준비 완료, Phase 3-4 대기 중
