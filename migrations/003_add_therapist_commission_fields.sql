-- Migration: Add Therapist Commission Fields
-- Date: 2026-05-29
-- Purpose: Add therapist_id, service_price, service_duration_minutes to MassageBooking
--          Add massage_booking_id to AttendanceLog

-- 1. MassageBooking 테이블에 필드 추가
ALTER TABLE massage_bookings
  ADD COLUMN therapist_id INTEGER,
  ADD COLUMN service_duration_minutes INTEGER DEFAULT 60,
  ADD COLUMN service_price NUMERIC(10,2) DEFAULT 0,
  ADD FOREIGN KEY (therapist_id) REFERENCES employees(id) ON DELETE SET NULL;

-- 2. AttendanceLog 테이블에 마사지 예약 연결 필드 추가
ALTER TABLE attendance_logs
  ADD COLUMN massage_booking_id BIGINT,
  ADD FOREIGN KEY (massage_booking_id) REFERENCES massage_bookings(id) ON DELETE SET NULL;

-- 3. 인덱스 추가 (성능 최적화)
CREATE INDEX idx_massage_booking_therapist_id ON massage_bookings(therapist_id);
CREATE INDEX idx_massage_booking_date_status ON massage_bookings(date, status);
CREATE INDEX idx_attendance_massage_booking ON attendance_logs(massage_booking_id);

-- 4. 기존 therapist 문자열을 기반으로 therapist_id 업데이트 (선택사항)
-- 주의: 이것은 수동 작업 필요 (therapist 이름과 employee.name을 매칭)
-- UPDATE massage_bookings mb
-- SET therapist_id = (
--   SELECT id FROM employees WHERE name = mb.therapist LIMIT 1
-- )
-- WHERE therapist_id IS NULL;
