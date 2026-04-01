const router = require('express').Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');

// GET /api/edit-requests — list document edit requests (HR/MD only)
router.get('/', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    const status = req.query.status;
    let sql = `SELECT r.*, e.name as emp_name, e.dept as emp_dept
               FROM document_edit_requests r
               JOIN employees e ON e.code = r.emp_code
               ORDER BY r.requested_at DESC`;
    const params = [];
    if (status) {
      sql = `SELECT r.*, e.name as emp_name, e.dept as emp_dept
             FROM document_edit_requests r
             JOIN employees e ON e.code = r.emp_code
             WHERE r.status = ?
             ORDER BY r.requested_at DESC`;
      params.push(status);
    }
    const [rows] = await pool.query(sql, params);
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/edit-requests/:id/approve — approve an edit request (HR/MD only)
router.patch('/:id/approve', verifyToken, requireRole('MD', 'HR'), auditLog('approve', 'document_edit_request'), async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM document_edit_requests WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Request not found' });
    const request = rows[0];
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request already ' + request.status });
    }

    await pool.query(
      'UPDATE document_edit_requests SET status = ?, reviewed_by = ?, reviewed_at = NOW(), review_note = ? WHERE id = ?',
      ['approved', req.user.empCode, req.body.note || null, req.params.id]
    );

    // Unlock the section in employee profile
    const [empRows] = await pool.query('SELECT profile_sections_locked FROM employees WHERE code = ?', [request.emp_code]);
    if (empRows.length > 0) {
      let locks = {};
      try { locks = JSON.parse(empRows[0].profile_sections_locked || '{}'); } catch (e) { locks = {}; }
      locks[request.section] = false;
      await pool.query('UPDATE employees SET profile_sections_locked = ? WHERE code = ?', [JSON.stringify(locks), request.emp_code]);
    }

    // Notify employee
    await pool.query(
      'INSERT INTO notifications (emp_code, title, message, type) VALUES (?, ?, ?, ?)',
      [request.emp_code, 'Edit Request Approved', 'Your request to edit ' + request.section.replace(/_/g, ' ') + ' has been approved. You can now update this section.', 'general']
    ).catch(() => {});

    // Real-time notification via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to('user:' + request.emp_code).emit('notification', {
        title: 'Edit Request Approved',
        message: 'Your ' + request.section.replace(/_/g, ' ') + ' section is now unlocked for editing.',
        type: 'success'
      });
    }

    res.json({ message: 'Request approved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/edit-requests/:id/reject — reject an edit request (HR/MD only)
router.patch('/:id/reject', verifyToken, requireRole('MD', 'HR'), auditLog('reject', 'document_edit_request'), async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM document_edit_requests WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Request not found' });
    const request = rows[0];
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request already ' + request.status });
    }

    await pool.query(
      'UPDATE document_edit_requests SET status = ?, reviewed_by = ?, reviewed_at = NOW(), review_note = ? WHERE id = ?',
      ['rejected', req.user.empCode, req.body.note || null, req.params.id]
    );

    // Notify employee
    const noteMsg = req.body.note ? ' Reason: ' + req.body.note : '';
    await pool.query(
      'INSERT INTO notifications (emp_code, title, message, type) VALUES (?, ?, ?, ?)',
      [request.emp_code, 'Edit Request Rejected', 'Your request to edit ' + request.section.replace(/_/g, ' ') + ' was rejected.' + noteMsg, 'general']
    ).catch(() => {});

    const io = req.app.get('io');
    if (io) {
      io.to('user:' + request.emp_code).emit('notification', {
        title: 'Edit Request Rejected',
        message: 'Your ' + request.section.replace(/_/g, ' ') + ' edit request was rejected.' + noteMsg,
        type: 'error'
      });
    }

    res.json({ message: 'Request rejected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
