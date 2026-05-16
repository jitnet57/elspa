'use client';

import { useEffect } from 'react';

export function PWAInit() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Service Worker 등록
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js', {
          scope: '/',
        })
        .then((registration) => {
          console.log('✅ Service Worker 등록 성공:', registration);

          // 주기적으로 업데이트 확인
          setInterval(() => {
            registration.update().catch((error) => {
              console.log('Service Worker 업데이트 확인 중 오류:', error);
            });
          }, 60000); // 1분마다 확인
        })
        .catch((error) => {
          console.error('❌ Service Worker 등록 실패:', error);
        });
    }

    // Web App Install Banner
    let deferredPrompt: BeforeInstallPromptEvent | null = null;

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      deferredPrompt = event as BeforeInstallPromptEvent;
      console.log('📱 앱 설치 가능');
    });

    // PWA 설치 감지
    window.addEventListener('appinstalled', () => {
      console.log('🎉 PWA 설치 완료');
      deferredPrompt = null;
    });

    // 전체 화면 모드 감지
    const onFullscreenChange = () => {
      if (document.fullscreenElement) {
        console.log('🖥️ 전체 화면 모드 활성화');
      } else {
        console.log('🖥️ 전체 화면 모드 비활성화');
      }
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, []);

  return null;
}

declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  }
}
