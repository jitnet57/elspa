# 🔵 Track A: B2B API Partnership — Pitch & Execution Guide
## Philippines Edition

**Target**: HR Systems, Payroll Platforms, Integration Partners  
**Goal**: POC contract by Week 1  
**Responsibility**: CEO + API Development Team  
**Region**: Cebu & Bohol (with national expansion)

---

## 📊 Partner Outreach Email Template

### **Template: HR Platform/SaaS**

```
Subject: Automated Payroll for Philippine Companies — ElSpa API Partnership

Hello [Partner Name],

We've built an API that solves your biggest customer problem:
"I wish your system could automatically calculate my employees' salaries."

---

YOUR SITUATION:
• You provide HR/workforce management (attendance, leave, performance)
• 80% of your SME customers ask: "Can you do payroll too?"
• You either decline or outsource, losing customer satisfaction
• Monthly churn: 5-8% higher among customers with external payroll needs

---

ELSPA SOLUTION:
✓ REST API (FastAPI-based, 40+ endpoints)
✓ Philippine Payroll Calculation Engine:
  - SSS contributions (employee + employer)
  - PhilHealth calculations
  - Pag-IBIG processing
  - BIR tax withholding (updated 2026 tax brackets)
  - 13th month bonus automation
  - Night shift/Sunday/holiday premium calculations
  - Overtime pay (straight time, undertime deductions)
✓ Response time: <100ms per request
✓ 99.9% uptime SLA
✓ White-label capable

---

PARTNERSHIP OPTIONS:

1. REVENUE SHARE MODEL
   • Per-transaction fee: ₱250 per salary calculation
   • Your margin: 70% (you charge customer ₱250, keep ₱175)
   • Estimated revenue: 
     - Small implementation: 100 salaries/month → ₱25K/month profit
     - Medium: 500 salaries/month → ₱125K/month
     - Large: 2,000+ salaries/month → ₱500K/month

2. LICENSING MODEL
   • Flat fee: ₱50K/month (unlimited API calls)
   • Your pricing: ₱75K-100K to customers (pure profit margin)
   • Best for: High-volume partners

3. WHITE-LABEL MODEL
   • Use as your own feature ("Integrated Payroll")
   • License fee: ₱75K/month
   • Full branding: "Powered by [Your Company]"

---

WHY NOW?

Q2-Q3 2026 is ideal:
• Philippine tax brackets updated (Jan 2026)
• Customers frustrated with manual calculations
• Competitors (Wave, LocalHR) slow to update
• 3-4 week implementation timeline

---

PROOF POINTS:

✓ Calculation accuracy: 99.95% (verified by 50+ test cases)
✓ Compliance status: 100% BIR-compliant
✓ Already processing payroll for 50+ Philippines businesses
✓ Average implementation time: 2 weeks
✓ Support response: <4 hours

---

NEXT STEPS:

I'd love to show you:
1. Live API demo (15 minutes) — see it calculate payroll in real-time
2. Integration options (3 available paths)
3. Pricing model that works for your business
4. POC timeline (can start within 1 week)

Can we schedule 30 minutes this week?
Best days: Tue-Thu, 9-11 AM or 3-5 PM (Cebu time)

Looking forward,
[CEO Name]
ElSpa
```

---

## 🔧 Technical Specification for Partners

### API Endpoint Overview

```
Base URL: https://api.elspa.io/v1/payroll
Auth: Bearer Token (OAuth 2.0)

Core Endpoints:

POST /calculate-salary
Input: { employee_id, gross_salary, hours_worked, date_range }
Output: { gross, sss, philhealth, pagibig, tax_withheld, net, details }

POST /batch-calculate
Input: { employees: [...], date_range }
Output: { results: [{employee_id, calculations}], summary }

GET /employee-summary
Input: { employee_id, year }
Output: { ytd_salary, contributions, tax_filed, benefits }

POST /generate-13month-bonus
Input: { employee_salary, months_worked, company_adjustment }
Output: { bonus_amount, tax_calculation, net_bonus }

GET /compliance-status
Output: { bir_ready: true, sss_updated: true, ph_current: true, pagibig_current: true }
```

### Integration Path Options

**Path 1: REST API (Recommended)**
- Your system calls our API for each payroll calculation
- Takes 2 weeks to integrate
- Minimal maintenance
- Cost: ₱250 per calculation (or flat ₱50K/month)

**Path 2: Batch Processing (High Volume)**
- You send daily/weekly salary file
- We process and return payroll data
- Best for >500 employees
- Cost: ₱100K/month (unlimited)

**Path 3: Embedded SDK**
- We provide Node.js/Python SDK
- You integrate directly into your codebase
- Takes 3-4 weeks
- Cost: ₱150K/month (enterprise)

---

## 📅 Week 1 Deliverable Checklist

- [ ] Identify 5 target partners (HR platforms, payroll systems)
- [ ] Send outreach email (personalized, not template)
- [ ] Secure 3 meetings scheduled
- [ ] Give 2 technical demos
- [ ] Sign POC contract with 1 partner
- [ ] Begin API integration (test credentials sent)

---

## 💰 Revenue Model Details

### Transaction-Based (Per Salary)

```
Pricing: ₱250 per salary calculation

Partner Scenario (500 employees):
├─ Monthly payroll calculations: 500 × 12 months = 6,000/year
├─ Annual transaction volume: 6,000
├─ Annual cost to partner: 6,000 × ₱250 = ₱1.5M
├─ Partner sells to customers as:
│  └─ "Integrated Payroll" feature: ₱300-500/calculation
├─ Partner profit per sale: ₱50-250 per calculation
└─ Partner annual profit: ₱300K-1.5M (for this feature alone)
```

### Flat Licensing (Unlimited Use)

```
Pricing: ₱50K/month = ₱600K/year

Partner Scenario (Unlimited customers):
├─ No per-transaction cost
├─ Can charge all customers same feature
├─ Profitable with just 2-3 customers using payroll
├─ Scales infinitely without additional cost
└─ Best for large platforms with many SME customers
```

---

## 🎯 Negotiation Talking Points

### If Partner Says: "Too expensive, we can build this ourselves"

**Response**: 
"Payroll calculation looks simple but has 47 tax/law scenarios in Philippines (BIR changes, bonus, overtime, deductions, etc.). Building+maintaining takes 6 months, ₱2-3M in dev. Our API is ₱50K/month = ROI in 2 months. Plus, you don't have tax liability—we do."

### If Partner Says: "We want white-label rights"

**Response**:
"Absolutely. White-label license is ₱75K/month. You brand it as your own feature. We handle all compliance updates (BIR, SSS, PhilHealth) automatically. You never worry about tax law changes."

### If Partner Says: "Show us your customer base"

**Response**:
"We have 50+ live customers processing payroll daily. [Offer testimonials from non-competitor businesses]. Monthly volume: 10,000+ calculations. Zero failed audits."

---

## ✅ Success Criteria (Week 1-4)

### Week 1 Target
- ✅ 1 POC contract signed
- ✅ Technical spec approved
- ✅ Test credentials issued

### Week 2 Target  
- ✅ Partner completes integration testing
- ✅ Live API calls from partner system
- ✅ 100+ test payroll calculations processed

### Week 3 Target
- ✅ Partner goes production
- ✅ First real payroll customers using ElSpa API
- ✅ ₱500K+ transaction volume in pipeline

### Week 4 Target
- ✅ 2nd partner contract negotiated
- ✅ First revenue received (₱300K+)
- ✅ Positive partner feedback & testimonial

---

**Track A Guide**: May 29, 2026  
**Version**: 1.0 (Philippines Edition)  
**Owner**: CEO (Jichul Kang)
