#!/usr/bin/env python3
"""
========================================================
📌 웹사이트 빌드 스크립트
📋 목적: 111개 MD 파일을 JSON으로 변환하고 Next.js 페이지 생성
🔧 매개변수: 없음 (모든 MD 파일 자동 수집)
📤 반환값: public/docs.json + frontend 페이지
📅 작성일: 2026-05-29
========================================================
"""

import os
import json
import re
from pathlib import Path
from datetime import datetime

# 디렉토리 설정
ROOT_DIR = Path("e:/elspa")
MD_FILES_DIR = ROOT_DIR
OUTPUT_JSON = ROOT_DIR / "public" / "docs.json"
FRONTEND_DIR = ROOT_DIR / "frontend"

# 카테고리 분류
CATEGORIES = {
    "Phase 1: 한국": ["START-HERE.md", "BOARD-PITCH", "FINANCIAL-MODEL-12MONTH", "TRACK-A", "TRACK-B", "TRACK-C"],
    "Phase 2: 필리핀": ["START-HERE-PH", "PHILIPPINES", "CEBU-BOHOL"],
    "Phase 3: 글로벌": ["GLOBAL-", "THAILAND-", "VIETNAM-", "INDONESIA-", "LANGGRAPH-", "TECHNICAL"],
    "Phase 4: 실행": ["LIVE-EXECUTION", "ROLE-SPECIFIC", "CONTINGENCY", "LANGGRAPH-AGENT", "INVESTOR", "CEO-", "CFO-", "CTO-", "30-DAY"],
}

def categorize_file(filename):
    """파일을 카테고리로 분류"""
    for category, keywords in CATEGORIES.items():
        if any(keyword in filename for keyword in keywords):
            return category
    return "기타"

def extract_metadata(content):
    """MD 파일에서 메타데이터 추출"""
    metadata = {
        "title": None,
        "summary": None,
        "order": None,
        "keywords": []
    }

    # 제목 추출 (첫 번째 # 또는 ##)
    title_match = re.search(r'^#+\s+(.+?)$', content, re.MULTILINE)
    if title_match:
        metadata["title"] = title_match.group(1).strip()

    # Order 번호 추출
    order_match = re.search(r'Order:\s*(\d+)', content)
    if order_match:
        metadata["order"] = int(order_match.group(1))

    # 요약 추출 (첫 단락)
    lines = content.split('\n')
    summary_lines = []
    for line in lines:
        if line.strip() and not line.startswith('#'):
            summary_lines.append(line.strip())
            if len(summary_lines) >= 2:
                break

    if summary_lines:
        metadata["summary"] = ' '.join(summary_lines)[:200]

    # 키워드 추출 (주요 단어)
    if "payroll" in content.lower():
        metadata["keywords"].append("급여정산")
    if "track" in content.lower():
        metadata["keywords"].append("Track")
    if "langgraph" in content.lower():
        metadata["keywords"].append("AI")
    if "investor" in content.lower():
        metadata["keywords"].append("투자자")
    if "board" in content.lower():
        metadata["keywords"].append("보드")
    if "korea" in content.lower() or "한국" in content:
        metadata["keywords"].append("한국")
    if "philippines" in content.lower():
        metadata["keywords"].append("필리핀")
    if "thailand" in content.lower():
        metadata["keywords"].append("태국")
    if "vietnam" in content.lower():
        metadata["keywords"].append("베트남")
    if "indonesia" in content.lower():
        metadata["keywords"].append("인도네시아")

    return metadata

def collect_documents():
    """모든 MD 파일 수집 및 처리"""
    documents = []

    # MD 파일 찾기
    md_files = list(ROOT_DIR.glob("*.md"))
    print(f"✅ 찾은 MD 파일: {len(md_files)}개")

    for idx, md_file in enumerate(sorted(md_files), 1):
        try:
            with open(md_file, 'r', encoding='utf-8') as f:
                content = f.read()

            metadata = extract_metadata(content)

            doc = {
                "id": idx,
                "filename": md_file.name,
                "title": metadata["title"] or md_file.stem,
                "category": categorize_file(md_file.name),
                "summary": metadata["summary"],
                "order": metadata.get("order"),
                "keywords": metadata["keywords"],
                "size_kb": round(len(content) / 1024, 2),
                "lines": len(content.split('\n')),
                "updated": datetime.fromtimestamp(md_file.stat().st_mtime).isoformat(),
                "content_preview": content[:500]  # 처음 500자
            }

            documents.append(doc)
            print(f"  {idx}. {md_file.name} ({doc['category']})")

        except Exception as e:
            print(f"  ❌ 오류: {md_file.name} - {str(e)}")

    return documents

def generate_json(documents):
    """JSON 파일 생성"""
    # public 디렉토리 생성
    output_dir = OUTPUT_JSON.parent
    output_dir.mkdir(parents=True, exist_ok=True)

    # JSON 저장
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump({
            "meta": {
                "total": len(documents),
                "generated": datetime.now().isoformat(),
                "categories": list(set(d["category"] for d in documents))
            },
            "documents": documents
        }, f, ensure_ascii=False, indent=2)

    print(f"\n✅ JSON 저장: {OUTPUT_JSON}")
    print(f"   총 {len(documents)}개 문서")
    print(f"   파일 크기: {OUTPUT_JSON.stat().st_size / 1024:.1f} KB")

def generate_next_pages(documents):
    """Next.js 동적 페이지 생성"""
    # pages/docs/ 디렉토리 생성
    pages_dir = FRONTEND_DIR / "src" / "app" / "docs"
    pages_dir.mkdir(parents=True, exist_ok=True)

    # 메인 인덱스 페이지
    index_page = '''
"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Filter, Download } from "lucide-react";

export default function DocsIndex() {
  const [docs, setDocs] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("전체");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // docs.json 로드
    fetch("/docs.json")
      .then(r => r.json())
      .then(data => {
        setDocs(data.documents);
        setLoading(false);
      });
  }, []);

  const filtered = docs.filter(doc => {
    const matchSearch = doc.title.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "전체" || doc.category === category;
    return matchSearch && matchCategory;
  });

  const categories = ["전체", ...new Set(docs.map(d => d.category))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">

        {/* 헤더 */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            📚 ElSpa Business Strategy
          </h1>
          <p className="text-lg text-gray-700">
            Phase 1-4 완전 가이드 (111개 문서, 70,000+ 줄)
          </p>
        </div>

        {/* 검색 & 필터 */}
        <div className="mb-8 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="문서 검색..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  category === cat
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 결과 */}
        {loading ? (
          <div className="text-center py-12">로딩 중...</div>
        ) : (
          <>
            <p className="text-gray-600 mb-6">
              {filtered.length}개 문서 찾음
            </p>

            <div className="grid gap-4">
              {filtered.map(doc => (
                <Link
                  key={doc.id}
                  href={`/docs/${doc.id}`}
                  className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition border-l-4 border-blue-500"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {doc.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3">
                        {doc.summary}
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-xs font-medium">
                          {doc.category}
                        </span>
                        {doc.keywords.map(kw => (
                          <span key={kw} className="bg-gray-100 text-gray-800 px-3 py-1 rounded text-xs">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right text-gray-500 text-sm ml-4">
                      <p>{doc.lines} 줄</p>
                      <p>{doc.size_kb} KB</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
'''.strip()

    # pages/docs/[id]/page.tsx 생성
    dynamic_dir = pages_dir / "[id]"
    dynamic_dir.mkdir(exist_ok=True)

    doc_page = '''
"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { ChevronLeft, Download, Copy } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function DocPage({ params }) {
  const { id } = use(params);
  const [doc, setDoc] = useState(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // docs.json에서 문서 정보 로드
    fetch("/docs.json")
      .then(r => r.json())
      .then(data => {
        const found = data.documents.find(d => d.id === parseInt(id));
        if (found) {
          setDoc(found);
          // 실제 MD 파일 로드
          fetch(`/docs/${found.filename}`)
            .then(r => r.text())
            .then(text => setContent(text))
            .finally(() => setLoading(false));
        }
      });
  }, [id]);

  if (loading) return <div className="p-8 text-center">로딩 중...</div>;
  if (!doc) return <div className="p-8 text-center">문서를 찾을 수 없습니다.</div>;

  return (
    <div className="min-h-screen bg-white">
      {/* 네비게이션 */}
      <div className="bg-gray-100 border-b border-gray-300 p-4 sticky top-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/docs" className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
            <ChevronLeft size={20} />
            뒤로 가기
          </Link>
          <div className="text-sm text-gray-600">
            {doc.category}
          </div>
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{doc.title}</h1>

        <div className="flex gap-4 mb-8 text-gray-600 text-sm">
          <span>📄 {doc.lines} 줄</span>
          <span>💾 {doc.size_kb} KB</span>
          <span>📅 {new Date(doc.updated).toLocaleDateString('ko-KR')}</span>
        </div>

        <div className="prose prose-lg max-w-none">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
'''.strip()

    # 파일 저장
    with open(pages_dir / "page.tsx", 'w', encoding='utf-8') as f:
        f.write(index_page)

    with open(dynamic_dir / "page.tsx", 'w', encoding='utf-8') as f:
        f.write(doc_page)

    print(f"\n✅ Next.js 페이지 생성:")
    print(f"   - {pages_dir / 'page.tsx'}")
    print(f"   - {dynamic_dir / 'page.tsx'}")

if __name__ == "__main__":
    print("🚀 웹사이트 빌드 시작...\n")

    print("📚 문서 수집...")
    docs = collect_documents()

    print("\n📝 JSON 생성...")
    generate_json(docs)

    print("\n🎨 Next.js 페이지 생성...")
    generate_next_pages(docs)

    print("\n✅ 완료!")
    print(f"   - {len(docs)}개 문서 처리됨")
    print(f"   - npm run dev로 로컬 테스트 후 배포하세요")
