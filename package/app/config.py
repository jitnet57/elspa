from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """ElSpa 설정 (Sprint 12: Supabase 실제 연결)"""

    # Database
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:password@localhost:5432/elspa"
    )

    # Supabase 설정 (실제 연결 - Sprint 12)
    supabase_url: str = os.getenv("SUPABASE_URL", "https://your-project.supabase.co")
    supabase_key: str = os.getenv("SUPABASE_KEY", "your-anon-key")
    supabase_secret_key: str = os.getenv("SUPABASE_SECRET_KEY", "your-secret-key")
    supabase_jwt_token: str = os.getenv("SUPABASE_JWT_TOKEN", "")
    supabase_service_role_jwt: str = os.getenv("SUPABASE_SERVICE_ROLE_JWT", "")

    # Supabase 사용 플래그 (Mock → 실제 전환)
    use_supabase: bool = os.getenv("USE_SUPABASE", "false").lower() == "true"

    # Claude API
    anthropic_api_key: str = os.getenv("ANTHROPIC_API_KEY", "")

    # Google OAuth (선택사항) - 필드 선택적 처리
    google_client_id: Optional[str] = os.getenv("GOOGLE_CLIENT_ID")
    google_client_secret: Optional[str] = os.getenv("GOOGLE_CLIENT_SECRET")
    google_oauth_redirect_uri: str = os.getenv("GOOGLE_OAUTH_REDIRECT_URI", "http://localhost:8000/auth/google/callback")

    # Google Sheets API (선택사항) - 필드 선택적 처리
    google_sheet_id: Optional[str] = os.getenv("GOOGLE_SHEET_ID")
    google_sheet_range: str = os.getenv("GOOGLE_SHEET_RANGE", "Sheet1!A:Z")

    # Kakao Messenger
    kakao_rest_api_key: str = os.getenv("KAKAO_REST_API_KEY", "")
    kakao_app_id: str = os.getenv("KAKAO_APP_ID", "")
    kakao_admin_key: str = os.getenv("KAKAO_ADMIN_KEY", "")

    # WhatsApp Business API (Meta)
    whatsapp_token: str = os.getenv("WHATSAPP_TOKEN", "")
    whatsapp_phone_number_id: str = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
    whatsapp_verify_token: str = os.getenv("WHATSAPP_VERIFY_TOKEN", "elspa_verify")

    # Messenger Bot Shop URL
    shop_url: str = os.getenv("SHOP_URL", "https://elspa.com/booking")

    # Redis
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379")

    # Environment
    env: str = os.getenv("ENV", "development")
    debug: bool = os.getenv("DEBUG", "true").lower() == "true"

    # API
    api_title: str = "ElSpa Manager API"
    api_version: str = "0.1.0"

    # JWT 설정
    jwt_secret_key: str = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
    refresh_token_expire_days: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

    # API Host/Port
    api_host: str = os.getenv("API_HOST", "0.0.0.0")
    api_port: int = int(os.getenv("API_PORT", "8000"))

    # Frontend 환경 변수
    next_public_api_url: str = os.getenv("NEXT_PUBLIC_API_URL", "http://localhost:8000")
    next_public_ws_url: str = os.getenv("NEXT_PUBLIC_WS_URL", "ws://localhost:8000/ws")

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
