const CACHE_NAME = 'hrms-v212';
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
      // Drain on activate too. An iOS PWA closed while offline has no page to
      // send REPLAY_QUEUE and no Background Sync, so without this its punches
      // would sit until someone happened to reopen the app while online.
      .then(() => syncOfflineQueue())
      .catch(() => {})
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
      const isPunch = url.pathname.includes('/attendance/checkin') || url.pathname.includes('/attendance/checkout');
      // Parse the body NOW, before fetch touches it. The common site failure is
      // not a clean offline state — it is an upload that starts and then dies
      // mid-flight, which disturbs the request stream and makes a later
      // formData() read reject. Reading up front costs one parse per punch and
      // is the difference between queueing the punch and losing it.
      const captured = isPunch ? event.request.clone().formData().catch(() => null) : null;
      const punchAuth = isPunch ? event.request.headers.get('Authorization') : null;
      const punchMethod = event.request.method;
      const offlineResponse = msg => new Response(JSON.stringify({ error: msg }), {
        status: 503, headers: { 'Content-Type': 'application/json' }
      });
      const queueIt = async () => {
        const form = await captured;
        if (!form) return offlineResponse('Could not save your punch offline. Please try again.');
        try {
          await queuePunch(form, punchAuth, url.pathname, punchMethod);
          return new Response(JSON.stringify({
            message: 'Saved offline — will sync when online',
            offline: true,
            time: new Date().toISOString()
          }), { headers: { 'Content-Type': 'application/json' } });
        } catch (e) {
          // Could not even queue it — say so rather than claim it was saved.
          return offlineResponse('Could not save your punch offline. Please try again.');
        }
      };
      if (!isPunch) {
        event.respondWith(fetch(event.request.clone()).catch(() => offlineResponse('You are offline. Please try again when connected.')));
        return;
      }
      event.respondWith((async () => {
        // A punch must not overtake one still waiting in the queue: a check-out
        // sent before its queued check-in is refused ("Not checked in") and the
        // check-in then stays open all night. Queue behind it and drain now.
        const waiting = await getOfflineQueue().catch(() => []);
        if (waiting.length) {
          const resp = await queueIt();
          syncOfflineQueue();
          return resp;
        }
        // On a stalled upload (one bar of signal) fetch can hang for minutes,
        // and a punch still "in flight" when the app is closed is simply lost.
        // Give up after PUNCH_TIMEOUT_MS and queue it instead.
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), PUNCH_TIMEOUT_MS);
        try {
          const resp = await fetch(event.request.clone(), { signal: ctrl.signal });
          clearTimeout(timer);
          return resp;
        } catch (e) {
          clearTimeout(timer);
          return queueIt();
        }
      })());
      return;
    }

    // Today's check-in status must never come from cache: a stale copy looks
    // like a real answer and shows a different status than the server holds.
    // Fail instead, so the page keeps what it knows and says it is offline.
    if (url.pathname === '/api/attendance/today') {
      event.respondWith(fetch(event.request).catch(() => new Response(JSON.stringify({ error: 'Offline' }), { status: 503, headers: { 'Content-Type': 'application/json' } })));
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

// Rewrite the queue to exactly these items, in this order. Order matters: a
// check-in must replay before the check-out that closes it. Dropping the old
// autoIncrement ids lets the store reassign them in array order.
function replaceQueue(items) {
  return openOfflineDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('queue', 'readwrite');
      const store = tx.objectStore('queue');
      store.clear();
      items.forEach(it => {
        const copy = Object.assign({}, it);
        delete copy.id;
        store.add(copy);
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
}

// Store a punch that could not be sent. Takes an already-parsed FormData: the
// request is multipart (it carries a selfie), and the previous version called
// .json() on it, which always threw — which is why nothing was ever queued.
// The selfie Blob goes into IndexedDB as-is and the bearer token rides along,
// so a background sync can run with no page open.
async function queuePunch(form, authHeader, pathname, method) {
  const fields = {};
  let selfie = null;
  for (const entry of form.entries()) {
    const key = entry[0];
    const value = entry[1];
    if (value instanceof Blob) {
      if (key === 'selfie') selfie = { blob: value, name: value.name || 'selfie.jpg' };
    } else {
      fields[key] = value;
    }
  }
  const record = {
    url: pathname,
    method: method || 'POST',
    fields: fields,
    selfie: selfie,
    token: authHeader || null,
    // The instant the employee actually punched. Replayed to the server so the
    // row records when they were on site, not when the queue happened to drain.
    punchedAtMs: Date.now(),
    queuedAt: new Date().toISOString()
  };
  try {
    await saveToOfflineQueue(record);
  } catch (e) {
    // Safari has long-standing trouble storing a Blob in IndexedDB from a
    // service worker, and iOS is exactly where this path matters most. Retry
    // without the photo: a punch with no selfie beats no punch at all.
    if (!record.selfie) throw e;
    record.selfie = null;
    await saveToOfflineQueue(record);
  }
  if (self.registration.sync) {
    try { await self.registration.sync.register('sync-attendance'); } catch (e) { /* Background Sync unsupported */ }
  }
}

// Ask an open page for a current token. The stored one may have expired while
// the punch sat in the queue. Times out: a closed or busy page never replies,
// and the old code awaited that reply forever, hanging the whole sync.
function requestTokenFromClient() {
  return self.clients.matchAll({ type: 'window' }).then(clients => {
    if (!clients.length) return null;
    return new Promise(resolve => {
      let settled = false;
      const done = v => { if (!settled) { settled = true; resolve(v); } };
      setTimeout(() => done(null), 3000);
      try {
        const ch = new MessageChannel();
        ch.port1.onmessage = e => done(e.data && e.data.token ? e.data.token : null);
        clients[0].postMessage({ type: 'GET_TOKEN' }, [ch.port2]);
      } catch (e) { done(null); }
    });
  }).catch(() => null);
}

// ── Background Sync ──
self.addEventListener('sync', event => {
  if (event.tag === 'sync-attendance') {
    event.waitUntil(syncOfflineQueue());
  }
});

// How long a punch upload may take before it is queued instead.
const PUNCH_TIMEOUT_MS = 25000;

// The employee code inside a bearer token ('' if unreadable).
function tokenEmpCode(token) {
  try {
    const raw = String(token || '').replace(/^Bearer /, '');
    const b64 = raw.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return String(JSON.parse(atob(b64)).empCode || '').replace(/\s+/g, '').toUpperCase();
  } catch (e) { return ''; }
}

// Refuse to post a punch this stale; the month it belongs to may already be
// closed. Mirrors MAX_PUNCH_AGE_MS in server/routes/attendance.js.
const MAX_QUEUE_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// One drain at a time. The page now asks for a replay whenever it comes back
// to the foreground, and Background Sync may fire at the same moment; two
// overlapping drains would post the same punch twice.
let _syncRunning = null;
function syncOfflineQueue() {
  if (_syncRunning) return _syncRunning;
  _syncRunning = _drainOfflineQueue().finally(() => { _syncRunning = null; });
  return _syncRunning;
}

async function _drainOfflineQueue() {
  try {
    const queue = await getOfflineQueue();
    if (queue.length === 0) return;

    const now = Date.now();
    const keep = [];
    let synced = 0, rejected = 0, expired = 0;
    let aborted = false;
    // Employees with a punch held back this round. Their later punches wait
    // too, so a check-out never goes in ahead of the check-in it closes.
    const held = new Set();

    // A live page's token beats the one stored with the item, which may have
    // expired while the punch waited. Either works; neither is required to
    // exist, because each item carries its own.
    const freshToken = await requestTokenFromClient();

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      if (aborted || held.has(tokenEmpCode(item.token))) { keep.push(item); continue; }

      const punchedAtMs = item.punchedAtMs || Date.parse(item.queuedAt || '') || null;
      if (punchedAtMs && now - punchedAtMs > MAX_QUEUE_AGE_MS) { expired++; continue; }
      // Written by a previous version that never captured a usable body.
      if (!item.fields) { expired++; continue; }

      // Each punch goes in as the employee who made it. On a shared site phone
      // the page's current login may be someone else; using it filed one
      // person's punch under another. The live token is used only when it is
      // the same employee (it may be newer than the stored one).
      const itemEmp = tokenEmpCode(item.token);
      const rawToken = (freshToken && itemEmp && tokenEmpCode(freshToken) === itemEmp) ? freshToken : item.token;
      if (!rawToken) { keep.push(item); continue; }
      const authHeader = rawToken.indexOf('Bearer ') === 0 ? rawToken : 'Bearer ' + rawToken;

      // Rebuild the multipart body the route expects, selfie included. Do not
      // set Content-Type — fetch derives it with the right boundary.
      const fd = new FormData();
      Object.keys(item.fields).forEach(k => fd.append(k, item.fields[k]));
      if (punchedAtMs) {
        fd.append('punched_at_ms', String(punchedAtMs));
        // How long ago it was punched, by this phone's own clock. The server
        // uses this rather than the timestamp, so a phone whose clock is set
        // wrong still records the right time instead of being refused.
        fd.append('punch_age_ms', String(Math.max(0, Date.now() - punchedAtMs)));
      }
      // Only attach the photo if it survived storage intact. A Blob that came
      // back null or malformed must not fail the punch — send it without.
      if (item.selfie && item.selfie.blob instanceof Blob) {
        fd.append('selfie', item.selfie.blob, item.selfie.name || 'selfie.jpg');
      }

      // Same limit as a live punch: a replay stuck on one bar of signal would
      // otherwise hold the drain lock and block every later sync.
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), PUNCH_TIMEOUT_MS);
      try {
        const resp = await fetch(item.url, {
          method: item.method || 'POST',
          headers: { 'Authorization': authHeader },
          body: fd,
          signal: ctrl.signal
        }).finally(() => clearTimeout(timer));
        if (resp.ok) {
          synced++;
        } else if (resp.status === 400 || resp.status === 409 || resp.status === 422) {
          // The server has ruled on this punch — duplicate, too old, or no open
          // session to close. Retrying cannot change the answer, so drop it and
          // report the count instead of pretending it synced.
          rejected++;
        } else if (resp.status === 401 || resp.status === 403) {
          // That employee's token has expired. Keep their punch for when they
          // next sign in; other employees' punches can still go.
          keep.push(item); held.add(itemEmp);
        } else {
          keep.push(item); held.add(itemEmp); // 5xx — server trouble, try again later
        }
      } catch (e) {
        keep.push(item);   // still offline — nothing else will get through either
        aborted = true;
      }
    }

    await replaceQueue(keep);

    const parts = [];
    if (synced) parts.push(synced + ' punch' + (synced === 1 ? '' : 'es') + ' synced');
    if (rejected) parts.push(rejected + ' could not be applied');
    if (expired) parts.push(expired + ' expired');
    if (parts.length) {
      self.registration.showNotification('HRMS attendance', {
        body: parts.join(' · '),
        icon: './icons/icon-192.png',
        badge: './icons/icon-192.png'
      });
    }

    const windows = await self.clients.matchAll({ type: 'window' });
    windows.forEach(c => c.postMessage({
      type: 'ATTENDANCE_SYNCED', synced: synced, rejected: rejected, expired: expired, pending: keep.length
    }));
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
  // iOS Safari has no Background Sync, so there the page driving the replay is
  // the primary mechanism, not a fallback.
  if (event.data && event.data.type === 'REPLAY_QUEUE') {
    event.waitUntil(syncOfflineQueue());
  }
});
