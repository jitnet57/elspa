-- ============================================================
-- 📌 경영지표 (management_metrics) — 월별 영업이익/순이익 입력 저장
-- 📋 월 단위 JSON 저장(매출/지출 항목/세금). 연 누적은 월 합산.
-- ▶ Supabase Dashboard → SQL Editor → Run
-- 📅 2026-06-01
-- ============================================================
create table if not exists public.management_metrics (
  month      text primary key,                 -- "YYYY-MM"
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists trg_mm_touch on public.management_metrics;
create trigger trg_mm_touch before update on public.management_metrics
  for each row execute function public.touch_updated_at();

alter table public.management_metrics enable row level security;
drop policy if exists anon_all_mm on public.management_metrics;
create policy anon_all_mm on public.management_metrics
  for all to anon using (true) with check (true);
