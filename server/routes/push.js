const router = require('express').Router();
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');
const push = require('../utils/push');

// GET /api/push/public-key — key the browser needs to subscribe
router.get('/public-key', verifyToken, (req, res) => {
  res.json({ enabled: push.isReady(), publicKey: push.isReady() ? push.getPublicKey() : null });
});

// POST /api/push/subscribe — register this phone/browser for the logged-in employee
router.post('/subscribe', verifyToken, async (req, res) => {
  try {
    if (!push.isReady()) return res.status(503).json({ error: 'Push notifications are not available right now' });
    const sub = req.body && (req.body.subscription || req.body);
    const endpoint = push.cleanEndpoint(sub && sub.endpoint);
    const p256dh = String((sub && sub.keys && sub.keys.p256dh) || '');
    const auth = String((sub && sub.keys && sub.keys.auth) || '');
    if (!endpoint) return res.status(400).json({ error: 'Unsupported push subscription' });
    if (!/^[A-Za-z0-9_\-+/=]{20,255}$/.test(p256dh) || !/^[A-Za-z0-9_\-+/=]{8,255}$/.test(auth)) {
      return res.status(400).json({ error: 'Invalid push subscription keys' });
    }
    // One row per phone: if someone else was logged in on this phone before,
    // the subscription moves to whoever is logged in now.
    await pool.query(
      `INSERT INTO push_subscriptions (emp_code, endpoint_hash, endpoint, p256dh, auth, user_agent)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE emp_code = VALUES(emp_code), endpoint = VALUES(endpoint),
         p256dh = VALUES(p256dh), auth = VALUES(auth), user_agent = VALUES(user_agent)`,
      [req.user.empCode, push.hashEndpoint(endpoint), endpoint, p256dh, auth, String(req.headers['user-agent'] || '').slice(0, 255)]
    );
    res.json({ message: 'Subscribed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/push/unsubscribe — stop pushing to this phone (logout)
router.post('/unsubscribe', verifyToken, async (req, res) => {
  try {
    const endpoint = push.cleanEndpoint(req.body && req.body.endpoint);
    if (!endpoint) return res.json({ message: 'Unsubscribed' });
    await pool.query('DELETE FROM push_subscriptions WHERE endpoint_hash = ? AND emp_code = ?',
      [push.hashEndpoint(endpoint), req.user.empCode]);
    res.json({ message: 'Unsubscribed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
