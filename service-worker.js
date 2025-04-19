// اسم الكاش؛ غيّره إلى 'my-site-cache-v2' عندما تريد فرض إعادة تحميل الملفات
const CACHE_NAME = 'my-site-cache-v1';

// أضف هنا كل الملفات التي تحتاجها أوفلاين
const urlsToCache = [
  '/',               // الصفحة الرئيسية
  '/index.html',     // ملف HTML الرئيسي
  '/manifest.json'   // ملف التعريف
  // إذا لديك ملفات CSS أو JS أخرى، أضفها هنا مثل '/styles.css'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(keyList =>
      Promise.all(keyList.map(key => {
        if (!cacheWhitelist.includes(key)) {
          return caches.delete(key);
        }
      }))
    )
  );
});
