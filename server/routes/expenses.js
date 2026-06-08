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

// Helper: get emp_codes by role (uses users table — authoritative for roles)
async function getEmpCodesByRole(pool, roles) {
  const [rows] = await pool.query('SELECT emp_code FROM users WHERE role IN (?) AND is_active = 1', [roles]);
  return rows.map(r => r.emp_code);
}

// Roles allowed to see/manage every expense (vs only their own).
// New flow: Employee → Accounts (review) → MD (approve) → Accounts (mark paid).
// HR is intentionally NOT in this list — expenses & advances no longer route through HR.
const REVIEWER_ROLES = ['MD', 'Accounts', 'HR'];

// GET /api/expenses — list expense reimbursements
router.get('/', verifyToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    let countQuery, dataQuery, params;
    if (REVIEWER_ROLES.includes(req.user.role)) {
      countQuery = 'SELECT COUNT(*) as total FROM expense_reimbursements';
      dataQuery = 'SELECT * FROM expense_reimbursements ORDER BY submitted_at DESC LIMIT ? OFFSET ?';
      params = [limit, offset];
    } else {
      countQuery = 'SELECT COUNT(*) as total FROM expense_reimbursements WHERE emp_code = ?';
      dataQuery = 'SELECT * FROM expense_reimbursements WHERE emp_code = ? ORDER BY submitted_at DESC LIMIT ? OFFSET ?';
      params = [req.user.empCode, limit, offset];
    }
    const [countResult] = await pool.query(countQuery, REVIEWER_ROLES.includes(req.user.role) ? [] : [req.user.empCode]);
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
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) return res.status(400).json({ error: 'Amount must be a positive number' });
    const [emp] = await pool.query('SELECT name FROM employees WHERE code = ?', [req.user.empCode]);
    const empName = emp.length > 0 ? emp[0].name : '';
    const billUrl = req.file ? '/uploads/' + req.file.filename : null;
    const [result] = await pool.query(
      'INSERT INTO expense_reimbursements (emp_code, emp_name, category, amount, description, expense_type, project, travel_from, travel_to, vehicle, travel_km, travel_days, expense_date, bill_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.empCode, empName, category, amount, description || '', expenseType || null, project || null, travelFrom || null, travelTo || null, vehicle || null, travelKm || null, travelDays || null, date || null, billUrl]
    );
    // Notify Accounts + MD about new expense (HR no longer in the loop)
    const reviewers = await getEmpCodesByRole(pool, REVIEWER_ROLES);
    const targets = reviewers.filter(c => c !== req.user.empCode);
    await notifyUsers(pool, targets, 'Expense Submitted', empName + ' submitted ' + category + ' expense for Rs.' + Number(amount).toLocaleString('en-IN'), 'expense');

    // Real-time socket events — emit to Accounts and MD rooms
    const io = req.app.get('io');
    if (io) {
      io.to('role:MD').to('role:Accounts').emit('expense:new', { id: result.insertId, empCode: req.user.empCode, empName, category, amount });
    }

    res.status(201).json({ id: result.insertId, success: true, billUrl: billUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/expenses/:id/approve — Accounts accept (Pending → accounts_accepted) OR MD final approve (accounts_accepted → Approved)
router.put('/:id/approve', verifyToken, requireRole('MD', 'Accounts', 'HR'), auditLog('approve', 'expense'), async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT * FROM expense_reimbursements WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Expense not found' });
    const exp = existing[0];
    const currentStatus = exp.status;
    let newStatus;
    if (req.user.role === 'Accounts' || req.user.role === 'HR') {
      // Accounts/HR can only accept (Pending → accounts_accepted)
      if (currentStatus !== 'Pending') return res.status(400).json({ error: `Cannot accept: status is ${currentStatus}` });
      newStatus = 'accounts_accepted';
      await pool.query(
        'UPDATE expense_reimbursements SET status = "accounts_accepted", reviewed_by = ?, review_date = CURDATE() WHERE id = ?',
        [req.user.empCode, req.params.id]
      );
    } else {
      // MD can approve from accounts_accepted (the new normal path) or Pending (escape hatch if Accounts is unavailable)
      if (currentStatus !== 'Pending' && currentStatus !== 'accounts_accepted') return res.status(400).json({ error: `Cannot approve: status is ${currentStatus}` });
      newStatus = 'Approved';
      await pool.query(
        'UPDATE expense_reimbursements SET status = "Approved", reviewed_by = ?, review_date = CURDATE() WHERE id = ?',
        [req.user.empCode, req.params.id]
      );
    }

    // Notify employee + (when MD approves) ping Accounts that money is ready to be disbursed
    if (newStatus === 'accounts_accepted') {
      await notifyUsers(pool, [exp.emp_code], 'Expense Accepted by Accounts', 'Your ' + exp.category + ' expense (Rs.' + Number(exp.amount).toLocaleString('en-IN') + ') is awaiting MD approval', 'expense');
      // Also tell MD it's ready for them
      const mdUsers = await getEmpCodesByRole(pool, ['MD']);
      await notifyUsers(pool, mdUsers, 'Expense Pending Approval', exp.emp_name + '\'s ' + exp.category + ' expense (Rs.' + Number(exp.amount).toLocaleString('en-IN') + ') is awaiting your approval', 'expense');
    } else {
      await notifyUsers(pool, [exp.emp_code], 'Expense Approved', 'Your ' + exp.category + ' expense (Rs.' + Number(exp.amount).toLocaleString('en-IN') + ') has been approved by MD', 'expense');
      // Send back to Accounts for disbursement
      const acctUsers = await getEmpCodesByRole(pool, ['Accounts']);
      await notifyUsers(pool, acctUsers, 'Expense Ready to Pay', 'MD approved ' + exp.emp_name + '\'s ' + exp.category + ' expense (Rs.' + Number(exp.amount).toLocaleString('en-IN') + ') — please disburse', 'expense');
    }

    // Real-time socket events
    const io = req.app.get('io');
    if (io) {
      const socketEvent = newStatus === 'accounts_accepted' ? 'expense:accounts_accepted' : 'expense:approved';
      io.to('user:' + exp.emp_code).emit(socketEvent, { id: exp.id, empName: exp.emp_name, category: exp.category, amount: exp.amount });
      io.to('role:MD').to('role:Accounts').emit('expense:updated', { id: exp.id, status: newStatus });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/expenses/:id/mark-paid — Accounts marks an MD-Approved expense as Paid (final disbursement step)
router.put('/:id/mark-paid', verifyToken, requireRole('Accounts', 'HR'), auditLog('mark-paid', 'expense'), async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT * FROM expense_reimbursements WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Expense not found' });
    const exp = existing[0];
    if (exp.status !== 'Approved') return res.status(400).json({ error: `Cannot mark paid: status is ${exp.status}. Expected: Approved` });

    await pool.query(
      'UPDATE expense_reimbursements SET status = "Paid", paid_by = ?, paid_date = CURDATE() WHERE id = ?',
      [req.user.empCode, req.params.id]
    );

    // Notify employee + MD
    await notifyUsers(pool, [exp.emp_code], 'Expense Paid', 'Your ' + exp.category + ' expense (Rs.' + Number(exp.amount).toLocaleString('en-IN') + ') has been disbursed by Accounts', 'expense');
    const mdUsers = await getEmpCodesByRole(pool, ['MD']);
    await notifyUsers(pool, mdUsers, 'Expense Disbursed', exp.emp_name + '\'s ' + exp.category + ' expense (Rs.' + Number(exp.amount).toLocaleString('en-IN') + ') has been paid', 'expense');

    const io = req.app.get('io');
    if (io) {
      io.to('user:' + exp.emp_code).emit('expense:paid', { id: exp.id, category: exp.category, amount: exp.amount });
      io.to('role:MD').to('role:Accounts').emit('expense:updated', { id: exp.id, status: 'Paid' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/expenses/:id/reject — Accounts or MD reject (only from Pending or accounts_accepted)
router.put('/:id/reject', verifyToken, requireRole('MD', 'Accounts', 'HR'), auditLog('reject', 'expense'), async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT * FROM expense_reimbursements WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Expense not found' });
    const exp = existing[0];
    if (exp.status !== 'Pending' && exp.status !== 'accounts_accepted') return res.status(400).json({ error: `Cannot reject: status is ${exp.status}` });
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
      io.to('role:MD').to('role:Accounts').emit('expense:updated', { id: exp.id, status: 'Rejected' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function _expStageLabel(status) {
  switch (status) {
    case 'Pending': return 'Awaiting Accounts Review';
    case 'accounts_accepted': return 'Awaiting MD Approval';
    case 'Approved': return 'Approved — Pending Disbursement';
    case 'Paid': return 'Paid / Disbursed';
    case 'Rejected': return 'Rejected';
    default: return status || '';
  }
}

// Build a parameterised WHERE for export queries — keeps Excel + PDF in sync.
// status supports comma-separated values for multi-status IN queries.
function buildFilters(query) {
  const where = [];
  const params = [];
  if (query.status) {
    const statuses = query.status.split(',').map(s => s.trim()).filter(Boolean);
    if (statuses.length === 1) { where.push('status = ?'); params.push(statuses[0]); }
    else { where.push('status IN (' + statuses.map(() => '?').join(',') + ')'); params.push(...statuses); }
  }
  if (query.empCode) { where.push('emp_code = ?'); params.push(query.empCode); }
  if (query.from) { where.push('DATE(submitted_at) >= ?'); params.push(query.from); }
  if (query.to) { where.push('DATE(submitted_at) <= ?'); params.push(query.to); }
  return { sql: where.length ? ' WHERE ' + where.join(' AND ') : '', params };
}

// GET /api/expenses/export — download filtered list as Excel (.xlsx)
// Filters: ?status=Pending&from=2025-01-01&to=2025-12-31&empCode=E001
router.get('/export', verifyToken, requireRole('MD', 'Accounts', 'HR'), async (req, res) => {
  try {
    const XLSX = require('xlsx');
    const { sql, params } = buildFilters(req.query);
    const [rows] = await pool.query(
      'SELECT id, emp_code, emp_name, category, amount, description, expense_type, project, ' +
      'travel_from, travel_to, vehicle, travel_km, expense_date, status, reviewed_by, review_date, ' +
      'paid_by, paid_date, submitted_at, bill_url FROM expense_reimbursements' + sql + ' ORDER BY submitted_at DESC',
      params
    );
    // Map to Excel-friendly column names + ISO dates only
    const data = rows.map(r => ({
      'ID': r.id,
      'Employee Code': r.emp_code,
      'Employee Name': r.emp_name,
      'Category': r.category,
      'Amount (INR)': Number(r.amount || 0),
      'Description': r.description || '',
      'Expense Type': r.expense_type || '',
      'Project': r.project || '',
      'Travel From': r.travel_from || '',
      'Travel To': r.travel_to || '',
      'Vehicle': r.vehicle || '',
      'Travel KM': r.travel_km || '',
      'Expense Date': r.expense_date ? new Date(r.expense_date).toISOString().slice(0, 10) : '',
      'Status': r.status,
      'Approval Stage': _expStageLabel(r.status),
      'Reviewed By': r.reviewed_by || '',
      'Review Date': r.review_date ? new Date(r.review_date).toISOString().slice(0, 10) : '',
      'Paid By': r.paid_by || '',
      'Paid Date': r.paid_date ? new Date(r.paid_date).toISOString().slice(0, 10) : '',
      'Submitted At': r.submitted_at ? new Date(r.submitted_at).toISOString().slice(0, 19).replace('T', ' ') : '',
      'Bill URL': r.bill_url || ''
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
      { wch: 6 }, { wch: 12 }, { wch: 22 }, { wch: 16 }, { wch: 14 }, { wch: 30 }, { wch: 14 }, { wch: 18 },
      { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 16 }, { wch: 34 }, { wch: 14 },
      { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 18 }, { wch: 30 }
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = 'expenses_' + new Date().toISOString().slice(0, 10) + '.xlsx';
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
    res.send(buf);
  } catch (err) {
    console.error('[expenses/export]', err);
    res.status(500).json({ error: 'Failed to generate Excel export' });
  }
});

// GET /api/expenses/:id/voucher — single expense as a printable PDF voucher
router.get('/:id/voucher', verifyToken, requireRole('MD', 'Accounts', 'HR'), async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM expense_reimbursements WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Expense not found' });
    const { generateVoucherPDF } = require('../utils/voucher-pdf');
    const buf = await generateVoucherPDF({ kind: 'expense', record: rows[0] });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="expense_EXP-' + String(rows[0].id).padStart(6, '0') + '.pdf"');
    res.send(buf);
  } catch (err) {
    console.error('[expenses/voucher]', err);
    res.status(500).json({ error: 'Failed to generate PDF voucher' });
  }
});

module.exports = router;
