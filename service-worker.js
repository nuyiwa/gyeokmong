/* 격몽요결 수업 앱 · 서비스 워커 (오프라인 지원) */
const CACHE = "gmyk-v2";
const ASSETS = [
  "./index.html",
  "./ch01.html","./ch02.html","./ch03.html",
  "./ch04.html","./ch05.html","./ch06.html",
  "./ch07.html","./ch08.html","./ch09.html",
  "./ch10.html",
  "./firebase-config.js","./manifest.json",
  "./icon-192.png","./icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS).catch(()=>{}))
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(()=>self.clients.claim())
  );
});

// 새 버전 배포 시 사용자가 "새로고침"을 누르면 대기 중인 워커를 즉시 활성화
self.addEventListener("message", e => {
  if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  // Firebase 등 외부 요청은 그대로 통과 (네트워크 우선)
  if (e.request.url.includes("firestore") ||
      e.request.url.includes("googleapis") ||
      e.request.url.includes("gstatic")) {
    return;
  }
  // 앱 파일은 네트워크 우선(항상 최신 반영), 오프라인일 때만 캐시로 대체
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(()=>{});
      return res;
    }).catch(() => caches.match(e.request))
  );
});
