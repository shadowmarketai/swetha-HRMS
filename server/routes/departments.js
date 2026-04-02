const router = require('express').Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

// Auto-migrate departments table
(async function() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS departments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    // Seed defaults if empty
    const [[{ cnt }]] = await pool.query('SELECT COUNT(*) as cnt FROM departments');
    if (cnt === 0) {
      await pool.query(
        'INSERT IGNORE INTO departments (name) VALUES (?), (?), (?), (?), (?), (?), (?)',
        ['Design', 'Marketing', 'Execution', 'Production', 'QS', 'Admin', 'Accounts']
      );
      console.log('[DEPARTMENTS] Seeded default departments');
    }
  } catch (e) { console.error('[DEPARTMENTS] Migration:', e.message); }
})();

// GET /api/departments — list all departments
router.get('/', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM departments ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/departments — add a new department (MD/HR only)
router.post('/', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Department name required' });
    const trimmed = name.trim();
    const [existing] = await pool.query('SELECT id FROM departments WHERE name = ?', [trimmed]);
    if (existing.length > 0) return res.status(400).json({ error: 'Department already exists' });
    const [result] = await pool.query('INSERT INTO departments (name) VALUES (?)', [trimmed]);
    res.status(201).json({ id: result.insertId, name: trimmed });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/departments/:id — remove a department (MD only)
router.delete('/:id', verifyToken, requireRole('MD'), async (req, res) => {
  try {
    const [dept] = await pool.query('SELECT name FROM departments WHERE id = ?', [req.params.id]);
    if (dept.length === 0) return res.status(404).json({ error: 'Department not found' });
    // Check if employees are in this department
    const [emps] = await pool.query('SELECT COUNT(*) as cnt FROM employees WHERE dept = ?', [dept[0].name]);
    if (emps[0].cnt > 0) return res.status(400).json({ error: 'Cannot delete: ' + emps[0].cnt + ' employees in this department' });
    await pool.query('DELETE FROM departments WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
