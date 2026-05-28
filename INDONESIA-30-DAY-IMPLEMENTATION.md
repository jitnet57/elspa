# Indonesia 30-Day Launch Playbook

> ElSpa Manager - Indonesia Launch Strategy (Jun 1-30, 2026)
> Location: Jakarta (Primary) + Bali (Prep)

---

## 📊 Goal (Target)

- **Month 1 Revenue**: IDR 400,000,000 (~$25,000 USD)
- **Customers**: 5-6 accounts
- **System Uptime**: 99.5%
- **NPS**: 50+

---

## 🎯 Week 1: Foundation (Jun 1-7)

### Day 1-2: Jakarta Office & Indonesian Legal Entity

**Checklist**
- [ ] Office lease (Central Jakarta - SCBD or Kuningan)
- [ ] PT (Perseroan Terbatas) registration
- [ ] Tax ID (NPWP - Nomor Pokok Wajib Pajak)
- [ ] Business license (SIUP, TDP)
- [ ] Bank account (BCA / BRI / Mandiri)

**Details**
```
Office Location: Jakarta Central (Kuningan/SCBD area)
Space: 40 sqm (5 desks, 1 conference room)
Rent: IDR 100,000,000/month (~$6,500 USD)

Indonesian Registration:
- PT (Limited Company) at Ministry of Law
- NPWP (Tax ID) from Tax Department
- SIUP (Business License) from Chamber of Commerce
- TDP (Company Registration) from District Office
- Social Security Registration (BPJAMSOSTEK)

Timeline: 5-7 business days
Cost: IDR 100,000,000
```

**Responsibility**: Operations Manager  
**Budget**: IDR 150,000,000

---

### Day 3-4: Indonesian Payment Gateway Integration

**Checklist**
- [ ] GoPay API (Indonesia's #1 e-wallet - 50M+ users)
- [ ] OVO integration (2nd largest - 100M+ users)
- [ ] DANA integration (3rd - growing fast)
- [ ] Bank transfer APIs (BCA, BRI, Mandiri)
- [ ] Xendit (popular aggregator in Indonesia)

**Technical Implementation**
```python
# backend/payment_id.py

from fastapi import APIRouter
from gopay_sdk import GoPayClient
from ovo_sdk import OVOClient
from xendit_sdk import XenditClient

router = APIRouter(prefix="/api/payment-id", tags=["payment-indonesia"])

# GoPay (most popular in Indonesia)
gopay = GoPayClient(
    client_id=os.getenv("GOPAY_CLIENT_ID"),
    server_key=os.getenv("GOPAY_SERVER_KEY")
)

@router.post("/charge-gopay")
async def charge_via_gopay(customer_id: int, amount_idr: int):
    """
    GoPay payment (Indonesia e-wallet #1)
    - Fee: 2.9%
    - Settlement: Same day
    - Phone: +62XXXXXXXXX format
    """
    payment = await gopay.create_payment(
        order_id=f"ELSPA-{customer_id}",
        gross_amount=amount_idr,
        payment_type="gopay",
        gopay={"customer_id": gopay_customer_id},
        custom_expiry={"expiry_time": 3600, "unit": "second"}
    )
    return payment

@router.post("/charge-ovo")
async def charge_via_ovo(customer_id: int, amount_idr: int):
    """
    OVO payment (2nd e-wallet in Indonesia)
    """
    payment = await ovo.request_payment(
        amount=amount_idr,
        phone_number=customer_phone,
        reference_id=f"ELSPA-{customer_id}"
    )
    return payment

@router.post("/charge-dana")
async def charge_via_dana(customer_id: int, amount_idr: int):
    """
    DANA (3rd e-wallet, growing fast)
    """
    payment = await dana_client.create_order(
        amount=amount_idr,
        user_id=customer_phone
    )
    return payment

@router.post("/charge-xendit")
async def charge_via_xendit(customer_id: int, amount_idr: int):
    """
    Xendit (Indonesian payment aggregator)
    Supports: GoPay, OVO, DANA, Cards, Bank Transfers
    """
    payment = await xendit.create_invoice(
        external_id=f"ELSPA-{customer_id}",
        amount=amount_idr,
        payer_email=customer.email,
        description="ElSpa Manager Monthly Subscription",
        invoices=[{
            "line_items": [{
                "name": "Monthly Subscription",
                "quantity": 1,
                "price": amount_idr
            }]
        }]
    )
    return payment

# Indonesian Tax Invoice (Faktur Pajak)
@router.post("/generate-tax-invoice")
async def generate_indonesian_tax_invoice(customer_id: int, amount_idr: int):
    """
    Generate Faktur Pajak (Indonesian tax invoice)
    Required for businesses with NPWP
    """
    invoice = {
        "nomor_faktur": generate_sequential_invoice_number(),
        "tanggal_faktur": datetime.now().strftime("%d/%m/%Y"),
        "penjual": {
            "nama": "PT ElSpa Manager Indonesia",
            "npwp": "12.345.678.9-012.000",
            "alamat": "Jakarta Pusat"
        },
        "pembeli": {
            "nama": customer.company_name or customer.name,
            "npwp": customer.npwp,
            "alamat": customer.address
        },
        "detail_transaksi": [{
            "uraian": "Langganan Software Bulanan",
            "jumlah": 1,
            "harga_satuan": amount_idr,
            "ppn": int(amount_idr * Decimal("0.10")),  # 10% VAT
            "total": int(amount_idr * Decimal("1.10"))
        }],
        "total_sebelum_ppn": amount_idr,
        "ppn": int(amount_idr * Decimal("0.10")),
        "total_setelah_ppn": int(amount_idr * Decimal("1.10"))
    }
    return invoice
```

**Responsibility**: Technical Team  
**Budget**: IDR 80,000,000

---

### Day 5-7: Indonesian Localization & Sales Script

**Checklist**
- [ ] UI translation to Indonesian (100%)
- [ ] Indonesian spa industry terminology
- [ ] Tax invoice format (Faktur Pajak)
- [ ] Labor law payroll module
- [ ] Target spa list (Jakarta 20+, Bali 20+)

**Frontend Localization**
```typescript
// src/locales/id.json - New file

{
  "currency": "Rp",
  "language": "Bahasa Indonesia",
  "payment": {
    "gopay": "GoPay",
    "ovo": "OVO",
    "dana": "DANA",
    "bank_transfer": "Transfer Antar Bank",
    "credit_card": "Kartu Kredit",
    "method": "Metode Pembayaran"
  },
  "industry": {
    "massage": "Pijat",
    "spa": "Spa",
    "therapist": "Terapis",
    "beautician": "Tukang Rias",
    "manager": "Manajer",
    "owner": "Pemilik",
    "booking": "Pemesanan Layanan"
  },
  "tax": {
    "invoice": "Faktur Pajak",
    "npwp": "NPWP",
    "vat": "PPN (10%)",
    "total": "Total"
  },
  "payroll": {
    "salary": "Gaji",
    "hourly_rate": "Tarif Per Jam",
    "monthly_total": "Total Gaji Bulanan",
    "deductions": "Potongan"
  }
}
```

**Indonesian Labor Law & Payroll**
```python
# backend/payroll_id.py

from decimal import Decimal
from datetime import datetime

class IndonesiaPayroll:
    """
    Indonesia labor law compliance (Law No. 13/2003)
    """
    
    # Regional minimum wage (UMP) - varies by province
    PROVINCIAL_MINIMUM_WAGE = {
        "Jakarta": {
            "2026_6": 4_888_000,  # IDR per month (as of 2026)
            "daily": 4_888_000 / 21  # 21 working days/month
        },
        "West Java": {
            "2026_6": 4_540_000,
            "daily": 4_540_000 / 21
        },
        "Bali": {
            "2026_6": 3_820_000,
            "daily": 3_820_000 / 21
        },
        "East Java": {
            "2026_6": 3_810_000,
            "daily": 3_810_000 / 21
        },
        "Others": {
            "2026_6": 3_700_000,
            "daily": 3_700_000 / 21
        }
    }
    
    def __init__(self, therapist_name: str, province: str, daily_rate: int):
        self.therapist_name = therapist_name
        self.province = province
        self.daily_rate = daily_rate
        self.min_wage_info = self.PROVINCIAL_MINIMUM_WAGE.get(province, self.PROVINCIAL_MINIMUM_WAGE["Others"])
    
    def validate_rate(self) -> bool:
        """Ensure therapist rate meets Indonesian minimum wage"""
        return self.daily_rate >= self.min_wage_info["daily"]
    
    def calculate_monthly_salary(self, days_worked: int) -> dict:
        """
        Calculate monthly salary with Indonesian deductions:
        - Health insurance (BPJS Kesehatan): 4% employer, 4% employee
        - Social security (BPJS Ketenagakerjaan): 3.7% employer, 2% employee
        - Pension (Iuran Pensiun): 2% employer, 1% employee
        - Tax (PPh 21): Progressive
        """
        gross_salary = days_worked * self.daily_rate
        
        # Employee contributions
        health_insurance = Decimal(gross_salary) * Decimal("0.04")
        social_security = Decimal(gross_salary) * Decimal("0.02")
        pension_contribution = Decimal(gross_salary) * Decimal("0.01")
        
        total_contributions = health_insurance + social_security + pension_contribution
        taxable_income = Decimal(gross_salary) - total_contributions
        
        # PPh 21 (Indonesian income tax)
        pph_21 = self.calculate_pph21(int(taxable_income))
        
        net_salary = taxable_income - pph_21
        
        return {
            "gross_salary": int(gross_salary),
            "health_insurance": int(health_insurance),
            "social_security": int(social_security),
            "pension_contribution": int(pension_contribution),
            "total_contributions": int(total_contributions),
            "taxable_income": int(taxable_income),
            "pph_21": int(pph_21),
            "net_salary": int(net_salary),
            "currency": "IDR"
        }
    
    def calculate_pph21(self, taxable_income: int) -> Decimal:
        """
        Indonesian PPh 21 (Personal Income Tax)
        Simplified for therapists:
        - PTKP (Personal Tax Allowance) = IDR 54,000,000/year
        - Tax rates: 5% (0-50M), 15% (50-250M), 25% (250-500M), 30% (500M+)
        """
        # Simplified: Most therapists below taxable threshold
        if taxable_income < 4_500_000:  # Monthly threshold
            return Decimal(0)
        return Decimal(taxable_income) * Decimal("0.05")  # 5% rate (approximate)
    
    def generate_payslip_id(self) -> str:
        """Generate Indonesian payslip (Slip Gaji)"""
        pass
```

**Sales Script (Indonesian Context)**
```markdown
## Telepon Sales Script - Indonesia

### Pembukaan (3 menit)
"Halo, [Nama]! Saya [Nama Anda] dari ElSpa Manager.

Kami membantu spa dan massage memudahkan reservasi dan 
perhitungan gaji karyawan.

Bagaimana Anda saat ini mengelola pemesanan?"

### Identifikasi Masalah (2 menit)
Masalah umum:
- Pemesanan manual di buku/WhatsApp
- Perhitungan gaji rumit di Excel
- Kesulitan laporan pajak (Faktur Pajak)
- Data pelanggan tidak terorganisir

### Solusi (3 menit)
"Sistem kami menawarkan:
1. Booking online 24/7
2. Perhitungan gaji otomatis
3. Faktur Pajak otomatis (sesuai hukum Indonesia)
4. CRM database pelanggan
5. Integrasi GoPay/OVO/DANA"

### Demo (1 menit)
"Saya bisa tunjukkan demo singkat 15 menit, Kamis jam 2 sore?"

### Penutup
"Terima kasih. Saya hubungi kembali."
```

**Responsibility**: Marketing/Sales  
**Budget**: IDR 60,000,000

---

## 🎯 Week 2: Market Entry & Sales (Jun 8-14)

### Day 8-11: Cold Outreach (50+ spas in Jakarta + Bali)

**Checklist**
- [ ] Identify 20 Jakarta spas (target list)
- [ ] Identify 20+ Bali spas (for July launch prep)
- [ ] WhatsApp outreach to Jakarta spas
- [ ] Phone follow-ups
- [ ] Schedule 4-5 demos

**WhatsApp Template** (in Indonesian)
```
Halo [Nama Pemilik],

Kami ElSpa Manager - sistem yang otomatis atur booking & gaji 
karyawan spa/massage.

Saat ini booking sistem apa yang pakai?

Mau lihat demo 15 menit [hari/jam]? Tidak ada biaya.

Terima kasih,
[Nama Anda]
ElSpa Manager Indonesia
```

**Responsibility**: Sales Team  
**Expected**: 4-5 demos scheduled

---

### Day 12-14: Demos & First Contracts

**Pricing** (Indonesia)
```
Option 1: Free Trial
- 30 hari gratis (Jun 15 - Jul 15)
- Full access
- Target: 70% conversion

Option 2: Berlangganan
- Rp 30,000,000/bulan (~$1,900 USD)
- Setup fee: Rp 10,000,000 (sekali)
- Komitmen: 6 bulan minimum
```

**Responsibility**: Sales & CS  
**Expected**: 2-3 contracts

---

## 🎯 Week 3: Onboarding (Jun 15-21)

### Day 15-21: First 3-4 Customers Live

**Repeat onboarding process**
- Data migration
- Staff training
- Payment testing (GoPay/OVO)
- Go-Live celebration

**Responsibility**: Customer Success Manager

---

## 🎯 Week 4: Scaling & Bali Prep (Jun 22-30)

### Day 22-26: Customer 5-6 Onboarding

**Parallel onboarding for multiple customers**

---

### Day 27-30: Bali Market Research & KPI Review

**Bali Expansion Plan**
```
Why Bali:
- Tourism hub (4M+ annual visitors)
- High-end resort spas (Bulgari, Four Seasons, Mandarin Oriental)
- Local spas (100+ in Seminyak area)
- Higher pricing tolerance (international clientele)

Top Bali Spas:
1. Bulgari Spa - 20+ therapists (luxury)
2. Four Seasons Spa - 25+ therapists
3. Mandarin Oriental Spa - 30+ therapists
4. Healing Spa (Seminyak) - 15 therapists
5. Karsa Kafe Spa - 10 therapists (local)

Launch Plan: July 2026
- Hire Bali operations manager
- Scout office location (Seminyak or Canggu)
- Target: 3-5 hotel spas + local spas
```

**Monthly KPI Dashboard**
```
┌─────────────────────────────────┐
│ June 2026 - Indonesia           │
├─────────────────────────────────┤
│ Total Customers: 5-6            │
│ Monthly Revenue: IDR 150-180M   │
│ System Uptime: 99.5%            │
│ NPS Score: 48+                  │
│ Churn Rate: 0%                  │
└─────────────────────────────────┘

Revenue Breakdown:
- Customer 1: IDR 30M/month
- Customer 2: IDR 30M/month
- Customer 3-4: IDR 30M/month each
- Customer 5-6: IDR 30M/month (trials)
= IDR 150-180M/month

Cost Structure:
- Office: IDR 100M
- Salaries (3 staff): IDR 600M
- Payment processing: IDR 8M
- Infrastructure: IDR 40M
- Marketing: IDR 50M
- Contingency: IDR 50M
= IDR 848M/month

Status: Will reach breakeven by month 3-4
```

**July Targets**
```
1. 10-12 total customers (add 5-6)
2. IDR 300M+ monthly revenue
3. NPS 55+
4. Bali launch (3-5 customers)
5. Hire Bali regional manager
```

**Responsibility**: Country Manager

---

## 📊 Success Metrics (Month 1)

| Metric | Target | Status |
|--------|--------|--------|
| Customers | 5-6 | 🔄 |
| Revenue | IDR 150-180M | 🔄 |
| NPS | 50+ | 🔄 |
| Uptime | 99.5% | 🔄 |
| Churn | 0% | 🔄 |

---

## 🔧 Technical Setup

### Infrastructure
- [ ] AWS Singapore Region (ap-southeast-1)
- [ ] RDS PostgreSQL
- [ ] S3 + CloudFront
- [ ] VPN security

### Localization
- [ ] Indonesian UI (100%)
- [ ] GoPay/OVO integration
- [ ] Tax invoice (Faktur Pajak)
- [ ] Labor law payroll

### Monitoring
- [ ] Sentry, DataDog
- [ ] Uptime monitoring
- [ ] Daily backups

---

## 💰 June Budget (IDR)

| Item | Cost |
|------|------|
| Office | IDR 100M |
| Legal | IDR 150M |
| Salaries (3) | IDR 600M |
| Tech | IDR 80M |
| Marketing | IDR 70M |
| Contingency | IDR 100M |
| **Total** | **IDR 1.1B** |

---

## ✅ Signoff

- [ ] Country Manager
- [ ] CEO
- [ ] Finance

**Version**: 1.0  
**Created**: 2026-05-29
