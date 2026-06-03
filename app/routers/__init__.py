# API 라우터
try:
    from .massage_types import router as massage_types_router
except ImportError:
    massage_types_router = None

__all__ = ["massage_types_router"]
