const router = require('express').Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Get current date in IST (India Standard Time)
function getTodayIST() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

// Haversine distance in meters between two lat/lng pairs
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg) => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Server-side geofence check — never trust client's isWithinGeofence
async function checkGeofence(lat, lng) {
  if (lat === null || lat === undefined || lng === null || lng === undefined) return { within: false, site: null };
  const parsedLat = parseFloat(lat);
  const parsedLng = parseFloat(lng);
  if (isNaN(parsedLat) || isNaN(parsedLng) || parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
    return { within: false, site: null };
  }
  const [sites] = await pool.query('SELECT name, lat, lng, radius FROM geofence_sites WHERE is_active = 1');
  for (const site of sites) {
    const dist = haversineDistance(parsedLat, parsedLng, parseFloat(site.lat), parseFloat(site.lng));
    if (dist <= site.radius) return { within: true, site: site.name };
  }
  return { within: false, site: null };
}

// POST /api/attendance/checkin — GPS check-in (supports multiple sessions per day)
router.post('/checkin', verifyToken, upload.single('selfie'), async (req, res) => {
  try {
    const { lat, lng, location, remark, accuracy } = req.body;
    const today = getTodayIST();

    // Check if there's an active session (checked in but not checked out)
    const [active] = await pool.query(
      'SELECT id FROM attendance_logs WHERE emp_code = ? AND log_date = ? AND check_in IS NOT NULL AND check_out IS NULL',
      [req.user.empCode, today]
    );

    if (active.length > 0) {
      return res.status(400).json({ error: 'Already checked in. Please check out first.' });
    }

    // Server-side geofence verification
    const geo = await checkGeofence(lat, lng);

    // Selfie URL if uploaded
    const selfieUrl = req.file ? '/uploads/' + req.file.filename : null;

    // Create a new check-in session (allows re-checkin after checkout)
    const [result] = await pool.query(
      `INSERT INTO attendance_logs (emp_code, check_in, check_in_lat, check_in_lng, status, log_date,
       location_name, remark, is_within_geofence, accuracy, selfie_checkin_url)
       VALUES (?, NOW(), ?, ?, "Present", ?, ?, ?, ?, ?, ?)`,
      [req.user.empCode, lat || null, lng || null, today,
       geo.site || location || null, remark || null,
       geo.within ? 1 : 0, accuracy || null, selfieUrl]
    );

    const [rows] = await pool.query('SELECT * FROM attendance_logs WHERE id = ?', [result.insertId]);
    // Real-time: broadcast check-in to MD/HR
    const io = req.app.get('io');
    if (io) {
      io.to('role:MD').to('role:HR').emit('attendance:checkin', {
        empCode: req.user.empCode, name: req.user.name, location: geo.site || location || 'Unknown',
        time: new Date().toISOString(), isWithinGeofence: geo.within
      });
    }
    res.json({ message: 'Checked in successfully', time: new Date().toISOString(), row: rows[0] || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/attendance/checkout — GPS check-out (closes latest active session)
router.post('/checkout', verifyToken, upload.single('selfie'), async (req, res) => {
  try {
    const { lat, lng, location, remark } = req.body;
    const today = getTodayIST();

    // Find latest active session (checked in but not checked out)
    const [active] = await pool.query(
      'SELECT id FROM attendance_logs WHERE emp_code = ? AND log_date = ? AND check_in IS NOT NULL AND check_out IS NULL ORDER BY check_in DESC LIMIT 1',
      [req.user.empCode, today]
    );

    if (active.length === 0) {
      return res.status(400).json({ error: 'Not checked in. Please check in first.' });
    }

    // Server-side geofence verification for checkout
    const geo = await checkGeofence(lat, lng);

    // Selfie URL if uploaded
    const selfieUrl = req.file ? '/uploads/' + req.file.filename : null;

    await pool.query(
      `UPDATE attendance_logs SET check_out = NOW(), check_out_lat = ?, check_out_lng = ?,
       location_name = COALESCE(?, location_name), remark = COALESCE(?, remark),
       is_within_geofence = ?, selfie_checkout_url = COALESCE(?, selfie_checkout_url) WHERE id = ?`,
      [lat || null, lng || null, geo.site || location || null, remark || null,
       geo.within ? 1 : 0, selfieUrl, active[0].id]
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
    const today = getTodayIST();
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
      if (req.query.empCode) {
        query = `SELECT a.*, e.name, e.dept FROM attendance_logs a
                 JOIN employees e ON a.emp_code = e.code
                 WHERE a.emp_code = ? AND a.log_date LIKE ? ORDER BY a.log_date ASC, a.check_in ASC`;
        params = [req.query.empCode, month + '%'];
      } else {
        query = `SELECT a.*, e.name, e.dept FROM attendance_logs a
                 JOIN employees e ON a.emp_code = e.code
                 WHERE a.log_date LIKE ? ORDER BY a.log_date DESC, e.name`;
        params = [month + '%'];
      }
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

// GET /api/attendance/debug — temporary debug endpoint
router.get('/debug', verifyToken, async (req, res) => {
  try {
    if (!['MD', 'HR'].includes(req.user.role)) return res.status(403).json({ error: 'MD/HR only' });
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM attendance_logs');
    const [[{ thisMonth }]] = await pool.query("SELECT COUNT(*) as thisMonth FROM attendance_logs WHERE log_date LIKE CONCAT(DATE_FORMAT(NOW(),'%Y-%m'),'%')");
    const [latest] = await pool.query('SELECT emp_code, log_date, check_in, check_out FROM attendance_logs ORDER BY log_date DESC, check_in DESC LIMIT 10');
    const [empCodes] = await pool.query('SELECT DISTINCT emp_code FROM attendance_logs');
    const [employees] = await pool.query('SELECT code, name FROM employees LIMIT 20');
    const [[{ joinCount }]] = await pool.query(`SELECT COUNT(*) as joinCount FROM attendance_logs a JOIN employees e ON a.emp_code = e.code`);
    const [[{ noJoin }]] = await pool.query(`SELECT COUNT(*) as noJoin FROM attendance_logs a LEFT JOIN employees e ON a.emp_code = e.code WHERE e.code IS NULL`);
    res.json({ total, thisMonth, joinCount, orphanedRecords: noJoin, latestRecords: latest, attendanceEmpCodes: empCodes.map(r => r.emp_code), employeeCodes: employees.map(r => ({ code: r.code, name: r.name })), serverTime: new Date().toISOString(), serverDate: new Date().toISOString().split('T')[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================
// MISSED ATTENDANCE REQUESTS
// =====================================================

// POST /api/attendance/missed — employee submits missed attendance request
router.post('/missed', verifyToken, upload.single('proof'), async (req, res) => {
  try {
    const { date, reason } = req.body;
    if (!date || !reason) return res.status(400).json({ error: 'Date and reason are required' });

    // Check if already has attendance for that date
    const [existing] = await pool.query(
      'SELECT id FROM attendance_logs WHERE emp_code = ? AND log_date = ?',
      [req.user.empCode, date]
    );
    if (existing.length > 0) return res.status(400).json({ error: 'You already have attendance recorded for this date' });

    // Check if already has a pending request for that date
    const [pendingReq] = await pool.query(
      "SELECT id FROM missed_attendance_requests WHERE emp_code = ? AND request_date = ? AND status = 'pending'",
      [req.user.empCode, date]
    );
    if (pendingReq.length > 0) return res.status(400).json({ error: 'You already have a pending request for this date' });

    const proofUrl = req.file ? '/uploads/' + req.file.filename : null;

    const [result] = await pool.query(
      'INSERT INTO missed_attendance_requests (emp_code, request_date, reason, proof_url) VALUES (?, ?, ?, ?)',
      [req.user.empCode, date, reason, proofUrl]
    );

    // Notify HR
    const io = req.app.get('io');
    if (io) {
      io.to('role:HR').emit('missed-attendance:new', {
        empCode: req.user.empCode, name: req.user.name, date, reason
      });
    }

    res.json({ message: 'Missed attendance request submitted', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/attendance/missed — list missed attendance requests
router.get('/missed', verifyToken, async (req, res) => {
  try {
    let query, params;
    if (req.user.role === 'HR' || req.user.role === 'MD') {
      query = `SELECT m.*, e.name, e.dept FROM missed_attendance_requests m
               JOIN employees e ON m.emp_code = e.code
               ORDER BY m.created_at DESC LIMIT 200`;
      params = [];
    } else {
      query = `SELECT * FROM missed_attendance_requests WHERE emp_code = ? ORDER BY created_at DESC LIMIT 50`;
      params = [req.user.empCode];
    }
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/attendance/missed/:id/approve — HR approves missed attendance
router.put('/missed/:id/approve', verifyToken, requireRole('HR'), async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const [rows] = await pool.query('SELECT * FROM missed_attendance_requests WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Request not found' });
    if (rows[0].status !== 'pending') return res.status(400).json({ error: 'Request already ' + rows[0].status });

    const request = rows[0];

    // Mark request as approved
    await pool.query(
      "UPDATE missed_attendance_requests SET status = 'approved', reviewed_by = ?, reviewed_at = NOW(), review_note = ? WHERE id = ?",
      [req.user.empCode, note || null, id]
    );

    // Auto-create attendance record for that date
    await pool.query(
      `INSERT INTO attendance_logs (emp_code, check_in, status, log_date, location_name, remark)
       VALUES (?, CONCAT(?, ' 09:00:00'), 'Present', ?, 'Missed Check-In (Approved)', ?)`,
      [request.emp_code, request.request_date, request.request_date, 'Missed attendance approved by HR: ' + (request.reason || '')]
    );

    // Notify the employee
    const io = req.app.get('io');
    if (io) {
      io.to('user:' + request.emp_code).emit('missed-attendance:approved', { date: request.request_date });
    }

    res.json({ message: 'Request approved and attendance marked' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/attendance/missed/:id/reject — HR rejects missed attendance
router.put('/missed/:id/reject', verifyToken, requireRole('HR'), async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const [rows] = await pool.query('SELECT * FROM missed_attendance_requests WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Request not found' });
    if (rows[0].status !== 'pending') return res.status(400).json({ error: 'Request already ' + rows[0].status });

    await pool.query(
      "UPDATE missed_attendance_requests SET status = 'rejected', reviewed_by = ?, reviewed_at = NOW(), review_note = ? WHERE id = ?",
      [req.user.empCode, note || null, id]
    );

    // Notify the employee
    const io = req.app.get('io');
    if (io) {
      io.to('user:' + rows[0].emp_code).emit('missed-attendance:rejected', { date: rows[0].request_date });
    }

    res.json({ message: 'Request rejected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
