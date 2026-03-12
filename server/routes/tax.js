const router = require('express').Router();
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// GET /api/tax — get current user's tax declaration
router.get('/', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM tax_declarations WHERE emp_code = ? ORDER BY fy DESC LIMIT 1',
      [req.user.empCode]
    );
    res.json(rows.length > 0 ? rows[0] : null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tax — submit/update tax declaration
router.post('/', verifyToken, [
  body('fy').optional().trim().matches(/^\d{4}-\d{2}$/).withMessage('FY format must be YYYY-YY'),
  body('section_80c').optional().isNumeric().withMessage('Must be numeric'),
  body('section_80d').optional().isNumeric().withMessage('Must be numeric'),
  body('annual_income').optional().isNumeric().withMessage('Must be numeric'),
  body('tax_liability').optional().isNumeric().withMessage('Must be numeric')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
  try {
    const { fy, section_80c, section_80d, hra_exemption, home_loan_interest,
            annual_income, total_deductions, taxable_income, tax_liability, monthly_tds } = req.body;
    await pool.query(
      `INSERT INTO tax_declarations (emp_code, fy, section_80c, section_80d, hra_exemption,
        home_loan_interest, annual_income, total_deductions, taxable_income, tax_liability, monthly_tds)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE section_80c = VALUES(section_80c), section_80d = VALUES(section_80d),
        hra_exemption = VALUES(hra_exemption), home_loan_interest = VALUES(home_loan_interest),
        annual_income = VALUES(annual_income), total_deductions = VALUES(total_deductions),
        taxable_income = VALUES(taxable_income), tax_liability = VALUES(tax_liability),
        monthly_tds = VALUES(monthly_tds), updated_at = NOW()`,
      [req.user.empCode, fy || '2025-26', section_80c || 0, section_80d || 0,
       hra_exemption || 0, home_loan_interest || 0, annual_income || 0,
       total_deductions || 0, taxable_income || 0, tax_liability || 0, monthly_tds || 0]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
