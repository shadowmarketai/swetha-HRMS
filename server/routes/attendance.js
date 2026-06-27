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
       remark = COALESCE(?, remark),
       selfie_checkout_url = COALESCE(?, selfie_checkout_url) WHERE id = ?`,
      [lat || null, lng || null, remark || null, selfieUrl, active[0].id]
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
router.put('/missed/:id/approve', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
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
router.put('/missed/:id/reject', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
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

// ─────────────────────────────────────────────────────────────────
// GET /api/attendance/export/consolidated  — ExcelJS styled workbook
// Matches the "May 2026 Consolidated" sample format exactly:
//   Serial | Name | Code | Days 1-17 | 10 summary cols | Days 18-end
// Color scheme:  Sunday/Holiday #FFFF00 · Absent #A6CAEC
//                Leave #92D050  · Short hours (<8h) #FFC000
// ─────────────────────────────────────────────────────────────────
router.get('/export/consolidated', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    const ExcelJS = require('exceljs');
    const month = (req.query.month || new Date().toISOString().slice(0, 7)).slice(0, 7); // YYYY-MM
    const [yr, mo] = month.split('-').map(Number);
    const daysInMonth = new Date(yr, mo, 0).getDate();
    const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const isCurrentMonth = (today.getFullYear() === yr && today.getMonth() + 1 === mo);
    const lastDay = isCurrentMonth ? today.getDate() : daysInMonth;

    // Fetch data from DB in parallel
    const [attRows, leaveRows, holidayRows, empRows] = await Promise.all([
      pool.query(
        `SELECT a.emp_code, a.log_date, a.check_in, a.check_out
         FROM attendance_logs a WHERE a.log_date LIKE ? ORDER BY a.emp_code, a.log_date`,
        [month + '%']
      ),
      pool.query(
        `SELECT emp_code, from_date, to_date, days, paid_days, lop_days, is_half_day, half_day_session, leave_type, status
         FROM leave_applications WHERE status = 'approved'
         AND ((from_date LIKE ? OR to_date LIKE ?) OR (from_date < ? AND to_date > ?))`,
        [month + '%', month + '%', month + '-01', month + '-' + String(daysInMonth).padStart(2,'0')]
      ),
      pool.query(`SELECT holiday_date, name FROM public_holidays WHERE holiday_date LIKE ?`, [month + '%']),
      pool.query(`SELECT code, name, dept FROM employees WHERE is_active = 1 ORDER BY name`)
    ]);

    // Build holiday lookup  { 'YYYY-MM-DD': name }
    const holidays = {};
    (holidayRows[0] || []).forEach(h => { holidays[String(h.holiday_date).slice(0,10)] = h.name || 'Holiday'; });

    // Build attendance: empCode -> dayNum -> totalMinutes
    const attMap = {};
    (attRows[0] || []).forEach(row => {
      const dateStr = String(row.log_date).slice(0, 10);
      const d = parseInt(dateStr.slice(8), 10);
      if (!attMap[row.emp_code]) attMap[row.emp_code] = {};
      if (!attMap[row.emp_code][d]) attMap[row.emp_code][d] = { mins: 0 };
      if (row.check_in) {
        const start = new Date(row.check_in).getTime();
        let end;
        if (row.check_out) {
          end = new Date(row.check_out).getTime();
        } else if (isCurrentMonth && d === today.getDate()) {
          end = Date.now();
        } else {
          const autoOut = new Date(new Date(row.check_in).toDateString() + ' 21:00:00').getTime();
          end = Math.min(autoOut, start + 480 * 60000);
        }
        if (end > start) attMap[row.emp_code][d].mins += (end - start) / 60000;
      }
    });

    // Build approved-leave lookup: empCode -> { 'YYYY-MM-DD': 'Leave'|'Half Day'|'LOP' }
    const leaveMap = {};
    (leaveRows[0] || []).forEach(la => {
      const code = la.emp_code;
      if (!leaveMap[code]) leaveMap[code] = {};
      const from = new Date(String(la.from_date).slice(0,10) + 'T00:00:00');
      const to   = new Date(String(la.to_date).slice(0,10) + 'T00:00:00');
      let paidRemain = parseFloat(la.paid_days) > 0 ? parseFloat(la.paid_days) : parseFloat(la.days);
      for (let ld = new Date(from); ld <= to; ld.setDate(ld.getDate() + 1)) {
        if (ld.getDay() === 0) continue;
        const ymd = ld.toISOString().slice(0,10);
        if (holidays[ymd]) continue;
        if (paidRemain > 0) {
          leaveMap[code][ymd] = la.is_half_day ? 'Half Day' : 'Leave';
          paidRemain -= la.is_half_day ? 0.5 : 1;
        } else {
          leaveMap[code][ymd] = 'LOP';
        }
      }
    });

    // Count total working days in month (Mon–Sat, non-holiday, up to lastDay)
    let totalWorkingDays = 0;
    for (let d = 1; d <= lastDay; d++) {
      const dow = new Date(yr, mo - 1, d).getDay();
      const ymd = `${yr}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      if (dow !== 0 && !holidays[ymd]) totalWorkingDays++;
    }

    // ── Build ExcelJS workbook ────────────────────────────────────
    const wb = new ExcelJS.Workbook();
    wb.creator = 'SweRMS';
    wb.created = new Date();
    const ws = wb.addWorksheet('Consolidated');

    // Fill shortcuts (ARGB = alpha + RGB)
    const FILL_YELLOW = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
    const FILL_BLUE   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFA6CAEC' } };
    const FILL_GREEN  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } };
    const FILL_AMBER  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC000' } };
    const FILL_HEADER = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } }; // soft blue-gray
    const FILL_SUMMARY= { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBDD7EE' } }; // summary header
    const BORDER_THIN = { style: 'thin', color: { argb: 'FFBFBFBF' } };
    const BORDER_ALL  = { top: BORDER_THIN, left: BORDER_THIN, bottom: BORDER_THIN, right: BORDER_THIN };
    const FONT_DATA   = { name: 'Calibri', size: 10 };
    const FONT_HEADER = { name: 'Calibri', size: 10, bold: true };
    const ALIGN_CENTER = { horizontal: 'center', vertical: 'middle', wrapText: false };
    const ALIGN_WRAP   = { horizontal: 'center', vertical: 'middle', wrapText: true };
    const ALIGN_LEFT   = { horizontal: 'left', vertical: 'middle', wrapText: false };

    // Column layout: A-C fixed, then days 1-17, then 10 summary, then days 18-end
    const DAYS_PART1 = 17;
    const SUMMARY_COLS = [
      'Total No. of Working Days Except Sunday',
      'Full Day Worked', 'Half Day', 'Leave', 'Absent',
      'WORKED HOURS', 'WORKED MINUTES', 'MINUTES In Decimal',
      'Total Hours', 'Average Hours per Day'
    ];
    const totalCols = 3 + daysInMonth + SUMMARY_COLS.length;

    // Helper: get 1-based Excel column index for a given day (1-indexed day)
    function colForDay(d) {
      return d <= DAYS_PART1
        ? 3 + d                                       // D(4)..T(20) for days 1-17
        : 3 + DAYS_PART1 + SUMMARY_COLS.length + (d - DAYS_PART1); // after summary
    }
    function summaryCol(idx) { return 3 + DAYS_PART1 + 1 + idx; } // 0-indexed idx

    // ── Row 1: Header ────────────────────────────────────────────
    const headerRow = ws.getRow(1);
    function setHdr(colIdx, val, fill) {
      const cell = ws.getCell(1, colIdx);
      cell.value = val;
      cell.font = FONT_HEADER;
      cell.alignment = ALIGN_WRAP;
      cell.border = BORDER_ALL;
      cell.fill = fill || FILL_HEADER;
    }
    setHdr(1, 'Serial No.'); setHdr(2, 'Name'); setHdr(3, 'Employee Code');
    for (let d = 1; d <= daysInMonth; d++) {
      const ymd = `${yr}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const dow = new Date(yr, mo - 1, d).getDay();
      const isWeekend = dow === 0;
      const isHol     = !!holidays[ymd];
      const hdrFill   = (isWeekend || isHol) ? FILL_YELLOW : FILL_HEADER;
      setHdr(colForDay(d), d, hdrFill);
    }
    for (let i = 0; i < SUMMARY_COLS.length; i++) setHdr(summaryCol(i), SUMMARY_COLS[i], FILL_SUMMARY);
    headerRow.height = 30;

    // ── Data rows ────────────────────────────────────────────────
    const monthStr = `${yr}-${String(mo).padStart(2,'0')}`;
    const employees = empRows[0] || [];
    employees.forEach((emp, idx) => {
      const rowIdx = idx + 2;
      const dataRow = ws.getRow(rowIdx);
      dataRow.height = 16;

      function setCell(colIdx, val, fill, numFmt) {
        const cell = ws.getCell(rowIdx, colIdx);
        cell.value = val;
        cell.font = FONT_DATA;
        cell.alignment = ALIGN_CENTER;
        cell.border = BORDER_ALL;
        if (fill) cell.fill = fill;
        if (numFmt) cell.numFmt = numFmt;
      }

      // Fixed columns
      setCell(1, idx + 1);
      const nameCell = ws.getCell(rowIdx, 2);
      nameCell.value = emp.name; nameCell.font = FONT_DATA;
      nameCell.alignment = ALIGN_LEFT; nameCell.border = BORDER_ALL;
      const codeCell = ws.getCell(rowIdx, 3);
      codeCell.value = emp.code; codeCell.font = FONT_DATA;
      codeCell.alignment = ALIGN_CENTER; codeCell.border = BORDER_ALL;

      let totalMins = 0, fullDays = 0, halfDays = 0, leaveDays = 0, absentDays = 0;

      for (let d = 1; d <= daysInMonth; d++) {
        const ymd = `${monthStr}-${String(d).padStart(2,'0')}`;
        const dow = new Date(yr, mo - 1, d).getDay();
        const isFuture = isCurrentMonth && d > lastDay;
        const colIdx = colForDay(d);

        if (dow === 0) {
          setCell(colIdx, 'Sun', FILL_YELLOW);
        } else if (holidays[ymd]) {
          setCell(colIdx, 'Holiday', FILL_YELLOW);
        } else if (isFuture) {
          setCell(colIdx, '');
        } else {
          const att = attMap[emp.code] && attMap[emp.code][d];
          const leaveStatus = leaveMap[emp.code] && leaveMap[emp.code][ymd];
          if (att && att.mins > 0) {
            const h = Math.floor(att.mins / 60);
            const m = Math.round(att.mins % 60);
            const label = `${h}h ${m < 10 ? '0' + m : m}m`;
            const isShort = att.mins < 480; // < 8 hours
            setCell(colIdx, label, isShort ? FILL_AMBER : null);
            if (att.mins >= 480) fullDays++;
            else if (att.mins >= 240) halfDays++;
            totalMins += att.mins;
          } else if (leaveStatus === 'Leave' || leaveStatus === 'Half Day') {
            setCell(colIdx, leaveStatus, FILL_GREEN);
            if (leaveStatus === 'Leave') leaveDays++;
            else halfDays++;
          } else if (leaveStatus === 'LOP') {
            setCell(colIdx, 'LOP', FILL_BLUE);
            absentDays++;
          } else {
            setCell(colIdx, 'Absent', FILL_BLUE);
            absentDays++;
          }
        }
      }

      // Summary columns
      const workedH   = Math.floor(totalMins / 60);
      const workedM   = Math.round(totalMins % 60);
      const minsDecimal = +(workedM / 60).toFixed(3);
      const totalHours = +(totalMins / 60).toFixed(2);
      const avgHours   = fullDays > 0 ? +(totalHours / fullDays).toFixed(2) : 0;

      setCell(summaryCol(0), totalWorkingDays);
      setCell(summaryCol(1), fullDays);
      setCell(summaryCol(2), halfDays || '');
      setCell(summaryCol(3), leaveDays || '');
      setCell(summaryCol(4), absentDays || '');
      setCell(summaryCol(5), workedH);
      setCell(summaryCol(6), workedM);
      setCell(summaryCol(7), minsDecimal);
      setCell(summaryCol(8), totalHours);
      setCell(summaryCol(9), avgHours);
    });

    // ── Column widths ─────────────────────────────────────────────
    ws.getColumn(1).width = 7;   // Serial
    ws.getColumn(2).width = 22;  // Name
    ws.getColumn(3).width = 12;  // Code
    for (let d = 1; d <= daysInMonth; d++) ws.getColumn(colForDay(d)).width = 9;
    ws.getColumn(summaryCol(0)).width = 14;
    ws.getColumn(summaryCol(1)).width = 12;
    ws.getColumn(summaryCol(2)).width = 9;
    ws.getColumn(summaryCol(3)).width = 9;
    ws.getColumn(summaryCol(4)).width = 9;
    ws.getColumn(summaryCol(5)).width = 12;
    ws.getColumn(summaryCol(6)).width = 12;
    ws.getColumn(summaryCol(7)).width = 14;
    ws.getColumn(summaryCol(8)).width = 12;
    ws.getColumn(summaryCol(9)).width = 16;

    // ── Freeze panes at D2 so serial/name/code + header stay fixed ─
    ws.views = [{ state: 'frozen', xSplit: 3, ySplit: 1, topLeftCell: 'D2' }];

    // ── Send response ─────────────────────────────────────────────
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const filename = `${monthNames[mo-1]}_${yr}_Consolidated.xlsx`;
    const buf = await wb.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buf);
  } catch (err) {
    console.error('[attendance/export/consolidated]', err);
    if (!res.headersSent) res.status(500).json({ error: 'Failed to generate consolidated report' });
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/attendance/export/punch-detail  — Punch In/Out detail XLSX
// Matches "Sheet1" format: 3 header rows, each day has IN/OUT columns
// ─────────────────────────────────────────────────────────────────
router.get('/export/punch-detail', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    const ExcelJS = require('exceljs');
    const month = (req.query.month || new Date().toISOString().slice(0, 7)).slice(0, 7);
    const [yr, mo] = month.split('-').map(Number);
    const daysInMonth = new Date(yr, mo, 0).getDate();
    const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const isCurrentMonth = (today.getFullYear() === yr && today.getMonth() + 1 === mo);
    const lastDay = isCurrentMonth ? today.getDate() : daysInMonth;

    function fmtTime(dtStr) {
      if (!dtStr) return '';
      const d = dtStr instanceof Date ? dtStr : new Date(typeof dtStr === 'string' ? dtStr.replace(' ', 'T') : dtStr);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
    }

    const [attRows, leaveRows, holidayRows, empRows] = await Promise.all([
      pool.query(
        `SELECT a.emp_code, a.log_date, a.check_in, a.check_out
         FROM attendance_logs a WHERE a.log_date LIKE ? ORDER BY a.emp_code, a.log_date`,
        [month + '%']
      ),
      pool.query(
        `SELECT emp_code, from_date, to_date, days, paid_days, lop_days, is_half_day, leave_type, status
         FROM leave_applications WHERE status = 'approved'
         AND ((from_date LIKE ? OR to_date LIKE ?) OR (from_date < ? AND to_date > ?))`,
        [month + '%', month + '%', month + '-01', month + '-' + String(daysInMonth).padStart(2,'0')]
      ),
      pool.query(`SELECT holiday_date, name FROM public_holidays WHERE holiday_date LIKE ?`, [month + '%']),
      pool.query(`SELECT code, name FROM employees WHERE is_active = 1 ORDER BY CHAR_LENGTH(code), code`)
    ]);

    const holidays = {};
    (holidayRows[0] || []).forEach(h => { holidays[String(h.holiday_date).slice(0,10)] = h.name || 'Holiday'; });

    // attMap: empCode -> dayNum -> { checkIn, checkOut, mins, missingOut, eveningOnly }
    const EVENING_CUTOFF_HOUR = 14; // 2:00 PM IST — check_in at/after this = evening-only
    const attMap = {};
    (attRows[0] || []).forEach(row => {
      const dateStr = String(row.log_date).slice(0, 10);
      const d = parseInt(dateStr.slice(8), 10);
      if (!attMap[row.emp_code]) attMap[row.emp_code] = {};
      if (!attMap[row.emp_code][d]) attMap[row.emp_code][d] = { checkIn: null, checkOut: null, mins: 0, missingOut: false, eveningOnly: false };
      const entry = attMap[row.emp_code][d];
      if (row.check_in) {
        if (!entry.checkIn || new Date(row.check_in) < new Date(entry.checkIn)) entry.checkIn = row.check_in;
        const start = new Date(row.check_in).getTime();
        let end;
        if (row.check_out && (new Date(row.check_out).getTime() - start) >= 5 * 60000) {
          // Valid checkout — gap is at least 5 minutes
          end = new Date(row.check_out).getTime();
          if (!entry.checkOut || new Date(row.check_out) > new Date(entry.checkOut)) entry.checkOut = row.check_out;
        } else if (row.check_out) {
          // Same-time or near-instant checkout (< 5 min) — treat as single check-in only
        } else if (isCurrentMonth && d === today.getDate()) {
          end = Date.now(); // still active today — credit up to now
        } else {
          // Rule A: missing checkout on past day — credit only 4h (half day), not 8h
          entry.missingOut = true;
          end = start + 4 * 60 * 60000;
        }
        if (end && end > start) entry.mins += (end - start) / 60000;
      }
      // Capture check_out for single-punch records where check_in is missing
      if (!row.check_in && row.check_out) {
        if (!entry.checkOut || new Date(row.check_out) > new Date(entry.checkOut)) {
          entry.checkOut = row.check_out;
        }
      }
    });

    // Rule B: Evening-only detection — check_in at/after 14:00 IST caps credited hours at 4h
    for (const code of Object.keys(attMap)) {
      for (const d of Object.keys(attMap[code])) {
        const entry = attMap[code][d];
        if (entry.checkIn) {
          const ist = new Date(new Date(entry.checkIn).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
          if (ist.getHours() >= EVENING_CUTOFF_HOUR) {
            entry.eveningOnly = true;
            if (entry.mins > 240) entry.mins = 240;
          }
        }
      }
    }

    const leaveMap = {};
    (leaveRows[0] || []).forEach(la => {
      const code = la.emp_code;
      if (!leaveMap[code]) leaveMap[code] = {};
      const from = new Date(String(la.from_date).slice(0,10) + 'T00:00:00');
      const to   = new Date(String(la.to_date).slice(0,10) + 'T00:00:00');
      let paidRemain = parseFloat(la.paid_days) > 0 ? parseFloat(la.paid_days) : parseFloat(la.days);
      for (let ld = new Date(from); ld <= to; ld.setDate(ld.getDate() + 1)) {
        if (ld.getDay() === 0) continue;
        const ymd = ld.toISOString().slice(0,10);
        if (holidays[ymd]) continue;
        leaveMap[code][ymd] = paidRemain > 0 ? (la.is_half_day ? 'Half Day' : 'Leave') : 'LOP';
        paidRemain -= la.is_half_day ? 0.5 : 1;
      }
    });

    let totalWorkingDays = 0;
    for (let d = 1; d <= lastDay; d++) {
      const dow = new Date(yr, mo - 1, d).getDay();
      const ymd = `${yr}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      if (dow !== 0 && !holidays[ymd]) totalWorkingDays++;
    }

    const wb = new ExcelJS.Workbook();
    wb.creator = 'SweRMS';
    const ws = wb.addWorksheet('Punch Detail');

    const FILL_YELLOW      = { type:'pattern', pattern:'solid', fgColor:{ argb:'FFFFFF00' } };
    const FILL_BLUE        = { type:'pattern', pattern:'solid', fgColor:{ argb:'FFA6CAEC' } };
    const FILL_GREEN       = { type:'pattern', pattern:'solid', fgColor:{ argb:'FF92D050' } };
    const FILL_AMBER       = { type:'pattern', pattern:'solid', fgColor:{ argb:'FFFFC000' } };
    const FILL_MISSING_OUT = { type:'pattern', pattern:'solid', fgColor:{ argb:'FFFFB3C1' } }; // Rule C: pink — missing checkout
    const FILL_EVENING     = { type:'pattern', pattern:'solid', fgColor:{ argb:'FFFFC19B' } }; // Rule D: peach/orange — evening-only
    const FILL_HEADER      = { type:'pattern', pattern:'solid', fgColor:{ argb:'FFD9E1F2' } };
    const FILL_SUMMARY     = { type:'pattern', pattern:'solid', fgColor:{ argb:'FFBDD7EE' } };
    const FILL_TITLE       = { type:'pattern', pattern:'solid', fgColor:{ argb:'FF1F3864' } };
    const BORDER_THIN  = { style:'thin', color:{ argb:'FFBFBFBF' } };
    const BORDER_ALL   = { top:BORDER_THIN, left:BORDER_THIN, bottom:BORDER_THIN, right:BORDER_THIN };
    const FONT_DATA    = { name:'Calibri', size:9 };
    const FONT_BOLD    = { name:'Calibri', size:9, bold:true };
    const FONT_TITLE   = { name:'Calibri', size:11, bold:true, color:{ argb:'FFFFFFFF' } };
    const ALIGN_CTR    = { horizontal:'center', vertical:'middle', wrapText:true };
    const ALIGN_LEFT   = { horizontal:'left', vertical:'middle' };

    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const dayLetters  = ['Su','Mo','Tu','We','Th','Fr','Sa'];
    const SUMMARY_COLS = ['Working\nDays','Full\nDay','Half\nDay','Leave','Absent','Total\nHours','Missing\nOut','Evening\nOnly'];

    // Column layout: col 1=S.No, 2=Name, 3=Code, then 2 cols per day, then 8 summary
    const totalCols = 3 + daysInMonth * 2 + SUMMARY_COLS.length;

    // ── Row 1: Title ─────────────────────────────────────────────
    ws.getRow(1).height = 22;
    const titleCell = ws.getCell(1, 1);
    titleCell.value = `${monthNames[mo-1]} ${yr} — Attendance Report`;
    titleCell.font = FONT_TITLE;
    titleCell.fill = FILL_TITLE;
    titleCell.alignment = { horizontal:'left', vertical:'middle' };
    ws.mergeCells(1, 1, 1, totalCols);

    // ── Row 2: Day headers (each day spans 2 cols: IN+OUT) ───────
    ws.getRow(2).height = 28;
    function setR2(col, val, fill) {
      const cell = ws.getCell(2, col);
      cell.value = val; cell.font = FONT_BOLD;
      cell.alignment = ALIGN_CTR; cell.border = BORDER_ALL;
      cell.fill = fill || FILL_HEADER;
    }
    setR2(1, 'S.No'); setR2(2, 'Name'); setR2(3, 'Code');
    ws.mergeCells(2, 2, 3, 2); // Name spans rows 2-3
    ws.mergeCells(2, 3, 3, 3); // Code spans rows 2-3
    ws.mergeCells(2, 1, 3, 1); // S.No spans rows 2-3

    for (let d = 1; d <= daysInMonth; d++) {
      const ymd = `${yr}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const dow = new Date(yr, mo - 1, d).getDay();
      const isWeekend = dow === 0;
      const isHol = !!holidays[ymd];
      const colStart = 3 + (d - 1) * 2 + 1;
      const dayFill = (isWeekend || isHol) ? FILL_YELLOW : FILL_HEADER;
      const dayLabel = d + '\n' + dayLetters[dow];
      ws.getCell(2, colStart).value = dayLabel;
      ws.getCell(2, colStart).font = FONT_BOLD;
      ws.getCell(2, colStart).alignment = ALIGN_CTR;
      ws.getCell(2, colStart).border = BORDER_ALL;
      ws.getCell(2, colStart).fill = dayFill;
      ws.mergeCells(2, colStart, 2, colStart + 1);
    }
    for (let i = 0; i < SUMMARY_COLS.length; i++) {
      const c = 3 + daysInMonth * 2 + 1 + i;
      ws.getCell(2, c).value = SUMMARY_COLS[i];
      ws.getCell(2, c).font = FONT_BOLD;
      ws.getCell(2, c).alignment = ALIGN_CTR;
      ws.getCell(2, c).border = BORDER_ALL;
      ws.getCell(2, c).fill = FILL_SUMMARY;
      ws.mergeCells(2, c, 3, c);
    }

    // ── Row 3: IN/OUT sub-headers ─────────────────────────────────
    ws.getRow(3).height = 16;
    for (let d = 1; d <= daysInMonth; d++) {
      const ymd = `${yr}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const dow = new Date(yr, mo - 1, d).getDay();
      const isWeekend = dow === 0;
      const isHol = !!holidays[ymd];
      const subFill = (isWeekend || isHol) ? FILL_YELLOW : FILL_HEADER;
      const colIN  = 3 + (d - 1) * 2 + 1;
      const colOUT = colIN + 1;
      ['IN','OUT'].forEach((lbl, i) => {
        const cell = ws.getCell(3, colIN + i);
        cell.value = lbl; cell.font = FONT_BOLD;
        cell.alignment = ALIGN_CTR; cell.border = BORDER_ALL;
        cell.fill = subFill;
      });
    }

    // ── Data rows ─────────────────────────────────────────────────
    const employees = empRows[0] || [];
    const monthStr = `${yr}-${String(mo).padStart(2,'0')}`;

    employees.forEach((emp, idx) => {
      const rowIdx = idx + 4;
      ws.getRow(rowIdx).height = 15;

      function setCell(col, val, fill, alignLeft) {
        const cell = ws.getCell(rowIdx, col);
        cell.value = val === null || val === undefined ? '' : val;
        cell.font = FONT_DATA;
        cell.alignment = alignLeft ? ALIGN_LEFT : ALIGN_CTR;
        cell.border = BORDER_ALL;
        if (fill) cell.fill = fill;
      }

      setCell(1, idx + 1);
      setCell(2, emp.name, null, true);
      setCell(3, emp.code);

      let totalMins = 0, fullDays = 0, halfDays = 0, leaveDays = 0, absentDays = 0, missingOutDays = 0, eveningOnlyDays = 0;

      for (let d = 1; d <= daysInMonth; d++) {
        const ymd = `${monthStr}-${String(d).padStart(2,'0')}`;
        const dow = new Date(yr, mo - 1, d).getDay();
        const isFuture = isCurrentMonth && d > lastDay;
        const colIN  = 3 + (d - 1) * 2 + 1;
        const colOUT = colIN + 1;

        const att = attMap[emp.code] && attMap[emp.code][d];
        const leaveStatus = leaveMap[emp.code] && leaveMap[emp.code][ymd];
        const isSun = dow === 0;
        const isHol = !!holidays[ymd];

        if (isFuture) {
          setCell(colIN, ''); setCell(colOUT, '');
        } else if ((isSun || isHol) && att && att.checkIn) {
          // Employee worked on Sunday/holiday — show actual punch times in orange
          const FILL_ORANGE = { type:'pattern', pattern:'solid', fgColor:{ argb:'FFFF6600' } };
          setCell(colIN,  fmtTime(att.checkIn),  FILL_ORANGE);
          setCell(colOUT, att.checkOut ? fmtTime(att.checkOut) : '', FILL_ORANGE);
          totalMins += att.mins;
        } else if (isSun) {
          setCell(colIN, 'Sun', FILL_YELLOW); setCell(colOUT, '', FILL_YELLOW);
        } else if (isHol) {
          setCell(colIN, 'Holiday', FILL_YELLOW); setCell(colOUT, '', FILL_YELLOW);
        } else if (att && att.checkIn) {
          const inTime  = fmtTime(att.checkIn);
          const outTime = att.checkOut ? fmtTime(att.checkOut) : '—';
          // Rule C/D: pick fill based on punch quality
          let cellFill;
          if (att.eveningOnly && att.missingOut) {
            cellFill = FILL_EVENING;        // both flags — evening takes priority
            eveningOnlyDays++; missingOutDays++;
          } else if (att.eveningOnly) {
            cellFill = FILL_EVENING;        // Rule D: peach — evening-only session
            eveningOnlyDays++;
          } else if (att.missingOut) {
            cellFill = FILL_MISSING_OUT;    // Rule C: pink — no checkout
            missingOutDays++;
          } else if (att.mins < 480) {
            cellFill = FILL_AMBER;          // short day (< 8h) but valid punches
          }
          setCell(colIN,  inTime,  cellFill);
          setCell(colOUT, outTime, cellFill);
          if (att.mins >= 480) fullDays++;
          else if (att.mins >= 240) halfDays++;
          totalMins += att.mins;
        } else if (att && att.checkOut) {
          // Single punch — check-in missing, only check-out recorded
          const FILL_SINGLE = { type:'pattern', pattern:'solid', fgColor:{ argb:'FFFFD966' } };
          setCell(colIN,  '—',                   FILL_SINGLE);
          setCell(colOUT, fmtTime(att.checkOut), FILL_SINGLE);
          halfDays++;
          totalMins += 240;
        } else if (leaveStatus === 'Leave' || leaveStatus === 'Half Day') {
          setCell(colIN,  leaveStatus, FILL_GREEN);
          setCell(colOUT, '',          FILL_GREEN);
          if (leaveStatus === 'Leave') leaveDays++;
          else halfDays++;
        } else if (leaveStatus === 'LOP') {
          setCell(colIN,  'LOP', FILL_BLUE);
          setCell(colOUT, '',    FILL_BLUE);
          absentDays++;
        } else {
          setCell(colIN,  'Absent', FILL_BLUE);
          setCell(colOUT, '',       FILL_BLUE);
          absentDays++;
        }
      }

      const tH = Math.floor(totalMins / 60), tM = Math.round(totalMins % 60);
      const summaryBase = 3 + daysInMonth * 2 + 1;
      setCell(summaryBase + 0, totalWorkingDays,                         FILL_SUMMARY);
      setCell(summaryBase + 1, fullDays,                                  FILL_SUMMARY);
      setCell(summaryBase + 2, halfDays      || '',                       FILL_SUMMARY);
      setCell(summaryBase + 3, leaveDays     || '',                       FILL_SUMMARY);
      setCell(summaryBase + 4, absentDays    || '',                       FILL_SUMMARY);
      setCell(summaryBase + 5, `${tH}h ${tM < 10 ? '0'+tM : tM}m`,      FILL_SUMMARY);
      // Rule E & F: extra audit columns
      setCell(summaryBase + 6, missingOutDays  || '', FILL_MISSING_OUT);
      setCell(summaryBase + 7, eveningOnlyDays || '', FILL_EVENING);
    });

    // ── Column widths ─────────────────────────────────────────────
    ws.getColumn(1).width = 6;
    ws.getColumn(2).width = 22;
    ws.getColumn(3).width = 11;
    for (let d = 1; d <= daysInMonth; d++) {
      ws.getColumn(3 + (d-1)*2 + 1).width = 7;
      ws.getColumn(3 + (d-1)*2 + 2).width = 7;
    }
    const summaryBase = 3 + daysInMonth * 2 + 1;
    [12, 7, 7, 7, 7, 10, 9, 9].forEach((w, i) => { ws.getColumn(summaryBase + i).width = w; });

    ws.views = [{ state:'frozen', xSplit:3, ySplit:3, topLeftCell:'D4' }];

    const filename = `${monthNames[mo-1]}_${yr}_PunchDetail.xlsx`;
    const buf = await wb.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buf);
  } catch (err) {
    console.error('[attendance/export/punch-detail]', err);
    if (!res.headersSent) res.status(500).json({ error: 'Failed to generate punch detail report' });
  }
});

module.exports = router;
