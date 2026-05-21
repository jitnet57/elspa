-- ============================================================
-- ElSpa 급여 정산 시스템 - 데이터베이스 스키마 DDL
-- ============================================================
-- 작성일: 2026-05-21
-- 설명: 6개 테이블의 전체 스키마, 제약조건, 인덱스
-- 데이터베이스: PostgreSQL / MySQL / SQLite 호환
-- ============================================================


-- ============================================================
-- 테이블 1: employees (직원 마스터)
-- ============================================================
CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    employee_type VARCHAR(50) NOT NULL,
    pay_group VARCHAR(50) NOT NULL,
    base_salary DECIMAL(10, 2) NOT NULL DEFAULT 0,
    commission_rate DECIMAL(5, 2) DEFAULT 0,
    hire_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- 제약 조건
    CONSTRAINT ck_employee_base_salary_positive CHECK (base_salary >= 0),
    CONSTRAINT ck_employee_commission_rate_positive CHECK (commission_rate >= 0),

    -- 인덱스
    INDEX idx_employee_type_active_paygroup (employee_type, is_active, pay_group)
);

COMMENT ON TABLE employees IS '직원 마스터 데이터 (기존 Staff + Therapist 통합)';
COMMENT ON COLUMN employees.id IS '직원 ID (PK)';
COMMENT ON COLUMN employees.employee_type IS '직원 유형 (therapist, nail, driver, maintenance, hollys, manager)';
COMMENT ON COLUMN employees.pay_group IS '급여 지급 주기 (weekly, biweekly)';
COMMENT ON COLUMN employees.commission_rate IS '커미션율 (%)';


-- ============================================================
-- 테이블 2: cash_advances (CA - 선지급)
-- ============================================================
CREATE TABLE IF NOT EXISTS cash_advances (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    employee_id INTEGER NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    request_date DATE NOT NULL,
    reason VARCHAR(500),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    settled_payroll_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- 외래 키
    CONSTRAINT fk_cash_advances_employee_id FOREIGN KEY (employee_id)
        REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_cash_advances_settled_payroll_id FOREIGN KEY (settled_payroll_id)
        REFERENCES payroll_records(id) ON DELETE CASCADE ON UPDATE CASCADE,

    -- 제약 조건
    CONSTRAINT ck_cash_advance_amount_positive CHECK (amount >= 0),

    -- 인덱스
    INDEX idx_cash_advance_employee_status (employee_id, status)
);

COMMENT ON TABLE cash_advances IS '직원 선지급 (CA) 관리 - 정산 시 자동 차감 대상';
COMMENT ON COLUMN cash_advances.status IS 'CA 상태 (pending, approved, rejected, settled)';
COMMENT ON COLUMN cash_advances.settled_payroll_id IS '정산된 급여기록 ID (null이면 미정산)';


-- ============================================================
-- 테이블 3: attendance_logs (출퇴근 기록)
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance_logs (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    employee_id INTEGER NOT NULL,
    work_date DATE NOT NULL,
    clock_in VARCHAR(5),
    clock_out VARCHAR(5),
    late_minutes INTEGER DEFAULT 0,
    overtime_minutes INTEGER DEFAULT 0,
    is_absent BOOLEAN DEFAULT FALSE,
    holiday_type VARCHAR(50) DEFAULT 'none',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- 외래 키
    CONSTRAINT fk_attendance_logs_employee_id FOREIGN KEY (employee_id)
        REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,

    -- 복합 고유 제약 (employee_id, work_date는 중복 불가)
    CONSTRAINT uq_attendance_employee_workdate UNIQUE (employee_id, work_date),

    -- 인덱스
    INDEX idx_attendance_employee_workdate (employee_id, work_date)
);

COMMENT ON TABLE attendance_logs IS '출퇴근 기록 및 근태 관리 - 지각, OT 자동 계산';
COMMENT ON COLUMN attendance_logs.clock_in IS '출근 시각 (HH:MM 형식)';
COMMENT ON COLUMN attendance_logs.clock_out IS '퇴근 시각 (HH:MM 형식)';
COMMENT ON COLUMN attendance_logs.late_minutes IS '지각 분 (10분 초과 시 1분당 10 Peso 차감)';
COMMENT ON COLUMN attendance_logs.overtime_minutes IS '초과근무 분 (40분 이상 시 계산)';
COMMENT ON COLUMN attendance_logs.holiday_type IS '공휴일 유형 (none, national, special)';


-- ============================================================
-- 테이블 4: payroll_periods (급여 정산 기간)
-- ============================================================
CREATE TABLE IF NOT EXISTS payroll_periods (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    pay_group VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- 인덱스
    INDEX idx_payroll_period_status (pay_group, status)
);

COMMENT ON TABLE payroll_periods IS '급여 정산 기간 (주간/격주) - 한 번에 여러 직원의 급여 계산';
COMMENT ON COLUMN payroll_periods.period_start IS '기간 시작일';
COMMENT ON COLUMN payroll_periods.period_end IS '기간 종료일';
COMMENT ON COLUMN payroll_periods.status IS '정산 상태 (draft, approved, paid)';


-- ============================================================
-- 테이블 5: payroll_records (개인별 정산 결과)
-- ============================================================
CREATE TABLE IF NOT EXISTS payroll_records (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    payroll_period_id INTEGER NOT NULL,
    employee_id INTEGER NOT NULL,

    -- 수입 항목
    base_amount DECIMAL(10, 2) DEFAULT 0,
    commission_amount DECIMAL(10, 2) DEFAULT 0,
    overtime_amount DECIMAL(10, 2) DEFAULT 0,
    holiday_bonus DECIMAL(10, 2) DEFAULT 0,
    meal_allowance DECIMAL(10, 2) DEFAULT 0,

    -- 차감 항목
    late_deduction DECIMAL(10, 2) DEFAULT 0,
    absence_deduction DECIMAL(10, 2) DEFAULT 0,
    sss_deduction DECIMAL(10, 2) DEFAULT 0,
    ca_deduction DECIMAL(10, 2) DEFAULT 0,
    health_check_deduction DECIMAL(10, 2) DEFAULT 0,
    thirteenth_month_deduction DECIMAL(10, 2) DEFAULT 0,

    -- 최종 금액
    gross_pay DECIMAL(10, 2) DEFAULT 0,
    total_deductions DECIMAL(10, 2) DEFAULT 0,
    net_pay DECIMAL(10, 2) DEFAULT 0,

    -- 메타데이터
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    notes VARCHAR(1000),
    is_obsolete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- 외래 키
    CONSTRAINT fk_payroll_records_payroll_period_id FOREIGN KEY (payroll_period_id)
        REFERENCES payroll_periods(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_payroll_records_employee_id FOREIGN KEY (employee_id)
        REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,

    -- 제약 조건
    CONSTRAINT ck_payroll_gross_pay_positive CHECK (gross_pay >= 0),
    CONSTRAINT ck_payroll_deductions_positive CHECK (total_deductions >= 0),
    CONSTRAINT ck_payroll_net_pay_positive CHECK (net_pay >= 0),

    -- 인덱스
    INDEX idx_payroll_period_employee_status (payroll_period_id, employee_id, status)
);

COMMENT ON TABLE payroll_records IS '개인별 정산 결과 - 모든 수입, 차감 항목 포함한 최종 급여';
COMMENT ON COLUMN payroll_records.is_obsolete IS '소프트 삭제 플래그 (0=활성, 1=폐기됨)';
COMMENT ON COLUMN payroll_records.status IS '정산 상태 (draft, approved, paid)';


-- ============================================================
-- 테이블 6: philippine_holidays (필리핀 공휴일)
-- ============================================================
CREATE TABLE IF NOT EXISTS philippine_holidays (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    holiday_date DATE NOT NULL UNIQUE,
    holiday_name VARCHAR(255) NOT NULL,
    holiday_type VARCHAR(50) NOT NULL,
    rate_multiplier DECIMAL(3, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- 인덱스
    INDEX idx_holiday_date (holiday_date)
);

COMMENT ON TABLE philippine_holidays IS '필리핀 공휴일 관리';
COMMENT ON COLUMN philippine_holidays.holiday_type IS '공휴일 유형 (national=200%, special=130%)';
COMMENT ON COLUMN philippine_holidays.rate_multiplier IS '급여 배수 (2.0 또는 1.3)';


-- ============================================================
-- 관계도 (Entity Relationship Diagram)
-- ============================================================

/*
┌─────────────────────────────────┐
│         employees               │
│  ├─ id (PK)                     │
│  ├─ name                        │
│  ├─ phone                       │
│  ├─ employee_type               │
│  ├─ pay_group                   │
│  ├─ base_salary (CHK: >= 0)    │
│  └─ commission_rate (CHK: >= 0)│
└──────────────┬──────────────────┘
               │
       ┌───────┴────────┬──────────────┬────────────────┐
       │                │              │                │
       │ 1:N            │ 1:N          │ 1:N            │
       │                │              │                │
       ▼                ▼              ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│cash_advances │ │attendance_.. │ │payroll_..    │
│├─ employee_id├─┤ employee_id  ├─┤ employee_id  │
└──────────────┘ │├─ work_date  │ └──────────────┘
                 │├─ UQ(e_id,   │        ▲
         settled_└┘   work_date)│        │
         payroll_id  └──────────┘        │
                │                        │
                └─ FK to               FK to
                   payroll_periods     payroll_periods
                        ▲                ▲
                        │                │
                        └────────┬───────┘
                                 │
                        ┌────────┴────────┐
                        │ payroll_periods │
                        │  ├─ id (PK)     │
                        │  ├─ period_..   │
                        │  └─ status      │
                        └─────────────────┘

philippine_holidays (독립적)
  ├─ id (PK)
  ├─ holiday_date (UNIQUE, INDEX)
  └─ rate_multiplier
*/


-- ============================================================
-- 제약 조건 요약
-- ============================================================

/*
외래 키 (Foreign Keys):
  - cash_advances.employee_id → employees.id (ON DELETE CASCADE)
  - cash_advances.settled_payroll_id → payroll_records.id (ON DELETE CASCADE)
  - attendance_logs.employee_id → employees.id (ON DELETE CASCADE)
  - payroll_records.payroll_period_id → payroll_periods.id (ON DELETE CASCADE)
  - payroll_records.employee_id → employees.id (ON DELETE CASCADE)

UNIQUE 제약:
  - philippine_holidays.holiday_date (UNIQUE)
  - attendance_logs (employee_id, work_date) - 복합 고유 제약

CHECK 제약:
  - employees.base_salary >= 0
  - employees.commission_rate >= 0
  - cash_advances.amount >= 0
  - payroll_records.gross_pay >= 0
  - payroll_records.total_deductions >= 0
  - payroll_records.net_pay >= 0

인덱스 (Indexes):
  - employees (employee_type, is_active, pay_group) - 필터링 최적화
  - attendance_logs (employee_id, work_date) - 조회 최적화
  - payroll_records (payroll_period_id, employee_id, status) - 조회 최적화
  - cash_advances (employee_id, status) - 조회 최적화
  - philippine_holidays (holiday_date) - 조회 최적화
*/


-- ============================================================
-- 버전 히스토리
-- ============================================================

/*
v1.0 (2026-05-21)
  - 6개 핵심 테이블 생성
  - 복합 고유 제약 추가 (attendance_logs)
  - ON DELETE CASCADE 설정 (모든 FK)
  - is_obsolete 컬럼 추가 (soft delete 지원)
  - 5개 성능 인덱스 추가
  - 6개 CHECK 제약 추가 (금액 >= 0)

마이그레이션 방법:
  python scripts/migrate_payroll_constraints.py

롤백 방법:
  python scripts/rollback_payroll_constraints.py
*/


-- ============================================================
-- 사용 예제
-- ============================================================

/*
1. 직원 추가
INSERT INTO employees (name, phone, employee_type, pay_group, base_salary, hire_date)
VALUES ('John Doe', '09123456789', 'therapist', 'weekly', 15000, '2026-01-01');

2. 출퇴근 기록
INSERT INTO attendance_logs (employee_id, work_date, clock_in, clock_out)
VALUES (1, '2026-05-21', '08:00', '17:00');

3. 정산 기간
INSERT INTO payroll_periods (period_start, period_end, pay_group, status)
VALUES ('2026-05-18', '2026-05-24', 'weekly', 'draft');

4. 정산 기록
INSERT INTO payroll_records (
    payroll_period_id, employee_id,
    base_amount, gross_pay, total_deductions, net_pay,
    status
) VALUES (
    1, 1,
    15000, 15000, 0, 15000,
    'draft'
);

5. CA 선지급
INSERT INTO cash_advances (employee_id, amount, request_date, reason, status)
VALUES (1, 5000, '2026-05-20', 'Emergency', 'pending');

6. 공휴일 조회
SELECT * FROM philippine_holidays
WHERE holiday_date BETWEEN '2026-05-01' AND '2026-05-31';
*/
