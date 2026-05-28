# GLOBAL DATA WAREHOUSE
## Data Architecture, ETL Pipelines & Pre-Built Analytics Queries for ElSpa

**Document Version:** 1.0  
**Last Updated:** 2026-05-29  
**Owner:** Data Engineering Lead / Analytics Manager  
**Audience:** Data Scientists, Analytics Team, Business Intelligence  
**Update Frequency:** Real-time (streaming) | Daily aggregations | Monthly archival  

---

## Table of Contents
1. [Data Architecture](#data-architecture)
2. [Data Modeling (Star Schema)](#data-modeling-star-schema)
3. [ETL Pipelines](#etl-pipelines)
4. [Data Retention & Compliance](#data-retention--compliance)
5. [Pre-Built Analytics Queries](#pre-built-analytics-queries)

---

## Data Architecture

### 1.1 System Architecture Diagram

```
┌────────────────────────────────────────────────────────┐
│                    DATA WAREHOUSE ARCHITECTURE          │
├────────────────────────────────────────────────────────┤
│                                                          │
│  RAW DATA LAYER (Source Systems):                      │
│  ├─ OLTP Database (PostgreSQL - Supabase)             │
│  │  ├─ users, customers, therapists                   │
│  │  ├─ appointments, transactions                      │
│  │  ├─ locations, analytics_events                    │
│  │  └─ audit_logs, payroll_records                    │
│  │                                                     │
│  ├─ Application Event Streams (Kafka)                 │
│  │  ├─ real-time-locations (WebSocket)               │
│  │  ├─ transaction-completed                          │
│  │  ├─ user-sessions                                  │
│  │  └─ error-events                                   │
│  │                                                     │
│  ├─ API Logs (Cloudflare / ELK Stack)                │
│  │  ├─ API request logs (all endpoints)              │
│  │  ├─ Performance metrics                            │
│  │  └─ Error logs (4xx, 5xx)                         │
│  │                                                     │
│  └─ External Data Sources:                            │
│     ├─ Payment gateway (Stripe/PayPal)               │
│     ├─ Exchange rates (ECB API)                       │
│     └─ Market data (optional: Mixpanel, Amplitude)   │
│                                                        │
│  ↓↓↓ ETL PIPELINE (Daily batch + Streaming) ↓↓↓      │
│                                                        │
│  STAGING LAYER (Raw data staging):                    │
│  ├─ S3 buckets (raw JSON/CSV files)                  │
│  │  ├─ s3://elspa-raw/customers/YYYY-MM-DD/         │
│  │  ├─ s3://elspa-raw/transactions/YYYY-MM-DD/       │
│  │  └─ s3://elspa-raw/events/YYYY-MM-DD/            │
│  │                                                    │
│  └─ Kafka topics (streaming real-time)               │
│     ├─ locations-stream                              │
│     ├─ transactions-stream                           │
│     └─ events-stream                                 │
│                                                        │
│  ↓↓↓ DATA TRANSFORMATION (DBT) ↓↓↓                   │
│                                                        │
│  WAREHOUSE LAYER (PostgreSQL Data Warehouse):        │
│  ├─ Fact Tables (Events):                            │
│  │  ├─ fact_appointments (granular appointments)    │
│  │  ├─ fact_transactions (every payment)            │
│  │  ├─ fact_user_sessions (session events)          │
│  │  └─ fact_locations (location tracking)           │
│  │                                                    │
│  ├─ Dimension Tables (Master Data):                  │
│  │  ├─ dim_customers                                 │
│  │  ├─ dim_therapists                                │
│  │  ├─ dim_regions                                   │
│  │  ├─ dim_date (time dimensions)                    │
│  │  └─ dim_products (service tiers)                  │
│  │                                                    │
│  └─ Aggregate Tables (Pre-calculated):               │
│     ├─ agg_daily_revenue (by region)                │
│     ├─ agg_customer_metrics (LTV, CAC)              │
│     ├─ agg_churn_analysis (by cohort)               │
│     └─ agg_regional_health (KPIs)                   │
│                                                        │
│  ↓↓↓ BUSINESS INTELLIGENCE LAYER ↓↓↓                │
│                                                        │
│  ANALYTICS & DASHBOARDS:                             │
│  ├─ Google Sheets (via Sheets API)                   │
│  ├─ Grafana (operational dashboards)                │
│  ├─ Tableau/Looker (if enterprise BI needed)        │
│  └─ Custom API (JSON endpoints for dashboards)      │
│                                                        │
│  END USERS:                                           │
│  ├─ Executives (high-level KPIs)                     │
│  ├─ Regional managers (regional drill-down)          │
│  ├─ Data scientists (SQL queries, Jupyter)          │
│  └─ BI team (dashboards, reports)                   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

### 1.2 Data Sources & Integration

**Primary Source Systems:**

```
┌─────────────────────────────────────────────────────┐
│          DATA SOURCES & INTEGRATION POINTS            │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Source 1: OLTP Database (Supabase PostgreSQL)      │
│ ├─ Connection: Direct PostgreSQL connection       │
│ ├─ Latency: <100ms                                │
│ ├─ Volume: 10M+ records/day                        │
│ ├─ Refresh: Continuous (CDC via Debezium)        │
│ └─ Tables: All production tables                  │
│                                                     │
│ Source 2: Application Event Streams (Kafka)       │
│ ├─ Event Types:                                    │
│ │  ├─ location-updated (1000s/sec at peak)        │
│ │  ├─ transaction-completed (50-100/sec)         │
│ │  ├─ appointment-booked (10-20/sec)             │
│ │  ├─ user-session-start (20-50/sec)            │
│ │  └─ error-occurred (variable, 1-10/sec)       │
│ ├─ Latency: <1 second (real-time)                │
│ ├─ Retention: 7 days in Kafka topics             │
│ └─ Format: JSON messages                          │
│                                                     │
│ Source 3: API Logs (ELK / Cloudflare)            │
│ ├─ Collection: Logstash aggregates from all      │
│ │  microservices and Cloudflare Workers         │
│ ├─ Volume: 50M+ log lines/day                    │
│ ├─ Retention: 30 days (searchable), 1 year (S3) │
│ └─ Used for: Performance analysis, troubleshooting│
│                                                     │
│ Source 4: Payment Gateway (Stripe/PayPal API)    │
│ ├─ Events: Payment succeeded, refunded, failed   │
│ ├─ Frequency: Webhook calls (real-time)         │
│ ├─ Reconciliation: Daily batch pull              │
│ └─ Latency: 1-5 seconds                          │
│                                                     │
│ Source 5: External APIs                          │
│ ├─ Exchange Rates: Daily (ECB API, 8 AM UTC)   │
│ ├─ Market Data: Daily (if using analytics CDP)  │
│ └─ Geographic Data: Static (region masters)     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Data Freshness SLA:**

| Source | Data Type | Latency | Refresh Frequency |
|--------|-----------|---------|-------------------|
| Transactions | OLTP | <1 min | Real-time (CDC) |
| Locations | Events | <100ms | Streaming |
| User Sessions | Events | <5 min | Streaming batches |
| Appointments | OLTP | <1 min | Real-time (CDC) |
| Daily Aggregates | Warehouse | <1 hour | Hourly job |
| Reporting Tables | Warehouse | <1 day | Nightly batch |
| External Data | APIs | <1 day | Daily batch (8 AM) |

---

## Data Modeling (Star Schema)

### 2.1 Fact Tables

**Fact_Appointments (Granular appointment-level data):**

```sql
CREATE TABLE warehouse.fact_appointments (
  appointment_id                INT PRIMARY KEY,
  customer_key                 INT REFERENCES dim_customers(customer_key),
  therapist_key                INT REFERENCES dim_therapists(therapist_key),
  service_key                  INT REFERENCES dim_products(product_key),
  region_key                   INT REFERENCES dim_regions(region_key),
  appointment_date_key         INT REFERENCES dim_date(date_key),
  
  -- Appointment Details
  appointment_datetime         TIMESTAMP,
  booked_datetime              TIMESTAMP,
  cancelled_datetime           TIMESTAMP (nullable),
  completed_datetime           TIMESTAMP (nullable),
  
  -- Metrics
  duration_minutes             INT,
  base_price_usd               DECIMAL(10,2),
  discount_amount_usd          DECIMAL(10,2),
  final_price_usd              DECIMAL(10,2),
  therapist_commission_usd     DECIMAL(10,2),
  
  -- Dimensions
  appointment_status           VARCHAR(20), -- booked, completed, cancelled, no-show
  cancellation_reason          VARCHAR(100),
  is_repeat_customer           BOOLEAN,
  
  -- Quality Metrics
  rating_score                 INT, -- 1-5
  review_text                  TEXT,
  customer_feedback_received   BOOLEAN,
  
  created_at                   TIMESTAMP DEFAULT NOW(),
  updated_at                   TIMESTAMP DEFAULT NOW()
);

Key Metrics Calculated:
  - Total revenue: SUM(final_price_usd)
  - Completion rate: COUNT(*) WHERE status='completed' / COUNT(*)
  - Average rating: AVG(rating_score)
  - No-show rate: COUNT(*) WHERE status='no-show' / COUNT(*)
```

**Fact_Transactions (Every payment/refund):**

```sql
CREATE TABLE warehouse.fact_transactions (
  transaction_id               INT PRIMARY KEY,
  customer_key                 INT REFERENCES dim_customers(customer_key),
  appointment_key              INT REFERENCES fact_appointments(appointment_id),
  region_key                   INT REFERENCES dim_regions(region_key),
  transaction_date_key         INT REFERENCES dim_date(date_key),
  
  -- Transaction Details
  transaction_datetime         TIMESTAMP,
  payment_method               VARCHAR(50), -- credit_card, paypal, gcash, etc
  gateway_transaction_id       VARCHAR(100), -- Stripe/PayPal ID
  
  -- Amounts (in original currency)
  amount_local_currency        DECIMAL(12,2),
  currency_code                VARCHAR(3), -- KRW, PHP, THB, VND, IDR
  exchange_rate_to_usd         DECIMAL(10,4),
  amount_usd_equivalent        DECIMAL(10,2),
  
  -- Status
  transaction_type             VARCHAR(20), -- charge, refund, adjustment
  transaction_status           VARCHAR(20), -- succeeded, failed, pending
  
  -- Metrics
  processing_fee_usd           DECIMAL(10,2),
  net_revenue_usd              DECIMAL(10,2),
  
  created_at                   TIMESTAMP DEFAULT NOW()
);

Key Metrics Calculated:
  - Daily revenue (by currency): SUM(amount_usd_equivalent)
  - Payment success rate: COUNT(*) WHERE status='succeeded' / COUNT(*)
  - Average transaction value: AVG(amount_usd_equivalent)
  - Failed transactions: COUNT(*) WHERE status='failed'
```

**Fact_User_Sessions (Website/app engagement):**

```sql
CREATE TABLE warehouse.fact_user_sessions (
  session_id                   VARCHAR(100) PRIMARY KEY,
  customer_key                 INT REFERENCES dim_customers(customer_key),
  region_key                   INT REFERENCES dim_regions(region_key),
  session_date_key             INT REFERENCES dim_date(date_key),
  
  -- Session Details
  session_start_datetime       TIMESTAMP,
  session_end_datetime         TIMESTAMP,
  session_duration_seconds     INT,
  
  -- Device & Platform
  device_type                  VARCHAR(50), -- mobile, desktop, tablet
  os_type                      VARCHAR(50), -- iOS, Android, Windows, Mac
  app_version                  VARCHAR(20),
  
  -- Engagement Metrics
  pages_viewed                 INT,
  actions_taken                INT,
  searches_performed           INT,
  bookings_initiated           INT,
  bookings_completed           INT,
  
  -- Funnel Tracking
  entered_booking_flow         BOOLEAN,
  completed_checkout           BOOLEAN,
  completed_purchase           BOOLEAN,
  
  -- Referral Source
  referral_source              VARCHAR(100), -- google, facebook, direct, referral
  utm_campaign                 VARCHAR(100),
  utm_medium                   VARCHAR(50),
  utm_source                   VARCHAR(50),
  
  created_at                   TIMESTAMP DEFAULT NOW()
);

Key Metrics Calculated:
  - Session count: COUNT(DISTINCT session_id)
  - Bounce rate: COUNT(*) WHERE actions=0 / COUNT(*)
  - Conversion rate: COUNT(*) WHERE completed_purchase / COUNT(*)
  - CAC by source: SUM(amount_usd) / new_customers by utm_source
```

**Fact_Locations (Real-time location tracking):**

```sql
CREATE TABLE warehouse.fact_locations (
  location_id                  BIGINT PRIMARY KEY,
  therapist_key                INT REFERENCES dim_therapists(therapist_key),
  region_key                   INT REFERENCES dim_regions(region_key),
  timestamp_key                INT REFERENCES dim_date(date_key),
  
  -- Location Data
  timestamp_datetime           TIMESTAMP,
  latitude                     DECIMAL(10,8),
  longitude                    DECIMAL(11,8),
  accuracy_meters              INT,
  
  -- Context
  is_active_appointment        BOOLEAN,
  appointment_id               INT (nullable),
  
  -- Movement
  previous_latitude            DECIMAL(10,8),
  previous_longitude           DECIMAL(11,8),
  distance_traveled_meters     INT,
  
  created_at                   TIMESTAMP DEFAULT NOW()
);

Key Metrics Calculated:
  - Average response time: Time from booking to therapist pickup
  - Coverage: % of region with <15min ETA
  - Utilization: Hours active / hours available per therapist
```

---

### 2.2 Dimension Tables

**Dim_Customers (Customer master data):**

```sql
CREATE TABLE warehouse.dim_customers (
  customer_key                 INT PRIMARY KEY,
  customer_id                  INT UNIQUE,
  
  -- Demographics
  email                        VARCHAR(255),
  phone_number                 VARCHAR(20),
  first_name                   VARCHAR(100),
  last_name                    VARCHAR(100),
  date_of_birth                DATE,
  gender                       VARCHAR(20),
  
  -- Geographic
  region_key                   INT REFERENCES dim_regions(region_key),
  city                         VARCHAR(100),
  postal_code                  VARCHAR(20),
  
  -- Account
  signup_date                  DATE,
  signup_source                VARCHAR(50), -- google, facebook, direct, referral
  first_appointment_date       DATE,
  last_appointment_date        DATE,
  
  -- Preferences
  preferred_therapist_id       INT,
  service_preferences          JSONB,
  
  -- Status
  is_active                    BOOLEAN,
  lifetime_appointments        INT,
  total_spend_usd              DECIMAL(12,2),
  
  -- SCD (Slowly Changing Dimension) fields
  effective_date               DATE,
  end_date                     DATE,
  is_current                   BOOLEAN,
  
  created_at                   TIMESTAMP,
  updated_at                   TIMESTAMP
);

Note: Uses SCD Type 2 to track historical changes
```

**Dim_Therapists (Therapist master data):**

```sql
CREATE TABLE warehouse.dim_therapists (
  therapist_key                INT PRIMARY KEY,
  therapist_id                 INT UNIQUE,
  
  -- Personal Info
  name                         VARCHAR(200),
  phone_number                 VARCHAR(20),
  email                        VARCHAR(255),
  
  -- Professional
  region_key                   INT REFERENCES dim_regions(region_key),
  specializations              TEXT[], -- array of specializations
  languages_spoken             TEXT[],
  years_experience             INT,
  certifications               TEXT[],
  
  -- Ratings
  average_rating               DECIMAL(3,2),
  total_reviews                INT,
  
  -- Availability
  is_active                    BOOLEAN,
  availability_hours_per_week  INT,
  
  -- Performance
  appointment_completion_rate  DECIMAL(5,2), -- %
  no_show_count                INT,
  customer_satisfaction_score  DECIMAL(3,2),
  
  -- Financial
  commission_percentage        DECIMAL(5,2),
  total_earnings_usd           DECIMAL(12,2),
  
  hired_date                   DATE,
  status                       VARCHAR(20), -- active, inactive, suspended
  
  effective_date               DATE,
  end_date                     DATE,
  is_current                   BOOLEAN,
  
  created_at                   TIMESTAMP,
  updated_at                   TIMESTAMP
);
```

**Dim_Regions:**

```sql
CREATE TABLE warehouse.dim_regions (
  region_key                   INT PRIMARY KEY,
  region_id                    INT UNIQUE,
  
  region_name                  VARCHAR(100), -- Korea, Philippines, etc
  country_code                 VARCHAR(2), -- KR, PH, TH, VN, ID
  currency_code                VARCHAR(3), -- KRW, PHP, THB, VND, IDR
  time_zone                    VARCHAR(50), -- Asia/Seoul, Asia/Manila, etc
  
  -- Market Info
  market_size_population       INT,
  penetration_percentage       DECIMAL(5,4),
  
  -- Operations
  headquarters_city           VARCHAR(100),
  customer_count              INT,
  therapist_count             INT,
  
  -- Financial
  regional_mrr_usd            DECIMAL(12,2),
  regional_market_share_pct   DECIMAL(5,2),
  
  is_active                   BOOLEAN,
  launch_date                 DATE,
  
  created_at                  TIMESTAMP
);
```

**Dim_Date (Time dimension for easy time-based aggregation):**

```sql
CREATE TABLE warehouse.dim_date (
  date_key                    INT PRIMARY KEY,
  date                        DATE UNIQUE,
  
  -- Date Parts
  year                        INT,
  quarter                     INT,
  month                       INT,
  day                         INT,
  week                        INT,
  day_of_week                 INT, -- 1=Monday, 7=Sunday
  
  -- Flags
  is_weekday                  BOOLEAN,
  is_holiday                  BOOLEAN,
  holiday_name                VARCHAR(100),
  
  -- Text
  date_string                 VARCHAR(10), -- YYYY-MM-DD
  month_name                  VARCHAR(20),
  day_name                    VARCHAR(10),
  
  -- Fiscal (for business reviews)
  fiscal_quarter              VARCHAR(10),
  fiscal_year                 INT
);
```

**Dim_Products (Service offerings):**

```sql
CREATE TABLE warehouse.dim_products (
  product_key                 INT PRIMARY KEY,
  product_id                  INT UNIQUE,
  
  service_type                VARCHAR(50), -- massage, relaxation, therapy, etc
  service_name                VARCHAR(200),
  description                 TEXT,
  
  -- Pricing
  price_usd_base              DECIMAL(10,2),
  duration_minutes            INT,
  
  -- Regions where offered
  available_regions           TEXT[], -- array of region codes
  
  -- Classification
  is_premium                  BOOLEAN,
  is_bundled                  BOOLEAN,
  
  -- Performance
  booking_count_lifetime      INT,
  satisfaction_score          DECIMAL(3,2),
  
  is_active                   BOOLEAN,
  
  created_at                  TIMESTAMP,
  updated_at                  TIMESTAMP
);
```

---

### 2.3 Aggregate Tables (Pre-calculated for fast queries)

**Agg_Daily_Revenue (Daily revenue by region):**

```sql
CREATE TABLE warehouse.agg_daily_revenue (
  date_key                    INT,
  region_key                  INT,
  
  -- Revenue Metrics
  revenue_local_currency      DECIMAL(15,2),
  revenue_usd                 DECIMAL(12,2),
  
  -- Transaction Counts
  transaction_count           INT,
  successful_transactions     INT,
  failed_transactions         INT,
  
  -- Customer Metrics
  new_customers_today         INT,
  active_customers_today      INT,
  
  -- Performance
  average_transaction_value   DECIMAL(10,2),
  payment_success_rate_pct    DECIMAL(5,2),
  
  PRIMARY KEY (date_key, region_key),
  FOREIGN KEY (date_key) REFERENCES dim_date(date_key),
  FOREIGN KEY (region_key) REFERENCES dim_regions(region_key)
);

-- Updated: Daily at 8 AM UTC
```

**Agg_Customer_Metrics (Customer cohort metrics):**

```sql
CREATE TABLE warehouse.agg_customer_metrics (
  cohort_month                VARCHAR(7), -- YYYY-MM (acquisition month)
  region_key                  INT,
  
  -- Cohort Size
  customer_count_acquired     INT,
  
  -- Monthly Retention
  month_1_retention_pct       DECIMAL(5,2),
  month_3_retention_pct       DECIMAL(5,2),
  month_6_retention_pct       DECIMAL(5,2),
  month_12_retention_pct      DECIMAL(5,2),
  
  -- Financial Metrics
  average_ltv_usd             DECIMAL(10,2),
  average_cac_usd             DECIMAL(10,2),
  ltv_cac_ratio               DECIMAL(5,2),
  
  -- Health Metrics
  average_nps_score           DECIMAL(3,2),
  average_satisfaction        DECIMAL(3,2),
  
  PRIMARY KEY (cohort_month, region_key)
);

-- Updated: Monthly (1st of month)
```

**Agg_Churn_Analysis (Detailed churn metrics):**

```sql
CREATE TABLE warehouse.agg_churn_analysis (
  churn_month                 VARCHAR(7), -- YYYY-MM
  region_key                  INT,
  
  -- Churn Metrics
  churned_customers           INT,
  total_customers_start_month INT,
  churn_rate_pct              DECIMAL(5,2),
  
  -- Churn Reasons (categorized)
  churn_reason_price_change   INT,
  churn_reason_poor_service   INT,
  churn_reason_switching      INT,
  churn_reason_other          INT,
  churn_reason_unknown        INT,
  
  -- Segments
  churned_new_customers_pct   DECIMAL(5,2), -- Churn within 30 days
  churned_old_customers_pct   DECIMAL(5,2), -- Churn after 6+ months
  
  PRIMARY KEY (churn_month, region_key)
);

-- Updated: Monthly (10 AM UTC, 1st of month)
```

**Agg_Regional_Health (KPI snapshot per region):**

```sql
CREATE TABLE warehouse.agg_regional_health (
  date_key                    INT,
  region_key                  INT,
  
  -- Financial
  mrr_usd                     DECIMAL(12,2),
  arr_usd                     DECIMAL(12,2),
  gross_margin_pct            DECIMAL(5,2),
  
  -- Customers
  active_customers            INT,
  new_customers_month         INT,
  churn_rate_pct              DECIMAL(5,2),
  
  -- Health
  nps_score                   DECIMAL(3,2),
  satisfaction_score_pct      DECIMAL(5,2),
  
  -- Operational
  appointment_completion_rate DECIMAL(5,2),
  average_rating              DECIMAL(3,2),
  
  -- Economics
  cac_usd                     DECIMAL(10,2),
  ltv_usd                     DECIMAL(10,2),
  payback_period_months       DECIMAL(4,2),
  
  PRIMARY KEY (date_key, region_key)
);

-- Updated: Daily at 8 AM UTC
```

---

## ETL Pipelines

### 3.1 Data Ingestion Pipeline (Real-Time)

**Streaming Ingestion (Kafka → PostgreSQL):**

```
Real-Time Event Flow:
┌─────────────────────────────────────────────────┐
│ Application (FastAPI)                            │
│  ├─ User clicks "Book"                          │
│  ├─ Publishes to: topic:appointments-stream     │
│  └─ Message: { event_type, customer_id, data } │
└──────────────────┬──────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────┐
│ Kafka Broker (Message Queue)                    │
│  ├─ Topic: appointments-stream                  │
│  ├─ Partitions: 10 (by region)                  │
│  └─ Retention: 7 days                           │
└──────────────────┬──────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────┐
│ Stream Processor (Apache Flink / Spark)        │
│  ├─ Parse JSON messages                        │
│  ├─ Validate schema                            │
│  ├─ Enrich with dimension data (customer, etc) │
│  ├─ Calculate derived fields                   │
│  └─ Route to destinations                      │
└──────────────────┬──────────────────────────────┘
                   ↓
     ┌─────────────┼─────────────┐
     ↓             ↓             ↓
┌─────────┐  ┌──────────┐  ┌──────────┐
│ Fact    │  │Dashboard │  │Archive   │
│Tables   │  │(Real-time)│  │(S3)      │
│(DW)     │  │Cache     │  │          │
└─────────┘  └──────────┘  └──────────┘

Latency: <500ms from event to warehouse
```

**Streaming Config Example:**

```python
# Stream processor configuration (Apache Flink)

env = StreamExecutionEnvironment.get_execution_environment()

# Source: Kafka topic
kafka_source = KafkaSource.builder() \
    .set_bootstrap_servers("kafka-broker:9092") \
    .set_topics("appointments-stream") \
    .set_group_id("warehouse-consumer") \
    .set_starting_offsets(KafkaOffsetsInitializer.latest()) \
    .set_value_only_deserializer(SimpleStringSchema()) \
    .build()

ds = env.add_source(kafka_source)

# Transform: Parse and enrich
def parse_and_enrich(message):
    data = json.loads(message)
    # Lookup customer dimension
    customer = get_customer_dimension(data['customer_id'])
    # Calculate derived fields
    data['appointment_date_key'] = get_date_key(data['appointment_date'])
    return data

enriched_ds = ds.map(parse_and_enrich)

# Sink: PostgreSQL fact table
pg_sink = JdbcSink.sink(
    "INSERT INTO fact_appointments VALUES (?, ?, ...)",
    JdbcConnectionOptions.JdbcConnectionOptionsBuilder()
        .with_url("jdbc:postgresql://warehouse:5432/analytics")
        .with_driver_name("org.postgresql.Driver")
        .with_user_name("warehouse_user")
        .with_password(os.getenv("PG_PASSWORD"))
        .build(),
    JdbcExecutionOptions.builder()
        .with_batch_size(1000)
        .with_batch_interval_ms(200)
        .build()
)

enriched_ds.add_sink(pg_sink)
env.execute("Appointments Stream Processor")
```

---

### 3.2 Batch ETL Pipeline (Daily)

**Daily Batch Job (DBT + PostgreSQL):**

```yaml
# dbt_project.yml - DBT configuration

name: 'elspa_warehouse'
version: '1.0.0'
config-version: 2

vars:
  start_date: '2025-01-01'
  
models:
  materialization: table  # or 'incremental' for large fact tables

  elspa_warehouse:
    # Staging models (select, rename, simple transforms)
    staging:
      materialized: view
      
    # Intermediate models (business logic)
    intermediate:
      materialized: ephemeral
      
    # Marts (final fact/dimension tables)
    marts:
      materialized: table
      indexes:
        - columns: ['date_key', 'region_key']
        - columns: ['customer_key']
        - columns: ['therapist_key']
```

**Sample DBT Model (Revenue aggregation):**

```sql
-- models/marts/agg_daily_revenue.sql

{{ config(
    materialized='table',
    indexes=[
        {'columns': ['date_key', 'region_key']},
    ],
    tags=['daily'],
) }}

with transactions as (
    select
        fact_transactions.transaction_date_key,
        dim_regions.region_key,
        sum(fact_transactions.amount_usd_equivalent) as revenue_usd,
        count(distinct fact_transactions.transaction_id) as transaction_count,
        sum(case when fact_transactions.transaction_status = 'succeeded' 
            then 1 else 0 end) as successful_transactions,
        sum(case when fact_transactions.transaction_status = 'failed' 
            then 1 else 0 end) as failed_transactions,
        avg(fact_transactions.amount_usd_equivalent) as avg_transaction_value
    from {{ ref('fact_transactions') }}
    join {{ ref('dim_regions') }} on fact_transactions.region_key = dim_regions.region_key
    where fact_transactions.transaction_date_key >= {{ var('start_date') }}
    group by fact_transactions.transaction_date_key, dim_regions.region_key
),

customers as (
    select
        fact_appointments.appointment_date_key,
        dim_regions.region_key,
        count(distinct case when fact_appointments.is_repeat_customer = false 
            then fact_appointments.customer_key end) as new_customers_today
    from {{ ref('fact_appointments') }}
    join {{ ref('dim_regions') }} on fact_appointments.region_key = dim_regions.region_key
    where fact_appointments.appointment_date_key >= {{ var('start_date') }}
    group by fact_appointments.appointment_date_key, dim_regions.region_key
)

select
    transactions.transaction_date_key as date_key,
    transactions.region_key,
    transactions.revenue_usd,
    transactions.transaction_count,
    transactions.successful_transactions,
    transactions.failed_transactions,
    transactions.avg_transaction_value,
    coalesce(customers.new_customers_today, 0) as new_customers_today,
    round(transactions.successful_transactions::numeric / transactions.transaction_count, 4) as payment_success_rate_pct,
    current_timestamp as loaded_at
from transactions
left join customers on 
    transactions.transaction_date_key = customers.appointment_date_key
    and transactions.region_key = customers.region_key
order by transactions.transaction_date_key desc, transactions.region_key
```

**Batch Job Scheduling (cron):**

```bash
# /etc/cron.d/elspa-warehouse-jobs

# Daily at 8 AM UTC - Run main DBT transformations
0 8 * * * warehouse_user cd /opt/dbt && dbt run --target prod --select tag:daily >> /var/log/dbt/daily.log 2>&1

# Daily at 8:30 AM UTC - Test data quality
30 8 * * * warehouse_user cd /opt/dbt && dbt test --target prod >> /var/log/dbt/tests.log 2>&1

# Daily at 9 AM UTC - Generate docs
0 9 * * * warehouse_user cd /opt/dbt && dbt docs generate --target prod >> /var/log/dbt/docs.log 2>&1

# First of month at 10 AM UTC - Monthly cohort analysis
0 10 1 * * warehouse_user cd /opt/dbt && dbt run --target prod --select tag:monthly >> /var/log/dbt/monthly.log 2>&1

# Every 6 hours - Exchange rate updates
0 */6 * * * warehouse_user curl -s https://api.ecb.eu/... | psql -h warehouse -U warehouse_user >> /var/log/dbt/rates.log 2>&1
```

---

### 3.3 Data Quality Checks

**DBT Tests (Automated validation):**

```yaml
# models/marts/agg_daily_revenue.yml

models:
  - name: agg_daily_revenue
    description: Daily revenue aggregation by region
    
    columns:
      - name: date_key
        description: Foreign key to dim_date
        tests:
          - not_null
          - unique
          - relationships:
              to: ref('dim_date')
              field: date_key
      
      - name: region_key
        description: Foreign key to dim_regions
        tests:
          - not_null
          - relationships:
              to: ref('dim_regions')
              field: region_key
      
      - name: revenue_usd
        description: Daily revenue in USD
        tests:
          - not_null
          - accepted_values:
              values: ['>= 0']  # Cannot be negative
      
      - name: transaction_count
        description: Number of transactions
        tests:
          - not_null
          - dbt_expectations.expect_column_values_to_be_between:
              min_value: 0
              max_value: 10000  # Sanity check
      
      - name: payment_success_rate_pct
        description: Percentage of successful transactions
        tests:
          - dbt_expectations.expect_column_values_to_be_between:
              min_value: 0
              max_value: 1
```

**Custom Data Quality Alerts:**

```python
# data_quality_checks.py

def check_revenue_anomalies(conn, date_key):
    """Alert if daily revenue deviates >20% from rolling average"""
    
    query = """
    SELECT
        date_key,
        revenue_usd,
        AVG(revenue_usd) OVER (
            ORDER BY date_key 
            ROWS BETWEEN 30 PRECEDING AND CURRENT ROW
        ) as rolling_avg_30days,
        ABS(revenue_usd - AVG(revenue_usd) OVER (...)) / 
        AVG(revenue_usd) OVER (...) as pct_deviation
    FROM agg_daily_revenue
    WHERE date_key = :date_key
    """
    
    result = conn.execute(query, {'date_key': date_key})
    
    for row in result:
        if row['pct_deviation'] > 0.20:
            # Alert!
            send_slack_alert(f"""
            🚨 Revenue Anomaly Detected
            Date: {row['date_key']}
            Revenue: ${row['revenue_usd']}
            Expected (30-day avg): ${row['rolling_avg_30days']}
            Deviation: {row['pct_deviation']:.1%}
            """)
```

---

## Data Retention & Compliance

### 4.1 Data Retention Policy

**Retention Schedule by Data Type:**

```
┌──────────────────────────────────────┬────────┬──────────────────┐
│ Data Type                            │ OLTP   │ Data Warehouse   │
├──────────────────────────────────────┼────────┼──────────────────┤
│ Transactions (detailed)               │ 3 yrs  │ 3 yrs (archive)  │
│ Customer profiles (PII)               │ 3 yrs  │ Encrypted        │
│ Location tracking (GPS)               │ 30 ds  │ Aggregated only  │
│ API logs (system)                     │ 90 ds  │ 1 yr (S3)        │
│ Audit logs (compliance)               │ 5 yrs  │ 5 yrs (immutable)│
│ Customer support tickets              │ 3 yrs  │ 3 yrs           │
│ Payroll records                       │ 5 yrs  │ 5 yrs (secure)  │
│ Analytics aggregates (agg_*)          │ N/A    │ Unlimited       │
│ Backup snapshots                      │ N/A    │ 2 years         │
└──────────────────────────────────────┴────────┴──────────────────┘

Default Archival Process:
  - Raw OLTP data → Compressed S3 (older than 1 year)
  - S3 → Glacier (older than 2 years)
  - Manual deletion after 3-5 years (based on legal holds)
```

**Data Privacy Handling:**

```python
# PII Masking for warehouse copies

def mask_pii_for_analytics(record):
    """Remove/mask personally identifiable information"""
    
    if 'email' in record:
        record['email'] = hash_email(record['email'])
    
    if 'phone_number' in record:
        # Keep last 2 digits only
        record['phone_number'] = 'XXX-XXX-' + record['phone_number'][-2:]
    
    if 'first_name' in record:
        record['first_name'] = record['first_name'][0] + '*' * (len(record['first_name'])-1)
    
    if 'date_of_birth' in record:
        # Store only age, not DOB
        record['age_bracket'] = categorize_age(record['date_of_birth'])
        del record['date_of_birth']
    
    if 'address' in record:
        # Store only city/region, not street
        record['city'] = extract_city(record['address'])
        del record['address']
    
    return record
```

### 4.2 Compliance & Governance

**Data Access Controls:**

```
Role-Based Access Control (RBAC):

┌──────────────────┬────────────────────────────────────┐
│ Role             │ Access Level                       │
├──────────────────┼────────────────────────────────────┤
│ Finance Lead     │ All financial data, masked PII     │
│ Product Manager  │ Aggregated metrics, no raw PII     │
│ Data Scientist   │ Full access (under data agreement)  │
│ CEO/CFO          │ Executive dashboards, strategic    │
│ Regional Manager │ Own region data only               │
│ Support Team     │ Customer interaction logs only     │
│ Analyst          │ Subset (agg_* tables only)         │
│ External (Client)│ API endpoints (pre-authorized)     │
└──────────────────┴────────────────────────────────────┘

Implementation:
  - PostgreSQL row-level security (RLS)
  - View-based access control
  - Audit log of all queries accessing PII
  - Encryption at rest (AES-256)
  - Encryption in transit (TLS 1.3)
```

---

## Pre-Built Analytics Queries

### 5.1 Customer Lifetime Value Analysis

**Query: LTV by Acquisition Channel & Region**

```sql
-- LTV by acquisition channel and region (cohort analysis)

WITH customer_cohorts AS (
  SELECT
    dim_customers.customer_key,
    dim_customers.signup_source,
    dim_regions.region_name,
    EXTRACT(YEAR_MONTH FROM dim_customers.signup_date) as cohort_month,
    dim_customers.signup_date,
    dim_customers.is_active
  FROM warehouse.dim_customers
  JOIN warehouse.dim_regions ON dim_customers.region_key = dim_regions.region_key
  WHERE dim_customers.signup_date >= '2025-01-01'
),

customer_spend AS (
  SELECT
    customer_key,
    SUM(final_price_usd) as lifetime_revenue,
    COUNT(*) as total_appointments,
    MAX(completed_datetime) as last_appointment_date,
    CURRENT_DATE - MAX(completed_datetime) as days_since_last_appointment
  FROM warehouse.fact_appointments
  WHERE appointment_status = 'completed'
  GROUP BY customer_key
),

ltv_calculation AS (
  SELECT
    customer_cohorts.signup_source,
    customer_cohorts.region_name,
    customer_cohorts.cohort_month,
    
    COUNT(DISTINCT customer_cohorts.customer_key) as cohort_size,
    
    -- LTV Metrics
    AVG(COALESCE(customer_spend.lifetime_revenue, 0)) as avg_ltv_usd,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY COALESCE(customer_spend.lifetime_revenue, 0)) as median_ltv_usd,
    MAX(COALESCE(customer_spend.lifetime_revenue, 0)) as max_ltv_usd,
    STDDEV(COALESCE(customer_spend.lifetime_revenue, 0)) as stddev_ltv_usd,
    
    -- Customer Health
    COUNT(CASE WHEN customer_spend.days_since_last_appointment < 30 THEN 1 END) as active_last_30_days,
    COUNT(CASE WHEN customer_spend.days_since_last_appointment < 90 THEN 1 END) as active_last_90_days,
    
    -- Repeat Purchase
    COUNT(CASE WHEN customer_spend.total_appointments > 1 THEN 1 END) as repeat_customers,
    AVG(customer_spend.total_appointments) as avg_appointments_per_customer
    
  FROM customer_cohorts
  LEFT JOIN customer_spend ON customer_cohorts.customer_key = customer_spend.customer_key
  GROUP BY 
    customer_cohorts.signup_source,
    customer_cohorts.region_name,
    customer_cohorts.cohort_month
)

SELECT
  signup_source,
  region_name,
  cohort_month,
  cohort_size,
  ROUND(avg_ltv_usd, 2) as avg_ltv_usd,
  ROUND(median_ltv_usd, 2) as median_ltv_usd,
  ROUND(max_ltv_usd, 2) as max_ltv_usd,
  ROUND(COALESCE(stddev_ltv_usd, 0), 2) as stddev_ltv_usd,
  active_last_30_days,
  ROUND(100.0 * active_last_30_days / cohort_size, 1) as pct_active_last_30_days,
  ROUND(100.0 * repeat_customers / cohort_size, 1) as pct_repeat_customers,
  ROUND(avg_appointments_per_customer, 2) as avg_appointments_per_customer
FROM ltv_calculation
ORDER BY region_name, cohort_month DESC, avg_ltv_usd DESC;
```

**Key Insights from Results:**

- Which acquisition channel generates highest LTV? (Compare signup_source)
- Is LTV improving over time? (Monitor cohort_month trend)
- Which regions have best LTV:CAC ratio?
- Where are repeat purchase rates strongest?

---

### 5.2 Churn Prediction & Analysis

**Query: Early Warning Churn Indicators**

```sql
-- Identify customers at risk of churning (early warning system)

WITH customer_activity AS (
  SELECT
    dim_customers.customer_key,
    dim_customers.customer_id,
    dim_customers.email,
    dim_regions.region_name,
    
    -- Recent Activity
    COUNT(CASE WHEN fact_appointments.completed_datetime >= CURRENT_DATE - 30 
      THEN 1 END) as appointments_last_30_days,
    COUNT(CASE WHEN fact_appointments.completed_datetime >= CURRENT_DATE - 90 
      THEN 1 END) as appointments_last_90_days,
    
    MAX(fact_appointments.completed_datetime) as last_appointment_date,
    CURRENT_DATE - MAX(fact_appointments.completed_datetime) as days_inactive,
    
    -- Historical Activity
    COUNT(*) as lifetime_appointments,
    AVG(fact_appointments.final_price_usd) as avg_spend_per_appointment,
    STDDEV(fact_appointments.final_price_usd) as stddev_spend,
    
    -- Satisfaction Indicators
    AVG(fact_appointments.rating_score) as avg_rating,
    COUNT(CASE WHEN fact_appointments.rating_score < 4 THEN 1 END) as low_ratings_count,
    
    -- Churn Risk Scoring
    CASE
      WHEN CURRENT_DATE - MAX(fact_appointments.completed_datetime) > 60 THEN 3
      WHEN CURRENT_DATE - MAX(fact_appointments.completed_datetime) > 30 THEN 2
      ELSE 1
    END as inactivity_score,
    
    CASE
      WHEN AVG(fact_appointments.rating_score) < 4 THEN 2
      WHEN AVG(fact_appointments.rating_score) < 4.5 THEN 1
      ELSE 0
    END as satisfaction_score,
    
    CASE
      WHEN COUNT(CASE WHEN fact_appointments.completed_datetime >= CURRENT_DATE - 30 THEN 1 END) = 0 
        AND COUNT(*) > 5 THEN 2  -- Was active, now inactive
      ELSE 0
    END as engagement_drop_score
    
  FROM warehouse.dim_customers
  LEFT JOIN warehouse.dim_regions ON dim_customers.region_key = dim_regions.region_key
  LEFT JOIN warehouse.fact_appointments ON dim_customers.customer_key = fact_appointments.customer_key
  WHERE dim_customers.is_active = true
  GROUP BY 
    dim_customers.customer_key,
    dim_customers.customer_id,
    dim_customers.email,
    dim_regions.region_name
),

churn_risk AS (
  SELECT
    customer_activity.*,
    (inactivity_score + satisfaction_score + engagement_drop_score) as churn_risk_score,
    CASE
      WHEN (inactivity_score + satisfaction_score + engagement_drop_score) >= 5 THEN 'HIGH'
      WHEN (inactivity_score + satisfaction_score + engagement_drop_score) >= 3 THEN 'MEDIUM'
      ELSE 'LOW'
    END as churn_risk_level,
    
    -- Recommended Action
    CASE
      WHEN (inactivity_score + satisfaction_score + engagement_drop_score) >= 5 
        THEN 'Urgent: Reach out with special offer'
      WHEN (inactivity_score + satisfaction_score + engagement_drop_score) >= 3 
        THEN 'Follow-up: Check satisfaction + offer incentive'
      ELSE 'Monitor: No action needed'
    END as recommended_action
    
  FROM customer_activity
)

SELECT
  customer_id,
  email,
  region_name,
  lifetime_appointments,
  last_appointment_date,
  days_inactive,
  appointments_last_30_days,
  avg_rating,
  low_ratings_count,
  churn_risk_score,
  churn_risk_level,
  recommended_action
FROM churn_risk
WHERE churn_risk_level IN ('HIGH', 'MEDIUM')
ORDER BY churn_risk_score DESC
LIMIT 100;
```

**Business Action Items:**

- HIGH risk: Proactive outreach (phone call + special offer)
- MEDIUM risk: Automated email campaign + discount code
- Track interventions → measure impact on retention

---

### 5.3 Revenue Forecasting

**Query: Revenue Trend & Forecast**

```sql
-- Forecast next 3 months of revenue using linear regression

WITH monthly_revenue AS (
  SELECT
    dim_date.year,
    dim_date.month,
    DATE_TRUNC('month', dim_date.date)::DATE as month_date,
    dim_regions.region_name,
    SUM(fact_transactions.amount_usd_equivalent) as revenue_usd,
    COUNT(DISTINCT fact_transactions.customer_key) as customer_count,
    AVG(fact_transactions.amount_usd_equivalent) as avg_transaction_value
  FROM warehouse.fact_transactions
  JOIN warehouse.dim_date ON fact_transactions.transaction_date_key = dim_date.date_key
  JOIN warehouse.dim_regions ON fact_transactions.region_key = dim_regions.region_key
  GROUP BY dim_date.year, dim_date.month, month_date, dim_regions.region_name
),

revenue_with_trend AS (
  SELECT
    region_name,
    month_date,
    revenue_usd,
    customer_count,
    
    -- Calculate trend using window functions
    ROW_NUMBER() OVER (PARTITION BY region_name ORDER BY month_date) as month_number,
    
    -- 3-month moving average for smoothing
    AVG(revenue_usd) OVER (
      PARTITION BY region_name 
      ORDER BY month_date 
      ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ) as revenue_3m_avg,
    
    -- Linear regression slope (simple: last_month - first_month / 3 months)
    LAG(revenue_usd) OVER (PARTITION BY region_name ORDER BY month_date) as prev_month_revenue,
    
    -- YoY growth
    LAG(revenue_usd, 12) OVER (PARTITION BY region_name ORDER BY month_date) as revenue_12m_ago
    
  FROM monthly_revenue
  WHERE month_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '12 months')
),

forecast_base AS (
  SELECT
    region_name,
    month_date,
    revenue_usd,
    revenue_3m_avg,
    
    -- Simple linear trend: average monthly growth rate
    (revenue_usd - revenue_3m_avg) / NULLIF(revenue_3m_avg, 0) as growth_rate,
    
    CASE
      WHEN revenue_12m_ago IS NOT NULL 
      THEN (revenue_usd - revenue_12m_ago) / revenue_12m_ago 
      ELSE 0 
    END as yoy_growth_rate,
    
    -- Forecast: last value + average growth rate
    revenue_3m_avg * 
    (1 + AVG((revenue_usd - LAG(revenue_usd) OVER (PARTITION BY region_name ORDER BY month_date)) / 
      NULLIF(LAG(revenue_usd) OVER (PARTITION BY region_name ORDER BY month_date), 0))
    OVER (PARTITION BY region_name ORDER BY month_date ROWS BETWEEN 3 PRECEDING AND CURRENT ROW))
    as next_month_forecast
    
  FROM revenue_with_trend
)

SELECT
  region_name,
  month_date,
  ROUND(revenue_usd::NUMERIC, 2) as actual_revenue_usd,
  ROUND(revenue_3m_avg::NUMERIC, 2) as revenue_3m_moving_avg,
  ROUND(growth_rate::NUMERIC, 4) as monthly_growth_rate,
  ROUND((yoy_growth_rate * 100)::NUMERIC, 2) as yoy_growth_pct,
  ROUND(next_month_forecast::NUMERIC, 2) as forecast_next_month,
  
  -- Forecast quality indicator
  CASE
    WHEN ABS((revenue_usd - LAG(revenue_usd) OVER (PARTITION BY region_name ORDER BY month_date)) / 
      NULLIF(LAG(revenue_usd) OVER (PARTITION BY region_name ORDER BY month_date), 0)) < 0.1 
    THEN 'Stable'
    ELSE 'Volatile'
  END as trend_stability
  
FROM forecast_base
WHERE month_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
ORDER BY region_name, month_date DESC;
```

**Forecast Applications:**

- Budget planning: Use forecasts for Q3/Q4 planning
- Variance analysis: Monitor actual vs. forecast each month
- Anomaly detection: If actual deviates >15% from forecast, investigate

---

### 5.4 Seasonality Analysis

**Query: Monthly Patterns & Seasonality Index**

```sql
-- Analyze seasonality patterns to forecast seasonal peaks

WITH monthly_data AS (
  SELECT
    EXTRACT(MONTH FROM dim_date.date)::INT as month_num,
    TO_CHAR(dim_date.date, 'Month') as month_name,
    EXTRACT(YEAR FROM dim_date.date)::INT as year,
    dim_regions.region_name,
    SUM(fact_transactions.amount_usd_equivalent) as revenue_usd,
    COUNT(*) as transaction_count
  FROM warehouse.fact_transactions
  JOIN warehouse.dim_date ON fact_transactions.transaction_date_key = dim_date.date_key
  JOIN warehouse.dim_regions ON fact_transactions.region_key = dim_regions.region_key
  WHERE dim_date.date >= '2024-01-01'
  GROUP BY month_num, month_name, year, region_name
),

monthly_averages AS (
  SELECT
    region_name,
    month_num,
    month_name,
    AVG(revenue_usd) as avg_revenue_month,
    STDDEV(revenue_usd) as stddev_revenue_month,
    MIN(revenue_usd) as min_revenue_month,
    MAX(revenue_usd) as max_revenue_month
  FROM monthly_data
  GROUP BY region_name, month_num, month_name
),

seasonality_index AS (
  SELECT
    region_name,
    month_num,
    month_name,
    avg_revenue_month,
    
    -- Global average revenue (across all months)
    AVG(avg_revenue_month) OVER (PARTITION BY region_name) as region_avg_revenue,
    
    -- Seasonality Index: Month average / Year average
    ROUND(100 * avg_revenue_month / 
      AVG(avg_revenue_month) OVER (PARTITION BY region_name)::NUMERIC, 1) 
    as seasonality_index,
    
    -- Interpretation
    CASE
      WHEN avg_revenue_month / AVG(avg_revenue_month) OVER (PARTITION BY region_name) > 1.15 THEN 'Peak Season'
      WHEN avg_revenue_month / AVG(avg_revenue_month) OVER (PARTITION BY region_name) < 0.85 THEN 'Low Season'
      ELSE 'Normal'
    END as season_type
    
  FROM monthly_averages
)

SELECT
  region_name,
  month_num,
  month_name,
  ROUND(avg_revenue_month::NUMERIC, 2) as avg_revenue_usd,
  seasonality_index,
  season_type,
  
  -- Actionable insight
  CASE
    WHEN season_type = 'Peak Season' THEN 'Increase staffing + marketing'
    WHEN season_type = 'Low Season' THEN 'Run promotions + cost optimization'
    ELSE 'Standard operations'
  END as recommended_action
  
FROM seasonality_index
ORDER BY region_name, month_num;
```

**Seasonality Applications:**

- Q1: Plan hiring/marketing budget based on seasonal patterns
- Q2: Prepare staffing for peak months
- Q3: Target discounts during low seasons
- Q4: Capacity planning for next year

---

### 5.5 Geographic Expansion Opportunity Scoring

**Query: Market Opportunity Assessment**

```sql
-- Score expansion opportunities in each region

WITH regional_metrics AS (
  SELECT
    dim_regions.region_name,
    dim_regions.country_code,
    dim_regions.market_size_population,
    
    -- Current Performance
    COUNT(DISTINCT fact_appointments.customer_key) as active_customers,
    SUM(fact_transactions.amount_usd_equivalent) as revenue_usd,
    COUNT(*) as transaction_count,
    
    -- Market Metrics
    COUNT(DISTINCT fact_appointments.therapist_key) as therapist_count,
    AVG(fact_appointments.rating_score) as avg_satisfaction,
    COUNT(CASE WHEN fact_appointments.appointment_status = 'completed' 
      THEN 1 END)::FLOAT / COUNT(*) as completion_rate,
    
    -- Growth Metrics
    COUNT(DISTINCT CASE WHEN fact_appointments.appointment_date >= CURRENT_DATE - 30 
      THEN fact_appointments.customer_key END) as new_customers_last_30d,
    
    -- Unit Economics
    AVG(fact_transactions.amount_usd_equivalent) as avg_revenue_per_transaction,
    COUNT(DISTINCT fact_appointments.customer_key) /
      NULLIF(COUNT(DISTINCT fact_appointments.therapist_key), 0) as customers_per_therapist
    
  FROM warehouse.dim_regions
  LEFT JOIN warehouse.fact_appointments ON dim_regions.region_key = fact_appointments.region_key
  LEFT JOIN warehouse.fact_transactions ON fact_appointments.appointment_id = fact_transactions.appointment_id
  WHERE dim_regions.region_name IN ('Korea', 'Philippines', 'Thailand', 'Vietnam', 'Indonesia')
  GROUP BY dim_regions.region_name, dim_regions.country_code, dim_regions.market_size_population
),

expansion_scoring AS (
  SELECT
    region_name,
    
    -- Scoring components (0-100)
    
    -- 1. Market Size (larger is better) - 20 points max
    ROUND(MIN(100, (market_size_population / 50000000.0) * 20)::NUMERIC, 1) as market_size_score,
    
    -- 2. Current Unit Economics (higher is better) - 25 points max
    ROUND((AVG(revenue_per_transaction) / 50.0) * 25, 1) as unit_economics_score,
    
    -- 3. Customer Satisfaction (higher is better) - 20 points max
    ROUND((avg_satisfaction / 5.0) * 20, 1) as satisfaction_score,
    
    -- 4. Growth Rate (new customers trend) - 20 points max
    ROUND(MIN(100, (new_customers_last_30d / active_customers) * 100)::NUMERIC, 1) as growth_score,
    
    -- 5. Therapist Utilization (customers per therapist) - 15 points max
    ROUND(MIN(15, (customers_per_therapist / 20.0) * 15), 1) as utilization_score,
    
    active_customers,
    therapist_count,
    revenue_usd,
    completion_rate
    
  FROM regional_metrics
)

SELECT
  region_name,
  ROUND((market_size_score + unit_economics_score + satisfaction_score + growth_score + utilization_score)::NUMERIC, 1) as total_expansion_score,
  
  market_size_score,
  unit_economics_score,
  satisfaction_score,
  growth_score,
  utilization_score,
  
  active_customers,
  therapist_count,
  ROUND(revenue_usd::NUMERIC, 2) as monthly_revenue_usd,
  
  CASE
    WHEN (market_size_score + unit_economics_score + satisfaction_score + growth_score + utilization_score) >= 80 
      THEN 'EXPAND NOW'
    WHEN (market_size_score + unit_economics_score + satisfaction_score + growth_score + utilization_score) >= 60 
      THEN 'MONITOR & OPTIMIZE'
    ELSE 'PIVOT OR EXIT'
  END as recommended_action
  
FROM expansion_scoring
ORDER BY total_expansion_score DESC;
```

**Decision Framework:**

- **EXPAND NOW (>80):** Increase marketing, hire staff, invest in region
- **MONITOR (60-80):** Optimize unit economics, test marketing, hold staffing
- **PIVOT/EXIT (<60):** Reduce burn, explore M&A, consider withdrawal

---

**Document Complete**

**Key Takeaways:**

1. **Data Architecture:** Real-time streaming + daily batch = fresh insights
2. **Star Schema:** Fact + Dimension tables enable flexible analysis
3. **ETL Pipeline:** Automated, tested, monitored data flow
4. **Compliance:** PII masking, access controls, long-term audit logs
5. **Pre-Built Queries:** Instant answers to key business questions

---

*For data warehouse support or custom queries, contact: data@elspa.io*
