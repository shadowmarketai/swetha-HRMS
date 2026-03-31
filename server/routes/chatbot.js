const router = require('express').Router();
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// POST /api/chatbot — process a question
router.post('/', verifyToken, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) return res.json({ reply: "Please ask me a question!" });

    const q = message.toLowerCase().trim();
    const user = req.user; // { empCode, name, role }
    const role = user.role;
    const isMD = role === 'MD';
    const isHR = role === 'HR';
    const isManager = role === 'Manager';
    const isMDorHR = isMD || isHR;
    const isMDHRMgr = isMD || isHR || isManager;
    const isEmployee = role === 'Employee';
    const RESTRICTED = "Sorry, you don't have permission to access this information. Please contact your HR or Manager.";
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().toISOString().slice(0, 7);

    // ── GREETING ──
    if (/^(hi|hello|hey|good morning|good afternoon|good evening)/.test(q)) {
      return res.json({ reply: `Hello ${user.name}! I'm your HR Assistant. Ask me about attendance, leaves, salary, employees, or stock. How can I help?` });
    }

    // ── HELP ──
    if (/^(help|what can you do|commands|menu)/.test(q)) {
      let help = "Here's what I can help with:\n\n";
      help += "**Your Info:** \"Am I checked in?\", \"My attendance\", \"My leave balance\", \"My salary\", \"My profile\"\n";
      help += "**General:** \"Leave policy\", \"What's the date?\"\n";
      if (isMDHRMgr) {
        help += "\n**Manager+ Commands:**\n";
        help += "\"Is [name] present?\", \"Who is absent today?\"\n";
        help += "\"Attendance of [name]\"\n";
        help += "\"All projects\", \"Project [name] status\", \"Team of [name] project\"\n";
      }
      if (isMDorHR) {
        help += "\n**HR/MD Commands:**\n";
        help += "\"Who is on leave today?\", \"Pending leave requests\"\n";
        help += "\"Pending advance requests\", \"Total employees\"\n";
        help += "\"Show salary of [name]\", \"Pending approvals\"\n";
      }
      if (isMD) {
        help += "\n**MD Only:**\n";
        help += "\"Low stock items\", \"Stock value\"\n";
      }
      return res.json({ reply: help });
    }

    // ── AM I CHECKED IN? ──
    if (/am i (checked in|present|at work)|my check.?in status/.test(q)) {
      const [logs] = await pool.query(
        'SELECT * FROM attendance_logs WHERE emp_code = ? AND log_date = ? ORDER BY check_in DESC',
        [user.empCode, today]
      );
      if (logs.length === 0) return res.json({ reply: "You are **not checked in** today. Please check in using the home screen." });
      const latest = logs[0];
      if (latest.check_in && !latest.check_out) {
        const checkinTime = new Date(latest.check_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
        return res.json({ reply: `You are **checked in** since ${checkinTime} at ${latest.location_name || 'office'}. Total sessions today: ${logs.length}` });
      } else {
        const checkoutTime = new Date(latest.check_out).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
        return res.json({ reply: `You **checked out** at ${checkoutTime}. Total sessions today: ${logs.length}. You can re-check in anytime.` });
      }
    }

    // ── MY ATTENDANCE THIS MONTH ──
    if (/my attendance|my attendance this month/.test(q)) {
      const [summary] = await pool.query(
        `SELECT COUNT(*) as total,
         SUM(CASE WHEN check_in IS NOT NULL THEN 1 ELSE 0 END) as present,
         SUM(CASE WHEN check_out IS NOT NULL THEN 1 ELSE 0 END) as completed
         FROM attendance_logs WHERE emp_code = ? AND DATE_FORMAT(log_date, '%Y-%m') = ?`,
        [user.empCode, currentMonth]
      );
      const s = summary[0];
      return res.json({ reply: `**Your attendance this month (${currentMonth}):**\n- Days checked in: **${s.present || 0}**\n- Completed sessions: **${s.completed || 0}**` });
    }

    // ── MY LEAVE BALANCE ──
    if (/my leave|leave balance|how many leave|leaves? (do i|remaining|left)/.test(q)) {
      const [bal] = await pool.query('SELECT * FROM leave_balances WHERE emp_code = ?', [user.empCode]);
      if (bal.length === 0) return res.json({ reply: "No leave balance found. Please contact HR." });
      const b = bal[0];
      return res.json({ reply: `**Your leave balance:**\n- Casual Leave: **${b.casual || 0}** of 12 remaining\n- Compensatory: **${b.comp || 0}**\n\nPolicy: 1 paid casual leave per month. Extra leaves = salary deduction (LOP).` });
    }

    // ── MY LEAVES THIS MONTH ──
    if (/my leaves? this month|leaves? i (took|applied|taken)/.test(q)) {
      const [leaves] = await pool.query(
        "SELECT * FROM leave_applications WHERE emp_code = ? AND DATE_FORMAT(from_date, '%Y-%m') = ? ORDER BY from_date",
        [user.empCode, currentMonth]
      );
      if (leaves.length === 0) return res.json({ reply: "You have no leave applications this month." });
      let reply = `**Your leaves this month:**\n`;
      leaves.forEach(l => {
        reply += `- ${l.leave_type} | ${l.from_date} to ${l.to_date} (${l.days} days) — **${l.status}**\n`;
      });
      return res.json({ reply });
    }

    // ── MY SALARY ──
    if (/my salary|what.?s my (salary|pay|ctc)/.test(q)) {
      const [emp] = await pool.query('SELECT salary, designation, dept FROM employees WHERE code = ?', [user.empCode]);
      if (emp.length === 0) return res.json({ reply: "Employee record not found." });
      const sal = emp[0].salary;
      return res.json({ reply: `**Your salary details:**\n- Monthly: **Rs.${sal ? Number(sal).toLocaleString('en-IN') : 'Not set'}**\n- Designation: ${emp[0].designation || '-'}\n- Department: ${emp[0].dept || '-'}` });
    }

    // ── MY PROFILE ──
    if (/my profile|my details|show my info/.test(q)) {
      const [emp] = await pool.query('SELECT * FROM employees WHERE code = ?', [user.empCode]);
      if (emp.length === 0) return res.json({ reply: "Profile not found." });
      const e = emp[0];
      return res.json({ reply: `**Your profile:**\n- Name: **${e.name}**\n- Code: ${e.code}\n- Role: ${e.role}\n- Dept: ${e.dept || '-'}\n- Designation: ${e.designation || '-'}\n- Phone: ${e.phone || '-'}\n- DOJ: ${e.doj || '-'}\n- DOB: ${e.dob || '-'}` });
    }

    // ════════════════════════════════
    // MD/HR ONLY QUERIES BELOW
    // ════════════════════════════════

    // ── IS [NAME] PRESENT? (Manager+) ──
    if (/is (.+?) (present|checked in|at work|in office)/.test(q)) {
      if (isEmployee) return res.json({ reply: RESTRICTED });
      const name = q.match(/is (.+?) (present|checked in|at work|in office)/)[1].trim();
      const [emps] = await pool.query('SELECT code, name FROM employees WHERE LOWER(name) LIKE ? AND is_active = 1', [`%${name}%`]);
      if (emps.length === 0) return res.json({ reply: `No employee found matching "${name}".` });
      let reply = '';
      for (const emp of emps) {
        const [log] = await pool.query(
          'SELECT * FROM attendance_logs WHERE emp_code = ? AND log_date = ? ORDER BY check_in DESC LIMIT 1',
          [emp.code, today]
        );
        if (log.length === 0) {
          reply += `**${emp.name}** (${emp.code}) — Not checked in today\n`;
        } else if (log[0].check_in && !log[0].check_out) {
          const t = new Date(log[0].check_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
          reply += `**${emp.name}** (${emp.code}) — **Present** since ${t} at ${log[0].location_name || 'office'}\n`;
        } else {
          const t = new Date(log[0].check_out).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
          reply += `**${emp.name}** (${emp.code}) — Checked out at ${t}\n`;
        }
      }
      return res.json({ reply });
    }

    // ── WHO IS ABSENT TODAY? (Manager+) ──
    if (/who.?s? (is )?(absent|not (present|checked in)|missing)/.test(q)) {
      if (isEmployee) return res.json({ reply: RESTRICTED });
      const [all] = await pool.query("SELECT code, name, dept FROM employees WHERE is_active = 1 AND role != 'MD'");
      const [presentCodes] = await pool.query('SELECT DISTINCT emp_code FROM attendance_logs WHERE log_date = ?', [today]);
      const presentSet = new Set(presentCodes.map(r => r.emp_code));
      const absent = all.filter(e => !presentSet.has(e.code));
      if (absent.length === 0) return res.json({ reply: "Everyone is checked in today!" });
      let reply = `**Absent today (${absent.length} employees):**\n`;
      absent.forEach(e => { reply += `- ${e.name} (${e.code}) — ${e.dept || '-'}\n`; });
      return res.json({ reply });
    }

    // ── WHO IS PRESENT TODAY? (Manager+) ──
    if (/who.?s? (is )?(present|checked in|at work|in office) today/.test(q)) {
      if (isEmployee) return res.json({ reply: RESTRICTED });
      const [logs] = await pool.query(
        `SELECT a.emp_code, e.name, e.dept, a.check_in, a.check_out, a.location_name
         FROM attendance_logs a JOIN employees e ON a.emp_code = e.code
         WHERE a.log_date = ? ORDER BY a.check_in DESC`, [today]
      );
      if (logs.length === 0) return res.json({ reply: "No one has checked in today yet." });
      let reply = `**Present today (${logs.length} entries):**\n`;
      logs.forEach(l => {
        const t = new Date(l.check_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
        const status = l.check_out ? 'Checked out' : 'Active';
        reply += `- **${l.name}** (${l.emp_code}) — ${t} at ${l.location_name || '-'} [${status}]\n`;
      });
      return res.json({ reply });
    }

    // ── WHO IS ON LEAVE TODAY? (HR/MD) ──
    if (/who.?s? (is )?on leave|leave today/.test(q)) {
      if (!isMDorHR) return res.json({ reply: RESTRICTED });
      const [leaves] = await pool.query(
        `SELECT la.*, e.name FROM leave_applications la JOIN employees e ON la.emp_code = e.code
         WHERE la.status IN ('approved','hr_accepted') AND ? BETWEEN la.from_date AND la.to_date`, [today]
      );
      if (leaves.length === 0) return res.json({ reply: "No one is on approved leave today." });
      let reply = `**On leave today (${leaves.length}):**\n`;
      leaves.forEach(l => { reply += `- **${l.name}** — ${l.leave_type} (${l.from_date} to ${l.to_date})\n`; });
      return res.json({ reply });
    }

    // ── PENDING LEAVE REQUESTS (HR/MD) ──
    if (/pending leave|leave request|leave pending/.test(q)) {
      if (!isMDorHR) return res.json({ reply: RESTRICTED });
      const [pending] = await pool.query(
        "SELECT la.*, e.name FROM leave_applications la JOIN employees e ON la.emp_code = e.code WHERE la.status IN ('pending','hr_accepted') ORDER BY la.created_at DESC"
      );
      if (pending.length === 0) return res.json({ reply: "No pending leave requests." });
      let reply = `**Pending leave requests (${pending.length}):**\n`;
      pending.forEach(l => {
        reply += `- **${l.name}** — ${l.leave_type} | ${l.from_date} to ${l.to_date} (${l.days} days) — ${l.status}\n`;
      });
      return res.json({ reply });
    }

    // ── PENDING ADVANCE REQUESTS (HR/MD) ──
    if (/pending advance|advance request/.test(q)) {
      if (!isMDorHR) return res.json({ reply: RESTRICTED });
      const [pending] = await pool.query(
        "SELECT * FROM advance_requests WHERE status IN ('Pending','HR_Accepted') ORDER BY created_at DESC"
      );
      if (pending.length === 0) return res.json({ reply: "No pending advance requests." });
      let reply = `**Pending advance requests (${pending.length}):**\n`;
      pending.forEach(a => {
        reply += `- ${a.emp_code} — ${a.type} Rs.${Number(a.amount).toLocaleString('en-IN')} — ${a.status}\n`;
      });
      return res.json({ reply });
    }

    // ── TOTAL EMPLOYEES (HR/MD) ──
    if (/total employee|how many employee|employee count|headcount/.test(q)) {
      if (!isMDorHR) return res.json({ reply: RESTRICTED });
      const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM employees WHERE is_active = 1');
      const [byRole] = await pool.query('SELECT role, COUNT(*) as count FROM employees WHERE is_active = 1 GROUP BY role');
      let reply = `**Total active employees: ${total}**\n`;
      byRole.forEach(r => { reply += `- ${r.role}: ${r.count}\n`; });
      return res.json({ reply });
    }

    // ── SHOW SALARY OF [NAME] (HR/MD only) ──
    if (/salary of (.+)|(.+?)['']?s salary/.test(q)) {
      if (!isMDorHR) return res.json({ reply: "You can only view your own salary. Other employees' salary is confidential." });
      const match = q.match(/salary of (.+)/) || q.match(/(.+?)['']?s salary/);
      const name = match ? match[1].trim() : '';
      const [emps] = await pool.query('SELECT code, name, salary, designation, dept FROM employees WHERE LOWER(name) LIKE ? AND is_active = 1', [`%${name}%`]);
      if (emps.length === 0) return res.json({ reply: `No employee found matching "${name}".` });
      let reply = '';
      emps.forEach(e => {
        reply += `**${e.name}** (${e.code}) — Rs.${e.salary ? Number(e.salary).toLocaleString('en-IN') : 'Not set'} | ${e.designation || '-'} | ${e.dept || '-'}\n`;
      });
      return res.json({ reply });
    }

    // ── ATTENDANCE OF [NAME] (Manager+) ──
    if (/attendance of (.+)|(.+?)['']?s attendance/.test(q)) {
      if (isEmployee) return res.json({ reply: RESTRICTED });
      const match = q.match(/attendance of (.+)/) || q.match(/(.+?)['']?s attendance/);
      const name = match ? match[1].trim() : '';
      const [emps] = await pool.query('SELECT code, name FROM employees WHERE LOWER(name) LIKE ? AND is_active = 1', [`%${name}%`]);
      if (emps.length === 0) return res.json({ reply: `No employee found matching "${name}".` });
      const emp = emps[0];
      const [[summary]] = await pool.query(
        `SELECT COUNT(*) as days, SUM(CASE WHEN check_out IS NOT NULL THEN 1 ELSE 0 END) as completed
         FROM attendance_logs WHERE emp_code = ? AND DATE_FORMAT(log_date, '%Y-%m') = ?`,
        [emp.code, currentMonth]
      );
      const [todayLog] = await pool.query('SELECT * FROM attendance_logs WHERE emp_code = ? AND log_date = ? ORDER BY check_in DESC LIMIT 1', [emp.code, today]);
      let todayStatus = 'Not checked in';
      if (todayLog.length > 0) {
        todayStatus = todayLog[0].check_out ? 'Checked out' : 'Present (checked in)';
      }
      return res.json({ reply: `**${emp.name} (${emp.code}) attendance:**\n- Today: **${todayStatus}**\n- This month: **${summary.days || 0}** days checked in, **${summary.completed || 0}** completed sessions` });
    }

    // ── LOW STOCK ITEMS (MD only) ──
    if (/low stock|stock alert|stock shortage/.test(q)) {
      if (!isMD) return res.json({ reply: "Stock information is restricted to MD only." });
      const [items] = await pool.query('SELECT item_name, item_code, current_stock, min_stock_level, unit FROM peb_stock_items WHERE current_stock <= min_stock_level AND min_stock_level > 0 ORDER BY (current_stock/min_stock_level) ASC LIMIT 10');
      if (items.length === 0) return res.json({ reply: "All stock levels are healthy. No low stock alerts." });
      let reply = `**Low stock items (${items.length}):**\n`;
      items.forEach(i => {
        reply += `- **${i.item_name}** (${i.item_code}) — ${i.current_stock} / ${i.min_stock_level} ${i.unit}\n`;
      });
      return res.json({ reply });
    }

    // ── STOCK VALUE (MD only) ──
    if (/stock value|inventory value|total stock/.test(q)) {
      if (!isMD) return res.json({ reply: "Stock information is restricted to MD only." });
      const [[{ total, count }]] = await pool.query('SELECT COUNT(*) as count, COALESCE(SUM(current_stock * unit_price), 0) as total FROM peb_stock_items');
      return res.json({ reply: `**Stock summary:**\n- Total items: **${count}**\n- Total value: **Rs.${Number(total).toLocaleString('en-IN')}**` });
    }

    // ── PENDING APPROVALS (HR/MD) ──
    if (/pending approval|what.?s pending|approvals?/.test(q)) {
      if (!isMDorHR) return res.json({ reply: RESTRICTED });
      const [[{ leaves }]] = await pool.query("SELECT COUNT(*) as leaves FROM leave_applications WHERE status IN ('pending','hr_accepted')");
      const [[{ advances }]] = await pool.query("SELECT COUNT(*) as advances FROM advance_requests WHERE status IN ('Pending','HR_Accepted')");
      const [[{ transport }]] = await pool.query("SELECT COUNT(*) as transport FROM peb_transport_requests WHERE status = 'REQUESTED'").catch(() => [{transport:0}]);
      const [[{ indents }]] = await pool.query("SELECT COUNT(*) as indents FROM peb_purchase_indents WHERE status IN ('COMPARISON_READY','GM_APPROVED')").catch(() => [{indents:0}]);
      const total = (leaves||0) + (advances||0) + (transport||0) + (indents||0);
      return res.json({ reply: `**Pending approvals (${total}):**\n- Leave requests: **${leaves||0}**\n- Advance requests: **${advances||0}**\n- Transport requests: **${transport||0}**\n- Purchase indents: **${indents||0}**` });
    }

    // ── ALL PROJECTS (Manager+) ──
    if (/all project|how many project|project list|projects? (going|running|active|ongoing)|show project|list project/.test(q)) {
      if (isEmployee) return res.json({ reply: RESTRICTED });
      const [projects] = await pool.query('SELECT * FROM projects ORDER BY status, name');
      if (projects.length === 0) return res.json({ reply: "No projects found." });
      let reply = `**Projects (${projects.length}):**\n`;
      projects.forEach(p => {
        const budget = p.budget ? 'Rs.' + Number(p.budget).toLocaleString('en-IN') : '-';
        reply += `- **${p.name}** — ${p.status || 'Unknown'} | Client: ${p.client || '-'} | Location: ${p.location || '-'} | Budget: ${budget}\n`;
      });
      return res.json({ reply });
    }

    // ── PROJECT STATUS (Manager+) ──
    if (/project (.+?)( status| detail| progress| update)?$|status of (.+?) project|(.+?) project (status|detail|progress)/.test(q)) {
      if (isEmployee) return res.json({ reply: RESTRICTED });
      const match = q.match(/project (.+?)( status| detail| progress| update)?$/) || q.match(/status of (.+?) project/) || q.match(/(.+?) project (status|detail|progress)/);
      const name = match ? (match[1] || match[3] || match[4] || '').trim() : '';
      if (!name) return res.json({ reply: "Please specify a project name. Example: \"Project Porur status\"" });
      const [projects] = await pool.query('SELECT * FROM projects WHERE LOWER(name) LIKE ?', [`%${name}%`]);
      if (projects.length === 0) return res.json({ reply: `No project found matching "${name}".` });
      let reply = '';
      for (const p of projects) {
        const budget = p.budget ? 'Rs.' + Number(p.budget).toLocaleString('en-IN') : '-';
        reply += `**${p.name}**\n`;
        reply += `- Status: **${p.status || '-'}**\n`;
        reply += `- Client: ${p.client || '-'}\n`;
        reply += `- Location: ${p.location || p.site_location || '-'}\n`;
        reply += `- Budget: ${budget}\n`;
        reply += `- Start: ${p.start_date || '-'} | Target: ${p.target_date || '-'}\n`;
        if (p.project_lead) reply += `- Lead: ${p.project_lead}\n`;
        if (p.contractor_name) reply += `- Contractor: ${p.contractor_name}\n`;

        // Tasks summary
        const [tasks] = await pool.query(
          `SELECT COUNT(*) as total,
           SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
           SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
           SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending
           FROM project_tasks WHERE project_id = ?`, [p.id]
        );
        if (tasks[0].total > 0) {
          reply += `- Tasks: **${tasks[0].completed || 0}** completed, **${tasks[0].in_progress || 0}** in progress, **${tasks[0].pending || 0}** pending (${tasks[0].total} total)\n`;
        }

        // Team
        const [team] = await pool.query(
          'SELECT e.name FROM project_team pt JOIN employees e ON pt.emp_code = e.code WHERE pt.project_id = ?', [p.id]
        );
        if (team.length > 0) {
          reply += `- Team (${team.length}): ${team.map(t => t.name).join(', ')}\n`;
        }

        // Materials
        const [materials] = await pool.query(
          'SELECT name, total, used, remaining, unit FROM project_materials WHERE project_id = ?', [p.id]
        );
        if (materials.length > 0) {
          reply += `- Materials:\n`;
          materials.forEach(m => { reply += `  - ${m.name}: ${m.used}/${m.total} ${m.unit} used (${m.remaining} remaining)\n`; });
        }
        reply += '\n';
      }
      return res.json({ reply: reply.trim() });
    }

    // ── WHO IS WORKING ON [PROJECT]? (Manager+) ──
    if (/who.?s? (is )?(working on|assigned to|in) (.+?) project|team of (.+?) project|(.+?) project team/.test(q)) {
      if (isEmployee) return res.json({ reply: RESTRICTED });
      const match = q.match(/(?:working on|assigned to|in) (.+?) project/) || q.match(/team of (.+?) project/) || q.match(/(.+?) project team/);
      const name = match ? match[1].trim() : '';
      const [projects] = await pool.query('SELECT * FROM projects WHERE LOWER(name) LIKE ?', [`%${name}%`]);
      if (projects.length === 0) return res.json({ reply: `No project found matching "${name}".` });
      const p = projects[0];
      const [team] = await pool.query(
        'SELECT e.name, e.code, e.designation, e.dept FROM project_team pt JOIN employees e ON pt.emp_code = e.code WHERE pt.project_id = ?', [p.id]
      );
      if (team.length === 0) return res.json({ reply: `No team members assigned to **${p.name}**.` });
      let reply = `**${p.name} — Team (${team.length}):**\n`;
      team.forEach(t => { reply += `- **${t.name}** (${t.code}) — ${t.designation || '-'} | ${t.dept || '-'}\n`; });
      return res.json({ reply });
    }

    // ── COMPANY POLICY ──
    if (/policy|leave policy|casual leave policy|lop/.test(q)) {
      return res.json({ reply: `**Leave Policy:**\n- 12 Casual Leaves per year (1 per month with pay)\n- Each month: 1 paid casual leave\n- Additional leaves = **Loss of Pay (LOP)** — salary deducted\n- Leaves must be approved: HR accepts → MD approves\n- Cannot apply for past dates\n\n**Attendance:**\n- GPS check-in/checkout required\n- Multiple sessions per day allowed\n- Outside geofence check-in alerts MD/HR` });
    }

    // ── TODAY'S DATE/TIME ──
    if (/what.?s? (the )?(date|time|day)|today.?s date/.test(q)) {
      const now = new Date();
      return res.json({ reply: `Today is **${now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}** at ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}` });
    }

    // ── THANK YOU ──
    if (/thank|thanks|thx/.test(q)) {
      return res.json({ reply: "You're welcome! Let me know if you need anything else." });
    }

    // ── FALLBACK ──
    return res.json({ reply: `I'm not sure how to answer that. Try asking about:\n- Attendance ("Am I checked in?", "Who is absent?")\n- Leaves ("My leave balance", "Pending leave requests")\n- Salary ("My salary", "Salary of [name]")\n- Stock ("Low stock items", "Stock value")\n- Policy ("Leave policy")\n\nType **help** for all commands.` });

  } catch (err) {
    console.error('[CHATBOT] Error:', err);
    res.status(500).json({ reply: "Sorry, something went wrong. Please try again." });
  }
});

module.exports = router;
