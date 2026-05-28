# Philippines 30-Day Launch Playbook

> ElSpa Manager - Philippines Launch Strategy (Jun 1-30, 2026)
> Location: Cebu (Primary) + Bohol (Prep)

---

## 📊 Goal (Layunin)

- **Month 1 Revenue**: ₱450,000 (≈ $8,000 USD)
- **Customers Acquired**: 3-4 accounts
- **System Reliability**: 99.5% uptime
- **NPS Score**: 50+
- **Partnerships**: 2 accountant networks

---

## 🎯 Week 1: Foundation (Jun 1-7)

### Day 1-2: Cebu Office Setup & BIR Registration

**Checklist**
- [ ] Cebu City office lease (IT Park / Banilad area)
- [ ] BIR (Bureau of Internal Revenue) registration
- [ ] SEC (Securities and Exchange Commission) filing
- [ ] Business permit & mayor's permit
- [ ] Bank account (BDO / BPI Business)
- [ ] PPhilippines tax identification number (TIN)

**Details**
```
Office Location: Cebu IT Park, Lahug
Space: 30 sqm (4 desks, 1 meeting room)
Rent: ₱60,000/month (includes utilities)
Lease Term: 1 year

Government Registration:
- BIR Form 1901 (barangay clearance first)
- SEC incorporation documents
- Business Permit (₱2,000-5,000)
- Mayor's Permit (₱1,000)
- Occupancy Permit
```

**Responsibility**: Operations Manager  
**Budget**: ₱150,000

---

### Day 3-4: Philippine Payment Gateway Integration

**Checklist**
- [ ] GCash API integration (mobile wallets)
- [ ] Coins.ph API (remittances & small payments)
- [ ] BDO Bank transfer API
- [ ] Stripe Philippines (credit cards)
- [ ] SMS payment verification (optional)

**Technical Implementation**
```python
# backend/payment_ph.py

from fastapi import APIRouter
from gcash_sdk import GcashClient
from coinspay_sdk import CoinsPayClient
import stripe

router = APIRouter(prefix="/api/payment-ph", tags=["payment-philippines"])

# GCash Integration
gcash_client = GcashClient(
    merchant_id=os.getenv("GCASH_MERCHANT_ID"),
    api_key=os.getenv("GCASH_API_KEY")
)

@router.post("/charge-gcash")
async def charge_via_gcash(customer_id: int, amount_pesos: int):
    """
    GCash payment (most popular in PH)
    - Fee: 2.5%
    - Settlement: Next business day
    """
    payment = await gcash_client.create_charge(
        customer_phone=customer_phone,  # 09XXXXXXXXX format
        amount=amount_pesos,
        reference=f"ELSPA-{customer_id}"
    )
    return payment

@router.post("/charge-bank-transfer")
async def charge_bank_transfer(customer_id: int, amount_pesos: int):
    """
    BDO/BPI Bank transfer with auto-verification
    """
    transfer = await bdo_client.request_transfer(
        account_name="ElSpa Manager PH",
        amount=amount_pesos,
        description="Monthly subscription"
    )
    return transfer

@router.post("/charge-coins")
async def charge_coins_ph(customer_id: int, amount_pesos: int):
    """
    Coins.ph (alternative for unbanked segments)
    """
    payment = await coins_client.request_payment(
        amount=amount_pesos,
        mobile_number=customer_phone
    )
    return payment

# Philippine-specific fee structure
PAYMENT_METHODS = {
    "gcash": {"fee": 0.025, "settlement": "1 day"},
    "bank_transfer": {"fee": 0.01, "settlement": "2 days"},
    "coins_ph": {"fee": 0.03, "settlement": "1 day"},
    "stripe": {"fee": 0.039, "settlement": "2 days"},
}
```

**Responsibility**: Technical Team  
**Budget**: ₱80,000

---

### Day 5-7: Philippine Market Localization & Sales Script

**Checklist**
- [ ] UI translation to Filipino (Tagalog)
- [ ] BIR tax receipt format (Philippine standard)
- [ ] Spa industry terminology (masaj, terapis, booking)
- [ ] Localized pricing model
- [ ] Sales script for Philippine context

**Frontend Localization**
```typescript
// src/locales/ph.json - New file

{
  "currency": "₱",
  "language": "Filipino",
  "payment": {
    "gcash": "GCash",
    "bankTransfer": "Bank Transfer (BDO/BPI)",
    "coins": "Coins.ph",
    "stripe": "Credit Card",
    "method": "Paraan ng Pagbabayad"
  },
  "industry": {
    "therapist": "Terapis",
    "masseuse": "Masahista",
    "manager": "Manager",
    "owner": "Owner/Boss",
    "booking": "Booking ng Serbisyo"
  },
  "location": {
    "cebu": "Cebu City",
    "manila": "Metro Manila",
    "bohol": "Bohol",
    "visayas": "Visayas Region"
  },
  "features": {
    "autoPayroll": "Automatic Payroll Calculation",
    "birReceipt": "BIR Tax Receipt (Automated)",
    "crm": "Customer Database",
    "scheduling": "Online Scheduling System"
  }
}
```

**BIR Tax Receipt Module**
```python
# backend/bir_receipt_ph.py

from datetime import datetime
from enum import Enum

class BIRReceiptType(str, Enum):
    SERVICES = "Professional Services"
    CONSULTATION = "Consultation Fee"
    RENTAL = "Equipment Rental"

class BIRReceipt:
    """
    Philippine BIR-compliant receipt for therapist payments
    """
    def __init__(self, recipient_name: str, tin: str, amount: int):
        self.recipient_name = recipient_name
        self.tin = tin  # Tax Identification Number
        self.amount = amount
        self.receipt_date = datetime.now()
    
    def generate_pdf(self) -> bytes:
        """
        Generate PDF receipt with BIR requirements:
        - Company name & address
        - Recipient TIN
        - Receipt number (sequential)
        - Amount in words + figures
        - Date
        - Authorized signature
        """
        # Use ReportLab or similar
        receipt = f"""
        ================================
        BIR PROFESSIONAL SERVICES RECEIPT
        
        Receipt #: {self.get_sequential_number()}
        Date: {self.receipt_date.strftime('%m/%d/%Y')}
        
        PAYEE: {self.recipient_name}
        TIN: {self.tin}
        
        SERVICE PROVIDED: Professional Services
        AMOUNT: ₱{self.amount:,.2f}
        (Amount in words: {self.amount_in_words()})
        
        Authorized by: ________________
        ================================
        """
        return receipt.encode()
    
    def amount_in_words(self) -> str:
        """Convert amount to Filipino words for compliance"""
        # Implementation: 25000 → "Twenty-five thousand pesos"
        pass
```

**Sales Script (Philippine Context)**
```markdown
## Filipino Sales Script (Cebu Spa Focus)

### Opening (3 minutes)
"Hello, [Name]! I'm [Your Name] from ElSpa Manager.

We help **massage and spa businesses automate scheduling and payroll** 
so you can focus on customer care.

Are you currently using a booking system?"

### Pain Point Discovery (2 minutes)
Common problems in PH spas:
- Handwritten bookings (lost reservations)
- Manual payroll with calculators (time-consuming)
- No customer history (repeat customers aren't tracked)
- Difficulty with BIR receipts and tax compliance

### Solution Pitch (3 minutes)
"Our system offers:
1. **Online Booking** - 24/7 customer reservations
2. **Auto Payroll** - Calculate therapist pay by service (₱500/hour example)
3. **BIR Receipts** - Automatic tax compliance
4. **Customer CRM** - Track preferences, repeat visits
5. **SMS Notifications** - Reminder texts to customers"

### Localization Details
- Support GCash payments (most popular)
- BIR tax receipt format
- Filipino language interface
- Therapist terminology (masahista, terapis)

### Demo Offer (1 minute)
"May I show you a quick 15-minute demo this Thursday, 2 PM?
It takes only your phone number."

### Closing
"Thank you. I'll follow up with a message."
```

**Responsibility**: Marketing/Sales Team  
**Budget**: ₱50,000

---

## 🎯 Week 2: Market Entry & Sales (Jun 8-14)

### Day 8-9: Top 20 Cebu Spa/Salon Target List

**Checklist**
- [ ] Identify 20 high-value spas/salons in Cebu
- [ ] Research owner/manager contact information
- [ ] Prioritize by: therapist count × monthly bookings × system absence
- [ ] LinkedIn/Facebook profile review
- [ ] Outreach readiness

**Scoring Matrix**
```
Score = (Therapist Count × 5) + (Monthly Bookings × 2) + (10 if no online booking)

Example:
1. "Luna Spa" (Banilad): 20 therapists, 400 bookings/month
   Score = (20 × 5) + (400 × 2) + 10 = 910 ⭐⭐⭐
   
2. "Relaxation Station" (IT Park): 12 therapists, 250 bookings/month
   Score = (12 × 5) + (250 × 2) + 10 = 520 ⭐⭐
   
3. "Budget Massage" (Downtown): 5 therapists, 100 bookings/month
   Score = (5 × 5) + (100 × 2) + 10 = 220 ⭐
```

**Top 20 List (Cebu)**
```
Rank | Business Name | Location | Therapists | Bookings/mo | Owner Phone | Status
-----|---------------|----------|-------------|------------|-------------|--------
1    | Luna Spa | Banilad | 20 | 400 | 0917-XXX-XXXX | Cold outreach
2    | Relaxation Station | IT Park | 12 | 250 | 0916-XXX-XXXX | Cold outreach
3    | Divine Spa | Ayala | 15 | 300 | 0918-XXX-XXXX | Cold outreach
4    | Wellness Center | Lahug | 10 | 180 | 0919-XXX-XXXX | Cold outreach
5    | ... (15 more)
```

**Responsibility**: Sales Development Manager  
**Budget**: ₱30,000 (list building, contact acquisition)

---

### Day 10-11: Cold Outreach Campaign (50+ spas)

**Checklist**
- [ ] Send Facebook messages to top 20 (personal approach in PH culture)
- [ ] Cold calls to 5-10 highest-priority spas
- [ ] Email follow-ups (in Filipino when possible)
- [ ] WhatsApp groups for spa owners (community building)
- [ ] Schedule 3-5 demos

**Outreach Sequence**
```
Day 10 AM: Facebook message outreach (top 20)
"Hi [Name]! 👋

I'm [Your Name] from ElSpa Manager. We help spas like yours 
automate booking & payroll. 

May we show you a quick 15-min demo? You can keep your current 
system—this is just to show you what's possible.

Thanks,
[Your Name]
ElSpa Manager"

Day 10 PM: Phone calls to top 5 (follow-up from message)
Day 11 AM: Phone calls to next 5-10
Day 11 PM: Email follow-up (Google translate to Filipino)
```

**WhatsApp Template**
```
Kumusta! 👋

Welcome sa ElSpa Manager Cebu Community Group! 🌴

Here we share:
✅ Spa management tips
✅ Customer success stories
✅ Product updates
✅ Networking opportunities

Feel free to ask questions. We're here to help! 💪

[Link to product demo video]
```

**Responsibility**: Sales Team  
**Expected Results**: 3-5 demo appointments

---

### Day 12-14: Demos & Accountant Partnership Launch

**Demo Flow (20 minutes)**
```
0-2 min: Greeting & pain point confirmation
"What's the biggest challenge with your current system?"

2-10 min: Live demo
- Web dashboard (owner view)
- Mobile booking app
- Auto payroll calculation (by therapist hour)
- BIR receipt generation
- GCash payment setup

10-15 min: Q&A & customization
"What features do you need most?"

15-20 min: Next steps
"Let's schedule a free trial. You keep your current system,
and we'll show results in 30 days."
```

**Accountant Partnership Initiative**
```markdown
### Partnership Strategy

**Problem**: Cebu spas struggle with BIR compliance
**Solution**: Partner with accounting firms to bundle ElSpa Manager

**Approach**:
1. Contact 5-10 accounting firms (GCQ/PwC/local)
2. Offer revenue share: 10% per referred customer
3. Co-market: "Your accountant recommends ElSpa Manager"
4. White-label option (accountant's branding on receipts)

**Expected Outcome**:
- Each accountant refers 2-3 spas/month
- Adds credibility (trusted by accountants)
- Reduces acquisition cost
```

**Partnership Pitch Email** (to accountants)
```markdown
Subject: Revenue Share Partnership - Spa Management Software

Hello [Accountant Name],

We help Cebu spas automate their payroll and BIR compliance.
Many of your clients struggle with:

✓ Manual payroll calculations
✓ Tax receipt generation
✓ Customer booking chaos

We'd like to offer your firm a **10% revenue share** for every 
spa you refer. You can position ElSpa Manager as your 
recommended tool.

Would you be interested in a 15-minute call this week?

Best regards,
[Your Name]
ElSpa Manager
```

**Responsibility**: Sales & Business Development  
**Expected Results**: 2-3 accountant partnerships + 3 demos scheduled

---

## 🎯 Week 3: First Customer Onboarding (Jun 15-21)

### Day 15-16: First Contract (Cebu Customer)

**Checklist**
- [ ] Finalize contract terms
- [ ] Pricing decision (trial vs. paid)
- [ ] Payment method setup
- [ ] Sign agreement

**Pricing Options (Philippines)**
```
Option 1: Free 30-Day Trial
- Duration: Jun 15 - Jul 15
- Access: Full system
- Support: Email + phone
- Goal: 70% conversion to paid

Option 2: Paid Subscription
- Monthly: ₱25,000 (~$450)
- Setup fee: ₱10,000 (one-time)
- Includes: 20 hours onboarding + 90 days support
- Commitment: 6 months

Contract Terms:
- If trial → 70% convert → ₱25,000 × 0.7 = ₱17,500 expected
- If paid → ₱25,000 immediately
```

**Contract (Tagalog-English)**
```markdown
## SERBISYO AGREEMENT / SERVICE AGREEMENT

### Mga Partido / Parties
- Provider: ElSpa Manager Philippines (BIR Registered)
- Customer: [Spa Name] (Owner: [Name])

### Serbisyo / Services
1. Online Booking System (24/7 reservations)
2. Automatic Therapist Payroll
3. BIR-Compliant Tax Receipts
4. Customer Database (CRM)
5. SMS Notifications

### Presyo / Pricing
Monthly Subscription: ₱25,000
Setup Fee: ₱10,000 (One-time)
Payment Method: GCash / Bank Transfer

### Suporta / Support
- Onboarding: 20 hours (2 weeks)
- Technical Support: 24/7 via Email/Chat
- Training: 4 hours for staff
- Updates: Included (no extra charge)

### Kontrata / Contract Terms
- Duration: 6 months (with auto-renewal)
- Cancellation: 30 days notice required
- Data: All customer data belongs to spa owner

### Tanda / Signature
Provider: _________________  Date: _________
Customer: _________________  Date: _________
```

**Responsibility**: Sales & Legal  
**Expected Price**: ₱25,000/month (paid) OR Trial

---

### Day 17-19: Data Migration & System Testing

**Checklist**
- [ ] Extract existing customer data (300-500 records)
- [ ] Therapist info entry (names, rates, shifts)
- [ ] Historical booking data import
- [ ] UAT testing (3 rounds with customer staff)
- [ ] GCash payment testing

**Migration Script** (Python)
```python
# backend/migration_ph.py

import pandas as pd
from sqlalchemy import insert
from app.models import Customer, Therapist, Reservation

async def migrate_ph_customer_data(excel_file: str):
    """
    Migrate customer data from Excel/handwritten records
    """
    df = pd.read_excel(excel_file, sheet_name="Customers")
    
    # Data cleaning (Philippine context)
    df['phone'] = df['phone'].str.replace('-', '').str.replace(' ', '')
    # Ensure 09XXXXXXXXX format for GCash
    df['phone'] = df['phone'].apply(
        lambda x: '0' + x[-10:] if len(x) == 10 else x
    )
    df['created_at'] = pd.to_datetime(df['created_at'])
    df = df.drop_duplicates(subset=['phone'])
    
    # Import to DB
    for _, row in df.iterrows():
        customer = Customer(
            name=row['name'],
            phone=row['phone'],
            email=row.get('email'),
            created_at=row['created_at'],
            preferred_service=row.get('service'),  # e.g., "Massage", "Facial"
        )
        await db.execute(insert(Customer).values(**customer.__dict__))
    
    return {"migrated": len(df), "status": "success"}

async def migrate_therapist_payroll(excel_file: str):
    """
    Import therapist rates & schedule
    """
    df = pd.read_excel(excel_file, sheet_name="Staff")
    
    for _, row in df.iterrows():
        therapist = Therapist(
            name=row['Name'],
            position=row['Title'],  # Terapis, Masahista, etc.
            hourly_rate=int(row['Rate (Pesos)']),  # e.g., 500
            weekly_schedule=row.get('Schedule'),  # "Mon-Fri 10-18"
            status="active"
        )
        await db.execute(insert(Therapist).values(**therapist.__dict__))
    
    # Auto-calculate salary based on actual hours worked
    await calculate_monthly_payroll()
    
    return {"imported": len(df), "payroll_calculated": True}

async def calculate_monthly_payroll():
    """
    Calculate therapist salaries based on booking hours
    """
    therapists = await db.execute(select(Therapist))
    
    for therapist in therapists:
        # Get therapist's actual bookings this month
        bookings = await db.execute(
            select(Reservation)
            .where(Reservation.therapist_id == therapist.id)
            .where(extract('month', Reservation.booking_date) == current_month)
        )
        
        total_minutes = sum([b.duration_minutes for b in bookings])
        total_hours = total_minutes / 60
        salary = total_hours * therapist.hourly_rate
        
        # Generate BIR receipt
        receipt = generate_bir_receipt(therapist, salary)
        
        # Log for payment
        log_payroll_entry(therapist, salary, receipt)
    
    return {"processed": len(therapists)}
```

**UAT Checklist**
```
Round 1 (Day 17):
□ Customer data import (verify 5 samples)
□ Therapist list display
□ Booking creation (test 10 bookings)
□ System responsiveness

Round 2 (Day 18):
□ Payroll calculation accuracy (3 therapists tested)
□ BIR receipt format validation
□ Mobile app functionality
□ SMS notifications

Round 3 (Day 19):
□ GCash payment testing (mock transaction)
□ Reporting (daily/weekly/monthly views)
□ Admin dashboard
□ Staff permissions

Overall: System ready for Go-Live
```

**Responsibility**: Technical Team  
**Completion**: By Day 19

---

### Day 20-21: Staff Training & Go-Live

**4-Hour Training Program**
```
Hour 1: System Overview
- What ElSpa Manager does
- Benefits for spa (efficiency, revenue)
- User roles (Owner, Manager, Therapist)

Hour 2: Booking Management
- Creating reservations
- Customer preferences
- Handling cancellations
- Mobile app for therapists

Hour 3: Payroll & Receipts
- How automatic payroll works
- Reviewing salary calculations
- BIR receipt generation
- Month-end processes

Hour 4: Support & FAQ
- Common issues & solutions
- Where to find help (email, phone, chat)
- Emergency contacts
```

**Tagalog Training Guide (Key Pages)**
```markdown
# ElSpa Manager Gabay (Tagalog Guide)

## 1. Pag-login (Login)
- Visit: https://elspa.ph
- Username: [provided]
- Password: [provided]
- First time: Change password

## 2. Booking System
- Mag-click "Create Booking"
- Piliin ang customer, service, date/time
- I-assign sa therapist
- Mag-save

## 3. Automatic Payroll
- System calculates: Hours × Hourly Rate
- Example: 5 hours × ₱500/hour = ₱2,500
- Verified by manager
- Released on payday

## 4. BIR Receipt
- Month-end: Receipt generated automatically
- Print or email to therapist
- Keep copy for tax records

## Emergency Contacts
- Email: support@elspa.ph
- Phone: +63-32-XXX-XXXX
- Chat: In-app messenger
```

**Go-Live Event** (Jun 20, 4 PM)
```
Participants:
- Spa owner/manager
- 2-3 staff members
- Our Customer Success Manager
- Technical support on standby

Agenda (1 hour):
1. Welcome & excitement! 🎉
2. System overview (10 min)
3. First booking test (10 min)
4. Q&A (10 min)
5. Support intro (10 min)
6. Celebration (20 min)

Post-launch:
- Send thank you message
- Weekly check-in call
- Offer additional training if needed
```

**Responsibility**: Customer Success Manager  
**Expected Outcome**: Customer 1 live & productive

---

## 🎯 Week 4: Momentum & Expansion Prep (Jun 22-30)

### Day 22-24: Customer 2 Onboarding (2nd Cebu Spa)

**Repeat Day 15-21 Flow**
- Day 22: Contract signature
- Day 23: Data migration & UAT
- Day 24: Go-Live & celebration

**Expected Timeline**: Day 24 go-live

---

### Day 25-27: Customer 3 & Bohol Expansion Prep

**Checklist**
- [ ] Onboard Customer 3 (or second trial)
- [ ] Identify 5 top Bohol spas (Tagbilaran, Panglao)
- [ ] Bohol market research (competition, pricing)
- [ ] Bohol office location scouting
- [ ] Schedule Bohol introductory meetings

**Bohol Market Analysis**
```
Bohol Target Spas:
1. Island Spa (Panglao) - 10 therapists, 180 bookings/month
2. Wellness Center (Tagbilaran) - 8 therapists
3. Beach Resort Spa - 12 therapists

Characteristics:
- Smaller than Cebu (population 1.5M vs 1.6M)
- High tourist traffic (beach resorts)
- Lower operating costs
- Growing market (40% YoY growth)

Strategy:
- Launch Bohol in July (after Cebu stabilization)
- Use Cebu case study as reference
- Same pricing as Cebu
- Hire 1-2 Bohol staff
```

**Responsibility**: Business Development  
**Expected Outcome**: Customer 3 live + Bohol groundwork

---

### Day 28-30: KPI Review & July Planning

**Monthly Metrics Dashboard**
```
┌─────────────────────────────────┐
│ June 2026 - Philippines         │
├─────────────────────────────────┤
│ Customers Onboarded: 2-3        │
│ Monthly Revenue: ₱50-75K        │
│ NPS Score: 45+                  │
│ System Uptime: 99.5%            │
│ Churn Rate: 0%                  │
└─────────────────────────────────┘

Revenue Projection:
- Customer 1: ₱25,000/month
- Customer 2: ₱25,000/month
- Customer 3 (trial): ₱0
= ₱50,000/month revenue

Cost Analysis:
- Office lease: ₱60,000
- Salaries (2 staff): ₱400,000
- Payment processing: ₱3,000
- Infrastructure: ₱15,000
- Marketing: ₱20,000
= ₱498,000/month total cost

Status: Negative margin (expected for Month 1)
Breakeven: 20 customers (₱500,000 MRR)
```

**June Retrospective** (June 29 Meeting)
```markdown
## Philippine Launch Review

### Wins ✅
1. First 2-3 customers live
2. Cebu office operational
3. Legal setup completed
4. Payment gateways integrated
5. Accountant partnerships initiated

### Challenges 🚀
1. GCash integration took 2 days (expected 1)
2. Data migration complexity (manual records vary)
3. BIR receipt validation (required expert input)
4. Language barrier (solutions: hire Filipino staff)

### July Goals 🎯
1. 5-8 total customers (add 3-5)
2. ₱125,000 monthly revenue
3. NPS 60+
4. Bohol launch prep
5. Hire 1 additional customer success staff

### Action Items
- [ ] Develop Cebu case study video (marketing)
- [ ] Formalize accountant partnership agreements (BD)
- [ ] Plan Bohol launch (Jun 28-30)
- [ ] Automate SMS campaigns (tech)
- [ ] Hire Bohol manager (HR)
```

**Responsibility**: Country Manager

---

## 📊 Success Metrics (Month 1)

| Metric | Target | Status |
|--------|--------|--------|
| Customers | 3-4 | 🔄 |
| Revenue | ₱50-75K | 🔄 |
| NPS | 50+ | 🔄 |
| Uptime | 99.5% | 🔄 |
| Churn | 0% | 🔄 |

---

## 🔧 Technical Setup

### Infrastructure
- [ ] AWS Manila Region (ap-southeast-1)
- [ ] RDS PostgreSQL (db.t3.medium)
- [ ] S3 bucket for documents
- [ ] CloudFront CDN
- [ ] VPN security

### Localization
- [ ] GCash API integration
- [ ] Bank transfer APIs
- [ ] SMS notification system
- [ ] BIR receipt module
- [ ] Tagalog UI

### Monitoring
- [ ] Sentry error tracking
- [ ] DataDog performance
- [ ] Uptime Robot
- [ ] Daily backups

---

## 💰 June Budget (₱)

| Item | Cost |
|------|------|
| Office lease | ₱60,000 |
| Government permits | ₱30,000 |
| Salaries (2 staff) | ₱400,000 |
| Payment gateways | ₱40,000 |
| Infrastructure | ₱50,000 |
| Marketing | ₱50,000 |
| Contingency | ₱30,000 |
| **Total** | **₱660,000** |

---

## 👥 Team

| Role | Hire | Responsibilities |
|------|------|-----------------|
| Country Manager | Month 1 | Sales, partnerships, KPIs |
| Technical Lead | Month 1 | System setup, integrations |
| Customer Success | Month 1 | Onboarding, training, support |

---

## ✅ Signoff

- [ ] Country Manager approval
- [ ] CEO approval
- [ ] Finance approval

**Document Version**: 1.0  
**Created**: 2026-05-29
