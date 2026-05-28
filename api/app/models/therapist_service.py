from sqlalchemy import Column, BigInteger, Numeric, DateTime, ForeignKey, UniqueConstraint, func
from app.database import Base


class TherapistService(Base):
    __tablename__ = "therapist_services"

    id = Column(BigInteger, primary_key=True)
    therapist_id = Column(BigInteger, ForeignKey("therapists.id", ondelete="CASCADE"), nullable=False)
    service_id = Column(BigInteger, ForeignKey("services.id", ondelete="CASCADE"), nullable=False)
    price_override = Column(Numeric(10, 2))
    created_at = Column(DateTime, default=func.now())

    __table_args__ = (
        UniqueConstraint("therapist_id", "service_id", name="uq_therapist_service"),
    )
