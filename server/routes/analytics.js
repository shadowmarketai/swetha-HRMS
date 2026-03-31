const router = require('express').Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET /api/analytics/home — role-based dashboard analytics
router.get('/home', verifyToken, async (req, res) => {
  try {
    const role = req.user.role;
    const empCode = req.user.empCode;
    const currentMonth = new Date().toISOString().slice(0, 7);
    const data = {};

    // ══════════════════════════════════
    // EMPLOYEE — own stats only
    // ══════════════════════════════════
    // My attendance this month (all roles)
    const [myAttendance] = await pool.query(
      `SELECT DATE(log_date) as day, COUNT(*) as sessions
       FROM attendance_logs WHERE emp_code = ? AND DATE_FORMAT(log_date, '%Y-%m') = ?
       GROUP BY DATE(log_date) ORDER BY day`, [empCode, currentMonth]
    );
    data.myAttendance = myAttendance;

    // My leave usage (all roles)
    const [myLeaves] = await pool.query(
      `SELECT leave_type, SUM(days) as total_days, COUNT(*) as count
       FROM leave_applications WHERE emp_code = ? AND status = 'approved'
       GROUP BY leave_type`, [empCode]
    );
    data.myLeaveUsage = myLeaves;

    if (role === 'Employee') {
      return res.json(data);
    }

    // ══════════════════════════════════
    // HR + MD — team-level analytics
    // ══════════════════════════════════
    if (role === 'HR' || role === 'MD' || role === 'Manager') {
      // Department-wise employee count
      const [deptCount] = await pool.query(
        'SELECT dept, COUNT(*) as count FROM employees WHERE is_active = 1 GROUP BY dept ORDER BY count DESC'
      );
      data.deptDistribution = deptCount;

      // Attendance summary today
      const today = new Date().toISOString().split('T')[0];
      const [[{ totalActive }]] = await pool.query("SELECT COUNT(*) as totalActive FROM employees WHERE is_active = 1 AND role != 'MD'");
      const [[{ presentToday }]] = await pool.query('SELECT COUNT(DISTINCT emp_code) as presentToday FROM attendance_logs WHERE log_date = ?', [today]);
      data.attendanceToday = { total: totalActive, present: presentToday, absent: totalActive - presentToday };

      // Monthly attendance trend (last 6 months)
      const [monthlyAttendance] = await pool.query(
        `SELECT DATE_FORMAT(log_date, '%Y-%m') as month, COUNT(DISTINCT emp_code) as unique_checkins, COUNT(*) as total_sessions
         FROM attendance_logs WHERE log_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
         GROUP BY DATE_FORMAT(log_date, '%Y-%m') ORDER BY month`
      );
      data.monthlyAttendance = monthlyAttendance;

      // Leave requests by status (this month)
      const [leaveStats] = await pool.query(
        `SELECT status, COUNT(*) as count FROM leave_applications
         WHERE DATE_FORMAT(created_at, '%Y-%m') = ? GROUP BY status`, [currentMonth]
      );
      data.leaveStats = leaveStats;

      // Top absentees (most absent days this month)
      const [absentees] = await pool.query(
        `SELECT e.name, e.code, e.dept,
         (SELECT COUNT(DISTINCT log_date) FROM attendance_logs WHERE emp_code = e.code AND DATE_FORMAT(log_date, '%Y-%m') = ?) as days_present
         FROM employees e WHERE e.is_active = 1 AND e.role != 'MD'
         ORDER BY days_present ASC LIMIT 10`, [currentMonth]
      );
      data.topAbsentees = absentees;
    }

    // ══════════════════════════════════
    // MD ONLY — financial + PEB analytics
    // ══════════════════════════════════
    if (role === 'MD') {
      // Department-wise salary distribution
      const [deptSalary] = await pool.query(
        'SELECT dept, COUNT(*) as count, SUM(salary) as total_salary, AVG(salary) as avg_salary FROM employees WHERE is_active = 1 AND salary > 0 GROUP BY dept ORDER BY total_salary DESC'
      );
      data.deptSalary = deptSalary;

      // PEB stock by category
      const [stockByCategory] = await pool.query(
        'SELECT category, COUNT(*) as items, SUM(current_stock * unit_price) as value FROM peb_stock_items GROUP BY category ORDER BY value DESC'
      );
      data.stockByCategory = stockByCategory;

      // PEB stock consumption (last 6 months — MIS transactions)
      const [stockConsumption] = await pool.query(
        `SELECT DATE_FORMAT(created_at, '%Y-%m') as month, SUM(quantity) as total_issued
         FROM peb_stock_transactions WHERE type = 'MIS' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
         GROUP BY DATE_FORMAT(created_at, '%Y-%m') ORDER BY month`
      );
      data.stockConsumption = stockConsumption;

      // Advance exposure
      const [[{ totalAdvanceOut }]] = await pool.query(
        "SELECT COALESCE(SUM(amount), 0) as totalAdvanceOut FROM advance_requests WHERE status IN ('Approved','HR_Accepted') AND settled = 0"
      ).catch(() => [[{totalAdvanceOut: 0}]]);
      data.totalAdvanceOut = totalAdvanceOut;

      // Monthly expense trend
      const [expenseTrend] = await pool.query(
        `SELECT DATE_FORMAT(created_at, '%Y-%m') as month, SUM(amount) as total
         FROM expense_claims WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
         GROUP BY DATE_FORMAT(created_at, '%Y-%m') ORDER BY month`
      ).catch(() => [[]]);
      data.expenseTrend = expenseTrend;
    }

    res.json(data);
  } catch (err) {
    console.error('[ANALYTICS]', err.message);
    res.json({ myAttendance: [], myLeaveUsage: [] });
  }
});

module.exports = router;
