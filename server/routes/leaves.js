const router = require('express').Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { auditLog } = require('../middleware/audit');

const VALID_LEAVE_TYPES = ['casual', 'comp'];

// GET /api/leaves — list leave applications
router.get('/', verifyToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    let countQuery, dataQuery, params;
    if (['MD', 'HR'].includes(req.user.role)) {
      countQuery = 'SELECT COUNT(*) as total FROM leave_applications';
      dataQuery = 'SELECT * FROM leave_applications ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params = [limit, offset];
    } else {
      countQuery = 'SELECT COUNT(*) as total FROM leave_applications WHERE emp_code = ?';
      dataQuery = 'SELECT * FROM leave_applications WHERE emp_code = ? ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params = [req.user.empCode, limit, offset];
    }
    const [[{ total }]] = await pool.query(countQuery, ['MD', 'HR'].includes(req.user.role) ? [] : [req.user.empCode]);
    const [rows] = await pool.query(dataQuery, params);
    res.json({ data: rows, total, page, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/leaves — submit leave application
router.post('/', verifyToken, [
  body('type').trim().isIn(VALID_LEAVE_TYPES).withMessage('Invalid leave type'),
  body('from').isISO8601().withMessage('Valid from date required'),
  body('to').isISO8601().withMessage('Valid to date required'),
  body('reason').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
  try {
    const { type, from, to, reason } = req.body;
    if (!type || !from || !to) return res.status(400).json({ error: 'Type, from and to dates required' });
    if (!VALID_LEAVE_TYPES.includes(type)) return res.status(400).json({ error: 'Invalid leave type' });

    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (toDate < fromDate) return res.status(400).json({ error: 'End date must be after start date' });

    const days = Math.ceil((toDate - fromDate) / 86400000) + 1;

    // Check balance
    const [bal] = await pool.query('SELECT * FROM leave_balances WHERE emp_code = ?', [req.user.empCode]);
    if (bal.length > 0) {
      const available = bal[0][type] || 0;
      if (available < days) return res.status(400).json({ error: 'Insufficient ' + type + ' leave balance (' + available + ' remaining)' });
    }

    // Get employee info
    const [emp] = await pool.query('SELECT name, dept FROM employees WHERE code = ?', [req.user.empCode]);
    const empName = emp.length ? emp[0].name : '';
    const dept = emp.length ? emp[0].dept : '';

    const [result] = await pool.query(
      `INSERT INTO leave_applications (emp_code, emp_name, dept, leave_type, from_date, to_date, days, reason)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.empCode, empName, dept, type, from, to, days, reason || '']
    );
    res.status(201).json({ message: 'Leave application submitted', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/leaves/:id/approve — approve leave (MD/HR)
router.patch('/:id/approve', verifyToken, requireRole('MD', 'HR'), auditLog('approve', 'leave'), async (req, res) => {
  try {
    const [apps] = await pool.query('SELECT * FROM leave_applications WHERE id = ?', [req.params.id]);
    if (apps.length === 0) return res.status(404).json({ error: 'Leave application not found' });
    const app = apps[0];
    if (app.status !== 'pending' && app.status !== 'hr_accepted') return res.status(400).json({ error: 'Leave already ' + app.status });

    // Update application
    await pool.query(
      'UPDATE leave_applications SET status = "approved", reviewed_by = ?, review_date = CURDATE() WHERE id = ?',
      [req.user.empCode, req.params.id]
    );

    // Deduct balance — validate leave_type against whitelist to prevent SQL injection
    if (!VALID_LEAVE_TYPES.includes(app.leave_type)) {
      return res.status(400).json({ error: 'Invalid leave type in application' });
    }
    const col = app.leave_type; // safe: validated against whitelist
    await pool.query(
      `UPDATE leave_balances SET \`${col}\` = GREATEST(0, \`${col}\` - ?) WHERE emp_code = ?`,
      [app.days, app.emp_code]
    );

    res.json({ message: 'Leave approved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/leaves/:id/hr-accept — HR accepts leave (pending → hr_accepted)
router.patch('/:id/hr-accept', verifyToken, requireRole('HR'), auditLog('hr-accept', 'leave'), async (req, res) => {
  try {
    const [apps] = await pool.query('SELECT * FROM leave_applications WHERE id = ?', [req.params.id]);
    if (apps.length === 0) return res.status(404).json({ error: 'Leave application not found' });
    if (apps[0].status !== 'pending') return res.status(400).json({ error: 'Leave already ' + apps[0].status });

    await pool.query(
      'UPDATE leave_applications SET status = "hr_accepted", reviewed_by = ?, review_date = CURDATE() WHERE id = ?',
      [req.user.empCode, req.params.id]
    );
    res.json({ message: 'Leave accepted by HR' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/leaves/:id/reject — reject leave (MD/HR) — can reject pending or hr_accepted
router.patch('/:id/reject', verifyToken, requireRole('MD', 'HR'), auditLog('reject', 'leave'), async (req, res) => {
  try {
    const [apps] = await pool.query('SELECT * FROM leave_applications WHERE id = ?', [req.params.id]);
    if (apps.length === 0) return res.status(404).json({ error: 'Leave application not found' });
    if (apps[0].status !== 'pending' && apps[0].status !== 'hr_accepted') return res.status(400).json({ error: 'Leave already ' + apps[0].status });

    await pool.query(
      'UPDATE leave_applications SET status = "rejected", reviewed_by = ?, review_date = CURDATE() WHERE id = ?',
      [req.user.empCode, req.params.id]
    );
    res.json({ message: 'Leave rejected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/leaves/balance — get leave balance for logged-in user
router.get('/balance', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM leave_balances WHERE emp_code = ?', [req.user.empCode]);
    if (rows.length === 0) {
      // Create default balance
      await pool.query('INSERT INTO leave_balances (emp_code) VALUES (?)', [req.user.empCode]);
      return res.json({ casual: 12, comp: 3 });
    }
    const b = rows[0];
    res.json({ casual: b.casual, comp: b.comp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/leaves/balance/all — all leave balances (MD/HR only)
router.get('/balance/all', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM leave_balances');
    const result = {};
    rows.forEach(r => {
      result[r.emp_code] = { casual: r.casual, earned: r.earned, sick: r.sick, comp: r.comp };
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/leaves/balance/:code — get leave balance for specific employee (MD/HR)
router.get('/balance/:code', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM leave_balances WHERE emp_code = ?', [req.params.code]);
    if (rows.length === 0) return res.json({ casual: 12, comp: 3 });
    const b = rows[0];
    res.json({ casual: b.casual, comp: b.comp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
