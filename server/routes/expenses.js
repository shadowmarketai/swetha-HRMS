const router = require('express').Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');

// GET /api/expenses — list expense reimbursements
router.get('/', verifyToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    let countQuery, dataQuery, params;
    if (['MD', 'HR'].includes(req.user.role)) {
      countQuery = 'SELECT COUNT(*) as total FROM expense_reimbursements';
      dataQuery = 'SELECT * FROM expense_reimbursements ORDER BY submitted_at DESC LIMIT ? OFFSET ?';
      params = [limit, offset];
    } else {
      countQuery = 'SELECT COUNT(*) as total FROM expense_reimbursements WHERE emp_code = ?';
      dataQuery = 'SELECT * FROM expense_reimbursements WHERE emp_code = ? ORDER BY submitted_at DESC LIMIT ? OFFSET ?';
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

// POST /api/expenses — submit expense
router.post('/', verifyToken, async (req, res) => {
  try {
    const { category, amount, description } = req.body;
    if (!category || !amount) return res.status(400).json({ error: 'Category and amount required' });
    const [emp] = await pool.query('SELECT name FROM employees WHERE code = ?', [req.user.empCode]);
    const empName = emp.length > 0 ? emp[0].name : '';
    const [result] = await pool.query(
      'INSERT INTO expense_reimbursements (emp_code, emp_name, category, amount, description) VALUES (?, ?, ?, ?, ?)',
      [req.user.empCode, empName, category, amount, description || '']
    );
    res.status(201).json({ id: result.insertId, success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/expenses/:id/approve
router.put('/:id/approve', verifyToken, requireRole('MD', 'HR'), auditLog('approve', 'expense'), async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT status FROM expense_reimbursements WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Expense not found' });
    if (existing[0].status !== 'Pending') return res.status(400).json({ error: `Cannot approve: status is ${existing[0].status}` });
    await pool.query(
      'UPDATE expense_reimbursements SET status = "Approved", reviewed_by = ?, review_date = CURDATE() WHERE id = ?',
      [req.user.empCode, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/expenses/:id/reject
router.put('/:id/reject', verifyToken, requireRole('MD', 'HR'), auditLog('reject', 'expense'), async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT status FROM expense_reimbursements WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Expense not found' });
    if (existing[0].status !== 'Pending') return res.status(400).json({ error: `Cannot reject: status is ${existing[0].status}` });
    await pool.query(
      'UPDATE expense_reimbursements SET status = "Rejected", reviewed_by = ?, review_date = CURDATE() WHERE id = ?',
      [req.user.empCode, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
