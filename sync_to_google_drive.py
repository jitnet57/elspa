#!/usr/bin/env python3
# ============================================================
# 📌 Google Drive 자동 동기화 스크립트
# 📋 목적: ~/elspa/data/*.xlsx를 Google Drive에 자동 저장
# 🔧 사용: python3 sync_to_google_drive.py
# 📅 작성일: 2026-06-02
# ============================================================

import os
import json
from pathlib import Path
from google.auth.transport.requests import Request
from google.oauth2.service_account import Credentials
from google.cloud import drive_v3
from google.colab import auth
import openpyxl
from datetime import datetime

# 설정
DATA_DIR = Path.home() / "elspa" / "data"
SA_KEY_PATH = Path.home() / ".elspa" / "google-sa-key.json"
DRIVE_FOLDER_NAME = "ElSpa Data"

# ============================================================
# 🔐 Google Drive 인증
# ============================================================
def get_drive_service():
    """Google Drive API 서비스 인증"""
    try:
        credentials = Credentials.from_service_account_file(
            str(SA_KEY_PATH),
            scopes=['https://www.googleapis.com/auth/drive']
        )
        return drive_v3.build('drive', 'v3', credentials=credentials)
    except Exception as e:
        print(f"❌ 인증 실패: {e}")
        return None

# ============================================================
# 📁 Google Drive 폴더 생성/조회
# ============================================================
def get_or_create_folder(service, folder_name):
    """Google Drive에서 폴더 조회 또는 생성"""
    try:
        # 기존 폴더 조회
        results = service.files().list(
            q=f"name='{folder_name}' and mimeType='application/vnd.google-apps.folder' and trashed=false",
            spaces='drive',
            fields='files(id, name)',
            pageSize=1
        ).execute()

        files = results.get('files', [])
        if files:
            print(f"✅ 폴더 발견: {folder_name} (ID: {files[0]['id']})")
            return files[0]['id']

        # 폴더 생성
        file_metadata = {
            'name': folder_name,
            'mimeType': 'application/vnd.google-apps.folder'
        }
        folder = service.files().create(
            body=file_metadata,
            fields='id'
        ).execute()
        print(f"✅ 폴더 생성: {folder_name} (ID: {folder['id']})")
        return folder['id']
    except Exception as e:
        print(f"❌ 폴더 작업 실패: {e}")
        return None

# ============================================================
# 📤 파일 업로드
# ============================================================
def upload_file_to_drive(service, file_path, parent_folder_id):
    """XLSX 파일을 Google Drive에 업로드"""
    try:
        file_name = os.path.basename(file_path)

        # 기존 파일 삭제
        results = service.files().list(
            q=f"name='{file_name}' and trashed=false and '{parent_folder_id}' in parents",
            spaces='drive',
            fields='files(id)',
            pageSize=1
        ).execute()

        for file_id in [f['id'] for f in results.get('files', [])]:
            service.files().delete(fileId=file_id).execute()
            print(f"  - 기존 파일 삭제: {file_name}")

        # 새 파일 업로드
        file_metadata = {
            'name': file_name,
            'parents': [parent_folder_id]
        }
        media = drive_v3.MediaFileUpload(
            file_path,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )

        file = service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id'
        ).execute()

        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"✅ 업로드 완료: {file_name} ({timestamp})")
        return file['id']
    except Exception as e:
        print(f"❌ 업로드 실패: {e}")
        return None

# ============================================================
# 🔄 메인 동기화 함수
# ============================================================
def sync_to_google_drive():
    """~/elspa/data의 모든 XLSX 파일을 Google Drive에 동기화"""

    print("\n" + "="*60)
    print("🚀 Google Drive 동기화 시작")
    print("="*60 + "\n")

    # 1. 디렉토리 확인
    if not DATA_DIR.exists():
        print(f"❌ 데이터 디렉토리 없음: {DATA_DIR}")
        return False

    # 2. 서비스 인증
    service = get_drive_service()
    if not service:
        return False

    # 3. 메인 폴더 생성
    main_folder_id = get_or_create_folder(service, DRIVE_FOLDER_NAME)
    if not main_folder_id:
        return False

    print()

    # 4. 카테고리별 폴더 생성
    categories = {
        'bookings': '예약',
        'expenses': '비용',
        'attendance': '출결',
        'payroll': '급여'
    }

    category_folders = {}
    for key, korean_name in categories.items():
        folder_id = get_or_create_folder(service, korean_name)
        if folder_id:
            category_folders[key] = folder_id

    print()

    # 5. XLSX 파일 업로드
    uploaded_count = 0
    for xlsx_file in DATA_DIR.glob("*.xlsx"):
        file_stem = xlsx_file.stem  # 확장자 제외한 파일명

        # 카테고리 결정
        target_folder_id = None
        for key, folder_id in category_folders.items():
            if key in file_stem.lower():
                target_folder_id = folder_id
                break

        # 폴더가 없으면 메인 폴더 사용
        if not target_folder_id:
            target_folder_id = main_folder_id

        # 업로드
        if upload_file_to_drive(service, str(xlsx_file), target_folder_id):
            uploaded_count += 1

    print()
    print("="*60)
    print(f"✅ 동기화 완료: {uploaded_count}개 파일 업로드")
    print("="*60 + "\n")

    return True

# ============================================================
# 🎯 실행
# ============================================================
if __name__ == "__main__":
    sync_to_google_drive()
