# ============================================================
# 📌 Settlement API Router
# 📋 Purpose: Provide settlement data for therapist/company payouts
# 🔧 Endpoints: GET settlements, POST initialize demo data
# 📤 Returns: Settlement info with mock data for demo
# ============================================================

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from typing import List

router = APIRouter(prefix="/api/settlements", tags=["settlements"])

# Mock Data Models
class TherapistSettlement(BaseModel):
    therapist_id: int
    therapist_name: str
    monthly_revenue: float
    commission_rate: float
    commission_amount: float
    deductions: float
    net_payout: float
    status: str
    settlement_date: str

class CompanySettlement(BaseModel):
    company_id: int
    company_name: str
    monthly_revenue: float
    platform_fee: float
    net_profit: float
    therapist_count: int
    status: str
    settlement_date: str

class SettlementGuide(BaseModel):
    id: int
    title: str
    content: str
    effective_date: str

# Mock Data Storage (In-memory for demo)
MOCK_THERAPIST_SETTLEMENTS: List[TherapistSettlement] = []
MOCK_COMPANY_SETTLEMENTS: List[CompanySettlement] = []
MOCK_SETTLEMENT_GUIDES: List[SettlementGuide] = []

def initialize_mock_data():
    """Initialize mock settlement data"""
    global MOCK_THERAPIST_SETTLEMENTS, MOCK_COMPANY_SETTLEMENTS, MOCK_SETTLEMENT_GUIDES

    # Mock Therapist Settlements (10 therapists matching guides)
    MOCK_THERAPIST_SETTLEMENTS = [
        TherapistSettlement(
            therapist_id=1,
            therapist_name="Sarah",
            monthly_revenue=32000,
            commission_rate=0.60,
            commission_amount=19200,
            deductions=500,
            net_payout=18700,
            status="completed",
            settlement_date="2026-05-05"
        ),
        TherapistSettlement(
            therapist_id=2,
            therapist_name="Emma",
            monthly_revenue=38000,
            commission_rate=0.62,  # +2% bonus for 20+ sessions
            commission_amount=23560,
            deductions=500,
            net_payout=22960,
            status="completed",
            settlement_date="2026-05-05"
        ),
        TherapistSettlement(
            therapist_id=3,
            therapist_name="Jessica",
            monthly_revenue=28000,
            commission_rate=0.60,
            commission_amount=16800,
            deductions=500,
            net_payout=16300,
            status="confirmed",
            settlement_date="2026-05-15"
        ),
        TherapistSettlement(
            therapist_id=4,
            therapist_name="Amanda",
            monthly_revenue=42000,
            commission_rate=0.63,  # +3% loyalty bonus for 50+ sessions
            commission_amount=26460,
            deductions=500,
            net_payout=25960,
            status="completed",
            settlement_date="2026-05-05"
        ),
        TherapistSettlement(
            therapist_id=5,
            therapist_name="Catherine",
            monthly_revenue=30000,
            commission_rate=0.60,
            commission_amount=18000,
            deductions=500,
            net_payout=17500,
            status="pending",
            settlement_date="2026-05-20"
        ),
        TherapistSettlement(
            therapist_id=6,
            therapist_name="Rachel",
            monthly_revenue=35000,
            commission_rate=0.62,  # +2% performance bonus
            commission_amount=21700,
            deductions=500,
            net_payout=21200,
            status="completed",
            settlement_date="2026-05-05"
        ),
        TherapistSettlement(
            therapist_id=7,
            therapist_name="Monica",
            monthly_revenue=26000,
            commission_rate=0.60,
            commission_amount=15600,
            deductions=500,
            net_payout=15100,
            status="confirmed",
            settlement_date="2026-05-15"
        ),
        TherapistSettlement(
            therapist_id=8,
            therapist_name="Diana",
            monthly_revenue=33000,
            commission_rate=0.61,  # +1% partial bonus
            commission_amount=20130,
            deductions=500,
            net_payout=19630,
            status="pending",
            settlement_date="2026-05-20"
        ),
        TherapistSettlement(
            therapist_id=9,
            therapist_name="Michelle",
            monthly_revenue=40000,
            commission_rate=0.62,  # +2% performance bonus
            commission_amount=24800,
            deductions=500,
            net_payout=24300,
            status="confirmed",
            settlement_date="2026-05-15"
        ),
        TherapistSettlement(
            therapist_id=10,
            therapist_name="Angela",
            monthly_revenue=29000,
            commission_rate=0.60,
            commission_amount=17400,
            deductions=500,
            net_payout=16900,
            status="pending",
            settlement_date="2026-05-20"
        ),
    ]

    # Mock Company Settlements (10 companies)
    # Formula: platform_fee = revenue * 25%, net_profit = revenue - platform_fee
    MOCK_COMPANY_SETTLEMENTS = [
        CompanySettlement(
            company_id=1,
            company_name="Makati Spa Center",
            monthly_revenue=150000,
            platform_fee=37500,  # 25% of 150000
            net_profit=112500,  # 150000 - 37500
            therapist_count=8,
            status="completed",
            settlement_date="2026-05-05"
        ),
        CompanySettlement(
            company_id=2,
            company_name="BGC Wellness Hub",
            monthly_revenue=120000,
            platform_fee=30000,  # 25% of 120000
            net_profit=90000,  # 120000 - 30000
            therapist_count=6,
            status="completed",
            settlement_date="2026-05-05"
        ),
        CompanySettlement(
            company_id=3,
            company_name="Taguig Health Spa",
            monthly_revenue=95000,
            platform_fee=23750,  # 25% of 95000
            net_profit=71250,  # 95000 - 23750
            therapist_count=5,
            status="pending",
            settlement_date="2026-06-05"
        ),
        CompanySettlement(
            company_id=4,
            company_name="Pasig Relax Resort",
            monthly_revenue=180000,
            platform_fee=45000,  # 25% of 180000
            net_profit=135000,  # 180000 - 45000
            therapist_count=10,
            status="completed",
            settlement_date="2026-05-05"
        ),
        CompanySettlement(
            company_id=5,
            company_name="Quezon City Massage",
            monthly_revenue=110000,
            platform_fee=27500,  # 25% of 110000
            net_profit=82500,  # 110000 - 27500
            therapist_count=5,
            status="completed",
            settlement_date="2026-05-05"
        ),
        CompanySettlement(
            company_id=6,
            company_name="Ortigas Wellness",
            monthly_revenue=165000,
            platform_fee=41250,  # 25% of 165000
            net_profit=123750,  # 165000 - 41250
            therapist_count=9,
            status="pending",
            settlement_date="2026-06-05"
        ),
        CompanySettlement(
            company_id=7,
            company_name="Manila Health Spa",
            monthly_revenue=140000,
            platform_fee=35000,  # 25% of 140000
            net_profit=105000,  # 140000 - 35000
            therapist_count=7,
            status="completed",
            settlement_date="2026-05-05"
        ),
        CompanySettlement(
            company_id=8,
            company_name="Cavite Spa Lounge",
            monthly_revenue=85000,
            platform_fee=21250,  # 25% of 85000
            net_profit=63750,  # 85000 - 21250
            therapist_count=4,
            status="completed",
            settlement_date="2026-05-05"
        ),
        CompanySettlement(
            company_id=9,
            company_name="Antipolo Therapy Center",
            monthly_revenue=105000,
            platform_fee=26250,  # 25% of 105000
            net_profit=78750,  # 105000 - 26250
            therapist_count=5,
            status="pending",
            settlement_date="2026-06-05"
        ),
        CompanySettlement(
            company_id=10,
            company_name="Laguna Premium Spa",
            monthly_revenue=175000,
            platform_fee=43750,  # 25% of 175000
            net_profit=131250,  # 175000 - 43750
            therapist_count=9,
            status="completed",
            settlement_date="2026-05-05"
        ),
    ]

    # Mock Settlement Guides (10 guides)
    MOCK_SETTLEMENT_GUIDES = [
        SettlementGuide(
            id=1,
            title="Settlement Rules",
            content="Monthly settlement period: 1st to last day. Payout: 5th business day.",
            effective_date="2026-01-01"
        ),
        SettlementGuide(
            id=2,
            title="Commission Structure",
            content="Base: 60%, Performance +2%, Loyalty +3%, Peak Season +5%",
            effective_date="2026-01-01"
        ),
        SettlementGuide(
            id=3,
            title="Payment Methods",
            content="Bank Transfer (BDO, BPI, Metrobank, Unionbank, PNB, GCash)",
            effective_date="2026-01-01"
        ),
        SettlementGuide(
            id=4,
            title="Tax Compliance Requirements",
            content="All therapists must provide BIR documentation. Annual filing required for tax purposes.",
            effective_date="2026-02-01"
        ),
        SettlementGuide(
            id=5,
            title="Deductions & Fees Policy",
            content="Standard deductions: 5% platform fee, 2% transaction fee. Additional fees for special requests.",
            effective_date="2026-01-15"
        ),
        SettlementGuide(
            id=6,
            title="Performance Bonus Structure",
            content="20+ sessions/month: +2%, 50+ sessions: +3%, 100+ sessions: +5%",
            effective_date="2026-03-01"
        ),
        SettlementGuide(
            id=7,
            title="Dispute Resolution Process",
            content="Claims must be filed within 30 days. Review committee meets on 3rd Monday of each month.",
            effective_date="2026-02-15"
        ),
        SettlementGuide(
            id=8,
            title="Therapist Insurance & Benefits",
            content="Mandatory insurance coverage for all therapists. Annual health check-up included.",
            effective_date="2026-01-01"
        ),
        SettlementGuide(
            id=9,
            title="Cancellation & Refund Policy",
            content="Cancellations within 24 hours are non-refundable. Emergency cancellations reviewed case-by-case.",
            effective_date="2026-02-01"
        ),
        SettlementGuide(
            id=10,
            title="Data Privacy & Confidentiality",
            content="Client and therapist data protected under PDPA. Misuse of data results in immediate termination.",
            effective_date="2026-03-01"
        ),
    ]

# Initialize on startup
initialize_mock_data()

# ============================================================
# API Endpoints
# ============================================================

@router.get("/therapist")
async def get_therapist_settlement(target_date: str = "2026-05-01"):
    """Get all therapist settlements for a target date (mock data)"""
    if not MOCK_THERAPIST_SETTLEMENTS:
        initialize_mock_data()
    return {
        "settlements": MOCK_THERAPIST_SETTLEMENTS,
        "target_date": target_date,
        "total": len(MOCK_THERAPIST_SETTLEMENTS),
        "source": "mock_data"
    }

@router.get("/therapists")
async def get_therapist_settlements():
    """Get all therapist settlements (mock data)"""
    if not MOCK_THERAPIST_SETTLEMENTS:
        initialize_mock_data()
    return {
        "data": MOCK_THERAPIST_SETTLEMENTS,
        "total": len(MOCK_THERAPIST_SETTLEMENTS),
        "source": "mock_data"
    }

@router.get("/companies")
async def get_company_settlements():
    """Get all company settlements (mock data)"""
    if not MOCK_COMPANY_SETTLEMENTS:
        initialize_mock_data()
    return {
        "data": MOCK_COMPANY_SETTLEMENTS,
        "total": len(MOCK_COMPANY_SETTLEMENTS),
        "source": "mock_data"
    }

@router.get("/guides")
async def get_settlement_guides():
    """Get settlement guides and rules"""
    if not MOCK_SETTLEMENT_GUIDES:
        initialize_mock_data()
    return {
        "data": MOCK_SETTLEMENT_GUIDES,
        "total": len(MOCK_SETTLEMENT_GUIDES),
        "source": "mock_data"
    }

@router.post("/initialize")
async def initialize_settlements():
    """Initialize/Reset settlement data to mock data"""
    initialize_mock_data()
    return {
        "status": "success",
        "message": "Settlement data initialized with mock data",
        "timestamp": datetime.now().isoformat(),
        "therapist_count": len(MOCK_THERAPIST_SETTLEMENTS),
        "company_count": len(MOCK_COMPANY_SETTLEMENTS),
        "guide_count": len(MOCK_SETTLEMENT_GUIDES)
    }

@router.post("/reset")
async def reset_settlements():
    """Complete reset of settlement data (admin only)"""
    global MOCK_THERAPIST_SETTLEMENTS, MOCK_COMPANY_SETTLEMENTS, MOCK_SETTLEMENT_GUIDES

    MOCK_THERAPIST_SETTLEMENTS = []
    MOCK_COMPANY_SETTLEMENTS = []
    MOCK_SETTLEMENT_GUIDES = []

    return {
        "status": "success",
        "message": "Settlement data completely reset",
        "timestamp": datetime.now().isoformat()
    }

@router.get("/status")
async def get_settlement_status():
    """Get current settlement data status"""
    return {
        "therapists_loaded": len(MOCK_THERAPIST_SETTLEMENTS) > 0,
        "companies_loaded": len(MOCK_COMPANY_SETTLEMENTS) > 0,
        "guides_loaded": len(MOCK_SETTLEMENT_GUIDES) > 0,
        "therapist_count": len(MOCK_THERAPIST_SETTLEMENTS),
        "company_count": len(MOCK_COMPANY_SETTLEMENTS),
        "guide_count": len(MOCK_SETTLEMENT_GUIDES),
        "last_initialized": datetime.now().isoformat()
    }
