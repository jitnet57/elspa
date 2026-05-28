# CFO FINANCIAL OPERATIONS GUIDE
**ElSpa Leadership System** | Last Updated: 2026-05-29

---

## 📋 OVERVIEW
This guide enables the CFO to maintain financial health, cash runway, profitability tracking, and strategic forecasting for ElSpa's massage spa + driver logistics business.

**Core Responsibility:** Ensure cash position is healthy (12+ months runway), forecast accuracy within 5% variance, and all budget targets met.

---

## 📊 DAILY TASKS (5 min check-in)

### 09:00 | Revenue & Burn Rate Dashboard
**Automated Alert System:** Daily at 09:00 KST

```
TODAY'S METRICS:
├─ Revenue (YTD):        $XXX,XXX
├─ Daily Revenue Target: $X,XXX (X% of daily target achieved)
├─ Monthly Burn:         $XX,XXX (X% of budget)
├─ Cash Balance:         $X,XXX,XXX
└─ Days of Runway:       XXX days (12+ months = HEALTHY ✅)
```

**Action Thresholds:**
- If daily revenue < 80% of target → Investigate cause (CEO alert)
- If burn rate > 110% of budget → Request spend audit (CTO/VP Ops)
- If cash runway < 9 months → Trigger funding/cost reduction (CEO decision)

**Data Source:** Accounting system + API integrations (Stripe, bank feeds)

---

### 16:00 | Cash Position Check
**Quick verification:**
- [ ] Cash balance matches bank reconciliation
- [ ] Outstanding invoices flagged (AR aging)
- [ ] Payroll funding confirmed for next week

**If red flag:** Escalate to CEO immediately

---

## 📅 WEEKLY TASKS (Wednesday)

### 09:00 - 12:00 | Detailed P&L Review

#### Part 1: Revenue Analysis (30 min)

```
REVENUE BREAKDOWN:
├─ Spa Bookings Revenue
│  ├─ Gross: $XXX,XXX
│  ├─ Cancellations: ($XX,XXX)
│  └─ Net: $XXX,XXX (+X% WoW)
│
├─ Driver Commissions
│  ├─ Gross: $XX,XXX
│  ├─ Refunds: ($X,XXX)
│  └─ Net: $XX,XXX (+X% WoW)
│
└─ TOTAL MRR: $XXX,XXX (vs Budget: $XXX,XXX)
   └─ Variance: +/-X% 🟢🟡🔴
```

**Key Questions:**
- Q1: Is spa revenue tracking to plan? (cohort analysis by location)
- Q2: Driver commission growing? (activation vs utilization)
- Q3: Any revenue concentration risk? (top 3 customers = ?% of revenue)
- Q4: Refund/chargeback rate rising? (fraud risk?)

**Action:** Document variance explanations in weekly P&L report

---

#### Part 2: Expense Analysis (30 min)

```
EXPENSE BREAKDOWN:
├─ COGS (Cost of Goods Sold)
│  ├─ Therapist payroll: $XXX,XXX (X% of spa revenue)
│  ├─ Driver commissions: $XX,XXX (X% of driver revenue)
│  ├─ Supplies & equipment: $XX,XXX
│  └─ Total COGS: $XXX,XXX
│
├─ OPEX (Operating Expenses)
│  ├─ Salaries (team): $XXX,XXX
│  ├─ Tech/infrastructure: $XX,XXX
│  ├─ Marketing: $XX,XXX
│  ├─ Customer acquisition: $XX,XXX
│  ├─ Admin/legal: $XX,XXX
│  └─ Total OPEX: $XXX,XXX
│
└─ TOTAL EXPENSES: $XXX,XXX (vs Budget: $XXX,XXX)
   └─ Variance: +/-X% 🟢🟡🔴
```

**Key Questions:**
- Q1: Are therapist costs (% of spa revenue) in target range? (60-70%?)
- Q2: CAC spending on track? (monthly marketing budget = $?)
- Q3: Any department overspending? (red flags >110% of budget)
- Q4: Fixed vs variable cost ratio? (scalability check)

**Action Items:**
- [ ] If COGS > target: Renegotiate supplier contracts or adjust pricing
- [ ] If OPEX > budget: Request spending freeze + department reviews
- [ ] If CAC rising: Evaluate campaign efficiency, adjust marketing mix

---

#### Part 3: Profitability Analysis (15 min)

```
PROFITABILITY:
├─ Gross Profit: $XXX,XXX (Gross Margin: X%)
│  └─ Target: X% (if below target = investigate pricing/COGS)
│
├─ EBITDA: $XXX,XXX (EBITDA Margin: X%)
│  └─ Target: X% (operations efficiency metric)
│
├─ Net Income: $XXX,XXX or ($XXX,XXX)
│  └─ Target: Breakeven or +X% by [DATE]
│
└─ Burn Rate (monthly): $XXX,XXX
   └─ Runway: XXX months (CRITICAL: maintain >12 months)
```

**Unit Economics:**
```
├─ CAC (Customer Acquisition Cost): $X per customer
├─ LTV (Lifetime Value): $X per customer
├─ LTV:CAC Ratio: X:1 (Target: >3:1)
└─ Payback Period: X months (Target: <6 months)
```

**Decision Gate:**
- If profitability > target: Reinvest in growth (hiring, marketing, expansion)
- If profitability < target: Cost cutting + revenue optimization (pricing, upsell)
- If burn rate unsustainable: Trigger funding round or strategic pause

---

#### Part 4: Cash Flow Forecast (15 min)

```
13-WEEK ROLLING CASH FORECAST:
Week 1:  Inflow $XXX,XXX | Outflow $XXX,XXX | Balance $X,XXX,XXX
Week 2:  Inflow $XXX,XXX | Outflow $XXX,XXX | Balance $X,XXX,XXX
Week 3:  Inflow $XXX,XXX | Outflow $XXX,XXX | Balance $X,XXX,XXX
...
Week 13: Inflow $XXX,XXX | Outflow $XXX,XXX | Balance $X,XXX,XXX

KEY EVENTS:
├─ Payroll week: Weeks 1, 5, 9, 13 (outflow +$XXX,XXX)
├─ Supplier payments: Weeks 2, 6, 10 (outflow +$XX,XXX)
├─ Revenue spikes: Weekends (inflow +$XX,XXX)
└─ Low-revenue periods: [Dates] (watch closely)
```

**Stress Test:**
- [ ] If revenue drops 20%: Still have X months runway?
- [ ] If payroll increases 10%: Impact on runway?

---

### 14:00 | Budget vs Actual Review (1 hour meeting with CEO + COO)

**Attendees:** CFO, CEO, VP Ops, VP Engineering

**Agenda:**
1. **Overall P&L status** (on/off budget?)
2. **Variance explanation** (why -5% revenue? why +15% marketing spend?)
3. **Departmental deep-dive** (if any dept >110% of budget)
4. **Forecast revision** (update next 3 months?)

**Output:** Weekly P&L report (sent to CEO/Board)

---

## 📋 MONTHLY TASKS (1st of month)

### Day 1-2: Financial Close

#### Step 1: Account Reconciliation (2-3 hours)
- [ ] Bank reconciliation (all accounts balanced)
- [ ] AR aging (invoices outstanding >30 days flagged)
- [ ] AP aging (bills due next 30 days)
- [ ] Payroll verification (all hours logged correctly)
- [ ] Revenue recognition (all transactions recorded in correct period)

**Output:** Reconciliation checklist signed off

---

#### Step 2: Close P&L & Balance Sheet (4 hours)

**Close Checklist:**
```
REVENUE:
├─ Spa booking revenue: Verified ✅
├─ Driver commission revenue: Verified ✅
├─ Refunds & chargebacks: Recorded ✅
└─ Revenue reserves: Adjusted ✅

EXPENSES:
├─ Therapist payroll: Verified ✅
├─ Team payroll: Verified ✅
├─ Contractor payments: Verified ✅
├─ Supplier invoices: Reconciled ✅
└─ Accrued expenses: Recorded ✅

BALANCE SHEET:
├─ Cash: Reconciled ✅
├─ Accounts Receivable: Aged ✅
├─ Fixed Assets: Depreciation ✅
├─ Accounts Payable: Reconciled ✅
└─ Equity: Updated ✅
```

**Output:** Unaudited financials (P&L, Balance Sheet, Cash Flow)

---

#### Step 3: Variance Analysis (2 hours)

**Template:**

| Line Item | Budget | Actual | Variance | % | Explanation |
|-----------|--------|--------|----------|---|-------------|
| Spa Revenue | $XXX | $XXX | $(X) | -X% | Therapist coverage gap weeks 2-3 |
| Driver Revenue | $XX | $XX | $X | +X% | New driver cohort onboarded |
| Therapist Payroll | $XXX | $XXX | $X | +X% | Overtime hours (peak weekend) |
| Marketing | $XX | $XX | $(X) | -X% | Campaign paused for retargeting |

**Action Items:**
- Document explanation for all variances >5%
- Identify recurring patterns (e.g., therapist payroll always over budget)
- Recommend process improvements

---

#### Step 4: Forecast Update (2 hours)

**Rolling 36-month forecast revision:**

```
FORECAST MODEL:
├─ Revenue projections (by cohort/location)
├─ Unit economics (CAC, LTV, payback)
├─ Headcount plan (hiring schedule)
├─ OPEX trajectory (marketing, infrastructure)
├─ Profitability path (EBITDA margin over time)
└─ Cash runway (months of runway at current burn)
```

**Update Logic:**
- Actual results feed into forecast
- If revenue trailing plan: Reduce growth assumption
- If customers acquiring faster: Increase CAC budget
- If margin improving: Model path to profitability

**Output:** Updated 36-month financial model

---

### Day 3: Monthly Investor/Board Reporting

#### Monthly Financial Statement Package

```
MONTHLY REPORT INCLUDES:

1. Executive Summary (1 page)
   ├─ MRR: $XXX,XXX (vs target: $XXX,XXX)
   ├─ Growth: +X% WoW, +X% MoM
   ├─ Burn: $XXX,XXX/month
   ├─ Runway: XXX months
   └─ Key highlights/challenges

2. Detailed P&L (1 page)
   ├─ Revenue by segment
   ├─ COGS breakdown
   ├─ OPEX by department
   ├─ Gross/EBITDA/Net margins
   └─ Variance explanations

3. Balance Sheet (1 page)
   ├─ Assets: Cash, AR, Fixed, Other
   ├─ Liabilities: Payables, Accruals, Debt
   └─ Equity: Capital raised, Retained earnings

4. Cash Flow Statement (1 page)
   ├─ Operating cash flow
   ├─ Investing activities
   ├─ Financing activities
   └─ Net change in cash

5. Key Metrics Dashboard (1 page)
   ├─ MRR growth rate
   ├─ Unit economics (CAC, LTV)
   ├─ Churn rate
   ├─ NPS score
   ├─ Team headcount
   └─ Cash runway

6. Narrative (2-3 pages)
   ├─ Business highlights
   ├─ Variance explanations
   ├─ Strategic initiatives & progress
   ├─ Risk assessment
   └─ Next month priorities
```

**Distribution:** CEO → Board/Investors by 5pm on 1st of month

---

## 💰 CFO DASHBOARD

**Refresh Cadence:** Daily (automated), Weekly (manual), Monthly (close + reporting)

### DAILY FINANCIAL HEALTH

```
╔══════════════════════════════════════════════════════════╗
║           CFO FINANCIAL OPERATIONS DASHBOARD             ║
║                    [DATE] | [TIME]                       ║
╠══════════════════════════════════════════════════════════╣

CASH & RUNWAY
├─ Cash Balance:              $X,XXX,XXX
├─ Runway (months):           XXX (Target: >12) 🟢
├─ Burn Rate (monthly):       $XXX,XXX
├─ Payroll (next week):       $XXX,XXX
└─ Major outflows (30 days):  [List]

REVENUE TODAY
├─ Today's Revenue:           $XX,XXX (X% of daily target)
├─ YTD Revenue:               $XXX,XXX
├─ MRR (extrapolated):        $XXX,XXX
├─ vs Monthly Target:         (X% on track)
└─ vs Budget:                 (X% variance)

PROFITABILITY
├─ Gross Margin (MTD):        X% (Target: X%)
├─ EBITDA Margin (MTD):       X% (Target: X%)
├─ Net Margin (MTD):          X% (Breakeven target)
└─ Burn Rate:                 $XXX,XXX/mo

HEADCOUNT & PAYROLL
├─ Total Headcount:           X people
├─ Monthly Payroll:           $XXX,XXX (X% of revenue)
├─ Therapists Onboarded:      +X (this month)
├─ Team Attrition Risk:       X people flagged
└─ Next Hiring Wave:          [Date]

ALERTS 🚨
├─ Revenue variance:          On target ✅
├─ Burn rate:                 On budget ✅
├─ Cash runway:               Healthy (14mo) ✅
├─ AR aging:                  $XXX >30 days 🟡
└─ Next expense:              Payroll [DATE]

╚══════════════════════════════════════════════════════════╝
```

---

## 📈 WEEKLY P&L TEMPLATE

**Sent to CEO every Wednesday 16:00**

```
ELSPA WEEKLY P&L
Week of [DATE]

REVENUE SUMMARY:
  Spa Bookings:     $XXX,XXX (+X% WoW)
  Driver Revenue:   $XX,XXX (+X% WoW)
  Total Revenue:    $XXX,XXX (+X% WoW)
  YTD Revenue:      $XXX,XXX (+X% YoY)

EXPENSES:
  Therapist Cost:   $XXX,XXX (X% of spa revenue)
  Payroll:          $XX,XXX
  Marketing:        $XX,XXX
  Other:            $XX,XXX
  Total Expenses:   $XXX,XXX

PROFITABILITY:
  Gross Profit:     $XXX,XXX (Gross Margin: X%)
  EBITDA:           $XXX,XXX (EBITDA Margin: X%)
  Net:              $XXX,XXX (Net Margin: X%)

CASH:
  Starting Cash:    $X,XXX,XXX
  Inflow:           $XXX,XXX
  Outflow:          $XXX,XXX
  Ending Cash:      $X,XXX,XXX
  Runway:           XXX months ✅

VARIANCES:
  Revenue vs Budget: +X% (Better than plan)
  Expenses vs Budget: -X% (Under budget)
  Net vs Budget:     +X% (Ahead of schedule)
```

---

## 🎯 FINANCIAL KPIs & TARGETS

| KPI | Definition | Target | Current | Status |
|-----|-----------|--------|---------|--------|
| **MRR Growth** | Month-over-month revenue growth | +8% | +6% | 🟡 |
| **Gross Margin** | (Revenue - COGS) / Revenue | >65% | 68% | 🟢 |
| **EBITDA Margin** | EBITDA / Revenue | >20% | 15% | 🟡 |
| **CAC** | Total marketing spend / new customers | <$X | $X | 🟢 |
| **LTV** | Total lifetime customer value | >$XXX | $XXX | 🟢 |
| **LTV:CAC** | Lifetime value / acquisition cost | >3:1 | 4.2:1 | 🟢 |
| **Payback Period** | Months for CAC to be recouped | <6mo | 4.5mo | 🟢 |
| **Churn Rate** | % customers lost per month | <2% | 1.8% | 🟢 |
| **Cash Runway** | Months of operating capital | >12mo | 14mo | 🟢 |
| **Burn Rate** | Monthly cash burn | <$XXX | $XXX | 🟢 |

---

## 💼 BUDGET MANAGEMENT

### Departmental Budgets (Monthly)

```
BUDGET ALLOCATION:
├─ Spa Operations:       $XXX,XXX (40% of revenue)
│  ├─ Therapist payroll: $XXX,XXX
│  ├─ Supplies:          $XX,XXX
│  └─ Location costs:    $XX,XXX
│
├─ Driver Logistics:     $XX,XXX (25% of revenue)
│  ├─ Commissions:       $XX,XXX
│  ├─ Tech/ops:         $X,XXX
│  └─ Insurance:        $X,XXX
│
├─ Growth & Marketing:   $XX,XXX (15% of revenue)
│  ├─ Customer acq:      $XX,XXX
│  ├─ Brand/marketing:   $X,XXX
│  └─ Partnerships:      $X,XXX
│
├─ Technology & Ops:     $XX,XXX (12% of revenue)
│  ├─ Engineering team:  $XX,XXX
│  ├─ Infrastructure:    $X,XXX
│  └─ Tools/software:    $X,XXX
│
└─ Admin & Finance:      $X,XXX (8% of revenue)
   ├─ Finance team:      $X,XXX
   ├─ Legal/compliance:  $X,XXX
   └─ Operations:        $X,XXX
```

**Budget Control Process:**
1. Monthly budget approved by CEO
2. Weekly tracking (actual vs budget)
3. If department > 110% of budget: Spending freeze + approval required
4. Monthly variance analysis + explanations
5. Quarterly budget reset (if needed)

---

## 🚨 FINANCIAL ALERT THRESHOLDS

**Automated alerts sent to CFO (and CEO if critical):**

| Alert | Threshold | Action |
|-------|-----------|--------|
| **Revenue Miss** | < 80% of daily target | Investigate immediately |
| **Burn Spike** | > 110% of budget | Request audit, spending freeze |
| **Cash Runway** | < 9 months | Trigger funding/cost plan |
| **Gross Margin** | < 60% | Review pricing/COGS |
| **Churn Rise** | > 3% monthly | Customer retention plan |
| **AR Aging** | > $XXX >30 days | Collection follow-up |
| **Payroll Error** | Any anomaly | HR verification |

---

## 📞 WEEKLY FINANCIAL COMMUNICATION

### Wednesday Evening Summary (to CEO/Board)

```markdown
# Financial Update - Week of [DATE]

## Headlines
✅ MRR: $XXX,XXX (on track)
🟡 Burn: $XXX/mo (+5% vs budget)
🟢 Runway: 14 months (healthy)

## Detailed Metrics
- Revenue: $XXX,XXX YTD (+X% vs target)
- Gross Margin: X% (target: X%)
- Headcount: X people (+X from last week)

## Variance Explanations
[List all variances >5%]

## Outlook
[Next month forecast, any risks]
```

---

## 📱 CFO WEEKLY CALENDAR

```
MONDAY
 09:00 - 09:05  Daily revenue check
 16:00 - 16:05  Daily burn rate check

TUESDAY
 09:00 - 09:05  Daily revenue check
 16:00 - 16:05  Daily burn rate check

WEDNESDAY
 09:00 - 12:00  Weekly P&L review
 14:00 - 15:00  Budget vs Actual meeting (with CEO)
 16:00 - 17:00  Prepare weekly report

THURSDAY
 09:00 - 09:05  Daily revenue check
 16:00 - 16:05  Daily burn rate check

FRIDAY
 09:00 - 09:05  Daily revenue check
 16:00 - 16:05  Daily burn rate check

MONTH-END (1st of month)
 All day: Financial close, P&L finalization
 Next day: Investor reporting
```

---

## ✅ CFO ACCOUNTABILITY CHECKLIST

**Daily:**
- [ ] Cash position verified
- [ ] Burn rate vs budget checked
- [ ] Revenue on track (>80% of target)

**Weekly (Wednesday):**
- [ ] P&L reviewed (revenue, expenses, profitability)
- [ ] Budget vs actual analyzed (all departments)
- [ ] Forecast updated (3-month rolling)
- [ ] Weekly report sent to CEO
- [ ] Cash flow forecast updated (13-week)

**Monthly (1st):**
- [ ] Financial close completed
- [ ] P&L, Balance Sheet, Cash Flow finalized
- [ ] Variance analysis & explanations done
- [ ] 36-month forecast updated
- [ ] Investor/board report sent

**Success Criteria:**
- Cash runway maintained >12 months
- Revenue variance <5% from plan
- Budget compliance >95% (departments)
- Forecast accuracy >90%
- Board reporting on time every month

---

## 📚 SUPPORTING DOCUMENTS
- [CEO-WEEKLY-OPERATIONS.md](./CEO-WEEKLY-OPERATIONS.md) — CEO decision framework
- [CTO-TECHNICAL-OPERATIONS.md](./CTO-TECHNICAL-OPERATIONS.md) — Infrastructure spending
- [TEAM-KPI-DASHBOARDS.md](./TEAM-KPI-DASHBOARDS.md) — Department KPI tracking
- [Financial Forecast Model](../00-BUSINESS-VALUE/GLOBAL-FINANCIAL-MODEL-36MONTH.md) — 36-month projections

---

**Document Version:** 1.0 | **Last Updated:** 2026-05-29 | **Owner:** CFO | **Next Review:** 2026-06-05
