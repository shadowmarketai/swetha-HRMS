const router = require('express').Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');

// GET /api/announcements — list active announcements (with upcoming holidays injected within 2 days)
router.get('/', verifyToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const [countResult] = await pool.query('SELECT COUNT(*) as total FROM announcements WHERE is_active = 1');
    const total = (countResult && countResult[0]) ? countResult[0].total : 0;
    const [rows] = await pool.query(
      'SELECT * FROM announcements WHERE is_active = 1 ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset]
    );
    const [reads] = await pool.query(
      'SELECT announcement_id FROM announcement_reads WHERE emp_code = ?',
      [req.user.empCode]
    );
    const readIds = new Set(reads.map(r => r.announcement_id));
    const result = rows.map(a => ({ ...a, is_read: readIds.has(a.id) }));

    // Inject upcoming public holidays as virtual announcements (today + next 2 days)
    // Only on the first page so they don't duplicate across paginated requests.
    if (page === 1) {
      try {
        const [holidays] = await pool.query(
          `SELECT id, DATE_FORMAT(holiday_date, '%Y-%m-%d') AS holiday_date, name, description
             FROM public_holidays
            WHERE holiday_date >= CURDATE()
              AND holiday_date <= DATE_ADD(CURDATE(), INTERVAL 2 DAY)
            ORDER BY holiday_date ASC`
        );
        const holidayItems = holidays.map(h => {
          const dateLabel = new Date(h.holiday_date + 'T00:00:00').toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric', weekday: 'long'
          });
          return {
            id: 'holiday-' + h.id,
            title: 'Upcoming Holiday: ' + h.name,
            content: dateLabel + (h.description ? ' — ' + h.description : '') + ' is a declared public holiday.',
            category: 'Holiday',
            priority: 'High',
            author_name: 'HR / Admin',
            created_by: null,
            is_active: 1,
            created_at: new Date().toISOString(),
            is_read: false,
            is_holiday: true
          };
        });
        // Prepend so upcoming holidays appear at the top of the feed
        result.unshift(...holidayItems);
      } catch (e) { /* holidays table may not exist yet — non-fatal */ }
    }

    res.json({ data: result, total, page, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/announcements — create announcement
router.post('/', verifyToken, requireRole('MD', 'HR'), auditLog('create', 'announcement'), async (req, res) => {
  try {
    const { title, content, category, priority } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Title and content required' });
    const [emp] = await pool.query('SELECT name FROM employees WHERE code = ?', [req.user.empCode]);
    const authorName = emp.length > 0 ? emp[0].name : '';
    const [result] = await pool.query(
      'INSERT INTO announcements (title, content, category, priority, created_by, author_name) VALUES (?, ?, ?, ?, ?, ?)',
      [title, content, category || 'General', priority || 'Normal', req.user.empCode, authorName]
    );
    const io = req.app.get('io');
    if (io) {
      io.to('all').emit('announcement:created', { id: result.insertId, title, category: category || 'General', priority: priority || 'Normal' });
    }
    res.status(201).json({ id: result.insertId, success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/announcements/:id — soft delete
router.delete('/:id', verifyToken, requireRole('MD', 'HR'), auditLog('delete', 'announcement'), async (req, res) => {
  try {
    await pool.query('UPDATE announcements SET is_active = 0 WHERE id = ?', [req.params.id]);
    const io = req.app.get('io');
    if (io) {
      io.to('all').emit('announcement:deleted', { id: parseInt(req.params.id) });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/announcements/:id/read — mark as read
router.post('/:id/read', verifyToken, async (req, res) => {
  try {
    // Holiday-prefixed IDs are virtual announcements, not persisted — skip silently
    if (typeof req.params.id === 'string' && req.params.id.startsWith('holiday-')) {
      return res.json({ success: true });
    }
    await pool.query(
      'INSERT IGNORE INTO announcement_reads (announcement_id, emp_code) VALUES (?, ?)',
      [req.params.id, req.user.empCode]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
