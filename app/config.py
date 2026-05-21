from pydantic_settings import BaseSettings
import os


class Settings(BaseSettings):
    """ElSpa 설정"""

    # Database
    database_url: str = os.getenv("DATABASE_URL", "")
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_key: str = os.getenv("SUPABASE_KEY", "")
    supabase_secret_key: str = os.getenv("SUPABASE_SECRET_KEY", "")
    supabase_jwt_token: str = os.getenv("SUPABASE_JWT_TOKEN", "")
    supabase_service_role_jwt: str = os.getenv("SUPABASE_SERVICE_ROLE_JWT", "")

    # Claude API
    anthropic_api_key: str = os.getenv("ANTHROPIC_API_KEY", "")

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

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
