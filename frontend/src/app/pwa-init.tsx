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

          // Check for updates periodically
          setInterval(() => {
            registration.update().catch((error) => {
              console.log('Error checking Service Worker update:', error);
            });
          }, 60000); // Check every 1 minute
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
