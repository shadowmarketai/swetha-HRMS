const router = require('express').Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET /api/salary — get salary data (own for Employee, all for MD/HR)
router.get('/', verifyToken, async (req, res) => {
  try {
    let query, params;
    if (['MD', 'HR'].includes(req.user.role)) {
      query = 'SELECT code, name, dept, designation, salary, bank, acc_no FROM employees WHERE is_active = 1 ORDER BY dept, name';
      params = [];
    } else {
      query = 'SELECT code, name, dept, designation, salary, bank, acc_no FROM employees WHERE code = ?';
      params = [req.user.empCode];
    }
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/salary/:code/:month — get specific employee salary for a month
// Month format: "2025-04" (YYYY-MM)
// Returns base salary; frontend computes ±5% monthly variation via seededRandom
router.get('/:code/:month', verifyToken, async (req, res) => {
  try {
    // Only MD/HR can view other employees' salary; employees can view their own
    if (!['MD', 'HR'].includes(req.user.role) && req.user.empCode !== req.params.code) {
      return res.status(403).json({ error: 'Cannot view other employee salary' });
    }
    const [rows] = await pool.query(
      'SELECT code, name, dept, designation, salary, bank, acc_no FROM employees WHERE code = ?',
      [req.params.code]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Employee not found' });
    res.json({ ...rows[0], month: req.params.month });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
