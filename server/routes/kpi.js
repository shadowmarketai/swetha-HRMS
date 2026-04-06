const router = require('express').Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET /api/kpi — all KPI data (MD/HR) — MUST be before /:empCode
router.get('/', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    const [scores] = await pool.query(
      `SELECT k.*, e.name, e.dept FROM kpi_scores k
       JOIN employees e ON k.emp_code = e.code ORDER BY k.period DESC, e.name`
    );
    res.json(scores);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/kpi/:empCode — get KPI scores (IDOR protected)
router.get('/:empCode', verifyToken, async (req, res) => {
  try {
    // Employees can only view their own KPI; MD/HR can view anyone
    if (req.user.role === 'Employee' && req.params.empCode !== req.user.empCode) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const [scores] = await pool.query('SELECT * FROM kpi_scores WHERE emp_code = ? ORDER BY period DESC', [req.params.empCode]);
    const [selfRatings] = await pool.query('SELECT * FROM kpi_self_ratings WHERE emp_code = ? ORDER BY submitted_at DESC', [req.params.empCode]);
    res.json({ scores, selfRatings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/kpi/self-rate — submit self-rating
router.post('/self-rate', verifyToken, async (req, res) => {
  try {
    const { period, ratings } = req.body;
    if (!period || !ratings || !Array.isArray(ratings)) {
      return res.status(400).json({ error: 'Period and ratings array required' });
    }
    for (const r of ratings) {
      if (!r.category || typeof r.rating !== 'number' || r.rating < 0 || r.rating > 10) {
        return res.status(400).json({ error: 'Each rating must have a category and numeric rating (0-10)' });
      }
      await pool.query(
        'INSERT INTO kpi_self_ratings (emp_code, period, category, rating, comments) VALUES (?, ?, ?, ?, ?)',
        [req.user.empCode, period, r.category, r.rating, r.comments || '']
      );
    }
    const io = req.app.get('io');
    if (io) {
      io.to('role:MD').to('role:HR').emit('kpi:selfRated', { empCode: req.user.empCode, period });
    }
    res.json({ message: 'Self-rating submitted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/kpi/scores — submit/update scores (MD/HR)
router.post('/scores', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    const { empCode, period, targets } = req.body;
    if (!empCode || !period || !targets) {
      return res.status(400).json({ error: 'empCode, period, and targets required' });
    }
    for (const t of targets) {
      await pool.query(
        `INSERT INTO kpi_scores (emp_code, period, target_name, target_value, actual_value, score, weight)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE actual_value=VALUES(actual_value), score=VALUES(score)`,
        [empCode, period, t.name, t.targetValue, t.actualValue, t.score, t.weight || 1]
      );
    }
    const io = req.app.get('io');
    if (io) {
      io.to('role:MD').to('role:HR').emit('kpi:scoresUpdated', { empCode, period });
      io.to('user:' + empCode).emit('kpi:scoresUpdated', { empCode, period });
    }
    res.json({ message: 'KPI scores updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
