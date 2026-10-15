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

      // System / shared accounts that don't physically clock in — exclude from attendance math
      const SYSTEM_CODES = ['HR001', 'MD001', 'SADMIN'];
      const sysPlaceholders = SYSTEM_CODES.map(() => '?').join(',');

      // Attendance summary today
      // IST calendar date, same as check-in's log_date (UTC lagged until 05:30 IST)
      const istToday = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      const istMonth = istToday.slice(0, 7);
      const today = istToday;
      // Employees whose joining date is still ahead are not expected in yet
      const [totalActiveRows] = await pool.query(
        `SELECT COUNT(*) as totalActive FROM employees
         WHERE is_active = 1 AND role != 'MD' AND code NOT IN (${sysPlaceholders})
           AND (doj IS NULL OR doj <= ?)`,
        [...SYSTEM_CODES, today]
      );
      const totalActive = (totalActiveRows && totalActiveRows[0]) ? totalActiveRows[0].totalActive : 0;
      const [presentTodayRows] = await pool.query(
        `SELECT COUNT(DISTINCT emp_code) as presentToday FROM attendance_logs
         WHERE log_date = ? AND emp_code NOT IN (${sysPlaceholders})`,
        [today, ...SYSTEM_CODES]
      );
      const presentToday = (presentTodayRows && presentTodayRows[0]) ? presentTodayRows[0].presentToday : 0;

      // Employees not checked-in today, split into "informed leave" vs "absent"
      // Informed leave = approved leave covering today
      const [notCheckedIn] = await pool.query(
        `SELECT e.code, e.name, e.dept,
                la.leave_type, la.from_date, la.to_date
         FROM employees e
         LEFT JOIN leave_applications la
           ON la.emp_code = e.code
          AND la.status = 'approved'
          AND ? BETWEEN la.from_date AND la.to_date
         WHERE e.is_active = 1 AND e.role != 'MD'
           AND e.code NOT IN (${sysPlaceholders})
           AND (e.doj IS NULL OR e.doj <= ?)
           AND e.code NOT IN (SELECT DISTINCT emp_code FROM attendance_logs WHERE log_date = ?)
         ORDER BY e.dept, e.name`,
        [today, ...SYSTEM_CODES, today, today]
      ).catch(() => [[]]);

      const leaveList = [];
      const absentList = [];
      (notCheckedIn || []).forEach(function(r) {
        if (r.leave_type) {
          leaveList.push({ code: r.code, name: r.name, dept: r.dept, leave_type: r.leave_type });
        } else {
          absentList.push({ code: r.code, name: r.name, dept: r.dept });
        }
      });

      data.attendanceToday = {
        total: totalActive,
        present: presentToday,
        leave: leaveList.length,
        absent: (totalActive - presentToday) - leaveList.length,
        leaveList: leaveList,
        absentList: absentList
      };

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

      // Top absentees (lowest attendance rate this month). Each employee's working
      // days count only from their joining date, so a mid-month hire is not ranked
      // as absent for days before they joined.
      const [absenteeRows] = await pool.query(
        `SELECT e.name, e.code, e.dept, DATE_FORMAT(e.doj, '%Y-%m-%d') AS doj,
         (SELECT COUNT(DISTINCT log_date) FROM attendance_logs WHERE emp_code = e.code AND DATE_FORMAT(log_date, '%Y-%m') = ?) as days_present
         FROM employees e
         WHERE e.is_active = 1 AND e.role != 'MD' AND e.code NOT IN (${sysPlaceholders})
           AND (e.doj IS NULL OR e.doj <= ?)`, [istMonth, ...SYSTEM_CODES, istToday]
      );
      const [holRows] = await pool.query(
        "SELECT DATE_FORMAT(holiday_date, '%Y-%m-%d') AS d FROM public_holidays WHERE DATE_FORMAT(holiday_date, '%Y-%m') = ?", [istMonth]
      ).catch(() => [[]]);
      const holidaySet = new Set((holRows || []).map(h => h.d));
      const workingDaysSince = (fromYmd) => {
        let n = 0;
        const [y, m] = istMonth.split('-').map(Number);
        for (let d = 1; d <= Number(istToday.slice(8, 10)); d++) {
          const ymd = `${istMonth}-${String(d).padStart(2, '0')}`;
          if (ymd < fromYmd || holidaySet.has(ymd) || new Date(y, m - 1, d).getDay() === 0) continue;
          n++;
        }
        return n;
      };
      data.topAbsentees = absenteeRows
        .map(r => {
          const workingDays = workingDaysSince(r.doj && r.doj > istMonth + '-01' ? r.doj : istMonth + '-01');
          return { name: r.name, code: r.code, dept: r.dept, days_present: r.days_present, working_days: workingDays,
                   rate: workingDays > 0 ? r.days_present / workingDays : 1 };
        })
        .sort((a, b) => a.rate - b.rate)
        .slice(0, 10);
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
      const [advRows] = await pool.query(
        "SELECT COALESCE(SUM(amount), 0) as totalAdvanceOut FROM advance_requests WHERE status IN ('Approved','HR_Accepted','Accounts_Accepted','Paid') AND settled = 0"
      ).catch(() => [[{totalAdvanceOut: 0}]]);
      const totalAdvanceOut = (advRows && advRows[0]) ? advRows[0].totalAdvanceOut : 0;
      data.totalAdvanceOut = totalAdvanceOut;

      // Monthly expense trend
      const [expenseTrend] = await pool.query(
        `SELECT DATE_FORMAT(submitted_at, '%Y-%m') as month, SUM(amount) as total
         FROM expense_reimbursements WHERE submitted_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
         GROUP BY DATE_FORMAT(submitted_at, '%Y-%m') ORDER BY month`
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
