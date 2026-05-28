# ============================================================
# 📌 Google Sheets API Router
# 📋 목적: Google Sheets 예약 데이터 관리 API
# 🔧 엔드포인트: OAuth, 예약 저장/조회
# 📅 작성일: 2026-05-28
# ============================================================

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from google.oauth2.credentials import Credentials
from app.services.google_oauth_service import GoogleOAuthService
import logging
import json

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/booking", tags=["Google Sheets Booking"])

oauth_service = GoogleOAuthService()

# 임시 토큰 저장소 (프로덕션에서는 DB 또는 Redis 사용)
user_tokens: dict = {}


class BookingData(BaseModel):
    """예약 데이터 모델"""
    duty_number: str  # 9-5PM DUTY N#
    service: str      # 1ST TRT
    start_time: str   # 1ST START
    end_time: str     # 1ST END
    room_number: str  # 1ST RM#
    guest_name: str   # 1ST GUEST
    notes: str        # 1ST NOTE
    pay: str          # 1ST PAY
    tip: str          # 1ST TIP


class TokenResponse(BaseModel):
    """토큰 저장 응답"""
    status: str
    message: str


@router.get("/auth/google")
async def get_google_auth_url():
    """
    Google OAuth 인증 URL 반환

    Returns:
        authorization_url: Google 로그인 URL
    """
    try:
        auth_url, state, _ = oauth_service.get_authorization_url()
        return {
            "authorization_url": auth_url,
            "state": state,
        }
    except Exception as e:
        logger.error(f"OAuth URL 생성 실패: {e}")
        raise HTTPException(status_code=500, detail="OAuth URL 생성 실패")


@router.post("/auth/google/callback")
async def google_callback(code: str, state: str = None):
    """
    Google OAuth 콜백 처리

    Args:
        code: Google 인증 코드
        state: CSRF 토큰

    Returns:
        토큰 정보 (저장됨)
    """
    try:
        # 인증 코드를 토큰으로 교환
        token_data = oauth_service.exchange_code_for_token(code, state)

        # 토큰 저장 (사용자별)
        user_tokens["default"] = token_data

        return {
            "status": "success",
            "message": "Google Sheets 연결 완료",
            "token_expiry": token_data.get("token_expiry"),
        }
    except Exception as e:
        logger.error(f"OAuth 콜백 처리 실패: {e}")
        raise HTTPException(status_code=400, detail="Google 인증 실패")


@router.post("/save")
async def save_booking(booking: BookingData):
    """
    예약 데이터를 Google Sheet에 저장

    Args:
        booking: 예약 데이터

    Returns:
        저장 결과
    """
    try:
        # 저장된 토큰 확인
        if "default" not in user_tokens:
            raise HTTPException(
                status_code=401,
                detail="Google Sheets에 연결되지 않았습니다. 먼저 /auth/google을 호출하세요."
            )

        token_data = user_tokens["default"]
        credentials = Credentials(token=token_data["access_token"])

        # 예약 데이터를 리스트로 변환
        booking_list = [
            booking.duty_number,
            booking.service,
            booking.start_time,
            booking.end_time,
            booking.room_number,
            booking.guest_name,
            booking.notes,
            booking.pay,
            booking.tip,
        ]

        # Sheet에 추가
        success = oauth_service.append_booking_to_sheet(credentials, booking_list)

        if success:
            return {
                "status": "success",
                "message": "예약이 Google Sheet에 저장되었습니다",
                "booking": booking.dict(),
            }
        else:
            raise HTTPException(status_code=500, detail="Sheet 저장 실패")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"예약 저장 실패: {e}")
        raise HTTPException(status_code=500, detail=f"예약 저장 실패: {str(e)}")


@router.get("/list")
async def list_bookings():
    """
    Google Sheet에서 모든 예약 데이터 조회

    Returns:
        예약 목록
    """
    try:
        # 저장된 토큰 확인
        if "default" not in user_tokens:
            return {
                "status": "error",
                "message": "Google Sheets에 연결되지 않았습니다",
                "bookings": [],
            }

        token_data = user_tokens["default"]
        credentials = Credentials(token=token_data["access_token"])

        # Sheet에서 데이터 읽기
        values = oauth_service.read_sheet_data(credentials)

        if not values:
            return {
                "status": "success",
                "message": "저장된 예약이 없습니다",
                "bookings": [],
            }

        # 헤더와 데이터 분리
        headers = values[0] if values else []
        bookings = [
            dict(zip(headers, row)) for row in values[1:] if len(row) == len(headers)
        ]

        return {
            "status": "success",
            "message": f"{len(bookings)}개의 예약을 조회했습니다",
            "bookings": bookings,
        }

    except Exception as e:
        logger.error(f"예약 조회 실패: {e}")
        raise HTTPException(status_code=500, detail=f"예약 조회 실패: {str(e)}")


@router.get("/status")
async def check_connection_status():
    """
    Google Sheets 연결 상태 확인

    Returns:
        연결 상태
    """
    is_connected = "default" in user_tokens
    return {
        "connected": is_connected,
        "message": "Google Sheets에 연결되었습니다" if is_connected else "연결 필요",
    }
