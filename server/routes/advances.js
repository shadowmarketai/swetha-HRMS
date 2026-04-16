const router = require('express').Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { auditLog } = require('../middleware/audit');

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

// New approval flow: Employee → Accounts (review) → MD (approve) → Accounts (mark paid).
// HR no longer participates in advance approvals — they're routed to Accounts instead.
const REVIEWER_ROLES = ['MD', 'Accounts'];

// GET /api/advances — list advances
router.get('/', verifyToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    if (!REVIEWER_ROLES.includes(req.user.role)) {
      const [countResult1] = await pool.query('SELECT COUNT(*) as total FROM advance_requests WHERE emp_code = ?', [req.user.empCode]);
      const empTotal = (countResult1 && countResult1[0]) ? countResult1[0].total : 0;
      const [rows] = await pool.query('SELECT * FROM advance_requests WHERE emp_code = ? ORDER BY applied_date DESC LIMIT ? OFFSET ?', [req.user.empCode, limit, offset]);
      return res.json({ data: rows, total: empTotal, page, limit });
    }
    const [countResult2] = await pool.query('SELECT COUNT(*) as total FROM advance_requests');
    const total = (countResult2 && countResult2[0]) ? countResult2[0].total : 0;
    const [rows] = await pool.query('SELECT * FROM advance_requests ORDER BY applied_date DESC LIMIT ? OFFSET ?', [limit, offset]);
    res.json({ data: rows, total, page, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/advances — create advance request
router.post('/', verifyToken, [
  body('type').trim().isIn(['site', 'salary', 'travel']).withMessage('Invalid advance type'),
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be a positive number'),
  body('travelKm').optional().isFloat({ min: 0, max: 100000 }).withMessage('Travel km must be between 0 and 100000'),
  body('emiAmount').optional().isFloat({ min: 0 }).withMessage('EMI amount must be non-negative'),
  body('emiMonths').optional().isInt({ min: 1, max: 60 }).withMessage('EMI months must be between 1 and 60')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
  try {
    const { type, amount, reason, details, project, category, travelFrom, travelTo, vehicle, travelKm, emiAmount, emiMonths, urgency } = req.body;
    if (!type || !amount) return res.status(400).json({ error: 'Type and amount required' });

    // Get employee info
    const [emp] = await pool.query('SELECT name, dept FROM employees WHERE code = ?', [req.user.empCode]);
    const empName = emp.length ? emp[0].name : '';
    const dept = emp.length ? emp[0].dept : '';

    const [result] = await pool.query(
      `INSERT INTO advance_requests (type, emp_code, emp_name, dept, amount, reason, details, project, category,
       travel_from, travel_to, vehicle, travel_km, emi_amount, emi_months, urgency, applied_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())`,
      [type, req.user.empCode, empName, dept, amount, reason || '', details || '', project || '', category || '',
       travelFrom || '', travelTo || '', vehicle || '', travelKm || 0, emiAmount || 0, emiMonths || 0, urgency || 'medium']
    );

    // Notify Accounts + MD about new advance request (HR no longer in the loop)
    const typeLabels = { salary: 'Salary Advance', travel: 'Travel Advance', site: 'Site Advance' };
    const typeLabel = typeLabels[type] || type;
    const reviewers = await getEmpCodesByRole(pool, REVIEWER_ROLES);
    const targets = reviewers.filter(c => c !== req.user.empCode);
    await notifyUsers(pool, targets, 'Advance Request', empName + ' submitted ' + typeLabel + ' for Rs.' + Number(amount).toLocaleString('en-IN'), 'advance');

    // Real-time: notify Accounts/MD instantly
    const io = req.app.get('io');
    if (io) {
      io.to('role:MD').to('role:Accounts').emit('advance:new', { id: result.insertId, empCode: req.user.empCode, empName, type: typeLabel, amount });
    }
    res.status(201).json({ message: 'Advance request submitted', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/advances/:id/accounts-accept — Accounts accepts (Pending → Accounts_Accepted)
// New endpoint for the Accounts-first workflow.
router.patch('/:id/accounts-accept', verifyToken, requireRole('Accounts'), auditLog('accounts-accept', 'advance'), async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT * FROM advance_requests WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Advance request not found' });
    if (existing[0].status !== 'Pending') return res.status(400).json({ error: `Cannot accept: status is ${existing[0].status}` });
    await pool.query(
      'UPDATE advance_requests SET status = "Accounts_Accepted", reviewed_by = ?, review_date = CURDATE() WHERE id = ?',
      [req.user.empCode, req.params.id]
    );

    // Notify the employee + all MD users
    const adv = existing[0];
    const mdUsers = await getEmpCodesByRole(pool, ['MD']);
    const targets = [adv.emp_code, ...mdUsers].filter(c => c !== req.user.empCode);
    await notifyUsers(pool, targets, 'Advance Accepted by Accounts', adv.emp_name + '\'s ' + adv.type + ' advance (Rs.' + Number(adv.amount).toLocaleString('en-IN') + ') accepted by Accounts, awaiting MD', 'advance');

    // Real-time socket events
    const io = req.app.get('io');
    if (io) {
      io.to('user:' + adv.emp_code).emit('advance:accounts_accepted', { id: adv.id, empName: adv.emp_name, type: adv.type, amount: adv.amount });
      io.to('role:MD').emit('advance:pending_approval', { id: adv.id, empName: adv.emp_name, type: adv.type, amount: adv.amount });
      io.to('role:Accounts').emit('advance:updated', { id: adv.id, status: 'Accounts_Accepted' });
    }

    res.json({ message: 'Advance accepted by Accounts' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/advances/:id/approve — final approve (MD only, requires Accounts acceptance first)
router.patch('/:id/approve', verifyToken, requireRole('MD'), auditLog('approve', 'advance'), async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT * FROM advance_requests WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Advance request not found' });
    if (existing[0].status !== 'Accounts_Accepted') {
      return res.status(400).json({
        error: existing[0].status === 'Pending' ? 'Accounts must accept this advance first' : `Cannot approve: status is ${existing[0].status}`
      });
    }
    await pool.query(
      'UPDATE advance_requests SET status = "Approved", reviewed_by = ?, review_date = CURDATE() WHERE id = ?',
      [req.user.empCode, req.params.id]
    );

    // Notify the employee + send back to Accounts for disbursement
    const adv = existing[0];
    await notifyUsers(pool, [adv.emp_code], 'Advance Approved', 'Your ' + adv.type + ' advance (Rs.' + Number(adv.amount).toLocaleString('en-IN') + ') has been approved by MD', 'advance');
    const acctUsers = await getEmpCodesByRole(pool, ['Accounts']);
    await notifyUsers(pool, acctUsers, 'Advance Ready to Pay', 'MD approved ' + adv.emp_name + '\'s ' + adv.type + ' advance (Rs.' + Number(adv.amount).toLocaleString('en-IN') + ') — please disburse', 'advance');

    // Real-time socket events
    const io = req.app.get('io');
    if (io) {
      io.to('user:' + adv.emp_code).emit('advance:approved', { id: adv.id, empName: adv.emp_name, type: adv.type, amount: adv.amount });
      io.to('role:MD').to('role:Accounts').emit('advance:updated', { id: adv.id, status: 'Approved' });
    }

    res.json({ message: 'Advance approved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/advances/:id/mark-paid — Accounts marks an MD-Approved advance as Paid (final disbursement)
router.patch('/:id/mark-paid', verifyToken, requireRole('Accounts'), auditLog('mark-paid', 'advance'), async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT * FROM advance_requests WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Advance request not found' });
    const adv = existing[0];
    if (adv.status !== 'Approved') return res.status(400).json({ error: `Cannot mark paid: status is ${adv.status}. Expected: Approved` });

    await pool.query(
      'UPDATE advance_requests SET status = "Paid", paid_by = ?, paid_date = CURDATE() WHERE id = ?',
      [req.user.empCode, req.params.id]
    );

    // Notify employee + MD
    await notifyUsers(pool, [adv.emp_code], 'Advance Paid', 'Your ' + adv.type + ' advance (Rs.' + Number(adv.amount).toLocaleString('en-IN') + ') has been disbursed by Accounts', 'advance');
    const mdUsers = await getEmpCodesByRole(pool, ['MD']);
    await notifyUsers(pool, mdUsers, 'Advance Disbursed', adv.emp_name + '\'s ' + adv.type + ' advance (Rs.' + Number(adv.amount).toLocaleString('en-IN') + ') has been paid', 'advance');

    const io = req.app.get('io');
    if (io) {
      io.to('user:' + adv.emp_code).emit('advance:paid', { id: adv.id, type: adv.type, amount: adv.amount });
      io.to('role:MD').to('role:Accounts').emit('advance:updated', { id: adv.id, status: 'Paid' });
    }

    res.json({ message: 'Advance marked as paid' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/advances/:id/reject — Accounts or MD reject (only from Pending or Accounts_Accepted)
router.patch('/:id/reject', verifyToken, requireRole('MD', 'Accounts'), auditLog('reject', 'advance'), async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT * FROM advance_requests WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Advance request not found' });
    if (existing[0].status !== 'Pending' && existing[0].status !== 'Accounts_Accepted') return res.status(400).json({ error: `Cannot reject: status is ${existing[0].status}` });
    const { reason } = req.body;
    await pool.query(
      'UPDATE advance_requests SET status = "Rejected", reviewed_by = ?, review_date = CURDATE(), reject_reason = ? WHERE id = ?',
      [req.user.empCode, reason || '', req.params.id]
    );

    // Notify the employee that their advance was rejected
    const adv = existing[0];
    await notifyUsers(pool, [adv.emp_code], 'Advance Rejected', 'Your ' + adv.type + ' advance (Rs.' + Number(adv.amount).toLocaleString('en-IN') + ') has been rejected' + (reason ? ': ' + reason : ''), 'advance');

    // Real-time socket events
    const io = req.app.get('io');
    if (io) {
      io.to('user:' + adv.emp_code).emit('advance:rejected', { id: adv.id, empName: adv.emp_name, type: adv.type, amount: adv.amount, reason: reason || '' });
      io.to('role:MD').to('role:Accounts').emit('advance:updated', { id: adv.id, status: 'Rejected' });
    }

    res.json({ message: 'Advance rejected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Build a parameterised WHERE for export queries — keeps Excel + PDF in sync.
function buildFilters(query) {
  const where = [];
  const params = [];
  if (query.status) { where.push('status = ?'); params.push(query.status); }
  if (query.empCode) { where.push('emp_code = ?'); params.push(query.empCode); }
  if (query.type) { where.push('type = ?'); params.push(query.type); }
  if (query.from) { where.push('applied_date >= ?'); params.push(query.from); }
  if (query.to) { where.push('applied_date <= ?'); params.push(query.to); }
  return { sql: where.length ? ' WHERE ' + where.join(' AND ') : '', params };
}

// GET /api/advances/export — download filtered list as Excel (.xlsx)
router.get('/export', verifyToken, requireRole('MD', 'Accounts'), async (req, res) => {
  try {
    const XLSX = require('xlsx');
    const { sql, params } = buildFilters(req.query);
    const [rows] = await pool.query(
      'SELECT id, type, emp_code, emp_name, dept, amount, reason, details, project, category, ' +
      'travel_from, travel_to, vehicle, travel_km, emi_amount, emi_months, urgency, status, ' +
      'applied_date, reviewed_by, review_date, reject_reason, paid_by, paid_date FROM advance_requests' + sql + ' ORDER BY applied_date DESC',
      params
    );
    const data = rows.map(r => ({
      'ID': r.id,
      'Type': r.type,
      'Employee Code': r.emp_code,
      'Employee Name': r.emp_name,
      'Department': r.dept,
      'Amount (INR)': Number(r.amount || 0),
      'Reason': r.reason || '',
      'Details': r.details || '',
      'Project': r.project || '',
      'Category': r.category || '',
      'Travel From': r.travel_from || '',
      'Travel To': r.travel_to || '',
      'Vehicle': r.vehicle || '',
      'Travel KM': r.travel_km || '',
      'EMI Amount': r.emi_amount || '',
      'EMI Months': r.emi_months || '',
      'Urgency': r.urgency,
      'Status': r.status,
      'Applied Date': r.applied_date ? new Date(r.applied_date).toISOString().slice(0, 10) : '',
      'Reviewed By': r.reviewed_by || '',
      'Review Date': r.review_date ? new Date(r.review_date).toISOString().slice(0, 10) : '',
      'Reject Reason': r.reject_reason || '',
      'Paid By': r.paid_by || '',
      'Paid Date': r.paid_date ? new Date(r.paid_date).toISOString().slice(0, 10) : ''
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
      { wch: 6 }, { wch: 10 }, { wch: 12 }, { wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 30 }, { wch: 30 },
      { wch: 18 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 10 },
      { wch: 10 }, { wch: 18 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 30 }, { wch: 14 }, { wch: 12 }
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Advances');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = 'advances_' + new Date().toISOString().slice(0, 10) + '.xlsx';
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
    res.send(buf);
  } catch (err) {
    console.error('[advances/export]', err);
    res.status(500).json({ error: 'Failed to generate Excel export' });
  }
});

// GET /api/advances/:id/voucher — single advance as a printable PDF voucher
router.get('/:id/voucher', verifyToken, requireRole('MD', 'Accounts'), async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM advance_requests WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Advance not found' });
    const { generateVoucherPDF } = require('../utils/voucher-pdf');
    const buf = await generateVoucherPDF({ kind: 'advance', record: rows[0] });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="advance_ADV-' + String(rows[0].id).padStart(6, '0') + '.pdf"');
    res.send(buf);
  } catch (err) {
    console.error('[advances/voucher]', err);
    res.status(500).json({ error: 'Failed to generate PDF voucher' });
  }
});

module.exports = router;
