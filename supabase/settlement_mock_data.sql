-- ============================================================
-- 📌 정산 테스트용 목데이터 (companies / guides / monthly_settlements)
-- 📋 목적: 월정산 리포트/화면 테스트. 내부 산술 일관성 100% 보장.
-- 🔗 의존: payroll_companies_schema.sql (테이블/RLS 먼저 생성)
-- ▶ 실행: Supabase Dashboard → SQL Editor 에 붙여넣고 Run
-- 🔁 멱등: 데이터가 비어 있을 때만 주입 (where not exists 가드)
-- 🧮 무결성 규칙:
--    total_revenue     = total_sessions * avg_price
--    commission_amount = round(total_revenue * commission_rate/100, 2)
--    payment_amount    = total_revenue - commission_amount
--    service_breakdown  swedish+thai 의 sessions/revenue 합 = 총합
-- ⚠️ 구글시트는 Apps Script syncAll() 이 Supabase 를 단방향 복사 → 자동 일치
-- 📅 작성일: 2026-06-01
-- ============================================================

-- ------------------------------------------------------------
-- 1) 업체 (companies) — 6개 (이름이 중복 안 되도록 비어있을 때만)
-- ------------------------------------------------------------
insert into public.companies (name, representative, phone, address, settlement_day, commission_rate, status, gcash_number, bank_name, bank_account)
select * from (values
  ('ABC Travel',     'Kim Chulsoo',  '02-1234-5678', 'Seoul Gangnam',    20, 30.0, 'active', '09123456781', 'Shinhan', '110-111-0001'),
  ('XYZ Tour',       'Lee Younghee',  '02-9876-5432', 'Seoul Seocho',      5, 25.0, 'active', '09123456782', 'Woori',   '220-222-0002'),
  ('Global Tour',    'Park Minsu',   '02-5555-6666', 'Seoul Mapo',       15, 28.0, 'active', '09123456783', 'KB',      '330-333-0003'),
  ('Sunrise Travel', 'Choi Jiwoo',   '02-7777-8888', 'Seoul Jongno',     10, 27.0, 'active', '09123456784', 'Hana',    '440-444-0004'),
  ('Ocean Tours',    'Jung Minwoo',  '02-3333-2222', 'Seoul Yongsan',    25, 32.0, 'active', '09123456785', 'NH',      '550-555-0005'),
  ('Pacific Travel', 'Han Soyeon',   '02-1111-0000', 'Seoul Songpa',      5, 26.0, 'active', '09123456786', 'IBK',     '660-666-0006')
) as v(name, representative, phone, address, settlement_day, commission_rate, status, gcash_number, bank_name, bank_account)
where not exists (select 1 from public.companies);

-- ------------------------------------------------------------
-- 2) 가이드 (guides) — 업체별 2명 (업체명으로 연결)
-- ------------------------------------------------------------
insert into public.guides (name, company_id, commission_rate)
select g.name, c.id, g.commission_rate
from (values
  ('ABC Travel',     'Guide Anna',   10.0),
  ('ABC Travel',     'Guide Brian',  10.0),
  ('XYZ Tour',       'Guide Chloe',   8.0),
  ('XYZ Tour',       'Guide David',   8.0),
  ('Global Tour',    'Guide Emma',    9.0),
  ('Global Tour',    'Guide Frank',   9.0),
  ('Sunrise Travel', 'Guide Grace',   9.5),
  ('Sunrise Travel', 'Guide Henry',   9.5),
  ('Ocean Tours',    'Guide Ivy',    10.0),
  ('Ocean Tours',    'Guide Jack',   10.0),
  ('Pacific Travel', 'Guide Kelly',   8.5),
  ('Pacific Travel', 'Guide Leo',     8.5)
) as g(company_name, name, commission_rate)
join public.companies c on c.name = g.company_name
where not exists (select 1 from public.guides);

-- ------------------------------------------------------------
-- 3) 월정산 (monthly_settlements) — 6업체 × 3개월 = 18행
--    산술은 CTE 로 계산 → 무결성 보장
-- ------------------------------------------------------------
insert into public.monthly_settlements
  (company_id, guide_id, settlement_month, settlement_date, total_sessions, total_revenue,
   commission_rate, commission_amount, payment_amount, service_breakdown, status, notes)
select
  c.id                                                   as company_id,
  (select g.id from public.guides g where g.company_id = c.id order by g.id limit 1) as guide_id,
  m.month                                                as settlement_month,
  (m.month || '-' || lpad(c.settlement_day::text, 2, '0'))::date as settlement_date,
  m.total_sessions,
  (m.total_sessions * m.avg_price)::numeric(14,2)        as total_revenue,
  c.commission_rate,
  round(m.total_sessions * m.avg_price * c.commission_rate / 100, 2) as commission_amount,
  round(m.total_sessions * m.avg_price * (1 - c.commission_rate / 100), 2) as payment_amount,
  jsonb_build_object(
    'swedish', jsonb_build_object(
      'sessions', round(m.total_sessions * 0.6),
      'revenue',  round(m.total_sessions * m.avg_price * 0.6, 2)
    ),
    'thai', jsonb_build_object(
      'sessions', m.total_sessions - round(m.total_sessions * 0.6),
      'revenue',  round(m.total_sessions * m.avg_price, 2) - round(m.total_sessions * m.avg_price * 0.6, 2)
    )
  ) as service_breakdown,
  m.status,
  m.notes
from public.companies c
cross join (values
  ('2026-03', 120, 1500.0, 'paid',      '3월 정산 완료'),
  ('2026-04', 138, 1550.0, 'confirmed', '4월 정산 확정'),
  ('2026-05', 105, 1600.0, 'pending',   '5월 정산 대기')
) as m(month, total_sessions, avg_price, status, notes)
where not exists (select 1 from public.monthly_settlements);

-- ------------------------------------------------------------
-- ✅ 검증 쿼리 (실행 후 결과 확인용)
-- ------------------------------------------------------------
-- 무결성 검증: 어긋난 행이 0건이어야 정상
-- select id, settlement_month,
--   (commission_amount + payment_amount = total_revenue) as sum_ok,
--   ((service_breakdown->'swedish'->>'sessions')::int + (service_breakdown->'thai'->>'sessions')::int = total_sessions) as sess_ok
-- from public.monthly_settlements
-- order by company_id, settlement_month;
