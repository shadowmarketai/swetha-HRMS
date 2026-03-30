const router = require('express').Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { generateCSV } = require('../utils/helpers');

// GET /api/reports/:type — CSV export
router.get('/:type', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    let rows, columns, filename;

    switch (req.params.type) {
      case 'employees': {
        [rows] = await pool.query('SELECT code, name, dept, designation, salary, bank, acc_no, phone, doj FROM employees WHERE is_active=1 ORDER BY dept, name');
        columns = [
          { key: 'code', label: 'Emp Code' }, { key: 'name', label: 'Name' }, { key: 'dept', label: 'Department' },
          { key: 'designation', label: 'Designation' }, { key: 'salary', label: 'Salary' }, { key: 'bank', label: 'Bank' },
          { key: 'acc_no', label: 'Account No' }, { key: 'phone', label: 'Phone' }, { key: 'doj', label: 'Date of Joining' }
        ];
        filename = 'employees.csv';
        break;
      }
      case 'kpi': {
        [rows] = await pool.query(
          `SELECT k.emp_code, e.name, e.dept, k.target_name, k.target_value, k.actual_value, k.score, k.period
           FROM kpi_scores k JOIN employees e ON k.emp_code = e.code ORDER BY k.period DESC, e.name`
        );
        columns = [
          { key: 'emp_code', label: 'Emp Code' }, { key: 'name', label: 'Name' }, { key: 'dept', label: 'Department' },
          { key: 'target_name', label: 'Target' }, { key: 'target_value', label: 'Target Value' },
          { key: 'actual_value', label: 'Actual' }, { key: 'score', label: 'Score' }, { key: 'period', label: 'Period' }
        ];
        filename = 'kpi_report.csv';
        break;
      }
      case 'salary': {
        [rows] = await pool.query('SELECT code, name, dept, designation, salary FROM employees WHERE is_active=1 ORDER BY dept, name');
        columns = [
          { key: 'code', label: 'Emp Code' }, { key: 'name', label: 'Name' }, { key: 'dept', label: 'Department' },
          { key: 'designation', label: 'Designation' }, { key: 'salary', label: 'Gross Salary' }
        ];
        filename = 'salary_report.csv';
        break;
      }
      case 'attendance': {
        const month = req.query.month || new Date().toISOString().slice(0, 7);
        [rows] = await pool.query(
          `SELECT a.emp_code, e.name, e.dept, a.log_date, a.check_in, a.check_out, a.status
           FROM attendance_logs a JOIN employees e ON a.emp_code = e.code
           WHERE a.log_date LIKE ? ORDER BY a.log_date, e.name`,
          [month + '%']
        );
        columns = [
          { key: 'emp_code', label: 'Emp Code' }, { key: 'name', label: 'Name' }, { key: 'dept', label: 'Department' },
          { key: 'log_date', label: 'Date' }, { key: 'check_in', label: 'Check In' }, { key: 'check_out', label: 'Check Out' },
          { key: 'status', label: 'Status' }
        ];
        filename = `attendance_${month}.csv`;
        break;
      }
      case 'tasks': {
        [rows] = await pool.query(
          `SELECT t.id, t.title, t.type, e.name as assignee, t.due_date, t.priority, t.status, t.done
           FROM tasks t LEFT JOIN employees e ON t.assigned_to = e.code ORDER BY t.due_date`
        );
        columns = [
          { key: 'id', label: 'ID' }, { key: 'title', label: 'Title' }, { key: 'type', label: 'Type' },
          { key: 'assignee', label: 'Assignee' }, { key: 'due_date', label: 'Due Date' },
          { key: 'priority', label: 'Priority' }, { key: 'status', label: 'Status' }
        ];
        filename = 'tasks.csv';
        break;
      }
      case 'advances': {
        [rows] = await pool.query('SELECT * FROM advance_requests ORDER BY applied_date DESC');
        columns = [
          { key: 'emp_name', label: 'Employee' }, { key: 'dept', label: 'Department' }, { key: 'type', label: 'Type' },
          { key: 'amount', label: 'Amount' }, { key: 'reason', label: 'Reason' }, { key: 'status', label: 'Status' },
          { key: 'applied_date', label: 'Applied Date' }, { key: 'reviewed_by', label: 'Reviewed By' }
        ];
        filename = 'advances.csv';
        break;
      }
      default:
        return res.status(400).json({ error: 'Unknown report type. Valid: employees, kpi, salary, attendance, tasks, advances' });
    }

    const csv = generateCSV(rows, columns);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
