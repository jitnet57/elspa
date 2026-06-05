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
-- 5) sss_brackets 시드 (필리핀 SSS 2024 정규(Regular SS) 스케줄 기준)
-- ------------------------------------------------------------
-- ⚠️ 본 시드는 2024 SSS 정규(Regular SS) 기여 스케줄(Contribution
--    Schedule)을 근사한 값입니다. EC(고용보상기여) 및 MPF(WISP/
--    Mandatory Provident Fund) 분담분은 제외하였으며, 총 기여율 14%
--    (직원 4.5% + 사업주 9.5%)만 반영합니다.
-- ⚠️ MSC(월 급여 크레딧) 4,000 미만은 4,000으로 처리하고, 이후 500
--    단위로 30,000까지 적용합니다.
-- ⚠️ SSS 기여율/구간은 시행 시점·연도·정부 고시에 따라 변경될 수
--    있으므로, 운영 적용 전 반드시 최신 공식 SSS Contribution
--    Schedule 과 대조하여 검증하시기 바랍니다.
-- ⚠️ 면책: 본 데이터는 참고용 근사치이며 법적·회계적 정확성을 보장
--    하지 않습니다. 실제 급여·세무 처리에 대한 책임은 사용자(운영자)
--    에게 있으며, 작성자는 어떠한 법적 책임도 지지 않습니다.
-- ------------------------------------------------------------
-- 계산식:
--   msc            = generate_series(4000, 30000, 500)  -- 53개
--   salary_from    = msc - 250  (최저 구간은 0)
--   salary_to      = msc + 250  (최고 구간은 999999)
--   employee_share = msc * 0.045   (직원 4.5%)
--   employer_share = msc * 0.095   (사업주 9.5%)
-- ============================================================
insert into public.sss_brackets (salary_from, salary_to, employee_share, employer_share)
select
  case when msc = 4000  then 0      else msc - 250 end                 as salary_from,
  case when msc = 30000 then 999999 else msc + 250 end                 as salary_to,
  round(msc * 0.045, 2)                                                as employee_share,
  round(msc * 0.095, 2)                                                as employer_share
from generate_series(4000, 30000, 500) as msc
where not exists (select 1 from public.sss_brackets);
