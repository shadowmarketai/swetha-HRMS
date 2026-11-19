// Web push: deliver notifications to phones even when the app is closed.
//
// Every row written to the `notifications` table is pushed, whichever route
// wrote it: a dispatcher polls for rows not yet pushed, so no route has to
// call this module and a new notification type is covered automatically.
const crypto = require('crypto');
const webpush = require('web-push');
const pool = require('../config/db');

// Push services browsers hand out subscription endpoints for. The server
// POSTs to whatever endpoint a client registers, so anything else is refused.
const ALLOWED_PUSH_HOSTS = [
  /^fcm\.googleapis\.com$/,                    // Chrome, Edge, Android
  /^android\.googleapis\.com$/,
  /(^|\.)push\.services\.mozilla\.com$/,       // Firefox
  /(^|\.)notify\.windows\.com$/,               // old Edge / Windows
  /(^|\.)push\.apple\.com$/                    // Safari, iOS home-screen apps
];

// Only notifications this recent are pushed. Stops the first deploy (and any
// restart after downtime) from pushing a backlog of old notifications.
const MAX_PUSH_AGE_MIN = 15;
const DISPATCH_INTERVAL_MS = 10 * 1000;
const PUSH_TTL_SEC = 4 * 60 * 60;

let publicKey = null;
let ready = false;
let dispatching = false;

function hashEndpoint(endpoint) {
  return crypto.createHash('sha256').update(String(endpoint)).digest('hex');
}

// A subscription endpoint we are willing to send to, or null.
function cleanEndpoint(raw) {
  const s = String(raw || '').trim();
  if (!s || s.length > 2000) return null;
  let u;
  try { u = new URL(s); } catch (e) { return null; }
  if (u.protocol !== 'https:' || u.username || u.password) return null;
  if (!ALLOWED_PUSH_HOSTS.some(re => re.test(u.hostname))) return null;
  return u.toString();
}

async function ensureTables() {
  await pool.query(`CREATE TABLE IF NOT EXISTS push_subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    emp_code VARCHAR(20) NOT NULL,
    endpoint_hash CHAR(64) NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh VARCHAR(255) NOT NULL,
    auth VARCHAR(255) NOT NULL,
    user_agent VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_ok_at DATETIME NULL,
    UNIQUE KEY uniq_push_endpoint (endpoint_hash),
    INDEX idx_push_emp (emp_code),
    FOREIGN KEY (emp_code) REFERENCES employees(code) ON DELETE CASCADE
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS push_config (
    name VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL
  )`);
  await pool.query('ALTER TABLE notifications ADD COLUMN pushed_at DATETIME NULL').catch(() => {});
  await pool.query('ALTER TABLE notifications ADD INDEX idx_notif_push (pushed_at, created_at)').catch(() => {});
}

// VAPID keys identify this server to the push services. Taken from the
// environment if set; otherwise generated once and kept in the database, so
// they survive restarts and redeploys (new keys would orphan every phone
// already subscribed).
async function loadKeys() {
  let pub = process.env.VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) {
    const [rows] = await pool.query("SELECT name, value FROM push_config WHERE name IN ('vapid_public', 'vapid_private')");
    const cfg = {};
    rows.forEach(r => { cfg[r.name] = r.value; });
    if (!cfg.vapid_public || !cfg.vapid_private) {
      const keys = webpush.generateVAPIDKeys();
      // INSERT IGNORE + re-read: if two instances start together, both end up
      // using whichever pair was stored first.
      await pool.query("INSERT IGNORE INTO push_config (name, value) VALUES ('vapid_public', ?)", [keys.publicKey]);
      const [p] = await pool.query("SELECT value FROM push_config WHERE name = 'vapid_public'");
      if (p[0] && p[0].value === keys.publicKey) {
        await pool.query("REPLACE INTO push_config (name, value) VALUES ('vapid_private', ?)", [keys.privateKey]);
        console.log('[PUSH] Generated new VAPID keys');
      }
      const [again] = await pool.query("SELECT name, value FROM push_config WHERE name IN ('vapid_public', 'vapid_private')");
      again.forEach(r => { cfg[r.name] = r.value; });
    }
    pub = cfg.vapid_public; priv = cfg.vapid_private;
  }
  if (!pub || !priv) throw new Error('VAPID keys unavailable');
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'https://hrms.swethastructures.com', pub, priv);
  publicKey = pub;
}

// Send one payload to every phone an employee has subscribed. Subscriptions
// the push service says are gone (uninstalled, permission revoked) are removed.
async function sendToEmployee(empCode, payload) {
  const [subs] = await pool.query('SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE emp_code = ?', [empCode]);
  let sent = 0;
  for (const s of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload),
        { TTL: PUSH_TTL_SEC, urgency: 'high' }
      );
      sent++;
      pool.query('UPDATE push_subscriptions SET last_ok_at = NOW() WHERE id = ?', [s.id]).catch(() => {});
    } catch (e) {
      if (e && (e.statusCode === 404 || e.statusCode === 410)) {
        await pool.query('DELETE FROM push_subscriptions WHERE id = ?', [s.id]).catch(() => {});
      } else {
        console.error('[PUSH] Send failed for ' + empCode + ': ' + ((e && (e.statusCode || e.message)) || e));
      }
    }
  }
  return sent;
}

async function dispatchPending() {
  if (!ready || dispatching) return;
  dispatching = true;
  try {
    // Skip the whole pass cheaply when nobody has subscribed yet
    const [[cnt]] = await pool.query('SELECT COUNT(*) AS n FROM push_subscriptions');
    const anySubs = Number(cnt.n) > 0;
    const [rows] = await pool.query(
      `SELECT n.id, n.emp_code, n.title, n.message, n.type, COALESCE(us.push_notifications, 1) AS push_on
       FROM notifications n LEFT JOIN user_settings us ON us.emp_code = n.emp_code
       WHERE n.pushed_at IS NULL AND n.created_at > DATE_SUB(NOW(), INTERVAL ? MINUTE)
       ORDER BY n.id ASC LIMIT 200`,
      [MAX_PUSH_AGE_MIN]
    );
    for (const n of rows) {
      // Claim first, so an overlapping run or a second instance cannot push it twice
      const [claim] = await pool.query('UPDATE notifications SET pushed_at = NOW() WHERE id = ? AND pushed_at IS NULL', [n.id]);
      if (claim.affectedRows === 0) continue;
      if (!anySubs || !Number(n.push_on)) continue; // the employee turned push off in Settings
      await sendToEmployee(n.emp_code, {
        title: String(n.title || 'HRMS').slice(0, 120),
        body: String(n.message || '').slice(0, 300),
        type: n.type || 'general',
        id: n.id,
        url: './'
      });
    }
  } catch (e) {
    console.error('[PUSH] Dispatch error:', e.message);
  } finally {
    dispatching = false;
  }
}

async function start() {
  try {
    await ensureTables();
    await loadKeys();
    ready = true;
    setInterval(dispatchPending, DISPATCH_INTERVAL_MS);
    console.log('[PUSH] Web push enabled');
  } catch (e) {
    console.error('[PUSH] Web push disabled:', e.message);
  }
}

module.exports = {
  start,
  dispatchPending,
  cleanEndpoint,
  hashEndpoint,
  isReady: () => ready,
  getPublicKey: () => publicKey
};
