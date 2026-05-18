'use client';

import { useEffect } from 'react';

export function PWAInit() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js', {
          scope: '/',
        })
        .then((registration) => {
          console.log('✅ Service Worker registration successful:', registration);

          // 페이지 로드 시 즉시 업데이트 확인
          registration.update().catch((error) => {
            console.log('Error checking Service Worker update:', error);
          });

          // 1분마다 업데이트 확인
          const updateInterval = setInterval(() => {
            registration.update().catch((error) => {
              console.log('Error checking Service Worker update:', error);
            });
          }, 60000);

          // 새 Service Worker 대기 중일 때 알림
          if (registration.waiting) {
            console.log('⚠️ New Service Worker version available!');
            // 강제 업데이트 (새 버전 적용)
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }

          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker?.addEventListener('statechange', () => {
              if (newWorker.state === 'activated') {
                console.log('🔄 Service Worker updated! New version active.');
                // 페이지 새로고침 (선택사항)
                window.location.reload();
              }
            });
          });

          return () => clearInterval(updateInterval);
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
        });
    }

    // Web App Install Banner
    let deferredPrompt: BeforeInstallPromptEvent | null = null;

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      deferredPrompt = event as BeforeInstallPromptEvent;
      console.log('📱 App installable');
    });

    // Detect PWA installation
    window.addEventListener('appinstalled', () => {
      console.log('🎉 PWA installation complete');
      deferredPrompt = null;
    });

    // Detect fullscreen mode
    const onFullscreenChange = () => {
      if (document.fullscreenElement) {
        console.log('🖥️ Fullscreen mode enabled');
      } else {
        console.log('🖥️ Fullscreen mode disabled');
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
