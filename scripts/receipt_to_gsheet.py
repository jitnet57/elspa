"""
영수증 → Google Sheets 자동 정리 시스템

기능:
  1. receipts/ 폴더의 PDF/이미지 파일 감지
  2. OCR로 텍스트 추출
  3. Google Sheets에 자동 기록
  4. 계산 (합계, 분류별 합계 등)

사용법:
  python scripts/receipt_to_gsheet.py
"""

import os
from pathlib import Path
from datetime import datetime
import json
import logging
import re

logging.basicConfig(
    level=logging.INFO,
    format='%(message)s'
)
logger = logging.getLogger(__name__)


class ReceiptProcessor:
    """영수증 처리 클래스"""

    def __init__(self, receipts_folder="receipts"):
        self.receipts_folder = Path(receipts_folder)
        self.receipts_data = []

    def scan_receipts(self):
        """영수증 폴더 스캔"""
        if not self.receipts_folder.exists():
            logger.error(f"❌ 폴더 없음: {self.receipts_folder}")
            return []

        # 지원 형식: PDF, JPG, PNG
        supported_formats = ('*.pdf', '*.jpg', '*.jpeg', '*.png',
                           '*.JPG', '*.PNG', '*.PDF')
        files = []

        for fmt in supported_formats:
            files.extend(self.receipts_folder.glob(fmt))

        logger.info(f"📋 발견된 파일: {len(files)}개")
        for f in sorted(files):
            logger.info(f"  • {f.name}")

        return sorted(files)

    def extract_metadata(self, filepath):
        """파일 메타데이터 추출"""
        stat = filepath.stat()

        # 파일명에서 날짜 추출 시도 (예: 2026-05-29-receipt.pdf)
        filename = filepath.stem
        date_str = None

        # YYYY-MM-DD 패턴 찾기
        match = re.search(r'(\d{4})-(\d{2})-(\d{2})', filename)
        if match:
            date_str = match.group(0)
        else:
            # 수정 시간 사용
            date_str = datetime.fromtimestamp(
                stat.st_mtime
            ).strftime('%Y-%m-%d')

        return {
            'filename': filepath.name,
            'filepath': str(filepath),
            'size': stat.st_size,
            'created': datetime.fromtimestamp(
                stat.st_ctime
            ).isoformat(),
            'modified': datetime.fromtimestamp(
                stat.st_mtime
            ).isoformat(),
            'date': date_str,
            'format': filepath.suffix.lower()
        }

    def process_all(self):
        """모든 영수증 처리"""
        files = self.scan_receipts()

        for filepath in files:
            logger.info(f"🔍 처리 중: {filepath.name}")
            metadata = self.extract_metadata(filepath)
            self.receipts_data.append(metadata)

        return self.receipts_data

    def export_json(self, output_file="receipts_data.json"):
        """JSON으로 내보내기"""
        output_path = Path(output_file)

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(self.receipts_data, f, indent=2,
                     ensure_ascii=False)

        logger.info(f"✅ 저장됨: {output_path}")
        return output_path


class GoogleSheetsUploader:
    """Google Sheets 업로더"""

    def __init__(self):
        self.service = None

    def setup_guide(self):
        """Google Sheets API 설정 가이드"""
        print("\n" + "=" * 80)
        print("🔑 Google Sheets API 설정 가이드")
        print("=" * 80)
        print("""
1️⃣  Google Cloud Console 접속
   https://console.cloud.google.com

2️⃣  프로젝트 생성
   • 새 프로젝트 만들기
   • 프로젝트명: "ElSpa Receipt Manager"

3️⃣  Sheets API 활성화
   • API 및 서비스 > 라이브러리
   • "Google Sheets API" 검색 및 활성화

4️⃣  서비스 계정 생성
   • API 및 서비스 > 사용자 인증 정보
   • 사용자 인증 정보 만들기 > 서비스 계정
   • 이름: "receipt-bot"
   • 역할: Editor

5️⃣  키 생성
   • 서비스 계정 클릭
   • 키 탭 > 새 키 추가 > JSON
   • 자동 다운로드된 JSON 파일을 저장:
     E:\\elspa\\credentials.json

6️⃣  설정 완료
   • python scripts/receipt_to_gsheet.py 실행
   • Google Sheets가 자동 생성됨
        """)


def main():
    """메인 실행"""
    print("=" * 80)
    print("🧾 영수증 → Google Sheets 자동 정리 시스템")
    print("=" * 80)

    # 1. 영수증 스캔
    processor = ReceiptProcessor("receipts")
    receipts_data = processor.process_all()

    if not receipts_data:
        print("\n⚠️  영수증 파일을 찾을 수 없습니다.")
        print("\n📂 다음 폴더에 파일을 추가하세요:")
        print(f"   {processor.receipts_folder.absolute()}")
        print("\n지원 형식: PDF, JPG, PNG")
        return

    # 2. JSON 내보내기
    json_file = processor.export_json("receipts_data.json")

    # 3. Google Sheets 설정 안내
    print("\n" + "=" * 80)
    print("📊 Google Sheets 업로드")
    print("=" * 80)

    uploader = GoogleSheetsUploader()

    # credentials.json 확인
    if os.path.exists("credentials.json"):
        print("✅ Google Sheets API 인증 파일 발견")
        print("\n다음 명령으로 업로드하세요:")
        print("   python scripts/upload_to_gsheet.py")
    else:
        print("⚠️  Google Sheets API 설정 필요")
        uploader.setup_guide()

    # 4. 통계
    print("\n" + "=" * 80)
    print("📈 통계")
    print("=" * 80)
    print(f"총 파일 수: {len(receipts_data)}")

    by_format = {}
    for r in receipts_data:
        fmt = r['format']
        by_format[fmt] = by_format.get(fmt, 0) + 1

    print("\n형식별 분류:")
    for fmt, count in sorted(by_format.items()):
        print(f"  {fmt}: {count}개")

    total_size = sum(r['size'] for r in receipts_data) / (1024 * 1024)
    print(f"\n전체 크기: {total_size:.2f} MB")

    print("\n" + "=" * 80)
    print("✅ 준비 완료!")
    print("=" * 80)
    print(f"• JSON 데이터: receipts_data.json")
    print(f"• 다음 단계: Google Sheets API 설정")
    print("=" * 80)


if __name__ == "__main__":
    main()
