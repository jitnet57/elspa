-- ============================================================
-- 🔧 Fix: 기존 code 데이터 초기화 후 재생성
-- ============================================================

-- 1️⃣ beds 테이블: 기존 코드 초기화
UPDATE public.beds SET code = NULL;

-- 2️⃣ beds 다시 생성 (id 기반, bed_number 아님)
WITH ranked_beds AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
  FROM public.beds
)
UPDATE public.beds
SET code = 'BED-' || LPAD(rb.rn::text, 3, '0')
FROM ranked_beds rb
WHERE beds.id = rb.id;

-- 3️⃣ companies 테이블: 기존 코드 초기화
UPDATE public.companies SET code = NULL;

-- 4️⃣ companies 재생성
WITH ranked_companies AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
  FROM public.companies
)
UPDATE public.companies
SET code = 'COM-' || LPAD(rc.rn::text, 3, '0')
FROM ranked_companies rc
WHERE companies.id = rc.id;

-- 5️⃣ bookings 테이블: 기존 코드 초기화
UPDATE public.bookings SET code = NULL;

-- 6️⃣ bookings 재생성
WITH ranked_bookings AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
  FROM public.bookings
)
UPDATE public.bookings
SET code = 'BKG-' || LPAD(rb.rn::text, 3, '0')
FROM ranked_bookings rb
WHERE bookings.id = rb.id;

-- 7️⃣ employees 테이블: 기존 코드 초기화
UPDATE public.employees SET code = NULL;

-- 8️⃣ employees 재생성
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
)
UPDATE public.employees
SET code = re.prefix || '-' || LPAD(re.rn::text, 3, '0')
FROM ranked_employees re
WHERE employees.id = re.id;

-- 9️⃣ massage_services 테이블: 기존 코드 초기화
UPDATE public.massage_services SET code = NULL;

-- 🔟 massage_services 재생성
WITH ranked_services AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
  FROM public.massage_services
)
UPDATE public.massage_services
SET code = 'SVC-' || LPAD(rs.rn::text, 3, '0')
FROM ranked_services rs
WHERE massage_services.id = rs.id;

-- ✅ 완료
SELECT
  'Employees' as table_name, COUNT(*) as count, COUNT(DISTINCT code) as codes
FROM public.employees
WHERE code IS NOT NULL
UNION ALL
SELECT 'Companies', COUNT(*), COUNT(DISTINCT code)
FROM public.companies
WHERE code IS NOT NULL
UNION ALL
SELECT 'Bookings', COUNT(*), COUNT(DISTINCT code)
FROM public.bookings
WHERE code IS NOT NULL
UNION ALL
SELECT 'Beds', COUNT(*), COUNT(DISTINCT code)
FROM public.beds
WHERE code IS NOT NULL
UNION ALL
SELECT 'Services', COUNT(*), COUNT(DISTINCT code)
FROM public.massage_services
WHERE code IS NOT NULL;
