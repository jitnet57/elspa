# ElSpa VC Data Room Structure
## Series A Due Diligence Document Index

---

## Overview

This document outlines the complete data room structure for ElSpa Series A fundraising. All documents are organized by category for easy investor access via VDR (Virtual Data Room) software like Intralinks, SmartLocker, or Citrix ShareFile.

**Data Room Manager:** Kang Jichul (CEO)  
**Last Updated:** 2026-05-29  
**Status:** Series A Preparation

---

## Table of Contents

1. [Legal Documents](#1-legal-documents)
2. [Financial Documents](#2-financial-documents)
3. [Market & Business Analysis](#3-market--business-analysis)
4. [Product & Technical](#4-product--technical)
5. [Customer & Revenue](#5-customer--revenue)
6. [Team & Organization](#6-team--organization)
7. [Board & Governance](#7-board--governance)
8. [Due Diligence Checklist](#8-due-diligence-checklist)

---

## 1. LEGAL DOCUMENTS

### 1.1 Corporate Structure

| Document | Status | File Path | Notes |
|----------|--------|-----------|-------|
| **Articles of Incorporation** | Draft | `/legal/articles-of-incorporation.pdf` | Delaware C-Corp; filed 2025-11 |
| **By-Laws** | Executed | `/legal/bylaws.pdf` | Standard Delaware provisions |
| **Certificate of Good Standing** | Current | `/legal/cert-good-standing.pdf` | Valid as of 2026-05-28 |
| **Delaware Business License** | Active | `/legal/delaware-license.pdf` | Renewed annually |
| **Registered Agent Documentation** | Active | `/legal/registered-agent.pdf` | Incorp Services LLC |
| **Company Seal** | Executed | `/legal/company-seal.pdf` | For document attestation |

### 1.2 Cap Table & Equity

| Document | Status | File Path | Notes |
|----------|--------|-----------|-------|
| **Capitalization Table** | Current | `/legal/cap-table.xlsx` | Latest as of 2026-05-29 |
| | | | CEO: 100% (pre-Series A) |
| **Stock Ledger** | Current | `/legal/stock-ledger.pdf` | Details all issued shares |
| **Certificate of Incorporation (Preferred Stock)** | Pending | `/legal/cert-preferred.pdf` | To be executed at Series A close |
| **SAFE Agreements** | Executed | `/legal/safe-*.pdf` | 3 SAFEs from angel investors (2025) |
| | | | SAFE 1: $500K @ 5M cap |
| | | | SAFE 2: $300K @ 5M cap |
| | | | SAFE 3: $200K @ 5M cap |
| **Equity Grant Documents** | Executed | `/legal/equity-grants/` | Options for 3 early employees |
| | | | CEO: 0 options (founder) |
| | | | Engineer 1: 50K options (4-yr vesting) |
| | | | Engineer 2: 30K options (4-yr vesting) |
| | | | PM: 20K options (4-yr vesting) |

**Cap Table Summary (Pre-Series A):**
```
100,000 total shares outstanding

Kang Jichul (Founder/CEO)          100,000 shares (100%)
                                   ---
                                   100,000 (100%)

Note: Series A will create new Series A Preferred shares
Expected post-Series A breakdown (assuming $2.5M at $10M post-money):
- Founder: 77%
- Series A investors: 25%
- Employee option pool (new): 10% (for future hires)
```

### 1.3 Founder & Shareholder Agreements

| Document | Status | File Path | Notes |
|----------|--------|-----------|-------|
| **Founder Stock Repurchase Agreement** | Executed | `/legal/founder-stock-repurchase.pdf` | Standard 4-yr vesting, 1-yr cliff |
| **Investor Rights Agreement (Template)** | Draft | `/legal/investor-rights-template.pdf` | For Series A investors |
| **Voting Agreement (Template)** | Draft | `/legal/voting-agreement-template.pdf` | Board seat & information rights |
| **Co-Sale Agreement (Template)** | Draft | `/legal/co-sale-template.pdf` | For minority shareholders |
| **Right of First Refusal (Template)** | Draft | `/legal/rofr-template.pdf` | Company drag-along rights |
| **Shareholder Communications** | Executed | `/legal/shareholder-communications/` | Meeting minutes, resolutions |

### 1.4 IP & Patents

| Document | Status | File Path | Notes |
|----------|--------|-----------|-------|
| **Trademark Applications** | Pending | `/legal/tm-applications/` | |
| | | | "ElSpa" - US & International |
| | | | "ElSpa Manager" - logo |
| **Copyright Registrations** | Executed | `/legal/copyright.pdf` | Source code, UI designs |
| **Trade Secret Documentation** | Executed | `/legal/trade-secrets.pdf` | Payroll algorithm, customer list |
| **IP Assignment - Founder** | Executed | `/legal/ip-assignment-founder.pdf` | All founder IP assigned to company |
| **IP Assignment - Employees** | Templates | `/legal/ip-assignment-template.pdf` | Executed at hire |
| **Third-Party License Audit** | In Progress | `/legal/license-audit.xlsx` | Open source & commercial licenses |
| | | | FastAPI (BSD) |
| | | | React (MIT) |
| | | | SQLAlchemy (MIT) |
| | | | Next.js (MIT) |
| | | | Tailwind CSS (MIT) |
| | | | Claude API (Proprietary - licensed) |

### 1.5 Material Contracts

| Document | Status | File Path | Notes |
|----------|--------|-----------|-------|
| **Customer Contracts** | Executed | `/legal/customer-contracts/` | 5 live customers |
| | | | Rosa's Spa (Manila) - signed 2026-02 |
| | | | Bloom Wellness (Cebu) - signed 2026-03 |
| | | | Thai Healing (Bangkok) - signed 2026-03 |
| | | | Singapore Serenity - signed 2026-04 |
| | | | LA Massage Collective - signed 2026-05 |
| **Terms of Service (SaaS)** | Executed | `/legal/terms-of-service.pdf` | Standard SaaS ToS |
| **Privacy Policy & GDPR** | Executed | `/legal/privacy-policy.pdf` | GDPR & CCPA compliant |
| **Data Processing Agreement** | Executed | `/legal/dpa.pdf` | For EU customers |
| **Cloud Services Agreement (Supabase)** | Executed | `/legal/supabase-dsa.pdf` | PostgreSQL hosting, SOC 2 Type II |
| **Payment Processor Agreement (Stripe)** | Executed | `/legal/stripe-agreement.pdf` | US & international payments |
| **Vendor Agreements** | Executed | `/legal/vendor-agreements/` | |
| | | | Twilio (SMS/WhatsApp) |
| | | | Sentry (error tracking) |
| | | | SendGrid (email) |
| **Employee Agreements** | Draft | `/legal/employee-agreements/` | |
| | | | Offer letters |
| | | | Non-disclosure agreements |
| | | | Non-compete agreements |
| | | | Proprietary information agreements |

### 1.6 Compliance & Insurance

| Document | Status | File Path | Notes |
|----------|--------|-----------|-------|
| **Business Insurance** | Active | `/legal/insurance/` | |
| | | | General liability: $2M coverage |
| | | | Cyber liability: $5M coverage (planned) |
| | | | Employment practices liability: $1M |
| **Insurance Policies** | Executed | `/legal/insurance/policies/` | Effective dates & renewal terms |
| **GDPR Compliance Document** | Executed | `/legal/gdpr-compliance.pdf` | Data processing, retention, rights |
| **CCPA Compliance Document** | Executed | `/legal/ccpa-compliance.pdf` | California privacy |
| **PCI DSS Compliance** | In Progress | `/legal/pci-compliance.pdf` | Payment card handling |
| **Data Residency Compliance** | Executed | `/legal/data-residency.pdf` | Data centers: US, SG, AU |
| **Tax Compliance Documentation** | Executed | `/legal/tax-compliance/` | |
| | | | EIN letter (US) |
| | | | Tax registration (Philippines) |
| | | | Foreign tax documents |
| **Legal Opinions** | Draft | `/legal/legal-opinions/` | |
| | | | IP ownership opinion |
| | | | Compliance opinion |

---

## 2. FINANCIAL DOCUMENTS

### 2.1 Historical Financials

| Document | Status | File Path | Notes |
|----------|--------|-----------|-------|
| **Income Statements (Monthly)** | Current | `/financials/p&l-monthly-2026.xlsx` | Jan-May 2026 actual |
| **Balance Sheet** | Current | `/financials/balance-sheet-2026.xlsx` | May 2026 snapshot |
| **Cash Flow Statement** | Current | `/financials/cash-flow-2026.xlsx` | Jan-May 2026, monthly |
| **GAAP-Compliant Reports** | In Progress | `/financials/gaap-reports/` | Q1 2026 (being prepared) |
| **Tax Returns** | Draft | `/financials/tax-returns/` | |
| | | | 2025 1040 (founder) |
| | | | 2025 corporate return (pending) |
| **Bank Statements** | Redacted | `/financials/bank-statements/` | Jan-May 2026 (redacted) |
| **Payroll Records** | Confidential | `/financials/payroll/` | Employee payroll, contractor payments |

### 2.2 Financial Projections

| Document | Status | File Path | Notes |
|----------|--------|-----------|-------|
| **3-Year Projections (Revenue)** | Current | `/financials/projections-3yr.xlsx` | Base case, upside, downside scenarios |
| **Annual Revenue Model** | Current | `/financials/revenue-model.xlsx` | |
| | | | Customer acquisition by tier |
| | | | Churn & expansion assumptions |
| | | | ARR & MRR forecasts |
| **Detailed P&L Projection** | Current | `/financials/pl-projection-3yr.xlsx` | |
| | | | Revenue, COGS, OpEx, margins |
| **Unit Economics Analysis** | Current | `/financials/unit-economics.xlsx` | |
| | | | CAC (customer acquisition cost) |
| | | | LTV (lifetime value) |
| | | | Payback period |
| | | | Churn analysis |
| **Cash Flow Projection** | Current | `/financials/cf-projection-3yr.xlsx` | |
| | | | Monthly cash position |
| | | | Burn rate & runway |
| | | | Working capital assumptions |
| **Break-Even Analysis** | Current | `/financials/breakeven-analysis.xlsx` | |
| | | | Fixed vs. variable costs |
| | | | Breakeven customer count |
| | | | Months to profitability |
| **Sensitivity Analysis** | Current | `/financials/sensitivity-analysis.xlsx` | |
| | | | Revenue sensitivity to churn, CAC, ACV |
| | | | Profitability under different scenarios |

### 2.3 Use of Funds

| Document | Status | File Path | Notes |
|----------|--------|-----------|-------|
| **Detailed Use of Funds** | Current | `/financials/use-of-funds.xlsx` | $2.5M allocation by category & timeline |
| **Hiring Plan & Salaries** | Current | `/financials/hiring-plan.xlsx` | |
| | | | Role, salary, start date, equity |
| | | | Year 1: 8 people |
| | | | Year 2: 25 people |
| | | | Year 3: 50+ people |
| **Marketing Budget & CAC** | Current | `/financials/marketing-budget.xlsx` | |
| | | | Channel breakdown |
| | | | Expected ROI by channel |
| **Infrastructure & Tech Budget** | Current | `/financials/infrastructure-budget.xlsx` | Cloud, security, tools |
| **Quarterly Spend Plan** | Current | `/financials/quarterly-spend.xlsx` | Q3 2026 - Q2 2027 detailed budget |

### 2.4 Fundraising History

| Document | Status | File Path | Notes |
|----------|--------|-----------|-------|
| **Seed Funding Summary** | Executed | `/financials/seed-funding-summary.xlsx` | Total raised to date: $1M |
| | | | Founder: $100K (personal funds) |
| | | | Angel 1: $500K (2025-Q3) |
| | | | Angel 2: $300K (2025-Q4) |
| | | | Angel 3: $200K (2026-Q1) |
| **SAFE Agreements** | Executed | `/legal/safe-*.pdf` | All 3 SAFEs, conversion terms |
| **Investor Communications** | Executed | `/financials/investor-comms/` | |
| | | | Monthly investor updates |
| | | | Quarterly performance reports |
| **Runway Analysis** | Current | `/financials/runway.xlsx` | |
| | | | Current cash: $2.1M |
| | | | Monthly burn: $50K (post-revenue) |
| | | | Runway: 9+ months |

---

## 3. MARKET & BUSINESS ANALYSIS

### 3.1 Market Research & TAM

| Document | Status | File Path | Notes |
|----------|--------|-----------|-------|
| **Total Addressable Market (TAM) Analysis** | Current | `/market/tam-analysis.xlsx` | Global spa market $180B |
| **Regional Market Data** | Current | `/market/regional-markets/` | |
| | | | Philippines ($1.8B market) |
| | | | Thailand ($1.2B market) |
| | | | Singapore ($800M market) |
| | | | North America ($18B market) |
| | | | Other regions |
| **Serviceable Market (SAM) Document** | Current | `/market/sam-analysis.xlsx` | Focus on small/medium spas (5-50 therapists) |
| **Serviceable Obtainable (SOM)** | Current | `/market/som-projections.xlsx` | Year 1-3 market share targets |
| **Market Growth Data** | Current | `/market/market-growth.pdf` | Industry CAGR: 7.5% globally |
| | | | | Regional growth rates |
| **Spa Industry Statistics** | Current | `/market/industry-stats.xlsx` | |
| | | | Total establishments: 2.1M |
| | | | Total therapists: 8.2M |
| | | | Average spa size: 12 therapists |
| | | | Therapist turnover: 35-40% annually |

### 3.2 Competitive Analysis

| Document | Status | File Path | Notes |
|----------|--------|-----------|-------|
| **Competitive Landscape Matrix** | Current | `/market/competitive-matrix.xlsx` | Features vs. price comparison |
| **Competitor Profiles** | Current | `/market/competitors/` | |
| | | | Mindbody (booking app) |
| | | | Acuity Scheduling |
| | | | Square (POS + emerging payroll) |
| | | | Guidepoint (EU payroll) |
| | | | QuickBooks (generic accounting) |
| | | | Payroll standalone tools |
| **Competitive Positioning** | Current | `/market/positioning.pdf` | ElSpa vs. competitors |
| **Differentiation Document** | Current | `/market/differentiation.pdf` | |
| | | | Vertical focus (spas only) |
| | | | AI-powered scheduling |
| | | | Multi-region compliance |
| | | | Integrated booking + payroll |
| **Win/Loss Analysis** | Preliminary | `/market/win-loss.xlsx` | Why customers choose ElSpa |
| **Barrier to Entry Analysis** | Current | `/market/barriers-to-entry.pdf` | AI moat, customer switching costs |

### 3.3 Customer & Demand Validation

| Document | Status | File Path | Notes |
|----------|--------|-----------|-------|
| **Customer Survey Data** | Current | `/market/customer-survey.xlsx` | 45 spa owners surveyed |
| | | | 89% interested in payroll automation |
| | | | 78% willing to pay $300-500/month |
| | | | 73% use 2-3 fragmented tools |
| **Interviews & Case Studies** | Executed | `/market/interviews/` | 12 in-depth spa owner interviews |
| **Beta User Feedback** | Current | `/market/beta-feedback.xlsx` | 5 live customers, detailed feedback |
| **NPS & Satisfaction Scores** | Current | `/market/nps-scores.xlsx` | NPS: 82, 4.8/5 star rating |
| **Customer Testimonials** | Executed | `/market/testimonials/` | |
| | | | Rosa's Spa |
| | | | Thai Healing |
| | | | LA Massage Collective |
| | | | Singapore Serenity |
| | | | Bloom Wellness |
| **Pricing Validation** | Current | `/market/pricing-validation.xlsx` | Willingness to pay analysis |
| **Demand Forecast** | Current | `/market/demand-forecast.xlsx` | Year 1-3 customer acquisition targets |

### 3.4 Go-to-Market Strategy

| Document | Status | File Path | Notes |
|----------|--------|-----------|-------|
| **GTM Strategy Document** | Current | `/market/gtm-strategy.pdf` | |
| | | | Phase 1: SE Asia dominance (2026) |
| | | | Phase 2: North America entry (2027) |
| | | | Phase 3: Global expansion (2028) |
| **Sales Strategy & Channels** | Current | `/market/sales-strategy.xlsx` | |
| | | | Direct sales (in-market reps) |
| | | | Partnerships (POS, booking apps) |
| | | | Associations (Spa alliances) |
| **Customer Acquisition Plan** | Current | `/market/customer-acquisition.xlsx` | CAC by channel, funnel metrics |
| **Marketing Plan** | Current | `/market/marketing-plan.xlsx` | Budget, channels, timeline |
| **Partnership Strategy** | Current | `/market/partnerships.pdf` | |
| | | | POS systems (Toast, Square) |
| | | | Booking platforms (Acuity, Setmore) |
| | | | Banks & fintech (Xendit, 2C2P) |
| | | | Associations (ASEAN Spa Alliance) |
| **Sales Collateral** | Executed | `/market/sales-collateral/` | One-pagers, case studies, ROI calculator |
| **PR & Press Strategy** | Current | `/market/pr-strategy.pdf` | Media targets, key messages |

---

## 4. PRODUCT & TECHNICAL

### 4.1 Product Documentation

| Document | Status | File Path | Notes |
|----------|--------|-----------|-------|
| **Product Overview** | Current | `/product/product-overview.pdf` | Features, user flows, value proposition |
| **Product Requirements Document (PRD)** | Current | `/product/prd.pdf` | Detailed product specifications |
| **User Stories & Requirements** | Current | `/product/user-stories.xlsx` | 100+ user stories for all personas |
| **Wireframes & Prototypes** | Executed | `/product/wireframes/` | Figma links, key user flows |
| **UI/UX Design System** | Executed | `/product/design-system/` | Tailwind CSS config, components |
| **Feature List & Roadmap** | Current | `/product/roadmap.pdf` | |
| | | | MVP features (complete) |
| | | | Phase 1 features (Q3-Q4 2026) |
| | | | Phase 2 features (Q1-Q2 2027) |
| **Demo Video & Screenshots** | Executed | `/product/demo/` | Screen recordings of key features |

### 4.2 Technical Architecture

| Document | Status | File Path | Notes |
|----------|--------|-----------|-------|
| **Technical Architecture Document** | Current | `/technical/architecture.pdf` | System design, data flows |
| **System Diagram** | Executed | `/technical/system-diagram.pdf` | Frontend, API, services, database |
| **Database Schema** | Current | `/technical/database-schema.sql` | Complete PostgreSQL schema |
| **API Documentation** | Current | `/technical/api-docs.pdf` | RESTful endpoints, request/response |
| **Code Repository** | Executed | `/technical/github-link.txt` | Private GitHub repo access (invited) |
| **Technology Stack Document** | Current | `/technical/tech-stack.md` | |
| | | | Frontend: Next.js, React, TypeScript |
| | | | Backend: FastAPI, SQLAlchemy, PostgreSQL |
| | | | Infrastructure: Cloudflare, Supabase, Vercel |
| | | | External: Claude API, Twilio, Stripe |
| **Development Environment Setup** | Executed | `/technical/dev-setup.md` | Local development instructions |
| **CI/CD Pipeline Documentation** | Current | `/technical/ci-cd.md` | GitHub Actions, deployment process |

### 4.3 Security & Compliance

| Document | Status | File Path | Notes |
|----------|--------|-----------|-------|
| **Security Architecture Document** | Current | `/security/security-architecture.pdf` | Encryption, authentication, authorization |
| **Data Security Policy** | Executed | `/security/data-security-policy.pdf` | Data protection, retention, deletion |
| **Access Control Policy** | Executed | `/security/access-control.pdf` | Role-based access, audit logs |
| **Incident Response Plan** | Executed | `/security/incident-response.pdf` | Breach procedures, notification timeline |
| **Vulnerability Disclosure Policy** | Executed | `/security/vulnerability-disclosure.pdf` | Responsible disclosure process |
| **SOC 2 Type II Audit** | In Progress | `/security/soc2-audit.pdf` | Planned Q3 2026, currently audit in process |
| **Security Assessment Report** | Current | `/security/security-assessment.pdf` | Third-party vulnerability scan results |
| **GDPR Compliance Document** | Executed | `/security/gdpr-compliance.pdf` | Data processing, user rights |
| **CCPA Compliance Document** | Executed | `/security/ccpa-compliance.pdf` | California privacy law |
| **Penetration Test Results** | Planned | `/security/pentest-results.pdf` | Third-party pentest (planned Q3) |
| **Data Backup & Recovery** | Executed | `/security/backup-recovery.pdf` | RTO/RPO, disaster recovery plan |

### 4.4 Infrastructure & DevOps

| Document | Status | File Path | Notes |
|----------|--------|-----------|-------|
| **Infrastructure Architecture** | Current | `/infrastructure/architecture.pdf` | Cloud providers, regions, scaling |
| **Deployment Guide** | Current | `/infrastructure/deployment.md` | Frontend (Cloudflare/Vercel), backend (Railway/Render) |
| **Monitoring & Logging Setup** | Current | `/infrastructure/monitoring.md` | Sentry, CloudWatch, custom dashboards |
| **Database Backup Strategy** | Executed | `/infrastructure/backup-strategy.pdf` | RTO/RPO, frequency, testing |
| **Uptime & Reliability SLA** | Current | `/infrastructure/sla.pdf` | 99.9% uptime commitment |
| **Load Testing Results** | Current | `/infrastructure/load-testing.pdf` | Stress tests, performance metrics |
| **Cost Analysis** | Current | `/infrastructure/cost-analysis.xlsx` | Monthly cloud spend, unit economics |

### 4.5 Quality Assurance

| Document | Status | File Path | Notes |
|----------|--------|-----------|-------|
| **QA Testing Strategy** | Current | `/qa/testing-strategy.pdf` | Unit, integration, E2E, performance testing |
| **Test Coverage Report** | Current | `/qa/test-coverage.xlsx` | Current: 82% code coverage |
| **E2E Test Suite** | Current | `/qa/e2e-tests/` | Cypress tests (78 test cases) |
| **Performance Testing Results** | Current | `/qa/performance-tests.xlsx` | Load times, API response times |
| **Bug Tracking & Resolution** | Current | `/qa/bug-tracking.xlsx` | Open/closed issues, severity breakdown |
| **Release Notes (All Versions)** | Executed | `/qa/release-notes/` | Major version changes, bug fixes |

---

## 5. CUSTOMER & REVENUE

### 5.1 Customer Contracts & Agreements

| Document | Status | File Path | Notes |
|----------|--------|-----------|-------|
| **Rosa's Spa Contract** | Executed | `/customers/rosas-spa/contract.pdf` | Signed 2026-02, $400/mo |
| **Bloom Wellness Contract** | Executed | `/customers/bloom-wellness/contract.pdf` | Signed 2026-03, $400/mo |
| **Thai Healing Contract** | Executed | `/customers/thai-healing/contract.pdf` | Signed 2026-03, $400/mo |
| **Singapore Serenity Contract** | Executed | `/customers/singapore-serenity/contract.pdf` | Signed 2026-04, $400/mo |
| **LA Massage Collective Contract** | Executed | `/customers/la-massage/contract.pdf` | Signed 2026-05, $400/mo |
| **Letter of Intent (unsigned)** | Executed | `/customers/loi/` | 8 additional spas, $2.2M ARR value |

### 5.2 Revenue & Metrics

| Document | Status | File Path | Notes |
|----------|--------|-----------|-------|
| **Monthly Revenue Summary** | Current | `/revenue/monthly-summary.xlsx` | Jan-May 2026, MRR $8K |
| **Customer Revenue Breakdown** | Current | `/revenue/customer-breakdown.xlsx` | Revenue by customer, tier, region |
| **Churn Analysis** | Current | `/revenue/churn-analysis.xlsx` | 0% churn YTD, cohort retention |
| **Expansion Revenue** | Current | `/revenue/expansion.xlsx` | Upsells, add-ons, pricing changes |
| **Payment & Collection Data** | Redacted | `/revenue/payments.xlsx` | Collection rates, outstanding invoices |
| **Customer Acquisition Cost (CAC)** | Current | `/revenue/cac-analysis.xlsx` | By channel, payback period |
| **Lifetime Value (LTV) Analysis** | Current | `/revenue/ltv-analysis.xlsx` | LTV by cohort, churn assumptions |
| **MRR & ARR Forecast** | Current | `/revenue/mrr-arr-forecast.xlsx` | Next 12 months projection |

### 5.3 Customer Success & References

| Document | Status | File Path | Notes |
|----------|--------|-----------|-------|
| **Customer Case Studies** | Executed | `/customers/case-studies/` | 5 live customers, ROI highlights |
| **Customer Testimonials** | Executed | `/customers/testimonials.pdf` | Quotes from all 5 customers |
| **Customer Reference List** | Executed | `/customers/reference-list.pdf` | Investor-approved references with contact info |
| **Customer Satisfaction Scores** | Current | `/customers/nps-surveys.xlsx` | NPS by customer, feedback |
| **Product Usage Analytics** | Current | `/customers/usage-analytics.xlsx` | Feature adoption, engagement metrics |
| **Onboarding & Training Records** | Executed | `/customers/onboarding/` | Implementation timeline, training attendance |
| **Support Ticket Analysis** | Current | `/customers/support-tickets.xlsx` | Response times, resolution rates |

---

## 6. TEAM & ORGANIZATION

### 6.1 Team Information

| Document | Status | File Path | Notes |
|----------|--------|-----------|-------|
| **Founding Team Bios** | Executed | `/team/founder-bios.pdf` | Kang Jichul (CEO) background & expertise |
| **Team Org Chart** | Current | `/team/org-chart.pdf` | Current 3 people, planned hires |
| **Current Employee List** | Confidential | `/team/employee-list.xlsx` | Names, roles, salaries, hire dates |
| **Employee Handbook** | Executed | `/team/employee-handbook.pdf` | Policies, benefits, code of conduct |
| **Compensation Summary** | Confidential | `/team/compensation.xlsx` | Base salary, bonus, equity breakdown |
| **Equity Grants** | Executed | `/team/equity-grants/` | Options for 3 early employees |

### 6.2 Planned Hires & Hiring Plan

| Document | Status | File Path | Notes |
|----------|--------|-----------|-------|
| **Hiring Plan (12 months)** | Current | `/team/hiring-plan.xlsx` | |
| | | | CTO (Q3 2026, $150K) |
| | | | Head of Sales (Q3 2026, $100K) |
| | | | 2 engineers (Q3-Q4 2026, $80K each) |
| | | | Account manager (Q4 2026, $60K) |
| | | | Other roles |
| **Job Descriptions** | Draft | `/team/job-descriptions/` | All planned roles with requirements |
| **Hiring Budget** | Current | `/team/hiring-budget.xlsx` | Total Y1 salary expense forecast |
| **Equity Plan (Option Pool)** | Draft | `/team/equity-plan.pdf` | New 10% option pool for future hires |

### 6.3 Board & Advisors

| Document | Status | File Path | Notes |
|----------|--------|-----------|-------|
| **Board Composition** | Current | `/team/board-composition.pdf` | Currently: founder only (CEO) |
| | | | Planned: add 2-3 independent directors at Series A |
| **Board Member Bios** | Draft | `/team/board-bios.pdf` | Advisor backgrounds & expertise |
| **Advisory Board List** | Executed | `/team/advisory-board.pdf` | |
| | | | Spa industry veteran |
| | | | Philippine labor lawyer |
| | | | SaaS operator (Stripe alum) |
| **Board Packages** | Executed | `/team/board-packages/` | Monthly board materials |
| **Board Meetings** | Scheduled | `/team/board-meetings.md` | Quarterly meetings (planned) |

### 6.4 Compliance & Legal

| Document | Status | File Path | Notes |
|----------|--------|-----------|-------|
| **Non-Disclosure Agreements** | Executed | `/team/nda.pdf` | Standard NDA for employees |
| **Confidentiality & IP Agreement** | Executed | `/team/confidentiality-ip.pdf` | Proprietary information protection |
| **Non-Compete Agreements** | Executed | `/team/non-compete.pdf` | Standard terms |
| **Employment Agreements** | Templates | `/team/employment-agreement-template.pdf` | Offer letter & employment terms |
| **Background Check Policy** | Executed | `/team/background-check-policy.pdf` | Screening procedures |

---

## 7. BOARD & GOVERNANCE

### 7.1 Board Documents

| Document | Status | File Path | Notes |
|----------|--------|-----------|-------|
| **Board Meeting Minutes** | Executed | `/board/minutes/` | |
| | | | Founder only currently |
| | | | Quarterly meetings (post-Series A) |
| **Board Resolutions** | Executed | `/board/resolutions/` | |
| | | | Series A authorization |
| | | | Equity plan approval |
| | | | Budget approval |
| **Board Calendar** | Current | `/board/calendar.pdf` | Quarterly meeting schedule |
| **Board Materials** | Executed | `/board/materials/` | Financials, metrics, updates |

### 7.2 Governance & Policies

| Document | Status | File Path | Notes |
|----------|--------|-----------|-------|
| **Code of Conduct** | Executed | `/governance/code-of-conduct.pdf` | Employee conduct standards |
| **Anti-Bribery & Anti-Corruption** | Executed | `/governance/anti-corruption.pdf` | FCPA compliance |
| **Anti-Money Laundering** | Executed | `/governance/aml-policy.pdf` | KYC/AML procedures |
| **Related Party Transaction Policy** | Executed | `/governance/related-party-policy.pdf` | Conflict of interest |
| **Document Retention Policy** | Executed | `/governance/document-retention.pdf` | Record keeping requirements |

---

## 8. DUE DILIGENCE CHECKLIST

### Pre-Series A VC Due Diligence Checklist

**Status: In Progress (Est. completion: 2026-06-30)**

#### Corporate & Legal (15 items)
- [x] Articles of incorporation & amendments
- [x] Certificate of good standing
- [x] By-laws & resolutions
- [x] Cap table & stock ledger
- [x] SAFE agreements
- [x] Shareholder agreements
- [x] IP assignment agreements
- [x] Trademark/copyright registrations
- [x] Trade secret documentation
- [x] Third-party license audit
- [x] Material contracts (customer, vendor)
- [x] Employment agreements (template)
- [x] Insurance policies
- [x] Privacy & compliance documentation
- [ ] Series A preferred stock documentation (pending close)

**Summary:** 14/15 complete. Final docs pending Series A close.

---

#### Financial (12 items)
- [x] Historical financials (Jan-May 2026)
- [x] Tax returns (2025, in progress)
- [x] Bank statements (Jan-May 2026, redacted)
- [x] Payroll records & tax filings
- [x] 3-year financial projections
- [x] Unit economics analysis
- [x] Use of funds breakdown
- [x] Customer contracts & payment terms
- [x] Revenue recognition documentation
- [x] Accounts receivable aging
- [x] VAT/GST compliance
- [ ] Audited financials (not required at Series A)

**Summary:** 11/12 complete. Will complete tax returns by close.

---

#### Product & Technology (10 items)
- [x] Product overview & demo
- [x] Technical architecture documentation
- [x] Database schema & infrastructure diagrams
- [x] Code repository access
- [x] API documentation
- [x] Technology stack documentation
- [x] Security architecture & policies
- [x] Testing & QA documentation
- [x] Performance & load testing results
- [x] Disaster recovery plan

**Summary:** 10/10 complete.

---

#### Market & Business (8 items)
- [x] TAM/SAM/SOM analysis
- [x] Competitive analysis & positioning
- [x] Market validation (surveys, interviews)
- [x] Customer testimonials & case studies
- [x] GTM strategy & sales plan
- [x] Marketing plan & budget
- [x] Partnership strategy
- [x] Regulatory landscape analysis

**Summary:** 8/8 complete.

---

#### Customer & Revenue (6 items)
- [x] Customer contracts (5 signed)
- [x] Letters of intent (8 unsigned, $2.2M ARR value)
- [x] Customer success metrics (NPS, retention)
- [x] Revenue analytics & forecasts
- [x] Customer acquisition cost analysis
- [x] Churn & retention data

**Summary:** 6/6 complete.

---

#### Team & Organization (8 items)
- [x] Founder bios & backgrounds
- [x] Key team member information
- [x] Employee list & compensation
- [x] Hiring plan & budget
- [x] Org chart & reporting structure
- [x] Board composition & advisors
- [x] Employee handbook
- [x] Non-disclosure & IP agreements

**Summary:** 8/8 complete.

---

#### Compliance & Governance (7 items)
- [x] Data privacy & GDPR compliance
- [x] Insurance coverage
- [x] Tax compliance documentation
- [x] Regulatory compliance (by region)
- [x] Code of conduct & governance policies
- [x] Related party transactions
- [ ] SOC 2 Type II audit (in progress, due Q3)

**Summary:** 6/7 complete. SOC 2 audit in process.

---

### Outstanding Items (Before Series A Close)

**Critical (Must complete):**
1. Series A Term Sheet signed
2. Preferred stock documentation finalized
3. Updated cap table post-Series A
4. Board resolutions authorizing Series A
5. Use of funds detailed schedule
6. 90-day plan (post-Series A priorities)

**Important (Should complete by close):**
1. Final tax returns for 2025
2. Q1 2026 audited financials (optional, will prepare if requested)
3. Bank confirmations
4. Customer reference calls (investor due diligence)
5. Technical architecture review (CTO candidate)

**Optional (Post-close):**
1. SOC 2 Type II audit (scheduled Q3 2026)
2. Penetration testing (scheduled Q3 2026)
3. Insurance policy enhancements (cyber liability)
4. Employee handbook updates

---

### Data Room Access & Administration

**Platform:** [SmartLocker / Intralinks / Citrix ShareFile - TBD]

**Access Management:**
- Single sign-on (SSO) with Okta
- Role-based permissions (investor, accountant, legal)
- Document upload/download tracking
- View-only mode for sensitive documents

**Document Naming Convention:**
```
[Category]/[Document Type]/[Document Name]_[YYYYMMDD]_[Version].pdf
Example: /legal/cap-table/cap-table_20260529_v2.xlsx
```

**Confidentiality & NDA:**
- All investors sign Master NDA before data room access
- Document watermarking on sensitive materials
- IP address tracking & audit logs
- Automatic document expiration (30 days post-series A)

**Contact & Escrow:**
- Data Room Manager: Kang Jichul (CEO)
- Email: kangjichul@hanmail.net
- Phone: [available upon request]
- Escrow Agent: [TBD at Series A stage]

---

**Document prepared:** 2026-05-29  
**Version:** Series A Data Room v1.0  
**Next update:** Upon Series A close
