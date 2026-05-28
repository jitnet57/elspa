from sqlalchemy import Column, BigInteger, String, DateTime, func, Integer, Float, Text, Table, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

# Many-to-many 관계: Staff와 Service 연결
staff_services = Table(
    'staff_services',
    Base.metadata,
    Column('staff_id', BigInteger, ForeignKey('staffs.id'), primary_key=True),
    Column('service_id', BigInteger, ForeignKey('services.id'), primary_key=True),
    Column('expertise_level', String(20), default='intermediate'),  # expert, intermediate, basic
)


class Staff(Base):
    __tablename__ = "staffs"

    id = Column(BigInteger, primary_key=True)
    name = Column(String(255), nullable=False)
    phone = Column(String(20))
    position = Column(String(50))  # 마사지사, 테라피스트 등

    # 매칭 알고리즘을 위한 필드
    specialties = relationship("Service", secondary=staff_services, lazy="select")
    rating = Column(Float, default=4.0)  # 평점 (0.0 ~ 5.0)
    total_sessions = Column(Integer, default=0)  # 누적 세션 수
    month_sessions = Column(Integer, default=0)  # 이달 세션 수
    available_time = Column(String(50), default='available')  # available, busy, unavailable
    next_available_minute = Column(Integer, default=0)  # 다음 가용 시간 (분)
    bio = Column(Text)  # 프로필 설명

    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
