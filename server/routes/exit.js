const router = require('express').Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');

// GET /api/exit — list exit requests
router.get('/', verifyToken, async (req, res) => {
  try {
    let query, params;
    if (['MD', 'HR'].includes(req.user.role)) {
      query = 'SELECT * FROM exit_requests ORDER BY submitted_at DESC';
      params = [];
    } else {
      query = 'SELECT * FROM exit_requests WHERE emp_code = ? ORDER BY submitted_at DESC';
      params = [req.user.empCode];
    }
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/exit — submit resignation
router.post('/', verifyToken, async (req, res) => {
  try {
    const { reason, remarks, preferred_lwd } = req.body;
    if (!reason) return res.status(400).json({ error: 'Reason required' });
    const [emp] = await pool.query('SELECT name FROM employees WHERE code = ?', [req.user.empCode]);
    const empName = emp.length > 0 ? emp[0].name : '';
    const [result] = await pool.query(
      'INSERT INTO exit_requests (emp_code, emp_name, reason, remarks, preferred_lwd) VALUES (?, ?, ?, ?, ?)',
      [req.user.empCode, empName, reason, remarks || '', preferred_lwd || null]
    );
    res.status(201).json({ id: result.insertId, success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/exit/:id/approve
router.put('/:id/approve', verifyToken, requireRole('MD', 'HR'), auditLog('approve', 'exit'), async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT status FROM exit_requests WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Exit request not found' });
    if (existing[0].status !== 'Pending') return res.status(400).json({ error: `Cannot approve: status is ${existing[0].status}` });
    const clearance = JSON.stringify({
      'IT & Systems': false, 'Finance': false, 'HR': false,
      'Admin': false, 'Reporting Manager': false, 'Security': false
    });
    await pool.query(
      'UPDATE exit_requests SET status = "Approved", reviewed_by = ?, review_date = CURDATE(), clearance = ? WHERE id = ?',
      [req.user.empCode, clearance, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/exit/:id/reject
router.put('/:id/reject', verifyToken, requireRole('MD', 'HR'), auditLog('reject', 'exit'), async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT status FROM exit_requests WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Exit request not found' });
    if (existing[0].status !== 'Pending') return res.status(400).json({ error: `Cannot reject: status is ${existing[0].status}` });
    await pool.query(
      'UPDATE exit_requests SET status = "Rejected", reviewed_by = ?, review_date = CURDATE() WHERE id = ?',
      [req.user.empCode, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/exit/:id/clearance — update clearance checklist
router.put('/:id/clearance', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    const { clearance } = req.body;
    await pool.query('UPDATE exit_requests SET clearance = ? WHERE id = ?',
      [JSON.stringify(clearance), req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/exit/:id/complete — complete exit with F&F
router.put('/:id/complete', verifyToken, requireRole('MD', 'HR'), auditLog('complete', 'exit'), async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT status FROM exit_requests WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Exit request not found' });
    if (existing[0].status !== 'Approved') return res.status(400).json({ error: `Cannot complete: status must be Approved, got ${existing[0].status}` });
    const { fnf_amount, fnf_details } = req.body;
    await pool.query(
      'UPDATE exit_requests SET status = "Completed", fnf_amount = ?, fnf_details = ?, completed_at = NOW() WHERE id = ?',
      [fnf_amount || 0, JSON.stringify(fnf_details || {}), req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
