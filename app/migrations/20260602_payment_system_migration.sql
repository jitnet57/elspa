-- ============================================================
-- 📌 SQL 마이그레이션: Payment System Schema Upgrade
-- 📋 목적: 결제 시스템 필드 추가 & 테이블 최적화
-- 🔧 기능: bookings 테이블 확장 + company_settlements 생성
-- 📅 작성일: 2026-06-02
-- ============================================================

-- 📝 설명:
-- 이 SQL 마이그레이션은 결제 시스템 구현을 위해 다음을 수행합니다:
--
-- 1️⃣ ENUM 타입 생성:
--    - sss_status_enum: SSS 상태 (pending, approved, confirmed, cancelled)
--    - payment_from_enum: 결제 주체 (customer, company_credit, referral)
--    - settlement_status_enum: 정산 상태 (pending, approved, settled, rejected, confirmed)
--
-- 2️⃣ bookings 테이블 ALTER:
--    - payment_methods (JSON): 다중 결제수단 저장
--    - sss_status (ENUM): SSS 상태
--    - payment_from (ENUM): 결제 주체
--    - settlement_status (ENUM): 정산 상태
--
-- 3️⃣ 인덱스 생성:
--    - idx_bookings_payment_settlement: (payment_from, settlement_status)
--    - idx_bookings_sss_status: (sss_status)
--    - idx_bookings_settlement_status: (settlement_status)
--    - idx_bookings_status_settlement: (status, settlement_status) WHERE status='completed'
--
-- 4️⃣ company_settlements 테이블 생성:
--    - 월간 정산 기록 관리
--    - 상태 추적 (draft → approved → settled → confirmed)
--    - 금액 추적 및 수수료 계산
--
-- 5️⃣ settlement_transactions 테이블 생성:
--    - 거래별 정산 상세 기록
--    - booking_id와 연결
--
-- 6️⃣ settlement_rules 테이블 생성:
--    - 정산 규칙 관리
--    - 고객 유형별 설정


-- ============================================================
-- [1️⃣] ENUM 타입 생성
-- ============================================================

-- SSS 상태 ENUM
CREATE TYPE IF NOT EXISTS sss_status_enum AS ENUM (
    'pending',
    'approved',
    'confirmed',
    'cancelled'
);

-- 결제 주체 ENUM
CREATE TYPE IF NOT EXISTS payment_from_enum AS ENUM (
    'customer',
    'company_credit',
    'referral'
);

-- 정산 상태 ENUM
CREATE TYPE IF NOT EXISTS settlement_status_enum AS ENUM (
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


-- ============================================================
-- [3️⃣] bookings 테이블 인덱스 생성
-- ============================================================

-- 결제 추적 인덱스
CREATE INDEX IF NOT EXISTS idx_bookings_payment_settlement
ON bookings(payment_from, settlement_status);

-- SSS 상태 인덱스
CREATE INDEX IF NOT EXISTS idx_bookings_sss_status
ON bookings(sss_status);

-- 정산 상태 인덱스
CREATE INDEX IF NOT EXISTS idx_bookings_settlement_status
ON bookings(settlement_status);

-- 완료된 예약 정산 추적 인덱스
CREATE INDEX IF NOT EXISTS idx_bookings_status_settlement
ON bookings(status, settlement_status)
WHERE status = 'completed';


-- ============================================================
-- [4️⃣] company_settlements 테이블 생성
-- ============================================================

CREATE TABLE IF NOT EXISTS company_settlements (
    -- 기본 정보
    id SERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL,
    settlement_period_year INTEGER NOT NULL,
    settlement_period_month INTEGER NOT NULL,

    -- 매출 분류
    total_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_revenue >= 0),
    guest_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (guest_revenue >= 0),
    credit_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (credit_revenue >= 0),
    waived_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (waived_revenue >= 0),

    -- 외상 회수
    recovery_rate NUMERIC(5, 2) NOT NULL DEFAULT 100 CHECK (recovery_rate >= 0 AND recovery_rate <= 100),
    recovered_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (recovered_amount >= 0),

    -- 수수료
    platform_fee_rate NUMERIC(5, 2) NOT NULL DEFAULT 25 CHECK (platform_fee_rate >= 0 AND platform_fee_rate <= 100),
    platform_fee NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (platform_fee >= 0),

    -- 차감 항목
    refund_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (refund_amount >= 0),
    dispute_deduction NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (dispute_deduction >= 0),
    other_deduction NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (other_deduction >= 0),
    total_deductions NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_deductions >= 0),

    -- 최종 정산액
    net_settlement NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (net_settlement >= 0),

    -- 상태
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'settled', 'rejected', 'confirmed')),
    settlement_date DATE,
    payment_method VARCHAR(50),
    payment_date DATE,

    -- 메모
    notes TEXT,
    dispute_notes TEXT,

    -- 감시 정보
    created_by VARCHAR(100),
    approved_by VARCHAR(100),
    paid_by VARCHAR(100),

    -- 타임스탬프
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- 제약 조건
    UNIQUE (company_id, settlement_period_year, settlement_period_month),
    CONSTRAINT fk_company_settlements_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- company_settlements 인덱스
CREATE INDEX IF NOT EXISTS idx_company_settlement_company_id ON company_settlements(company_id);
CREATE INDEX IF NOT EXISTS idx_company_settlement_status ON company_settlements(status);
CREATE INDEX IF NOT EXISTS idx_company_settlement_payment_date ON company_settlements(payment_date);
CREATE INDEX IF NOT EXISTS idx_company_settlement_period ON company_settlements(company_id, settlement_period_year, settlement_period_month);


-- ============================================================
-- [5️⃣] settlement_transactions 테이블 생성
-- ============================================================

CREATE TABLE IF NOT EXISTS settlement_transactions (
    -- 기본 정보
    id BIGSERIAL PRIMARY KEY,
    company_settlement_id INTEGER NOT NULL,

    -- 거래 링크
    booking_id BIGINT,
    customer_id BIGINT,

    -- 거래 분류
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('booking', 'refund', 'dispute', 'adjustment')),
    settlement_category VARCHAR(50) NOT NULL CHECK (settlement_category IN ('guest', 'credit', 'waived')),

    -- 금액
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    recovery_rate NUMERIC(5, 2) NOT NULL DEFAULT 100 CHECK (recovery_rate >= 0 AND recovery_rate <= 100),
    recovered_amount NUMERIC(12, 2) NOT NULL CHECK (recovered_amount >= 0),

    -- 날짜
    transaction_date DATE NOT NULL,

    -- 메모
    notes TEXT,

    -- 타임스탬프
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- 외래 키
    CONSTRAINT fk_settlement_transactions_company_settlement_id FOREIGN KEY (company_settlement_id) REFERENCES company_settlements(id) ON DELETE CASCADE,
    CONSTRAINT fk_settlement_transactions_booking_id FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    CONSTRAINT fk_settlement_transactions_customer_id FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- settlement_transactions 인덱스
CREATE INDEX IF NOT EXISTS idx_settlement_transaction_company_id ON settlement_transactions(company_settlement_id);
CREATE INDEX IF NOT EXISTS idx_settlement_transaction_booking_id ON settlement_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_settlement_transaction_type ON settlement_transactions(transaction_type);


-- ============================================================
-- [6️⃣] settlement_rules 테이블 생성
-- ============================================================

CREATE TABLE IF NOT EXISTS settlement_rules (
    -- 기본 정보
    id SERIAL PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,

    -- 규칙 조건
    customer_type VARCHAR(50),
    payment_method VARCHAR(50),

    -- 규칙 설정
    settlement_status VARCHAR(50) NOT NULL CHECK (settlement_status IN ('settled', 'pending', 'waived')),
    recovery_rate NUMERIC(5, 2) NOT NULL DEFAULT 100 CHECK (recovery_rate >= 0 AND recovery_rate <= 100),
    platform_fee_rate NUMERIC(5, 2) NOT NULL DEFAULT 25 CHECK (platform_fee_rate >= 0 AND platform_fee_rate <= 100),

    -- 활성화
    is_active BOOLEAN DEFAULT TRUE,

    -- 타임스탬프
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- settlement_rules 인덱스
CREATE INDEX IF NOT EXISTS idx_settlement_rule_conditions ON settlement_rules(customer_type, payment_method);
CREATE INDEX IF NOT EXISTS idx_settlement_rule_active ON settlement_rules(is_active);


-- ============================================================
-- [7️⃣] 검증 쿼리
-- ============================================================

-- 📊 생성된 ENUM 타입 확인
-- SELECT typname FROM pg_type WHERE typtype = 'e' AND typname LIKE '%enum';

-- 📊 bookings 테이블 필드 확인
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'bookings' AND column_name IN (
--     'payment_methods', 'sss_status', 'payment_from', 'settlement_status'
-- )
-- ORDER BY column_name;

-- 📊 company_settlements 테이블 확인
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'company_settlements' ORDER BY ordinal_position;

-- 📊 생성된 인덱스 확인
-- SELECT indexname FROM pg_indexes
-- WHERE tablename IN ('bookings', 'company_settlements', 'settlement_transactions')
-- ORDER BY tablename, indexname;


-- ============================================================
-- ✅ 마이그레이션 완료
-- ============================================================
-- 모든 테이블, ENUM, 인덱스가 생성되었습니다.
-- 다음 단계:
--   1. SELECT * FROM pg_indexes WHERE tablename IN (...) 로 인덱스 확인
--   2. Settlement API 구현 시작
--   3. Payment 관련 라우터 추가
