#!/bin/bash

# ============================================================
# 📌 Vercel 배포 스크립트
# 📋 목적: ElSpa Docs Portal을 Vercel에 배포
# 🔧 실행: vercel --prod
# ============================================================

echo "🚀 Vercel 배포 시작..."
echo ""
echo "설정:"
echo "  - 프로젝트: ElSpa"
echo "  - 배포 대상: 정적 파일 (public/ 디렉토리)"
echo "  - 프레임워크: 없음 (정적 HTML)"
echo ""
echo "단계:"
echo "  1️⃣  vercel login (첫 번째 배포 시만)"
echo "  2️⃣  vercel --prod"
echo "  3️⃣  URL 확인"
echo ""

# vercel.json 생성
cat > vercel.json << 'EOF'
{
  "buildCommand": "echo 'Static files'",
  "outputDirectory": "public",
  "framework": null,
  "env": {
    "NEXT_PUBLIC_API_URL": "https://api.elspa.io"
  }
}
EOF

echo "✅ vercel.json 생성 완료"
echo ""
echo "다음 명령어 실행:"
echo "  cd e:\\elspa"
echo "  vercel --prod"
echo ""
echo "또는 자동 배포:"
echo "  vercel --prod --yes --token=YOUR_VERCEL_TOKEN"
