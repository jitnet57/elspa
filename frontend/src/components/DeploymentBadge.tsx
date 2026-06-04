'use client';

/**
 * ============================================================
 * 📌 배포 정보 배지 컴포넌트
 * 📋 목적: 헤더에 배포 날짜/시간 & 커밋 메시지 표시
 * 🔧 사용: 헤더 오른쪽에 배치, 클릭/호버 시 커밋 정보 표시
 * 📅 작성일: 2026-06-04
 * ============================================================
 */

import { useEffect, useState } from 'react';

interface BuildInfo {
  buildTimeShort: string;
  buildTimeHMS: string;
  version: string;
  environment: string;
  commit?: {
    hash: string;
    shortHash: string;
    message: string;
    author: string;
    date: string;
  };
}

export default function DeploymentBadge() {
  const [buildInfo, setBuildInfo] = useState<BuildInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // build-info.json 로드
    fetch('/build-info.json')
      .then((res) => res.json())
      .then((data) => {
        setBuildInfo(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('❌ 배포 정보 로드 실패:', error);
        setIsLoading(false);
      });
  }, []);

  if (isLoading || !buildInfo) {
    return null;
  }

  const commitLines = buildInfo.commit?.message.split('\n').filter(line => line.trim()) || [];
  const firstLine = commitLines[0] || '업데이트됨';
  const restLines = commitLines.slice(1);

  return (
    <div className="relative inline-block">
      {/* 배포 배지 */}
      <div
        className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full text-xs text-green-700 hover:bg-green-100 transition-colors cursor-help select-none"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        title="클릭하여 업데이트 내용 확인"
      >
        <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        <span className="font-medium">배포됨</span>
        <span className="text-green-600">{buildInfo.buildTimeShort}</span>
      </div>

      {/* 툴팁 */}
      {showTooltip && buildInfo.commit && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-4 text-left">
          {/* 헤더 */}
          <div className="flex items-start gap-2 mb-3 pb-3 border-b border-gray-100">
            <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
              ✓
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-gray-900 break-words">{firstLine}</p>
              <p className="text-xs text-gray-500 mt-1">{buildInfo.buildTimeHMS}</p>
            </div>
          </div>

          {/* 세부 정보 */}
          <div className="space-y-2 text-xs text-gray-700">
            {/* 작성자 */}
            {buildInfo.commit.author && (
              <div>
                <p className="text-gray-500 font-medium">작성자</p>
                <p className="text-gray-700">{buildInfo.commit.author}</p>
              </div>
            )}

            {/* 커밋 해시 */}
            {buildInfo.commit.shortHash && (
              <div>
                <p className="text-gray-500 font-medium">Commit Hash</p>
                <p className="font-mono text-gray-700 bg-gray-50 px-2 py-1 rounded break-all">
                  {buildInfo.commit.shortHash}
                </p>
              </div>
            )}

            {/* 커밋 메시지 상세 */}
            {restLines.length > 0 && (
              <div>
                <p className="text-gray-500 font-medium">상세 설명</p>
                <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 px-2 py-1 rounded">
                  {restLines.join('\n')}
                </p>
              </div>
            )}

            {/* 버전 정보 */}
            <div className="pt-2 border-t border-gray-100">
              <p className="text-gray-500 text-[10px] font-medium">버전: {buildInfo.version}</p>
              <p className="text-gray-500 text-[10px]">환경: {buildInfo.environment}</p>
            </div>
          </div>

          {/* 클로즈 힌트 */}
          <p className="text-xs text-gray-400 mt-3 text-center">클릭하여 닫기</p>
        </div>
      )}
    </div>
  );
}
