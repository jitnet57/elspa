-- ============================================================
-- 📌 SSS 후정산 레코드 (sss_records)
-- 📋 정부 SSS 영수증/인보이스를 받아 후정산하는 직원별 기여 내역
-- ▶ 실행: Supabase Dashboard → SQL Editor → Run
-- ⚠️ RLS: anon 읽기/쓰기 (내부 단말 가정)
-- 📅 작성일: 2026-06-01
-- ============================================================

create table if not exists public.sss_records (
  id               bigint generated always as identity primary key,
  applicable_month text not null,                 -- "YYYY-MM"
  company          text,
  employer_ss_no   text,
  invoice_no       text,                           -- 정부 인보이스 번호
  employee_no      integer,
  employee_name    text not null default '',
  ss_number        text,                           -- 직원 SSS 번호
  ss_amount        numeric(12,2) not null default 0,
  ec_amount        numeric(12,2) not null default 0,  -- EC(고용보상)
  total_amount     numeric(12,2) not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists idx_sss_records_month on public.sss_records (applicable_month);

-- updated_at 트리거
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists trg_sss_records_touch on public.sss_records;
create trigger trg_sss_records_touch before update on public.sss_records
  for each row execute function public.touch_updated_at();

-- RLS (anon 읽기/쓰기)
alter table public.sss_records enable row level security;
drop policy if exists anon_all_sss_records on public.sss_records;
create policy anon_all_sss_records on public.sss_records
  for all to anon using (true) with check (true);

-- 샘플 (후정산 1개월) — 비어있을 때만
insert into public.sss_records
  (applicable_month, company, employer_ss_no, invoice_no, employee_no, employee_name, ss_number, ss_amount, ec_amount, total_amount)
select * from (values
  ('2026-05', 'ElSpa', '03-9-000000-0', 'INV-2026-05', 1, 'Manager Kim',   '34-000000-1', 1350.00, 30.00, 1380.00),
  ('2026-05', 'ElSpa', '03-9-000000-0', 'INV-2026-05', 2, 'Driver Jose',   '34-000000-2',  900.00, 30.00,  930.00),
  ('2026-05', 'ElSpa', '03-9-000000-0', 'INV-2026-05', 3, 'Nail Anna',     '34-000000-3',  720.00, 10.00,  730.00)
) as v(applicable_month, company, employer_ss_no, invoice_no, employee_no, employee_name, ss_number, ss_amount, ec_amount, total_amount)
where not exists (select 1 from public.sss_records);
