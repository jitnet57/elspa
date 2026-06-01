-- ============================================================
-- 📌 employees.daily_wage 추가 (개별 일급 — 직원마다 다름)
-- 📋 다른직원(할리스/네일/메인/드라이버)·정직원 미달 일할 계산용
-- ▶ 실행: Supabase Dashboard → SQL Editor → Run
-- 🔁 멱등: add column if not exists / 이름 매칭 update
-- 📅 작성일: 2026-06-01
-- ============================================================

-- 1) 컬럼 추가 (개별 일급, ₱)
alter table public.employees
  add column if not exists daily_wage numeric(12,2) not null default 0;

comment on column public.employees.daily_wage is '개별 일급(₱) — 다른직원 출근일 일할 및 정직원 미달 일할 계산에 사용';

-- 2) 기존 직원 일급 시드 (개인별 상이) — 이름 매칭
update public.employees set daily_wage = 2300 where name in ('Manager Kim','Manager Lee') and daily_wage = 0;
update public.employees set daily_wage = 1400 where name = 'Driver Jose'   and daily_wage = 0;
update public.employees set daily_wage = 1250 where name = 'Nail Anna'     and daily_wage = 0;
update public.employees set daily_wage = 1150 where name = 'Hollys Grace'  and daily_wage = 0;
update public.employees set daily_wage = 1080 where name = 'Maint. Pedro'  and daily_wage = 0;
-- 테라피스트는 수수료제이므로 일급 0 유지

-- 3) 확인
-- select name, employee_type, base_salary, daily_wage from public.employees order by employee_type, name;
