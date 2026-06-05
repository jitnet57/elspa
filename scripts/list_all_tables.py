#!/usr/bin/env python3
import os
from dotenv import load_dotenv
import requests

load_dotenv()
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

# Supabase 메타데이터 API를 사용해서 테이블 목록 조회
headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json"
}

response = requests.get(f"{url}/rest/v1/?apiversion=1", headers=headers)
if response.status_code == 200:
    print("✅ Available tables:")
    tables = response.json()
    for table in tables:
        print(f"  - {table.get('name', 'unknown')}")
else:
    print(f"❌ Error: {response.status_code}")
    print(response.text)
