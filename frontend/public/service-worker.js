// ElSpa PWA Service Worker
// 오프라인 지원 및 캐싱 전략
// 배포할 때마다 버전을 올려서 캐시를 무효화합니다

const CACHE_VERSION = '20260602-v31'; // v31: BOOKING 컬럼 재구성(방번호/업체명노트/지불/팁)
const CACHE_NAME = `elspa-${CACHE_VERSION}`;
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/customer',
  '/customer/services',
  '/customer/reviews',
  '/customer/mypage',
  '/customer/booking',
  '/customer/about-matching',
  '/admin',
];

// 설치 이벤트: 정적 자산 캐싱
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll(STATIC_ASSETS).catch((error) => {
        console.log('[Service Worker] Cache addAll error:', error);
        // 일부 자산 캐싱 실패 시에도 계속 진행
      });
    })
  );
  self.skipWaiting();
});

// 활성화 이벤트: 오래된 캐시 정리
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch 이벤트: 네트워크 우선, 캐시 폴백 전략
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // GET 요청만 처리
  if (request.method !== 'GET') {
    return;
  }

  // 캐시 가능한 요청만 처리 (http/https만 캐싱 가능)
  const isCacheable = request.url.startsWith('http://') || request.url.startsWith('https://');
  if (!isCacheable) {
    event.respondWith(fetch(request));
    return;
  }

  // API 요청 처리 (네트워크 우선)
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 성공한 응답을 캐시에 저장
          if (response.ok) {
            const cache = caches.open(CACHE_NAME);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          // 네트워크 실패 시 캐시에서 가져오기
          return caches.match(request).then((response) => {
            return (
              response ||
              new Response('오프라인 상태입니다. 나중에 다시 시도해주세요.', {
                status: 503,
              })
            );
          });
        })
    );
    return;
  }

  // 정적 자산 처리 (캐시 우선)
  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(request)
        .then((response) => {
          // 성공한 응답만 캐시 저장
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            try {
              cache.put(request, responseToCache);
            } catch (error) {
              console.log('[Service Worker] Cache put failed:', error);
            }
          });

          return response;
        })
        .catch(() => {
          // 네트워크 실패 시 오프라인 페이지 제공
          return caches.match('/') || new Response('오프라인 상태입니다.');
        });
    })
  );
});

// 백그라운드 동기 이벤트 (향후 사용)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-bookings') {
    event.waitUntil(syncBookings());
  }
});

async function syncBookings() {
  try {
    const response = await fetch('/api/bookings/sync', {
      method: 'POST',
    });
    return response;
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
  }
}

// 푸시 알림 이벤트 (향후 사용)
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'ElSpa';
  const options = {
    body: data.body || '새로운 알림이 있습니다.',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'elspa-notification',
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 알림 클릭 이벤트
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// 메시지 수신 이벤트 (강제 업데이트)
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Forcing update...');
    self.skipWaiting();
  }
});

console.log('[Service Worker] Loaded successfully');
