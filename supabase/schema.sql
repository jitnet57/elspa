-- ============================================================
-- 📌 Supabase 스키마: ELSPA 실시간 모니터 (백엔드 없는 구조)
-- 📋 목적: 프론트엔드가 직접 읽기/쓰기, Apps Script가 1시간마다 Sheet로 백업
-- 📅 작성일: 2026-05-31
-- 🧱 테이블: beds(침대) / therapists(테라피스트) / bookings(예약)
-- ⚠️ RLS: 모니터는 익명(anon) 읽기/쓰기 허용. 외부 공개 시 정책을 조여야 함.
-- 실행: Supabase Dashboard → SQL Editor 에 붙여넣고 Run
-- ============================================================

-- ------------------------------------------------------------
-- 1) 침대 (beds) — 86개 (마사지룸1 30, 마사지룸2 30, VIP룸 16, 커플룸 10)
-- ------------------------------------------------------------
create table if not exists public.beds (
  id            integer primary key,
  bed_number    integer not null,
  room_zone     text    not null check (room_zone in ('마사지룸1','마사지룸2','VIP룸','커플룸')),
  status        text    not null default 'available'
                check (status in ('available','reserved','in_service','cleaning')),
  customer_name text,
  therapist_name text,
  service_name  text,
  starts_at     timestamptz,
  ends_at       timestamptz,
  updated_at    timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2) 테라피스트 (therapists)
-- ------------------------------------------------------------
create table if not exists public.therapists (
  id                integer primary key,
  name              text not null,
  status            text not null default 'idle'
                    check (status in ('idle','in_service','resting','checked_out')),
  current_bed       integer,
  remaining_minutes integer,
  specialty         text,
  checked_in_at     text,           -- "HH:MM"
  updated_at        timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 3) 예약 (bookings) — BOOKING WITH THERAPIST 테이블 / Daily Schedule 원본
-- ------------------------------------------------------------
create table if not exists public.bookings (
  id          bigint generated always as identity primary key,
  booking_date date not null default current_date,
  seq_no      integer,               -- N#
  treatment   text,                  -- TRT (Swedish Massage 등)
  start_time  text,                  -- "09:00"
  end_time    text,                  -- "10:00"
  room_num    text,                  -- RM#
  guest_name  text,                  -- GUEST
  therapist_name text,
  note        text,
  pay         numeric,
  tip         numeric,
  status      text not null default 'normal'
              check (status in ('normal','editing','deleting','deleted','error')),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_bookings_date on public.bookings (booking_date);

-- ------------------------------------------------------------
-- updated_at 자동 갱신 트리거
-- ------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_beds_touch on public.beds;
create trigger trg_beds_touch before update on public.beds
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_therapists_touch on public.therapists;
create trigger trg_therapists_touch before update on public.therapists
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_bookings_touch on public.bookings;
create trigger trg_bookings_touch before update on public.bookings
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------
-- RLS (Row Level Security)
-- 모니터는 내부 단말 가정 → anon 읽기/쓰기 허용.
-- 외부 공개 환경이라면 아래 정책을 인증 기반으로 교체할 것.
-- ------------------------------------------------------------
alter table public.beds       enable row level security;
alter table public.therapists enable row level security;
alter table public.bookings   enable row level security;

drop policy if exists anon_all_beds on public.beds;
create policy anon_all_beds on public.beds
  for all to anon using (true) with check (true);

drop policy if exists anon_all_therapists on public.therapists;
create policy anon_all_therapists on public.therapists
  for all to anon using (true) with check (true);

drop policy if exists anon_all_bookings on public.bookings;
create policy anon_all_bookings on public.bookings
  for all to anon using (true) with check (true);

-- ------------------------------------------------------------
-- 시드: 침대 86개 (모두 available로 시작)
-- ------------------------------------------------------------
insert into public.beds (id, bed_number, room_zone, status)
select
  gs.id,
  case
    when gs.id between 1 and 30  then gs.id
    when gs.id between 31 and 60 then gs.id - 30
    when gs.id between 61 and 76 then gs.id - 60
    else gs.id - 76
  end as bed_number,
  case
    when gs.id between 1 and 30  then '마사지룸1'
    when gs.id between 31 and 60 then '마사지룸2'
    when gs.id between 61 and 76 then 'VIP룸'
    else '커플룸'
  end as room_zone,
  'available'
from generate_series(1, 86) as gs(id)
on conflict (id) do nothing;
