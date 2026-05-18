from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import NullPool
import os
from dotenv import load_dotenv

load_dotenv()

# 데이터베이스 URL 설정
DATABASE_URL = os.getenv("DATABASE_URL")

# SQLite 개발용 처리
if DATABASE_URL and DATABASE_URL.startswith("sqlite://"):
    # SQLite은 async를 위해 URL 변환
    async_database_url = DATABASE_URL.replace("sqlite://", "sqlite+aiosqlite:///")
else:
    # PostgreSQL은 asyncpg 사용
    async_database_url = (DATABASE_URL or "sqlite+aiosqlite:///./test.db").replace(
        "postgresql://", "postgresql+asyncpg://"
    )

# 동기 엔진 (기본)
engine = create_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    poolclass=NullPool,  # 느린 네트워크 환경에서 안정적
)

# 비동기 엔진 (고성능)
async_engine = create_async_engine(
    async_database_url,
    echo=False,
    pool_pre_ping=True,
    poolclass=NullPool,
)

# 세션 팩토리
SessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# ORM Base
Base = declarative_base()


async def get_db() -> AsyncSession:
    """데이터베이스 세션 디펜던시"""
    async with SessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """데이터베이스 초기화"""
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """데이터베이스 연결 종료"""
    await async_engine.dispose()
