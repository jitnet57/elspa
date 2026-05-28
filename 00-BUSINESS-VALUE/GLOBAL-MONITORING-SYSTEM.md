# GLOBAL MONITORING SYSTEM
## Real-Time Uptime, Performance & Incident Management for ElSpa

**Document Version:** 1.0  
**Last Updated:** 2026-05-29  
**Owner:** VP Engineering / Infrastructure Lead  
**Audience:** DevOps, Engineering Teams, On-Call Engineers  
**SLA Target:** 99.9% uptime across all regions  

---

## Table of Contents
1. [Real-Time Monitoring Strategy](#real-time-monitoring-strategy)
2. [Alerting Framework](#alerting-framework)
3. [Incident Management Process](#incident-management-process)
4. [On-Call Rotation & Escalation](#on-call-rotation--escalation)
5. [Monitoring Tools & Implementation](#monitoring-tools--implementation)

---

## Real-Time Monitoring Strategy

### 1.1 Monitoring Pillars

ElSpa's monitoring is built on 4 pillars ensuring comprehensive coverage:

```
┌─────────────────────────────────────────────────────┐
│            MONITORING FOUR PILLARS                   │
├─────────────────────────────────────────────────────┤
│ ✅ AVAILABILITY (Uptime & Accessibility)            │
│ ✅ PERFORMANCE (Response Times & Throughput)        │
│ ✅ ERROR TRACKING (Application Errors & Anomalies)  │
│ ✅ DATA INTEGRITY (Database Health & Security)      │
└─────────────────────────────────────────────────────┘
```

---

### 1.2 Uptime Monitoring by Region

**99.9% SLA Commitment** = Max 43.2 minutes downtime per month

```
┌──────────────────────────────────────────────────────┐
│ REGIONAL UPTIME MONITORING                            │
├──────────────────────────────────────────────────────┤
│ PRIMARY CHECKS (Every 30 seconds):                   │
│ • API Health Check (GET /api/health)                │
│ • Database Connectivity Test                        │
│ • Authentication Service Availability               │
│ • Payment Gateway Connectivity                      │
│ • WebSocket Connection Stability                    │
│                                                      │
│ SECONDARY CHECKS (Every 5 minutes):                 │
│ • Third-party Service Status (Stripe, etc)         │
│ • DNS Resolution from multiple locations           │
│ • SSL Certificate Validity                         │
│ • Database Replication Lag                         │
└──────────────────────────────────────────────────────┘
```

**Implementation:**
```yaml
Monitoring Stack:
  
Korea Region (Primary):
  Health Endpoint: https://api.elspa.kr/api/health
  Fallback: https://api-backup.elspa.kr/api/health
  Check Interval: 30 seconds
  Timeout: 5 seconds
  Locations: 3 (Seoul, Daegu, Busan)
  
Philippines Region:
  Health Endpoint: https://api.elspa.ph/api/health
  Fallback: https://api-sg.elspa.ph/api/health (via Singapore)
  Check Interval: 30 seconds
  Locations: 2 (Manila, Cebu)
  
Thailand Region:
  Health Endpoint: https://api.elspa.th/api/health
  Fallback: https://api-sg.elspa.th/api/health
  Check Interval: 30 seconds
  Locations: 2 (Bangkok, Chiang Mai)
  
Vietnam Region:
  Health Endpoint: https://api.elspa.vn/api/health
  Fallback: https://api-sg.elspa.vn/api/health
  Check Interval: 30 seconds
  Locations: 2 (Hanoi, Ho Chi Minh City)
  
Indonesia Region:
  Health Endpoint: https://api.elspa.id/api/health
  Fallback: https://api-sg.elspa.id/api/health
  Check Interval: 30 seconds
  Locations: 2 (Jakarta, Surabaya)
```

**Health Check Response Format:**
```json
{
  "status": "healthy",
  "timestamp": "2026-05-29T14:32:00Z",
  "region": "kr",
  "services": {
    "database": { "status": "ok", "latency_ms": 18 },
    "auth_service": { "status": "ok", "latency_ms": 42 },
    "payment_gateway": { "status": "ok", "latency_ms": 156 },
    "websocket": { "status": "ok", "connections": 523 }
  },
  "version": "1.2.4"
}
```

---

### 1.3 Performance Monitoring

**Metric Collection Points:**

```
Real-Time Performance Metrics:
┌─────────────────────────────┬────────┬─────────┬───────┐
│ Metric                      │ P50    │ P95     │ P99   │
├─────────────────────────────┼────────┼─────────┼───────┤
│ API Response Time           │ <100ms │ <500ms  │ <2s   │
│ Database Query Latency      │ <20ms  │ <100ms  │ <300ms│
│ Authentication (JWT)        │ <50ms  │ <150ms  │ <300ms│
│ Payment Processing          │ <800ms │ <2s     │ <5s   │
│ Real-time Location Update   │ <100ms │ <200ms  │ <500ms│
│ WebSocket Message Latency   │ <50ms  │ <150ms  │ <400ms│
├─────────────────────────────┼────────┼─────────┼───────┤
│ TARGET SLA P95              │        │ <500ms  │       │
│ ALERT THRESHOLD (Breach)    │        │ >750ms  │       │
└─────────────────────────────┴────────┴─────────┴───────┘
```

**Instrumentation:**
- Application: OpenTelemetry SDK in all services
- Database: Native query timing via PostgreSQL
- Infrastructure: Prometheus metrics from Kubernetes
- Client: Browser Real User Monitoring (RUM)

---

### 1.4 Error Rate Monitoring

**Categorization:**

```
Error Rate Tracking:
┌────────────────┬─────────┬──────────┬───────────┐
│ Error Category │ Current │ SLA (%)  │ Alert (%) │
├────────────────┼─────────┼──────────┼───────────┤
│ 4xx (Client)   │ 0.46%   │ <1.0%    │ >2.0%     │
│ 5xx (Server)   │ 0.17%   │ <0.2%    │ >0.5%     │
│ Timeout        │ 0.08%   │ <0.1%    │ >0.25%    │
│ Network Errors │ 0.03%   │ <0.1%    │ >0.2%     │
│ TOTAL          │ 0.74%   │ <1.5%    │ >2.5%     │
└────────────────┴─────────┴──────────┴───────────┘
```

**Error Budget Analysis:**
```
99.9% uptime target = 0.1% error budget per month
Current error rate = 0.74%
Status: OVER BUDGET (6.8x worse than target)
Action: Immediate root cause analysis

Real-time Error Dashboard tracks:
- 4xx errors (validation, auth, permissions)
- 5xx errors (service failures, bugs)
- Timeouts (performance degradation)
- Circuit breaker trips (cascade failures)
- Dependency failures (external APIs)
```

---

### 1.5 Data Pipeline Monitoring

**Critical Data Paths:**

```
Monitored Data Pipelines:
┌──────────────────────┬──────────┬─────────────┐
│ Pipeline             │ SLA      │ Monitor     │
├──────────────────────┼──────────┼─────────────┤
│ Location Streaming   │ <100ms   │ Lag time    │
│ Transaction Logging  │ <1 sec   │ Queue depth │
│ Analytics Ingestion  │ <5 sec   │ Loss rate   │
│ Payroll Processing   │ <30min   │ Job status  │
│ Reporting Pipeline   │ <1 hour  │ Completion  │
│ Data Backup          │ <2 hours │ Latest time │
└──────────────────────┴──────────┴─────────────┘
```

**Latency Tracking Formula:**
```
Pipeline_Lag = CurrentTime - LastProcessed_Time
Alert_Threshold = SLA × 1.5 (e.g., if SLA is 100ms, alert at 150ms)

Example:
  Location Pipeline SLA: <100ms
  Alert Threshold: 150ms
  Current Lag: 78ms ✅
```

---

## Alerting Framework

### 2.1 Alert Severity Levels

**4-Level Alert Hierarchy:**

```
┌──────────────────────────────────────────────────────┐
│                ALERT SEVERITY LEVELS                  │
├──────────────────────────────────────────────────────┤
│ 🔴 CRITICAL (P1)                                    │
│    → Immediate action required                      │
│    → Revenue-impacting or data-loss risk           │
│    → All notification channels active               │
│    → Escalation: On-call → Manager → VP Eng       │
│    → SLA: Response within 5 minutes                │
│                                                      │
│ 🟠 HIGH (P2)                                        │
│    → Significant impact, but workaround exists      │
│    → Degraded service or performance issue         │
│    → Slack + Email + On-call                       │
│    → Escalation: On-call → Manager                │
│    → SLA: Response within 15 minutes               │
│                                                      │
│ 🟡 MEDIUM (P3)                                      │
│    → Minor impact or slow error growth             │
│    → Non-critical feature affected                 │
│    → Slack only, visible in dashboard              │
│    → SLA: Response within 1 hour                   │
│                                                      │
│ 🔵 INFO (P4)                                        │
│    → Informational only                             │
│    → Metrics crossing warning threshold             │
│    → Dashboard only, no notifications              │
│    → SLA: None (review during daily standup)      │
└──────────────────────────────────────────────────────┘
```

---

### 2.2 Alert Conditions & Thresholds

**CRITICAL (P1) Alerts:**

| Condition | Threshold | Channel | Escalate |
|-----------|-----------|---------|----------|
| API Down | 2+ failures in 30s | SMS + Slack + Email | Yes |
| Database Down | Connection failed | SMS + Slack + Email | Yes |
| Payment API Down | Cannot process charges | SMS + Slack + Email | Yes |
| Data Loss Risk | Replication lag >5min | SMS + Slack + Email | Yes |
| Security Breach | Unauthorized access | SMS + Slack + Email | Yes |
| Error Rate >2% | 5+ min consecutive | SMS + Slack + Email | Yes |
| 99.9% SLA Breach | Uptime <99.8% rolling | Email to exec | Yes |

**HIGH (P2) Alerts:**

| Condition | Threshold | Channel |
|-----------|-----------|---------|
| API Latency P95 | >750ms for 5 min | Slack + Email |
| Database Query | >500ms P95 for 5 min | Slack + Email |
| Memory Usage | >85% for 10 min | Slack + Email |
| Disk Space | <10% free | Slack + Email |
| SSL Certificate | Expires in 7 days | Slack + Email |
| Error Rate | 1-2% for 5 min | Slack + Email |
| Deployment Failed | Pipeline failed | Slack + Email |

**MEDIUM (P3) Alerts:**

| Condition | Threshold |
|-----------|-----------|
| API Latency P50 | >200ms for 10 min |
| Feature Flag | Disabled unexpected |
| Deprecated API | Calls detected |
| Slow Query | >1s execution |
| High Memory Growth | +20% over 1 hour |
| Support Tickets | >20 unresolved |
| Backup Delayed | >1 hour late |

**INFO (P4) Alerts:**

| Condition | Threshold |
|-----------|-----------|
| New Deployment | Any release to prod |
| Database Backup | Completed successfully |
| Daily Report | Generated at 8 AM UTC |
| Capacity Trend | Approaching 70% utilization |

---

### 2.3 Alert Routing Logic

**Dynamic Routing Based on Impact:**

```
┌─────────────────────────────────────────────────────┐
│ ALERT ROUTING DECISION TREE                         │
├─────────────────────────────────────────────────────┤
│ IF Service Down (Korea) AND Customers > 100        │
│   → P1 CRITICAL                                    │
│   → Notify: On-call, Manager, VP Engineering      │
│                                                      │
│ ELSE IF Service Down (Any Region) AND Customers>50 │
│   → P2 HIGH                                        │
│   → Notify: On-call Engineer, Slack               │
│                                                      │
│ ELSE IF Performance Degradation >750ms P95        │
│   → P2 HIGH (if during peak hours)                │
│   → P3 MEDIUM (if during off-hours)               │
│                                                      │
│ ELSE IF Error Rate 1-2%                            │
│   → P3 MEDIUM                                      │
│   → Notify: Slack #engineering                    │
│                                                      │
│ ELSE IF Approaching Quota/Limit                    │
│   → P4 INFO                                        │
│   → Notify: Dashboard + Daily standup             │
└─────────────────────────────────────────────────────┘
```

**Alert Suppression Rules:**
- No duplicate alerts within 5 minutes (deduplicate)
- No alerts during scheduled maintenance windows
- No alerts for expected transient conditions (deployment, failover)
- Weekend/holiday: Downgrade P2→P3, P3→P4 unless customer-impacting

---

### 2.4 Notification Channels

**Channel Configuration:**

```
Priority 1 (CRITICAL):
├─ SMS to on-call engineer (text message, 30s max)
├─ PagerDuty page (escalates if no ack in 5 min)
├─ Slack #critical-alerts (red emoji, loud sound)
├─ Email to VP Engineering (archive for compliance)
└─ Page manager if P1 not resolved in 30 min

Priority 2 (HIGH):
├─ Slack #alerts (orange emoji, notification)
├─ Email to engineering team (searchable record)
└─ Auto-page on-call if >3 P2s in 10 min (cascade failure)

Priority 3 (MEDIUM):
├─ Slack #engineering (quiet, visible but not urgent)
└─ Dashboard visible for standup review

Priority 4 (INFO):
└─ Dashboard only (no notifications)
```

**Notification Example:**

```
🔴 CRITICAL ALERT - API Down
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Service: API (Korea region)
Status: ❌ DOWN
Latency: N/A (no response)
Error Rate: 100%
Affected Users: ~680 active
Time Down: 3 minutes 45 seconds

Root Cause Analysis (preliminary):
- Database connection pool exhausted
- OOM killer may have terminated process

Immediate Action:
☐ SSH to prod server
☐ Check logs: tail -f /var/log/app.log
☐ Restart if OOM: systemctl restart api
☐ Check database connections: psql -c "SELECT count(*) FROM pg_stat_activity"

Runbook: wiki.elspa.io/runbooks/api-down
Escalate if not resolved in 15 min: @VP-Engineering

⏰ Started: 2026-05-29 14:32 UTC | 🔔 On-call: @engineer-kim
```

---

### 2.5 Alert Acknowledgment & Escalation

**Acknowledgment Timeline:**

```
Alert Triggered → On-call page sent
  ├─ 0-5 min: Expecting acknowledgment (page every 30s)
  ├─ 5-15 min: Page manager if no ack
  ├─ 15-30 min: Escalate to VP Engineering
  └─ 30+ min: Call phone if critical

Escalation Chain (CRITICAL):
On-call Engineer (primary)
  ↓ (no ack in 5 min)
Engineering Manager
  ↓ (no ack in 10 min)
VP Engineering
  ↓ (no ack in 10 min)
C-Level (if data loss risk)
```

---

## Incident Management Process

### 3.1 Incident Lifecycle

**4-Phase Incident Response:**

```
┌─────────────────────────────────────────────────────┐
│          INCIDENT LIFECYCLE (4 PHASES)               │
├─────────────────────────────────────────────────────┤
│ PHASE 1: DETECTION & TRIAGE (0-5 min)              │
│ ├─ Alert fires automatically                       │
│ ├─ On-call engineer acknowledges                   │
│ ├─ Create incident ticket in Jira                  │
│ ├─ Assess severity (P1/P2/P3)                      │
│ └─ Notify stakeholders if P1                       │
│                                                      │
│ PHASE 2: DIAGNOSIS & RESPONSE (5-30 min)          │
│ ├─ Identify root cause                            │
│ ├─ Execute runbook or mitigation steps            │
│ ├─ Update incident status in Jira                 │
│ ├─ Provide ETA to stakeholders (every 10 min)    │
│ └─ Escalate if unsure                             │
│                                                      │
│ PHASE 3: RESOLUTION & MONITORING (30 min - 4 hrs) │
│ ├─ Apply fix (code, config, manual)               │
│ ├─ Verify service restored (health checks)        │
│ ├─ Monitor for 15 min with alert level elevated   │
│ ├─ Update incident summary                        │
│ └─ Close ticket once stable                       │
│                                                      │
│ PHASE 4: POST-INCIDENT REVIEW (24-48 hrs)        │
│ ├─ Conduct RCA (Root Cause Analysis)              │
│ ├─ Document timeline & decisions                  │
│ ├─ Create action items to prevent recurrence      │
│ ├─ Update runbooks & documentation                │
│ └─ Share learnings with team                      │
└─────────────────────────────────────────────────────┘
```

---

### 3.2 RTO & RPO by Incident Type

**Recovery Targets (by severity & type):**

```
┌─────────────────────────────────┬─────┬─────┐
│ Incident Type                   │ RTO │ RPO │
├─────────────────────────────────┼─────┼─────┤
│ API Service Down                │ 5m  │ 1m  │
│ Database Failure                │ 15m │ 5m  │
│ Data Corruption                 │ 1h  │ 15m │
│ Payment Gateway Down            │ 10m │ 1m  │
│ Authentication Service Down     │ 5m  │ 1m  │
│ Region-wide Outage              │ 30m │ 5m  │
│ Security Breach                 │ 2h  │ 1h  │
│ Complete Data Center Loss       │ 4h  │ 1h  │
└─────────────────────────────────┴─────┴─────┘

Legend:
RTO (Recovery Time Objective) = Time to restore service
RPO (Recovery Point Objective) = Acceptable data loss
```

**Example: Database Failure**
```
Incident: PostgreSQL primary node crashes in Korea
RTO Target: Restore to read-only access within 5 min
RPO Target: No more than 1 minute of data loss
Runbook steps:
  1. Promote replica to primary (3 min)
  2. Update application connection string (1 min)
  3. Monitor for stability (5 min before closure)
  Total: 9 min (exceeds RTO - investigate optimization)
```

---

### 3.3 Incident Communication

**Communication Template:**

```
INCIDENT: [Service] Down in [Region]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Impact Summary:
  Customers Affected: [#]
  Services Down: [list]
  Time Since Failure: [duration]
  Current Status: INVESTIGATING / IN PROGRESS / RESOLVED

🔍 What We Know:
  [Preliminary findings]

🛠️ What We're Doing:
  [Actions in progress]

⏰ ETA to Recovery:
  [Expected time to resolution]

📞 Next Update:
  [Time of next update]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Incident Commander: @[name]
Slack Channel: #incident-[id]
Status Page: status.elspa.io
```

**Update Frequency:**
- P1 (Critical): Every 5 minutes until resolved
- P2 (High): Every 15 minutes
- P3 (Medium): Every 30 minutes
- P4 (Info): When status changes

---

### 3.4 Post-Incident Review (PIR)

**PIR Template (24-48 hours after resolution):**

```
INCIDENT POST-MORTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ EXECUTIVE SUMMARY
   Incident: API Down in Korea region
   Duration: 42 minutes
   Customers Affected: ~680 (15% of active users)
   Revenue Impact: ~$250 USD
   Severity: P1

2️⃣ INCIDENT TIMELINE
   14:32 - Alert triggered (P95 latency >5s)
   14:34 - On-call acknowledged, began investigation
   14:38 - Root cause identified (OOM killer crash)
   14:45 - Applied fix (restart service + increase memory)
   14:46 - Service returned to healthy state
   15:14 - Monitoring confirmed stable (no regression)

3️⃣ ROOT CAUSE ANALYSIS
   Identified: Memory leak in location-tracking service
   Symptoms: Memory usage crept from 3GB → 8GB over 4 hours
   Trigger: Spike in concurrent location updates (2000+ users)
   Why not caught earlier? Memory monitoring alert threshold was 90%

4️⃣ CONTRIBUTING FACTORS
   ☐ Recent deployment (May 25) introduced subtle leak
   ☐ No load testing of location service before release
   ☐ Memory monitoring threshold too high (90% vs target 75%)
   ☐ No automatic restart policy for OOM scenarios

5️⃣ WHAT WENT WELL ✅
   ✅ Alert fired immediately upon OOM
   ✅ On-call engineer responded quickly
   ✅ Runbook for service restart was clear and followed
   ✅ Communication to customers was timely

6️⃣ WHAT WENT WRONG ❌
   ❌ Memory leak not caught in pre-prod testing
   ❌ No gradual degradation - sudden crash
   ❌ 12-minute delay before mitigation applied
   ❌ Spike in location updates not anticipated

7️⃣ ACTION ITEMS (Prevent Recurrence)
   [ ] Fix memory leak in location-tracking service
       Owner: @backend-lead | Due: 2026-06-05
   
   [ ] Lower memory alert threshold to 75%
       Owner: @devops | Due: 2026-05-31
   
   [ ] Add load testing to release process
       Owner: @qa-lead | Due: 2026-06-15
   
   [ ] Implement automatic restart for OOM
       Owner: @devops | Due: 2026-06-05
   
   [ ] Capacity planning for location service
       Owner: @architect | Due: 2026-06-10

8️⃣ LESSONS LEARNED
   - Need better pre-production load testing
   - Memory monitoring thresholds require review (too lenient)
   - Consider graceful degradation instead of crashes
   - Location service may need horizontal scaling

9️⃣ STAKEHOLDER IMPACT
   Customers: 680 affected (lost session data)
   Support Tickets: 12 received, 11 resolved
   Financial: ~$250 revenue loss (15 min × $1,000/hr MRR)
   Reputation: No major customer churn expected

🔟 DOCUMENTATION UPDATES
   [ ] Update runbook: Location Service Scaling
   [ ] Update deployment checklist: Add load test requirement
   [ ] Update capacity planning doc with location service projections
   [ ] Document OOM prevention strategies

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Conducted by: Incident Commander + Team
Date: 2026-05-30
Distribution: Engineering team + Exec (VP Eng)
Next Review: When action items completed
```

---

## On-Call Rotation & Escalation

### 4.1 On-Call Schedule

**Weekly Rotation (Mon-Sun, midnight to midnight UTC):**

```
Week of 2026-05-26:
┌──────────┬────────────────┬──────────────────┬──────────┐
│ Day      │ Primary        │ Secondary        │ Manager  │
├──────────┼────────────────┼──────────────────┼──────────┤
│ Mon 5/26 │ @engineer-kim  │ @engineer-lee    │ @manager-park │
│ Tue 5/27 │ @engineer-park │ @engineer-choi   │ @manager-park │
│ Wed 5/28 │ @engineer-shin │ @engineer-yoon   │ @manager-kim  │
│ Thu 5/29 │ @engineer-yoon │ @engineer-kim    │ @manager-kim  │
│ Fri 5/30 │ @engineer-kim  │ @engineer-lee    │ @manager-lee  │
│ Sat 5/31 │ @engineer-lee  │ @engineer-park   │ @manager-park │
│ Sun 6/01 │ @engineer-choi │ @engineer-shin   │ @manager-lee  │
└──────────┴────────────────┴──────────────────┴──────────┘

On-Call Responsibilities:
PRIMARY (First responder):
  - Acknowledge alerts within 5 minutes
  - Initiate incident response
  - Conduct initial diagnosis
  - Escalate if needed

SECONDARY (Backup):
  - Assist primary if requested
  - Take over if primary unavailable
  - Help during large incidents (P1)

MANAGER:
  - Oversight for P1 incidents >30 min unresolved
  - Coordinate escalation & communication
  - Handle stakeholder updates
```

---

### 4.2 Escalation Matrix

**Who to call when:**

```
┌────────────────────────────────────────────────────┐
│           ESCALATION MATRIX (CRITICAL)              │
├────────────────────────────────────────────────────┤
│ Scenario 1: P1 Not Ack'd in 5 min                 │
│ Action: Page on-call manager                      │
│ Authority: VP Engineering                         │
│                                                    │
│ Scenario 2: P1 Not Resolved in 30 min             │
│ Action: Page VP Engineering                       │
│ Authority: VP Engineering + CTO                   │
│                                                    │
│ Scenario 3: Data Loss Risk (Any Time)             │
│ Action: Immediately page CTO                      │
│ Authority: CTO + CFO (financial impact)           │
│                                                    │
│ Scenario 4: Security Breach                       │
│ Action: Page CTO + CEO                            │
│ Authority: CEO + Legal + Board                    │
│                                                    │
│ Scenario 5: Multiple P1s (>3 in 30 min)           │
│ Action: Page VP Engineering + CTO                 │
│ Authority: Activate War Room (see below)          │
└────────────────────────────────────────────────────┘
```

---

### 4.3 War Room Protocol (Major Incidents)

**Activation Criteria:**
- 3+ P1 incidents in 30 minutes (cascade failure)
- Extended P1 incident (>2 hours unresolved)
- Data loss or security incident
- Threat to SLA compliance

**War Room Setup:**
```
War Room Channel: #incident-warroom
Participants:
  - Incident Commander (leads)
  - On-call engineer (primary)
  - VP Engineering (technical authority)
  - Engineering Manager (resource coordination)
  - Backend Lead (service-specific expertise)
  - DevOps Lead (infrastructure)
  - Product Manager (customer impact assessment)
  - CFO/Finance (revenue impact tracking)

War Room Agenda:
  1. (0-5 min) Situation briefing
  2. (5-15 min) Parallel diagnosis (all teams investigate)
  3. (15-30 min) Root cause identified & mitigation plan
  4. (30+ min) Execute fix, monitor, and validate

Communication Cadence:
  - Every 5 minutes: Status update in war room channel
  - Every 15 minutes: Customer-facing update (status.elspa.io)
  - Post-incident: Full RCA within 24 hours
```

---

## Monitoring Tools & Implementation

### 5.1 Monitoring Stack (Tech Stack)

**Recommended Open-Source + Cloud Mix:**

```
┌─────────────────────────────────────────────────────┐
│          MONITORING STACK ARCHITECTURE               │
├─────────────────────────────────────────────────────┤
│ METRICS COLLECTION:                                 │
│ ├─ Prometheus (time-series database)               │
│ ├─ StatsD (lightweight UDP metric collection)      │
│ └─ OpenTelemetry (distributed tracing)             │
│                                                      │
│ ALERTING:                                           │
│ ├─ Prometheus AlertManager (rule evaluation)       │
│ ├─ PagerDuty (incident management + escalation)    │
│ ├─ Slack webhooks (notifications)                  │
│ └─ SendGrid (email delivery)                       │
│                                                      │
│ DASHBOARDING:                                       │
│ ├─ Grafana (metrics visualization)                 │
│ ├─ ELK Stack (log aggregation: Elasticsearch)      │
│ └─ Jaeger (distributed tracing UI)                 │
│                                                      │
│ STATUS PAGE:                                        │
│ ├─ Statuspage.io (public status updates)          │
│ └─ Custom API (internal dashboard)                 │
│                                                      │
│ LOG AGGREGATION:                                    │
│ ├─ Elasticsearch (search & analysis)               │
│ ├─ Kibana (visualization)                          │
│ └─ Logstash (log processing pipeline)              │
│                                                      │
│ ERROR TRACKING:                                     │
│ ├─ Sentry (exception tracking)                     │
│ └─ Custom error dashboard                          │
└─────────────────────────────────────────────────────┘
```

**Cost Estimate (Monthly):**
| Tool | Cost | Purpose |
|------|------|---------|
| Prometheus + Grafana | $0-200 (self-hosted) | Metrics + visualization |
| PagerDuty | $500-1500 | Incident management |
| Statuspage.io | $100 | Public status |
| Sentry | $300 | Error tracking |
| ELK Stack | $200-500 (self-hosted) | Log aggregation |
| **TOTAL** | **$1,100-2,700** | All-in monitoring |

---

### 5.2 Alert Configuration Examples

**Prometheus Alert Rules (alert-rules.yaml):**

```yaml
groups:
  - name: availability
    rules:
      - alert: APIHealthCheckFailed
        expr: up{job="api-primary"} == 0
        for: 1m
        annotations:
          severity: critical
          summary: "API health check failed in {{ $labels.region }}"
          description: "API service down for > 1 minute"
          
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.02
        for: 5m
        annotations:
          severity: high
          summary: "High error rate detected"
          
      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_ms[5m])) > 500
        for: 5m
        annotations:
          severity: medium
          summary: "API latency P95 > 500ms"
          
  - name: database
    rules:
      - alert: DatabaseDown
        expr: pg_up{job="postgres"} == 0
        for: 30s
        annotations:
          severity: critical
          
      - alert: HighConnectionCount
        expr: pg_stat_activity_count > 200
        for: 5m
        annotations:
          severity: high
          
      - alert: ReplicationLag
        expr: pg_wal_lsn_lag_bytes > 5242880
        for: 5m
        annotations:
          severity: medium
          description: "Replication lag > 5MB"
```

---

### 5.3 Dashboard Setup (Grafana)

**Critical Dashboards to Create:**

1. **Executive Dashboard**
   - Uptime %
   - Revenue impact (if down)
   - Customer count affected
   - ETA to recovery

2. **Operations Dashboard**
   - Error rate (by region)
   - Latency (P50, P95, P99)
   - Database health
   - Infrastructure capacity

3. **On-Call Dashboard**
   - Active alerts (sorted by severity)
   - Services status (all 5 regions)
   - Recent incidents (last 7 days)
   - Incident history + RCA links

4. **Business Metrics Dashboard**
   - Revenue impacted by incidents
   - Uptime % vs target (99.9%)
   - SLA compliance
   - Incident trend analysis

---

### 5.4 Implementation Checklist

**Rollout Plan (Phase 1: 2 weeks)**

Week 1:
- [ ] Deploy Prometheus scrape targets (all services)
- [ ] Create alert rules in AlertManager
- [ ] Configure PagerDuty integration
- [ ] Set up Slack #critical-alerts channel
- [ ] Assign on-call rotation

Week 2:
- [ ] Build Grafana dashboards
- [ ] Create runbooks for each P1/P2 alert
- [ ] Run incident simulation (chaos engineering)
- [ ] Train team on PagerDuty + escalation
- [ ] Publish status.elspa.io

Post-Launch:
- [ ] Monitor alert quality (tune false positives)
- [ ] Measure MTTR (Mean Time To Resolution)
- [ ] Monthly review of alert effectiveness
- [ ] Continuous improvement of runbooks

---

**Document Complete**

**Next Steps:**
1. Implement monitoring stack (Week 1-2)
2. Create alert rules & runbooks (Week 2-3)
3. Train on-call team (Week 3)
4. Soft launch with internal team only
5. Expand to full production with monitoring

---

*For implementation support or questions, contact: infrastructure@elspa.io*
