-- ============================================================
-- 📌 마이그레이션: 모든 테이블에 고유 코드(code) 컬럼 추가
-- 📋 Format: 타입별 프리픽스 + 시퀀스 (THR-001, COM-001, BKG-001, ...)
-- 📅 작성일: 2026-06-06
-- ============================================================

-- 1️⃣ employees 테이블에 code 컬럼 추가
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS code text unique;

-- code 자동 생성 함수 (employees용)
CREATE OR REPLACE FUNCTION public.generate_employee_code()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  type_prefix text;
  next_seq integer;
BEGIN
  -- employee_type 기반 프리픽스
  CASE NEW.employee_type
    WHEN 'therapist' THEN type_prefix := 'THR';
    WHEN 'driver' THEN type_prefix := 'DRV';
    WHEN 'manager' THEN type_prefix := 'MGR';
    WHEN 'nail' THEN type_prefix := 'NAL';
    WHEN 'maintenance' THEN type_prefix := 'MAI';
    WHEN 'hollys' THEN type_prefix := 'HOL';
    ELSE type_prefix := 'STF';
  END CASE;

  -- 같은 타입의 다음 시퀀스 번호
  SELECT COUNT(*) + 1 INTO next_seq
  FROM public.employees
  WHERE employee_type = NEW.employee_type AND code IS NOT NULL;

  NEW.code := type_prefix || '-' || LPAD(next_seq::text, 3, '0');
  RETURN NEW;
END $$;

-- 트리거 생성 (INSERT 시 code 자동 생성)
DROP TRIGGER IF EXISTS trg_employee_code ON public.employees;
CREATE TRIGGER trg_employee_code
BEFORE INSERT ON public.employees
FOR EACH ROW
WHEN (NEW.code IS NULL)
EXECUTE FUNCTION public.generate_employee_code();

-- 기존 직원 데이터에 코드 생성 (CTE 사용)
WITH ranked_employees AS (
  SELECT
    id,
    employee_type,
    ROW_NUMBER() OVER (PARTITION BY employee_type ORDER BY id) as rn,
    CASE employee_type
      WHEN 'therapist' THEN 'THR'
      WHEN 'driver' THEN 'DRV'
      WHEN 'manager' THEN 'MGR'
      WHEN 'nail' THEN 'NAL'
      WHEN 'maintenance' THEN 'MAI'
      WHEN 'hollys' THEN 'HOL'
      ELSE 'STF'
    END as prefix
  FROM public.employees
  WHERE code IS NULL
)
UPDATE public.employees
SET code = re.prefix || '-' || LPAD(re.rn::text, 3, '0')
FROM ranked_employees re
WHERE employees.id = re.id;

-- ============================================================

-- 2️⃣ companies 테이블에 code 컬럼 추가
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS code text unique;

-- code 자동 생성 함수 (companies용)
CREATE OR REPLACE FUNCTION public.generate_company_code()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  next_seq integer;
BEGIN
  SELECT COUNT(*) + 1 INTO next_seq FROM public.companies WHERE code IS NOT NULL;
  NEW.code := 'COM-' || LPAD(next_seq::text, 3, '0');
  RETURN NEW;
END $$;

-- 트리거 생성
DROP TRIGGER IF EXISTS trg_company_code ON public.companies;
CREATE TRIGGER trg_company_code
BEFORE INSERT ON public.companies
FOR EACH ROW
WHEN (NEW.code IS NULL)
EXECUTE FUNCTION public.generate_company_code();

-- 기존 회사 데이터에 코드 생성
WITH ranked_companies AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
  FROM public.companies
  WHERE code IS NULL
)
UPDATE public.companies
SET code = 'COM-' || LPAD(rc.rn::text, 3, '0')
FROM ranked_companies rc
WHERE companies.id = rc.id;

-- ============================================================

-- 3️⃣ bookings 테이블에 code 컬럼 추가
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS code text unique;

-- code 자동 생성 함수 (bookings용)
CREATE OR REPLACE FUNCTION public.generate_booking_code()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  next_seq integer;
BEGIN
  SELECT COUNT(*) + 1 INTO next_seq FROM public.bookings WHERE code IS NOT NULL;
  NEW.code := 'BKG-' || LPAD(next_seq::text, 3, '0');
  RETURN NEW;
END $$;

-- 트리거 생성
DROP TRIGGER IF EXISTS trg_booking_code ON public.bookings;
CREATE TRIGGER trg_booking_code
BEFORE INSERT ON public.bookings
FOR EACH ROW
WHEN (NEW.code IS NULL)
EXECUTE FUNCTION public.generate_booking_code();

-- 기존 예약 데이터에 코드 생성
WITH ranked_bookings AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
  FROM public.bookings
  WHERE code IS NULL
)
UPDATE public.bookings
SET code = 'BKG-' || LPAD(rb.rn::text, 3, '0')
FROM ranked_bookings rb
WHERE bookings.id = rb.id;

-- ============================================================

-- 4️⃣ beds 테이블에 code 컬럼 추가
ALTER TABLE public.beds ADD COLUMN IF NOT EXISTS code text unique;

-- code 자동 생성 함수 (beds용)
CREATE OR REPLACE FUNCTION public.generate_bed_code()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.code := 'BED-' || LPAD(NEW.bed_number::text, 3, '0');
  RETURN NEW;
END $$;

-- 트리거 생성
DROP TRIGGER IF EXISTS trg_bed_code ON public.beds;
CREATE TRIGGER trg_bed_code
BEFORE INSERT ON public.beds
FOR EACH ROW
WHEN (NEW.code IS NULL)
EXECUTE FUNCTION public.generate_bed_code();

-- 기존 침대 데이터에 코드 생성 (bed_number 기반)
UPDATE public.beds
SET code = 'BED-' || LPAD(bed_number::text, 3, '0')
WHERE code IS NULL AND bed_number IS NOT NULL;

-- ============================================================

-- 5️⃣ massage_services 테이블에 code 컬럼 추가
ALTER TABLE public.massage_services ADD COLUMN IF NOT EXISTS code text unique;

-- code 자동 생성 함수 (services용)
CREATE OR REPLACE FUNCTION public.generate_service_code()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  next_seq integer;
BEGIN
  SELECT COUNT(*) + 1 INTO next_seq FROM public.massage_services WHERE code IS NOT NULL;
  NEW.code := 'SVC-' || LPAD(next_seq::text, 3, '0');
  RETURN NEW;
END $$;

-- 트리거 생성
DROP TRIGGER IF EXISTS trg_service_code ON public.massage_services;
CREATE TRIGGER trg_service_code
BEFORE INSERT ON public.massage_services
FOR EACH ROW
WHEN (NEW.code IS NULL)
EXECUTE FUNCTION public.generate_service_code();

-- 기존 서비스 데이터에 코드 생성
WITH ranked_services AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
  FROM public.massage_services
  WHERE code IS NULL
)
UPDATE public.massage_services
SET code = 'SVC-' || LPAD(rs.rn::text, 3, '0')
FROM ranked_services rs
WHERE massage_services.id = rs.id;

-- ============================================================
-- ✅ 완료: 모든 테이블에 자동 고유 코드 생성 시스템 적용됨
-- ============================================================
