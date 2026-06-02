'use client';

import { useEffect } from 'react';
import { startSyncOnReconnect, pullFromSupabase } from '@/lib/db/syncService';
import { startAutoSave, checkFileServer } from '@/lib/api/file-save-client';

export function PWAInit() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 오프라인 복구 시 자동 싱크 리스너 등록
    startSyncOnReconnect(() => new Date().toISOString().split('T')[0]);
    // 앱 시작 시 IndexedDB에 최신 데이터 내려받기 (온라인일 때만)
    if (navigator.onLine) {
      pullFromSupabase(new Date().toISOString().split('T')[0]).catch(() => {});
    }

    // ✨ 파일 자동 저장 시작 (15분마다)
    checkFileServer().then((isConnected) => {
      if (isConnected) {
        console.log('🚀 파일 자동 저장 시작');
        startAutoSave(15 * 60 * 1000); // 15분마다
      } else {
        console.log('⚠️  로컬 파일 서버에 연결할 수 없습니다');
        console.log('💡 팁: python3 ~/elspa/file_server.py를 실행하세요');
      }
    });

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js', {
          scope: '/',
        })
        .then((registration) => {
          console.log('✅ Service Worker registration successful:', registration);

          // 페이지 로드 시 즉시 업데이트 확인 (자동 새로고침)
          const checkForUpdates = () => {
            registration.update().then(() => {
              // 대기 중인 새 Service Worker가 있으면 강제로 활성화
              if (registration.waiting) {
                console.log('⚠️ New Service Worker version available! Activating...');
                registration.waiting.postMessage({ type: 'SKIP_WAITING' });
              }
            }).catch((error) => {
              console.log('Error checking Service Worker update:', error);
            });
          };

          // 초기 로드 시 즉시 업데이트 확인
          checkForUpdates();

          // 5초 후에 다시 확인 (2차 시도)
          setTimeout(checkForUpdates, 5000);

          // 1분마다 업데이트 확인
          const updateInterval = setInterval(checkForUpdates, 60000);

          // 설치 중인 새 Service Worker 감시
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'activated') {
                  console.log('🔄 Service Worker updated! New version active. Reloading...');
                  // 새 버전이 활성화되면 페이지 자동 새로고침
                  setTimeout(() => {
                    window.location.reload();
                  }, 500);
                }
              });
            }
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
