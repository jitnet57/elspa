# ============================================================
# 📌 Google OAuth 2.0 서비스
# 📋 목적: Google Sheets API 접근을 위한 OAuth 인증
# 🔧 기능: 로그인, 토큰 갱신, Sheets 읽기/쓰기
# 📅 작성일: 2026-05-28
# ============================================================

import os
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, List
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
import logging

logger = logging.getLogger(__name__)


class GoogleOAuthService:
    """Google OAuth 2.0 및 Sheets API 관리 서비스"""

    def __init__(self):
        # OAuth 설정
        self.client_id = os.getenv("GOOGLE_CLIENT_ID")
        self.client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
        self.redirect_uri = os.getenv("GOOGLE_OAUTH_REDIRECT_URI")

        # Google Sheets 설정
        self.sheet_id = os.getenv("GOOGLE_SHEET_ID")
        self.sheet_range = os.getenv("GOOGLE_SHEET_RANGE", "SHEET_SCHEDULE!A1:I32")

        # Scopes
        self.scopes = ["https://www.googleapis.com/auth/spreadsheets"]

    def get_authorization_url(self, state: str = None) -> tuple:
        """
        Google OAuth 인증 URL 생성

        Returns:
            (authorization_url, flow) 튜플
        """
        flow = Flow.from_client_secrets_file(
            "client_secret.json",
            scopes=self.scopes,
            redirect_uri=self.redirect_uri,
            state=state,
        ) if os.path.exists("client_secret.json") else self._create_flow_from_env()

        authorization_url, state = flow.authorization_url(
            access_type="offline",
            include_granted_scopes="true",
        )

        return authorization_url, state, flow

    def _create_flow_from_env(self) -> Flow:
        """환경 변수에서 Flow 생성"""
        client_config = {
            "installed": {
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [self.redirect_uri],
            }
        }

        flow = Flow.from_client_config(
            client_config, scopes=self.scopes, redirect_uri=self.redirect_uri
        )
        return flow

    def exchange_code_for_token(self, code: str, state: str = None) -> Dict:
        """
        인증 코드를 토큰으로 교환

        Args:
            code: Google OAuth 인증 코드
            state: CSRF 토큰

        Returns:
            토큰 정보 (access_token, refresh_token, expires_in 등)
        """
        try:
            flow = self._create_flow_from_env()
            flow.fetch_token(code=code)
            credentials = flow.credentials

            # 토큰 정보 반환
            token_data = {
                "access_token": credentials.token,
                "refresh_token": credentials.refresh_token,
                "token_expiry": credentials.expiry.isoformat() if credentials.expiry else None,
                "scopes": credentials.scopes,
            }

            return token_data
        except Exception as e:
            logger.error(f"토큰 교환 실패: {e}")
            raise

    def get_sheets_service(self, credentials: Credentials):
        """
        Google Sheets 서비스 생성

        Args:
            credentials: OAuth 자격증명

        Returns:
            Google Sheets API 서비스 객체
        """
        return build("sheets", "v4", credentials=credentials)

    def read_sheet_data(self, credentials: Credentials) -> List[List]:
        """
        Google Sheet에서 데이터 읽기 (A:I, 행 1-32)

        Args:
            credentials: OAuth 자격증명

        Returns:
            Sheet 데이터 (2D 리스트)
        """
        try:
            service = self.get_sheets_service(credentials)
            result = (
                service.spreadsheets()
                .values()
                .get(spreadsheetId=self.sheet_id, range=self.sheet_range)
                .execute()
            )
            values = result.get("values", [])
            return values
        except Exception as e:
            logger.error(f"Sheet 데이터 읽기 실패: {e}")
            return []

    def append_booking_to_sheet(self, credentials: Credentials, booking_data: List) -> bool:
        """
        Google Sheet에 예약 데이터 추가

        Args:
            credentials: OAuth 자격증명
            booking_data: 추가할 데이터 (리스트)

        Returns:
            성공 여부
        """
        try:
            service = self.get_sheets_service(credentials)
            body = {"values": [booking_data]}

            service.spreadsheets().values().append(
                spreadsheetId=self.sheet_id,
                range=self.sheet_range.split("!")[0],  # 시트 이름만 추출
                valueInputOption="USER_ENTERED",
                body=body,
            ).execute()

            logger.info(f"Sheet에 예약 추가 완료: {booking_data}")
            return True
        except Exception as e:
            logger.error(f"Sheet 데이터 추가 실패: {e}")
            return False

    def update_sheet_data(
        self, credentials: Credentials, range_name: str, values: List[List]
    ) -> bool:
        """
        Google Sheet 데이터 업데이트

        Args:
            credentials: OAuth 자격증명
            range_name: 업데이트할 범위 (예: "SHEET_SCHEDULE!A1:I32")
            values: 업데이트할 데이터

        Returns:
            성공 여부
        """
        try:
            service = self.get_sheets_service(credentials)
            body = {"values": values}

            service.spreadsheets().values().update(
                spreadsheetId=self.sheet_id,
                range=range_name,
                valueInputOption="USER_ENTERED",
                body=body,
            ).execute()

            logger.info(f"Sheet 데이터 업데이트 완료: {range_name}")
            return True
        except Exception as e:
            logger.error(f"Sheet 데이터 업데이트 실패: {e}")
            return False

    def refresh_access_token(self, refresh_token: str) -> Optional[str]:
        """
        Refresh token으로 새 access token 획득

        Args:
            refresh_token: Refresh token

        Returns:
            새 access token, 또는 실패 시 None
        """
        try:
            credentials = Credentials(
                token=None,
                refresh_token=refresh_token,
                token_uri="https://oauth2.googleapis.com/token",
                client_id=self.client_id,
                client_secret=self.client_secret,
            )

            request = Request()
            credentials.refresh(request)
            return credentials.token
        except Exception as e:
            logger.error(f"토큰 갱신 실패: {e}")
            return None
