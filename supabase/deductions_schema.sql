-- ============================================================
-- 📌 Supabase 스키마: Deductions(급여 공제/선지급 추가분)
-- 📋 목적: 백엔드 없이 프론트가 직접 사용 (Postgres/Supabase 정식 문법)
-- 📅 작성일: 2026-05-31
-- ⚠️ supabase/payroll_companies_schema.sql 실행 이후에 실행하세요.
--    (employees 테이블 및 touch_updated_at() 함수 의존)
-- ⚠️ RLS: anon 읽기/쓰기 허용(내부 단말 가정). 외부 공개 시 인증 정책으로 교체.
-- ============================================================

-- updated_at 자동 갱신 함수 (이미 있으면 재정의)
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ============================================================
-- 1) employees 테이블에 SSS 번호 컬럼 추가
--    (employees 가 아직 없을 수도 있으니 DO 블록으로 예외 무시)
-- ============================================================
do $$ begin
  alter table public.employees add column if not exists sss_no text;
exception when undefined_table then null; end $$;

-- ============================================================
-- 2) 신규 테이블
-- ============================================================

-- 2A) SSS 급여구간표 (필리핀 SSS contribution table)
create table if not exists public.sss_brackets (
  id              bigint generated always as identity primary key,
  salary_from     numeric not null,   -- 구간 하한 (MSC 기준)
  salary_to       numeric not null,   -- 구간 상한
  employee_share  numeric not null,   -- 근로자 부담분
  employer_share  numeric not null,   -- 사용자 부담분
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_sss_brackets_range on public.sss_brackets (salary_from, salary_to);

-- 2B) 보건검진 실비 원장 (health check 실비 차감 내역)
create table if not exists public.health_check_logs (
  id           bigint generated always as identity primary key,
  employee_id  bigint references public.employees(id) on delete cascade,
  check_date   date,
  amount       numeric,
  note         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_health_check_emp on public.health_check_logs (employee_id, check_date);

-- 2C) 13개월 선지급 원장 (13th month pay 선지급 내역)
create table if not exists public.thirteenth_month_advances (
  id           bigint generated always as identity primary key,
  employee_id  bigint references public.employees(id) on delete cascade,
  pay_date     date,
  amount       numeric,
  note         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_13th_advance_emp on public.thirteenth_month_advances (employee_id, pay_date);

-- ============================================================
-- 3) updated_at 트리거 (신규 3개 테이블)
-- ============================================================
do $$
declare t text;
begin
  foreach t in array array[
    'sss_brackets','health_check_logs','thirteenth_month_advances'
  ] loop
    execute format('drop trigger if exists trg_%1$s_touch on public.%1$s;', t);
    execute format('create trigger trg_%1$s_touch before update on public.%1$s
                    for each row execute function public.touch_updated_at();', t);
  end loop;
end $$;

-- ============================================================
-- 4) RLS (anon 읽기/쓰기 — 내부 단말 가정. 외부 공개 시 교체)
-- ============================================================
do $$
declare t text;
begin
  foreach t in array array[
    'sss_brackets','health_check_logs','thirteenth_month_advances'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists anon_all_%1$s on public.%1$s;', t);
    execute format('create policy anon_all_%1$s on public.%1$s for all to anon using (true) with check (true);', t);
  end loop;
end $$;

-- ============================================================
-- 5) sss_brackets 시드 (필리핀 SSS 2024 기준 근사값)
-- ⚠️ 근사값입니다 — 실제 법정 SSS contribution table 과 정확히 일치하지
--    않을 수 있으므로 운영 전 최신 공식표로 검토/교체 필요.
-- ============================================================
insert into public.sss_brackets (salary_from, salary_to, employee_share, employer_share)
select * from (values
  (0,        4250,    180.00,  390.00),
  (4250,     8250,    315.00,  675.00),
  (8250,     12250,   495.00,  1035.00),
  (12250,    16250,   675.00,  1395.00),
  (16250,    20250,   855.00,  1755.00),
  (20250,    24250,   1035.00, 2115.00),
  (24250,    28250,   1215.00, 2475.00),
  (28250,    999999,  1350.00, 2730.00)
) as v(salary_from, salary_to, employee_share, employer_share)
where not exists (select 1 from public.sss_brackets);
