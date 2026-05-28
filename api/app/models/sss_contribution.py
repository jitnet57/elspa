from sqlalchemy import Column, BigInteger, Integer, String, Numeric, DateTime, func
from app.database import Base


class SssContribution(Base):
    __tablename__ = "sss_contributions"

    id              = Column(BigInteger, primary_key=True, autoincrement=True)

    # 문서 메타 (같은 달 여러 행이 공유)
    company         = Column(String(200), nullable=True)
    employer_ss_no  = Column(String(50),  nullable=True)
    applicable_month = Column(String(50), nullable=False, index=True)  # "September 2024"
    invoice_no      = Column(String(100), nullable=True)

    # 직원 데이터
    employee_no     = Column(Integer, nullable=True)
    employee_name   = Column(String(200), nullable=False, default="")
    ss_number       = Column(String(50),  nullable=True)
    ss_amount       = Column(Numeric(12, 2), default=0)
    ec_amount       = Column(Numeric(12, 2), default=0)
    total_amount    = Column(Numeric(12, 2), default=0)

    created_at      = Column(DateTime, default=func.now())
    updated_at      = Column(DateTime, default=func.now(), onupdate=func.now())
