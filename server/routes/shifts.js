const router = require('express').Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

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

const VALID_SHIFT_CODES = ['GEN', 'MOR', 'AFT', 'NIG', 'ROT'];

// PUT /api/shifts/:empCode — assign/update shift
router.put('/:empCode', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    const { shift_code, is_eligible } = req.body;
    if (shift_code && !VALID_SHIFT_CODES.includes(shift_code)) {
      return res.status(400).json({ error: 'Invalid shift code' });
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
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
