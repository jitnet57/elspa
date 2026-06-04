"""
============================================================
📌 Structured Logging Configuration
📋 목적: JSON 포맷 로깅 및 다중 핸들러 설정
🔧 기능: 파일/콘솔 로깅, 수준별 구분, 컨텍스트 추가
📅 작성일: 2026-05-22
============================================================
"""

import logging
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any
from logging.handlers import RotatingFileHandler

# JSON 로거 선택적 설정 (pythonjsonlogger가 설치되어 있으면 사용)
try:
    from pythonjsonlogger import jsonlogger
    HAS_JSON_LOGGER = True
except ImportError:
    HAS_JSON_LOGGER = False


# ============================================================
# Custom JSON Formatter (pythonjsonlogger 없을 때)
# ============================================================
class CustomJsonFormatter(logging.Formatter):
    """커스텀 JSON 로그 포매터"""

    def format(self, record: logging.LogRecord) -> str:
        """로그 레코드를 JSON 문자열로 변환"""
        log_obj = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # 추가 컨텍스트 병합
        if hasattr(record, "extra_context"):
            log_obj.update(record.extra_context)

        # 예외 정보 추가
        if record.exc_info:
            log_obj["exception"] = {
                "type": record.exc_info[0].__name__,
                "message": str(record.exc_info[1]),
                "traceback": self.formatException(record.exc_info),
            }

        return json.dumps(log_obj, ensure_ascii=False)


# ============================================================
# 로그 설정 함수
# ============================================================
def setup_logging(
    log_level: str = "INFO",
    log_dir: Optional[str] = None,
    json_format: bool = True,
) -> None:
    """
    애플리케이션 로깅 설정

    Args:
        log_level: 로그 수준 (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_dir: 로그 파일 저장 디렉토리 (None이면 콘솔만 사용)
        json_format: JSON 포맷 사용 여부
    """

    # 루트 로거 설정
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level.upper())

    # 기존 핸들러 제거
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    # 포매터 선택
    if json_format and HAS_JSON_LOGGER:
        formatter = jsonlogger.JsonFormatter(
            "%(timestamp)s %(level)s %(name)s %(message)s"
        )
    elif json_format:
        formatter = CustomJsonFormatter()
    else:
        formatter = logging.Formatter(
            fmt="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )

    # 콘솔 핸들러
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)

    # 파일 핸들러 (선택)
    if log_dir:
        log_dir_path = Path(log_dir)
        log_dir_path.mkdir(parents=True, exist_ok=True)

        # 일반 로그 파일
        log_file = log_dir_path / "app.log"
        file_handler = RotatingFileHandler(
            log_file,
            maxBytes=10 * 1024 * 1024,  # 10MB
            backupCount=10,
        )
        file_handler.setFormatter(formatter)
        root_logger.addHandler(file_handler)

        # 에러 로그 파일
        error_log_file = log_dir_path / "error.log"
        error_handler = RotatingFileHandler(
            error_log_file,
            maxBytes=10 * 1024 * 1024,
            backupCount=10,
        )
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(formatter)
        root_logger.addHandler(error_handler)


# ============================================================
# 컨텍스트 로거
# ============================================================
class ContextLogger:
    """컨텍스트를 포함한 구조화된 로거"""

    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
        self.context: Dict[str, Any] = {}

    def set_context(self, **kwargs) -> "ContextLogger":
        """로그 컨텍스트 설정"""
        self.context.update(kwargs)
        return self

    def clear_context(self) -> "ContextLogger":
        """컨텍스트 초기화"""
        self.context.clear()
        return self

    def _log(
        self,
        level: int,
        message: str,
        exc_info=None,
        extra: Optional[Dict[str, Any]] = None,
    ) -> None:
        """내부 로깅 메서드"""
        log_data = {"extra_context": {**self.context}}
        if extra:
            log_data["extra_context"].update(extra)

        record = self.logger.makeRecord(
            name=self.logger.name,
            level=level,
            fn="",
            lno=0,
            msg=message,
            args=(),
            exc_info=exc_info,
        )
        record.extra_context = log_data["extra_context"]
        self.logger.handle(record)

    def debug(self, message: str, **kwargs) -> None:
        """DEBUG 레벨 로그"""
        self._log(logging.DEBUG, message, extra=kwargs)

    def info(self, message: str, **kwargs) -> None:
        """INFO 레벨 로그"""
        self._log(logging.INFO, message, extra=kwargs)

    def warning(self, message: str, **kwargs) -> None:
        """WARNING 레벨 로그"""
        self._log(logging.WARNING, message, extra=kwargs)

    def error(self, message: str, exc_info=None, **kwargs) -> None:
        """ERROR 레벨 로그"""
        self._log(logging.ERROR, message, exc_info=exc_info, extra=kwargs)

    def critical(self, message: str, exc_info=None, **kwargs) -> None:
        """CRITICAL 레벨 로그"""
        self._log(logging.CRITICAL, message, exc_info=exc_info, extra=kwargs)


# ============================================================
# 기본 로거
# ============================================================
def get_logger(name: str) -> logging.Logger:
    """로거 인스턴스 반환"""
    return logging.getLogger(name)


def get_context_logger(name: str) -> ContextLogger:
    """컨텍스트 로거 인스턴스 반환"""
    return ContextLogger(name)
