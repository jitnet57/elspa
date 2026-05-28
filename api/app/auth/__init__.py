"""
Authentication Module
"""

from app.auth.jwt import (
    create_access_token,
    create_refresh_token,
    verify_token,
    decode_token,
    extract_user_id,
    extract_user_email,
    extract_user_role,
    TokenPayload
)

from app.auth.dependencies import (
    get_current_user,
    require_admin,
    get_optional_user,
    TokenUser
)

__all__ = [
    # JWT functions
    "create_access_token",
    "create_refresh_token",
    "verify_token",
    "decode_token",
    "extract_user_id",
    "extract_user_email",
    "extract_user_role",
    "TokenPayload",
    # Dependencies
    "get_current_user",
    "require_admin",
    "get_optional_user",
    "TokenUser",
]
