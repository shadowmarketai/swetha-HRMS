const router = require('express').Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

// POST /api/attendance/checkin — GPS check-in
router.post('/checkin', verifyToken, async (req, res) => {
  try {
    const { lat, lng, location, remark, isWithinGeofence, accuracy } = req.body;
    const today = new Date().toISOString().split('T')[0];

    // Check if already checked in today
    const [existing] = await pool.query(
      'SELECT id, check_in FROM attendance_logs WHERE emp_code = ? AND log_date = ?',
      [req.user.empCode, today]
    );

    if (existing.length > 0 && existing[0].check_in) {
      return res.status(400).json({ error: 'Already checked in today' });
    }

    let rowId;
    if (existing.length > 0) {
      await pool.query(
        `UPDATE attendance_logs SET check_in = NOW(), check_in_lat = ?, check_in_lng = ?,
         status = "Present", location_name = ?, remark = ?, is_within_geofence = ?, accuracy = ? WHERE id = ?`,
        [lat || null, lng || null, location || null, remark || null,
         isWithinGeofence !== undefined ? (isWithinGeofence ? 1 : 0) : 1, accuracy || null, existing[0].id]
      );
      rowId = existing[0].id;
    } else {
      const [result] = await pool.query(
        `INSERT INTO attendance_logs (emp_code, check_in, check_in_lat, check_in_lng, status, log_date,
         location_name, remark, is_within_geofence, accuracy)
         VALUES (?, NOW(), ?, ?, "Present", ?, ?, ?, ?, ?)`,
        [req.user.empCode, lat || null, lng || null, today,
         location || null, remark || null,
         isWithinGeofence !== undefined ? (isWithinGeofence ? 1 : 0) : 1, accuracy || null]
      );
      rowId = result.insertId;
    }

    // Return the full inserted/updated row
    const [rows] = await pool.query('SELECT * FROM attendance_logs WHERE id = ?', [rowId]);
    res.json({ message: 'Checked in successfully', time: new Date().toISOString(), row: rows[0] || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/attendance/checkout — GPS check-out
router.post('/checkout', verifyToken, async (req, res) => {
  try {
    const { lat, lng, location, remark, isWithinGeofence } = req.body;
    const today = new Date().toISOString().split('T')[0];

    const [existing] = await pool.query(
      'SELECT id FROM attendance_logs WHERE emp_code = ? AND log_date = ? AND check_in IS NOT NULL',
      [req.user.empCode, today]
    );

    if (existing.length === 0) {
      return res.status(400).json({ error: 'Not checked in today' });
    }

    await pool.query(
      `UPDATE attendance_logs SET check_out = NOW(), check_out_lat = ?, check_out_lng = ?,
       location_name = COALESCE(?, location_name), remark = COALESCE(?, remark),
       is_within_geofence = ? WHERE id = ?`,
      [lat || null, lng || null, location || null, remark || null,
       isWithinGeofence !== undefined ? (isWithinGeofence ? 1 : 0) : 1, existing[0].id]
    );

    // Return the full updated row
    const [rows] = await pool.query('SELECT * FROM attendance_logs WHERE id = ?', [existing[0].id]);
    res.json({ message: 'Checked out successfully', time: new Date().toISOString(), row: rows[0] || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/attendance/today — get today's status (MUST be before /:code)
router.get('/today', verifyToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [rows] = await pool.query(
      'SELECT * FROM attendance_logs WHERE emp_code = ? AND log_date = ?',
      [req.user.empCode, today]
    );
    res.json(rows.length > 0 ? rows[0] : { checkedIn: false });
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
