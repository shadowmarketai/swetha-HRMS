const router = require('express').Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');

// GET /api/compliance/filings — list compliance filings
router.get('/filings', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM compliance_filings ORDER BY due_date DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/compliance/filings — create filing
const VALID_FILING_TYPES = ['PF', 'ESI', 'PT', 'TDS', 'LWF', 'CLRA', 'Gratuity', 'Bonus', 'MinWage'];
router.post('/filings', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    const { filing_type, period, due_date, authority } = req.body;
    if (!filing_type || !period || !due_date) return res.status(400).json({ error: 'Type, period and due date required' });
    if (!VALID_FILING_TYPES.includes(filing_type)) return res.status(400).json({ error: 'Invalid filing type' });
    const [result] = await pool.query(
      'INSERT INTO compliance_filings (filing_type, period, due_date, authority) VALUES (?, ?, ?, ?)',
      [filing_type, period, due_date, authority || '']
    );
    const io = req.app.get('io');
    if (io) {
      io.to('role:MD').to('role:HR').emit('filing:created', { id: result.insertId, filingType: filing_type, period, dueDate: due_date });
    }
    res.status(201).json({ id: result.insertId, success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/compliance/filings/:id/mark-filed — mark as filed
router.put('/filings/:id/mark-filed', verifyToken, requireRole('MD', 'HR'), auditLog('mark-filed', 'compliance'), async (req, res) => {
  try {
    const { reference_no } = req.body;
    await pool.query(
      'UPDATE compliance_filings SET status = "filed", filed_date = CURDATE(), filed_by = ?, reference_no = ? WHERE id = ?',
      [req.user.empCode, reference_no || '', req.params.id]
    );
    const io = req.app.get('io');
    if (io) {
      io.to('role:MD').to('role:HR').emit('filing:marked', { id: parseInt(req.params.id), status: 'filed' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/compliance/contract-workers — list contract workers
router.get('/contract-workers', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM contract_workers WHERE is_active = 1 ORDER BY name');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/compliance/contract-workers — add contract worker
router.post('/contract-workers', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    const { name, contractor, dept, daily_wage, start_date, end_date } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const [result] = await pool.query(
      'INSERT INTO contract_workers (name, contractor, dept, daily_wage, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)',
      [name, contractor || '', dept || '', daily_wage || 0, start_date || null, end_date || null]
    );
    const io = req.app.get('io');
    if (io) {
      io.to('role:MD').to('role:HR').emit('contractWorker:created', { id: result.insertId, name, contractor: contractor || '' });
    }
    res.status(201).json({ id: result.insertId, success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
