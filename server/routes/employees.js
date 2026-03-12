const router = require('express').Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { auditLog } = require('../middleware/audit');

// GET /api/employees — list all (MD/HR) or self (Employee)
router.get('/', verifyToken, async (req, res) => {
  try {
    if (!['MD', 'HR'].includes(req.user.role)) {
      const [rows] = await pool.query('SELECT * FROM employees WHERE code = ?', [req.user.empCode]);
      return res.json(rows);
    }
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM employees WHERE is_active = 1');
    const [rows] = await pool.query('SELECT * FROM employees WHERE is_active = 1 ORDER BY dept, name LIMIT ? OFFSET ?', [limit, offset]);
    res.json({ data: rows, total, page, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/employees/:code — IDOR protected
router.get('/:code', verifyToken, async (req, res) => {
  try {
    // Employees can only view their own record; MD/HR can view anyone
    if (req.user.role === 'Employee' && req.params.code !== req.user.empCode) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const [rows] = await pool.query('SELECT * FROM employees WHERE code = ?', [req.params.code]);
    if (rows.length === 0) return res.status(404).json({ error: 'Employee not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/employees — add new (MD/HR only)
router.post('/', verifyToken, requireRole('MD', 'HR'), [
  body('code').trim().notEmpty().withMessage('Employee code required'),
  body('name').trim().notEmpty().isLength({ max: 100 }).withMessage('Name required (max 100 chars)'),
  body('dept').trim().notEmpty().withMessage('Department required'),
  body('salary').optional().isNumeric()
], auditLog('create', 'employee'), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
  try {
    const { code, name, dept, designation, salary, bank, accNo, role, phone, doj } = req.body;
    if (!code || !name || !dept) {
      return res.status(400).json({ error: 'Code, name, and department required' });
    }
    await pool.query(
      'INSERT INTO employees (code, name, dept, designation, salary, bank, acc_no, role, phone, doj) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [code, name, dept, designation || '', salary || 0, bank || '', accNo || '', role || 'Employee', phone || '', doj || null]
    );
    res.status(201).json({ message: 'Employee added', code });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Employee code already exists' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/employees/:code — update (partial updates supported)
router.put('/:code', verifyToken, requireRole('MD', 'HR'), auditLog('update', 'employee'), async (req, res) => {
  try {
    // Fetch existing record to merge with partial updates
    const [existing] = await pool.query('SELECT * FROM employees WHERE code = ?', [req.params.code]);
    if (existing.length === 0) return res.status(404).json({ error: 'Employee not found' });
    const cur = existing[0];
    const b = req.body;
    const [result] = await pool.query(
      `UPDATE employees SET name=?, dept=?, designation=?, salary=?, bank=?, acc_no=?, role=?, phone=?, doj=?, email=?, address=? WHERE code=?`,
      [
        b.name ?? cur.name, b.dept ?? cur.dept, b.designation ?? cur.designation,
        b.salary ?? cur.salary, b.bank ?? cur.bank, b.accNo ?? cur.acc_no,
        b.role ?? cur.role, b.phone ?? cur.phone, b.doj ?? cur.doj,
        b.email ?? cur.email, b.address ?? cur.address, req.params.code
      ]
    );
    res.json({ message: 'Employee updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/employees/:code — soft delete
router.delete('/:code', verifyToken, requireRole('MD'), auditLog('delete', 'employee'), async (req, res) => {
  try {
    await pool.query('UPDATE employees SET is_active = 0 WHERE code = ?', [req.params.code]);
    res.json({ message: 'Employee deactivated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
