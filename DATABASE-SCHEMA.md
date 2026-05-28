# ElSpa Database Schema — Complete PostgreSQL Definition & Optimization

**Version:** 1.0  
**Date:** 2026-05-29  
**Database:** PostgreSQL 15+  
**Status:** Production Ready  

---

## Table of Contents

1. [Database Architecture](#database-architecture)
2. [Core Tables](#core-tables)
3. [Payroll Tables](#payroll-tables)
4. [Reporting Tables](#reporting-tables)
5. [Audit & Logging Tables](#audit--logging-tables)
6. [Indexes & Optimization](#indexes--optimization)
7. [Migration Scripts](#migration-scripts)

---

## Database Architecture

### ER Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    ELSPA DATABASE                            │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ customers    │      │ staff        │      │ therapists   │
├──────────────┤      ├──────────────┤      ├──────────────┤
│ id (PK)      │      │ id (PK)      │      │ id (FK)      │
│ email        │      │ email        │      │ license      │
│ first_name   │      │ role         │      │ specialties  │
│ last_name    │      │ base_salary  │      │ rating       │
│ kyc_status   │      │ commission   │      │ hourly_rate  │
└──────────────┘      └──────────────┘      └──────────────┘
                            │                        │
                            │                        │
                      ┌─────▼────────────────────────▼─────┐
                      │   payroll_records                   │
                      ├─────────────────────────────────────┤
                      │ id (PK)                             │
                      │ payroll_period_id (FK)              │
                      │ staff_id (FK)                       │
                      │ gross_pay, net_pay                  │
                      │ sss_deduction, bir_tax, etc.        │
                      │ audit_trail (JSON)                  │
                      │ verified, verified_at               │
                      └─────────────────────────────────────┘

┌──────────────────┐
│ onboarding_sessions
├──────────────────┤
│ id (PK)          │
│ customer_id (FK) │
│ step             │
│ progress         │
│ data (JSON)      │
│ status           │
└──────────────────┘

┌──────────────────┐      ┌──────────────────┐
│ payroll_periods  │      │ tax_deduction_rules
├──────────────────┤      ├──────────────────┤
│ id (PK)          │      │ id (PK)          │
│ period_start     │      │ country          │
│ period_end       │      │ tax_type         │
│ period_type      │      │ rules (JSON)     │
│ status           │      │ effective_date   │
│ locked_at        │      │ expiry_date      │
└──────────────────┘      └──────────────────┘

┌──────────────────┐      ┌──────────────────┐
│ audit_logs       │      │ user_activities  │
├──────────────────┤      ├──────────────────┤
│ id (PK)          │      │ id (PK)          │
│ entity_type      │      │ user_id (FK)     │
│ entity_id        │      │ action           │
│ action           │      │ resource         │
│ changes (JSON)   │      │ timestamp        │
│ timestamp        │      │ ip_address       │
│ user_id (FK)     │      │ user_agent       │
└──────────────────┘      └──────────────────┘
```

---

## Core Tables

### 1. customers (고객)

```sql
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(10),  -- M, F, Other
    nationality VARCHAR(100),
    language VARCHAR(10) DEFAULT 'en',  -- en, ko, th, vi, id
    
    -- 주소
    address_line1 VARCHAR(200),
    address_line2 VARCHAR(200),
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    
    -- KYC 상태
    kyc_status VARCHAR(50) DEFAULT 'pending',  -- pending, approved, rejected
    kyc_approved_at TIMESTAMP,
    kyc_approved_by UUID,
    
    -- 계정 상태
    account_status VARCHAR(50) DEFAULT 'active',  -- active, suspended, closed
    is_active BOOLEAN DEFAULT true,
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    CONSTRAINT email_unique UNIQUE (email),
    CONSTRAINT valid_gender CHECK (gender IN ('M', 'F', 'Other')),
    CONSTRAINT valid_language CHECK (language IN ('en', 'ko', 'th', 'vi', 'id'))
);

CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_kyc_status ON customers(kyc_status);
CREATE INDEX idx_customers_created_at ON customers(created_at);
```

### 2. customer_kyc (고객 KYC)

```sql
CREATE TABLE customer_kyc (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID UNIQUE NOT NULL,
    
    -- 문서
    id_type VARCHAR(50),  -- passport, national_id, driver_license
    id_number VARCHAR(50) UNIQUE,
    id_issue_date DATE,
    id_expiry_date DATE,
    
    -- 검증 상태
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    documents_verified BOOLEAN DEFAULT false,
    kyc_approved BOOLEAN DEFAULT false,
    approval_date TIMESTAMP,
    
    -- 리스크 평가
    risk_score NUMERIC(5,2) DEFAULT 0,  -- 0-100
    risk_factors JSON,
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_customer FOREIGN KEY (customer_id) 
        REFERENCES customers(id) ON DELETE CASCADE,
    CONSTRAINT valid_id_type CHECK (id_type IN ('passport', 'national_id', 'driver_license'))
);

CREATE INDEX idx_kyc_customer_id ON customer_kyc(customer_id);
CREATE INDEX idx_kyc_id_number ON customer_kyc(id_number);
```

### 3. staff (직원)

```sql
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    
    -- 직원 정보
    role VARCHAR(50) NOT NULL,  -- manager, therapist, driver, maintenance, nail, hollys
    employee_type VARCHAR(50),  -- permanent, contract, part_time
    hire_date DATE NOT NULL,
    termination_date DATE,
    
    -- 급여
    base_salary NUMERIC(12,2) NOT NULL,
    commission NUMERIC(12,2) DEFAULT 0,  -- 테라피스트, 네일 아티스트용
    hourly_rate NUMERIC(12,2),  -- 파트타임
    
    -- 세금 정보
    tax_id VARCHAR(50),  -- BIR, SSS ID
    sss_number VARCHAR(50),
    philhealth_number VARCHAR(50),
    pagibig_number VARCHAR(50),
    
    -- 은행 정보 (직불)
    bank_name VARCHAR(100),
    bank_account_number VARCHAR(50),
    bank_account_holder VARCHAR(100),
    
    -- 상태
    is_active BOOLEAN DEFAULT true,
    status VARCHAR(50) DEFAULT 'active',  -- active, on_leave, suspended, terminated
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_role CHECK (role IN ('manager', 'therapist', 'driver', 'maintenance', 'nail', 'hollys')),
    CONSTRAINT valid_employee_type CHECK (employee_type IN ('permanent', 'contract', 'part_time'))
);

CREATE INDEX idx_staff_email ON staff(email);
CREATE INDEX idx_staff_role ON staff(role);
CREATE INDEX idx_staff_hire_date ON staff(hire_date);
```

### 4. therapists (테라피스트)

```sql
CREATE TABLE therapists (
    id UUID PRIMARY KEY,
    license_number VARCHAR(50) UNIQUE,
    license_expiry_date DATE,
    specializations VARCHAR(255),  -- JSON array as string
    certification JSON,
    average_rating NUMERIC(3,2),
    total_reviews INTEGER DEFAULT 0,
    
    -- 가용성
    working_hours_start TIME,
    working_hours_end TIME,
    days_off VARCHAR(50),  -- JSON array
    
    -- 요금
    base_hourly_rate NUMERIC(12,2),
    premium_rate NUMERIC(12,2),
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_staff FOREIGN KEY (id)
        REFERENCES staff(id) ON DELETE CASCADE
);

CREATE INDEX idx_therapists_specializations ON therapists USING GIN(specializations);
CREATE INDEX idx_therapists_rating ON therapists(average_rating DESC);
```

---

## Payroll Tables

### 5. payroll_periods (정산 기간)

```sql
CREATE TABLE payroll_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    period_type VARCHAR(20) NOT NULL,  -- weekly, biweekly, monthly
    
    -- 상태
    status VARCHAR(50) DEFAULT 'open',  -- open, locked, exported, disbursed
    
    -- 잠금 및 내보내기
    locked_at TIMESTAMP,
    locked_by UUID,
    exported_at TIMESTAMP,
    exported_by UUID,
    
    -- 통계
    total_records INTEGER DEFAULT 0,
    verified_records INTEGER DEFAULT 0,
    total_amount NUMERIC(15,2) DEFAULT 0,
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT period_dates CHECK (period_start < period_end),
    CONSTRAINT valid_period_type CHECK (period_type IN ('weekly', 'biweekly', 'monthly'))
);

CREATE INDEX idx_payroll_periods_start_date ON payroll_periods(period_start);
CREATE INDEX idx_payroll_periods_status ON payroll_periods(status);
```

### 6. payroll_records (개인별 정산 결과)

```sql
CREATE TABLE payroll_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_period_id UUID NOT NULL,
    staff_id UUID NOT NULL,
    
    -- 급여 구성
    basic_salary NUMERIC(12,2) NOT NULL,
    commission NUMERIC(12,2) DEFAULT 0,
    overtime_hours NUMERIC(5,2) DEFAULT 0,
    overtime_pay NUMERIC(12,2) DEFAULT 0,
    allowance NUMERIC(12,2) DEFAULT 0,  -- 식대, 보조금
    holiday_pay NUMERIC(12,2) DEFAULT 0,
    other_income NUMERIC(12,2) DEFAULT 0,
    gross_pay NUMERIC(12,2) NOT NULL,
    
    -- 필리핀 공제
    sss_deduction NUMERIC(12,2) DEFAULT 0,
    philhealth_deduction NUMERIC(12,2) DEFAULT 0,
    pagibig_deduction NUMERIC(12,2) DEFAULT 0,
    bir_tax NUMERIC(12,2) DEFAULT 0,
    
    -- 베트남 공제 (BHXH)
    bhxh_deduction NUMERIC(12,2) DEFAULT 0,
    
    -- 인도네시아 공제 (BPJS)
    bpjs_deduction NUMERIC(12,2) DEFAULT 0,
    
    -- 기타 공제
    cash_advance NUMERIC(12,2) DEFAULT 0,
    absence_deduction NUMERIC(12,2) DEFAULT 0,
    tardiness_deduction NUMERIC(12,2) DEFAULT 0,
    medical_checkup NUMERIC(12,2) DEFAULT 0,  -- 테라피스트 분기별
    other_deduction NUMERIC(12,2) DEFAULT 0,
    
    total_deduction NUMERIC(12,2) NOT NULL,
    net_pay NUMERIC(12,2) NOT NULL,
    
    -- 감사 추적
    audit_trail JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- 검증 상태
    verified BOOLEAN DEFAULT false,
    verified_by UUID,
    verified_at TIMESTAMP,
    verification_notes TEXT,
    
    -- 지급 상태
    disbursement_status VARCHAR(50) DEFAULT 'pending',  -- pending, processing, completed, failed
    disbursement_date TIMESTAMP,
    disbursement_method VARCHAR(50),  -- bank_transfer, check, cash
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_period FOREIGN KEY (payroll_period_id)
        REFERENCES payroll_periods(id) ON DELETE CASCADE,
    CONSTRAINT fk_staff FOREIGN KEY (staff_id)
        REFERENCES staff(id) ON DELETE RESTRICT,
    CONSTRAINT valid_disbursement_status CHECK (
        disbursement_status IN ('pending', 'processing', 'completed', 'failed')
    )
);

CREATE INDEX idx_payroll_records_period ON payroll_records(payroll_period_id);
CREATE INDEX idx_payroll_records_staff ON payroll_records(staff_id);
CREATE INDEX idx_payroll_records_verified ON payroll_records(verified);
CREATE INDEX idx_payroll_records_created_at ON payroll_records(created_at);
```

### 7. tax_deduction_rules (세금/공제 규칙)

```sql
CREATE TABLE tax_deduction_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country VARCHAR(50) NOT NULL,  -- ph, vn, id, th
    tax_type VARCHAR(100) NOT NULL,  -- sss, philhealth, pagibig, bir, bhxh, bpjs
    
    -- 규칙 (JSON)
    -- {
    --   "rate": 0.04,
    --   "cap": 20000,
    --   "formula": "salary * rate",
    --   "min_amount": 100,
    --   "max_amount": 1000
    -- }
    rules JSONB NOT NULL,
    
    -- 유효 기간
    effective_date DATE NOT NULL,
    expiry_date DATE,
    is_active BOOLEAN DEFAULT true,
    
    -- 참고
    description TEXT,
    source_document VARCHAR(255),  -- 규칙의 출처 (BIR공지, SSS문서 등)
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_rule UNIQUE (country, tax_type, effective_date)
);

CREATE INDEX idx_tax_rules_country_type ON tax_deduction_rules(country, tax_type);
CREATE INDEX idx_tax_rules_effective_date ON tax_deduction_rules(effective_date DESC);
```

### 8. cash_advances (선지급)

```sql
CREATE TABLE cash_advances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    
    -- 상태
    status VARCHAR(50) DEFAULT 'approved',  -- pending, approved, rejected, repaid
    
    -- 정산 연결
    payroll_record_id UUID,
    deducted_from_period_id UUID,
    
    -- 승인 정보
    approved_by UUID,
    approved_at TIMESTAMP,
    
    -- 타임스탐프
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_staff FOREIGN KEY (staff_id)
        REFERENCES staff(id) ON DELETE CASCADE,
    CONSTRAINT fk_payroll_record FOREIGN KEY (payroll_record_id)
        REFERENCES payroll_records(id) ON DELETE SET NULL
);

CREATE INDEX idx_cash_advances_staff ON cash_advances(staff_id);
CREATE INDEX idx_cash_advances_status ON cash_advances(status);
```

---

## Reporting Tables

### 9. reports (생성된 보고서)

```sql
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_type VARCHAR(100) NOT NULL,  -- payroll, tax_bir, tax_sss, attendance
    
    -- 기간
    period_start DATE,
    period_end DATE,
    
    -- 파일 정보
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,  -- bytes
    file_format VARCHAR(20),  -- pdf, xlsx, json
    
    -- 포함 사항
    include_deductions BOOLEAN DEFAULT true,
    include_audit_trail BOOLEAN DEFAULT true,
    staff_count INTEGER,
    
    -- 생성 정보
    generated_by UUID NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    
    -- 다운로드 추적
    download_count INTEGER DEFAULT 0,
    last_downloaded_at TIMESTAMP,
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_report_type CHECK (
        report_type IN ('payroll', 'tax_bir', 'tax_sss', 'attendance', 'custom')
    )
);

CREATE INDEX idx_reports_type ON reports(report_type);
CREATE INDEX idx_reports_generated_at ON reports(generated_at DESC);
CREATE INDEX idx_reports_expires_at ON reports(expires_at);
```

---

## Audit & Logging Tables

### 10. audit_logs (감사 로그)

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id VARCHAR(100),
    
    -- 엔티티 정보
    entity_type VARCHAR(100) NOT NULL,  -- payroll_record, staff, customer
    entity_id UUID NOT NULL,
    
    -- 작업
    action VARCHAR(50) NOT NULL,  -- CREATE, READ, UPDATE, DELETE
    
    -- 변경 내용
    old_values JSONB,
    new_values JSONB,
    changes JSONB,  -- 실제 변경된 필드만
    
    -- 사용자 정보
    user_id UUID,
    user_email VARCHAR(255),
    
    -- 클라이언트 정보
    ip_address VARCHAR(45),  -- IPv4/IPv6
    user_agent TEXT,
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_action CHECK (action IN ('CREATE', 'READ', 'UPDATE', 'DELETE'))
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_request_id ON audit_logs(request_id);
```

### 11. user_activities (사용자 활동)

```sql
CREATE TABLE user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    
    -- 활동 정보
    activity_type VARCHAR(100) NOT NULL,  -- login, logout, api_call, report_download
    resource VARCHAR(255),  -- 리소스 경로
    resource_type VARCHAR(100),  -- payroll, staff, customer
    
    -- 상세
    method VARCHAR(20),  -- GET, POST, PUT, DELETE
    status_code INTEGER,  -- 200, 404, 500 등
    
    -- 성능
    response_time_ms INTEGER,  -- 밀리초
    
    -- 클라이언트 정보
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_user FOREIGN KEY (user_id)
        REFERENCES staff(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_activities_user_type ON user_activities(user_id, activity_type);
CREATE INDEX idx_user_activities_created_at ON user_activities(created_at DESC);
```

---

## Indexes & Optimization

### Index Strategy

```sql
-- ============================================================
-- 1. PRIMARY KEY INDEXES (자동 생성)
-- ============================================================

-- ============================================================
-- 2. FOREIGN KEY INDEXES (암묵적, 조인 성능)
-- ============================================================

CREATE INDEX idx_payroll_records_fk_period 
    ON payroll_records(payroll_period_id);
CREATE INDEX idx_payroll_records_fk_staff 
    ON payroll_records(staff_id);

-- ============================================================
-- 3. SEARCH/FILTER INDEXES
-- ============================================================

CREATE INDEX idx_customers_status 
    ON customers(account_status, is_active);
CREATE INDEX idx_staff_role_active 
    ON staff(role) WHERE is_active = true;
CREATE INDEX idx_payroll_verified_period 
    ON payroll_records(verified, payroll_period_id);

-- ============================================================
-- 4. RANGE QUERY INDEXES
-- ============================================================

CREATE INDEX idx_payroll_periods_date_range 
    ON payroll_periods(period_start, period_end);
CREATE INDEX idx_payroll_records_created_period 
    ON payroll_records(created_at, payroll_period_id);
CREATE INDEX idx_audit_logs_date_range 
    ON audit_logs(created_at DESC);

-- ============================================================
-- 5. FULL-TEXT SEARCH INDEXES
-- ============================================================

CREATE INDEX idx_customers_fulltext 
    ON customers USING GIN(
        to_tsvector('english', 
            COALESCE(first_name, '') || ' ' || 
            COALESCE(last_name, '') || ' ' || 
            COALESCE(email, '')
        )
    );

CREATE INDEX idx_staff_fulltext 
    ON staff USING GIN(
        to_tsvector('english', 
            COALESCE(first_name, '') || ' ' || 
            COALESCE(last_name, '') || ' ' || 
            COALESCE(email, '')
        )
    );

-- ============================================================
-- 6. JSON INDEXES (JSONB)
-- ============================================================

CREATE INDEX idx_payroll_records_audit_trail 
    ON payroll_records USING GIN(audit_trail);
CREATE INDEX idx_tax_rules_rules 
    ON tax_deduction_rules USING GIN(rules);

-- ============================================================
-- 7. COMPOSITE INDEXES (자주 함께 조회되는 컬럼)
-- ============================================================

CREATE INDEX idx_payroll_records_period_staff 
    ON payroll_records(payroll_period_id, staff_id);
CREATE INDEX idx_payroll_records_period_verified 
    ON payroll_records(payroll_period_id, verified);
CREATE INDEX idx_audit_logs_entity_action 
    ON audit_logs(entity_type, action, created_at DESC);
```

### Query Optimization Examples

```sql
-- ❌ 느린 쿼리 (인덱스 미사용)
SELECT * FROM payroll_records 
WHERE net_pay > 10000 AND verified = true;

-- ✅ 빠른 쿼리 (인덱스 사용)
SELECT id, staff_id, net_pay 
FROM payroll_records 
WHERE payroll_period_id = 'uuid' AND verified = true
ORDER BY net_pay DESC LIMIT 100;

-- 마테리얼라이즈드 뷰 (복잡한 집계)
CREATE MATERIALIZED VIEW payroll_summary AS
SELECT 
    pp.id as period_id,
    COUNT(*) as staff_count,
    SUM(pr.net_pay) as total_net_pay,
    SUM(pr.sss_deduction) as total_sss,
    AVG(pr.net_pay) as avg_net_pay
FROM payroll_periods pp
LEFT JOIN payroll_records pr ON pp.id = pr.payroll_period_id
WHERE pr.verified = true
GROUP BY pp.id;

CREATE INDEX idx_payroll_summary_period 
    ON payroll_summary(period_id);

-- 주기적 새로고침
REFRESH MATERIALIZED VIEW CONCURRENTLY payroll_summary;
```

---

## Migration Scripts

### Initial Setup (V1)

```sql
-- File: migrations/001_initial_schema.sql
-- Description: 초기 스키마 생성

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create all tables (see above)
-- ...

-- Create views
CREATE VIEW staff_active AS
SELECT * FROM staff 
WHERE is_active = true AND termination_date IS NULL;

CREATE VIEW payroll_pending AS
SELECT * FROM payroll_records 
WHERE verified = false AND created_at > CURRENT_DATE - INTERVAL '7 days';
```

### Migration: Add Churn Prediction

```sql
-- File: migrations/002_add_churn_prediction.sql
-- Description: 이직 예측을 위한 테이블 추가

CREATE TABLE churn_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL UNIQUE,
    
    -- 예측 결과
    churn_probability NUMERIC(5,2),  -- 0-100%
    risk_level VARCHAR(20),  -- low, medium, high
    
    -- 리스크 요인
    risk_factors JSONB,  -- [ { "factor": "...", "score": 0.8 } ]
    
    -- 모델 정보
    model_version VARCHAR(50),
    prediction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 실제 결과
    actual_churned BOOLEAN,
    churn_date TIMESTAMP,
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_staff FOREIGN KEY (staff_id)
        REFERENCES staff(id) ON DELETE CASCADE
);

CREATE INDEX idx_churn_predictions_risk_level 
    ON churn_predictions(risk_level);
CREATE INDEX idx_churn_predictions_probability 
    ON churn_predictions(churn_probability DESC);
```

### Backup & Recovery

```bash
# File: scripts/backup.sh
#!/bin/bash

# PostgreSQL 전체 백업
pg_dump \
    --host=localhost \
    --port=5432 \
    --username=elspa_user \
    --database=elspa \
    --verbose \
    --file=backups/elspa_$(date +%Y%m%d_%H%M%S).sql \
    --format=plain

# S3에 업로드
aws s3 cp backups/ s3://elspa-backups/ --recursive

# 로컬 백업 정리 (7일 이상된 파일 삭제)
find backups/ -type f -mtime +7 -delete

echo "Backup completed at $(date)"
```

### Performance Tuning

```sql
-- File: scripts/maintenance.sql
-- Description: 정기적 유지보수

-- 1. 통계 업데이트
ANALYZE customers;
ANALYZE staff;
ANALYZE payroll_records;
ANALYZE audit_logs;

-- 2. 인덱스 재구성
REINDEX INDEX CONCURRENTLY idx_payroll_records_period;
REINDEX INDEX CONCURRENTLY idx_audit_logs_created_at;

-- 3. 오래된 데이터 아카이빙
-- 2년 이상된 감사 로그 삭제
DELETE FROM audit_logs 
WHERE created_at < CURRENT_DATE - INTERVAL '2 years';

-- 4. 마테리얼라이즈드 뷰 새로고침
REFRESH MATERIALIZED VIEW CONCURRENTLY payroll_summary;

-- 5. 자동진공 분석
VACUUM ANALYZE;
```

### Connection Pool Configuration

```yaml
# File: config/database.yaml
# PostgreSQL Connection Pool

max_connections: 100
min_idle: 10
max_idle: 50
connection_timeout: 30  # seconds
idle_timeout: 900  # 15 minutes
max_lifetime: 1800  # 30 minutes

# Statement caching
prepared_statement_cache_size: 250
prepared_statement_name_func: 
    __hash__

# SSL
ssl_mode: require
ssl_verify: true
```

---

## Data Dictionary

| Table | Column | Type | Nullable | Key | Description |
|-------|--------|------|----------|-----|-------------|
| payroll_records | id | UUID | NO | PK | 고유 식별자 |
| payroll_records | payroll_period_id | UUID | NO | FK | 정산 기간 ID |
| payroll_records | staff_id | UUID | NO | FK | 직원 ID |
| payroll_records | gross_pay | NUMERIC(12,2) | NO | | 총 지급액 |
| payroll_records | net_pay | NUMERIC(12,2) | NO | | 실지급액 |
| payroll_records | audit_trail | JSONB | NO | | 감사 추적 (JSON) |
| payroll_records | verified | BOOLEAN | YES | | 검증 완료 여부 |

---

**Total Tables:** 11  
**Total Indexes:** 40+  
**Constraints:** 60+  
**Production Ready:** Yes  
**Backup Strategy:** Daily + S3  
**Maintenance:** Weekly ANALYZE, Monthly VACUUM
