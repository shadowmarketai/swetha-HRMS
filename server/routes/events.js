const router = require('express').Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');

// --- Events ---

// GET /api/events
router.get('/', verifyToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const offset = (page - 1) * limit;
    const [events] = await pool.query('SELECT * FROM events ORDER BY event_date DESC LIMIT ? OFFSET ?', [limit, offset]);
    const [awards] = await pool.query('SELECT * FROM awards ORDER BY award_date DESC LIMIT ? OFFSET ?', [limit, offset]);
    res.json({ events, awards });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/events
router.post('/', verifyToken, requireRole('MD', 'HR'), auditLog('create', 'event'), async (req, res) => {
  try {
    const { title, description, eventDate, eventType, location } = req.body;
    if (!title || !eventDate) return res.status(400).json({ error: 'Title and date required' });
    const [result] = await pool.query(
      'INSERT INTO events (title, description, event_date, event_type, location, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description || '', eventDate, eventType || 'other', location || '', req.user.empCode]
    );
    res.status(201).json({ message: 'Event created', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/events/:id
router.put('/:id', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    const { title, description, eventDate, eventType, location } = req.body;
    await pool.query(
      'UPDATE events SET title=?, description=?, event_date=?, event_type=?, location=? WHERE id=?',
      [title, description, eventDate, eventType, location, req.params.id]
    );
    res.json({ message: 'Event updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/events/:id
router.delete('/:id', verifyToken, requireRole('MD', 'HR'), auditLog('delete', 'event'), async (req, res) => {
  try {
    await pool.query('DELETE FROM events WHERE id = ?', [req.params.id]);
    res.json({ message: 'Event deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Awards ---

// POST /api/events/awards
router.post('/awards', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    const { empCode, empName, title, description, category } = req.body;
    if (!empCode || !title) return res.status(400).json({ error: 'Employee and title required' });
    const [result] = await pool.query(
      'INSERT INTO awards (emp_code, emp_name, title, description, award_date, category) VALUES (?, ?, ?, ?, CURDATE(), ?)',
      [empCode, empName || '', title, description || '', category || '']
    );
    res.status(201).json({ message: 'Award created', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Hot Seat Sessions ---

// GET /api/events/hot-seat
router.get('/hot-seat', verifyToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const offset = (page - 1) * limit;
    const [rows] = await pool.query('SELECT * FROM hot_seat_sessions ORDER BY session_date DESC LIMIT ? OFFSET ?', [limit, offset]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/events/hot-seat
router.post('/hot-seat', verifyToken, async (req, res) => {
  try {
    const { empCode, empName, goals, challenges, wins, feedback } = req.body;
    // Employees can only create hot-seat for themselves; MD/HR can create for anyone
    const targetCode = ['MD', 'HR'].includes(req.user.role) ? (empCode || req.user.empCode) : req.user.empCode;
    const targetName = (targetCode === req.user.empCode) ? req.user.name : (empName || targetCode);
    const [result] = await pool.query(
      'INSERT INTO hot_seat_sessions (emp_code, emp_name, session_date, goals, challenges, wins, feedback) VALUES (?, ?, CURDATE(), ?, ?, ?, ?)',
      [targetCode, targetName, JSON.stringify(goals || []), JSON.stringify(challenges || []), JSON.stringify(wins || []), JSON.stringify(feedback || [])]
    );
    res.status(201).json({ message: 'Hot seat session created', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
