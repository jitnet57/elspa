-- ============================================================
-- 📌 Migration 008: bookings.therapist_id 추가 + 백필
-- 📋 목적: 예약현황(타임라인) 매칭의 전제 컬럼 보장
--         (DailyTherapistSchedule 은 bookings.therapist_id = employees.id 로 매칭)
-- 🔧 대상: public.bookings (Supabase)
-- 📅 작성일: 2026-06-13
-- ⚠️ 재실행 안전(idempotent): IF NOT EXISTS / NULL 조건 백필
-- ============================================================

-- ── 1) 현재 컬럼 확인 (진단) ───────────────────────────────
-- therapist_id 가 결과에 있으면 2) 는 그냥 통과(no-op)됩니다.
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'bookings'
order by ordinal_position;

-- ── 2) 컬럼 추가 (없을 때만) + 인덱스 ──────────────────────
alter table public.bookings
  add column if not exists therapist_id bigint;

create index if not exists idx_bookings_therapist_id
  on public.bookings(therapist_id);

-- 결제수단 컬럼(jsonb)도 함께 보장 — NewMassagePanel 이 여기에 저장
alter table public.bookings
  add column if not exists payment_methods jsonb default '[]'::jsonb;

-- ── 3) 기존 데이터 백필: therapist_name → therapist_id ─────
-- 이름 정확 일치(대소문자/앞뒤공백 무시). 부분일치는 오매칭 위험으로 제외.
update public.bookings b
set therapist_id = e.id
from public.employees e
where b.therapist_id is null
  and b.therapist_name is not null
  and lower(btrim(b.therapist_name)) = lower(btrim(e.name));

-- ── 4) (선택) 무결성 FK — 직원 삭제 시 therapist_id NULL 처리
-- 고아 값이 있으면 실패하므로 3) 백필 + 5) 정리 후 실행 권장.
-- alter table public.bookings
--   add constraint fk_bookings_therapist
--   foreign key (therapist_id) references public.employees(id) on delete set null;

-- ── 5) 검증: 아직 매칭 안 된 예약 (수동 확인 대상) ─────────
-- 결과가 비어 있으면 백필 완료. 행이 남으면 약자/오타로 저장된 케이스:
--   update public.bookings set therapist_id = <직원ID> where id = <예약ID>;
select id, booking_date, therapist_name
from public.bookings
where therapist_id is null
  and therapist_name is not null
  and coalesce(status, 'normal') <> 'deleted'
order by booking_date desc;
