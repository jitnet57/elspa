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
from datetime import datetime
from pathlib import Path
import logging
import json

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/booking", tags=["Google Sheets Booking"])

oauth_service = GoogleOAuthService()

# 토큰 영구 저장 파일 경로
TOKEN_FILE = Path("data/google_tokens.json")

# 모듈 로드 시 기존 토큰 파일에서 복원
user_tokens: dict = {}
if TOKEN_FILE.exists():
    try:
        user_tokens = json.loads(TOKEN_FILE.read_text(encoding="utf-8"))
        logger.info("Google 토큰 파일에서 복원 완료")
    except Exception as _e:
        logger.warning(f"토큰 파일 로드 실패 (초기화): {_e}")


def save_tokens() -> None:
    """user_tokens를 TOKEN_FILE에 저장. data/ 디렉터리 없으면 자동 생성."""
    TOKEN_FILE.parent.mkdir(parents=True, exist_ok=True)
    TOKEN_FILE.write_text(json.dumps(user_tokens, ensure_ascii=False, indent=2), encoding="utf-8")
    logger.debug("Google 토큰 파일 저장 완료")


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

        # 연결된 계정 이메일 조회 후 token_data에 저장
        try:
            creds_for_email = Credentials(token=token_data["access_token"])
            email = oauth_service.get_user_email(creds_for_email)
            if email:
                token_data["email"] = email
        except Exception as _email_err:
            logger.warning(f"이메일 조회 실패(무시): {_email_err}")

        # 토큰 저장 (사용자별) + 파일 영속화
        user_tokens["default"] = token_data
        save_tokens()

        return {
            "status": "success",
            "message": "Google Sheets 연결 완료",
            "token_expiry": token_data.get("token_expiry"),
            "email": token_data.get("email"),
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


class SettlementExportData(BaseModel):
    """정산 리포트 → Google Sheet 내보내기 요청"""
    month: str                       # 정산 월 (예: "2026-05")
    report_type: str                 # monthly | company | guide
    rows: List[List]                 # 2차원 데이터 (헤더 포함 가능)
    sheet_name: Optional[str] = None  # 대상 탭 이름 (미지정 시 기본 탭)


@router.post("/settlement/export")
async def export_settlement_to_sheet(data: SettlementExportData):
    """정산 리포트 데이터를 Google Sheet에 일괄 추가

    프론트(정산 리포트 페이지)에서 CSV로 내보내던 동일 행 데이터를 받아
    Google Sheet 하단에 append 한다. 구글 미인증 시 401.
    """
    try:
        # 구글 인증 토큰 확인 (/auth/google 선행 필요)
        if "default" not in user_tokens:
            raise HTTPException(
                status_code=401,
                detail="구글 인증이 필요합니다. 먼저 /api/booking/auth/google 로 연결하세요.",
            )
        if not data.rows:
            raise HTTPException(status_code=400, detail="내보낼 정산 데이터가 없습니다.")

        token_data = user_tokens["default"]
        credentials = Credentials(token=token_data["access_token"])

        # 정산 전용 탭(기본 "SETTLEMENT")에 헤더 구분용 메타 행 + 데이터 추가
        target_sheet = data.sheet_name or "SETTLEMENT"
        meta_row = [f"[{data.month}] {data.report_type} 정산 리포트"]
        values = [meta_row] + data.rows

        appended = oauth_service.append_rows_to_sheet(credentials, values, target_sheet)

        return {
            "status": "success",
            "message": f"정산 리포트 {appended}행을 Google Sheet('{target_sheet}')에 추가했습니다.",
            "appended_rows": appended,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"정산 Sheet 내보내기 실패: {e}")
        raise HTTPException(status_code=500, detail=f"정산 Sheet 내보내기 실패: {str(e)}")


class ExpenseExportData(BaseModel):
    """비용(일일 지출) → Google Sheet 내보내기 요청"""
    date: str                        # 지출 일자 (예: "2026-06-02")
    rows: List[List]                 # 2차원 데이터 (헤더 포함 가능)
    sheet_name: Optional[str] = None  # 대상 탭 (미지정 시 "EXPENSE")


@router.post("/expense/export")
async def export_expense_to_sheet(data: ExpenseExportData):
    """일일 비용 데이터를 Google Sheet에 일괄 추가 (엑셀 대신)

    비용 페이지의 행 데이터를 받아 Google Sheet 하단에 append. 미인증 시 401.
    """
    try:
        if "default" not in user_tokens:
            raise HTTPException(
                status_code=401,
                detail="구글 인증이 필요합니다. 먼저 /api/booking/auth/google 로 연결하세요.",
            )
        if not data.rows:
            raise HTTPException(status_code=400, detail="내보낼 비용 데이터가 없습니다.")

        token_data = user_tokens["default"]
        credentials = Credentials(token=token_data["access_token"])

        target_sheet = data.sheet_name or "EXPENSE"
        meta_row = [f"[{data.date}] 일일 비용 (Daily Expense)"]
        values = [meta_row] + data.rows

        appended = oauth_service.append_rows_to_sheet(credentials, values, target_sheet)
        return {
            "status": "success",
            "message": f"비용 {appended}행을 Google Sheet('{target_sheet}')에 추가했습니다.",
            "appended_rows": appended,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"비용 Sheet 내보내기 실패: {e}")
        raise HTTPException(status_code=500, detail=f"비용 Sheet 내보내기 실패: {str(e)}")


# elspa Drive 하위 카테고리 폴더 (급여/예약/비용/수수료/매출)
DRIVE_CATEGORIES = {"급여", "예약", "비용", "수수료", "매출"}


class DriveExportData(BaseModel):
    """elspa Drive 폴더 저장 요청 — elspa/<category>/<category>_<날짜시간> 시트 생성"""
    category: str                    # 급여 | 예약 | 비용 | 수수료 | 매출
    rows: List[List]                 # 2차원 데이터 (헤더 포함 권장)
    title_prefix: Optional[str] = None  # 파일명 앞 추가 라벨(예: 월/날짜)


@router.post("/drive/export")
async def export_to_drive(data: DriveExportData):
    """elspa/<카테고리> 폴더에 '카테고리_YYYY-MM-DD_HHMM' 시트로 저장.

    폴더(elspa, 하위 카테고리)는 없으면 자동 생성. 파일명에 날짜·시간 반영.
    구글 미인증(드라이브 권한 포함)이면 401.
    """
    if data.category not in DRIVE_CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail=f"category 는 {sorted(DRIVE_CATEGORIES)} 중 하나여야 합니다.",
        )
    if not data.rows:
        raise HTTPException(status_code=400, detail="내보낼 데이터가 없습니다.")
    if "default" not in user_tokens:
        raise HTTPException(
            status_code=401,
            detail="구글 인증이 필요합니다(드라이브 권한 포함). /api/booking/auth/google 로 연결하세요.",
        )
    try:
        token_data = user_tokens["default"]
        credentials = Credentials(token=token_data["access_token"])
        # 날짜·시간 스탬프 (파일명 + 본문 상단)
        now = datetime.now()
        stamp = now.strftime("%Y-%m-%d_%H%M")
        prefix = (data.title_prefix + "_") if data.title_prefix else ""
        header_meta = [[f"{data.category} | {now.strftime('%Y-%m-%d %H:%M:%S')}"]]
        values = header_meta + data.rows

        result = oauth_service.export_to_drive(
            credentials, data.category, values, f"{prefix}{stamp}"
        )
        return {
            "status": "success",
            "message": f"'{result['folder']}/{result['title']}' 시트로 저장했습니다.",
            **result,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Drive 저장 실패: {e}")
        raise HTTPException(status_code=500, detail=f"Drive 저장 실패: {str(e)}")


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
        연결 상태 (연결 시 email, token_expiry, scopes 포함)
    """
    is_connected = "default" in user_tokens
    if not is_connected:
        return {"connected": False, "message": "연결 필요"}

    token_data = user_tokens["default"]
    return {
        "connected": True,
        "message": "Google Sheets에 연결되었습니다",
        "email": token_data.get("email"),
        "token_expiry": token_data.get("token_expiry"),
        "scopes": token_data.get("scopes"),
    }


@router.delete("/auth/google")
async def disconnect_google():
    """
    Google 연결 해제 — 메모리 토큰 및 토큰 파일 삭제

    Returns:
        해제 결과
    """
    user_tokens.clear()
    if TOKEN_FILE.exists():
        TOKEN_FILE.unlink()
        logger.info("Google 토큰 파일 삭제 완료")
    return {"status": "success", "message": "Google 연결을 해제했습니다."}
