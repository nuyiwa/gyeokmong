/* 격몽요결 수업 앱 · 서비스 워커 (오프라인 지원) */
const CACHE = "gmyk-v1";
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
    caches.open(CACHE).then(c => c.addAll(ASSETS).catch(()=>{})).then(()=>self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  // Firebase 등 외부 요청은 그대로 통과 (네트워크 우선)
  if (e.request.url.includes("firestore") ||
      e.request.url.includes("googleapis") ||
      e.request.url.includes("gstatic")) {
    return;
  }
  // 앱 파일은 캐시 우선, 없으면 네트워크
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
