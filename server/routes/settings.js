const router = require('express').Router();
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// GET /api/settings — get user settings
router.get('/', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM user_settings WHERE emp_code = ?', [req.user.empCode]);
    if (rows.length === 0) {
      return res.json({ pushNotifications: true, emailNotifications: true, theme: 'light', language: 'en' });
    }
    const s = rows[0];
    res.json({
      pushNotifications: !!s.push_notifications,
      emailNotifications: !!s.email_notifications,
      theme: s.theme,
      language: s.language
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/settings — update user settings
router.put('/', verifyToken, async (req, res) => {
  try {
    const { pushNotifications, emailNotifications, theme, language } = req.body;
    await pool.query(
      `INSERT INTO user_settings (emp_code, push_notifications, email_notifications, theme, language)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE push_notifications=VALUES(push_notifications), email_notifications=VALUES(email_notifications),
       theme=VALUES(theme), language=VALUES(language)`,
      [req.user.empCode, pushNotifications ? 1 : 0, emailNotifications ? 1 : 0, theme || 'light', language || 'en']
    );
    res.json({ message: 'Settings updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
