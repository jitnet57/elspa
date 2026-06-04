'use client';

/**
 * ============================================================
 * 📌 배포 정보 배지 컴포넌트
 * 📋 목적: 헤더에 배포 날짜/시간 표시
 * 🔧 사용: 헤더 오른쪽에 배치
 * 📅 작성일: 2026-06-04
 * ============================================================
 */

import { useEffect, useState } from 'react';

interface BuildInfo {
  buildTimeShort: string;
  buildTimeHMS: string;
  version: string;
  environment: string;
}

export default function DeploymentBadge() {
  const [buildInfo, setBuildInfo] = useState<BuildInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full text-xs text-green-700 hover:bg-green-100 transition-colors cursor-help" title={`배포 시간: ${buildInfo.buildTimeHMS}`}>
      <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
      <span className="font-medium">배포됨</span>
      <span className="text-green-600">{buildInfo.buildTimeShort}</span>
    </div>
  );
}
