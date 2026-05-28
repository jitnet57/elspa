# 🏗️ Technical Architecture - Philippines Edition
## System Design & Implementation Guide

**Version**: 1.0  
**Date**: May 29, 2026  
**Stack**: FastAPI (Python) + React (TypeScript) + PostgreSQL

---

## 📐 System Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   ElSpa System Architecture              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────┐      │
│  │         Frontend Layer (React + TypeScript)   │      │
│  │  ├─ Spa booking app (mobile + web)           │      │
│  │  ├─ Admin dashboard (payroll + scheduling)  │      │
│  │  └─ Healthcare caregiver app                 │      │
│  └──────────────────┬───────────────────────────┘      │
│                     │                                   │
│  ┌──────────────────┴───────────────────────────┐      │
│  │      API Gateway (Cloudflare Workers)        │      │
│  │  Rate limiting, auth, request validation     │      │
│  └──────────────────┬───────────────────────────┘      │
│                     │                                   │
│  ┌──────────────────┴───────────────────────────┐      │
│  │      Backend Services (FastAPI, Python)      │      │
│  │  ├─ Payroll engine (SSS/PhilHealth/etc)     │      │
│  │  ├─ Scheduling service (AI-powered)         │      │
│  │  ├─ NPS/Retention service                    │      │
│  │  ├─ Authentication (JWT OAuth 2.0)          │      │
│  │  └─ Compliance reporting (BIR export)       │      │
│  └──────────────────┬───────────────────────────┘      │
│                     │                                   │
│  ┌──────────────────┴───────────────────────────┐      │
│  │      Data Layer (PostgreSQL + Redis)         │      │
│  │  ├─ Customer/employee data (encrypted)       │      │
│  │  ├─ Payroll records (audit logs)             │      │
│  │  ├─ NPS/feedback data                        │      │
│  │  └─ Cache layer (Redis for speed)            │      │
│  └──────────────────────────────────────────────┘      │
│                                                          │
│  ┌──────────────────────────────────────────────┐      │
│  │     External Integrations & Partners         │      │
│  │  ├─ Partner API (HR systems, POS)           │      │
│  │  ├─ BIR online system (filing)              │      │
│  │  ├─ SMS gateway (Twilio/local)              │      │
│  │  ├─ Email service (SendGrid)                │      │
│  │  └─ Analytics (Google Analytics)            │      │
│  └──────────────────────────────────────────────┘      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 💾 Database Schema (Key Tables)

### Core Tables

**1. Customers (Spa booking)**
```sql
CREATE TABLE customers (
    id UUID PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100),
    email VARCHAR(100),
    nps_score INT (0-10),
    last_visit TIMESTAMP,
    visit_frequency INT (visits/month),
    lifetime_value DECIMAL(15,2),
    churn_probability FLOAT (0-1),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
-- Indexes: phone (fast SMS lookup), last_visit (churn detection)
```

**2. Employees (Therapist/Caregiver)**
```sql
CREATE TABLE employees (
    id UUID PRIMARY KEY,
    facility_id UUID FOREIGN KEY,
    name VARCHAR(100),
    sss_number VARCHAR(20),
    philhealth_number VARCHAR(20),
    pagibig_number VARCHAR(20),
    bir_tin VARCHAR(20),
    monthly_salary DECIMAL(15,2),
    certifications JSON (CPR, skills, specialties),
    certification_expiry TIMESTAMP,
    shift_type VARCHAR(50) (day/night/flexible),
    availability JSON (preferred days/times),
    performance_score FLOAT (0-100),
    created_at TIMESTAMP
);
```

**3. Payroll Records**
```sql
CREATE TABLE payroll (
    id UUID PRIMARY KEY,
    employee_id UUID FOREIGN KEY,
    month_year DATE,
    gross_salary DECIMAL(15,2),
    sss_contribution DECIMAL(15,2),
    sss_withheld DECIMAL(15,2),
    philhealth_contribution DECIMAL(15,2),
    philhealth_withheld DECIMAL(15,2),
    pagibig_contribution DECIMAL(15,2),
    pagibig_withheld DECIMAL(15,2),
    income_tax_withheld DECIMAL(15,2),
    thirteen_month_bonus DECIMAL(15,2),
    night_shift_premium DECIMAL(15,2),
    sunday_premium DECIMAL(15,2),
    overtime_amount DECIMAL(15,2),
    net_salary DECIMAL(15,2),
    status VARCHAR(50) (draft/submitted/approved/paid),
    bir_status VARCHAR(50) (pending/filed/confirmed),
    calculated_by VARCHAR(50),
    calculated_at TIMESTAMP,
    paid_date TIMESTAMP,
    audit_log JSON (all changes)
);
-- Indexes: (employee_id, month_year), bir_status
```

**4. Schedules (Spa booking + Caregiver shifts)**
```sql
CREATE TABLE schedules (
    id UUID PRIMARY KEY,
    facility_id UUID FOREIGN KEY,
    date DATE,
    shift_time TIME RANGE,
    employee_id UUID FOREIGN KEY,
    customer_id UUID FOREIGN KEY (for spa),
    service_type VARCHAR(100) (Swedish massage, Thai, etc),
    status VARCHAR(50) (scheduled/completed/cancelled),
    ai_recommended BOOLEAN (auto-assigned),
    created_at TIMESTAMP
);
-- Indexes: (facility_id, date), status
```

---

## 🔐 Security & Compliance

### Data Encryption
- **In transit**: TLS 1.3 (HTTPS everywhere)
- **At rest**: AES-256 encryption for sensitive fields
  - SSN/BIR TIN encrypted with customer master key
  - Payroll records encrypted
  - Employee personal data encrypted
- **Key management**: AWS KMS or equivalent

### Authentication & Authorization
```
JWT Token Structure:
├─ Header: {alg: HS256, typ: JWT}
├─ Payload: {user_id, facility_id, role, exp: +8h}
└─ Signature: HMAC-SHA256

Roles:
├─ Admin: Full access to facility data
├─ Manager: Scheduling + payroll view/edit
├─ HR: Payroll only (no scheduling)
├─ Caregiver/Therapist: View own schedule + payslip
└─ Partner API: Token-scoped to specific endpoints
```

### Audit Logging
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    user_id UUID,
    action VARCHAR(100) (create/update/delete),
    table_name VARCHAR(50),
    record_id UUID,
    old_value JSON,
    new_value JSON,
    timestamp TIMESTAMP,
    ip_address VARCHAR(50),
    user_agent VARCHAR(200)
);
-- Immutable: Cannot be deleted or modified (prevents tampering)
-- Retention: 10 years (per BIR requirement)
```

### Data Privacy Compliance (RA 10173)
- ✅ Personal data anonymized in logs
- ✅ Consent tracking (when customer opts in to SMS/email)
- ✅ Right to access: Export customer data endpoint
- ✅ Right to deletion: GDPR-style data erasure (redacted, not removed)

---

## ⚡ Performance & Scalability

### API Response Time Targets
```
Endpoint                    Target    SLA
────────────────────────────────────────────
GET /payroll/summary        <50ms     99.9%
POST /calculate-salary      <100ms    99.95%
GET /schedules              <100ms    99.9%
POST /nps-response          <200ms    99%
Batch payroll (1000 records) <5s      99%
```

### Caching Strategy
```
Redis Cache Layer:
├─ Payroll tax brackets (updated annually): 1 year TTL
├─ Philippine holidays (2026): 1 year TTL
├─ Employee NPS scores: 24-hour TTL
├─ Recent schedules: 1-hour TTL
├─ Partner API auth tokens: 8-hour TTL
└─ HIT RATE TARGET: 70%+ (reducing DB load)
```

### Database Optimization
```
Indexing Strategy:
├─ Single column: (employee_id), (facility_id), (status)
├─ Composite: (facility_id, date), (employee_id, month_year)
├─ Full-text search: search customer names/phone
└─ QUERY PLAN: All queries <100ms with indexes
```

---

## 🧠 AI/ML Components

### Churn Prediction Model

```python
# Training pipeline
features = [
    'days_since_last_visit',      # 0-365
    'visit_frequency_trend',      # -1 to +1 (declining vs increasing)
    'avg_spend_per_visit',        # ₱1000-5000
    'session_cancellations',      # count per month
    'review_sentiment_score',     # -1 to +1 (neg to positive)
    'therapist_switch_frequency'  # 0-100 (how often changes therapist)
]

Model: XGBoost or LightGBM
├─ Training data: 12 months historical
├─ Labels: Churned (left) vs Retained
├─ Accuracy target: ≥85%
├─ Precision (false positives): <10%
└─ Recall (catch real churners): >90%

Output: Churn probability score (0-100%)
├─ >70%: HIGH RISK → Immediate intervention
├─ 40-70%: MEDIUM RISK → Personalized offer
├─ <40%: LOW RISK → Standard loyalty program
```

### Payroll Calculation Engine

```python
def calculate_payroll(employee_id, month_year):
    """
    Complex payroll calculation engine for Philippines
    Handles: SSS, PhilHealth, Pag-IBIG, tax, premiums, bonuses
    """
    
    # 1. Get base salary + attendance
    employee = get_employee(employee_id)
    attendance = get_attendance(employee_id, month_year)
    
    # 2. Calculate components
    gross_salary = employee.monthly_salary
    sss = calculate_sss(gross_salary)  # 11% employee, 16% employer
    philhealth = calculate_philhealth(gross_salary)  # 2.5% emp, 2.5% emp
    pagibig = calculate_pagibig(gross_salary)  # 1-2%
    
    # 3. Apply premiums
    night_shift_hours = attendance.filter(22:00-06:00).count()
    night_premium = (gross_salary/160) * night_shift_hours * 0.20  # 20% extra
    
    sunday_premium = calculate_sunday_premium(attendance)  # 30%
    holiday_premium = calculate_holiday_premium(attendance)  # 30%
    overtime = calculate_overtime(attendance)  # 1.25x / 1.30x
    
    # 4. Calculate tax (BIR Form 2316)
    taxable_income = gross_salary + premiums - deductions
    income_tax = get_tax_from_bracket_2026(taxable_income)
    
    # 5. Final calculation
    total_deductions = sss_withheld + ph_withheld + pagibig + tax
    net_salary = gross_salary + premiums - total_deductions
    
    return {
        'gross': gross_salary,
        'premiums': night + sunday + holiday + overtime,
        'sss': sss,
        'philhealth': philhealth,
        'pagibig': pagibig,
        'tax': income_tax,
        'net': net_salary,
        'audit_trail': [all calculations with formulas]
    }
```

---

## 📡 API Endpoints (Track A: Partner Integration)

### Authentication
```
POST /auth/token
Body: {partner_id, api_key, timestamp, signature}
Response: {access_token, expires_in: 3600}
```

### Payroll Calculation
```
POST /payroll/calculate
Body: {
    employee_id,
    gross_salary,
    hours_worked,
    date_range,
    apply_premiums: true
}
Response: {
    gross,
    sss_contribution,
    philhealth_contribution,
    pagibig_contribution,
    income_tax_withheld,
    net_salary,
    audit_log
}

Batch endpoint:
POST /payroll/batch-calculate
Body: {employees: [...], date_range}
Response: {results: [...], summary: {total_gross, total_net}}
```

### Compliance Reporting
```
GET /compliance/bir-form-2316
Query: ?employee_id=UUID&year=2026
Response: {ir2316_xml, ready_to_submit: true}

GET /compliance/sss-remittance
Query: ?facility_id=UUID&month_year=2026-05
Response: {sss_remittance_json, submitted_date: null}
```

---

## 🚀 Deployment & DevOps

### Infrastructure (Recommended)
```
Hosting:
├─ Frontend: Cloudflare Pages / Vercel
├─ Backend API: Railway / Heroku / AWS Lambda
├─ Database: Supabase PostgreSQL / AWS RDS
├─ Cache: Redis Cloud
├─ File storage: Cloudflare R2 / AWS S3
└─ Monitoring: Datadog / Sentry

Cost estimate: ₱20K-50K/month (all-in)
```

### CI/CD Pipeline
```
GitHub Actions:
├─ On PR: Run tests (Jest, pytest), lint, security scan
├─ On merge: Build, deploy to staging, smoke test
├─ On tag: Deploy to production, run integration tests
├─ Rollback: Automated if health checks fail >5 min
```

### Database Migrations
```
Versioning: Flyway / Alembic
├─ All migrations version-controlled (Git)
├─ Forward-only (no rollbacks except manual)
├─ Tested on staging before production
└─ Backup before each migration
```

---

## 📊 Monitoring & Alerting

### Key Metrics
```
Performance:
├─ API response time (p50, p95, p99)
├─ Database query time
├─ Cache hit rate
└─ Error rate (4xx, 5xx)

Compliance:
├─ Payroll calculation accuracy (0 = perfect, target <0.01%)
├─ Tax calculation error rate
├─ BIR submission success rate
└─ Audit log completeness

Operational:
├─ Uptime (target: 99.9%)
├─ API availability per partner
├─ Data backup success rate
└─ Security incidents (target: 0)
```

### Alerting Thresholds
```
Critical (immediate page):
├─ API down >1 minute
├─ Database down
├─ Payment processor error
└─ Security incident detected

Warning (email + Slack):
├─ Response time >500ms (p99)
├─ Error rate >1%
├─ Cache hit rate <50%
└─ Database CPU >80%
```

---

## 🔄 Disaster Recovery Plan

```
RTO (Recovery Time Objective): <1 hour
RPO (Recovery Point Objective): <15 minutes

Backup Strategy:
├─ Daily full backup (automated)
├─ Hourly incremental backup
├─ Off-site storage (geo-redundant)
└─ Test restore monthly (verify integrity)

Failover Plan:
├─ Database: Master-slave replication
├─ API: Load balancer with auto-scaling
├─ Frontend: CDN caching (serves stale content if API down)
└─ Manual failover: Documented, practiced quarterly
```

---

**Architecture Document**: May 29, 2026  
**Version**: 1.0 (Philippines Edition)  
**Tech Stack**: FastAPI + React + PostgreSQL + Supabase
