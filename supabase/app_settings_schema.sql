-- ============================================================
-- 📌 app_settings — 앱 공용 설정 저장 (key/value jsonb)
-- 📋 급여 설정(세션 수수료 등)을 단말 간 공유하기 위해 Supabase 저장
-- ▶ Supabase Dashboard → SQL Editor → Run
-- 📅 2026-06-02
-- ============================================================
create table if not exists public.app_settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists trg_app_settings_touch on public.app_settings;
create trigger trg_app_settings_touch before update on public.app_settings
  for each row execute function public.touch_updated_at();
alter table public.app_settings enable row level security;
drop policy if exists anon_all_app_settings on public.app_settings;
create policy anon_all_app_settings on public.app_settings
  for all to anon using (true) with check (true);
