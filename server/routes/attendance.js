const router = require('express').Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

// POST /api/attendance/checkin — GPS check-in (supports multiple sessions per day)
router.post('/checkin', verifyToken, async (req, res) => {
  try {
    const { lat, lng, location, remark, isWithinGeofence, accuracy } = req.body;
    const today = new Date().toISOString().split('T')[0];

    // Check if there's an active session (checked in but not checked out)
    const [active] = await pool.query(
      'SELECT id FROM attendance_logs WHERE emp_code = ? AND log_date = ? AND check_in IS NOT NULL AND check_out IS NULL',
      [req.user.empCode, today]
    );

    if (active.length > 0) {
      return res.status(400).json({ error: 'Already checked in. Please check out first.' });
    }

    // Create a new check-in session (allows re-checkin after checkout)
    const [result] = await pool.query(
      `INSERT INTO attendance_logs (emp_code, check_in, check_in_lat, check_in_lng, status, log_date,
       location_name, remark, is_within_geofence, accuracy)
       VALUES (?, NOW(), ?, ?, "Present", ?, ?, ?, ?, ?)`,
      [req.user.empCode, lat || null, lng || null, today,
       location || null, remark || null,
       isWithinGeofence !== undefined ? (isWithinGeofence ? 1 : 0) : 1, accuracy || null]
    );

    const [rows] = await pool.query('SELECT * FROM attendance_logs WHERE id = ?', [result.insertId]);
    // Real-time: broadcast check-in to MD/HR
    const io = req.app.get('io');
    if (io) {
      io.to('role:MD').to('role:HR').emit('attendance:checkin', {
        empCode: req.user.empCode, name: req.user.name, location: location || 'Unknown',
        time: new Date().toISOString(), isWithinGeofence: isWithinGeofence !== false
      });
    }
    res.json({ message: 'Checked in successfully', time: new Date().toISOString(), row: rows[0] || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/attendance/checkout — GPS check-out (closes latest active session)
router.post('/checkout', verifyToken, async (req, res) => {
  try {
    const { lat, lng, location, remark, isWithinGeofence } = req.body;
    const today = new Date().toISOString().split('T')[0];

    // Find latest active session (checked in but not checked out)
    const [active] = await pool.query(
      'SELECT id FROM attendance_logs WHERE emp_code = ? AND log_date = ? AND check_in IS NOT NULL AND check_out IS NULL ORDER BY check_in DESC LIMIT 1',
      [req.user.empCode, today]
    );

    if (active.length === 0) {
      return res.status(400).json({ error: 'Not checked in. Please check in first.' });
    }

    await pool.query(
      `UPDATE attendance_logs SET check_out = NOW(), check_out_lat = ?, check_out_lng = ?,
       location_name = COALESCE(?, location_name), remark = COALESCE(?, remark),
       is_within_geofence = ? WHERE id = ?`,
      [lat || null, lng || null, location || null, remark || null,
       isWithinGeofence !== undefined ? (isWithinGeofence ? 1 : 0) : 1, active[0].id]
    );

    const [rows] = await pool.query('SELECT * FROM attendance_logs WHERE id = ?', [active[0].id]);
    // Real-time: broadcast checkout to MD/HR
    const io = req.app.get('io');
    if (io) {
      io.to('role:MD').to('role:HR').emit('attendance:checkout', {
        empCode: req.user.empCode, name: req.user.name, location: location || 'Unknown',
        time: new Date().toISOString()
      });
    }
    res.json({ message: 'Checked out successfully', time: new Date().toISOString(), row: rows[0] || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/attendance/today — get today's status (all sessions)
router.get('/today', verifyToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [rows] = await pool.query(
      'SELECT * FROM attendance_logs WHERE emp_code = ? AND log_date = ? ORDER BY check_in ASC',
      [req.user.empCode, today]
    );
    if (rows.length === 0) return res.json({ checkedIn: false, sessions: [] });
    // Latest session determines current status
    const latest = rows[rows.length - 1];
    const isActive = latest.check_in && !latest.check_out;
    res.json({ checkedIn: isActive, sessions: rows, latest: latest, totalSessions: rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/attendance — get attendance logs
router.get('/', verifyToken, async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7);
    let query, params;

    if (['MD', 'HR'].includes(req.user.role)) {
      query = `SELECT a.*, e.name, e.dept FROM attendance_logs a
               JOIN employees e ON a.emp_code = e.code
               WHERE a.log_date LIKE ? ORDER BY a.log_date DESC, e.name`;
      params = [month + '%'];
    } else {
      query = 'SELECT * FROM attendance_logs WHERE emp_code = ? AND log_date LIKE ? ORDER BY log_date DESC';
      params = [req.user.empCode, month + '%'];
    }

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
