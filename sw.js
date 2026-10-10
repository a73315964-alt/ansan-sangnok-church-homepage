/* 안산상록교회 홈페이지 — 홈 화면 설치용 서비스 워커.
   오프라인 캐시는 하지 않고, 요청을 그대로 네트워크로 넘깁니다. */
self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (event) { event.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  event.respondWith(fetch(event.request));
});