const CACHE_NAME = 'aquacat-cache-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
];

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // addAll fails silently if an asset 404s — use individual adds
      return Promise.allSettled(ASSETS_TO_CACHE.map(url => cache.add(url)));
    }).then(() => self.skipWaiting())
  );
});

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.map((n) => n !== CACHE_NAME && caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch — network-first, cache fallback ────────────────────────────────────
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res && res.status === 200) {
          caches.open(CACHE_NAME).then((c) => c.put(event.request, res.clone()));
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});

// ─── Helper: show a notification ─────────────────────────────────────────────
function showNotification(title, options = {}) {
  return self.registration.showNotification(title, {
    body: options.body || 'Time to drink a glass of water! 💧🐱',
    icon: options.icon || '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: options.tag || 'water-reminder',
    renotify: true,
    vibrate: [200, 100, 200],
    actions: [
      { action: 'drink', title: '💧 Log 250ml' },
      { action: 'close', title: 'Dismiss' },
    ],
    data: { url: options.data?.url || '/' },
    ...options,
  });
}

// ─── VAPID / server-sent push events ─────────────────────────────────────────
self.addEventListener('push', (event) => {
  let payload = {};
  if (event.data) {
    try { payload = event.data.json(); }
    catch { payload = { body: event.data.text() }; }
  }

  event.waitUntil(
    showNotification(payload.title || 'Burger is Thirsty! 🐱💦', payload)
  );
});

// ─── Re-subscribe if the browser invalidates the subscription ─────────────────
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: event.oldSubscription?.options?.applicationServerKey,
    }).then((newSub) => {
      // Tell all open clients about the new subscription so they can re-register with the server
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((c) => c.postMessage({ type: 'PUSH_SUBSCRIPTION_CHANGED', subscription: newSub }));
      });
    })
  );
});

// ─── Client-triggered notifications (while app is open) ──────────────────────
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'TRIGGER_NOTIFICATION') {
    const { title, body, icon, tag } = event.data.payload || {};
    event.waitUntil(showNotification(title || 'AquaCat Reminder', { body, icon, tag }));
  }
});

// ─── Notification click ───────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const openOrFocus = (url) =>
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.startsWith(self.location.origin) && 'focus' in c) {
          if (event.action === 'drink') {
            c.postMessage({ type: 'QUICK_LOG_WATER', amount: 250 });
          }
          return c.focus();
        }
      }
      return clients.openWindow(url);
    });

  if (event.action === 'drink') {
    event.waitUntil(openOrFocus('/?action=quick-log'));
  } else {
    event.waitUntil(openOrFocus('/'));
  }
});
