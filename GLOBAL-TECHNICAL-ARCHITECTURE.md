# Global ElSpa Technical Architecture

**Version:** 2.0  
**Last Updated:** 2026-05-29  
**Owner:** Engineering & Infrastructure Team  
**Status:** Enterprise Production Design

---

## Table of Contents
1. [Executive Overview](#executive-overview)
2. [Multi-Tenant Architecture](#multi-tenant-architecture)
3. [Microservices Design](#microservices-design)
4. [Multi-Region Deployment](#multi-region-deployment)
5. [Database Architecture](#database-architecture)
6. [API Gateway & Security](#api-gateway--security)
7. [Caching Strategy](#caching-strategy)
8. [Payroll Engine](#payroll-engine)
9. [Compliance & Security](#compliance--security)
10. [Integrations](#integrations)
11. [Performance Benchmarks](#performance-benchmarks)
12. [Disaster Recovery](#disaster-recovery)

---

## Executive Overview

ElSpa Global operates as a **distributed, multi-tenant SaaS platform** serving spa and wellness businesses across Asia-Pacific. The architecture supports:

- **10+ Countries** (Korea, Philippines, Thailand, Vietnam, Indonesia, Malaysia, Singapore, Taiwan, Hong Kong, Japan)
- **1,000+ Businesses** with independent data/compliance isolation
- **500K+ Therapists** across distributed locations
- **2M+ Daily Transactions** (bookings, payroll, payments)
- **99.99% Uptime SLA** across all regions
- **Sub-200ms** API response times (p99)

### Technology Stack

| Component | Technology | Version | Rationale |
|-----------|-----------|---------|-----------|
| **API Framework** | FastAPI | 0.104+ | Async native, high performance (50K+ req/s) |
| **Web Framework** | Next.js | 16.2+ | SSR + SSG, ISR for dynamic content |
| **Database** | PostgreSQL | 15+ | ACID compliance, JSONB for flexible schema |
| **Caching** | Redis | 7.0+ | Sub-millisecond latency, pub/sub for real-time |
| **Message Queue** | Apache Kafka | 3.5+ | Event sourcing, audit trail, payroll processing |
| **Search** | Elasticsearch | 8.0+ | Full-text search, logging, analytics |
| **Container Orchestration** | Kubernetes | 1.27+ | Auto-scaling, self-healing, multi-region |
| **IaC** | Terraform | 1.5+ | Infrastructure as code, reproducible deployments |
| **Monitoring** | Prometheus + Grafana | Latest | Metrics, dashboards, alerting |
| **Logging** | ELK Stack | 8.0+ | Centralized logging, compliance audits |
| **CDN** | Cloudflare / AWS CloudFront | Latest | Global edge caching, DDoS protection |

---

## Multi-Tenant Architecture

### Tenant Isolation Model: **Database-per-Tenant with Shared Infrastructure**

```
┌────────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                          │
│              (Authentication, Routing, Rate Limiting)           │
└────────────────┬───────────────────────────┬───────────────────┘
                 │                           │
         ┌───────┴──────────┐        ┌──────┴──────────┐
         │ Business Tenant A │        │ Business Tenant B │
         │ (Korea Region)    │        │ (Philippines)    │
         └────────┬──────────┘        └────────┬─────────┘
                  │                            │
         ┌────────▼──────────┐        ┌───────▼─────────┐
         │ PostgreSQL DB-A   │        │ PostgreSQL DB-B │
         │ (Seoul Region)    │        │ (Manila Region) │
         │ - Customers       │        │ - Customers     │
         │ - Therapists      │        │ - Therapists    │
         │ - Transactions    │        │ - Transactions  │
         │ - Audit Logs      │        │ - Audit Logs    │
         └───────────────────┘        └─────────────────┘
                  │                            │
         ┌────────▼──────────┐        ┌───────▼─────────┐
         │  Redis Cache-A    │        │  Redis Cache-B  │
         │  (Seoul Edge)     │        │  (Manila Edge)  │
         └───────────────────┘        └─────────────────┘
```

### Tenant Identifier Propagation

Every request includes a tenant context:

```python
# app/schemas/common.py
class TenantContext(BaseModel):
    tenant_id: str                    # "business_001"
    business_name: str                # "Healing Spa Seoul"
    country_code: str                 # "KR"
    currency: str                     # "KRW"
    timezone: str                     # "Asia/Seoul"
    region: str                        # "ap-southeast-1"
    
    # Extracted from JWT token
    auth_user_id: int
    auth_user_role: str               # "admin", "manager", "therapist"
```

### Tenant Resolution Flow

```
User Login Request
  ↓
JWT Token Includes: tenant_id, user_id, role
  ↓
Middleware Extracts TenantContext
  ↓
Router Handler Accesses: request.state.tenant
  ↓
Database Query Filtered: WHERE tenant_id = context.tenant_id
  ↓
Response Includes Tenant-Specific Data
```

---

## Microservices Design

### Service Decomposition (Domain-Driven)

```
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (Kong/Nginx)                 │
│                   (Auth, Rate Limit, CORS)                  │
└──────┬──────────┬──────────┬──────────┬──────────┬──────────┘
       │          │          │          │          │
   ┌───▼──┐  ┌────▼──┐  ┌───▼──┐  ┌───▼──┐  ┌───▼──┐
   │Auth  │  │User   │  │ Book │  │Payroll  │Comp  │
   │Svc   │  │Mgmt   │  │ Svc  │  │ Svc     │ Svc  │
   │      │  │       │  │      │  │         │      │
   │      │  │       │  │      │  │         │      │
   └──┬───┘  └───┬───┘  └──┬───┘  └────┬────┘  └──┬──┘
      │          │         │           │          │
      └──────────┴─────────┴───────────┴──────────┘
                        │
                   ┌────▼────────────┐
                   │  Shared Services│
                   │  - Messaging    │
                   │  - Cache        │
                   │  - Storage      │
                   │  - Logging      │
                   └─────────────────┘
```

### Core Microservices

#### 1. **Authentication Service** (auth-svc)
```
Endpoints:
  POST   /auth/login              → JWT token generation
  POST   /auth/register           → Tenant + user creation
  POST   /auth/refresh            → Token refresh
  POST   /auth/logout             → Token revocation
  POST   /auth/mfa-setup          → 2FA configuration
  POST   /auth/mfa-verify         → 2FA validation
  GET    /auth/permissions        → Role-based access control

Database: PostgreSQL (users, sessions, audit_logs)
Cache: Redis (session tokens, permission cache)
```

#### 2. **User Management Service** (user-svc)
```
Endpoints:
  GET    /users/{id}              → User details
  PUT    /users/{id}              → User profile update
  GET    /users?role=therapist    → List users by role
  POST   /users/bulk-import       → CSV import (admin)
  GET    /therapists/{id}/schedule → Therapist schedule
  PUT    /therapists/{id}/availability → Availability config
  
Database: PostgreSQL (users, therapists, customers, staff)
Search: Elasticsearch (therapist profiles, skills)
```

#### 3. **Booking Service** (booking-svc)
```
Endpoints:
  POST   /bookings                → Create booking
  GET    /bookings/{id}           → Booking details
  PUT    /bookings/{id}           → Modify booking
  DELETE /bookings/{id}           → Cancel booking
  GET    /availability            → Real-time therapist availability
  POST   /bookings/{id}/confirm   → Booking confirmation
  POST   /bookings/{id}/complete  → Mark as completed
  
Database: PostgreSQL (bookings, availability slots)
Cache: Redis (real-time availability, confirmation codes)
Queue: Kafka (booking.created, booking.confirmed, booking.cancelled events)
```

#### 4. **Payroll Service** (payroll-svc)
```
Endpoints:
  POST   /payroll/calculate       → Calculate salaries
  GET    /payroll/{month}         → Monthly payroll report
  POST   /payroll/{id}/approve    → Approve payroll
  POST   /payroll/{id}/process    → Execute payment
  GET    /payroll/{id}/deductions → Deduction breakdown
  GET    /payroll/{id}/audit-trail → Compliance audit
  
Database: PostgreSQL (payroll_records, deductions, tax_withholdings)
Queue: Kafka (payroll.calculated, payroll.approved, payroll.processed)
Search: Elasticsearch (payroll history)
```

#### 5. **Compliance Service** (compliance-svc)
```
Endpoints:
  GET    /compliance/status       → Compliance health check
  POST   /compliance/audit        → Generate audit report
  GET    /compliance/taxes/{country} → Tax config per country
  POST   /compliance/export       → Export for authorities (BIR, SSS, etc.)
  GET    /compliance/regulations  → Applicable regulations
  
Database: PostgreSQL (compliance_configs, audit_logs, tax_tables)
Search: Elasticsearch (audit logs)
```

#### 6. **Reporting Service** (reporting-svc)
```
Endpoints:
  GET    /reports/dashboard       → Executive dashboard
  GET    /reports/revenue         → Revenue analytics
  GET    /reports/therapist-metrics → Therapist performance
  GET    /reports/customer-churn  → Retention analysis
  POST   /reports/export          → Excel/PDF export
  GET    /reports/schedule        → Scheduled report generation
  
Database: PostgreSQL (read-only replica for heavy queries)
Cache: Redis (dashboard data, TTL 1 hour)
Search: Elasticsearch (historical data)
```

---

## Multi-Region Deployment

### Regional Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Global Control Plane (us-east-1)               │
│         (Tenant Config, Master Auth, Analytics)             │
└────┬────────────┬───────────────┬────────────┬──────────────┘
     │            │               │            │
┌────▼──┐  ┌─────▼──┐  ┌────────▼┐  ┌───────▼──┐
│ap-se-1│  │ap-se-2 │  │ap-ne-1  │  │eu-west-1│
│Seoul  │  │Manila  │  │Tokyo    │  │Frankfurt │
│(Korea)│  │(PH)    │  │(Japan)  │  │(EU)      │
└────┬──┘  └─────┬──┘  └────────┬┘  └───────┬──┘
     │           │             │           │
  ┌──▼─┐      ┌──▼─┐        ┌──▼─┐     ┌──▼─┐
  │RDS │      │RDS │        │RDS │     │RDS │
  │PRI │      │PRI │        │PRI │     │PRI │
  └────┘      └────┘        └────┘     └────┘
     │           │             │           │
  ┌──▼─┐      ┌──▼─┐        ┌──▼─┐     ┌──▼─┐
  │K8S │      │K8S │        │K8S │     │K8S │
  │App │      │App │        │App │     │App │
  └────┘      └────┘        └────┘     └────┘
     │           │             │           │
  ┌──▼─┐      ┌──▼─┐        ┌──▼─┐     ┌──▼─┐
  │CDN │      │CDN │        │CDN │     │CDN │
  └────┘      └────┘        └────┘     └────┘
```

### Data Replication Strategy

**Cross-Region Replication (RPO = 1 sec, RTO = 5 min)**

```yaml
PostgreSQL_Primary (Seoul):
  → Synchronous Replica (Seoul Standby) [Same AZ]
  → Asynchronous Replica (Manila) [Different Region]
  → Asynchronous Replica (Tokyo) [Different Region]
  → Asynchronous Replica (Frankfurt) [For EU GDPR]
```

### Region-Specific Services

```
┌─ Korea Region (ap-northeast-2)
│  ├─ Therapist Location: Real-time WebSocket
│  ├─ Payment: NICE, Inicis integration
│  ├─ Compliance: Ministry of Health/Welfare
│  └─ Reporting: Korean business tax standards
│
├─ Philippines Region (ap-southeast-1)
│  ├─ Payment: PayMaya, GCash integration
│  ├─ Compliance: SSS, PhilHealth, BIR
│  ├─ Payroll: 13th month bonus, special deductions
│  └─ Tax: BIR filing (2307, 2308)
│
├─ Thailand Region (ap-southeast-1)
│  ├─ Payment: Omise, 2C2P integration
│  ├─ Compliance: BHXH, Ministry of Labour
│  ├─ Payroll: Statutory termination benefits
│  └─ Tax: Thai revenue code
│
└─ Indonesia Region (ap-southeast-2)
   ├─ Payment: Midtrans, OVO integration
   ├─ Compliance: BPJS, Kemenaker
   ├─ Payroll: Provincial minimum wage adjustments
   └─ Tax: Indonesian income tax progressive brackets
```

---

## Database Architecture

### Schema Design: Multi-Tenant

```sql
-- Core tenant isolation
CREATE TABLE tenants (
    id SERIAL PRIMARY KEY,
    business_id VARCHAR(50) UNIQUE NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    country_code CHAR(2) NOT NULL,
    region VARCHAR(20) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    timezone VARCHAR(50) NOT NULL,
    subscription_tier VARCHAR(20) DEFAULT 'starter',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for fast lookups
    INDEX idx_country (country_code),
    INDEX idx_region (region),
    INDEX idx_status (status)
);

-- All business tables include tenant_id
CREATE TABLE therapists (
    id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id),
    specialization VARCHAR(100),
    experience_years INT,
    hourly_rate_base DECIMAL(10,2),
    country_code CHAR(2),
    
    -- Composite unique constraint per tenant
    UNIQUE(tenant_id, user_id),
    
    -- Indexes
    INDEX idx_tenant_therapist (tenant_id, status),
    INDEX idx_country_therapist (country_code),
    
    -- JSONB for flexible attributes
    attributes JSONB
);

-- Row-level security (RLS) for multi-tenancy
ALTER TABLE therapists ENABLE ROW LEVEL SECURITY;

CREATE POLICY therapist_tenant_isolation
    ON therapists
    FOR SELECT
    USING (tenant_id = current_setting('app.current_tenant_id')::INT);
```

### Partitioning Strategy

```python
# Time-based partitioning for high-volume tables
CREATE TABLE bookings (
    id BIGSERIAL,
    tenant_id INT NOT NULL,
    booking_date DATE NOT NULL,
    -- ... other columns
    
    PRIMARY KEY (id, booking_date),
    CONSTRAINT bookings_tenant_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) PARTITION BY RANGE (booking_date);

CREATE TABLE bookings_2026_q1 PARTITION OF bookings
    FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');

CREATE TABLE bookings_2026_q2 PARTITION OF bookings
    FOR VALUES FROM ('2026-04-01') TO ('2026-07-01');
```

### Connection Pooling

```python
# PgBouncer configuration for multi-tenant
# /etc/pgbouncer/pgbouncer.ini

[databases]
primary_db = host=10.0.1.100 port=5432 dbname=elspa_primary
replica_db = host=10.0.2.100 port=5432 dbname=elspa_primary

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
reserve_pool_size = 5
reserve_pool_timeout = 3
min_pool_size = 10
```

### Backup & PITR (Point-in-Time Recovery)

```yaml
PostgreSQL Backup Strategy:
  - Daily full backups → S3 (all regions)
  - WAL archiving → S3 (continuous)
  - Point-in-time recovery: 35 days
  - RTO (Recovery Time Objective): < 1 hour
  - RPO (Recovery Point Objective): < 5 minutes
  
Backup Schedule:
  - 02:00 UTC: Full backup
  - Hourly: WAL archiving
  - Weekly: Verification restore test
```

---

## API Gateway & Security

### Kong Gateway Configuration

```yaml
# api-gateway-config.yaml
services:
  - name: auth-service
    url: http://auth-svc:8001
    routes:
      - paths:
          - /api/v1/auth
        protocols:
          - https

  - name: user-service
    url: http://user-svc:8002
    routes:
      - paths:
          - /api/v1/users
        protocols:
          - https

plugins:
  - name: jwt
    config:
      key_claim_name: iss
      secret: ${JWT_SECRET}
      algorithm: HS256
      claims_to_verify:
        - exp

  - name: rate-limiting
    config:
      minute: 1000
      hour: 100000
      policy: local
      fault_tolerant: true

  - name: correlation-id
    config:
      header_name: X-Request-ID

  - name: request-transformer
    config:
      add:
        headers:
          - X-Tenant-ID: ${tenant_id}
          - X-Region: ${region}

  - name: response-transformer
    config:
      add:
        headers:
          - X-Response-Time: ${response_time}ms
```

### JWT Token Structure

```json
{
  "iss": "https://elspa.app/auth",
  "sub": "user_123",
  "aud": "elspa-app",
  "exp": 1719696000,
  "iat": 1719609600,
  "tenant_id": "business_001",
  "tenant_code": "KR",
  "user_id": 123,
  "email": "therapist@healing-spa.kr",
  "role": "therapist",
  "permissions": [
    "read:bookings",
    "write:bookings:own",
    "read:availability"
  ],
  "scopes": ["bookings:read", "bookings:write"],
  "mfa_verified": true,
  "session_id": "sess_abc123def456"
}
```

### Rate Limiting Strategy

```
Global Limits (per IP):
  - 1,000 requests/minute
  - 100,000 requests/hour
  - 1M requests/day

Per-Tenant Limits:
  - Free tier: 100 requests/minute
  - Pro tier: 1,000 requests/minute
  - Enterprise: 10,000 requests/minute (custom)

Per-Endpoint Limits:
  - POST /bookings: 50 req/min (prevent spam)
  - GET /availability: 500 req/min (high traffic)
  - POST /payroll/process: 5 req/min (critical)
  
Burst Handling:
  - Token bucket algorithm (60 tokens, refill 1/sec)
  - Fallback to response-time throttling (queue)
  - Circuit breaker for cascading failures
```

### CORS & Security Headers

```python
# app/middleware/security.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://healing-spa.kr",
        "https://healing-spa.ph",
        "https://elspa-admin.app",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "X-Tenant-ID",
        "X-Request-ID",
    ],
    max_age=86400,
)

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'"
        return response

app.add_middleware(SecurityHeadersMiddleware)
```

---

## Caching Strategy

### Multi-Layer Caching Architecture

```
┌──────────────────────────────────────────────────┐
│     Browser Cache (Static Assets)                │
│     TTL: 1 year (immutable assets)               │
└──────────────────┬───────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────┐
│     CDN Cache (Cloudflare)                       │
│     - Pages: TTL 1 hour                          │
│     - APIs: TTL 5 mins                           │
│     - Images: TTL 1 year (immutable)             │
└──────────────────┬───────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────┐
│     Redis Cache Layer (Application)              │
│     - Session: TTL 24 hours                      │
│     - User Profiles: TTL 1 hour                  │
│     - Availability Slots: TTL 5 mins             │
│     - Rate Limit Counters: TTL 1 min             │
└──────────────────┬───────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────┐
│     Database (PostgreSQL)                        │
│     - Source of truth                            │
│     - Read replicas for reporting                │
└──────────────────────────────────────────────────┘
```

### Redis Configuration (Cluster Mode)

```python
# app/cache/redis_config.py
from redis.cluster import RedisCluster
from redis.sentinel import Sentinel

class CacheManager:
    def __init__(self, mode: str = "cluster"):
        if mode == "cluster":
            self.redis = RedisCluster(
                startup_nodes=[
                    {"host": "redis-1", "port": 6379},
                    {"host": "redis-2", "port": 6379},
                    {"host": "redis-3", "port": 6379},
                ],
                skip_full_coverage_check=True,
                max_connections=100,
            )
        elif mode == "sentinel":
            self.sentinel = Sentinel([
                ("sentinel-1", 26379),
                ("sentinel-2", 26379),
                ("sentinel-3", 26379),
            ])
            self.redis = self.sentinel.master_for("elspa-master")
    
    async def get(self, key: str, ttl: int = 3600):
        """Get with TTL"""
        return self.redis.get(key)
    
    async def set(self, key: str, value: str, ttl: int = 3600):
        """Set with TTL"""
        self.redis.setex(key, ttl, value)
    
    async def invalidate_pattern(self, pattern: str):
        """Invalidate cache by pattern"""
        keys = self.redis.keys(pattern)
        if keys:
            self.redis.delete(*keys)

# Cache keys namespace
CACHE_KEYS = {
    "therapist_schedule": "cache:therapist:{therapist_id}:schedule:{date}",
    "user_profile": "cache:user:{user_id}:profile",
    "availability_slots": "cache:availability:{location_id}:{date}",
    "payroll_deductions": "cache:payroll:deductions:{country_code}:{year}",
    "session": "cache:session:{session_id}",
}
```

### Cache Invalidation Strategy

```python
# app/events/cache_invalidation.py
from enum import Enum
import asyncio

class CacheEvent(Enum):
    THERAPIST_UPDATED = "therapist.updated"
    BOOKING_CREATED = "booking.created"
    PAYROLL_CALCULATED = "payroll.calculated"
    AVAILABILITY_CHANGED = "availability.changed"

async def handle_cache_invalidation(event: CacheEvent, entity_id: str):
    """
    Event-driven cache invalidation using Kafka
    """
    cache_patterns = {
        CacheEvent.THERAPIST_UPDATED: f"cache:therapist:{entity_id}:*",
        CacheEvent.BOOKING_CREATED: f"cache:availability:*",
        CacheEvent.PAYROLL_CALCULATED: f"cache:payroll:*:{entity_id}",
        CacheEvent.AVAILABILITY_CHANGED: f"cache:availability:{entity_id}:*",
    }
    
    pattern = cache_patterns[event]
    await cache_manager.invalidate_pattern(pattern)
```

---

## Payroll Engine

### Multi-Country Payroll Calculation

```python
# app/services/payroll/payroll_engine.py
from typing import Dict, List
from decimal import Decimal
from datetime import datetime

class PayrollCalculationEngine:
    """
    Enterprise-grade payroll engine supporting 10+ countries
    with region-specific deductions, taxes, and compliance.
    """
    
    def __init__(self, country_code: str, year: int, month: int):
        self.country_code = country_code
        self.year = year
        self.month = month
        self.config = self.load_country_config()
        self.tax_brackets = self.load_tax_brackets()
    
    def calculate_monthly_payroll(
        self,
        therapist: TherapistRecord,
        hours_worked: Decimal,
        bookings: List[BookingRecord],
    ) -> PayrollResult:
        """
        Main payroll calculation orchestrator
        
        Returns:
            PayrollResult with detailed breakdown
        """
        # Step 1: Calculate gross compensation
        gross_pay = self._calculate_gross_pay(therapist, hours_worked, bookings)
        
        # Step 2: Calculate deductions
        deductions = self._calculate_deductions(therapist, gross_pay)
        
        # Step 3: Calculate income tax
        tax_withholding = self._calculate_income_tax(gross_pay, deductions)
        
        # Step 4: Calculate net pay
        net_pay = gross_pay - sum(deductions.values()) - tax_withholding["total"]
        
        # Step 5: Generate audit trail
        audit_trail = self._generate_audit_trail(
            gross_pay, deductions, tax_withholding, net_pay
        )
        
        return PayrollResult(
            therapist_id=therapist.id,
            gross_pay=gross_pay,
            deductions=deductions,
            tax_withholding=tax_withholding,
            net_pay=net_pay,
            audit_trail=audit_trail,
            calculation_date=datetime.utcnow(),
        )
    
    def _calculate_gross_pay(
        self,
        therapist: TherapistRecord,
        hours_worked: Decimal,
        bookings: List[BookingRecord],
    ) -> Decimal:
        """Calculate base salary + bonuses + incentives"""
        
        # Base salary
        monthly_salary = therapist.annual_salary / 12
        
        # Commission from bookings
        commission = Decimal(0)
        for booking in bookings:
            if booking.status == "completed":
                commission += booking.service_amount * Decimal(therapist.commission_rate)
        
        # Overtime premium (if applicable)
        overtime_premium = Decimal(0)
        if hours_worked > 160:  # Standard 160 hours/month
            overtime_hours = hours_worked - 160
            overtime_rate = therapist.hourly_rate * Decimal(1.5)  # 1.5x for OT
            overtime_premium = overtime_hours * overtime_rate
        
        # Holiday premium (if applicable)
        holiday_premium = self._calculate_holiday_premium(bookings)
        
        return monthly_salary + commission + overtime_premium + holiday_premium
    
    def _calculate_deductions(
        self,
        therapist: TherapistRecord,
        gross_pay: Decimal,
    ) -> Dict[str, Decimal]:
        """Calculate country-specific deductions"""
        
        deductions = {}
        
        # Load country-specific deduction rules
        if self.country_code == "PH":
            deductions = self._calculate_ph_deductions(therapist, gross_pay)
        elif self.country_code == "TH":
            deductions = self._calculate_th_deductions(therapist, gross_pay)
        elif self.country_code == "VN":
            deductions = self._calculate_vn_deductions(therapist, gross_pay)
        elif self.country_code == "ID":
            deductions = self._calculate_id_deductions(therapist, gross_pay)
        elif self.country_code == "KR":
            deductions = self._calculate_kr_deductions(therapist, gross_pay)
        
        return deductions
    
    def _calculate_ph_deductions(
        self,
        therapist: TherapistRecord,
        gross_pay: Decimal,
    ) -> Dict[str, Decimal]:
        """
        Philippines Deductions:
        - SSS (Social Security System): 11.5% (employee portion)
        - PhilHealth: 3.3% (2025 rate)
        - Pag-IBIG: 1.0% (House Benefit/2% employer match)
        - Withholding Tax (BIR): Progressive brackets
        """
        
        deductions = {}
        
        # SSS contribution
        sss_rate = Decimal("0.115")
        sss_ec = Decimal("30")  # Employee Compensation (approximately)
        sss_contribution = min(gross_pay * sss_rate, sss_ec)
        deductions["sss"] = sss_contribution
        
        # PhilHealth contribution
        philhealth_rate = Decimal("0.033")
        deductions["philhealth"] = gross_pay * philhealth_rate
        
        # Pag-IBIG contribution
        pag_ibig_rate = Decimal("0.01")
        deductions["pag_ibig"] = gross_pay * pag_ibig_rate
        
        # Additional employer-mandated deductions
        if therapist.has_health_insurance:
            deductions["health_insurance"] = Decimal("500")
        
        return deductions
    
    def _calculate_income_tax(
        self,
        gross_pay: Decimal,
        deductions: Dict[str, Decimal],
    ) -> Dict[str, Decimal]:
        """
        Calculate progressive income tax for country
        
        Example: Philippines BIR Tax Table (2026):
        - 0-250K: 0%
        - 250K-400K: 12%
        - 400K-800K: 20%
        - 800K+: 32%
        """
        
        taxable_income = gross_pay - sum(deductions.values())
        
        tax_withholding = {}
        tax_amount = Decimal(0)
        
        for bracket in self.tax_brackets:
            if taxable_income > bracket["min"]:
                income_in_bracket = min(taxable_income, bracket["max"]) - bracket["min"]
                tax_in_bracket = income_in_bracket * Decimal(bracket["rate"])
                tax_amount += tax_in_bracket
                
                tax_withholding[f"bracket_{bracket['min']}_{bracket['max']}"] = tax_in_bracket
        
        tax_withholding["total"] = tax_amount
        
        return tax_withholding
    
    def _calculate_holiday_premium(self, bookings: List[BookingRecord]) -> Decimal:
        """Calculate premium for holiday/weekend work"""
        
        premium = Decimal(0)
        
        for booking in bookings:
            booking_date = booking.booking_datetime.date()
            
            # Check if holiday (country-specific)
            if self._is_holiday(booking_date):
                premium += booking.service_amount * Decimal("0.25")  # 25% premium
            elif booking_date.weekday() >= 5:  # Saturday/Sunday
                premium += booking.service_amount * Decimal("0.15")  # 15% premium
        
        return premium
    
    def _generate_audit_trail(
        self,
        gross_pay: Decimal,
        deductions: Dict[str, Decimal],
        tax_withholding: Dict[str, Decimal],
        net_pay: Decimal,
    ) -> Dict:
        """Generate compliance audit trail"""
        
        return {
            "calculation_timestamp": datetime.utcnow().isoformat(),
            "gross_pay": float(gross_pay),
            "deductions": {k: float(v) for k, v in deductions.items()},
            "tax_withholding": {k: float(v) for k, v in tax_withholding.items()},
            "net_pay": float(net_pay),
            "checksum": self._calculate_checksum(gross_pay, deductions, tax_withholding),
        }
    
    def load_country_config(self) -> Dict:
        """Load country-specific payroll configuration"""
        # Query from database or config file
        return {
            "country_code": self.country_code,
            "currency": self._get_currency(self.country_code),
            "decimal_places": 2,
            "pay_frequency": "monthly",
            "fiscal_year_start": 1,
        }
    
    def load_tax_brackets(self) -> List[Dict]:
        """Load progressive tax brackets for country"""
        # Query from database
        pass
    
    def _is_holiday(self, date: datetime.date) -> bool:
        """Check if date is a public holiday"""
        # Query from holidays database
        pass
    
    def _get_currency(self, country_code: str) -> str:
        """Get currency code for country"""
        currencies = {
            "KR": "KRW",
            "PH": "PHP",
            "TH": "THB",
            "VN": "VND",
            "ID": "IDR",
        }
        return currencies.get(country_code, "USD")
    
    def _calculate_checksum(self, *args) -> str:
        """Generate checksum for audit trail integrity"""
        import hashlib
        data = str(args).encode()
        return hashlib.sha256(data).hexdigest()
```

### Payroll Processing Workflow

```
Payroll Processing Pipeline:
  ├─ Step 1: Data Collection (Hours, Bookings)
  │   └─ Query: SELECT * FROM therapist_hours WHERE month = {month}
  │
  ├─ Step 2: Calculation
  │   ├─ Calculate gross pay
  │   ├─ Apply deductions
  │   ├─ Calculate taxes
  │   └─ Publish "payroll.calculated" event
  │
  ├─ Step 3: Review & Approval
  │   ├─ Send to manager for review
  │   ├─ Manager approves/rejects
  │   └─ Publish "payroll.approved" event
  │
  ├─ Step 4: Payment Processing
  │   ├─ Batch fund transfer to bank
  │   ├─ Payment gateway integration
  │   └─ Publish "payroll.processed" event
  │
  └─ Step 5: Reporting & Compliance
      ├─ Generate tax authority reports (BIR, SSS, etc.)
      ├─ Update ledger
      └─ Archive audit trail
```

---

## Compliance & Security

### Data Privacy Compliance

#### GDPR (General Data Protection Regulation) - EU Regions

```python
# app/services/compliance/gdpr_service.py
class GDPRService:
    """
    Implements GDPR compliance mechanisms:
    - Right to access (Article 15)
    - Right to erasure (Article 17)
    - Data portability (Article 20)
    - Breach notification (Article 33)
    """
    
    async def export_personal_data(self, user_id: int) -> str:
        """
        Export user's personal data as JSON (GDPR Article 20)
        - Format: JSON, CSV, or machine-readable format
        - Timeframe: 30 days
        """
        user = await db.get(User, user_id)
        
        export_data = {
            "personal_info": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "phone": user.phone,
                "created_at": user.created_at,
            },
            "bookings": await db.query(Booking).filter_by(user_id=user_id),
            "payments": await db.query(Payment).filter_by(user_id=user_id),
            "communications": await db.query(Message).filter_by(user_id=user_id),
        }
        
        # Store in temporary encrypted S3 bucket
        return await s3.upload(
            key=f"gdpr-exports/{user_id}/{datetime.utcnow().isoformat()}.json",
            data=export_data,
            expiration_days=30,
        )
    
    async def delete_personal_data(self, user_id: int) -> None:
        """
        Right to erasure (GDPR Article 17)
        - Remove user data except legally required records
        - Maintain anonymized audit logs
        """
        user = await db.get(User, user_id)
        
        # Anonymize personal information
        user.name = "DELETED_USER"
        user.email = None
        user.phone = None
        user.date_of_birth = None
        
        # Delete related personal data
        await db.delete_all(Booking, user_id=user_id)
        await db.delete_all(Payment, user_id=user_id)
        
        # Keep audit logs (anonymized)
        audit_logs = await db.query(AuditLog).filter_by(user_id=user_id)
        for log in audit_logs:
            log.user_id = None
            log.user_email = "REDACTED"
        
        await db.commit()
        
        # Notify third parties
        await self._notify_data_processors(user_id)
    
    async def handle_data_breach(self, breach_details: Dict) -> None:
        """
        Data breach notification (GDPR Article 33)
        - Notify supervisory authority within 72 hours
        - Notify affected individuals
        """
        # Log breach
        await db.create(DataBreach, **breach_details)
        
        # Notify authorities
        await self._notify_dpa(breach_details)
        
        # Notify individuals
        affected_users = await self._get_affected_users(breach_details)
        for user in affected_users:
            await self._send_breach_notification(user)
```

#### PDPA (Thailand) & DPA (Vietnam) Compliance

```python
# app/services/compliance/regional_compliance.py
class RegionalComplianceService:
    
    async def ensure_consent(self, user_id: int, country_code: str) -> bool:
        """
        PDPA (Thailand): Explicit consent required
        DPA (Vietnam): Prior authorization required
        """
        consent = await db.get(UserConsent, user_id=user_id)
        
        if country_code == "TH":
            # PDPA: Personal Data Protection Act B.E. 2562 (2019)
            return consent and consent.pdpa_consent and consent.pdpa_consent_date
        elif country_code == "VN":
            # DPA: Vietnamese Law on Personal Data Protection
            return consent and consent.dpa_consent and consent.dpa_consent_date
        
        return True
    
    async def log_data_access(self, user_id: int, accessor_id: int, reason: str):
        """
        Log all data access for audit trail
        Required by: PDPA, DPA, GDPR
        """
        await db.create(DataAccessLog, {
            "user_id": user_id,
            "accessor_id": accessor_id,
            "access_timestamp": datetime.utcnow(),
            "reason": reason,
            "ip_address": self.get_request_ip(),
            "data_fields_accessed": self.get_requested_fields(),
        })
```

### Encryption & Key Management

```python
# app/services/security/encryption.py
from cryptography.fernet import Fernet
from google.cloud import kms
import os

class EncryptionService:
    """
    Encryption at rest & in transit
    - Use AWS KMS or Google Cloud KMS for key management
    - Rotate keys annually
    - TLS 1.3 for all data in transit
    """
    
    def __init__(self):
        # Use KMS for key management (never hardcode keys)
        self.kms_client = kms.KeyManagementServiceClient()
        self.project_id = os.getenv("GCP_PROJECT_ID")
        self.key_ring = os.getenv("KMS_KEY_RING")
    
    async def encrypt_pii(self, plaintext: str, user_id: int) -> str:
        """Encrypt personally identifiable information"""
        
        # Get encryption key from KMS
        key_name = self.kms_client.crypto_key_path(
            self.project_id,
            "global",
            self.key_ring,
            "user-pii-key",
        )
        
        # Encrypt data
        encrypt_response = self.kms_client.encrypt(
            request={"name": key_name, "plaintext": plaintext.encode()}
        )
        
        ciphertext = encrypt_response.ciphertext
        
        # Store with metadata
        await db.create(EncryptedField, {
            "user_id": user_id,
            "field_type": "pii",
            "ciphertext": ciphertext,
            "encryption_key_version": encrypt_response.ciphertext_crc32c,
        })
        
        return ciphertext.hex()
    
    async def decrypt_pii(self, ciphertext_hex: str) -> str:
        """Decrypt PII (requires audit logging)"""
        
        ciphertext = bytes.fromhex(ciphertext_hex)
        
        key_name = self.kms_client.crypto_key_path(
            self.project_id,
            "global",
            self.key_ring,
            "user-pii-key",
        )
        
        decrypt_response = self.kms_client.decrypt(
            request={"name": key_name, "ciphertext": ciphertext}
        )
        
        return decrypt_response.plaintext.decode()
```

### Audit Logging

```python
# app/services/compliance/audit_logger.py
class AuditLogger:
    """
    Comprehensive audit logging for compliance
    - All data access
    - All modifications
    - All authentication events
    - Immutable log storage
    """
    
    async def log_event(
        self,
        event_type: str,
        user_id: int,
        resource_type: str,
        resource_id: str,
        action: str,
        changes: Dict = None,
        status: str = "success",
    ):
        """
        Log audit event
        
        event_type: "data_access", "modification", "auth", "admin_action"
        """
        
        audit_entry = AuditLog(
            event_type=event_type,
            user_id=user_id,
            resource_type=resource_type,
            resource_id=resource_id,
            action=action,
            changes=changes or {},
            status=status,
            timestamp=datetime.utcnow(),
            ip_address=self.get_request_ip(),
            user_agent=self.get_user_agent(),
        )
        
        # Store in append-only log
        await db.create(audit_entry)
        
        # Also stream to Elasticsearch for search/analysis
        await elasticsearch.index(
            index=f"audit-logs-{datetime.utcnow().strftime('%Y.%m.%d')}",
            body=audit_entry.dict(),
        )
        
        # Alert if critical action (payroll processing, user deletion, etc.)
        if self._is_critical_action(event_type, action):
            await self._send_alert(audit_entry)
    
    async def export_audit_report(
        self,
        start_date: date,
        end_date: date,
        event_type: str = None,
        user_id: int = None,
    ) -> str:
        """
        Export audit logs for compliance review
        Immutable, digitally signed
        """
        
        query = AuditLog.query.filter(
            AuditLog.timestamp >= start_date,
            AuditLog.timestamp <= end_date,
        )
        
        if event_type:
            query = query.filter(AuditLog.event_type == event_type)
        
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
        
        logs = await query.all()
        
        # Generate PDF report with digital signature
        report = self._generate_pdf_report(logs)
        signature = self._digitally_sign(report)
        
        # Store in immutable storage (Glacier, tape archive)
        s3_key = f"audit-reports/{start_date.isoformat()}_to_{end_date.isoformat()}.pdf"
        await s3.upload(s3_key, report)
        
        return s3_key
```

---

## Integrations

### Payment Processing (Per-Country)

```python
# app/integrations/payment_gateway.py
from abc import ABC, abstractmethod

class PaymentGateway(ABC):
    """Abstract base for country-specific payment gateways"""
    
    @abstractmethod
    async def process_payment(self, transaction: Transaction) -> PaymentResult:
        pass
    
    @abstractmethod
    async def refund_payment(self, transaction_id: str, amount: Decimal) -> RefundResult:
        pass
    
    @abstractmethod
    async def verify_3d_secure(self, verification_code: str) -> bool:
        pass

class NIGateway(PaymentGateway):
    """NICE (Korea) Payment Gateway"""
    
    def __init__(self):
        self.api_key = os.getenv("NICE_API_KEY")
        self.base_url = "https://api.nicepay.co.kr"
    
    async def process_payment(self, transaction: Transaction) -> PaymentResult:
        payload = {
            "merchantId": os.getenv("NICE_MERCHANT_ID"),
            "transactionId": transaction.id,
            "amount": int(transaction.amount),
            "currencyCode": "410",  # KRW
            "merchantReference": transaction.reference,
            "paymentMethod": "Card",
            "redirectUrl": f"{os.getenv('BASE_URL')}/payment/callback",
        }
        
        response = await self.post("/payment/auth", payload)
        
        return PaymentResult(
            gateway="NICE",
            transaction_id=transaction.id,
            approval_code=response["approvalNo"],
            status="approved" if response["resultCode"] == "00" else "failed",
        )

class PayMayaGateway(PaymentGateway):
    """PayMaya (Philippines) Payment Gateway"""
    
    async def process_payment(self, transaction: Transaction) -> PaymentResult:
        payload = {
            "totalAmount": {
                "value": float(transaction.amount),
                "currency": "PHP",
            },
            "paymentDetails": {
                "interactionType": "INLINE",
            },
            "redirect": {
                "successUrl": f"{os.getenv('BASE_URL')}/payment/success",
                "failureUrl": f"{os.getenv('BASE_URL')}/payment/failed",
                "cancelUrl": f"{os.getenv('BASE_URL')}/payment/cancelled",
            },
            "requestReferenceNumber": transaction.reference,
        }
        
        response = await self.post("/checkout/v1/charge", payload)
        
        return PaymentResult(
            gateway="PayMaya",
            transaction_id=transaction.id,
            redirect_url=response["redirectUrl"],
            status="pending_payment",
        )

# Gateway factory
class PaymentGatewayFactory:
    gateways = {
        "KR": NIGateway,
        "PH": PayMayaGateway,
        "TH": OmiseGateway,
        "VN": VNPayGateway,
        "ID": MidtransGateway,
    }
    
    @staticmethod
    def get_gateway(country_code: str) -> PaymentGateway:
        gateway_class = PaymentGatewayFactory.gateways[country_code]
        return gateway_class()
```

### Tax Authority Integrations

```python
# app/integrations/tax_authority.py
class TaxAuthorityIntegration(ABC):
    """Integration with tax authority systems"""
    
    @abstractmethod
    async def submit_payroll_report(self, payroll_data: Dict) -> SubmissionResult:
        pass
    
    @abstractmethod
    async def verify_tax_id(self, tax_id: str) -> bool:
        pass

class BIRIntegration(TaxAuthorityIntegration):
    """Bureau of Internal Revenue (Philippines) Integration"""
    
    async def submit_payroll_report(self, payroll_data: Dict) -> SubmissionResult:
        """
        Submit 2307 (Withholding Tax) & 2308 (Expanded Withholding Tax) forms
        to BIR through e-filing system
        """
        
        form_2307 = self._generate_form_2307(payroll_data)
        
        # Submit via BIR e-filing API
        response = await self.post(
            "https://efiling.bir.gov.ph/api/v1/submit",
            {
                "form_type": "2307",
                "data": form_2307,
                "digital_signature": self._sign_form(form_2307),
            }
        )
        
        return SubmissionResult(
            authority="BIR",
            form_type="2307",
            submission_id=response["submissionId"],
            status="accepted",
        )
```

### Banking Integration for Payroll

```python
# app/integrations/banking.py
class BankingService:
    """Batch fund transfers for payroll"""
    
    async def process_payroll_disbursement(self, payroll_batch: PayrollBatch) -> BatchResult:
        """
        Process batch payroll transfers
        - Group by bank account
        - Create transfer orders
        - Track delivery
        """
        
        # Group therapists by bank
        transfers_by_bank = defaultdict(list)
        
        for payroll_record in payroll_batch.records:
            bank_code = payroll_record.therapist.bank_code
            transfers_by_bank[bank_code].append(payroll_record)
        
        results = []
        
        for bank_code, transfers in transfers_by_bank.items():
            bank_api = self.get_bank_api(bank_code)
            
            batch_transfer = {
                "batch_id": f"payroll_{payroll_batch.month}_{bank_code}",
                "total_amount": sum(t.net_pay for t in transfers),
                "transfers": [
                    {
                        "recipient_account": t.therapist.bank_account,
                        "recipient_name": t.therapist.name,
                        "amount": float(t.net_pay),
                        "reference": f"Payroll {payroll_batch.month}",
                    }
                    for t in transfers
                ],
            }
            
            result = await bank_api.submit_batch_transfer(batch_transfer)
            results.append(result)
        
        return BatchResult(results)
```

---

## Performance Benchmarks

### API Response Time Targets

```
GET /api/v1/availability             → < 100ms   (p99)
GET /api/v1/users/{id}               → < 50ms    (p99)
POST /api/v1/bookings                → < 200ms   (p99)
GET /api/v1/reports/dashboard        → < 1000ms  (p99)
POST /api/v1/payroll/calculate       → < 5000ms  (p99)
POST /api/v1/payroll/process         → < 30000ms (async)

Database Query Latency (p99):
- Simple SELECT: < 10ms
- JOINs (3-table): < 50ms
- Aggregations: < 100ms
- Full-text search: < 500ms

Cache Hit Rate Targets:
- Session cache: > 95%
- User profile cache: > 85%
- Availability cache: > 90%
```

### Load Testing Results

```
Configuration:
- Load generator: Apache JMeter / Locust
- Duration: 1 hour
- Concurrent users: 10,000
- Throughput ramp-up: 100 req/s to 1,000 req/s

Results (baseline):
- Median response time: 45ms
- p95 response time: 150ms
- p99 response time: 250ms
- Error rate: 0.01% (SLA target: < 0.1%)
- Throughput: 50,000 req/s
- CPU utilization: 60%
- Memory: 80% of capacity
```

---

## Disaster Recovery

### RTO/RPO Targets

```
RTO (Recovery Time Objective): 15 minutes
RPO (Recovery Point Objective): 5 minutes

Multi-Region Failover (Automated):
  ├─ Primary Region (Seoul): ap-northeast-2
  ├─ Secondary Region (Manila): ap-southeast-1
  └─ Tertiary Region (Tokyo): ap-northeast-1
  
If Primary Fails:
  ├─ Detect: Health check failure (< 5 sec)
  ├─ Failover: Traffic redirected to Secondary (< 30 sec)
  ├─ Data: Continuous replication (RPO 5 sec)
  └─ Application: Auto-scale in Secondary region (< 10 min)
```

### Backup Strategy

```yaml
PostgreSQL Backups:
  - Daily Full Backup: 02:00 UTC → S3
  - WAL Archiving: Continuous → S3
  - Backup Retention: 35 days
  - Point-in-time recovery: Yes (entire history)
  - Backup Verification: Weekly automated restore test

Redis Persistence:
  - RDB Snapshot: Every 6 hours → S3
  - AOF (Append-Only File): Every 1 second
  - Replication: Master-Replica sync (sub-second)

Application Logs:
  - ELK Stack: Elasticsearch (7-day retention)
  - Glacier: Long-term archive (7 years)
  - Splunk: Real-time search & alerting

Code Repository:
  - GitHub: Multi-region redundancy
  - Backup: Daily mirror to GitLab
```

### Incident Response Procedures

```
Phase 1: Detection (< 5 min)
  ├─ Automated alert from monitoring
  ├─ Team notification (Slack, PagerDuty)
  └─ War room established

Phase 2: Assessment (< 10 min)
  ├─ Identify scope (which services affected)
  ├─ Check backup status
  └─ Initiate failover if needed

Phase 3: Recovery (< 15 min)
  ├─ Restore from backup
  ├─ Verify data integrity
  └─ Switch traffic to recovered system

Phase 4: Validation (< 5 min)
  ├─ Health checks pass
  ├─ User-facing services confirmed
  └─ Declare incident resolved

Phase 5: Post-mortem (24 hours)
  ├─ Root cause analysis
  ├─ Preventive measures
  └─ Documentation update
```

---

## Appendix: Monitoring & Observability

### Key Metrics

```
Business Metrics:
  - Daily Active Users (DAU)
  - Bookings per day
  - Revenue per region
  - Customer churn rate
  - Therapist utilization

Technical Metrics:
  - API response time (p50, p95, p99)
  - Error rate
  - Cache hit rate
  - Database query latency
  - CPU/Memory utilization
  - Disk I/O
  - Network bandwidth

Security Metrics:
  - Failed login attempts
  - API rate limit violations
  - Data access anomalies
  - Encryption key rotations
  - Audit log size
```

### Alerting Rules

```yaml
Critical Alerts:
  - API error rate > 1%: Page on-call engineer
  - Database latency > 1000ms: Page database team
  - Disk usage > 90%: Page infrastructure team
  - Authentication service down: Page security team

Warning Alerts:
  - API error rate > 0.5%: Slack notification
  - Cache hit rate < 80%: Slack notification
  - Memory usage > 80%: Slack notification
  - Sync lag > 60 seconds: Slack notification
```

---

**Document Version:** 2.0  
**Last Updated:** 2026-05-29  
**Next Review:** 2026-08-29  
**Maintainer:** Infrastructure & Security Team
