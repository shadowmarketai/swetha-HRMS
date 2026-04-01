const router = require('express').Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');
const upload = require('../middleware/upload');

// Helper: create notifications for multiple users
async function notifyUsers(pool, empCodes, title, message, type) {
  if (!empCodes || empCodes.length === 0) return;
  const unique = [...new Set(empCodes)];
  const values = unique.map(code => [code, title, message, type]);
  try {
    await pool.query('INSERT INTO notifications (emp_code, title, message, type) VALUES ?', [values]);
  } catch (e) { console.error('Notify error:', e.message); }
}

// Helper: get emp_codes by role
async function getEmpCodesByRole(pool, roles) {
  const [rows] = await pool.query('SELECT emp_code FROM users WHERE role IN (?) AND is_active = 1', [roles]);
  return rows.map(r => r.emp_code);
}

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
    const [countResult] = await pool.query(countQuery, ['MD', 'HR'].includes(req.user.role) ? [] : [req.user.empCode]);
    const total = (countResult && countResult[0]) ? countResult[0].total : 0;
    const [rows] = await pool.query(dataQuery, params);
    res.json({ data: rows, total, page, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/expenses — submit expense (supports optional bill file upload)
router.post('/', verifyToken, upload.single('bill'), async (req, res) => {
  try {
    const { category, amount, description, expenseType, project, travelFrom, travelTo, vehicle, travelKm, travelDays, date } = req.body;
    if (!category || !amount) return res.status(400).json({ error: 'Category and amount required' });
    const [emp] = await pool.query('SELECT name FROM employees WHERE code = ?', [req.user.empCode]);
    const empName = emp.length > 0 ? emp[0].name : '';
    const billUrl = req.file ? '/uploads/' + req.file.filename : null;
    const [result] = await pool.query(
      'INSERT INTO expense_reimbursements (emp_code, emp_name, category, amount, description, expense_type, project, travel_from, travel_to, vehicle, travel_km, travel_days, expense_date, bill_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.empCode, empName, category, amount, description || '', expenseType || null, project || null, travelFrom || null, travelTo || null, vehicle || null, travelKm || null, travelDays || null, date || null, billUrl]
    );
    // Notify HR/MD about new expense
    const managers = await getEmpCodesByRole(pool, ['HR', 'MD']);
    const targets = managers.filter(c => c !== req.user.empCode);
    await notifyUsers(pool, targets, 'Expense Submitted', empName + ' submitted ' + category + ' expense for Rs.' + Number(amount).toLocaleString('en-IN'), 'expense');

    // Real-time socket events
    const io = req.app.get('io');
    if (io) {
      io.to('role:MD').to('role:HR').emit('expense:new', { id: result.insertId, empCode: req.user.empCode, empName, category, amount });
    }

    res.status(201).json({ id: result.insertId, success: true, billUrl: billUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/expenses/:id/approve (supports dual approval: HR accept → MD confirm)
router.put('/:id/approve', verifyToken, requireRole('MD', 'HR'), auditLog('approve', 'expense'), async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT * FROM expense_reimbursements WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Expense not found' });
    const exp = existing[0];
    const currentStatus = exp.status;
    let newStatus;
    if (req.body.hrAccept) {
      if (currentStatus !== 'Pending') return res.status(400).json({ error: `Cannot accept: status is ${currentStatus}` });
      newStatus = 'hr_accepted';
      await pool.query(
        'UPDATE expense_reimbursements SET status = "hr_accepted", reviewed_by = ?, review_date = CURDATE() WHERE id = ?',
        [req.user.empCode, req.params.id]
      );
    } else {
      if (currentStatus !== 'Pending' && currentStatus !== 'hr_accepted') return res.status(400).json({ error: `Cannot approve: status is ${currentStatus}` });
      newStatus = 'Approved';
      await pool.query(
        'UPDATE expense_reimbursements SET status = "Approved", reviewed_by = ?, review_date = CURDATE() WHERE id = ?',
        [req.user.empCode, req.params.id]
      );
    }

    // Notify employee
    const eventType = newStatus === 'hr_accepted' ? 'accepted by HR' : 'approved';
    await notifyUsers(pool, [exp.emp_code], 'Expense ' + eventType, 'Your ' + exp.category + ' expense (Rs.' + Number(exp.amount).toLocaleString('en-IN') + ') has been ' + eventType, 'expense');

    // Real-time socket events
    const io = req.app.get('io');
    if (io) {
      const socketEvent = newStatus === 'hr_accepted' ? 'expense:hr_accepted' : 'expense:approved';
      io.to('user:' + exp.emp_code).emit(socketEvent, { id: exp.id, empName: exp.emp_name, category: exp.category, amount: exp.amount });
      io.to('role:MD').to('role:HR').emit('expense:updated', { id: exp.id });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/expenses/:id/reject
router.put('/:id/reject', verifyToken, requireRole('MD', 'HR'), auditLog('reject', 'expense'), async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT * FROM expense_reimbursements WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Expense not found' });
    const exp = existing[0];
    if (exp.status !== 'Pending' && exp.status !== 'hr_accepted') return res.status(400).json({ error: `Cannot reject: status is ${exp.status}` });
    await pool.query(
      'UPDATE expense_reimbursements SET status = "Rejected", reviewed_by = ?, review_date = CURDATE() WHERE id = ?',
      [req.user.empCode, req.params.id]
    );

    // Notify employee
    await notifyUsers(pool, [exp.emp_code], 'Expense Rejected', 'Your ' + exp.category + ' expense (Rs.' + Number(exp.amount).toLocaleString('en-IN') + ') has been rejected', 'expense');

    // Real-time socket events
    const io = req.app.get('io');
    if (io) {
      io.to('user:' + exp.emp_code).emit('expense:rejected', { id: exp.id, empName: exp.emp_name, category: exp.category, amount: exp.amount });
      io.to('role:MD').to('role:HR').emit('expense:updated', { id: exp.id });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
