const CACHE_NAME = 'hrms-v181';
const PRECACHE_URLS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './peb-module.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './assets/hero-construction.jpg',
  './assets/hero-mobile.jpg',
  './assets/construction-scene.png',
  './swetha_new_logo.png',
  './assets/bg-road.jpg',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js'
];

// Install — precache app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — network-first for same-origin, cache-first for CDN
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-http schemes (chrome-extension://, etc.)
  if (!url.protocol.startsWith('http')) return;

  // Skip Google/external API
  if (url.hostname.includes('google') || url.hostname.includes('googleapis') || url.hostname.includes('gstatic')) return;

  // API calls: network-first, queue POST/PUT for offline sync
  if (url.pathname.startsWith('/api/')) {
    if (event.request.method !== 'GET') {
      // Non-GET API calls — try network, queue on failure
      event.respondWith(
        fetch(event.request.clone()).catch(() => {
          // Queue for later sync if it's a checkin/checkout
          if (url.pathname.includes('/attendance/checkin') || url.pathname.includes('/attendance/checkout')) {
            return event.request.json().then(body => {
              return saveToOfflineQueue({
                url: url.pathname,
                method: event.request.method,
                body: body,
                timestamp: new Date().toISOString()
              }).then(() => {
                return new Response(JSON.stringify({
                  message: 'Saved offline — will sync when online',
                  offline: true,
                  time: new Date().toISOString()
                }), { headers: { 'Content-Type': 'application/json' } });
              });
            });
          }
          return new Response(JSON.stringify({ error: 'You are offline. Please try again when connected.' }), {
            status: 503, headers: { 'Content-Type': 'application/json' }
          });
        })
      );
      return;
    }

    // GET API — network first, cache fallback
    event.respondWith(
      fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match(event.request).then(cached => cached || new Response(JSON.stringify({ error: 'Offline' }), { status: 503, headers: { 'Content-Type': 'application/json' } })))
    );
    return;
  }

  // Static files — network first, cache fallback
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match(event.request).then(cached => {
        if (cached) return cached;
        if (event.request.destination === 'document') return caches.match('./index.html');
      }))
    );
    return;
  }

  // CDN — cache first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});

// ── Offline Queue (IndexedDB) ──
function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('hrms-offline', 1);
    req.onupgradeneeded = () => { req.result.createObjectStore('queue', { keyPath: 'id', autoIncrement: true }); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function saveToOfflineQueue(data) {
  return openOfflineDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('queue', 'readwrite');
      tx.objectStore('queue').add(data);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
}

function getOfflineQueue() {
  return openOfflineDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('queue', 'readonly');
      const req = tx.objectStore('queue').getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  });
}

function clearOfflineQueue() {
  return openOfflineDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('queue', 'readwrite');
      tx.objectStore('queue').clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
}

// ── Background Sync ──
self.addEventListener('sync', event => {
  if (event.tag === 'sync-attendance') {
    event.waitUntil(syncOfflineQueue());
  }
});

async function syncOfflineQueue() {
  try {
    const queue = await getOfflineQueue();
    if (queue.length === 0) return;

    // Get token from client
    const clients = await self.clients.matchAll({ type: 'window' });
    let token = null;
    for (const client of clients) {
      // Send message to get token
      const response = await new Promise(resolve => {
        const ch = new MessageChannel();
        ch.port1.onmessage = e => resolve(e.data);
        client.postMessage({ type: 'GET_TOKEN' }, [ch.port2]);
      });
      if (response && response.token) { token = response.token; break; }
    }

    if (!token) return;

    var synced = 0;
    var remaining = [];
    for (const item of queue) {
      try {
        var resp = await fetch(item.url, {
          method: item.method || 'POST',
          headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
          body: JSON.stringify(item.body)
        });
        if (resp.ok || resp.status === 400) {
          // 400 = already checked in/out — don't retry
          synced++;
        } else {
          remaining.push(item);
        }
      } catch (e) {
        remaining.push(item);
      }
    }

    // Save only failed items back, removing successfully synced ones
    if (remaining.length > 0) {
      var db = await openOfflineDB();
      var tx = db.transaction('queue', 'readwrite');
      var store = tx.objectStore('queue');
      store.clear();
      remaining.forEach(function(r) { store.add(r); });
    } else {
      await clearOfflineQueue();
    }

    // Notify user
    self.registration.showNotification('HRMS', {
      body: `${queue.length} offline action(s) synced successfully`,
      icon: './icons/icon-192.png',
      badge: './icons/icon-192.png'
    });
  } catch (e) {
    console.error('[SW] Sync error:', e);
  }
}

// ── Push Notification ──
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : { title: 'HRMS', body: 'New notification' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: './icons/icon-192.png',
      badge: './icons/icon-192.png',
      vibrate: [200, 100, 200],
      data: data.url || './',
      actions: data.actions || []
    })
  );
});

// Notification click — open/focus app
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data || './';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url.includes('index.html') || client.url.endsWith('/')) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

// ── Message handler (for token retrieval during sync) ──
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
