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

        # Scopes (spreadsheets: 시트 읽기/쓰기, drive: 폴더 생성/파일 저장)
        self.scopes = [
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive",
        ]

        # Drive 루트 폴더명
        self.drive_root = os.getenv("GOOGLE_DRIVE_ROOT", "elspa")

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

    def get_drive_service(self, credentials: Credentials):
        """Google Drive 서비스 생성 (폴더/파일 관리용)"""
        return build("drive", "v3", credentials=credentials)

    # ============================================================
    # 📌 메서드명: find_or_create_folder
    # 📋 목적: 이름으로 Drive 폴더를 찾고 없으면 생성 (parent 하위)
    # 🔧 매개변수: drive, name, parent_id(없으면 내 드라이브 루트)
    # 📤 반환값: 폴더 id
    # 📅 작성일: 2026-06-02
    # ============================================================
    def find_or_create_folder(self, drive, name: str, parent_id: str = None) -> str:
        # 이름·폴더 타입·미삭제 조건으로 검색 (parent 지정 시 그 안에서만)
        safe = name.replace("'", "\\'")
        q = (
            f"name = '{safe}' and "
            f"mimeType = 'application/vnd.google-apps.folder' and trashed = false"
        )
        if parent_id:
            q += f" and '{parent_id}' in parents"
        res = drive.files().list(q=q, spaces="drive", fields="files(id, name)").execute()
        items = res.get("files", [])
        if items:
            return items[0]["id"]
        # 없으면 생성
        meta = {"name": name, "mimeType": "application/vnd.google-apps.folder"}
        if parent_id:
            meta["parents"] = [parent_id]
        folder = drive.files().create(body=meta, fields="id").execute()
        logger.info(f"Drive 폴더 생성: {name} ({folder['id']})")
        return folder["id"]

    # ============================================================
    # 📌 메서드명: create_sheet_in_folder
    # 📋 목적: 지정 폴더 안에 새 스프레드시트 생성 + 데이터 기록
    # 🔧 매개변수: credentials, folder_id, title, values(2차원)
    # 📤 반환값: {spreadsheetId, url}
    # 📅 작성일: 2026-06-02
    # ============================================================
    def create_sheet_in_folder(self, credentials: Credentials, folder_id: str, title: str, values: list) -> dict:
        drive = self.get_drive_service(credentials)
        # Drive 로 폴더 안에 빈 스프레드시트 파일 생성
        meta = {
            "name": title,
            "mimeType": "application/vnd.google-apps.spreadsheet",
            "parents": [folder_id],
        }
        created = drive.files().create(body=meta, fields="id").execute()
        spreadsheet_id = created["id"]
        # Sheets 로 데이터 기록
        if values:
            sheets = self.get_sheets_service(credentials)
            sheets.spreadsheets().values().update(
                spreadsheetId=spreadsheet_id,
                range="A1",
                valueInputOption="USER_ENTERED",
                body={"values": values},
            ).execute()
        url = f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/edit"
        logger.info(f"Drive 폴더({folder_id})에 시트 생성: {title} ({spreadsheet_id})")
        return {"spreadsheetId": spreadsheet_id, "url": url}

    # ============================================================
    # 📌 메서드명: _manage_backup
    # 📋 목적: 폴더 안 파일을 최대 2개 유지 (최신 + *.backup)
    #          저장 규칙:
    #           1) 기존 *.backup 파일이 있으면 영구 삭제 (Drive trash)
    #           2) 기존 최신 파일(non-backup)이 있으면 → 이름에 .backup 추가
    #           3) 새 파일 생성 → 항상 폴더 안 파일 2개 이하 유지
    # 📅 작성일: 2026-06-02
    # ============================================================
    def _manage_backup(self, drive, folder_id: str, category: str) -> None:
        # 폴더 안 파일 전체 조회 (폴더 제외)
        q = (
            f"'{folder_id}' in parents and trashed = false and "
            f"mimeType = 'application/vnd.google-apps.spreadsheet'"
        )
        res = drive.files().list(q=q, spaces="drive", fields="files(id,name)", orderBy="createdTime").execute()
        files = res.get("files", [])

        backups = [f for f in files if f["name"].endswith(".backup")]
        mains   = [f for f in files if not f["name"].endswith(".backup")]

        # 1) 기존 backup 파일 모두 삭제
        for f in backups:
            drive.files().delete(fileId=f["id"]).execute()
            logger.info(f"Drive backup 삭제: {f['name']} ({f['id']})")

        # 2) 기존 최신 파일 → .backup 으로 rename (가장 최근 1개만 유지, 나머지 삭제)
        if mains:
            # 가장 최근 것 1개만 backup으로 유지
            for f in mains[:-1]:   # 오래된 것들은 삭제
                drive.files().delete(fileId=f["id"]).execute()
                logger.info(f"Drive 구파일 삭제: {f['name']} ({f['id']})")
            latest = mains[-1]
            drive.files().update(
                fileId=latest["id"],
                body={"name": latest["name"] + ".backup"},
            ).execute()
            logger.info(f"Drive backup 지정: {latest['name']}.backup")

    # ============================================================
    # 📌 메서드명: export_to_drive
    # 📋 목적: elspa/<category> 폴더에 최신 파일 저장 (항상 2개 유지: 최신 + *.backup)
    # 🔧 매개변수: credentials, category, values, stamp
    # 📤 반환값: {spreadsheetId, url, folder, title}
    # ============================================================
    def export_to_drive(self, credentials: Credentials, category: str, values: list, stamp: str) -> dict:
        drive = self.get_drive_service(credentials)
        root_id = self.find_or_create_folder(drive, self.drive_root)   # elspa
        sub_id  = self.find_or_create_folder(drive, category, root_id) # elspa/<category>

        # 기존 파일 정리: backup 삭제 + 최신 → *.backup 으로 rename
        self._manage_backup(drive, sub_id, category)

        # 새 파일 생성
        title  = f"{category}_{stamp}"
        result = self.create_sheet_in_folder(credentials, sub_id, title, values)
        logger.info(f"Drive 새 파일: {title} ({result['spreadsheetId']})")
        return {**result, "folder": f"{self.drive_root}/{category}", "title": title}

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

    # ============================================================
    # 📌 메서드명: append_rows_to_sheet
    # 📋 목적: 2차원 배열(여러 행)을 시트 하단에 일괄 추가 (정산 리포트 내보내기용)
    # 🔧 매개변수: credentials(OAuth), values(List[List]), sheet_name(탭 이름, 기본=환경설정 시트)
    # 📤 반환값: 추가된 행 수 (실패 시 예외 발생)
    # 📅 작성일: 2026-06-02
    # ============================================================
    def append_rows_to_sheet(
        self, credentials: Credentials, values: List[List], sheet_name: str = None
    ) -> int:
        """여러 행을 한 번에 시트에 append.

        Args:
            credentials: OAuth 자격증명
            values: 추가할 2차원 데이터 (헤더 포함 가능)
            sheet_name: 대상 탭 이름. 미지정 시 GOOGLE_SHEET_RANGE 의 탭 사용.

        Returns:
            추가된 행 수
        """
        service = self.get_sheets_service(credentials)
        target = sheet_name or self.sheet_range.split("!")[0]  # 탭 이름만
        body = {"values": values}

        result = (
            service.spreadsheets()
            .values()
            .append(
                spreadsheetId=self.sheet_id,
                range=target,
                valueInputOption="USER_ENTERED",
                insertDataOption="INSERT_ROWS",
                body=body,
            )
            .execute()
        )
        updated = result.get("updates", {}).get("updatedRows", len(values))
        logger.info(f"Sheet '{target}' 에 {updated}행 추가 완료")
        return updated

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

    # ============================================================
    # 📌 메서드명: get_user_email
    # 📋 목적: Google UserInfo API로 연결된 계정 이메일 조회
    # 🔧 매개변수: credentials (OAuth 자격증명)
    # 📤 반환값: 이메일 문자열 또는 None (실패 시)
    # 📅 작성일: 2026-06-02
    # ============================================================
    def get_user_email(self, credentials) -> "str | None":
        from googleapiclient.discovery import build
        try:
            svc = build("oauth2", "v2", credentials=credentials)
            info = svc.userinfo().get().execute()
            return info.get("email")
        except Exception:
            return None

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
