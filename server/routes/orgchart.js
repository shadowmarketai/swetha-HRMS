const router = require('express').Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');

// GET /api/orgchart — all reporting structure rows (any authenticated user)
router.get('/', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT rs.emp_code, rs.reports_to
       FROM reporting_structure rs
       JOIN employees e ON rs.emp_code = e.code
       WHERE e.is_active = 1`
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /orgchart error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/orgchart/:empCode — reassign reporting (MD/HR only)
router.put('/:empCode', verifyToken, requireRole('MD', 'HR'), auditLog('update', 'reporting_structure'), async (req, res) => {
  try {
    const empCode = req.params.empCode;
    const reportsTo = req.body.reports_to || null;

    // Validate employee exists
    const [empRows] = await pool.query('SELECT code FROM employees WHERE code = ? AND is_active = 1', [empCode]);
    if (empRows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Cannot report to self
    if (reportsTo && reportsTo === empCode) {
      return res.status(400).json({ error: 'Employee cannot report to themselves' });
    }

    // Validate manager exists (if not null/root)
    if (reportsTo) {
      const [mgrRows] = await pool.query('SELECT code FROM employees WHERE code = ? AND is_active = 1', [reportsTo]);
      if (mgrRows.length === 0) {
        return res.status(404).json({ error: 'Manager not found' });
      }
    }

    // Cycle detection: walk up from reportsTo to ensure empCode is not an ancestor
    if (reportsTo) {
      const [allRows] = await pool.query('SELECT emp_code, reports_to FROM reporting_structure');
      const parentMap = {};
      allRows.forEach(function(r) { parentMap[r.emp_code] = r.reports_to; });
      // Temporarily set the new relationship
      parentMap[empCode] = reportsTo;
      // Walk up from empCode
      let current = reportsTo;
      const visited = new Set();
      visited.add(empCode);
      while (current) {
        if (visited.has(current)) {
          return res.status(400).json({ error: 'This reassignment would create a cycle in the reporting chain' });
        }
        visited.add(current);
        current = parentMap[current] || null;
      }
    }

    // Upsert
    await pool.query(
      `INSERT INTO reporting_structure (emp_code, reports_to, effective_date)
       VALUES (?, ?, CURDATE())
       ON DUPLICATE KEY UPDATE reports_to = VALUES(reports_to), effective_date = CURDATE()`,
      [empCode, reportsTo]
    );

    res.json({ success: true, emp_code: empCode, reports_to: reportsTo });
  } catch (err) {
    console.error('PUT /orgchart error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
