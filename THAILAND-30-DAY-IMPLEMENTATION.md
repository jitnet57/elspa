# Thailand 30-Day Launch Playbook

> ElSpa Manager - Thailand Launch Strategy (Jun 1-30, 2026)
> Location: Bangkok (Primary) + Phuket (Prep)

---

## 📊 Goal (เป้าหมาย)

- **Month 1 Revenue**: ฿250,000 (≈ $7,000 USD)
- **Customers**: 5-7 accounts (through accountant partnerships)
- **System Uptime**: 99.5%
- **NPS**: 50+
- **Accountant Partners**: 3-4 networks

---

## 🎯 Week 1: Foundation (Jun 1-7)

### Day 1-2: Bangkok Office & Thai Legal Entity Setup

**Checklist**
- [ ] Bangkok office lease (Silom/Sathorn area - expat-friendly)
- [ ] Thai Company registration (จดทะเบียน บริษัท)
- [ ] Thai tax ID (เลขที่ประจำตัวผู้เสียภาษี)
- [ ] Revenue department registration
- [ ] Bank account (Bangkok Bank / Kasikornbank - business)
- [ ] Work permits for expat staff

**Details**
```
Office Location: Silom Business District (BTS Chong Nonsi)
Space: 40 sqm (5 desks, 1 conference room)
Rent: ฿100,000/month (including utilities)
Lease: 1 year + 2 month deposit

Thai Legal Structure:
- Limited Company (บริษัท จำกัด)
- Registered at Ministry of Commerce
- Thai Tax ID obtained
- Revenue Code registration (section 12)
- Social insurance registration

Timeline: 5-7 business days
Cost: ฿80,000-100,000 (legal + registration)
```

**Thai Company Registration Process** (Summary)
```
Step 1: Prepare documents
- Memorandum & Articles of Association
- Shareholder IDs
- Founder addresses

Step 2: Ministry of Commerce filing
- Online application or in-person
- Approval: 2-3 days
- Issue: Certificate of Incorporation

Step 3: Tax & Revenue Department
- Form 406 (Revenue Code registration)
- Issue: Tax ID number (13 digits)
- Takes 1 day

Step 4: Bank account opening
- Bring: Certificate of Incorporation + Tax ID
- Bangkok Bank/Kasikornbank preferred (good crypto support)
```

**Responsibility**: Operations Manager  
**Budget**: ฿120,000

---

### Day 3-4: Thai Payment Gateway Integration

**Checklist**
- [ ] TrueWallet API (Thai e-wallet, #1 choice)
- [ ] PromptPay bank transfers (Thai standardized)
- [ ] Kasikornbank online payment
- [ ] Bangkok Bank transfer API
- [ ] Line Pay integration (LINE is huge in Thailand)

**Technical Implementation**
```python
# backend/payment_th.py

from fastapi import APIRouter
from truewallet_sdk import TrueWalletClient
from promptpay_sdk import PromptPayClient
import line_pay

router = APIRouter(prefix="/api/payment-th", tags=["payment-thailand"])

# TrueWallet (most popular in Thailand)
truewallet = TrueWalletClient(
    merchant_id=os.getenv("TRUEWALLET_MERCHANT_ID"),
    api_key=os.getenv("TRUEWALLET_API_KEY")
)

@router.post("/charge-truewallet")
async def charge_via_truewallet(customer_id: int, amount_baht: int):
    """
    TrueWallet payment (50% of Thai e-wallet market)
    - Fee: 2.5%
    - Settlement: Real-time
    - Phone number required
    """
    payment = await truewallet.charge(
        customer_phone=customer_phone,  # Thai phone format
        amount=amount_baht,
        reference=f"ELSPA-{customer_id}",
        callback_url="https://elspa.th/webhook/truewallet"
    )
    return payment

@router.post("/charge-promptpay")
async def charge_via_promptpay(customer_id: int, amount_baht: int):
    """
    PromptPay (Thai instant bank transfer standard)
    - Interbank standard since 2017
    - Works with all Thai banks
    - Low fee: 0.5%
    - Settlement: 1-2 minutes
    """
    payment = await promptpay_client.request_transfer(
        merchant_id="0825551234567",  # National ID or business ID
        amount=amount_baht,
        description="ElSpa Manager"
    )
    return payment

@router.post("/charge-linepay")
async def charge_via_linepay(customer_id: int, amount_baht: int):
    """
    LINE Pay (LINE app is used by 70% of Thai adults)
    - Integration with LINE app ecosystem
    - Fee: 3.46% for businesses
    - Good for young demographic
    """
    payment = await line_pay.request(
        amount=amount_baht,
        currency="THB",
        orderId=f"ELSPA-{customer_id}",
        packages=[{
            "id": "1",
            "amount": amount_baht,
            "products": [{"name": "Monthly Subscription"}]
        }]
    )
    return payment

# Thai Tax Receipts Integration
@router.post("/generate-tax-receipt-th")
async def generate_thai_tax_receipt(customer_id: int, amount_baht: int):
    """
    Generate Thai tax receipt (ใบเสร็จรับเงิน)
    Required for Thai tax compliance
    """
    receipt = TaxReceipt(
        issue_date=datetime.now(),
        seller_name="ElSpa Manager Thailand",
        seller_tax_id="0105555099880",  # Example Thai business tax ID
        buyer_name=customer.name,
        buyer_tax_id=customer.tax_id,  # Customer's 10-digit national ID or business ID
        amount=amount_baht,
        description="Monthly Software Subscription"
    )
    return receipt.generate_pdf()

# Thai Currency Formatting
def format_thai_baht(amount: int) -> str:
    """
    Format amount in Thai way
    25000 → "25,000 บาท"
    """
    return f"{amount:,.0f} บาท"
```

**Payment Methods Comparison (Thailand)**
```
┌──────────────┬──────────┬────────────┬─────────────┐
│ Method | Fee | Settlement | Popularity |
├──────────────┼──────────┼────────────┼─────────────┤
│ TrueWallet | 2.5% | Real-time | 50% of market |
│ PromptPay | 0.5% | 1-2 min | 30% (banks) |
│ LINE Pay | 3.46% | Real-time | Growing |
│ Bangkok Bank | 1% | 2-3 hours | 20% |
└──────────────┴──────────┴────────────┴─────────────┘

Recommendation for ElSpa:
1. Primary: PromptPay (low cost, reliable)
2. Secondary: TrueWallet (most popular)
3. Tertiary: LINE Pay (young audience)
```

**Responsibility**: Technical Team  
**Budget**: ฿60,000

---

### Day 5-7: Thai Localization & Accountant Partnership Outreach

**Checklist**
- [ ] Thai language UI (100% localization to Thai/Siamese)
- [ ] Thai spa/massage industry terminology
- [ ] Thai tax receipt format (ใบเสร็จรับเงิน)
- [ ] Thai labor law payroll calculations
- [ ] Accountant outreach list (top 50 firms)

**Frontend Thai Localization**
```typescript
// src/locales/th.json - New file

{
  "currency": "บาท",
  "language": "ไทย",
  "payment": {
    "truewallet": "ทรูวอลเล็ต",
    "promptpay": "พร้อมเพย์",
    "linepay": "LINE Pay",
    "bankTransfer": "โอนเงินธนาคาร",
    "method": "วิธีการชำระเงิน"
  },
  "industry": {
    "massage": "นวด",
    "therapist": "นักบำรุง",
    "spa": "สปา",
    "salon": "ร้านเสริมสวย",
    "manager": "ผู้จัดการ",
    "owner": "เจ้าของร้าน",
    "booking": "การจองคิวสำหรับเยี่ยม"
  },
  "tax": {
    "taxReceipt": "ใบเสร็จรับเงิน",
    "taxId": "เลขประจำตัวผู้เสียภาษี",
    "issueDate": "วันที่ออกใบเสร็จ",
    "revenue": "รายได้",
    "deduction": "ค่าหัก"
  },
  "payroll": {
    "salary": "เงินเดือน",
    "hourlyRate": "ค่าจ้างรายชั่วโมง",
    "overtimeRate": "ค่าจ้างนอกเวลา",
    "monthlyTotal": "รวมเดือนนี้",
    "taxDeduction": "หักภาษี"
  }
}
```

**Thai Labor Law Payroll Module**
```python
# backend/payroll_thailand.py

from decimal import Decimal
from datetime import datetime, timedelta

class ThailandPayroll:
    """
    Thailand labor law compliance for massage/spa therapists
    Based on Thai Labor Protection Act B.E. 2541 (1998)
    """
    
    # Thai minimum wage varies by province
    MINIMUM_WAGE = {
        "Bangkok": Decimal("328"),          # per day
        "Bangkok Metropolitan": Decimal("328"),
        "Phuket": Decimal("320"),
        "Chiang Mai": Decimal("300"),
        # etc.
    }
    
    OVERTIME_MULTIPLIER = {
        "1-2 hours": Decimal("1.5"),        # 150% for first 2 hours
        "beyond 2": Decimal("2.0"),         # 200% beyond 2 hours
    }
    
    def __init__(self, therapist_name: str, province: str, hourly_rate: Decimal):
        self.therapist_name = therapist_name
        self.province = province
        self.hourly_rate = hourly_rate
        self.min_wage = self.MINIMUM_WAGE.get(province, Decimal("325"))
    
    def validate_rate(self) -> bool:
        """
        Ensure therapist rate meets Thai minimum wage
        """
        daily_minimum = self.min_wage
        hourly_minimum = daily_minimum / 8  # 8-hour work day
        return self.hourly_rate >= hourly_minimum
    
    def calculate_daily_pay(self, hours_worked: Decimal, overtime_hours: Decimal = Decimal("0")) -> Decimal:
        """
        Calculate daily pay with overtime
        - Standard: hourly_rate × hours
        - Overtime: hourly_rate × 1.5 (first 2 hours) + hourly_rate × 2.0 (beyond)
        """
        standard_pay = hours_worked * self.hourly_rate
        
        if overtime_hours > 0:
            if overtime_hours <= 2:
                overtime_pay = overtime_hours * self.hourly_rate * Decimal("1.5")
            else:
                overtime_pay = (Decimal("2") * self.hourly_rate * Decimal("1.5")) + \
                               ((overtime_hours - 2) * self.hourly_rate * Decimal("2.0"))
        else:
            overtime_pay = Decimal("0")
        
        return standard_pay + overtime_pay
    
    def calculate_monthly_pay(self, days_worked: int, daily_hours: Decimal) -> Decimal:
        """
        Calculate monthly salary (26 working days in Thailand)
        """
        daily_pay = self.calculate_daily_pay(daily_hours)
        monthly_pay = daily_pay * Decimal(days_worked)
        return monthly_pay
    
    def generate_salary_slip(self) -> dict:
        """
        Generate Thai salary slip (ใบเสร็จค่าจ้าง)
        """
        return {
            "employee_name": self.therapist_name,
            "position": "Massage Therapist",
            "period": f"{datetime.now().month}/{datetime.now().year}",
            "hourly_rate": f"฿{self.hourly_rate:.2f}",
            "days_worked": 26,
            "gross_pay": f"฿{self.gross_pay:.2f}",
            "deductions": self.calculate_deductions(),
            "net_pay": f"฿{self.net_pay:.2f}",
            "issued_date": datetime.now().strftime("%d/%m/%Y")
        }
    
    def calculate_deductions(self) -> dict:
        """
        Thai tax/insurance deductions
        """
        # Thai social security: ~5% + ~0.75% health insurance
        social_security = self.gross_pay * Decimal("0.05")
        health_insurance = self.gross_pay * Decimal("0.0075")
        
        return {
            "social_security": f"฿{social_security:.2f}",
            "health_insurance": f"฿{health_insurance:.2f}",
            "total": f"฿{(social_security + health_insurance):.2f}"
        }
```

**Accountant Partnership Strategy**
```markdown
## Thai Accountant Partnership Program

### Target Partners
1. Top accounting firms (KPMG, PWC, EY)
2. Mid-tier CPAs (30-50 person firms)
3. Solo accountants specializing in hospitality/spa

### Partnership Model
**Revenue Share**: 15% of customer MRR
**Commission Payment**: Monthly (by 5th of month)

**Example**:
Customer pays ฿25,000/month
Accountant gets: ฿25,000 × 0.15 = ฿3,750/month
(Potential: 5 referrals × ฿3,750 = ฿18,750/month for accountant)

### Co-Marketing
- "Recommended by [Accountant Firm]"
- White-label invoices (accountant's logo optional)
- Joint webinars on Thai payroll/tax compliance
- Referral materials in Thai language

### Target List (Top 20)
1. BDO Thailand (hotel/spa specialization)
2. Deloitte Thailand
3. EY Thailand
... (15 more)
```

**Accountant Outreach Email** (in Thai - abbreviated)
```markdown
เรื่อง: โปรแกรมแบ่งรายได้สำหรับสปา/นวดไทย

เรียนครับ/ค่ะ [ชื่อบัญชี],

เราคิดค้นโปรแกรมจัดการการจองและเงินเดือนอัตโนมัติสำหรับร้านสปาและนวด

ลูกค้าของคุณมักต้องเผชิญกับ:
✓ การบำรุงรักษาการจองด้วยตนเอง
✓ การคำนวณเงินเดือนที่ซับซ้อน
✓ ปัญหาการปฏิบัติตามกฎหมายไทย

เรามี **ส่วนแบ่งรายได้ 15%** สำหรับทุกการอ้างอิง

สามารถโทรมาพูดคุยได้ในวันจันทร์เวลา 14:00 น. ไหม

ขอบคุณ,
[ชื่อของคุณ]
ElSpa Manager Thailand
```

**Responsibility**: Business Development / Marketing  
**Budget**: ฿40,000

---

## 🎯 Week 2: Market Entry & Partner Launches (Jun 8-14)

### Day 8-9: Accountant Outreach (20+ contacts)

**Checklist**
- [ ] Identify 50 accounting firms in Bangkok/Phuket
- [ ] Get partner manager email addresses
- [ ] Schedule 10+ discovery calls
- [ ] Present partnership offer
- [ ] Aim for 3-4 partnerships by Day 14

**Outreach Sequence**
```
Day 8 AM: Send personalized emails to top 20 accountants
Day 8 PM: Follow-up calls to respondents (5-10 expected)
Day 9 AM: Second round calls to non-responders
Day 9 PM: Schedule follow-up calls/demos with interested parties

Success Rate Assumption:
50 emails → 20% open rate (10 opens)
→ 30% interest (3 inquiries)
→ 3 accountants willing to partner
```

**Partner Agreement Template** (Thai context)
```markdown
## บันทึกความเข้าใจ (MOU) - Accountant Partnership

### ฝ่ายที่เกี่ยวข้อง
- Service Provider: ElSpa Manager Thailand
- Partner: [Accounting Firm Name]

### ความเห็นด้วย
Partner agrees to:
1. Recommend ElSpa Manager to clients
2. Provide referrals at least 2-3/month
3. Co-market with ElSpa materials

### ค่าตอบแทน (Revenue Share)
- Amount: 15% of referred customer MRR
- Payment: Monthly by 5th of month
- Minimum: None (no minimum referral requirement)

### ระยะเวลา
- Duration: 12 months (auto-renew)
- Termination: 30 days notice

### ลายเซ็น
Provider: _________________ Date: _______
Partner: _________________ Date: _______
```

**Responsibility**: Business Development  
**Expected Outcome**: 3-4 partnerships signed

---

### Day 10-12: Partner-Led Demos & Customer Acquisition

**Checklist**
- [ ] Each partner introduces ElSpa to 2-3 spa clients
- [ ] ElSpa team conducts demos
- [ ] Aim for 5-7 customer sign-ups through partners
- [ ] Track referral source (attribution)

**Partner Activation Process**
```
Day 10: Partner kickoff call
- Explain referral process
- Provide marketing materials (Thai & English)
- Share demo video link

Day 10-11: Partners reach out to spa clients
- Partner: "I found a system that solves your payroll/booking issues"
- Introduce ElSpa team for technical demo

Day 11-12: ElSpa demos to 5-7 spa prospects
- 20-minute demos per prospect
- Address payment/tax questions

Day 12: Contracts signed
- Aim: 5+ customers from partners
```

**Demo Script (for Partner-Referred Leads)**
```markdown
## Thai Spa Demo - Partner Introduced Lead

### Opening (2 min)
"Hello! [Partner Name] referred you to us.
We help spas like yours automate booking and payroll."

### Problem Statement (2 min)
"I understand you currently manage bookings [manually/via Line/Facebook]
and calculate payroll in Excel. Is that right?"

### Solution (10 min)
Demo covers:
1. Booking system (24/7 online)
2. Therapist app
3. Auto-payroll calculation
4. Thai tax receipt generation
5. PromptPay integration

### Q&A (5 min)
"Any questions about your specific workflow?"

### Offer (1 min)
"Let's start with a 30-day free trial. No risk."
```

**Responsibility**: Sales/CS Team  
**Expected Outcome**: 5-7 contract sign-ups

---

### Day 13-14: Direct Sales & Hotel Chain Pilots

**Checklist**
- [ ] Identify 5-10 hotel spa chains in Bangkok/Phuket
- [ ] Schedule meetings with spa managers
- [ ] Propose pilot programs (30-day free trial)
- [ ] Target: 1-2 hotel chain pilots by Day 14

**Hotel Chain Strategy** (Bangkok)
```
Target Hotels (Bangkok)
1. Mandarin Oriental (Siam)
2. The Peninsula Bangkok
3. Centara Grand
4. Sofitel Legend
5. Layan Bangkok

Approach:
- Direct contact with Spa Manager or General Manager
- Emphasize: Revenue optimization + staff retention
- Pilot: 30-day free trial

Potential:
- Large hotel spas: 20-40 therapists
- High-volume bookings: 100-200/day
- Premium pricing: Can afford ฿50,000-75,000/month

Value Prop:
"Our system optimizes your spa revenue and improves 
staff experience. Let's pilot for 30 days - no cost."
```

**Hotel Spa Contact Outreach Email**
```markdown
Subject: 30-Day Spa Management Pilot - Mandarin Oriental Bangkok

Dear [Spa Manager Name],

We're rolling out ElSpa Manager across Southeast Asia 
and would like [Your Hotel]'s spa to be a flagship partner.

We help premium hotel spas:
✓ Optimize therapist scheduling
✓ Automate payroll compliance
✓ Increase customer satisfaction (digital booking)

**Pilot Offer**: 30 days free - no commitment

This Thursday at 2 PM?

Best regards,
[Your Name]
ElSpa Manager Thailand
+66-2-XXX-XXXX
```

**Responsibility**: Sales Director  
**Expected Outcome**: 1-2 pilot agreements

---

## 🎯 Week 3: Customer Go-Lives (Jun 15-21)

### Day 15-17: First 3-5 Customers Go-Live

**Checklist**
- [ ] 3-5 customers ready for onboarding
- [ ] Data migration completed
- [ ] Staff trained
- [ ] Payment methods tested
- [ ] Tax receipts validated

**Parallel Onboarding Timeline**
```
Day 15:
- Customer 1: Contract + Data Migration Start
- Customer 2: Contract + Data Migration Start
- Customer 3: Contract + Data Migration Start

Day 16:
- Customer 1: UAT + Staff Training
- Customer 2: UAT + Staff Training
- Customer 3: UAT + Staff Training

Day 17:
- Customer 1: Go-Live 10 AM
- Customer 2: Go-Live 2 PM
- Customer 3: Go-Live 4 PM
```

**Go-Live Celebration** (via Thai video call)
```
Participants:
- Spa owner/manager
- 2-3 staff
- Our Country Manager
- Technical support (on standby)

Video call (1 hour, in Thai with English support):
1. Greeting & excitement! 🎉
2. System walkthrough (15 min)
3. First booking test (10 min)
4. Payroll demo (10 min)
5. Q&A (10 min)
6. Support intro & closing (5 min)

Post-launch:
- Follow-up call in 2 days
- Weekly check-in for first month
- Feedback collection (NPS survey)
```

**Responsibility**: Customer Success Manager  
**Expected Outcome**: 3-5 customers live & productive

---

### Day 18-21: Customer Support & Momentum Building

**Checklist**
- [ ] Daily check-ins with 3-5 new customers
- [ ] Resolve any technical issues
- [ ] Collect testimonials for case studies
- [ ] Identify next 2-3 customer prospects
- [ ] Plan Week 4 expansion

**Support Protocol**
```
Day 18: 1-day post-launch check-in
- "How's everything going?"
- Troubleshoot any issues
- Offer additional training if needed

Day 19-21: Weekly support & feedback
- Monitor system usage
- Proactive outreach: "Any questions?"
- Collect NPS feedback (survey)
- Document success stories

Success Indicators:
□ All customers can create bookings independently
□ Payroll calculated correctly
□ No critical bugs reported
□ NPS score 45+
```

**Customer Success Call Template** (Thai context)
```markdown
## Weekly Check-in Call (สัปดาห์ที่ 1)

### Opening
"สวัสดีครับ/ค่ะ! [ชื่อของเจ้าของร้าน]
ฉันเพิ่งเข้าไปในระบบและเห็นว่าธุรกิจของคุณ
กำลังทำงานได้ดี!

ได้รับคำถามหรือปัญหาบ้างไหม?"

### Questions
1. การจองทำงานได้ดีไหม?
2. มีปัญหากับการชำระเงินไหม?
3. พนักงานสามารถใช้แอปได้ง่ายไหม?
4. มีอย่างไรที่สามารถปรับปรุงได้?

### Feedback Collection
"บน scale 0-10, คุณพอใจกับเราแค่ไหน?"

### Closing
"ขอบคุณสำหรับการใช้ ElSpa Manager!
ติดต่อเราได้ 24/7"
```

**Responsibility**: Customer Success Manager

---

## 🎯 Week 4: Growth & Phuket Prep (Jun 22-30)

### Day 22-26: Customer 6-7 Onboarding + Phuket Research

**Checklist**
- [ ] Onboard 2 additional customers (6-7)
- [ ] Research Phuket market (5-10 top spas)
- [ ] Scout Phuket office location
- [ ] Identify Phuket accountant partners
- [ ] Plan July expansion to Phuket

**Phuket Market Analysis**
```
Phuket Opportunity:
- Tourism destination (20M+ annual visitors)
- High-end resort spas (Laguna, Banyan Tree, etc.)
- Local spas (200+ in Phuket Old Town)
- Average spa size: 10-20 therapists

Competitive Advantage:
- Multi-language support (Thai/English)
- PromptPay integration
- Tourist-friendly payment options

Top 5 Phuket Spas:
1. Banyan Tree Spa (Luxury resort) - 30+ therapists
2. Laguna Spa (Laguna complex) - 25+ therapists
3. Absolute Spa Boutique - 8 therapists
4. Thai Spa - 12 therapists
5. [Research in-progress]

Target: Launch Phuket in July with 3-5 customers
```

**Responsibility**: Business Development / Market Research

---

### Day 27-30: KPI Review & July Planning

**Monthly Performance Dashboard**
```
┌─────────────────────────────────┐
│ June 2026 - Thailand            │
├─────────────────────────────────┤
│ Total Customers: 5-7            │
│ Monthly Revenue: ฿125-175K      │
│ Partner Agreements: 3-4         │
│ System Uptime: 99.5%            │
│ NPS Score: 48+                  │
│ Churn Rate: 0%                  │
└─────────────────────────────────┘

Revenue Breakdown:
- Direct Sales (5 customers): 5 × ฿25K = ฿125K
- Partner Referrals: 0-2 × ฿25K = ฿0-50K
- Total: ฿125-175K/month

Cost Analysis:
- Office lease: ฿100,000
- Salaries (2 staff): ฿450,000
- Payment processing: ฿5,000
- Infrastructure: ฿20,000
- Marketing: ฿30,000
- Accountant commissions: ฿15,000
= ฿620,000/month

Status: Negative margin (as expected)
Breakeven point: ~25 customers (฿625K MRR)
```

**June Retrospective Meeting** (June 29)
```markdown
## Thailand Launch Review

### Wins ✅
1. 5-7 customers launched successfully
2. 3-4 accountant partnerships active
3. Legal setup & tax compliance complete
4. PromptPay integration smooth
5. Zero critical incidents

### Challenges 🚀
1. Thai language localization - needed more time
2. Accountant partnerships slower than expected (3-4 vs 5 target)
3. Hotel chain pilots - still in negotiation (not launched yet)
4. Payment verification - PromptPay webhook issues (resolved day 2)

### July Targets 🎯
1. 12-15 total customers (add 7-8)
2. ฿300,000 monthly revenue
3. NPS 55+
4. Launch Phuket (3-5 customers)
5. 4-5 accountant partnerships active

### Action Items for July
- [ ] Hotel chain pilot launch (2 expected)
- [ ] Phuket office setup (budget: ฿100K)
- [ ] Expand accountant partnerships (target 2 more)
- [ ] Build Thai case study videos (marketing)
- [ ] Hire Phuket customer success manager (HR)

### Key Success Factors
1. Accountant partnerships are performing well
2. PromptPay simplifies customer payment process
3. Thai localization resonates with customers
4. Hotel chains represent future growth opportunity
```

**Responsibility**: Country Manager / CEO

---

## 📊 Success Metrics (Month 1)

| Metric | Target | Status |
|--------|--------|--------|
| Customers | 5-7 | 🔄 |
| Revenue | ฿125-175K | 🔄 |
| Partners | 3-4 | 🔄 |
| NPS | 50+ | 🔄 |
| Uptime | 99.5% | 🔄 |

---

## 🔧 Technical Setup

### Infrastructure (AWS Thailand)
- [ ] Bangkok Region (ap-southeast-1)
- [ ] RDS PostgreSQL (db.t3.medium)
- [ ] S3 + CloudFront
- [ ] VPN security

### Localization
- [ ] Thai UI (100%)
- [ ] PromptPay integration
- [ ] TrueWallet integration
- [ ] Thai tax receipts
- [ ] Thai labor law payroll

### Monitoring
- [ ] Sentry, DataDog
- [ ] Uptime Robot
- [ ] Daily backups

---

## 💰 June Budget (฿)

| Item | Cost |
|------|------|
| Office lease | ฿100,000 |
| Legal setup | ฿120,000 |
| Salaries (2 staff) | ฿450,000 |
| Infrastructure | ฿60,000 |
| Marketing/Outreach | ฿70,000 |
| Payment gateways | ฿40,000 |
| Contingency | ฿50,000 |
| **Total** | **฿890,000** |

---

## 👥 Team

| Role | Hire | Responsibilities |
|------|------|-----------------|
| Country Manager | Month 1 | Sales, Partnerships |
| Technical Lead | Month 1 | System, Integration |
| Customer Success | Month 1 | Onboarding, Support |
| Business Dev | Month 2 | Partner Expansion |

---

## ✅ Signoff

- [ ] Country Manager approval
- [ ] CEO approval
- [ ] Finance approval

**Document Version**: 1.0  
**Created**: 2026-05-29
