# CEO WEEKLY OPERATIONS GUIDE
**ElSpa Leadership System** | Last Updated: 2026-05-29

---

## 📋 OVERVIEW
This guide enables the CEO to manage ElSpa's growth across **massage spa operations** and **driver logistics** with clear daily/weekly rhythms, metrics tracking, and decision gates.

**Key Business Model:**
- B2C spa booking → therapist scheduling + in-spa services
- Driver logistics → real-time location tracking, job assignment, completion validation
- Revenue streams: Booking fees (spa), Driver commissions, Equipment rentals

---

## 🕐 MONDAY MORNING ROUTINE (30 min)
**Time: 09:00 - 09:30 KST**

### 1. Weekend Metrics Review (15 min)
Review dashboard: [CEO-DASHBOARD](#ceo-dashboard)

**Key Numbers:**
- [ ] Total bookings (Fri-Sun) vs target → growth %
- [ ] Average therapist utilization (spa capacity used)
- [ ] Driver hours logged → utilization rate
- [ ] Customer satisfaction scores (NPS feedback)
- [ ] Any critical issues reported (app crashes, payment failures, customer complaints)

**Questions to Ask:**
- Q1: "Did we hit our weekend booking targets?"
- Q2: "Any therapists at risk (low utilization, high cancellations)?"
- Q3: "Driver satisfaction trending up or down?"
- Q4: "What's our current MRR vs target for May?"

### 2. Track A/B/C Progress Check (10 min)
**Track A: Spa Expansion** (Highest Priority)
- [ ] New spa location pipeline status
- [ ] Therapist onboarding count (this week)
- [ ] Average booking rate per therapist

**Track B: Driver Fleet Growth**
- [ ] Active drivers count
- [ ] Avg trips per driver (capacity utilization)
- [ ] Driver retention rate

**Track C: Product Innovation**
- [ ] Current sprint status (development velocity)
- [ ] Customer feature requests (top 3)
- [ ] Technical debt assessment

### 3. Week Standup Preparation (5 min)
- [ ] Identify top 3 risks/blockers
- [ ] List 2-3 key decisions needed this week
- [ ] Prepare talking points for standup

---

## 📅 TUESDAY-THURSDAY DAILY ACTIONS

### 09:00 - 09:15 | Daily Standup with Team Leads
**Attendees:** CFO, CTO, VP Sales, VP Operations

**Agenda:**
1. **Previous day's critical metrics** (60 sec)
   - Revenue achieved vs daily target
   - System uptime status
   - Active customer/driver issues

2. **Today's focus & blockers** (2 min)
   - What's the team's #1 priority today?
   - What's blocking them?

3. **Risk/escalations** (1 min)
   - Any go/no-go decisions needed?

**Output:** Recorded action items (async Slack)

---

### 10:30 - 11:30 | Customer/Partner Calls (2-3 per week)
**Goal:** Direct customer feedback, partnership opportunities, churn prevention

**Call Slots:**
- **Tuesday 10:30:** Top 3 spa locations (owner feedback on therapist availability, customer demand)
- **Wednesday 10:30:** 2-3 key customer calls (NPS interviews, feature requests)
- **Thursday 10:30:** Driver partner meetings (fleet feedback, logistics optimization)

**Call Template:**
```
1. Opening (1 min): "Thanks for your time. How are things going?"
2. Deep dive (8 min): Ask 2-3 open questions
   - Spa: "What's your biggest challenge right now?"
   - Driver: "What's working/not working in the app?"
3. Ask for help (1 min): "What would help you 10x?"
4. Close (1 min): "Next steps - I'll have [person] follow up"
```

**Document:** Capture insights in [CUSTOMER-INSIGHTS](../00-BUSINESS-VALUE/CUSTOMER-INSIGHTS.md) (auto-appended weekly)

---

### 16:00 - 16:15 | Daily Metrics Review
**Dashboard:** [CEO-DASHBOARD](#ceo-dashboard) (refresh from CFO)

**Quick checks:**
- [ ] MRR YTD vs budget (any drift >5%?)
- [ ] System uptime (99.9% SLA met?)
- [ ] Critical bugs or support tickets?
- [ ] Any team alerts (attrition risk, burnout)?

**If any red flags:** Trigger deeper review with CFO/CTO immediately

---

## 🎯 FRIDAY DECISION DAY (2 hours)
**Time: 14:00 - 16:00 KST** | **Attendees:** CFO, CTO, VP Sales/Ops

### Phase 1: Weekly Business Review (45 min)

#### Revenue & Growth (15 min)
```
MRR Performance:
├─ Target MRR: $X
├─ Actual MRR: $Y
├─ YTD growth: +X%
└─ Forecast (Q2): $Z

Cohort Metrics:
├─ New customers this week: N
├─ Customer churn rate: X%
├─ NPS score (latest): X
└─ CAC / LTV ratio: X:X
```

**Decision Gate:** Is growth on track? If not, escalate Track A/B priority.

#### Operational Health (15 min)
```
Spa Operations:
├─ Therapist count: N active
├─ Utilization rate: X%
├─ Booking cancellation rate: X%
└─ Customer satisfaction (spa): X/10

Driver Logistics:
├─ Active drivers: N
├─ Avg trips/driver: X
├─ Completion rate: X%
└─ Driver NPS: X/10
```

**Decision Gate:** Any therapist/driver churn risk? Activation issues?

#### Team Health (15 min)
```
├─ Headcount: N (+/- from last week)
├─ Attrition risk: X people flagged
├─ Hiring pipeline: Stage breakdown
└─ Burn rate vs budget: On/off track
```

---

### Phase 2: Go/No-Go Decisions (60 min)
Use [DECISION-FRAMEWORK](./DECISION-FRAMEWORK.md) for each of these:

#### 1. Expansion Decision (if applicable)
**Question:** Should we launch in [new city/country]?
- [ ] Market validation completed? (customer demand)
- [ ] Financial model positive? (CAC < LTV)
- [ ] Operations ready? (staffing, logistics)
- [ ] **Decision:** GO / NO-GO / DELAY

**If GO:** Assign exec sponsor, set launch date, create 90-day plan

#### 2. Feature Prioritization
**Question:** Which 3 features should engineering focus on next sprint?

**Scoring Criteria:**
- Customer value (1-5)
- Business impact (1-5)
- Dev complexity (1-5)
- Risk level (1-5)

**Output:** Ranked prioritized backlog → CTO confirms feasibility

#### 3. Hiring Decisions
**Question:** Should we hire for [role]?

**Criteria:**
- Revenue impact (does this hire enable $X revenue growth?)
- Runway impact (do we have 12+ months cash?)
- Team capacity (is current team at 80%+ utilization?)

**If YES:** Draft offer, confirm start date

#### 4. Risk Escalation
**Question:** What's our biggest risk this week?

Review [RISK-REGISTER](#risk-register) and assign mitigation owners.

---

### Phase 3: Next Week Planning (15 min)
- [ ] Set Monday standup topics
- [ ] Identify 1-2 key decisions for next week
- [ ] Confirm exec availability (customer calls, board prep)

---

## 📊 CEO DASHBOARD

**Refresh Cadence:** Daily (9:00 AM automated), Weekly (Friday 2:00 PM manual)

### REAL-TIME METRICS (Today)

```
┌─ REVENUE METRICS ──────────────────────────┐
│ Daily Revenue:        $X,XXX               │
│ MRR (Month-to-Date):  $XXX,XXX (vs $YYY)  │
│ Days to Payback:      X days (Target: X)   │
│ Forecast (EoMonth):   $XXX,XXX             │
└────────────────────────────────────────────┘

┌─ CUSTOMER METRICS ─────────────────────────┐
│ Total Customers:      X,XXX (+X% WoW)      │
│ New Customers (week): X (+X% YoY)          │
│ Churn Rate:           X% (Target: <X%)     │
│ NPS Score:            X (Target: >60)      │
│ CAC:                  $X (Target: <$X)     │
│ LTV:                  $X (Target: >$X)     │
└────────────────────────────────────────────┘

┌─ OPERATIONS METRICS ───────────────────────┐
│ Spa Bookings (week):  X (+X% WoW)          │
│ Therapist Util:       X% (Target: >80%)    │
│ Driver Trips (week):  X (+X% WoW)          │
│ Driver Completion:    X% (Target: >95%)    │
│ System Uptime:        X.X% (SLA: 99.9%)    │
└────────────────────────────────────────────┘

┌─ FINANCIAL HEALTH ─────────────────────────┐
│ Burn Rate (monthly):  $X,XXX vs Budget     │
│ Cash Runway:          X months              │
│ Headcount:            X people              │
│ Payroll:              $X,XXX/month          │
└────────────────────────────────────────────┘

┌─ TOP RISKS 🚨 ──────────────────────────────┐
│ 1. [Risk] — Owner: [Name] — Status: [RED]  │
│ 2. [Risk] — Owner: [Name] — Status: [YLW]  │
│ 3. [Risk] — Owner: [Name] — Status: [GRN]  │
└────────────────────────────────────────────┘
```

**Data Source:** CFO (daily), CTO (ops metrics), VP Sales (customer metrics)

---

## 📈 WEEKLY KPI TARGETS

| KPI | Target | Current | Status | Notes |
|-----|--------|---------|--------|-------|
| MRR Growth | +8% WoW | +6% | 🟡 | On track for Q2 |
| Customer Churn | <2% | 1.8% | 🟢 | Healthy |
| Therapist Util | >80% | 82% | 🟢 | Strong demand |
| Driver Activation | >85% | 78% | 🟡 | Ramp campaign needed |
| System Uptime | 99.9% | 99.97% | 🟢 | Excellent |
| NPS Score | >60 | 58 | 🟡 | Need feedback loop |
| Cash Runway | >12mo | 14mo | 🟢 | Healthy position |

---

## 🚨 RISK REGISTER

**Template for Friday review:**

| Risk | Impact | Probability | Mitigation Owner | Status |
|------|--------|-------------|------------------|--------|
| Therapist churn spike | High | Medium | VP Ops | 🟡 Monitor |
| Driver supply shortage | High | Low | VP Logistics | 🟢 Controlled |
| Payment processing outage | Critical | Low | CTO | 🟢 Backed up |
| Competitor market entry | Medium | Medium | VP Sales | 🟡 Watch |
| Cash burn accelerates | High | Low | CFO | 🟢 On budget |

---

## 📞 WEEKLY COMMUNICATION TEMPLATE

### Monday Standup (All Hands, 09:45-10:00)
```markdown
# Monday Standup - Week of [DATE]

## Status
✅ Hit MRR target last week (+X%)
🟡 Driver adoption below target (78% vs 85%)
🟢 System uptime: 99.97% (excellent)

## This Week's Focus
1. Ramp driver activation (VP Logistics owns)
2. Customer feedback loop (Product team)
3. Therapist retention review (VP Ops)

## Decisions Needed This Week
- Feature prioritization (Friday 2pm)
- New spa location expansion (Friday 2pm)

## Blockers
- None currently

---
Next update: Tuesday 9am standup
```

### Friday Update (Email to Board/Investors)
```markdown
# ElSpa Weekly Report - Week of [DATE]

## Highlights
✅ MRR: $XXX,XXX (+X% WoW)
✅ New Customers: X (+X% YoY)
✅ System Uptime: 99.97%

## Challenges
🟡 Driver adoption at 78% (below 85% target)
🟡 NPS slipped to 58 (tracking customer feedback loop)

## Next Week
- Implement driver activation campaign
- Launch customer feedback survey
- Expand to [new city] (pending decision Friday)

## Burn Rate Status
Burn: $XXX/mo (on budget)
Runway: 14 months (healthy)
```

---

## 🎓 CEO DECISION-MAKING FRAMEWORK

**When facing a decision, ask:**

1. **Strategic Fit?** — Does this align with our 5-year vision?
2. **Financial Impact?** — Positive ROI within 12 months?
3. **Team Ready?** — Do we have capacity/skills?
4. **Customer Value?** — Does this solve a real pain point?
5. **Timing?** — Right time or can it wait?

**Output:** GO / NO-GO / DELAY decision

---

## 📱 MONDAY-FRIDAY CALENDAR TEMPLATE

```
MONDAY
 09:00 - 09:30  Weekend Metrics Review
 09:45 - 10:00  All-Hands Standup
 10:30 - 11:30  Customer Call (Spa Locations)
 14:00 - 15:00  1:1 with CFO (financials)
 16:00 - 16:15  Daily Metrics Review

TUESDAY
 09:00 - 09:15  Daily Standup
 10:30 - 11:30  Customer Call (Top Customers)
 14:00 - 15:00  1:1 with VP Sales (pipeline)
 16:00 - 16:15  Daily Metrics Review

WEDNESDAY
 09:00 - 09:15  Daily Standup
 10:30 - 11:30  Customer Call (High-risk churn)
 14:00 - 15:00  1:1 with CTO (tech roadmap)
 16:00 - 16:15  Daily Metrics Review

THURSDAY
 09:00 - 09:15  Daily Standup
 10:30 - 11:30  Customer Call (Driver Partners)
 14:00 - 15:00  1:1 with VP Ops (expansion)
 16:00 - 16:15  Daily Metrics Review

FRIDAY
 09:00 - 09:30  Weekly Prep (review metrics)
 14:00 - 16:00  DECISION DAY (WBR + Go/No-Go)
 16:00 - 16:30  Weekly Board Update
```

---

## ✅ ACCOUNTABILITY CHECKLIST

**CEO Weekly Deliverables:**

- [ ] Monday: Metrics review + standup prep completed
- [ ] Tue-Thu: Daily standup attended, 1 customer call/day
- [ ] Friday: Business review completed, all go/no-go decisions made
- [ ] Friday: Weekly board update sent (to investors/board)
- [ ] All week: Top 3 blockers identified & escalated
- [ ] All week: Risk register updated (if changes)

**Success Criteria:**
- MRR on track (±5% variance acceptable)
- Zero critical system outages
- Team morale healthy (based on 1:1s)
- All executive decisions made on time
- Board/investors updated weekly

---

## 📚 SUPPORTING DOCUMENTS
- [CFO-FINANCIAL-OPERATIONS.md](./CFO-FINANCIAL-OPERATIONS.md) — Detailed financial review process
- [CTO-TECHNICAL-OPERATIONS.md](./CTO-TECHNICAL-OPERATIONS.md) — Technical roadmap & sprint tracking
- [DECISION-FRAMEWORK.md](./DECISION-FRAMEWORK.md) — Go/no-go decision templates
- [TEAM-KPI-DASHBOARDS.md](./TEAM-KPI-DASHBOARDS.md) — Department-level metrics
- [Risk-Register.md](#risk-register) — Risk tracking & mitigation

---

**Document Version:** 1.0 | **Last Updated:** 2026-05-29 | **Owner:** CEO | **Next Review:** 2026-06-05
