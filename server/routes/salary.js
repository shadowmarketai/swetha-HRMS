const router = require('express').Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET /api/salary — get salary data (own for Employee, all for MD/HR)
router.get('/', verifyToken, async (req, res) => {
  try {
    let query, params;
    // MD, HR, and Accounts dept can see all salaries
    const isAccounts = req.user.role === 'Employee' || req.user.role === 'Manager';
    let empDept = '';
    if (isAccounts) {
      const [empRows] = await pool.query('SELECT dept FROM employees WHERE code = ?', [req.user.empCode]);
      if (empRows.length > 0) empDept = empRows[0].dept;
    }
    if (['MD', 'HR'].includes(req.user.role) || empDept === 'Accounts') {
      query = 'SELECT code, name, dept, designation, salary, bank, acc_no FROM employees WHERE is_active = 1 ORDER BY dept, name';
      params = [];
    } else {
      query = 'SELECT code, name, dept, designation, salary, bank, acc_no FROM employees WHERE code = ?';
      params = [req.user.empCode];
    }
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/salary/:code/:month — get specific employee salary for a month
// Month format: "2025-04" (YYYY-MM)
// Returns base salary; frontend computes ±5% monthly variation via seededRandom
router.get('/:code/:month', verifyToken, async (req, res) => {
  try {
    // Only MD/HR can view other employees' salary; employees can view their own
    if (!['MD', 'HR'].includes(req.user.role) && req.user.empCode !== req.params.code) {
      return res.status(403).json({ error: 'Cannot view other employee salary' });
    }
    const [rows] = await pool.query(
      'SELECT code, name, dept, designation, salary, bank, acc_no FROM employees WHERE code = ?',
      [req.params.code]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Employee not found' });
    res.json({ ...rows[0], month: req.params.month });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/salary/:code — update employee salary (Accounts dept, MD, HR only)
router.put('/:code', verifyToken, async (req, res) => {
  try {
    // Check if user is MD, HR, or Accounts dept
    let allowed = ['MD', 'HR'].includes(req.user.role);
    if (!allowed) {
      const [empRows] = await pool.query('SELECT dept FROM employees WHERE code = ?', [req.user.empCode]);
      if (empRows.length > 0 && empRows[0].dept === 'Accounts') allowed = true;
    }
    if (!allowed) return res.status(403).json({ error: 'Only Accounts, MD, or HR can update salary' });

    const { salary } = req.body;
    if (salary === undefined || salary === null || isNaN(parseFloat(salary)) || parseFloat(salary) < 0) {
      return res.status(400).json({ error: 'Valid salary amount required' });
    }

    const [emp] = await pool.query('SELECT code, name FROM employees WHERE code = ?', [req.params.code]);
    if (emp.length === 0) return res.status(404).json({ error: 'Employee not found' });

    await pool.query('UPDATE employees SET salary = ? WHERE code = ?', [parseFloat(salary), req.params.code]);

    // Notify MD and HR about salary update
    const io = req.app.get('io');
    if (io) {
      io.to('role:MD').to('role:HR').emit('salary:updated', {
        empCode: req.params.code, empName: emp[0].name, salary: parseFloat(salary), updatedBy: req.user.empCode
      });
    }

    res.json({ message: 'Salary updated for ' + req.params.code, salary: parseFloat(salary) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
