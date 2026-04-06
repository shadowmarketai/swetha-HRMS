const router = require('express').Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');

// GET /api/assets — list all assets
router.get('/', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const [countResult] = await pool.query('SELECT COUNT(*) as total FROM asset_inventory');
    const total = (countResult && countResult[0]) ? countResult[0].total : 0;
    const [rows] = await pool.query(
      `SELECT a.*, e.name AS assigned_name FROM asset_inventory a
       LEFT JOIN employees e ON a.assigned_to = e.code
       ORDER BY a.created_at DESC LIMIT ? OFFSET ?`, [limit, offset]
    );
    res.json({ data: rows, total, page, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/assets — add new asset
router.post('/', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    const { asset_name, asset_type, serial_no, purchase_date, purchase_cost, asset_condition } = req.body;
    if (!asset_name || !asset_type) return res.status(400).json({ error: 'Name and type required' });
    const [result] = await pool.query(
      'INSERT INTO asset_inventory (asset_name, asset_type, serial_no, purchase_date, purchase_cost, asset_condition) VALUES (?, ?, ?, ?, ?, ?)',
      [asset_name, asset_type, serial_no || '', purchase_date || null, purchase_cost || 0, asset_condition || 'New']
    );
    const io = req.app.get('io');
    if (io) {
      io.to('role:MD').to('role:HR').emit('asset:created', { id: result.insertId, assetName: asset_name, assetType: asset_type });
    }
    res.status(201).json({ id: result.insertId, success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/assets/:id/assign — assign to employee
router.put('/:id/assign', verifyToken, requireRole('MD', 'HR'), auditLog('assign', 'asset'), async (req, res) => {
  try {
    const { emp_code } = req.body;
    if (!emp_code) return res.status(400).json({ error: 'Employee code required' });
    const [empExists] = await pool.query('SELECT code FROM employees WHERE code = ? AND is_active = 1', [emp_code]);
    if (empExists.length === 0) return res.status(404).json({ error: 'Employee not found' });
    await pool.query(
      'UPDATE asset_inventory SET assigned_to = ?, assigned_date = CURDATE(), assigned_by = ?, status = "Assigned" WHERE id = ?',
      [emp_code, req.user.empCode, req.params.id]
    );
    const io = req.app.get('io');
    if (io) {
      io.to('role:MD').to('role:HR').emit('asset:assigned', { id: parseInt(req.params.id), empCode: emp_code });
      io.to('user:' + emp_code).emit('asset:assigned', { id: parseInt(req.params.id), empCode: emp_code });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/assets/:id/return — return asset
router.put('/:id/return', verifyToken, requireRole('MD', 'HR'), auditLog('return', 'asset'), async (req, res) => {
  try {
    await pool.query(
      'UPDATE asset_inventory SET assigned_to = NULL, assigned_date = NULL, status = "Available" WHERE id = ?',
      [req.params.id]
    );
    const io = req.app.get('io');
    if (io) {
      io.to('role:MD').to('role:HR').emit('asset:returned', { id: parseInt(req.params.id) });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
