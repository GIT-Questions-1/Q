const CACHE_NAME = 'git-site-cache-v1';

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
  '/script.js'
];

// عند التثبيت: خزّن الملفات
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting(); // لتفعيل الفورًا
});

// عند الطلب: جرب من الكاش، ثم من الشبكة
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).catch(() => {
        // لو فشل fetch (مثل انقطاع الإنترنت)
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// عند التفعيل: حذف الكاشات القديمة
self.addEventListener('activate', event => {
  const cacheAllowlist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheAllowlist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
  self.clients.claim();
});
