'use client';

import { useState, useEffect } from 'react';

export function InAppBrowserBanner() {
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [showCopyHint, setShowCopyHint] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const inApp = /KAKAOTALK|Instagram|NAVER|Line|FB_IAB|FBAN|UCBrowser|QQBrowser|Maxthon/i.test(ua);
    const android = /Android/i.test(ua);

    setIsInAppBrowser(inApp);
    setIsAndroid(android);
  }, []);

  if (!isInAppBrowser) return null;

  const openInExternalBrowser = () => {
    const url = window.location.href;

    if (isAndroid) {
      // Android: Chrome Intent로 크롬에서 열기
      const intentUrl = `intent://${url.replace(/https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`;
      window.location.href = intentUrl;
    } else {
      // iOS: 클립보드에 복사하고 사용자에게 안내
      navigator.clipboard.writeText(url).then(() => {
        setShowCopyHint(true);
        setTimeout(() => setShowCopyHint(false), 3000);
      });
    }
  };

  return (
    <div className="sticky top-0 z-40 bg-blue-600 text-white">
      {/* 배너 */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div className="flex-1">
          <p className="text-sm md:text-base font-semibold">
            {isAndroid ? '🔗 Chrome에서 열기' : '🔗 Safari에서 열기'}
          </p>
          <p className="text-xs md:text-sm text-blue-100 mt-0.5">
            {isAndroid
              ? '더 나은 환경에서 사용하려면 Chrome에서 열어주세요'
              : 'Safari를 사용하면 더 안정적입니다'}
          </p>
        </div>
        <button
          onClick={openInExternalBrowser}
          className="flex-shrink-0 px-3 py-2 bg-white text-blue-600 font-bold rounded-lg text-sm hover:bg-blue-50 transition-colors whitespace-nowrap"
        >
          {isAndroid ? '열기' : 'URL 복사'}
        </button>
      </div>

      {/* iOS 복사 완료 메시지 */}
      {showCopyHint && !isAndroid && (
        <div className="bg-blue-700 px-4 py-2 md:px-6 text-sm text-blue-100 animate-pulse">
          ✓ URL이 복사되었습니다. Safari를 열고 주소창에 붙여넣기(Cmd+V)해주세요.
        </div>
      )}
    </div>
  );
}
