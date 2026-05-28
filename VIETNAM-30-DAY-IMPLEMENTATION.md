# Vietnam 30-Day Launch Playbook

> ElSpa Manager - Vietnam Launch Strategy (Jun 1-30, 2026)
> Location: Ho Chi Minh City (HCMC)

---

## 📊 Goal (Mục tiêu)

- **Month 1 Revenue**: $6,500 USD (₫170,000,000 VND)
- **Customers**: 4-5 accounts
- **System Uptime**: 99.5%
- **NPS**: 50+

---

## 🎯 Week 1: Foundation (Jun 1-7)

### Day 1-2: HCMC Office & Vietnamese Legal Entity

**Checklist**
- [ ] Office lease (District 1 or District 7 - business hubs)
- [ ] Vietnamese company registration (Công ty TNHH)
- [ ] Tax ID registration (Mã số thuế)
- [ ] Bank account (Vietcombank / Techcombank)
- [ ] Import-Export License (if applicable)

**Details**
```
Office Location: District 1 (Nguyen Hue Boulevard area)
Space: 35 sqm (4 desks, 1 conference room)
Rent: ₫70,000,000/month (~$3,000 USD)

Vietnamese Registration:
- Limited Liability Company (Công ty TNHH)
- State enterprise registration
- Tax ID (13-digit number)
- Statistics registration
- Insurance registration

Timeline: 3-5 business days
Cost: ₫50,000,000 (legal + registration)
```

**Responsibility**: Operations Manager  
**Budget**: ₫80,000,000

---

### Day 3-4: Vietnamese Payment Gateway Integration

**Checklist**
- [ ] Momo API (most popular Vietnamese e-wallet - 50% market)
- [ ] Vietcombank online payment
- [ ] VNPay integration
- [ ] NAPAS (bank transfer standard)
- [ ] Stripe Vietnam (international backup)

**Technical Implementation**
```python
# backend/payment_vn.py

from fastapi import APIRouter
from momo_sdk import MomoClient
from vnpay_sdk import VNPayClient

router = APIRouter(prefix="/api/payment-vn", tags=["payment-vietnam"])

# Momo (most popular in Vietnam)
momo = MomoClient(
    partner_code=os.getenv("MOMO_PARTNER_CODE"),
    access_key=os.getenv("MOMO_ACCESS_KEY"),
    secret_key=os.getenv("MOMO_SECRET_KEY")
)

@router.post("/charge-momo")
async def charge_via_momo(customer_id: int, amount_vnd: int):
    """
    Momo payment (Vietnamese e-wallet, #1 choice)
    - Fee: 2%
    - Settlement: Next day
    - Phone number: 0XXXXXXXXX format
    """
    payment = await momo.create_payment(
        orderId=f"ELSPA-{customer_id}",
        amount=amount_vnd,
        orderInfo="ElSpa Manager Monthly Subscription",
        redirectUrl="https://elspa.vn/payment/success",
        ipnUrl="https://api.elspa.vn/webhook/momo"
    )
    return payment

@router.post("/charge-vnpay")
async def charge_via_vnpay(customer_id: int, amount_vnd: int):
    """
    VNPay (Vietnamese bank payment, 2nd choice)
    - Fee: 1.5%
    - Settlement: Same/next day
    - Works with most Vietnamese banks
    """
    payment = await vnpay.create_order(
        order_id=f"ELSPA-{customer_id}",
        amount=amount_vnd,
        bank_code="",  # Customer selects bank
        description="ElSpa Subscription"
    )
    return payment

# Vietnamese VAT/Tax handling
@router.post("/generate-invoice-vn")
async def generate_vietnamese_invoice(customer_id: int, amount_vnd: int):
    """
    Generate Vietnamese tax invoice (Hóa đơn giá trị gia tăng)
    """
    invoice = {
        "invoice_serial": "K20KD",  # Invoice series
        "invoice_number": generate_sequential_number(),
        "issue_date": datetime.now().strftime("%d/%m/%Y"),
        "seller_info": {
            "name": "ElSpa Manager Vietnam",
            "tax_id": "0123456789",  # Example
            "address": "District 1, HCMC"
        },
        "buyer_info": {
            "name": customer.company_name or customer.name,
            "tax_id": customer.tax_id or "Cá nhân",
            "address": customer.address
        },
        "items": [{
            "description": "Monthly Software Subscription",
            "quantity": 1,
            "price": amount_vnd,
            "tax_rate": "10%",  # Vietnamese VAT
            "tax_amount": amount_vnd * Decimal("0.10")
        }],
        "total_before_tax": amount_vnd,
        "total_tax": amount_vnd * Decimal("0.10"),
        "total_after_tax": amount_vnd * Decimal("1.10")
    }
    return invoice
```

**Responsibility**: Technical Team  
**Budget**: ₫50,000,000

---

### Day 5-7: Vietnamese Localization & Market Research

**Checklist**
- [ ] UI translation to Vietnamese (100%)
- [ ] Vietnamese spa/massage terminology
- [ ] Vietnamese tax invoice format
- [ ] Vietnamese labor law payroll
- [ ] Target customer list creation (20+ spas)

**Frontend Localization**
```typescript
// src/locales/vi.json - New file

{
  "currency": "₫",
  "language": "Tiếng Việt",
  "payment": {
    "momo": "Ví Momo",
    "vnpay": "VNPay",
    "bank_transfer": "Chuyển khoản ngân hàng",
    "credit_card": "Thẻ tín dụng",
    "method": "Phương thức thanh toán"
  },
  "industry": {
    "massage": "Massage",
    "spa": "Spa",
    "therapist": "Nhân viên massage",
    "manager": "Quản lý",
    "owner": "Chủ cửa hàng",
    "salon": "Salon làm đẹp",
    "booking": "Đặt lịch dịch vụ"
  },
  "tax": {
    "invoice": "Hóa đơn",
    "tax_id": "Mã số thuế",
    "vat": "Thuế GTGT (10%)",
    "total": "Tổng cộng"
  },
  "payroll": {
    "salary": "Lương",
    "hourly_rate": "Lương theo giờ",
    "monthly_total": "Tổng lương tháng",
    "deductions": "Khoản trừ"
  }
}
```

**Vietnamese Labor Law & Tax**
```python
# backend/payroll_vietnam.py

from decimal import Decimal
from datetime import datetime

class VietnamPayroll:
    """
    Vietnam labor law compliance (Law No. 10/2012/QH13)
    """
    
    # Vietnamese minimum wage varies by region
    REGIONAL_MINIMUM_WAGE = {
        "HCMC": {
            "2026_6": 4_680_000,      # ₫ per month
            "hourly": 4_680_000 / 176  # Assuming 176 hours/month
        },
        "Hanoi": {
            "2026_6": 4_350_000,
            "hourly": 4_350_000 / 176
        },
        "Da Nang": {
            "2026_6": 4_180_000,
            "hourly": 4_180_000 / 176
        },
        "Other": {
            "2026_6": 4_050_000,
            "hourly": 4_050_000 / 176
        }
    }
    
    def __init__(self, therapist_name: str, city: str, hourly_rate: int):
        self.therapist_name = therapist_name
        self.city = city
        self.hourly_rate = hourly_rate
        self.min_wage_info = self.REGIONAL_MINIMUM_WAGE.get(city, self.REGIONAL_MINIMUM_WAGE["Other"])
    
    def validate_rate(self) -> bool:
        """Ensure therapist rate meets Vietnamese minimum wage"""
        return self.hourly_rate >= self.min_wage_info["hourly"]
    
    def calculate_monthly_pay(self, hours_worked: int) -> dict:
        """
        Calculate monthly salary with Vietnamese deductions:
        - Health insurance: 3% (employee)
        - Social insurance: 8% (employee)
        - Unemployment: 1% (employee)
        - PIT (Personal Income Tax): Progressive rates
        """
        gross_salary = hours_worked * self.hourly_rate
        
        # Insurance deductions
        health_insurance = gross_salary * Decimal("0.03")
        social_insurance = gross_salary * Decimal("0.08")
        unemployment_insurance = gross_salary * Decimal("0.01")
        
        total_insurance = health_insurance + social_insurance + unemployment_insurance
        taxable_income = gross_salary - total_insurance
        
        # Vietnamese PIT (Progressive)
        pit = self.calculate_pit(int(taxable_income))
        
        net_salary = taxable_income - pit
        
        return {
            "gross_salary": int(gross_salary),
            "health_insurance": int(health_insurance),
            "social_insurance": int(social_insurance),
            "unemployment_insurance": int(unemployment_insurance),
            "total_insurance": int(total_insurance),
            "taxable_income": int(taxable_income),
            "pit": int(pit),
            "net_salary": int(net_salary),
            "currency": "VND"
        }
    
    def calculate_pit(self, taxable_income: int) -> Decimal:
        """
        Vietnamese Personal Income Tax (PIT)
        Progressive rates:
        - 0-5,000,000: 5%
        - 5,000,000-10,000,000: 10%
        - 10,000,000-18,000,000: 15%
        - 18,000,000-32,000,000: 20%
        - 32,000,000-52,000,000: 25%
        - 52,000,000-80,000,000: 30%
        - >80,000,000: 35%
        """
        if taxable_income <= 5_000_000:
            return Decimal(taxable_income) * Decimal("0.05")
        elif taxable_income <= 10_000_000:
            return Decimal("250000") + Decimal(taxable_income - 5_000_000) * Decimal("0.10")
        # ... and so on for other brackets
        return Decimal(0)  # Placeholder
    
    def generate_payslip(self) -> str:
        """Generate Vietnamese payslip (Phiếu lương)"""
        # Template in Vietnamese for compliance
        pass
```

**Top 20 Target Spas (HCMC)**
```
Rank | Business | District | Staff | Monthly Bookings | Contact
-----|----------|----------|-------|-----------------|--------
1    | Senses Spa | D1 | 18 | 350 | 0908-XXX-XXX
2    | Lotus Massage | D1 | 12 | 250 | 0912-XXX-XXX
3    | Authentic Spa | D3 | 15 | 280 | 0915-XXX-XXX
4    | Sanctuary | D2 | 10 | 180 | 0918-XXX-XXX
5    | ... (15 more)
```

**Responsibility**: Market Research / Localization  
**Budget**: ₫40,000,000

---

## 🎯 Week 2: Sales & Direct Outreach (Jun 8-14)

### Day 8-11: Cold Outreach to 50+ Spas

**Checklist**
- [ ] Send Zalo messages to top 20 (Zalo is #2 messenger after Messenger in Vietnam)
- [ ] Cold calls to 5-10 spas
- [ ] Email follow-ups
- [ ] Schedule 3-5 demos

**Outreach Sequence**
```
Day 8: Zalo outreach (20 spas)
- Zalo is preferred in Vietnam (more personal than email)
- "Hi [Owner], I found a system that automates your booking 
   and payroll. Can I show you a 15-min demo?"

Day 9: Phone follow-ups
- Call highest-priority spas from Zalo non-respondents
- Appointment setting

Day 10: More cold calls (10-15 new spas)

Day 11: Demo scheduling confirmations
- Expected: 3-5 demos booked
```

**Zalo Message Template** (in Vietnamese)
```
Xin chào [Tên chủ],

Mình là [Tên] từ ElSpa Manager - một hệ thống quản lý 
đặt lịch và tính lương tự động cho spa/massage.

Hiện tại bạn quản lý booking thế nào? Có gặp khó khăn không?

Mình có thể cho bạn xem demo nhanh 15 phút vào [ngày/giờ]?

Cảm ơn,
[Tên]
ElSpa Manager Vietnam
```

**Responsibility**: Sales Team  
**Expected Results**: 3-5 demos booked

---

### Day 12-14: Demos & Contract Negotiations

**Demo Flow (20 minutes)**
```
0-2 min: Greeting in Vietnamese/English
"Xin chào! ElSpa Manager giúp bạn quản lý spa dễ dàng hơn."

2-10 min: System demo
- Online booking
- Staff payroll
- Momo payment integration
- Vietnamese tax invoices

10-15 min: Q&A (in Vietnamese)
"Bạn cần thêm tính năng nào không?"

15-20 min: Next steps
"Thử miễn phí 30 ngày, sau đó quyết định."
```

**Pricing Options (Vietnam)**
```
Option 1: Free 30-Day Trial
- Duration: Jun 15 - Jul 15
- Goal: 70% conversion

Option 2: Paid
- Monthly: ₫20,000,000 (~$850 USD)
- Setup: ₫5,000,000 (one-time)
- Term: 6 months minimum
```

**Responsibility**: Sales & CS Team  
**Expected Results**: 1-2 contracts signed by Day 14

---

## 🎯 Week 3: First Customers (Jun 15-21)

### Day 15-16: Customer 1 Onboarding

**Checklist**
- [ ] Contract signature
- [ ] Data migration start
- [ ] Momo payment testing
- [ ] Vietnamese tax invoice validation

**Responsibility**: Customer Success Manager

---

### Day 17-19: Data Migration & Testing

**Vietnam-Specific Considerations**
```
1. Data Format
   - Names: Vietnamese diacritical marks (ă, ê, ô, etc.)
   - Phone: Vietnamese format (09XX-XXX-XXX or +84-9XX-XXX-XXX)
   - Currency: ₫ (dong)
   - Date format: DD/MM/YYYY (European style)

2. Payroll Validation
   - Check against regional minimum wage
   - Validate VAT calculations
   - Test tax invoice generation

3. Payment Testing
   - Momo sandbox environment
   - Confirm webhook functionality
```

**Responsibility**: Technical Team

---

### Day 20-21: Training & Go-Live

**Staff Training (4 hours, in Vietnamese)**
```
1 giờ: Giới thiệu hệ thống
2 giờ: Quản lý đặt lịch
0.5 giờ: Tính lương tự động
0.5 giờ: FAQ & Support
```

**Go-Live Ceremony**
```
Day 20 or 21, 3 PM (Vietnam time)
- Video call in Vietnamese
- Celebrate first customer success
- Follow-up: Daily check-ins for 1 week
```

**Responsibility**: Customer Success Manager

---

## 🎯 Week 4: Scaling (Jun 22-30)

### Day 22-24: Customer 2 Onboarding

**Repeat Week 3 flow for Customer 2**

---

### Day 25-27: Customer 3-4 & Future Planning

**Checklist**
- [ ] Customer 3 contract (goal)
- [ ] Scout potential partnerships (accountants, hotel chains)
- [ ] Research Hanoi market for July expansion

---

### Day 28-30: KPI Review & July Planning

**Monthly Metrics**
```
┌─────────────────────────────┐
│ June 2026 - Vietnam         │
├─────────────────────────────┤
│ Customers: 4-5              │
│ Revenue: ₫100-125M/month    │
│ NPS: 48+                    │
│ Uptime: 99.5%              │
│ Churn: 0%                   │
└─────────────────────────────┘
```

**July Targets**
```
1. 8-10 total customers
2. ₫200M monthly revenue
3. Hanoi launch (2-3 customers)
4. Accountant partnerships (2+)
```

**Responsibility**: Country Manager

---

## 📊 Success Metrics

| Metric | Target |
|--------|--------|
| Customers | 4-5 |
| Revenue | ₫100-125M |
| NPS | 50+ |
| Uptime | 99.5% |

---

## 💰 Budget (₫)

| Item | Cost |
|------|------|
| Office | ₫70M |
| Legal | ₫80M |
| Salaries (2) | ₫400M |
| Tech | ₫60M |
| Marketing | ₫50M |
| Contingency | ₫40M |
| **Total** | **₫700M** |

---

## ✅ Signoff

- [ ] Country Manager
- [ ] CEO
- [ ] Finance

**Version**: 1.0  
**Created**: 2026-05-29
