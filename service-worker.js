// service-worker.js

const CACHE_NAME = 'git-questions-cache-v9'; // اسم فريد للكاش (غيّره إذا قمت بتحديثات كبيرة)
const GITHUB_REPO_PATH = '/Q/'; // المسار الأساسي لمستودعك على GitHub Pages

// قائمة بالملفات والموارد الأساسية التي يجب تخزينها للعمل دون اتصال
// تأكد من أن المسارات صحيحة بالنسبة لمجلد /Q/
const urlsToCache = [
  GITHUB_REPO_PATH, // الصفحة الرئيسية (عادة ما يعادل index.html)
  GITHUB_REPO_PATH + 'index.html', // ملف HTML الرئيسي
  // --- موارد خارجية (CDNs) ---
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Coiny&family=Montserrat:wght@700&family=Poppins:wght@700&display=swap',
  'https://fonts.googleapis.com/css2?family=Calistoga&display=swap',
  // --- الخطوط من Google Fonts (قد تحتاج لإضافة المزيد إذا كانت تُطلب ديناميكيًا) ---
  // Service worker سيحاول تخزينها عند طلبها لأول مرة
  // --- أيقونات Favicon ---
  'https://cdn-icons-png.flaticon.com/512/9027/9027706.png',
  // --- ملف الخط المحلي (إذا كنت تستخدمه) ---
  // GITHUB_REPO_PATH + 'fonts/YourFont.woff2', // <-- قم بإلغاء التعليق وتعديل المسار إذا أضفت خطًا محليًا
];

// حدث التثبيت: يتم تشغيله عند تثبيت الـ Service Worker لأول مرة
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Install');
  // انتظر حتى يتم تخزين جميع الموارد الأساسية
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Caching app shell');
        // حاول تخزين الموارد الأساسية. ignoreSearch يتجاهل معاملات البحث في الروابط (مثل روابط Google Fonts)
        return Promise.all(
            urlsToCache.map(url => {
                return cache.add(new Request(url, { cache: 'reload' })).catch(err => {
                    console.warn(`[ServiceWorker] Failed to cache ${url}:`, err);
                });
            })
        );
      })
      .then(() => {
        console.log('[ServiceWorker] Skip waiting on install');
        return self.skipWaiting(); // تفعيل الـ SW الجديد فورًا
      })
      .catch(error => {
          console.error('[ServiceWorker] Cache open/add failed during install:', error);
      })
  );
});

// حدث التفعيل: يتم تشغيله عند تفعيل الـ Service Worker (بعد التثبيت أو التحديث)
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activate');
  // إزالة الكاش القديم إذا تغير اسم الكاش
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        console.log('[ServiceWorker] Claiming clients');
        return self.clients.claim(); // التحكم في الصفحات المفتوحة فورًا
    })
  );
});

// حدث الجلب: يتم تشغيله عند قيام الصفحة بطلب أي مورد (HTML, CSS, JS, صور, خطوط, إلخ)
self.addEventListener('fetch', event => {
  // console.log('[ServiceWorker] Fetching:', event.request.url);

  // استراتيجية "Cache first, falling back to network"
  event.respondWith(
    caches.match(event.request) // ابحث في الكاش أولاً
      .then(response => {
        // إذا وجد في الكاش، قم بإرجاعه
        if (response) {
          // console.log('[ServiceWorker] Returning from cache:', event.request.url);
          return response;
        }

        // إذا لم يوجد في الكاش، اطلبه من الشبكة
        // console.log('[ServiceWorker] Fetching from network:', event.request.url);
        return fetch(event.request)
          .then(networkResponse => {
            // إذا نجح الطلب من الشبكة
            if (networkResponse && networkResponse.status === 200) {
              // قم بنسخ الاستجابة لأنها يمكن قراءتها مرة واحدة فقط
              const responseToCache = networkResponse.clone();
              // افتح الكاش وخزن الاستجابة الجديدة
              caches.open(CACHE_NAME)
                .then(cache => {
                  // console.log('[ServiceWorker] Caching new resource:', event.request.url);
                  cache.put(event.request, responseToCache);
                });
            }
            // قم بإرجاع الاستجابة من الشبكة
            return networkResponse;
          })
          .catch(error => {
            // في حالة فشل الشبكة والكاش معًا (أنت غير متصل بالإنترنت والمورد غير مخزن)
            console.warn('[ServiceWorker] Fetch failed; returning offline fallback or error for:', event.request.url, error);
            // يمكنك هنا إرجاع صفحة خطأ مخصصة للوضع دون اتصال إذا أردت
            // return new Response('Network error occurred', { status: 408, headers: { 'Content-Type': 'text/plain' } });
          });
      })
  );
});
