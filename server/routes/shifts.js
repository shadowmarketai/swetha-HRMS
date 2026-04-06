const router = require('express').Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');

// GET /api/shifts — list shift assignments
router.get('/', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM shift_assignments ORDER BY emp_code');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/shifts/types — list shift types
router.get('/types', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM shift_types WHERE is_active = 1 ORDER BY code');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/shifts/types — create shift type
router.post('/types', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    const { code, name, start_time, end_time, color } = req.body;
    if (!code || !name) return res.status(400).json({ error: 'code and name are required' });
    if (code.length > 10) return res.status(400).json({ error: 'code must be 10 chars or less' });
    await pool.query(
      'INSERT INTO shift_types (code, name, start_time, end_time, color) VALUES (?, ?, ?, ?, ?)',
      [code, name, start_time || '09:00', end_time || '18:00', color || '#2563EB']
    );
    const io = req.app.get('io');
    if (io) {
      io.to('role:MD').to('role:HR').emit('shiftType:created', { code, name });
    }
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Shift code already exists' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/shifts/types/:code — update shift type
router.put('/types/:code', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    const { name, start_time, end_time, color } = req.body;
    const [result] = await pool.query(
      'UPDATE shift_types SET name = COALESCE(?, name), start_time = COALESCE(?, start_time), end_time = COALESCE(?, end_time), color = COALESCE(?, color) WHERE code = ?',
      [name, start_time, end_time, color, req.params.code]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Shift type not found' });
    const io = req.app.get('io');
    if (io) {
      io.to('role:MD').to('role:HR').emit('shiftType:updated', { code: req.params.code });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/shifts/types/:code — soft-delete shift type
router.delete('/types/:code', verifyToken, requireRole('MD'), async (req, res) => {
  try {
    const [result] = await pool.query('UPDATE shift_types SET is_active = 0 WHERE code = ?', [req.params.code]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Shift type not found' });
    // Reassign employees on this shift to GEN
    await pool.query('UPDATE shift_assignments SET shift_code = ? WHERE shift_code = ?', ['GEN', req.params.code]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Dynamic valid shift codes from DB
async function getValidShiftCodes() {
  try {
    const [rows] = await pool.query('SELECT code FROM shift_types WHERE is_active = 1');
    return rows.map(r => r.code);
  } catch { return ['GEN']; }
}

// PUT /api/shifts/:empCode — assign/update shift
router.put('/:empCode', verifyToken, requireRole('MD', 'HR'), auditLog('assign', 'shift'), async (req, res) => {
  try {
    const { shift_code, is_eligible } = req.body;
    if (shift_code) {
      const validCodes = await getValidShiftCodes();
      if (!validCodes.includes(shift_code)) return res.status(400).json({ error: 'Invalid shift code' });
    }
    if (is_eligible !== undefined && ![0, 1, true, false].includes(is_eligible)) {
      return res.status(400).json({ error: 'is_eligible must be boolean' });
    }
    const empCode = req.params.empCode;
    await pool.query(
      `INSERT INTO shift_assignments (emp_code, shift_code, is_eligible, assigned_by, effective_date)
       VALUES (?, ?, ?, ?, CURDATE())
       ON DUPLICATE KEY UPDATE shift_code = VALUES(shift_code), is_eligible = VALUES(is_eligible),
       assigned_by = VALUES(assigned_by), updated_at = NOW()`,
      [empCode, shift_code || 'GEN', is_eligible !== undefined ? is_eligible : 1, req.user.empCode]
    );
    const io = req.app.get('io');
    if (io) {
      io.to('role:MD').to('role:HR').emit('shift:assigned', { empCode, shiftCode: shift_code || 'GEN' });
      io.to('user:' + empCode).emit('shift:assigned', { empCode, shiftCode: shift_code || 'GEN' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
