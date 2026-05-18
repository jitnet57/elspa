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

    # Mock Therapist Settlements
    MOCK_THERAPIST_SETTLEMENTS = [
        TherapistSettlement(
            therapist_id=1,
            therapist_name="Maria Santos",
            monthly_revenue=25000,
            commission_rate=0.60,
            commission_amount=15000,
            deductions=500,
            net_payout=14500,
            status="completed",
            settlement_date="2026-05-05"
        ),
        TherapistSettlement(
            therapist_id=2,
            therapist_name="Juan Cruz",
            monthly_revenue=28000,
            commission_rate=0.62,  # +2% bonus for 20+ sessions
            commission_amount=17360,
            deductions=500,
            net_payout=16860,
            status="completed",
            settlement_date="2026-05-05"
        ),
        TherapistSettlement(
            therapist_id=3,
            therapist_name="Ana Garcia",
            monthly_revenue=22000,
            commission_rate=0.60,
            commission_amount=13200,
            deductions=500,
            net_payout=12700,
            status="pending",
            settlement_date="2026-06-05"
        ),
    ]

    # Mock Company Settlements (10 companies)
    MOCK_COMPANY_SETTLEMENTS = [
        CompanySettlement(
            company_id=1,
            company_name="Makati Spa Center",
            monthly_revenue=150000,
            platform_fee=37500,  # 25%
            net_profit=52500,
            therapist_count=8,
            status="completed",
            settlement_date="2026-05-05"
        ),
        CompanySettlement(
            company_id=2,
            company_name="BGC Wellness Hub",
            monthly_revenue=120000,
            platform_fee=30000,  # 25%
            net_profit=42000,
            therapist_count=6,
            status="completed",
            settlement_date="2026-05-05"
        ),
        CompanySettlement(
            company_id=3,
            company_name="Taguig Health Spa",
            monthly_revenue=95000,
            platform_fee=23750,
            net_profit=33250,
            therapist_count=5,
            status="pending",
            settlement_date="2026-06-05"
        ),
        CompanySettlement(
            company_id=4,
            company_name="Pasig Relax Resort",
            monthly_revenue=180000,
            platform_fee=45000,
            net_profit=63000,
            therapist_count=10,
            status="completed",
            settlement_date="2026-05-05"
        ),
        CompanySettlement(
            company_id=5,
            company_name="Quezon City Massage",
            monthly_revenue=110000,
            platform_fee=27500,
            net_profit=38500,
            therapist_count=5,
            status="completed",
            settlement_date="2026-05-05"
        ),
        CompanySettlement(
            company_id=6,
            company_name="Ortigas Wellness",
            monthly_revenue=165000,
            platform_fee=41250,
            net_profit=57750,
            therapist_count=9,
            status="pending",
            settlement_date="2026-06-05"
        ),
        CompanySettlement(
            company_id=7,
            company_name="Manila Health Spa",
            monthly_revenue=140000,
            platform_fee=35000,
            net_profit=49000,
            therapist_count=7,
            status="completed",
            settlement_date="2026-05-05"
        ),
        CompanySettlement(
            company_id=8,
            company_name="Cavite Spa Lounge",
            monthly_revenue=85000,
            platform_fee=21250,
            net_profit=29750,
            therapist_count=4,
            status="completed",
            settlement_date="2026-05-05"
        ),
        CompanySettlement(
            company_id=9,
            company_name="Antipolo Therapy Center",
            monthly_revenue=105000,
            platform_fee=26250,
            net_profit=36750,
            therapist_count=5,
            status="pending",
            settlement_date="2026-06-05"
        ),
        CompanySettlement(
            company_id=10,
            company_name="Laguna Premium Spa",
            monthly_revenue=175000,
            platform_fee=43750,
            net_profit=61250,
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
