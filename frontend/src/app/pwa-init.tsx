'use client';

import { useEffect } from 'react';
import { startSyncOnReconnect, pullFromSupabase } from '@/lib/db/syncService';

// ============================================================
// 📌 함수: clearIndexedDBCache
// 📋 목적: 앱 시작 시 오래된 IndexedDB 캐시 클리어
// 🔧 실행: 브라우저 캐시 정리 후 페이지 리프레시
// 📅 작성일: 2026-06-03
// ============================================================
async function clearIndexedDBCache() {
  try {
    if (!('indexedDB' in window)) return;

    // 모든 IndexedDB 데이터베이스 삭제
    const dbs = await window.indexedDB.databases();
    for (const db of dbs) {
      window.indexedDB.deleteDatabase(db.name);
      console.log(`🧹 IndexedDB 캐시 삭제: ${db.name}`);
    }

    // localStorage 중 특정 키 클리어 (설정 제외)
    const keysToKeep = ['bookingRowCount', 'autoSaveSettings'];
    Object.keys(localStorage).forEach((key) => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
    console.log('🧹 localStorage 캐시 정리 완료');

    // Service Worker 캐시 클리어
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
        console.log(`🧹 Service Worker 캐시 삭제: ${cacheName}`);
      }
    }

    return true;
  } catch (error) {
    console.error('❌ 캐시 클리어 실패:', error);
    return false;
  }
}

export function PWAInit() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // ⚠️ 프로덕션에서만 캐시 클리어 수행 (프리뷰 CORS 에러 방지)
    const isProduction = window.location.hostname === 'elspa.pages.dev';

    if (isProduction) {
      (async () => {
        const lastClearTime = sessionStorage.getItem('lastCacheClear');
        const now = Date.now();
        const ONE_DAY = 24 * 60 * 60 * 1000;

        if (!lastClearTime || now - parseInt(lastClearTime) > ONE_DAY) {
          console.log('🔄 IndexedDB 캐시 클리어 시작...');
          const cleared = await clearIndexedDBCache();

          if (cleared) {
            sessionStorage.setItem('lastCacheClear', now.toString());
            setTimeout(() => {
              console.log('🔄 페이지 리프레시...');
              window.location.reload();
            }, 1000);
            return;
          }
        }
      })();
    }

    // 오프라인 복구 시 자동 싱크 리스너 등록
    startSyncOnReconnect(() => new Date().toISOString().split('T')[0]);
    // 앱 시작 시 IndexedDB에 최신 데이터 내려받기 (온라인일 때만)
    if (navigator.onLine) {
      pullFromSupabase(new Date().toISOString().split('T')[0]).catch(() => {});
    }

    // ℹ️ 데이터 저장은 Supabase 직결로 처리 (로컬 파일서버 localhost:5001 제거 — 프로덕션 CORS 원인)

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
