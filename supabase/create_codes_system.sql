-- ============================================================
-- 📌 고유 코드 시스템 설치 (모든 단계 통합)
-- ============================================================

-- ✅ Step 1: 컬럼 생성
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS code text unique;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS code text unique;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS code text unique;
ALTER TABLE public.beds ADD COLUMN IF NOT EXISTS code text unique;
ALTER TABLE public.massage_services ADD COLUMN IF NOT EXISTS code text unique;

-- ============================================================
-- ✅ Step 2: 트리거 함수 생성
-- ============================================================

-- employees용 함수
CREATE OR REPLACE FUNCTION public.generate_employee_code()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  type_prefix text;
  next_seq integer;
BEGIN
  CASE NEW.employee_type
    WHEN 'therapist' THEN type_prefix := 'THR';
    WHEN 'driver' THEN type_prefix := 'DRV';
    WHEN 'manager' THEN type_prefix := 'MGR';
    WHEN 'nail' THEN type_prefix := 'NAL';
    WHEN 'maintenance' THEN type_prefix := 'MAI';
    WHEN 'hollys' THEN type_prefix := 'HOL';
    ELSE type_prefix := 'STF';
  END CASE;

  SELECT COUNT(*) + 1 INTO next_seq
  FROM public.employees
  WHERE employee_type = NEW.employee_type AND code IS NOT NULL;

  NEW.code := type_prefix || '-' || LPAD(next_seq::text, 3, '0');
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_employee_code ON public.employees;
CREATE TRIGGER trg_employee_code
BEFORE INSERT ON public.employees
FOR EACH ROW
WHEN (NEW.code IS NULL)
EXECUTE FUNCTION public.generate_employee_code();

-- companies용 함수
CREATE OR REPLACE FUNCTION public.generate_company_code()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  next_seq integer;
BEGIN
  SELECT COUNT(*) + 1 INTO next_seq FROM public.companies WHERE code IS NOT NULL;
  NEW.code := 'COM-' || LPAD(next_seq::text, 3, '0');
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_company_code ON public.companies;
CREATE TRIGGER trg_company_code
BEFORE INSERT ON public.companies
FOR EACH ROW
WHEN (NEW.code IS NULL)
EXECUTE FUNCTION public.generate_company_code();

-- bookings용 함수
CREATE OR REPLACE FUNCTION public.generate_booking_code()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  next_seq integer;
BEGIN
  SELECT COUNT(*) + 1 INTO next_seq FROM public.bookings WHERE code IS NOT NULL;
  NEW.code := 'BKG-' || LPAD(next_seq::text, 3, '0');
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_booking_code ON public.bookings;
CREATE TRIGGER trg_booking_code
BEFORE INSERT ON public.bookings
FOR EACH ROW
WHEN (NEW.code IS NULL)
EXECUTE FUNCTION public.generate_booking_code();

-- beds용 함수
CREATE OR REPLACE FUNCTION public.generate_bed_code()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.code := 'BED-' || LPAD(NEW.id::text, 3, '0');
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_bed_code ON public.beds;
CREATE TRIGGER trg_bed_code
BEFORE INSERT ON public.beds
FOR EACH ROW
WHEN (NEW.code IS NULL)
EXECUTE FUNCTION public.generate_bed_code();

-- services용 함수
CREATE OR REPLACE FUNCTION public.generate_service_code()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  next_seq integer;
BEGIN
  SELECT COUNT(*) + 1 INTO next_seq FROM public.massage_services WHERE code IS NOT NULL;
  NEW.code := 'SVC-' || LPAD(next_seq::text, 3, '0');
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_service_code ON public.massage_services;
CREATE TRIGGER trg_service_code
BEFORE INSERT ON public.massage_services
FOR EACH ROW
WHEN (NEW.code IS NULL)
EXECUTE FUNCTION public.generate_service_code();

-- ============================================================
-- ✅ Step 3: 기존 데이터에 코드 생성
-- ============================================================

-- employees (NULL인 것만 생성)
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

-- companies (NULL인 것만 생성)
WITH ranked_companies AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
  FROM public.companies
  WHERE code IS NULL
)
UPDATE public.companies
SET code = 'COM-' || LPAD(rc.rn::text, 3, '0')
FROM ranked_companies rc
WHERE companies.id = rc.id;

-- bookings (NULL인 것만 생성)
WITH ranked_bookings AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
  FROM public.bookings
  WHERE code IS NULL
)
UPDATE public.bookings
SET code = 'BKG-' || LPAD(rb.rn::text, 3, '0')
FROM ranked_bookings rb
WHERE bookings.id = rb.id;

-- beds (NULL인 것만 생성)
WITH ranked_beds AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
  FROM public.beds
  WHERE code IS NULL
)
UPDATE public.beds
SET code = 'BED-' || LPAD(rb.rn::text, 3, '0')
FROM ranked_beds rb
WHERE beds.id = rb.id;

-- services (NULL인 것만 생성)
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
-- ✅ 검증: 생성된 코드 확인
-- ============================================================

SELECT '👥 Employees' as item, COUNT(*) as total, COUNT(code) as with_code FROM public.employees
UNION ALL
SELECT '🏢 Companies', COUNT(*), COUNT(code) FROM public.companies
UNION ALL
SELECT '📅 Bookings', COUNT(*), COUNT(code) FROM public.bookings
UNION ALL
SELECT '🛏️ Beds', COUNT(*), COUNT(code) FROM public.beds
UNION ALL
SELECT '💆 Services', COUNT(*), COUNT(code) FROM public.massage_services;
