# GLOBAL METRICS DASHBOARD
## Real-Time ElSpa Performance & Financial Metrics Across All Regions

**Document Version:** 1.0  
**Last Updated:** 2026-05-29  
**Owner:** CEO / Operations Director  
**Audience:** Executive Team, Regional Managers, Stakeholders  
**Update Frequency:** Real-time (automatic) | Daily summary (8 AM UTC)  

---

## Table of Contents
1. [Global Overview Dashboard](#global-overview-dashboard)
2. [Regional Financial Metrics](#regional-financial-metrics)
3. [Operational Performance Metrics](#operational-performance-metrics)
4. [Technical Health Metrics](#technical-health-metrics)
5. [Implementation Architecture](#implementation-architecture)

---

## Global Overview Dashboard

### 1.1 Global Revenue Metrics (Unified USD View)

**Purpose:** Single pane of glass for global financial health  
**Update Frequency:** Real-time (hourly consolidation)  
**Currency:** All metrics converted to USD at current rates

```
┌─────────────────────────────────────────────────────────┐
│                 GLOBAL REVENUE OVERVIEW                  │
├─────────────────────────────────────────────────────────┤
│ Total MRR (All Regions Combined)          $XX,XXX USD   │
│ Total ARR (Annual Run Rate)               $XXX,XXX USD  │
│ YoY Growth Rate                           +XX.X%        │
│ Month-over-Month Growth                   +X.X%         │
│ Revenue Per Customer (Avg)                $XXX USD      │
├─────────────────────────────────────────────────────────┤
│ Regional Breakdown (USD Converted):                     │
│  └─ Korea (₩)                             $XX,XXX USD   │
│  └─ Philippines (₱)                       $X,XXX USD    │
│  └─ Thailand (฿)                          $X,XXX USD    │
│  └─ Vietnam (₫)                           $X,XXX USD    │
│  └─ Indonesia (Rp)                        $X,XXX USD    │
└─────────────────────────────────────────────────────────┘
```

**Formula for MRR Consolidation:**
```
Global MRR = Σ (Region_MRR × Exchange_Rate)

Where:
- Region_MRR = Sum of active subscription charges for month
- Exchange_Rate = Latest daily rate (updated 8 AM UTC)
- Active_Subscription = Status = 'active' AND Churn_Date = NULL
```

**Dashboard Components:**
| Metric | Current | Prev Month | YoY | Trend | Target |
|--------|---------|-----------|-----|-------|--------|
| Global MRR | $45,250 | $43,100 | +28% | ↑ | $50K |
| Global ARR | $543,000 | $517,200 | +28% | ↑ | $600K |
| Active Customers | 1,245 | 1,198 | +45% | ↑ | 1,500 |
| ARPU (USD) | $36.35 | $35.98 | +3% | ↑ | $40 |
| CAC Recovery | 4.2mo | 4.3mo | -2% | ↑ | <4mo |

---

### 1.2 Global Customer Acquisition & Churn

**Purpose:** Track top-of-funnel health and retention efficiency

```
┌─────────────────────────────────────────────────────────┐
│            CUSTOMER ACQUISITION & RETENTION              │
├─────────────────────────────────────────────────────────┤
│ New Customers This Month                  +48 customers │
│ Churned Customers This Month              -12 customers │
│ Net Addition (Monthly)                    +36 customers │
│ Churn Rate (Monthly)                      2.3%          │
│ Churn Rate (Annual Run Rate)              24.6%         │
│ Customer Lifetime Value (LTV)             $892 USD      │
│ Customer Acquisition Cost (CAC)           $214 USD      │
│ LTV:CAC Ratio                             4.2:1         │
├─────────────────────────────────────────────────────────┤
│ Regional Churn Rates:                                   │
│  └─ Korea                                 1.8%          │
│  └─ Philippines                           2.1%          │
│  └─ Thailand                              2.5%          │
│  └─ Vietnam                               3.2%          │
│  └─ Indonesia                             3.8%          │
└─────────────────────────────────────────────────────────┘
```

**Customer Cohort Analysis:**
| Cohort | Size | Retention (1mo) | Retention (3mo) | Retention (6mo) | LTV |
|--------|------|-----------------|-----------------|-----------------|-----|
| Jan 2026 | 98 | 94.2% | 78.5% | 62.3% | $1,043 |
| Feb 2026 | 112 | 93.8% | 81.2% | - | $987 |
| Mar 2026 | 87 | 96.5% | 85.3% | - | $945 |
| Apr 2026 | 124 | 95.1% | - | - | $923 |
| May 2026 | 127 | 94.7% | - | - | $898 |

**Formulas:**
```
Monthly Churn Rate = Churned_Customers / Start_of_Month_Customers
ARR Churn Rate = Monthly_Churn_Rate × 12

LTV = ARPU × (1 / Churn_Rate) × Gross_Margin
CAC = Total_Sales_Marketing_Cost / New_Customers_Acquired

LTV:CAC Ratio = LTV / CAC (Target: >3:1, Healthy: >4:1)
```

---

### 1.3 Global Profitability & Growth Metrics

**Purpose:** Measure business sustainability and unit economics

```
┌─────────────────────────────────────────────────────────┐
│           PROFITABILITY & UNIT ECONOMICS                 │
├─────────────────────────────────────────────────────────┤
│ Gross Margin                              58%           │
│ Operating Margin                          -8%           │
│ EBITDA Margin                             -2%           │
│ CAC Payback Period                        3.8 months    │
│ Revenue per Employee (Monthly)            $2,840 USD    │
│ Rule of 40 Score                          48            │
│                                                          │
│ Profitability Timeline:                                 │
│  └─ Q2 2026 Projection                    Breakeven     │
│  └─ Q3 2026 Projection                    +3% margin    │
│  └─ Q4 2026 Projection                    +8% margin    │
└─────────────────────────────────────────────────────────┘
```

**Financial Health Dashboard:**
| Region | MRR | Gross Margin | Burn Rate | Months Runway | Breakeven |
|--------|-----|--------------|-----------|---------------|-----------|
| Korea | $28,500 | 62% | -$800 | 24+ | Q3 2026 |
| Philippines | $9,200 | 52% | -$400 | 18+ | Q4 2026 |
| Thailand | $4,100 | 48% | -$200 | 16+ | Q1 2027 |
| Vietnam | $2,150 | 45% | -$100 | 14+ | Q2 2027 |
| Indonesia | $1,300 | 40% | -$50 | 12+ | Q3 2027 |

**Growth Metrics:**
```
Monthly Growth Rate = (Current_Month_MRR - Previous_Month_MRR) / Previous_Month_MRR
YoY Growth Rate = (Current_YTD_MRR - Previous_Year_YTD_MRR) / Previous_Year_YTD_MRR

Rule of 40 = YoY Growth Rate (%) + EBITDA Margin (%)
Score >40 = Healthy balance of growth & profitability
```

**Revenue Diversification:**
| Stream | % of Revenue | Growth (YoY) | Health |
|--------|--------------|--------------|--------|
| Subscription (Core) | 70% | +28% | ✅ |
| Premium Services | 18% | +45% | ✅ |
| One-time Services | 8% | -5% | ⚠️ |
| Partnerships | 4% | +120% | ✅ |

---

## Regional Financial Metrics

### 2.1 Korea Region (Primary Market)

**Currency:** Korean Won (₩)  
**Exchange Rate:** 1 USD = ₩1,310 (updated daily)  
**Market Size:** ~52 million | Penetration: 0.08%

```
┌─────────────────────────────────────────────────────────┐
│           KOREA REGION - FINANCIAL SNAPSHOT              │
├─────────────────────────────────────────────────────────┤
│ MRR (Local)                               ₩37,351,000   │
│ MRR (USD Equivalent)                      $28,500 USD   │
│ ARR (USD Equivalent)                      $342,000 USD  │
│ Monthly Revenue Growth                    +3.2%         │
│ YoY Revenue Growth                        +32%          │
│ Active Customers                          680           │
│ New Customers (This Month)                28            │
│ Churned Customers (This Month)            8             │
│ Average Revenue Per User (ARPU)           ₩54,926       │
│                                           ($41.9 USD)   │
│ Gross Margin                              62%           │
│ Customer Lifetime Value (LTV)             $1,256 USD    │
│ Customer Acquisition Cost (CAC)           $247 USD      │
│ Payback Period                            3.1 months    │
└─────────────────────────────────────────────────────────┘
```

**Regional Strengths & Risks:**
| Factor | Status | Details |
|--------|--------|---------|
| Market Penetration | ✅ Strong | Largest % of user base |
| Revenue Stability | ✅ Strong | 62% gross margin |
| Growth Rate | ✅ Strong | +32% YoY |
| CAC Recovery | ✅ Healthy | 3.1 month payback |
| Churn Rate | ⚠️ Watch | 1.8% monthly (highest in Korea) |

**Korea Cohort Metrics (Monthly):**
| Cohort | Users | M1 Retention | M3 Retention | M6 Retention | Avg LTV |
|--------|-------|--------------|--------------|--------------|---------|
| Jan 26 | 58 | 95% | 82% | 68% | $1,384 |
| Feb 26 | 67 | 93% | 84% | - | $1,298 |
| Mar 26 | 52 | 96% | 87% | - | $1,245 |
| Apr 26 | 71 | 94% | - | - | $1,187 |
| May 26 | 74 | 95% | - | - | $1,142 |

---

### 2.2 Philippines Region

**Currency:** Philippine Peso (₱)  
**Exchange Rate:** 1 USD = ₱58.50 (updated daily)  
**Market Size:** ~115 million | Penetration: 0.03%

```
┌─────────────────────────────────────────────────────────┐
│      PHILIPPINES REGION - FINANCIAL SNAPSHOT             │
├─────────────────────────────────────────────────────────┤
│ MRR (Local)                               ₱537,700      │
│ MRR (USD Equivalent)                      $9,200 USD    │
│ ARR (USD Equivalent)                      $110,400 USD  │
│ Monthly Revenue Growth                    +2.1%         │
│ YoY Revenue Growth                        +18%          │
│ Active Customers                          245           │
│ New Customers (This Month)                12            │
│ Churned Customers (This Month)            3             │
│ Average Revenue Per User (ARPU)           ₱2,196        │
│                                           ($37.5 USD)   │
│ Gross Margin                              52%           │
│ Customer Lifetime Value (LTV)             $847 USD      │
│ Customer Acquisition Cost (CAC)           $195 USD      │
│ Payback Period                            3.8 months    │
└─────────────────────────────────────────────────────────┘
```

**High-Growth Opportunity:** PH market shows strong engagement with lower CAC. Recommended investment in local marketing to accelerate from 0.03% to 0.15% penetration.

---

### 2.3 Thailand Region

**Currency:** Thai Baht (฿)  
**Exchange Rate:** 1 USD = ฿35.40 (updated daily)  
**Market Size:** ~72 million | Penetration: 0.02%

```
┌─────────────────────────────────────────────────────────┐
│        THAILAND REGION - FINANCIAL SNAPSHOT              │
├─────────────────────────────────────────────────────────┤
│ MRR (Local)                               ฿145,176      │
│ MRR (USD Equivalent)                      $4,100 USD    │
│ ARR (USD Equivalent)                      $49,200 USD   │
│ Monthly Revenue Growth                    +1.8%         │
│ YoY Revenue Growth                        +24%          │
│ Active Customers                          128           │
│ New Customers (This Month)                5             │
│ Churned Customers (This Month)            2             │
│ Average Revenue Per User (ARPU)           ฿1,135        │
│                                           ($32.1 USD)   │
│ Gross Margin                              48%           │
│ Customer Lifetime Value (LTV)             $623 USD      │
│ Customer Acquisition Cost (CAC)           $189 USD      │
│ Payback Period                            4.1 months    │
└─────────────────────────────────────────────────────────┘
```

**Strategic Note:** Thailand shows promising growth but lower margins. Recommend operational efficiency improvements and localized premium service offerings.

---

### 2.4 Vietnam Region

**Currency:** Vietnamese Dong (₫)  
**Exchange Rate:** 1 USD = ₫24,500 (updated daily)  
**Market Size:** ~98 million | Penetration: 0.01%

```
┌─────────────────────────────────────────────────────────┐
│         VIETNAM REGION - FINANCIAL SNAPSHOT              │
├─────────────────────────────────────────────────────────┤
│ MRR (Local)                               ₫52,675,000   │
│ MRR (USD Equivalent)                      $2,150 USD    │
│ ARR (USD Equivalent)                      $25,800 USD   │
│ Monthly Revenue Growth                    +0.9%         │
│ YoY Revenue Growth                        +14%          │
│ Active Customers                          87            │
│ New Customers (This Month)                3             │
│ Churned Customers (This Month)            2             │
│ Average Revenue Per User (ARPU)           ₫605,000      │
│                                           ($24.7 USD)   │
│ Gross Margin                              45%           │
│ Customer Lifetime Value (LTV)             $421 USD      │
│ Customer Acquisition Cost (CAC)           $172 USD      │
│ Payback Period                            4.6 months    │
└─────────────────────────────────────────────────────────┘
```

**Action Items:** VN market is early-stage. Focus on product-market fit validation before major marketing spend. CAC is reasonable for early adoption phase.

---

### 2.5 Indonesia Region

**Currency:** Indonesian Rupiah (Rp)  
**Exchange Rate:** 1 USD = Rp15,850 (updated daily)  
**Market Size:** ~275 million | Penetration: <0.01%

```
┌─────────────────────────────────────────────────────────┐
│       INDONESIA REGION - FINANCIAL SNAPSHOT              │
├─────────────────────────────────────────────────────────┤
│ MRR (Local)                               Rp20,605,000  │
│ MRR (USD Equivalent)                      $1,300 USD    │
│ ARR (USD Equivalent)                      $15,600 USD   │
│ Monthly Revenue Growth                    +0.5%         │
│ YoY Revenue Growth                        +8%           │
│ Active Customers                          105           │
│ New Customers (This Month)                2             │
│ Churned Customers (This Month)            3             │
│ Average Revenue Per User (ARPU)           Rp196,238     │
│                                           ($12.4 USD)   │
│ Gross Margin                              40%           │
│ Customer Lifetime Value (LTV)             $298 USD      │
│ Customer Acquisition Cost (CAC)           $145 USD      │
│ Payback Period                            5.8 months    │
└─────────────────────────────────────────────────────────┘
```

**Risk Assessment:** Indonesia shows lowest margins and longest payback. Investigate pricing strategy and service delivery cost structure. Consider localized offerings to improve unit economics.

---

## Operational Performance Metrics

### 3.1 Sales Pipeline by Region

**Purpose:** Forecast revenue 30/60/90 days out

```
Global Sales Pipeline (USD Value):
┌──────────────────────────────────────┬─────────┬────────┐
│ Stage                                │ Pipeline│ Conv % │
├──────────────────────────────────────┼─────────┼────────┤
│ Leads (Qualified)                    │ $28,500 │ 15%    │
│ Opportunities (Proposals Sent)       │ $18,200 │ 35%    │
│ Negotiations (Final Stage)           │ $9,800  │ 65%    │
│ Expected Close (This Month)          │ $6,371  │ 100%   │
│ Expected Close (Next 30 Days)        │ $12,400 │ 100%   │
│ Expected Close (90 Days)             │ $28,920 │ 100%   │
│ Total Pipeline                       │ $104,291│        │
└──────────────────────────────────────┴─────────┴────────┘

Pipeline by Region:
┌────────────────┬──────────┬────────┬──────────┐
│ Region         │ Pipeline │ Conv % │ 30-day   │
├────────────────┼──────────┼────────┼──────────┤
│ Korea          │ $62,000  │ 28%    │ $17,360  │
│ Philippines    │ $24,300  │ 22%    │ $5,346   │
│ Thailand       │ $12,100  │ 18%    │ $2,178   │
│ Vietnam        │ $4,200   │ 12%    │ $504     │
│ Indonesia      │ $1,691   │ 8%     │ $135     │
└────────────────┴──────────┴────────┴──────────┘
```

**Formulas:**
```
Pipeline_Value = Sum of all open deals
Conversion_Rate = Historical close rate for stage
Expected_Revenue = Pipeline_Value × Conversion_Rate

Sales_Efficiency = New_Revenue / Sales_Marketing_Cost
Target: >3:1 (For every $1 spent, generate $3+ revenue)
```

---

### 3.2 Marketing CAC by Channel & Region

**Purpose:** Optimize marketing spend allocation

```
Global CAC by Marketing Channel:
┌─────────────────────────┬────────┬─────────┬──────────┐
│ Channel                 │ CAC    │ Quality │ ROI (6mo)│
├─────────────────────────┼────────┼─────────┼──────────┤
│ Organic Search (SEO)    │ $62    │ ⭐⭐⭐⭐⭐│ 12.8x    │
│ Referral Program        │ $84    │ ⭐⭐⭐⭐  │ 9.5x     │
│ Paid Search (SEM)       │ $128   │ ⭐⭐⭐⭐  │ 6.8x     │
│ Social Media Ads        │ $145   │ ⭐⭐⭐   │ 5.2x     │
│ Content Marketing       │ $98    │ ⭐⭐⭐⭐  │ 8.1x     │
│ Partner Program         │ $156   │ ⭐⭐⭐   │ 4.5x     │
│ Email Marketing         │ $41    │ ⭐⭐⭐⭐⭐│ 15.3x    │
│ Influencer Marketing    │ $187   │ ⭐⭐    │ 3.2x     │
│ Events & Sponsorships   │ $234   │ ⭐⭐    │ 2.1x     │
│ WEIGHTED AVERAGE CAC    │ $114   │ ⭐⭐⭐⭐  │ 7.1x     │
└─────────────────────────┴────────┴─────────┴──────────┘

CAC by Region (Marketing Mix):
┌────────────────┬────────┬────────┬────────┬────────┬──────┐
│ Region         │ Organic│ Paid   │ Social │ Partner│ Avg  │
├────────────────┼────────┼────────┼────────┼────────┼──────┤
│ Korea          │ $58    │ $120   │ $138   │ $145   │ $115 │
│ Philippines    │ $71    │ $142   │ $156   │ $178   │ $137 │
│ Thailand       │ $76    │ $155   │ $168   │ $195   │ $149 │
│ Vietnam        │ $82    │ $168   │ $184   │ $215   │ $162 │
│ Indonesia      │ $89    │ $182   │ $198   │ $235   │ $176 │
└────────────────┴────────┴────────┴────────┴────────┴──────┘
```

**Channel Recommendations:**
- **Increase Budget:** Organic & Email (highest ROI, scalable)
- **Maintain:** Paid Search, Referral (stable CAC)
- **Evaluate:** Influencer & Events (lowest ROI)
- **Experiment:** Underutilized channels with regional tailoring

---

### 3.3 Customer Acquisition Rate by Region

**Purpose:** Track growth velocity in each market

```
Monthly Customer Acquisition (Last 6 Months):
┌─────────┬───────┬───────┬───────┬───────┬───────┬───────┐
│ Region  │ Dec25 │ Jan26 │ Feb26 │ Mar26 │ Apr26 │ May26 │
├─────────┼───────┼───────┼───────┼───────┼───────┼───────┤
│ Korea   │ 24    │ 28    │ 31    │ 27    │ 35    │ 28    │
│ PH      │ 8     │ 10    │ 11    │ 9     │ 13    │ 12    │
│ TH      │ 3     │ 4     │ 5     │ 4     │ 6     │ 5     │
│ VN      │ 1     │ 2     │ 2     │ 2     │ 3     │ 3     │
│ ID      │ 1     │ 2     │ 2     │ 1     │ 2     │ 2     │
├─────────┼───────┼───────┼───────┼───────┼───────┼───────┤
│ GLOBAL  │ 37    │ 46    │ 51    │ 43    │ 59    │ 50    │
└─────────┴───────┴───────┴───────┴───────┴───────┴───────┘

Regional Growth Rates:
┌────────────────┬──────────────┬──────────┬──────────┐
│ Region         │ Avg/Month    │ Growth % │ Forecast │
├────────────────┼──────────────┼──────────┼──────────┤
│ Korea          │ 29           │ +2.8%    │ 35/mo    │
│ Philippines    │ 11           │ +5.2%    │ 14/mo    │
│ Thailand       │ 4            │ +4.1%    │ 5/mo     │
│ Vietnam        │ 2            │ +3.5%    │ 3/mo     │
│ Indonesia      │ 2            │ +0.5%    │ 2/mo     │
│ GLOBAL         │ 48           │ +3.2%    │ 59/mo    │
└────────────────┴──────────────┴──────────┴──────────┘
```

**Target:** 80+ customers/month by end of 2026 (65% growth)

---

### 3.4 Regional NPS & Customer Satisfaction

**Purpose:** Track product-market fit and customer happiness

```
Net Promoter Score (NPS) by Region:
┌─────────────────┬───────┬─────────┬──────────┐
│ Region          │ NPS   │ Trend   │ Category │
├─────────────────┼───────┼─────────┼──────────┤
│ Korea           │ 52    │ ↑ +3    │ Excellent│
│ Philippines     │ 48    │ ↑ +2    │ Good     │
│ Thailand        │ 42    │ → 0     │ Good     │
│ Vietnam         │ 38    │ ↓ -2    │ Fair     │
│ Indonesia       │ 32    │ ↓ -4    │ Fair     │
│ GLOBAL AVERAGE  │ 46    │ ↑ +1    │ Good     │
└─────────────────┴───────┴─────────┴──────────┘

NPS Interpretation:
- Score 50+: World-class (Promoters >> Detractors)
- Score 40-49: Good (healthy growth potential)
- Score 30-39: Fair (improvement needed)
- Score <30: Poor (at-risk segment)

Customer Satisfaction Metrics:
┌──────────────────────────┬────────┬────────┬────────┐
│ Metric                   │ Target │ Actual │ Status │
├──────────────────────────┼────────┼────────┼────────┤
│ Product Quality (1-10)   │ 8.5    │ 8.2    │ ✅     │
│ Ease of Use (1-10)       │ 8.5    │ 7.8    │ ⚠️     │
│ Customer Support (1-10)  │ 9.0    │ 8.4    │ ✅     │
│ Price/Value (1-10)       │ 7.5    │ 7.6    │ ✅     │
│ CSAT Overall (%)         │ 92     │ 88.3%  │ ⚠️     │
└──────────────────────────┴────────┴────────┴────────┘
```

**Action Items:**
- Korea: Maintain excellence, upsell to premium tiers
- Philippines: Build on positive momentum
- Thailand/Vietnam: Improve UX and support
- Indonesia: Address satisfaction gaps with localization

---

### 3.5 Support Ticket Metrics

**Purpose:** Measure customer health and support efficiency

```
Support Ticket Volume & Resolution:
┌─────────────────┬─────────┬──────────┬──────────┐
│ Region          │ Tickets │ Avg Time │ % Closed │
├─────────────────┼─────────┼──────────┼──────────┤
│ Korea           │ 284     │ 18 hours │ 96%      │
│ Philippines     │ 95      │ 24 hours │ 94%      │
│ Thailand        │ 48      │ 28 hours │ 92%      │
│ Vietnam         │ 32      │ 36 hours │ 89%      │
│ Indonesia       │ 28      │ 42 hours │ 85%      │
│ GLOBAL          │ 487     │ 24 hours │ 93.2%    │
└─────────────────┴─────────┴──────────┴──────────┘

Support Ticket Category Breakdown:
┌──────────────────────────┬───────┬────────┐
│ Category                 │ Count │ % Fix  │
├──────────────────────────┼───────┼────────┤
│ Account/Billing Issues   │ 145   │ 98%    │
│ Feature Requests         │ 132   │ 40%    │
│ Technical Support        │ 118   │ 94%    │
│ Data/Privacy Questions   │ 62    │ 100%   │
│ Performance Issues       │ 30    │ 87%    │
└──────────────────────────┴───────┴────────┘
```

---

## Technical Health Metrics

### 4.1 API Uptime & Availability (by Region)

**Purpose:** SLA compliance and infrastructure health

```
Monthly Uptime Report (Target: 99.9%):
┌─────────────────┬────────────┬──────────┬────────┐
│ Region/Endpoint │ Uptime     │ Downtime │ SLA    │
├─────────────────┼────────────┼──────────┼────────┤
│ Korea (Primary) │ 99.94%     │ 52 min   │ ✅ Met │
│ Philippines     │ 99.87%     │ 187 min  │ ⚠️     │
│ Thailand        │ 99.82%     │ 259 min  │ ⚠️     │
│ Vietnam         │ 99.76%     │ 346 min  │ ❌     │
│ Indonesia       │ 99.69%     │ 447 min  │ ❌     │
│ Global Average  │ 99.82%     │ 1,291 min│ ⚠️     │
└─────────────────┴────────────┴──────────┴────────┘

Incident Log (Last 30 Days):
┌────────────────┬──────────────┬────────┬──────────┐
│ Date           │ Region       │ Impact │ Duration │
├────────────────┼──────────────┼────────┼──────────┤
│ May 24, 14:32  │ Philippines  │ API    │ 23 min   │
│ May 18, 08:15  │ Vietnam      │ DB     │ 47 min   │
│ May 12, 22:44  │ Global       │ Auth   │ 14 min   │
│ May 08, 11:23  │ Indonesia    │ API    │ 32 min   │
└────────────────┴──────────────┴────────┴──────────┘
```

---

### 4.2 Response Time by Endpoint

**Purpose:** Monitor performance and user experience

```
Average Response Times (Milliseconds):
┌────────────────────────────────┬────────┬─────────┬──────────┐
│ Endpoint                       │ P50    │ P95     │ P99      │
├────────────────────────────────┼────────┼─────────┼──────────┤
│ GET /api/users/{id}            │ 45ms   │ 120ms   │ 250ms    │
│ POST /api/appointments         │ 180ms  │ 450ms   │ 980ms    │
│ GET /api/therapists?region=PH  │ 72ms   │ 185ms   │ 420ms    │
│ POST /api/payments             │ 850ms  │ 1,200ms │ 2,100ms  │
│ GET /api/analytics/dashboard   │ 320ms  │ 780ms   │ 1,500ms  │
│ GET /api/locations/realtime    │ 95ms   │ 210ms   │ 450ms    │
│ POST /api/therapist/checkin    │ 420ms  │ 890ms   │ 1,800ms  │
└────────────────────────────────┴────────┴─────────┴──────────┘

Response Time SLA:
┌──────────────────────────┬──────────┬──────────┐
│ Endpoint Category        │ Target   │ Actual   │
├──────────────────────────┼──────────┼──────────┤
│ User-facing (P95)        │ <500ms   │ 425ms ✅ │
│ Background Jobs (P99)    │ <2000ms  │ 1,850ms ✅│
│ Real-time (P50)          │ <150ms   │ 138ms ✅ │
└──────────────────────────┴──────────┴──────────┘
```

---

### 4.3 Error Rate Monitoring

**Purpose:** Detect and resolve issues proactively

```
Error Rate by Region (Percentage of Requests):
┌─────────────────┬────────┬──────────┬───────────┐
│ Region          │ 4xx    │ 5xx      │ Total     │
├─────────────────┼────────┼──────────┼───────────┤
│ Korea           │ 0.23%  │ 0.08%    │ 0.31%     │
│ Philippines     │ 0.34%  │ 0.15%    │ 0.49%     │
│ Thailand        │ 0.41%  │ 0.19%    │ 0.60%     │
│ Vietnam         │ 0.58%  │ 0.28%    │ 0.86%     │
│ Indonesia       │ 0.72%  │ 0.35%    │ 1.07%     │
│ GLOBAL          │ 0.46%  │ 0.17%    │ 0.63%     │
└─────────────────┴────────┴──────────┴───────────┘

Top Error Types (Last 7 Days):
┌──────────────────────────────┬──────┬─────────┐
│ Error Type                   │ Code │ Count   │
├──────────────────────────────┼──────┼─────────┤
│ Validation Error             │ 400  │ 2,148   │
│ Unauthorized/Expired Token   │ 401  │ 1,023   │
│ Permission Denied            │ 403  │ 567     │
│ Not Found                    │ 404  │ 892     │
│ Internal Server Error        │ 500  │ 234     │
│ Service Unavailable          │ 503  │ 87      │
│ Database Connection Timeout  │ 504  │ 45      │
└──────────────────────────────┴──────┴─────────┘
```

---

### 4.4 Data Processing Latency

**Purpose:** Monitor batch jobs and data pipelines

```
Data Pipeline Performance:
┌──────────────────────────────┬────────┬──────────┐
│ Job Name                     │ Target │ Actual   │
├──────────────────────────────┼────────┼──────────┤
│ Hourly Analytics Aggregation │ <5min  │ 2.3 min  │
│ Daily Payroll Calculation    │ <30min │ 18.2 min │
│ Weekly Report Generation     │ <60min │ 42.1 min │
│ Monthly Finance Close        │ <120min│ 87.5 min │
│ Real-time Location Updates   │ <100ms │ 78 ms    │
│ Nightly Data Backup          │ <45min │ 31.2 min │
└──────────────────────────────┴────────┴──────────┘

Processing Throughput:
┌──────────────────────────┬──────────────┬──────┐
│ Data Type                │ Records/hour │ Lag  │
├──────────────────────────┼──────────────┼──────┤
│ Location Updates         │ 52,000       │ 78ms │
│ Transaction Logs         │ 8,500        │ 1.2s │
│ Analytics Events         │ 125,000      │ 2.3s │
│ User Profile Changes     │ 240          │ 45ms │
└──────────────────────────┴──────────────┴──────┘
```

---

## Implementation Architecture

### 5.1 Data Collection & Aggregation

**Real-Time Data Sources:**
- PostgreSQL (transactional data)
- WebSocket streams (location tracking)
- API logs (Cloudflare Workers / API Gateway)
- Application events (client-side tracking)

**Aggregation Layer:**
```
Raw Data → ETL Pipeline → Data Warehouse → Dashboard
         ↓
    Real-time Kafka Topics (location, transactions)
    ↓
    Batch Jobs (hourly, daily, monthly)
    ↓
    Aggregated Metrics Table
```

**Update Frequency:**
- Real-time metrics: Every 5-10 seconds
- Hourly metrics: Top of each hour + 5 min
- Daily metrics: 8 AM UTC
- Weekly/Monthly: Scheduled jobs

---

### 5.2 Dashboard Implementation Options

**Option A: Google Sheets (Free, Collaborative)**
- Use Google Sheets API to auto-update metrics
- Create pivot tables for regional views
- Shared with all stakeholders
- Pros: Cheap, familiar, easy to customize
- Cons: Limited real-time, manual refresh

**Option B: Tableau/Looker (Enterprise)**
- Connect directly to data warehouse
- Interactive dashboards with drill-down
- Automated alerts and distribution
- Pros: Professional, scalable, real-time
- Cons: Cost ($70-150/user/month)

**Option C: Custom Dashboard (Next.js)**
- Build custom React dashboard
- Real-time updates via WebSocket
- Fully branded and customizable
- Pros: Full control, cost-effective at scale
- Cons: Development time required

**Recommended:** Start with Option A (Sheets), graduate to Option C (Custom) by Q4 2026.

---

### 5.3 Daily/Weekly Reporting Cadence

**Daily 8 AM UTC Update:**
1. Calculate global MRR from previous day
2. Update customer acquisition/churn numbers
3. Check API uptime (24-hour rolling)
4. Verify no critical incidents
5. Send Slack summary to #operations

**Weekly Monday 9 AM UTC Review:**
1. Full regional breakdown (all 5 countries)
2. Sales pipeline update
3. Customer satisfaction trends
4. Technical incident review
5. Action items for next week

**Monthly (1st of month, 10 AM UTC):**
1. Complete financial close
2. Cohort analysis refresh
3. Budget vs. actuals review
4. Quarterly forecast update
5. Board-level summary generation

---

### 5.4 Critical Thresholds & Alerts

**Automatic Alerts (Dashboard → Slack #alerts):**

| Metric | Alert Threshold | Action |
|--------|-----------------|--------|
| Hourly Revenue | <$1,500 USD | Investigate anomaly |
| Customer Churn | >5% monthly | Review retention strategy |
| API Uptime | <99.5% | Page on-call engineer |
| Response Time | P95 >1 second | Page backend lead |
| Error Rate | >1.5% requests | Escalate to ops |
| PaymentAPI | Any 5xx errors | Immediate investigation |
| Database | CPU >80% for 5 min | Scale resources |

---

**Document Complete**

**Next Steps:**
1. Implement in Google Sheets template
2. Set up automated daily metrics job
3. Create Slack integration for alerts
4. Distribute to executive team
5. Collect feedback for Q2 refinement

---

*For questions or implementation support, contact: operations@elspa.io*
