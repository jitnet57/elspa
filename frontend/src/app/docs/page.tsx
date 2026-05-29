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