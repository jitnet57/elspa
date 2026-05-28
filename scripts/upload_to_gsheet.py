"""
Google Sheets 업로더

JSON 데이터를 Google Sheets에 업로드하고
자동 계산 공식 추가

사용법:
  python scripts/upload_to_gsheet.py
"""

import json
import os
from datetime import datetime

def upload_receipts():
    """영수증 데이터를 Google Sheets에 업로드"""
    try:
        from google.oauth2.service_account import Credentials
        from googleapiclient.discovery import build
    except ImportError:
        print("❌ 필요한 라이브러리가 없습니다.")
        print("설치 명령:")
        print("  pip install google-auth-oauthlib google-api-python-client")
        return

    # 인증 파일 확인
    if not os.path.exists("credentials.json"):
        print("❌ credentials.json 파일을 찾을 수 없습니다.")
        print("📌 설정 가이드를 보려면:")
        print("  python scripts/receipt_to_gsheet.py")
        return

    # JSON 데이터 로드
    if not os.path.exists("receipts_data.json"):
        print("❌ receipts_data.json 파일을 찾을 수 없습니다.")
        print("먼저 다음을 실행하세요:")
        print("  python scripts/receipt_to_gsheet.py")
        return

    with open("receipts_data.json", 'r', encoding='utf-8') as f:
        receipts_data = json.load(f)

    # Google Sheets API 인증
    credentials = Credentials.from_service_account_file(
        "credentials.json",
        scopes=['https://www.googleapis.com/auth/spreadsheets']
    )

    service = build('sheets', 'v4', credentials=credentials)

    # 스프레드시트 생성
    spreadsheet_body = {
        'properties': {
            'title': f'ElSpa 영수증 정리 - {datetime.now().strftime("%Y-%m-%d %H:%M")}'
        },
        'sheets': [
            {
                'properties': {
                    'sheetId': 0,
                    'title': '영수증'
                }
            },
            {
                'properties': {
                    'sheetId': 1,
                    'title': '통계'
                }
            }
        ]
    }

    spreadsheet = service.spreadsheets().create(
        body=spreadsheet_body
    ).execute()

    spreadsheet_id = spreadsheet['spreadsheetId']
    print(f"✅ 스프레드시트 생성됨: {spreadsheet_id}")

    # 데이터 입력 - 영수증 탭
    headers = ['번호', '날짜', '파일명', '형식', '크기(KB)', '비고']

    values = [headers]
    for idx, receipt in enumerate(receipts_data, 1):
        values.append([
            idx,
            receipt['date'],
            receipt['filename'],
            receipt['format'],
            f"{receipt['size'] / 1024:.1f}",
            ''
        ])

    request = service.spreadsheets().values().update(
        spreadsheetId=spreadsheet_id,
        range='영수증!A1',
        valueInputOption='RAW',
        body={'values': values}
    ).execute()

    print(f"✅ 데이터 입력: {request['updatedRows']}행")

    # 통계 탭 설정
    stats_values = [
        ['통계 항목', '값'],
        ['총 파일 수', f'=COUNTA(영수증!A2:A)'],
        ['PDF 파일', f'=COUNTIF(영수증!D:D,"pdf")'],
        ['이미지 파일', f'=COUNTIF(영수증!D:D,"jpg")+COUNTIF(영수증!D:D,"png")'],
        ['전체 크기(MB)', f'=SUM(영수증!E2:E)/1024'],
        ['', ''],
        ['형식별 통계', ''],
        ['.pdf', f'=COUNTIF(영수증!D:D,"pdf")'],
        ['.jpg', f'=COUNTIF(영수증!D:D,"jpg")'],
        ['.png', f'=COUNTIF(영수증!D:D,"png")'],
    ]

    request = service.spreadsheets().values().update(
        spreadsheetId=spreadsheet_id,
        range='통계!A1',
        valueInputOption='USER_ENTERED',
        body={'values': stats_values}
    ).execute()

    print(f"✅ 통계 입력 완료")

    # 형식 설정 (선택사항)
    try:
        format_requests = [
            {
                'updateSheetProperties': {
                    'fields': 'gridProperties',
                    'properties': {
                        'sheetId': 0,
                        'gridProperties': {
                            'frozenRowCount': 1
                        }
                    }
                }
            }
        ]

        service.spreadsheets().batchUpdate(
            spreadsheetId=spreadsheet_id,
            body={'requests': format_requests}
        ).execute()

        print("✅ 헤더 행 고정")
    except:
        pass

    # 결과 출력
    print("\n" + "=" * 80)
    print("✅ Google Sheets 업로드 완료!")
    print("=" * 80)
    print(f"\n📊 스프레드시트 URL:")
    print(f"   https://docs.google.com/spreadsheets/d/{spreadsheet_id}/edit")
    print(f"\n📈 자동 계산 기능:")
    print("   • 총 파일 수")
    print("   • 형식별 분류 (PDF, JPG, PNG)")
    print("   • 전체 크기 계산")
    print("\n" + "=" * 80)

    return spreadsheet_id


if __name__ == "__main__":
    print("=" * 80)
    print("📤 Google Sheets 업로더")
    print("=" * 80)
    upload_receipts()
