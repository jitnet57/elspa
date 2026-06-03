-- ============================================================
-- 🗑️  ElSpa 데이터베이스 초기화 SQL
-- 📌 Beds & Massage_services 제외 모든 데이터 삭제
-- 📅 작성일: 2026-06-03
-- ⚠️  실행 전 반드시 백업 확인!
-- ============================================================

-- 주의: 외래 키 제약 때문에 순서가 중요합니다
-- 자식 테이블 먼저 삭제 → 부모 테이블 삭제

BEGIN; -- 트랜잭션 시작 (실패 시 전체 롤백)

-- ============================================================
-- Step 1: 직원 관련 데이터 삭제 (employees 참조)
-- ============================================================

-- 1-1) payroll_records (급여 기록) 삭제
DELETE FROM public.payroll_records;
ALTER TABLE public.payroll_records AUTO_INCREMENT = 1;
COMMIT;
BEGIN;

-- 1-2) attendance_records (출결 기록) 삭제
DELETE FROM public.attendance_records;
ALTER TABLE public.attendance_records AUTO_INCREMENT = 1;
COMMIT;
BEGIN;

-- 1-3) cash_advance_requests (급전 신청) 삭제
DELETE FROM public.cash_advance_requests;
ALTER TABLE public.cash_advance_requests AUTO_INCREMENT = 1;
COMMIT;
BEGIN;

-- 1-4) deduction_records (공제 기록) 삭제
DELETE FROM public.deduction_records;
ALTER TABLE public.deduction_records AUTO_INCREMENT = 1;
COMMIT;
BEGIN;

-- 1-5) settlements (정산 기록) 삭제
DELETE FROM public.settlements;
ALTER TABLE public.settlements AUTO_INCREMENT = 1;
COMMIT;
BEGIN;

-- ============================================================
-- Step 2: 예약 데이터 삭제 (bookings)
-- ============================================================
DELETE FROM public.bookings;
ALTER TABLE public.bookings AUTO_INCREMENT = 1;
COMMIT;
BEGIN;

-- ============================================================
-- Step 3: 비용 데이터 삭제 (expenses)
-- ============================================================
DELETE FROM public.expenses;
ALTER TABLE public.expenses AUTO_INCREMENT = 1;
COMMIT;
BEGIN;

-- ============================================================
-- Step 4: 직원 데이터 삭제 (employees)
-- ============================================================
DELETE FROM public.employees;
ALTER TABLE public.employees AUTO_INCREMENT = 1;
COMMIT;
BEGIN;

-- ============================================================
-- Step 5: 테라피스트 데이터 삭제 (therapists)
-- ============================================================
DELETE FROM public.therapists;
ALTER TABLE public.therapists AUTO_INCREMENT = 1;
COMMIT;
BEGIN;

-- ============================================================
-- Step 6: 회사 정보 삭제 (companies)
-- ============================================================
DELETE FROM public.companies;
ALTER TABLE public.companies AUTO_INCREMENT = 1;
COMMIT;

-- ============================================================
-- ✅ 확인 쿼리
-- ============================================================
SELECT
  'beds' as table_name, COUNT(*) as row_count FROM public.beds
UNION ALL
SELECT 'massage_services', COUNT(*) FROM public.massage_services
UNION ALL
SELECT 'therapists', COUNT(*) FROM public.therapists
UNION ALL
SELECT 'bookings', COUNT(*) FROM public.bookings
UNION ALL
SELECT 'employees', COUNT(*) FROM public.employees
UNION ALL
SELECT 'companies', COUNT(*) FROM public.companies
UNION ALL
SELECT 'expenses', COUNT(*) FROM public.expenses
UNION ALL
SELECT 'settlements', COUNT(*) FROM public.settlements
UNION ALL
SELECT 'payroll_records', COUNT(*) FROM public.payroll_records
UNION ALL
SELECT 'attendance_records', COUNT(*) FROM public.attendance_records
UNION ALL
SELECT 'cash_advance_requests', COUNT(*) FROM public.cash_advance_requests
UNION ALL
SELECT 'deduction_records', COUNT(*) FROM public.deduction_records
ORDER BY table_name;
