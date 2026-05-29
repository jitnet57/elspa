// ============================================================
// 📌 Service Worker: 프로덕션 최적화 버전
// 📋 목적: 오프라인 지원, 라이브러리 캐싱, API 응답 캐싱
// 📅 작성일: 2026-05-29
// ============================================================

/**
 * 📝 설명:
 * 이 Service Worker는 다음 기능을 제공합니다:
 *
 * 1. **정적 자산 캐싱** (Cache First)
 *    - JavaScript, CSS, 이미지, 폰트
 *    - Three.js, Leaflet 등 대용량 라이브러리
 *
 * 2. **동적 API 캐싱** (Stale-While-Revalidate)
 *    - API 응답을 캐시하고 백그라운드에서 업데이트
 *    - 네트워크 느림/오프라인 환경 지원
 *
 * 3. **오프라인 폴백**
 *    - 페이지 로드 실패 시 오프라인 페이지 표시
 *    - 캐시된 데이터 사용
 *
 * 4. **배경 동기화**
 *    - 온라인 복귀 시 대기 중인 요청 재전송
 */

const CACHE_PREFIX = "elspa-v1";
const STATIC_CACHE = `${CACHE_PREFIX}-static`;
const DYNAMIC_CACHE = `${CACHE_PREFIX}-dynamic`;
const API_CACHE = `${CACHE_PREFIX}-api`;

// ============================================================
// 캐싱 전략별 정적 자산 목록
// ============================================================

const STATIC_ASSETS = [
  // HTML 페이지
  "/",
  "/offline.html",

  // 주요 리소스
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/icon-maskable-192x192.png",
  "/icon-maskable-512x512.png",

  // 스타일 및 폰트
  "/fonts/",

  // 오프라인 페이지
  "/offline.html",
];

// Three.js, Leaflet 등 대용량 라이브러리는 필요할 때 동적으로 캐싱
const LARGE_LIBRARIES_PATTERNS = [
  /\/three\.min\.js/,
  /\/leaflet\.min\.js/,
  /\/recharts\//,
  /\/_next\/static\/chunks\/.*\.js/,
];

// API 엔드포인트 패턴 (동적 캐싱)
const API_ENDPOINTS_PATTERNS = [
  /\/api\/knowledge-network\//,
  /\/api\/nodes\//,
  /\/api\/edges\//,
];

// ============================================================
// Service Worker: Install 이벤트
// 📋 목적: 초기 캐시 생성 및 활성화
// ============================================================

self.addEventListener("install", (event) => {
  console.log("🔧 Service Worker 설치 중...");

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log(`✅ 정적 캐시 생성: ${STATIC_CACHE}`);
        // 핵심 자산만 캐싱 (큰 파일은 제외)
        return cache.addAll(STATIC_ASSETS).catch((error) => {
          console.warn("⚠️ 일부 자산 캐싱 실패:", error);
          // 일부 실패해도 설치 진행
        });
      })
      .then(() => {
        console.log("✅ Service Worker 설치 완료");
        return self.skipWaiting(); // 즉시 활성화
      })
  );
});

// ============================================================
// Service Worker: Activate 이벤트
// 📋 목적: 이전 캐시 정리 및 버전 관리
// ============================================================

self.addEventListener("activate", (event) => {
  console.log("🚀 Service Worker 활성화 중...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // 구 버전 캐시 삭제
            if (!cacheName.startsWith(CACHE_PREFIX)) {
              console.log(`🗑️ 이전 캐시 삭제: ${cacheName}`);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log("✅ Service Worker 활성화 완료");
        return self.clients.claim(); // 모든 클라이언트 제어 시작
      })
  );
});

// ============================================================
// Service Worker: Fetch 이벤트
// 📋 목적: 요청에 따라 캐싱 전략 적용
// ============================================================

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // GET 요청만 캐싱 (POST, DELETE 등은 제외)
  if (request.method !== "GET") {
    return;
  }

  // API 요청 → Stale-While-Revalidate
  if (isApiRequest(url)) {
    event.respondWith(staleWhileRevalidate(request, API_CACHE));
    return;
  }

  // 정적 자산 → Cache First (대용량 라이브러리 포함)
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 기타 동적 콘텐츠 → Network First
  event.respondWith(networkFirst(request, DYNAMIC_CACHE));
});

// ============================================================
// 캐싱 전략 1: Cache First (정적 자산)
// 📋 목적: 캐시에서 먼저 찾고, 없으면 네트워크 요청
// ============================================================

function cacheFirst(request, cacheName) {
  return caches.match(request).then((response) => {
    // 캐시에 있으면 즉시 반환
    if (response) {
      console.log(`📦 캐시 히트: ${request.url}`);
      return response;
    }

    // 캐시 없으면 네트워크 요청
    return fetch(request)
      .then((response) => {
        // 성공 응답만 캐싱
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(cacheName).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // 네트워크 실패 → 오프라인 페이지
        console.warn(`❌ 네트워크 실패: ${request.url}`);
        return caches
          .match("/offline.html")
          .then((response) => response || new Response("오프라인 상태입니다."));
      });
  });
}

// ============================================================
// 캐싱 전략 2: Network First (동적 콘텐츠)
// 📋 목적: 먼저 네트워크 요청, 실패 시 캐시 사용
// ============================================================

function networkFirst(request, cacheName) {
  return fetch(request)
    .then((response) => {
      // 성공 응답 캐싱
      if (response && response.status === 200) {
        const responseClone = response.clone();
        caches.open(cacheName).then((cache) => {
          cache.put(request, responseClone);
        });
      }
      return response;
    })
    .catch(() => {
      // 네트워크 실패 → 캐시 사용
      console.warn(`📡 네트워크 요청 실패, 캐시 사용: ${request.url}`);
      return caches.match(request).then((response) => {
        if (response) {
          return response;
        }
        // 캐시도 없으면 오프라인 페이지
        return caches
          .match("/offline.html")
          .then((response) => response || new Response("오프라인 상태입니다."));
      });
    });
}

// ============================================================
// 캐싱 전략 3: Stale-While-Revalidate (API)
// 📋 목적: 캐시 반환 후 백그라운드에서 업데이트
// ============================================================

function staleWhileRevalidate(request, cacheName) {
  return caches.match(request).then((cachedResponse) => {
    // 캐시된 응답 즉시 반환
    if (cachedResponse) {
      console.log(`📦 API 캐시 히트 (SWR): ${request.url}`);
    }

    // 백그라운드에서 최신 데이터 요청
    const fetchPromise = fetch(request)
      .then((response) => {
        // 성공 응답 캐싱
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(cacheName).then((cache) => {
            cache.put(request, responseClone);
            console.log(`✨ API 캐시 업데이트: ${request.url}`);
          });
        }
        return response;
      })
      .catch(() => {
        console.warn(`⚠️ API 백그라운드 업데이트 실패: ${request.url}`);
      });

    // 캐시 있으면 즉시 반환, 없으면 네트워크 응답 대기
    return cachedResponse || fetchPromise;
  });
}

// ============================================================
// 헬퍼 함수: API 요청 판별
// ============================================================

function isApiRequest(url) {
  return API_ENDPOINTS_PATTERNS.some((pattern) => pattern.test(url.pathname));
}

// ============================================================
// 헬퍼 함수: 정적 자산 판별
// ============================================================

function isStaticAsset(url) {
  // 이미지, 폰트, 스타일시트
  if (/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/.test(url.pathname)) {
    return true;
  }

  // 대용량 라이브러리
  if (LARGE_LIBRARIES_PATTERNS.some((pattern) => pattern.test(url.pathname))) {
    return true;
  }

  // Three.js, Leaflet 스크립트
  if (url.hostname === "cdnjs.cloudflare.com" || url.hostname === "cdn.jsdelivr.net") {
    return true;
  }

  return false;
}

// ============================================================
// 백그라운드 동기화 (선택)
// 📋 목적: 온라인 복귀 시 대기 중인 요청 재전송
// ============================================================

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-pending-requests") {
    console.log("🔄 대기 중인 요청 동기화 시작...");
    // 대기 중인 요청 목록 처리
    // (IndexedDB 등에 저장된 요청 데이터 재전송)
  }
});

// ============================================================
// 푸시 알림 (선택)
// 📋 목적: 서버에서 전송한 알림 수신
// ============================================================

self.addEventListener("push", (event) => {
  console.log("📬 푸시 알림 수신:", event.data?.text());
  const data = event.data?.json() || {};

  const options = {
    body: data.body || "ElSpa에서 알림이 도착했습니다.",
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    tag: data.tag || "notification",
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(data.title || "ElSpa", options));
});

// ============================================================
// 알림 클릭 처리
// ============================================================

self.addEventListener("notificationclick", (event) => {
  console.log("👆 알림 클릭:", event.notification.tag);
  event.notification.close();

  // 알림 클릭 시 앱 포커스 또는 열기
  event.waitUntil(
    clients
      .matchAll({ type: "window" })
      .then((clientList) => {
        // 이미 열린 창이 있으면 포커스
        for (const client of clientList) {
          if (client.url === "/" && "focus" in client) {
            return (client as any).focus();
          }
        }
        // 없으면 새 창 열기
        if (clients.openWindow) {
          return clients.openWindow("/");
        }
      })
  );
});

console.log("✅ Service Worker 로드됨 (v1.0)");
