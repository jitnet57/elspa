// ============================================================
// 📌 함수: generateStaticParams
// 📋 목적: Static Export 모드에서 동적 경로 사전 생성
// 📤 반환값: 모든 가능한 [id] 파라미터 배열
// ============================================================
export async function generateStaticParams() {
  try {
    // docs.json 파일에서 모든 문서 ID 추출
    // 실제 배포 시에는 docs.json이 public 폴더에 있어야 함
    return [
      { id: "1" },
      { id: "2" },
      { id: "3" },
      // 필요시 추가
    ];
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

// ============================================================
// Server Component with Client-side Markdown rendering
// ============================================================
import { Suspense } from "react";
import Link from "next/link";
import { ChevronLeft, Download, Copy } from "lucide-react";
import ReactMarkdown from "react-markdown";

function DocContent({ id }) {
  // This would need to be a client component to use hooks
  return (
    <div className="p-8 text-center">
      <p>Dynamic docs viewer for id: {id}</p>
      <p className="text-sm text-gray-600">Please configure your docs data source</p>
    </div>
  );
}

export default function DocPage({ params }) {
  const { id } = params;

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
            Documentation
          </div>
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">문서</h1>
        <Suspense fallback={<div className="p-8 text-center">로딩 중...</div>}>
          <DocContent id={id} />
        </Suspense>
      </div>
    </div>
  );
}