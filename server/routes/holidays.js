const router = require('express').Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');

// GET /api/holidays — list all holidays (visible to everyone)
router.get('/', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, DATE_FORMAT(holiday_date, "%Y-%m-%d") AS holiday_date, name, description, created_by, created_at FROM public_holidays ORDER BY holiday_date ASC'
    );
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/holidays — create holiday (HR / MD only)
router.post('/', verifyToken, requireRole('MD', 'HR'), auditLog('create', 'holiday'), async (req, res) => {
  try {
    const { date, name, description } = req.body || {};
    if (!date || !name) return res.status(400).json({ error: 'Date and name required' });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: 'Date must be YYYY-MM-DD' });
    const [result] = await pool.query(
      'INSERT INTO public_holidays (holiday_date, name, description, created_by) VALUES (?, ?, ?, ?)',
      [date, name.trim(), (description || '').trim() || null, req.user.empCode]
    );
    res.status(201).json({ id: result.insertId, success: true });
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'A holiday already exists on this date' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/holidays/:id — remove holiday (HR / MD only)
router.delete('/:id', verifyToken, requireRole('MD', 'HR'), auditLog('delete', 'holiday'), async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM public_holidays WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Holiday not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
