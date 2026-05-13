"""
Supabase 데이터베이스 연결 테스트
"""
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()


async def test_database_connection():
    """데이터베이스 연결 테스트"""
    print("🔍 Supabase 연결 테스트 시작...\n")

    # 환경 변수 확인
    db_url = os.getenv("DATABASE_URL")
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    supabase_secret = os.getenv("SUPABASE_SECRET_KEY")

    print("📋 환경 변수 상태:")
    print(f"  DATABASE_URL: {'✅ 설정됨' if db_url else '❌ 미설정'}")
    print(f"  SUPABASE_URL: {'✅ 설정됨' if supabase_url else '❌ 미설정'}")
    print(f"  SUPABASE_KEY: {'✅ 설정됨' if supabase_key else '❌ 미설정'}")
    print(f"  SUPABASE_SECRET_KEY: {'✅ 설정됨' if supabase_secret else '❌ 미설정'}")

    if not all([db_url, supabase_url, supabase_key, supabase_secret]):
        print("\n❌ 환경 변수가 불완전합니다.")
        print("필수 항목:")
        if not db_url:
            print("  - DATABASE_URL: 비밀번호 필요")
        return False

    print("\n✅ 모든 환경 변수 설정됨\n")

    # SQLAlchemy 비동기 연결 테스트
    try:
        from sqlalchemy.ext.asyncio import create_async_engine

        async_db_url = db_url.replace("postgresql://", "postgresql+asyncpg://")

        print("🔗 SQLAlchemy 비동기 엔진 생성 중...")
        engine = create_async_engine(async_db_url, echo=False)

        print("🧪 데이터베이스 연결 테스트 중...")
        async with engine.connect() as conn:
            result = await conn.execute("SELECT 1 as test")
            row = result.fetchone()
            print(f"✅ 쿼리 실행 성공: {row}\n")

        await engine.dispose()
        return True

    except Exception as e:
        print(f"❌ 연결 실패: {e}\n")
        return False


async def test_api_startup():
    """FastAPI 앱 시작 테스트"""
    print("🚀 FastAPI 앱 시작 테스트...\n")

    try:
        from main import app

        print("✅ FastAPI 앱 로드 성공")
        print(f"  - API 제목: {app.title}")
        print(f"  - API 버전: {app.version}")
        print(f"  - Debug 모드: {app.debug}\n")

        return True

    except Exception as e:
        print(f"❌ 앱 로드 실패: {e}\n")
        return False


async def main():
    """통합 테스트"""
    print("=" * 60)
    print("🧪 Supabase 연결 통합 테스트")
    print("=" * 60 + "\n")

    # 테스트 1: 데이터베이스 연결
    test1 = await test_database_connection()

    # 테스트 2: API 시작
    test2 = await test_api_startup()

    # 결과
    print("=" * 60)
    print("📊 테스트 결과")
    print("=" * 60)
    print(f"✅ 데이터베이스 연결: {'통과' if test1 else '실패'}")
    print(f"✅ FastAPI 앱 시작: {'통과' if test2 else '실패'}")

    if test1 and test2:
        print("\n🎉 모든 테스트 통과!")
        print("\n다음 명령으로 API 시작:")
        print("  python main.py")
        print("\n또는:")
        print("  uvicorn main:app --reload")
        return True
    else:
        print("\n⚠️  일부 테스트 실패. 위 오류를 확인하세요.")
        return False


if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)
