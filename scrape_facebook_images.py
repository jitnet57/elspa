#!/usr/bin/env python3
"""
Facebook 이미지 다운로드 스크립트 (Playwright 사용)
ElPlaza.LapuLapu 페이지에서 이미지를 카테고리별로 다운로드
"""

import asyncio
import os
from pathlib import Path
from urllib.parse import urlparse
import aiohttp
from playwright.async_api import async_playwright

# 설정
FACEBOOK_URL = "https://www.facebook.com/ElPlaza.LapuLapu/photos"
OUTPUT_DIR = Path("frontend/public/images")
CATEGORIES = {
    "facilities": "시설 사진",
    "services": "마사지/서비스 진행",
    "reviews": "고객 만족도/후기"
}
IMAGES_PER_CATEGORY = 5

async def download_image(session, url, filepath):
    """이미지 다운로드"""
    try:
        async with session.get(url, timeout=10) as response:
            if response.status == 200:
                with open(filepath, 'wb') as f:
                    f.write(await response.read())
                return True
    except Exception as e:
        print(f"❌ 다운로드 실패: {url} - {e}")
    return False

async def scrape_facebook_images():
    """Facebook에서 이미지 스크래핑"""

    # 출력 디렉토리 생성
    for category in CATEGORIES.keys():
        (OUTPUT_DIR / category).mkdir(parents=True, exist_ok=True)

    async with async_playwright() as p:
        # 브라우저 실행
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        print(f"📸 Facebook 페이지 로드 중: {FACEBOOK_URL}")

        try:
            await page.goto(FACEBOOK_URL, wait_until="networkidle", timeout=30000)

            # 페이지 스크롤하여 이미지 로드
            print("🔄 페이지 스크롤 중...")
            await asyncio.sleep(3)

            for _ in range(5):
                await page.evaluate("window.scrollBy(0, window.innerHeight)")
                await asyncio.sleep(2)

            # 이미지 URL 추출
            image_elements = await page.query_selector_all("img[src*='facebook.com']")

            image_urls = []
            for img in image_elements:
                src = await img.get_attribute("src")
                if src and "facebook" in src:
                    image_urls.append(src)

            print(f"✅ 총 {len(image_urls)}개 이미지 발견\n")

            # 이미지 분류 및 다운로드
            async with aiohttp.ClientSession() as session:
                # 간단한 분류 로직 (실제로는 사용자가 수동으로 분류하는 것이 좋음)
                for category in CATEGORIES.keys():
                    category_images = image_urls[:IMAGES_PER_CATEGORY]
                    image_urls = image_urls[IMAGES_PER_CATEGORY:]

                    print(f"📥 {CATEGORIES[category]} 다운로드 중...")

                    for idx, url in enumerate(category_images, 1):
                        filename = f"{category}_{idx}.jpg"
                        filepath = OUTPUT_DIR / category / filename

                        if await download_image(session, url, filepath):
                            print(f"  ✅ {filename}")
                        else:
                            print(f"  ❌ {filename}")

                    print()

        except Exception as e:
            print(f"❌ 오류 발생: {e}")

        finally:
            await browser.close()

if __name__ == "__main__":
    print("=" * 60)
    print("🎬 Facebook 이미지 다운로더")
    print("=" * 60)
    print(f"📍 URL: {FACEBOOK_URL}")
    print(f"📁 출력: {OUTPUT_DIR.absolute()}")
    print(f"📊 카테고리: {', '.join(CATEGORIES.values())}")
    print(f"🖼️  개수: 카테고리당 {IMAGES_PER_CATEGORY}장")
    print("=" * 60)
    print()

    try:
        asyncio.run(scrape_facebook_images())
        print("✨ 다운로드 완료!")
    except KeyboardInterrupt:
        print("\n⚠️ 사용자 중단")
    except Exception as e:
        print(f"\n❌ 오류: {e}")
