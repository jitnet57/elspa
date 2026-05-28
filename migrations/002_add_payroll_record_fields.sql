-- Migration: Add missing fields to payroll_records
-- Date: 2026-05-29
-- Purpose: Add thirteenth_month_accrual and is_obsolete fields

-- Add thirteenth_month_accrual column (13개월 보너스 누적액)
ALTER TABLE payroll_records
  ADD COLUMN thirteenth_month_accrual NUMERIC(10,2) DEFAULT 0;

-- Add is_obsolete column (소프트 삭제 플래그)
ALTER TABLE payroll_records
  ADD COLUMN is_obsolete BOOLEAN DEFAULT FALSE;

-- Add index for is_obsolete filtering (조회 성능 최적화)
CREATE INDEX idx_payroll_record_is_obsolete ON payroll_records(is_obsolete);
