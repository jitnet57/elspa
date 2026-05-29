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