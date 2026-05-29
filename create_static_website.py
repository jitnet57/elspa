#!/usr/bin/env python3
"""
========================================================
📌 정적 웹사이트 생성 스크립트
📋 목적: HTML 기반 Docs Portal 생성
🔧 매개변수: 없음
📤 반환값: public/ 디렉토리에 HTML 파일들
📅 작성일: 2026-05-29
========================================================
"""

import os
import json
from pathlib import Path
from datetime import datetime

# 디렉토리 설정
OUTPUT_DIR = Path("public")
OUTPUT_DIR.mkdir(exist_ok=True)

DOCUMENTS = [
    # Phase 1: 한국
    {"id": 1, "title": "START-HERE.md", "cat": "Phase 1: 한국", "desc": "40페이지 Executive Summary", "order": 1, "file": "START-HERE.md"},
    {"id": 2, "title": "BOARD-PITCH-DECK-2026-05-30.md", "cat": "Phase 1: 한국", "desc": "15장 Board 피치 (내일 09:00)", "order": 2, "file": "BOARD-PITCH-DECK-2026-05-30.md"},
    {"id": 3, "title": "FINANCIAL-MODEL-12MONTH.md", "cat": "Phase 1: 한국", "desc": "12개월 재정 모델", "order": 3, "file": "FINANCIAL-MODEL-12MONTH.md"},
    {"id": 4, "title": "TRACK-A-PARTNER-PITCH-DECK.md", "cat": "Phase 1: 한국", "desc": "B2B 파트너십 전략", "order": 5, "file": "TRACK-A-PARTNER-PITCH-DECK.md"},
    {"id": 5, "title": "TRACK-B-NURSING-HOME-PITCH-SCRIPT.md", "cat": "Phase 1: 한국", "desc": "요양원 콜드콜 스크립트", "order": 6, "file": "TRACK-B-NURSING-HOME-PITCH-SCRIPT.md"},
    {"id": 6, "title": "TRACK-C-RETENTION-NPS-FRAMEWORK.md", "cat": "Phase 1: 한국", "desc": "고객 유지 & NPS 프레임워크", "order": 7, "file": "TRACK-C-RETENTION-NPS-FRAMEWORK.md"},

    # Phase 2: 필리핀
    {"id": 7, "title": "START-HERE-PH.md", "cat": "Phase 2: 필리핀", "desc": "필리핀 Executive Summary", "order": 101, "file": "START-HERE-PH.md"},
    {"id": 8, "title": "PHILIPPINES-MARKET-ANALYSIS.md", "cat": "Phase 2: 필리핀", "desc": "세부+보홀 시장 분석", "order": 102, "file": "PHILIPPINES-MARKET-ANALYSIS.md"},
    {"id": 9, "title": "PHILIPPINES-PAYROLL-SYSTEM.md", "cat": "Phase 2: 필리핀", "desc": "SSS/PhilHealth/Pag-IBIG", "order": 103, "file": "PHILIPPINES-PAYROLL-SYSTEM.md"},
    {"id": 10, "title": "CEBU-BOHOL-EXPANSION-PLAN.md", "cat": "Phase 2: 필리핀", "desc": "세부→보홀 확장", "order": 104, "file": "CEBU-BOHOL-EXPANSION-PLAN.md"},

    # Phase 3: 글로벌
    {"id": 11, "title": "GLOBAL-MARKET-ANALYSIS.md", "cat": "Phase 3: 글로벌", "desc": "$12B 글로벌 시장", "order": 201, "file": "GLOBAL-MARKET-ANALYSIS.md"},
    {"id": 12, "title": "THAILAND-MARKET-ANALYSIS.md", "cat": "Phase 3: 글로벌", "desc": "태국 스파 시장", "order": 202, "file": "THAILAND-MARKET-ANALYSIS.md"},
    {"id": 13, "title": "VIETNAM-MARKET-ANALYSIS.md", "cat": "Phase 3: 글로벌", "desc": "베트남 스파 시장", "order": 203, "file": "VIETNAM-MARKET-ANALYSIS.md"},
    {"id": 14, "title": "INDONESIA-MARKET-ANALYSIS.md", "cat": "Phase 3: 글로벌", "desc": "인도네시아 시장", "order": 204, "file": "INDONESIA-MARKET-ANALYSIS.md"},
    {"id": 15, "title": "GLOBAL-TECHNICAL-ARCHITECTURE.md", "cat": "Phase 3: 글로벌", "desc": "기술 아키텍처", "order": 205, "file": "GLOBAL-TECHNICAL-ARCHITECTURE.md"},
    {"id": 16, "title": "LANGGRAPH-AUTOMATION-SYSTEM.md", "cat": "Phase 3: 글로벌", "desc": "5개 AI Agents", "order": 206, "file": "LANGGRAPH-AUTOMATION-SYSTEM.md"},

    # Phase 4: 실행
    {"id": 17, "title": "LIVE-EXECUTION-MASTER-SCHEDULE.md", "cat": "Phase 4: 실행", "desc": "분별 실행 스케줄", "order": 301, "file": "LIVE-EXECUTION-MASTER-SCHEDULE.md"},
    {"id": 18, "title": "ROLE-SPECIFIC-PLAYBOOKS.md", "cat": "Phase 4: 실행", "desc": "CEO/PM/CS 플레이북", "order": 302, "file": "ROLE-SPECIFIC-PLAYBOOKS.md"},
    {"id": 19, "title": "LANGGRAPH-AGENT-IMPLEMENTATION.md", "cat": "Phase 4: 실행", "desc": "AI Agent 코드", "order": 305, "file": "LANGGRAPH-AGENT-IMPLEMENTATION.md"},
    {"id": 20, "title": "INVESTOR-PITCH-DECK.md", "cat": "Phase 4: 실행", "desc": "VC 피치덱", "order": 307, "file": "INVESTOR-PITCH-DECK.md"},
    {"id": 21, "title": "CEO-WEEKLY-OPERATIONS.md", "cat": "Phase 4: 실행", "desc": "CEO 주간 운영", "order": 308, "file": "CEO-WEEKLY-OPERATIONS.md"},
    {"id": 22, "title": "00-PHASE-1-4-FINAL-SUMMARY-2026-05-29.md", "cat": "Phase 4: 실행", "desc": "최종 완료 요약", "order": 314, "file": "00-PHASE-1-4-FINAL-SUMMARY-2026-05-29.md"},
]

HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ElSpa Business Strategy — 111개 문서 완전 가이드</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 20px;
            border-radius: 12px;
            margin-bottom: 40px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }

        header h1 {
            font-size: 3em;
            margin-bottom: 10px;
        }

        header p {
            font-size: 1.2em;
            opacity: 0.9;
            margin-bottom: 30px;
        }

        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
        }

        .stat {
            background: rgba(255, 255, 255, 0.2);
            padding: 15px;
            border-radius: 8px;
            text-align: center;
        }

        .stat-num {
            font-size: 2em;
            font-weight: bold;
        }

        .stat-label {
            font-size: 0.9em;
            opacity: 0.9;
        }

        .search-box {
            margin-bottom: 30px;
        }

        .search-box input {
            width: 100%;
            padding: 15px;
            border: none;
            border-radius: 8px;
            font-size: 1em;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .filters {
            display: flex;
            gap: 10px;
            margin-bottom: 30px;
            flex-wrap: wrap;
        }

        .filter-btn {
            padding: 10px 20px;
            border: 2px solid white;
            background: transparent;
            color: white;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.3s;
        }

        .filter-btn.active {
            background: white;
            color: #667eea;
        }

        .filter-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .documents {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 20px;
        }

        .doc-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            cursor: pointer;
            transition: all 0.3s;
            border-left: 5px solid #667eea;
        }

        .doc-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        }

        .doc-title {
            font-size: 1.2em;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }

        .doc-desc {
            color: #666;
            margin-bottom: 15px;
            font-size: 0.95em;
        }

        .doc-meta {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }

        .badge {
            display: inline-block;
            padding: 4px 12px;
            background: #f0f0f0;
            border-radius: 20px;
            font-size: 0.85em;
            color: #666;
        }

        .badge.phase {
            background: #667eea;
            color: white;
        }

        footer {
            text-align: center;
            color: white;
            padding: 40px 20px;
            margin-top: 60px;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
        }

        .hidden {
            display: none !important;
        }

        @media (max-width: 768px) {
            header h1 {
                font-size: 1.8em;
            }

            .documents {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>📚 ElSpa Business Strategy</h1>
            <p>Phase 1-4 완전 가이드 시스템 — 111개 문서, 70,000+ 줄</p>

            <div class="stats">
                <div class="stat">
                    <div class="stat-num">111</div>
                    <div class="stat-label">총 문서</div>
                </div>
                <div class="stat">
                    <div class="stat-num">15</div>
                    <div class="stat-label">한국 (Phase 1)</div>
                </div>
                <div class="stat">
                    <div class="stat-num">24</div>
                    <div class="stat-label">필리핀 (Phase 2)</div>
                </div>
                <div class="stat">
                    <div class="stat-num">40</div>
                    <div class="stat-label">글로벌 (Phase 3)</div>
                </div>
                <div class="stat">
                    <div class="stat-num">32</div>
                    <div class="stat-label">실행 (Phase 4)</div>
                </div>
            </div>
        </header>

        <div class="search-box">
            <input type="text" id="search" placeholder="🔍 문서 검색... (제목, 설명 등)">
        </div>

        <div class="filters" id="filters"></div>

        <div class="documents" id="docs"></div>

        <footer>
            <p>🚀 내일 09:00 Board 회의 | 10:00 Week 1 실행 시작</p>
            <p style="margin-top: 20px; font-size: 0.9em;">Generated on {DATE}</p>
        </footer>
    </div>

    <script>
        const DOCUMENTS = {DOCS_JSON};
        const categories = ["전체", ...new Set(DOCUMENTS.map(d => d.cat))];

        // 필터 버튼 생성
        const filtersDiv = document.getElementById('filters');
        categories.forEach(cat => {{
            const btn = document.createElement('button');
            btn.className = 'filter-btn' + (cat === '전체' ? ' active' : '');
            btn.textContent = cat;
            btn.onclick = () => filterDocs(cat);
            filtersDiv.appendChild(btn);
        }});

        // 문서 렌더링
        function renderDocs(docs) {{
            const docsDiv = document.getElementById('docs');
            docsDiv.innerHTML = '';

            if (docs.length === 0) {{
                docsDiv.innerHTML = '<p style="text-align: center; color: white; grid-column: 1/-1;">검색 결과가 없습니다</p>';
                return;
            }}

            docs.forEach(doc => {{
                const card = document.createElement('div');
                card.className = 'doc-card';
                card.innerHTML = `
                    <div class="doc-title">${{doc.title}}</div>
                    <div class="doc-desc">${{doc.desc}}</div>
                    <div class="doc-meta">
                        <span class="badge phase">${{doc.cat.split(':')[0]}}</span>
                        ${doc.order ? `<span class="badge">Order ${doc.order}</span>` : ''}
                    </div>
                `;
                card.onclick = () => window.open('https://github.com/elspa/elspa-docs/blob/main/' + doc.file);
                docsDiv.appendChild(card);
            }});
        }}

        let currentFilter = '전체';

        function filterDocs(category) {{
            currentFilter = category;
            updateFilterButtons();
            searchDocs();
        }}

        function updateFilterButtons() {{
            document.querySelectorAll('.filter-btn').forEach(btn => {{
                btn.classList.toggle('active', btn.textContent === currentFilter);
            }});
        }}

        function searchDocs() {{
            const query = document.getElementById('search').value.toLowerCase();
            const filtered = DOCUMENTS.filter(doc => {{
                const matchFilter = currentFilter === '전체' || doc.cat === currentFilter;
                const matchSearch = doc.title.toLowerCase().includes(query) ||
                                   doc.desc.toLowerCase().includes(query);
                return matchFilter && matchSearch;
            }});
            renderDocs(filtered);
        }}

        document.getElementById('search').addEventListener('input', searchDocs);

        // 초기 렌더링
        renderDocs(DOCUMENTS);
    </script>
</body>
</html>
""".replace('{DATE}', datetime.now().strftime('%Y-%m-%d %H:%M'))

def create_html():
    """메인 HTML 파일 생성"""
    docs_json = json.dumps(DOCUMENTS, ensure_ascii=False)
    html = HTML_TEMPLATE.replace('{DOCS_JSON}', docs_json)

    with open(OUTPUT_DIR / "index.html", 'w', encoding='utf-8') as f:
        f.write(html)

    print(f"✅ HTML 생성: {OUTPUT_DIR / 'index.html'}")

def copy_md_files():
    """MD 파일들을 public으로 복사"""
    docs_dir = OUTPUT_DIR / "docs"
    docs_dir.mkdir(exist_ok=True)

    for doc in DOCUMENTS:
        src = Path(doc['file'])
        dst = docs_dir / src.name

        if src.exists():
            with open(src, 'r', encoding='utf-8') as f:
                content = f.read()
            with open(dst, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  📄 복사: {src.name}")
        else:
            print(f"  ❌ 없음: {src.name}")

if __name__ == "__main__":
    print("🚀 정적 웹사이트 생성 시작...\n")

    print("📝 HTML 생성...")
    create_html()

    print("\n📚 MD 파일 복사...")
    copy_md_files()

    print(f"\n✅ 완료!")
    print(f"   - {OUTPUT_DIR / 'index.html'} (메인 페이지)")
    print(f"   - {OUTPUT_DIR / 'docs'} (문서 디렉토리)")
    print(f"\n🌐 배포 준비 완료!")
    print(f"   1. gh auth login (GitHub 인증)")
    print(f"   2. git add . && git commit && git push")
    print(f"   3. Cloudflare Pages에서 자동 배포")
