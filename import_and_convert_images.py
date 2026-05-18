#!/usr/bin/env python3
"""
OneDrive의 ElSpa 이미지를 프로젝트에 복사하고 WebP로 변환
자동 분류: 이미지 크기/비율 기반
"""

import os
import shutil
from pathlib import Path
from PIL import Image

# 설정
SOURCE_DIR = Path(r"C:\Users\jitne\OneDrive\사진\elspa")
PROJECT_DIR = Path("frontend/public/images")
QUALITY = 80
MAX_WIDTH = 1200

# 카테고리 정의
CATEGORIES = {
    'facilities': [],  # 넓은 이미지 (시설)
    'services': [],    # 정사각형/중간 이미지 (마사지)
    'reviews': []      # 작은/프로필 이미지
}

def classify_image(img_path):
    """이미지 크기로 카테고리 분류"""
    try:
        img = Image.open(img_path)
        width, height = img.size
        aspect_ratio = width / height if height > 0 else 1

        # 분류 로직
        if aspect_ratio > 1.3:  # 넓은 이미지
            return 'facilities'
        elif 0.8 <= aspect_ratio <= 1.3:  # 거의 정사각형
            return 'services'
        else:  # 세로 이미지
            return 'reviews'
    except:
        return 'reviews'  # 기본값

def convert_to_webp(input_path, output_path, quality=80, max_width=1200):
    """이미지를 WebP로 변환"""
    try:
        img = Image.open(input_path)

        # RGB 변환
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'RGBA':
                background.paste(img, mask=img.split()[-1])
            else:
                background.paste(img)
            img = background

        # 크기 최적화
        if img.width > max_width:
            ratio = max_width / img.width
            new_height = int(img.height * ratio)
            img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)

        # WebP 저장
        img.save(output_path, 'WEBP', quality=quality, method=6)
        return True
    except Exception as e:
        print(f"❌ 변환 실패: {e}")
        return False

def main():
    print("=" * 70)
    print("🖼️  ElSpa 이미지 자동 분류 & WebP 변환")
    print("=" * 70)
    print(f"📁 소스: {SOURCE_DIR}")
    print(f"📁 대상: {PROJECT_DIR.absolute()}")
    print()

    # 카테고리 폴더 생성
    for category in CATEGORIES.keys():
        (PROJECT_DIR / category).mkdir(parents=True, exist_ok=True)

    # 이미지 찾기
    image_files = list(SOURCE_DIR.glob("*.jpg")) + list(SOURCE_DIR.glob("*.jpeg")) + list(SOURCE_DIR.glob("*.png"))
    image_files = [f for f in image_files if f.is_file()]

    print(f"📸 발견된 이미지: {len(image_files)}개\n")

    if not image_files:
        print("❌ 이미지를 찾을 수 없습니다")
        return

    # 이미지 분류
    print("🔍 이미지 분류 중...\n")
    classified = {}

    for img_file in sorted(image_files):
        category = classify_image(img_file)
        if category not in classified:
            classified[category] = []
        classified[category].append(img_file)

    # 카테고리별로 복사 & 변환
    total_saved = 0
    total_original_size = 0
    total_webp_size = 0

    for category in ['facilities', 'services', 'reviews']:
        if category not in classified or not classified[category]:
            print(f"⚠️  {category}: 이미지 없음")
            continue

        print(f"📂 {category.upper()} ({len(classified[category])} 이미지)")

        for idx, src_file in enumerate(classified[category][:5], 1):  # 각 카테고리당 최대 5개
            filename = f"{category}_{idx}"

            # 원본 복사
            jpg_path = PROJECT_DIR / category / f"{filename}.jpg"
            webp_path = PROJECT_DIR / category / f"{filename}.webp"

            try:
                # JPG로 먼저 복사/변환
                img = Image.open(src_file)
                if img.mode in ('RGBA', 'LA', 'P'):
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'RGBA':
                        background.paste(img, mask=img.split()[-1])
                    else:
                        background.paste(img)
                    img = background

                # 크기 최적화
                if img.width > MAX_WIDTH:
                    ratio = MAX_WIDTH / img.width
                    new_height = int(img.height * ratio)
                    img = img.resize((MAX_WIDTH, new_height), Image.Resampling.LANCZOS)

                img.save(jpg_path, 'JPEG', quality=85)
                img.save(webp_path, 'WEBP', quality=QUALITY, method=6)

                jpg_size = jpg_path.stat().st_size / 1024
                webp_size = webp_path.stat().st_size / 1024
                saving = (1 - webp_size / jpg_size) * 100

                print(f"  ✅ {filename}")
                print(f"     JPG: {jpg_size:.0f}KB → WebP: {webp_size:.0f}KB ({saving:.0f}% 절감)")

                total_original_size += jpg_size
                total_webp_size += webp_size
                total_saved += 1

            except Exception as e:
                print(f"  ❌ {filename}: {e}")

    print()
    print("=" * 70)
    print(f"✨ 완료: {total_saved}개 이미지 변환")
    print(f"💾 용량 절감: {total_original_size:.0f}KB → {total_webp_size:.0f}KB")
    print(f"   절감율: {(1 - total_webp_size/total_original_size)*100:.1f}%")
    print("=" * 70)

if __name__ == "__main__":
    try:
        from PIL import Image
    except ImportError:
        print("❌ Pillow 필요: pip install Pillow")
        exit(1)

    main()
