-- ============================================================
-- 📌 SQL 마이그레이션: Payment System Schema Upgrade (FIXED)
-- 📋 목적: 결제 시스템 필드 추가 & 테이블 최적화
-- 🔧 기능: bookings 테이블 확장 + company_settlements 생성
-- 📅 작성일: 2026-06-02 (ENUM IF NOT EXISTS 수정)
-- ============================================================

-- ============================================================
-- [1️⃣] ENUM 타입 생성 (기존 타입 먼저 삭제)
-- ============================================================

-- SSS 상태 ENUM
DROP TYPE IF EXISTS sss_status_enum CASCADE;
CREATE TYPE sss_status_enum AS ENUM (
    'pending',
    'approved',
    'confirmed',
    'cancelled'
);

-- 결제 주체 ENUM
DROP TYPE IF EXISTS payment_from_enum CASCADE;
CREATE TYPE payment_from_enum AS ENUM (
    'customer',
    'company_credit',
    'referral'
);

-- 정산 상태 ENUM
DROP TYPE IF EXISTS settlement_status_enum CASCADE;
CREATE TYPE settlement_status_enum AS ENUM (
    'pending',
    'approved',
    'settled',
    'rejected',
    'confirmed'
);

-- ============================================================
-- [2️⃣] bookings 테이블 ALTER
-- ============================================================

-- payment_methods 추가 (JSON)
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_methods JSON DEFAULT '[]'::json;

COMMENT ON COLUMN bookings.payment_methods IS '결제수단 배열: [{"type":"card","amount":3000,"status":"completed"}, ...]';

-- sss_status 추가 (ENUM)
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS sss_status sss_status_enum DEFAULT 'pending';

COMMENT ON COLUMN bookings.sss_status IS 'SSS 상태: pending, approved, confirmed, cancelled';

-- payment_from 추가 (ENUM)
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_from payment_from_enum DEFAULT 'customer';

COMMENT ON COLUMN bookings.payment_from IS '결제 주체: customer, company_credit, referral';

-- settlement_status 추가 (ENUM)
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS settlement_status settlement_status_enum DEFAULT 'pending';

COMMENT ON COLUMN bookings.settlement_status IS '정산 상태: pending, approved, settled, rejected, confirmed';

-- total_amount 추가
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2) DEFAULT 0.00;

-- sss_amount 추가
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS sss_amount DECIMAL(10,2) DEFAULT 0.00;

-- ============================================================
-- [3️⃣] 인덱스 생성
-- ============================================================

-- payment_from + settlement_status 조합 인덱스
CREATE INDEX IF NOT EXISTS idx_bookings_payment_settlement
ON bookings(payment_from, settlement_status);

-- sss_status 인덱스
CREATE INDEX IF NOT EXISTS idx_bookings_sss_status
ON bookings(sss_status);

-- settlement_status 인덱스
CREATE INDEX IF NOT EXISTS idx_bookings_settlement_status
ON bookings(settlement_status);

-- 완료된 예약의 정산 상태 조합 인덱스
CREATE INDEX IF NOT EXISTS idx_bookings_status_settlement
ON bookings(status, settlement_status)
WHERE status = 'completed';

-- ============================================================
-- [4️⃣] company_settlements 테이블 생성
-- ============================================================

CREATE TABLE IF NOT EXISTS company_settlements (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT,
    month DATE NOT NULL,
    total_commission DECIMAL(12,2) DEFAULT 0.00,
    total_paid DECIMAL(12,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'draft',
    settlement_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_company_settlements_company
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- company_settlements 인덱스
CREATE INDEX IF NOT EXISTS idx_company_settlements_month
ON company_settlements(month);

CREATE INDEX IF NOT EXISTS idx_company_settlements_status
ON company_settlements(status);

CREATE INDEX IF NOT EXISTS idx_company_settlements_date
ON company_settlements(settlement_date);

-- ============================================================
-- [5️⃣] settlement_transactions 테이블 생성
-- ============================================================

CREATE TABLE IF NOT EXISTS settlement_transactions (
    id BIGSERIAL PRIMARY KEY,
    settlement_id BIGINT,
    booking_id BIGINT,
    company_id BIGINT,
    commission_amount DECIMAL(12,2),
    payment_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_settlement_transactions_settlement
        FOREIGN KEY (settlement_id) REFERENCES company_settlements(id) ON DELETE CASCADE,
    CONSTRAINT fk_settlement_transactions_booking
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_settlement_transactions_company
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- settlement_transactions 인덱스
CREATE INDEX IF NOT EXISTS idx_settlement_transactions_settlement
ON settlement_transactions(settlement_id);

CREATE INDEX IF NOT EXISTS idx_settlement_transactions_booking
ON settlement_transactions(booking_id);

-- ============================================================
-- [6️⃣] payment_method_settings 테이블 생성
-- ============================================================

CREATE TABLE IF NOT EXISTS payment_method_settings (
    id BIGSERIAL PRIMARY KEY,
    method_type VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    fee_percentage DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 기본 결제 수단 데이터
INSERT INTO payment_method_settings (method_type, display_name, is_active, fee_percentage)
VALUES
    ('card', 'Credit Card', TRUE, 2.5),
    ('cash', 'Cash', TRUE, 0.0),
    ('gcash', 'GCash', TRUE, 0.0),
    ('bankA', 'Bank A', TRUE, 1.0),
    ('bankB', 'Bank B', TRUE, 1.0)
ON CONFLICT (method_type) DO NOTHING;

-- ============================================================
-- ✅ 마이그레이션 완료
-- ============================================================
-- 모든 스키마 변경이 완료되었습니다.
-- 다음 단계: 데이터 마이그레이션 (data_migration_007_payment_defaults.py)
