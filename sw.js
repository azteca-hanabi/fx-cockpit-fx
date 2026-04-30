const CACHE_NAME = 'fx-cockpit-v2';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // HTMLナビゲーションとJSONデータはSWキャッシュをバイパス
  // → iOSがHTTPキャッシュ（GitHub Pages max-age=600）から取得するため常に最新
  if (event.request.mode === 'navigate') return;
  if (url.pathname.endsWith('.json')) return;

  // フォント等の静的アセットのみCache-first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return res;
      });
    })
  );
});
