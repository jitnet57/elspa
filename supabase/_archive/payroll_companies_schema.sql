-- ============================================================
-- 📌 Supabase 스키마: Payroll(급여) + Companies(업체/가이드/월정산)
-- 📋 목적: 백엔드 없이 프론트가 직접 사용 (Postgres/Supabase 정식 문법)
-- 📅 작성일: 2026-05-31
-- ⚠️ docs/payroll_schema.sql 은 MySQL 문법(AUTO_INCREMENT 등)이라 Supabase에서 실행 불가.
--    이 파일이 그 Postgres 대체본입니다. supabase/schema.sql(모니터) 다음에 실행.
-- ⚠️ RLS: anon 읽기/쓰기 허용(내부 단말 가정). 외부 공개 시 인증 정책으로 교체.
-- ============================================================

-- updated_at 자동 갱신 함수 (이미 있으면 재정의)
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ============================================================
-- PART A. PAYROLL (급여 정산)
-- ============================================================

-- A1) 직원 마스터
create table if not exists public.employees (
  id              bigint generated always as identity primary key,
  name            text not null,
  phone           text,
  employee_type   text not null default 'therapist'
                  check (employee_type in ('therapist','driver','manager','nail','maintenance','hollys')),
  pay_group       text not null default 'weekly'
                  check (pay_group in ('weekly','biweekly')),
  base_salary     numeric(12,2) not null default 0 check (base_salary >= 0),
  commission_rate numeric(5,2)  not null default 0 check (commission_rate >= 0),
  hire_date       date,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_employees_type_active on public.employees (employee_type, is_active, pay_group);

-- A2) 급여 정산 기간
create table if not exists public.payroll_periods (
  id           bigint generated always as identity primary key,
  period_start date not null,
  period_end   date not null,
  pay_group    text not null check (pay_group in ('weekly','biweekly')),
  status       text not null default 'draft' check (status in ('draft','approved','paid')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_payroll_period_status on public.payroll_periods (pay_group, status);

-- A3) 현금 선지급 (CA)
create table if not exists public.cash_advances (
  id                 bigint generated always as identity primary key,
  employee_id        bigint not null references public.employees(id) on delete cascade,
  amount             numeric(12,2) not null check (amount >= 0),
  request_date       date not null default current_date,
  reason             text,
  status             text not null default 'pending'
                     check (status in ('pending','approved','rejected','settled')),
  settled_payroll_id bigint,   -- payroll_records.id (정산 후 연결)
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists idx_cash_advance_emp_status on public.cash_advances (employee_id, status);

-- A4) 출퇴근 기록
create table if not exists public.attendance_logs (
  id               bigint generated always as identity primary key,
  employee_id      bigint not null references public.employees(id) on delete cascade,
  work_date        date not null,
  clock_in         text,   -- "HH:MM"
  clock_out        text,   -- "HH:MM"
  late_minutes     integer not null default 0,
  overtime_minutes integer not null default 0,
  is_absent        boolean not null default false,
  holiday_type     text not null default 'none' check (holiday_type in ('none','national','special')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (employee_id, work_date)
);
create index if not exists idx_attendance_emp_date on public.attendance_logs (employee_id, work_date);

-- A5) 필리핀 공휴일
create table if not exists public.philippine_holidays (
  id              bigint generated always as identity primary key,
  holiday_date    date not null unique,
  holiday_name    text not null,
  holiday_type    text not null check (holiday_type in ('national','special')),
  rate_multiplier numeric(3,2) not null,   -- national=2.00, special=1.30
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- A6) 개인별 정산 결과
create table if not exists public.payroll_records (
  id                          bigint generated always as identity primary key,
  payroll_period_id           bigint not null references public.payroll_periods(id) on delete cascade,
  employee_id                 bigint not null references public.employees(id) on delete cascade,
  -- 수입
  base_amount                 numeric(12,2) not null default 0,
  commission_amount           numeric(12,2) not null default 0,
  overtime_amount             numeric(12,2) not null default 0,
  holiday_bonus               numeric(12,2) not null default 0,
  meal_allowance              numeric(12,2) not null default 0,
  -- 차감
  late_deduction              numeric(12,2) not null default 0,
  absence_deduction           numeric(12,2) not null default 0,
  sss_deduction               numeric(12,2) not null default 0,
  ca_deduction                numeric(12,2) not null default 0,
  health_check_deduction      numeric(12,2) not null default 0,
  thirteenth_month_deduction  numeric(12,2) not null default 0,
  thirteenth_month_accrual    numeric(12,2) not null default 0,
  -- 최종
  gross_pay                   numeric(12,2) not null default 0 check (gross_pay >= 0),
  total_deductions            numeric(12,2) not null default 0 check (total_deductions >= 0),
  net_pay                     numeric(12,2) not null default 0 check (net_pay >= 0),
  status                      text not null default 'draft' check (status in ('draft','approved','paid')),
  notes                       text,
  is_obsolete                 boolean not null default false,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);
create index if not exists idx_payroll_rec_period_emp on public.payroll_records (payroll_period_id, employee_id, status);
create index if not exists idx_payroll_rec_obsolete on public.payroll_records (is_obsolete);

-- cash_advances.settled_payroll_id → payroll_records.id (테이블 생성 후 FK 추가)
do $$ begin
  alter table public.cash_advances
    add constraint fk_ca_settled_payroll
    foreign key (settled_payroll_id) references public.payroll_records(id) on delete set null;
exception when duplicate_object then null; end $$;

-- ============================================================
-- PART B. COMPANIES (업체 / 가이드 / 월정산)
-- ============================================================

-- B1) 업체
create table if not exists public.companies (
  id              bigint generated always as identity primary key,
  name            text not null,
  representative  text,
  phone           text,
  address         text,
  settlement_day  integer,                 -- 매월 정산일
  commission_rate numeric(5,2) default 0,  -- %
  status          text not null default 'active' check (status in ('active','inactive')),
  gcash_number    text,
  bank_name       text,
  bank_account    text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- B2) 가이드 (업체 소속)
create table if not exists public.guides (
  id          bigint generated always as identity primary key,
  name        text not null,
  company_id  bigint references public.companies(id) on delete cascade,
  commission_rate numeric(5,2) default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_guides_company on public.guides (company_id);

-- B3) 월정산
create table if not exists public.monthly_settlements (
  id                bigint generated always as identity primary key,
  company_id        bigint not null references public.companies(id) on delete cascade,
  guide_id          bigint references public.guides(id) on delete set null,
  settlement_month  text not null,         -- "YYYY-MM"
  settlement_date   date,
  total_sessions    integer not null default 0,
  total_revenue     numeric(14,2) not null default 0,
  commission_rate   numeric(5,2) not null default 0,
  commission_amount numeric(14,2) not null default 0,
  payment_amount    numeric(14,2) not null default 0,
  service_breakdown jsonb not null default '{}'::jsonb,  -- {swedish:{sessions,revenue},...}
  status            text not null default 'pending' check (status in ('pending','confirmed','paid')),
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_settlement_company_month on public.monthly_settlements (company_id, settlement_month);

-- ============================================================
-- updated_at 트리거 (전 테이블)
-- ============================================================
do $$
declare t text;
begin
  foreach t in array array[
    'employees','payroll_periods','cash_advances','attendance_logs',
    'philippine_holidays','payroll_records','companies','guides','monthly_settlements'
  ] loop
    execute format('drop trigger if exists trg_%1$s_touch on public.%1$s;', t);
    execute format('create trigger trg_%1$s_touch before update on public.%1$s
                    for each row execute function public.touch_updated_at();', t);
  end loop;
end $$;

-- ============================================================
-- RLS (anon 읽기/쓰기 — 내부 단말 가정. 외부 공개 시 교체)
-- ============================================================
do $$
declare t text;
begin
  foreach t in array array[
    'employees','payroll_periods','cash_advances','attendance_logs',
    'philippine_holidays','payroll_records','companies','guides','monthly_settlements'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists anon_all_%1$s on public.%1$s;', t);
    execute format('create policy anon_all_%1$s on public.%1$s for all to anon using (true) with check (true);', t);
  end loop;
end $$;
