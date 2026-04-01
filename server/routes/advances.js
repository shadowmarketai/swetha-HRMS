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

// GET /api/advances — list advances
router.get('/', verifyToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    if (!['MD', 'HR'].includes(req.user.role)) {
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

    // Notify all HR and MD users about new advance request
    const typeLabels = { salary: 'Salary Advance', travel: 'Travel Advance', site: 'Site Advance' };
    const typeLabel = typeLabels[type] || type;
    const managers = await getEmpCodesByRole(pool, ['HR', 'MD']);
    const targets = managers.filter(c => c !== req.user.empCode);
    await notifyUsers(pool, targets, 'Advance Request', empName + ' submitted ' + typeLabel + ' for Rs.' + Number(amount).toLocaleString('en-IN'), 'advance');

    // Real-time: notify MD/HR instantly
    const io = req.app.get('io');
    if (io) {
      io.to('role:MD').to('role:HR').emit('advance:new', { empCode: req.user.empCode, empName, type: typeLabel, amount });
    }
    res.status(201).json({ message: 'Advance request submitted', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/advances/:id/hr-accept — HR accepts (Pending → HR_Accepted)
router.patch('/:id/hr-accept', verifyToken, requireRole('HR'), auditLog('hr-accept', 'advance'), async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT * FROM advance_requests WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Advance request not found' });
    if (existing[0].status !== 'Pending') return res.status(400).json({ error: `Cannot accept: status is ${existing[0].status}` });
    await pool.query(
      'UPDATE advance_requests SET status = "HR_Accepted", reviewed_by = ?, review_date = CURDATE() WHERE id = ?',
      [req.user.empCode, req.params.id]
    );

    // Notify the employee + all MD users
    const adv = existing[0];
    const mdUsers = await getEmpCodesByRole(pool, ['MD']);
    const targets = [adv.emp_code, ...mdUsers].filter(c => c !== req.user.empCode);
    await notifyUsers(pool, targets, 'Advance Accepted by HR', adv.emp_name + '\'s ' + adv.type + ' advance (Rs.' + Number(adv.amount).toLocaleString('en-IN') + ') accepted by HR, awaiting MD', 'advance');

    // Real-time socket events
    const io = req.app.get('io');
    if (io) {
      io.to('user:' + adv.emp_code).emit('advance:hr_accepted', { id: adv.id, empName: adv.emp_name, type: adv.type, amount: adv.amount });
      io.to('role:MD').emit('advance:pending_approval', { id: adv.id, empName: adv.emp_name, type: adv.type, amount: adv.amount });
      io.to('role:HR').emit('advance:updated', { id: adv.id });
    }

    res.json({ message: 'Advance accepted by HR' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/advances/:id/approve — final approve (MD only, requires HR acceptance first)
router.patch('/:id/approve', verifyToken, requireRole('MD'), auditLog('approve', 'advance'), async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT * FROM advance_requests WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Advance request not found' });
    if (existing[0].status !== 'HR_Accepted') return res.status(400).json({ error: existing[0].status === 'Pending' ? 'HR must accept this advance first' : `Cannot approve: status is ${existing[0].status}` });
    await pool.query(
      'UPDATE advance_requests SET status = "Approved", reviewed_by = ?, review_date = CURDATE() WHERE id = ?',
      [req.user.empCode, req.params.id]
    );

    // Notify the employee that their advance was approved
    const adv = existing[0];
    await notifyUsers(pool, [adv.emp_code], 'Advance Approved', 'Your ' + adv.type + ' advance (Rs.' + Number(adv.amount).toLocaleString('en-IN') + ') has been approved', 'advance');

    // Real-time socket events
    const io = req.app.get('io');
    if (io) {
      io.to('user:' + adv.emp_code).emit('advance:approved', { id: adv.id, empName: adv.emp_name, type: adv.type, amount: adv.amount });
      io.to('role:MD').to('role:HR').emit('advance:updated', { id: adv.id });
    }

    res.json({ message: 'Advance approved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/advances/:id/reject — can reject Pending or HR_Accepted
router.patch('/:id/reject', verifyToken, requireRole('MD', 'HR'), auditLog('reject', 'advance'), async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT * FROM advance_requests WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Advance request not found' });
    if (existing[0].status !== 'Pending' && existing[0].status !== 'HR_Accepted') return res.status(400).json({ error: `Cannot reject: status is ${existing[0].status}` });
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
      io.to('role:MD').to('role:HR').emit('advance:updated', { id: adv.id });
    }

    res.json({ message: 'Advance rejected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
