const router = require('express').Router();
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// GET /api/notifications — list notifications for logged-in user
router.get('/', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM notifications WHERE emp_code = ? ORDER BY created_at DESC LIMIT 50',
      [req.user.empCode]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/notifications — create notification
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, body, category, empCode } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });

    // Only HR/MD can send notifications to other users
    const targetCode = (req.user.role === 'Employee') ? req.user.empCode : (empCode || req.user.empCode);
    const [result] = await pool.query(
      'INSERT INTO notifications (emp_code, title, message, type) VALUES (?, ?, ?, ?)',
      [targetCode, title, body || '', category || 'general']
    );
    res.status(201).json({ message: 'Notification created', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/notifications/:id/read — mark as read
router.patch('/:id/read', verifyToken, async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND emp_code = ?',
      [req.params.id, req.user.empCode]
    );
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/notifications/read-all — mark all as read
router.patch('/read-all', verifyToken, async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE emp_code = ?',
      [req.user.empCode]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/notifications/prefs — get notification preferences
router.get('/prefs', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM notification_preferences WHERE emp_code = ?', [req.user.empCode]);
    if (rows.length === 0) {
      return res.json({ salary: true, leave: true, advance: true, payroll: true });
    }
    const p = rows[0];
    res.json({ salary: !!p.salary, leave: !!p.leave_alert, advance: !!p.advance, payroll: !!p.payroll });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/notifications/prefs — update notification preferences
router.put('/prefs', verifyToken, async (req, res) => {
  try {
    const { salary, leave, advance, payroll } = req.body;
    await pool.query(
      `INSERT INTO notification_preferences (emp_code, salary, leave_alert, advance, payroll)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE salary = VALUES(salary), leave_alert = VALUES(leave_alert),
       advance = VALUES(advance), payroll = VALUES(payroll)`,
      [req.user.empCode, salary ? 1 : 0, leave ? 1 : 0, advance ? 1 : 0, payroll ? 1 : 0]
    );
    res.json({ message: 'Preferences updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
