#!/usr/bin/env python3
"""
이미지를 WebP 형식으로 변환하는 스크립트
JPEG/PNG → WebP (경량화)
"""

import os
from pathlib import Path
from PIL import Image

# 설정
IMAGES_DIR = Path("frontend/public/images")
QUALITY = 80  # WebP 품질 (1-100, 기본값 80)
MAX_WIDTH = 1200  # 최대 너비 (반응형 최적화)

def convert_to_webp(input_path, output_path, quality=80, max_width=1200):
    """이미지를 WebP로 변환"""
    try:
        # 이미지 열기
        img = Image.open(input_path)

        # RGB 변환 (PNG 투명도 제거)
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = background

        # 크기 최적화
        if img.width > max_width:
            ratio = max_width / img.width
            new_height = int(img.height * ratio)
            img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)

        # WebP로 저장
        img.save(output_path, 'WEBP', quality=quality, method=6)

        # 파일 크기 비교
        original_size = input_path.stat().st_size / 1024
        webp_size = output_path.stat().st_size / 1024
        ratio = (1 - webp_size / original_size) * 100

        print(f"✅ {input_path.name}")
        print(f"   원본: {original_size:.1f}KB → WebP: {webp_size:.1f}KB ({ratio:.1f}% 절감)")

        return True
    except Exception as e:
        print(f"❌ {input_path.name}: {e}")
        return False

def main():
    print("=" * 60)
    print("🖼️  이미지를 WebP로 변환")
    print("=" * 60)
    print(f"📁 위치: {IMAGES_DIR.absolute()}")
    print(f"⚙️  품질: {QUALITY}, 최대폭: {MAX_WIDTH}px")
    print("=" * 60)
    print()

    converted = 0
    failed = 0

    # 각 카테고리 처리
    for category in ['facilities', 'services', 'reviews']:
        category_dir = IMAGES_DIR / category

        if not category_dir.exists():
            print(f"⚠️  {category} 폴더가 없습니다")
            continue

        print(f"\n📂 {category.upper()} 변환 중...")

        # JPG, PNG 파일 찾기
        for ext in ['*.jpg', '*.jpeg', '*.png', '*.JPG', '*.PNG']:
            for input_file in category_dir.glob(ext):
                output_file = input_file.with_suffix('.webp')

                if convert_to_webp(input_file, output_file, QUALITY, MAX_WIDTH):
                    converted += 1
                else:
                    failed += 1

    print()
    print("=" * 60)
    print(f"✨ 완료: {converted}개 변환, {failed}개 실패")
    print("=" * 60)
    print()
    print("📌 다음 단계:")
    print("1. frontend/public/images 폴더에서 WebP 파일 확인")
    print("2. 원본 JPG/PNG 파일 삭제 (선택사항)")
    print("3. HTML에서 .webp 확장자 사용")

if __name__ == "__main__":
    # Pillow 라이브러리 확인
    try:
        from PIL import Image
    except ImportError:
        print("❌ Pillow 라이브러리가 필요합니다")
        print("설치: pip install Pillow")
        exit(1)

    main()
