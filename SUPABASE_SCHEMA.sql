-- ============================================================
-- 📌 ElSpa Supabase 통합 스키마 (단일 권위 파일)
-- 📋 프론트엔드가 실제 사용하는 21개 테이블 전부 + 인덱스 + 트리거 + RLS
-- 📅 작성일: 2026-06-05 (통합/충돌해소: employees·companies·bookings superset)
-- ▶ 실행: Supabase Dashboard → SQL Editor → 이 파일 전체 붙여넣기 → Run
-- ⚠️ 백엔드 없는 구조(프론트 직결). RLS는 anon 읽기/쓰기 허용(내부 단말 가정).
--    외부 공개 시 인증 기반 정책으로 교체할 것.
-- ⚠️ 기존 supabase/*.sql(10개)을 이 한 파일로 통합. 이 파일만 실행하면 됩니다.
-- ============================================================

-- updated_at 자동 갱신 함수 (공용)
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ============================================================
-- PART 1. 코어 / 모니터 / 대시보드
-- ============================================================

-- 1) employees (직원/테라피스트) — payroll·monitor·dashboard 통합 superset
--    ⚠️ employee_type(payroll)·employment_type(monitor) 둘 다 보유, status는
--       active/inactive/on_leave + 모니터 상태값 허용 위해 CHECK 미적용.
create table if not exists public.employees (
  id                bigint generated always as identity primary key,
  name              text not null unique,
  employee_type     text default 'therapist',   -- payroll: therapist/driver/manager/nail/maintenance/hollys
  employment_type   text,                        -- monitor: therapist/staff/manager
  pay_group         text default 'weekly',       -- weekly/biweekly
  status            text default 'active',       -- active/inactive/on_leave (+ 모니터 상태)
  base_salary       numeric(12,2) not null default 0,
  daily_wage        numeric(12,2) not null default 0,   -- 개별 일급 (직원마다 다름)
  commission_rate   numeric not null default 0.40,
  hire_date         date,
  is_active         boolean not null default true,
  department        text default 'Office',
  job_title         text default 'staff',
  phone             text,
  email             text,
  specialty         text,
  sss_no            text,
  current_bed       integer,
  remaining_minutes integer,
  checked_in_at     timestamptz,
  checked_out_at    timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_employees_type on public.employees (employee_type, is_active);

-- 2) beds (침대/마사지실)
create table if not exists public.beds (
  id             bigint generated always as identity primary key,
  bed_number     integer unique not null,
  room_zone      text not null,
  status         text default 'available' check (status in ('available','reserved','in_service','cleaning')),
  customer_name  text,
  therapist_name text,
  service_name   text,
  starts_at      timestamptz,
  ends_at        timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_beds_room on public.beds (room_zone);

-- 3) massage_services (서비스 카탈로그)
create table if not exists public.massage_services (
  id                    bigint generated always as identity primary key,
  name                  text not null,
  base_price            numeric not null,
  base_duration_minutes integer not null,
  is_active             boolean default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- 4) companies (업체) — monitor + 정산 통합 superset
create table if not exists public.companies (
  id              bigint generated always as identity primary key,
  name            text not null unique,
  representative  text,
  phone           text,
  address         text,
  settlement_day  integer,
  commission_rate numeric(5,2) default 0,
  status          text default 'active' check (status in ('active','inactive')),
  gcash_number    text,
  bank_name       text,
  bank_account    text,
  bank_holder     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 5) bookings (예약 - Monitor) — 결제수단/SSS 옵션 포함 superset
create table if not exists public.bookings (
  id              bigint generated always as identity primary key,
  booking_date    text not null,
  seq_no          integer,
  treatment       text,
  start_time      text,
  end_time        text,
  room_num        text,
  guest_name      text,
  therapist_name  text,
  note            text,
  pay             numeric,
  tip             numeric,
  payment_methods jsonb default '[]'::jsonb,
  sss_option      text check (sss_option in ('prepaid','hold')),
  payment_from    text check (payment_from in ('guest','credit','waived')),
  status          text default 'normal' check (status in ('normal','editing','deleting','deleted','error')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_bookings_date on public.bookings (booking_date);

-- 6) massage_bookings (마사지 예약 - 대시보드/커미션 원본)
create table if not exists public.massage_bookings (
  id             bigint generated always as identity primary key,
  date           text not null,
  guest_name     text,
  therapist_name text,
  service_name   text,
  service_price  numeric,
  start_time     text,
  end_time       text,
  status         text check (status in ('booked','in_progress','completed','cancelled')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_massage_bookings_date on public.massage_bookings (date);

-- 7) expenses (지출)
create table if not exists public.expenses (
  id            bigint generated always as identity primary key,
  report_date   text not null,
  vendor        text,
  expense_date  text,
  amount        numeric not null,
  currency      text default 'PHP',
  category_name text,
  items         jsonb default '[]'::jsonb,
  description   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_expenses_date on public.expenses (report_date);

-- 8) expense_records (지출 상세)
create table if not exists public.expense_records (
  id            bigint generated always as identity primary key,
  report_date   text not null,
  vendor        text,
  expense_date  text,
  amount        numeric not null,
  currency      text default 'PHP',
  category_name text,
  items         jsonb default '[]'::jsonb,
  description   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_expense_records_date on public.expense_records (report_date);

-- ============================================================
-- PART 2. PAYROLL (급여 정산)
-- ============================================================

-- 9) payroll_periods
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

-- 10) cash_advances (CA 선지급)
create table if not exists public.cash_advances (
  id                 bigint generated always as identity primary key,
  employee_id        bigint not null references public.employees(id) on delete cascade,
  amount             numeric(12,2) not null check (amount >= 0),
  request_date       date not null default current_date,
  reason             text,
  status             text not null default 'pending' check (status in ('pending','approved','rejected','settled')),
  settled_payroll_id bigint,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists idx_cash_advance_emp_status on public.cash_advances (employee_id, status);

-- 11) attendance_logs (출퇴근)
create table if not exists public.attendance_logs (
  id               bigint generated always as identity primary key,
  employee_id      bigint not null references public.employees(id) on delete cascade,
  work_date        date not null,
  clock_in         text,
  clock_out        text,
  late_minutes     integer not null default 0,
  overtime_minutes integer not null default 0,
  is_absent        boolean not null default false,
  holiday_type     text not null default 'none' check (holiday_type in ('none','national','special')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (employee_id, work_date)
);
create index if not exists idx_attendance_emp_date on public.attendance_logs (employee_id, work_date);

-- 12) philippine_holidays
create table if not exists public.philippine_holidays (
  id              bigint generated always as identity primary key,
  holiday_date    date not null unique,
  holiday_name    text not null,
  holiday_type    text not null check (holiday_type in ('national','special')),
  rate_multiplier numeric(3,2) not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 13) payroll_records (개인별 정산 결과)
create table if not exists public.payroll_records (
  id                          bigint generated always as identity primary key,
  payroll_period_id           bigint not null references public.payroll_periods(id) on delete cascade,
  employee_id                 bigint not null references public.employees(id) on delete cascade,
  base_amount                 numeric(12,2) not null default 0,
  commission_amount           numeric(12,2) not null default 0,
  overtime_amount             numeric(12,2) not null default 0,
  holiday_bonus               numeric(12,2) not null default 0,
  meal_allowance              numeric(12,2) not null default 0,
  late_deduction              numeric(12,2) not null default 0,
  absence_deduction           numeric(12,2) not null default 0,
  sss_deduction               numeric(12,2) not null default 0,
  ca_deduction                numeric(12,2) not null default 0,
  health_check_deduction      numeric(12,2) not null default 0,
  thirteenth_month_deduction  numeric(12,2) not null default 0,
  thirteenth_month_accrual    numeric(12,2) not null default 0,
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

-- cash_advances.settled_payroll_id → payroll_records.id (테이블 생성 후 FK)
do $$ begin
  alter table public.cash_advances
    add constraint fk_ca_settled_payroll
    foreign key (settled_payroll_id) references public.payroll_records(id) on delete set null;
exception when duplicate_object then null; end $$;

-- ============================================================
-- PART 3. COMPANIES 정산 (가이드 / 월정산)
-- ============================================================

-- 14) guides (업체 소속 가이드)
create table if not exists public.guides (
  id              bigint generated always as identity primary key,
  name            text not null,
  company_id      bigint references public.companies(id) on delete cascade,
  commission_rate numeric(5,2) default 0,
  status          text default 'active',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_guides_company on public.guides (company_id);

-- 15) monthly_settlements (월정산)
create table if not exists public.monthly_settlements (
  id                bigint generated always as identity primary key,
  company_id        bigint not null references public.companies(id) on delete cascade,
  guide_id          bigint references public.guides(id) on delete set null,
  settlement_month  text not null,
  settlement_date   date,
  total_sessions    integer not null default 0,
  total_revenue     numeric(14,2) not null default 0,
  commission_rate   numeric(5,2) not null default 0,
  commission_amount numeric(14,2) not null default 0,
  payment_amount    numeric(14,2) not null default 0,
  service_breakdown jsonb not null default '{}'::jsonb,
  status            text not null default 'pending' check (status in ('pending','confirmed','paid')),
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_settlement_company_month on public.monthly_settlements (company_id, settlement_month);

-- ============================================================
-- PART 4. DEDUCTIONS (공제/선지급)
-- ============================================================

-- 16) sss_brackets (SSS 급여구간표)
create table if not exists public.sss_brackets (
  id             bigint generated always as identity primary key,
  salary_from    numeric not null,
  salary_to      numeric not null,
  employee_share numeric not null,
  employer_share numeric not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_sss_brackets_range on public.sss_brackets (salary_from, salary_to);

-- 17) health_check_logs (보건검진 실비 원장)
create table if not exists public.health_check_logs (
  id          bigint generated always as identity primary key,
  employee_id bigint references public.employees(id) on delete cascade,
  check_date  date,
  amount      numeric,
  note        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_health_check_emp on public.health_check_logs (employee_id, check_date);

-- 18) thirteenth_month_advances (13개월 선지급 원장)
create table if not exists public.thirteenth_month_advances (
  id          bigint generated always as identity primary key,
  employee_id bigint references public.employees(id) on delete cascade,
  pay_date    date,
  amount      numeric,
  note        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_13th_advance_emp on public.thirteenth_month_advances (employee_id, pay_date);

-- ============================================================
-- PART 5. 기타 (SSS 후정산 / 경영지표 / 앱설정)
-- ============================================================

-- 19) sss_records (정부 인보이스 기반 SSS 후정산)
create table if not exists public.sss_records (
  id               bigint generated always as identity primary key,
  applicable_month text not null,
  company          text,
  employer_ss_no   text,
  invoice_no       text,
  employee_no      integer,
  employee_name    text not null default '',
  ss_number        text,
  ss_amount        numeric(12,2) not null default 0,
  ec_amount        numeric(12,2) not null default 0,
  total_amount     numeric(12,2) not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists idx_sss_records_month on public.sss_records (applicable_month);

-- 20) management_metrics (월별 경영지표 jsonb)
create table if not exists public.management_metrics (
  month      text primary key,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 21) app_settings (앱 공용 설정 key/value)
create table if not exists public.app_settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- updated_at 트리거 (전 21개 테이블)
-- ============================================================
do $$
declare t text;
begin
  foreach t in array array[
    'employees','beds','massage_services','companies','bookings','massage_bookings',
    'expenses','expense_records','payroll_periods','cash_advances','attendance_logs',
    'philippine_holidays','payroll_records','guides','monthly_settlements','sss_brackets',
    'health_check_logs','thirteenth_month_advances','sss_records','management_metrics','app_settings'
  ] loop
    execute format('drop trigger if exists trg_%1$s_touch on public.%1$s;', t);
    execute format('create trigger trg_%1$s_touch before update on public.%1$s
                    for each row execute function public.touch_updated_at();', t);
  end loop;
end $$;

-- ============================================================
-- RLS (anon 읽기/쓰기 — 내부 단말 가정. 외부 공개 시 인증 정책으로 교체)
-- ============================================================
do $$
declare t text;
begin
  foreach t in array array[
    'employees','beds','massage_services','companies','bookings','massage_bookings',
    'expenses','expense_records','payroll_periods','cash_advances','attendance_logs',
    'philippine_holidays','payroll_records','guides','monthly_settlements','sss_brackets',
    'health_check_logs','thirteenth_month_advances','sss_records','management_metrics','app_settings'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists anon_all_%1$s on public.%1$s;', t);
    execute format('create policy anon_all_%1$s on public.%1$s for all to anon using (true) with check (true);', t);
  end loop;
end $$;

-- ============================================================
-- 시드 데이터 (비어있을 때만)
-- ============================================================

-- SSS 급여구간표 — 2024 SSS 정규(Regular SS) 스케줄 근사값
-- ⚠️ EC/MPF 제외, 총 14%(직원 4.5% + 사업주 9.5%)만 반영. 운영 전 공식 표와 대조 검증 필수.
insert into public.sss_brackets (salary_from, salary_to, employee_share, employer_share)
select
  case when msc = 4000  then 0      else msc - 250 end,
  case when msc = 30000 then 999999 else msc + 250 end,
  round(msc * 0.045, 2),
  round(msc * 0.095, 2)
from generate_series(4000, 30000, 500) as msc
where not exists (select 1 from public.sss_brackets);

-- ✅ 통합 스키마 끝 — 다음: scripts/20250605-supabase-init-data.py 로 직원 40명/침대 시드
