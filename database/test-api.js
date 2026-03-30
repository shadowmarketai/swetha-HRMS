/**
 * HRMS API End-to-End Test Script
 * Tests all 21 route groups. Run: node database/test-api.js
 */
const API = process.env.API_BASE || 'http://localhost:3000/api';
let TOKEN = '';
let passed = 0, failed = 0;
const results = [];

async function test(name, fn) {
  try {
    await fn();
    passed++;
    results.push({ name, status: 'PASS' });
    console.log(`  PASS  ${name}`);
  } catch (err) {
    failed++;
    results.push({ name, status: 'FAIL', error: err.message });
    console.log(`  FAIL  ${name} — ${err.message}`);
  }
}

async function api(method, path, body, token) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (token || TOKEN) opts.headers.Authorization = 'Bearer ' + (token || TOKEN);
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok && res.status >= 500) throw new Error(`${res.status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
  return { status: res.status, data, ok: res.ok };
}

async function run() {
  console.log('HRMS API Test Suite\n' + '='.repeat(50));
  console.log(`Target: ${API}\n`);

  // --- Health ---
  console.log('\n[Health]');
  await test('GET /health', async () => {
    const r = await api('GET', '/health');
    if (!r.data.status) throw new Error('No status field');
  });

  // --- Auth ---
  console.log('\n[Auth]');
  await test('POST /auth/login (MD001)', async () => {
    const r = await api('POST', '/auth/login', { empCode: 'MD001', password: 'admin123' });
    if (!r.ok) throw new Error('Login failed: ' + JSON.stringify(r.data));
    if (!r.data.token) throw new Error('No token');
    TOKEN = r.data.token;
  });

  await test('POST /auth/login (bad password)', async () => {
    const r = await api('POST', '/auth/login', { empCode: 'MD001', password: 'wrong' });
    if (r.status !== 401) throw new Error('Expected 401, got ' + r.status);
  });

  await test('POST /auth/login (HR SSC006)', async () => {
    const r = await api('POST', '/auth/login', { empCode: 'SSC006', password: 'hr123' });
    if (!r.ok) throw new Error('HR login failed');
  });

  await test('POST /auth/login (Employee SSC011)', async () => {
    const r = await api('POST', '/auth/login', { empCode: 'SSC011', password: 'emp123' });
    if (!r.ok) throw new Error('Employee login failed');
  });

  // --- Employees ---
  console.log('\n[Employees]');
  await test('GET /employees (list all)', async () => {
    const r = await api('GET', '/employees');
    if (!r.ok) throw new Error(JSON.stringify(r.data));
    if (!Array.isArray(r.data) || r.data.length < 46) throw new Error('Expected 46+ employees, got ' + (r.data?.length || 0));
  });

  await test('GET /employees/MD001', async () => {
    const r = await api('GET', '/employees/MD001');
    if (!r.ok) throw new Error(JSON.stringify(r.data));
    if (r.data.code !== 'MD001') throw new Error('Wrong employee returned');
  });

  await test('PUT /employees/SSC011 (update designation)', async () => {
    const r = await api('PUT', '/employees/SSC011', { designation: 'Senior Staff' });
    if (!r.ok) throw new Error(JSON.stringify(r.data));
  });

  // --- Leaves ---
  console.log('\n[Leaves]');
  await test('GET /leaves/balance (MD)', async () => {
    const r = await api('GET', '/leaves/balance');
    if (!r.ok) throw new Error(JSON.stringify(r.data));
    if (r.data.casual === undefined) throw new Error('No casual balance');
  });

  await test('GET /leaves/balance/SSC011', async () => {
    const r = await api('GET', '/leaves/balance/SSC011');
    if (!r.ok) throw new Error(JSON.stringify(r.data));
  });

  let leaveId;
  await test('POST /leaves (submit CL)', async () => {
    const r = await api('POST', '/leaves', { type: 'casual', from: '2026-04-01', to: '2026-04-01', reason: 'Test leave' });
    if (!r.ok) throw new Error(JSON.stringify(r.data));
    leaveId = r.data.id;
  });

  await test('GET /leaves (list)', async () => {
    const r = await api('GET', '/leaves');
    if (!r.ok) throw new Error(JSON.stringify(r.data));
    if (!Array.isArray(r.data)) throw new Error('Expected array');
  });

  if (leaveId) {
    await test('PATCH /leaves/:id/approve', async () => {
      const r = await api('PATCH', `/leaves/${leaveId}/approve`);
      if (!r.ok) throw new Error(JSON.stringify(r.data));
    });
  }

  // --- Advances ---
  console.log('\n[Advances]');
  let advanceId;
  await test('POST /advances', async () => {
    const r = await api('POST', '/advances', { type: 'salary', amount: 10000, reason: 'Test advance', urgency: 'low' });
    if (!r.ok) throw new Error(JSON.stringify(r.data));
    advanceId = r.data.id;
  });

  await test('GET /advances', async () => {
    const r = await api('GET', '/advances');
    if (!r.ok) throw new Error(JSON.stringify(r.data));
    if (!Array.isArray(r.data)) throw new Error('Expected array');
  });

  if (advanceId) {
    await test('PATCH /advances/:id/approve', async () => {
      const r = await api('PATCH', `/advances/${advanceId}/approve`);
      if (!r.ok) throw new Error(JSON.stringify(r.data));
    });
  }

  // --- Attendance ---
  console.log('\n[Attendance]');
  await test('POST /attendance/checkin', async () => {
    const r = await api('POST', '/attendance/checkin', { lat: 11.0168, lng: 76.9558 });
    // 409 = already checked in today (acceptable), 400 = already checked out (acceptable)
    if (!r.ok && r.status !== 409 && r.status !== 400) throw new Error(JSON.stringify(r.data));
  });

  await test('GET /attendance/today', async () => {
    const r = await api('GET', '/attendance/today');
    if (!r.ok) throw new Error(JSON.stringify(r.data));
  });

  await test('POST /attendance/checkout', async () => {
    const r = await api('POST', '/attendance/checkout', { lat: 11.0168, lng: 76.9558 });
    // may fail if already checked out — acceptable
    if (!r.ok && r.status !== 400) throw new Error(JSON.stringify(r.data));
  });

  await test('GET /attendance', async () => {
    const r = await api('GET', '/attendance');
    if (!r.ok) throw new Error(JSON.stringify(r.data));
  });

  // --- Tasks ---
  console.log('\n[Tasks]');
  let taskId;
  await test('POST /tasks', async () => {
    const r = await api('POST', '/tasks', { title: 'Test task', description: 'API test', type: 'one-time', assignedTo: 'SSC011', priority: 'medium' });
    if (!r.ok) throw new Error(JSON.stringify(r.data));
    taskId = r.data.id;
  });

  await test('GET /tasks', async () => {
    const r = await api('GET', '/tasks');
    if (!r.ok) throw new Error(JSON.stringify(r.data));
    if (!Array.isArray(r.data)) throw new Error('Expected array');
  });

  if (taskId) {
    await test('PATCH /tasks/:id/toggle', async () => {
      const r = await api('PATCH', `/tasks/${taskId}/toggle`);
      if (!r.ok) throw new Error(JSON.stringify(r.data));
    });

    await test('DELETE /tasks/:id', async () => {
      const r = await api('DELETE', `/tasks/${taskId}`);
      if (!r.ok) throw new Error(JSON.stringify(r.data));
    });
  }

  // --- KPI ---
  console.log('\n[KPI]');
  await test('GET /kpi (all scores)', async () => {
    const r = await api('GET', '/kpi');
    if (!r.ok) throw new Error(JSON.stringify(r.data));
  });

  await test('POST /kpi/self-rate', async () => {
    const r = await api('POST', '/kpi/self-rate', {
      period: '2026-Q1',
      ratings: [{ category: 'Productivity', rating: 4.5, comments: 'Test' }]
    });
    if (!r.ok) throw new Error(JSON.stringify(r.data));
  });

  await test('POST /kpi/scores', async () => {
    const r = await api('POST', '/kpi/scores', {
      empCode: 'SSC011', period: '2026-Q1',
      targets: [{ name: 'Output', targetValue: 100, actualValue: 90, score: 90, weight: 50 }]
    });
    if (!r.ok) throw new Error(JSON.stringify(r.data));
  });

  await test('GET /kpi/SSC011', async () => {
    const r = await api('GET', '/kpi/SSC011');
    if (!r.ok) throw new Error(JSON.stringify(r.data));
  });

  // --- Events ---
  console.log('\n[Events]');
  let eventId;
  await test('POST /events', async () => {
    const r = await api('POST', '/events', { title: 'Test Event', eventDate: '2026-04-15', eventType: 'meeting', location: 'Office' });
    if (!r.ok) throw new Error(JSON.stringify(r.data));
    eventId = r.data.id;
  });

  await test('GET /events', async () => {
    const r = await api('GET', '/events');
    if (!r.ok) throw new Error(JSON.stringify(r.data));
  });

  await test('POST /events/awards', async () => {
    const r = await api('POST', '/events/awards', { empCode: 'SSC011', title: 'Test Award', category: 'Performance' });
    if (!r.ok) throw new Error(JSON.stringify(r.data));
  });

  await test('POST /events/hot-seat', async () => {
    const r = await api('POST', '/events/hot-seat', { goals: ['Goal 1'], challenges: ['Challenge 1'], wins: ['Win 1'] });
    if (!r.ok) throw new Error(JSON.stringify(r.data));
  });

  await test('GET /events/hot-seat', async () => {
    const r = await api('GET', '/events/hot-seat');
    if (!r.ok) throw new Error(JSON.stringify(r.data));
  });

  if (eventId) {
    await test('DELETE /events/:id', async () => {
      const r = await api('DELETE', `/events/${eventId}`);
      if (!r.ok) throw new Error(JSON.stringify(r.data));
    });
  }

  // --- Notifications ---
  console.log('\n[Notifications]');
  let notifId;
  await test('POST /notifications', async () => {
    const r = await api('POST', '/notifications', { title: 'Test Notification', body: 'API test', category: 'general' });
    if (!r.ok) throw new Error(JSON.stringify(r.data));
    notifId = r.data.id;
  });

  await test('GET /notifications', async () => {
    const r = await api('GET', '/notifications');
    if (!r.ok) throw new Error(JSON.stringify(r.data));
    if (!Array.isArray(r.data)) throw new Error('Expected array');
  });

  if (notifId) {
    await test('PATCH /notifications/:id/read', async () => {
      const r = await api('PATCH', `/notifications/${notifId}/read`);
      if (!r.ok) throw new Error(JSON.stringify(r.data));
    });
  }

  await test('PATCH /notifications/read-all', async () => {
    const r = await api('PATCH', '/notifications/read-all');
    if (!r.ok) throw new Error(JSON.stringify(r.data));
  });

  await test('GET /notifications/prefs', async () => {
    const r = await api('GET', '/notifications/prefs');
    if (!r.ok) throw new Error(JSON.stringify(r.data));
  });

  await test('PUT /notifications/prefs', async () => {
    const r = await api('PUT', '/notifications/prefs', { salary: true, leave: true, advance: true, payroll: true });
    if (!r.ok) throw new Error(JSON.stringify(r.data));
  });

  // --- Salary ---
  console.log('\n[Salary]');
  await test('GET /salary (all)', async () => {
    const r = await api('GET', '/salary');
    if (!r.ok) throw new Error(JSON.stringify(r.data));
    if (!Array.isArray(r.data)) throw new Error('Expected array');
  });

  await test('GET /salary/MD001/2026-03', async () => {
    const r = await api('GET', '/salary/MD001/2026-03');
    if (!r.ok) throw new Error(JSON.stringify(r.data));
  });

  // --- Recruitment ---
  console.log('\n[Recruitment]');
  let jobId, candidateId;
  await test('POST /recruitment/jobs', async () => {
    const r = await api('POST', '/recruitment/jobs', {
      title: 'Test Welder', dept: 'Factory', location: 'Coimbatore',
      type: 'Full-time', experience: '2+ years', salaryRange: '25000-35000',
      description: 'Welding for PEB structures', requirements: 'Arc welding, MIG, TIG'
    });
    if (!r.ok) throw new Error(JSON.stringify(r.data));
    jobId = r.data.id;
  });

  await test('GET /recruitment/jobs', async () => {
    const r = await api('GET', '/recruitment/jobs');
    if (!r.ok) throw new Error(JSON.stringify(r.data));
  });

  if (jobId) {
    await test('POST /recruitment/candidates', async () => {
      const r = await api('POST', '/recruitment/candidates', {
        name: 'Ravi Kumar', email: 'ravi@test.com', phone: '9876543210',
        jobId: jobId, rating: 3.5, notes: 'Experienced welder, 4 years in steel fabrication'
      });
      if (!r.ok) throw new Error(JSON.stringify(r.data));
      candidateId = r.data.id;
    });
  }

  await test('GET /recruitment/candidates', async () => {
    const r = await api('GET', '/recruitment/candidates');
    if (!r.ok) throw new Error(JSON.stringify(r.data));
  });

  if (candidateId) {
    await test('PATCH /recruitment/candidates/:id/move', async () => {
      const r = await api('PATCH', `/recruitment/candidates/${candidateId}/move`, { stage: 'Screening' });
      if (!r.ok) throw new Error(JSON.stringify(r.data));
    });
  }

  // --- Documents ---
  console.log('\n[Documents]');
  await test('GET /documents/MD001', async () => {
    const r = await api('GET', '/documents/MD001');
    if (!r.ok) throw new Error(JSON.stringify(r.data));
  });

  await test('POST /documents/generate', async () => {
    const r = await api('POST', '/documents/generate', { empCode: 'SSC011', docType: 'Offer Letter', docName: 'test_offer.pdf' });
    if (!r.ok) throw new Error(JSON.stringify(r.data));
  });

  // --- Reports ---
  console.log('\n[Reports]');
  await test('GET /reports/employees (CSV)', async () => {
    const r = await api('GET', '/reports/employees');
    if (!r.ok) throw new Error('Report failed');
  });

  await test('GET /reports/salary (CSV)', async () => {
    const r = await api('GET', '/reports/salary');
    if (!r.ok) throw new Error('Report failed');
  });

  // --- Settings ---
  console.log('\n[Settings]');
  await test('GET /settings', async () => {
    const r = await api('GET', '/settings');
    if (!r.ok) throw new Error(JSON.stringify(r.data));
  });

  await test('PUT /settings', async () => {
    const r = await api('PUT', '/settings', { theme: 'dark', language: 'en' });
    if (!r.ok) throw new Error(JSON.stringify(r.data));
  });

  await test('GET /settings (verify)', async () => {
    const r = await api('GET', '/settings');
    if (!r.ok) throw new Error(JSON.stringify(r.data));
    if (r.data.theme !== 'dark') throw new Error('Settings not persisted');
  });

  // --- Shifts ---
  console.log('\n[Shifts]');
  await test('GET /shifts', async () => {
    const r = await api('GET', '/shifts');
    if (!r.ok) throw new Error(JSON.stringify(r.data));
  });

  await test('PUT /shifts/SSM001 (assign)', async () => {
    const r = await api('PUT', '/shifts/SSM001', { shift_code: 'SHIFT_B' });
    if (!r.ok) throw new Error(JSON.stringify(r.data));
  });

  await test('GET /shifts (verify)', async () => {
    const r = await api('GET', '/shifts');
    if (!r.ok) throw new Error(JSON.stringify(r.data));
    if (!Array.isArray(r.data)) throw new Error('Expected array');
  });

  // --- Expenses ---
  console.log('\n[Expenses]');
  let expenseId;
  await test('POST /expenses (submit)', async () => {
    const r = await api('POST', '/expenses', { category: 'Travel', amount: 5000, description: 'Site visit cab', date: '2026-03-10', receipt_ref: 'REC-001' });
    if (!r.ok) throw new Error(JSON.stringify(r.data));
    expenseId = r.data.id;
  });

  await test('GET /expenses', async () => {
    const r = await api('GET', '/expenses');
    if (!r.ok) throw new Error(JSON.stringify(r.data));
    if (!Array.isArray(r.data)) throw new Error('Expected array');
  });

  await test('PUT /expenses/:id/approve', async () => {
    if (!expenseId) throw new Error('No expense to approve');
    const r = await api('PUT', `/expenses/${expenseId}/approve`);
    if (!r.ok) throw new Error(JSON.stringify(r.data));
  });

  // --- Tax ---
  console.log('\n[Tax]');
  await test('POST /tax (submit declaration)', async () => {
    const r = await api('POST', '/tax', { fy: '2025-2026', sec80c: 100000, sec80d: 25000, hra_claimed: 60000, other_income: 0 });
    if (!r.ok) throw new Error(JSON.stringify(r.data));
  });

  await test('GET /tax', async () => {
    const r = await api('GET', '/tax');
    if (!r.ok) throw new Error(JSON.stringify(r.data));
  });

  // --- Compliance ---
  console.log('\n[Compliance]');
  let filingId;
  await test('POST /compliance/filings', async () => {
    const r = await api('POST', '/compliance/filings', { type: 'PF', period: '2026-03', due_date: '2026-04-15', description: 'PF March 2026' });
    if (!r.ok) throw new Error(JSON.stringify(r.data));
    filingId = r.data.id;
  });

  await test('GET /compliance/filings', async () => {
    const r = await api('GET', '/compliance/filings');
    if (!r.ok) throw new Error(JSON.stringify(r.data));
    if (!Array.isArray(r.data)) throw new Error('Expected array');
  });

  await test('PUT /compliance/filings/:id/mark-filed', async () => {
    if (!filingId) throw new Error('No filing to mark');
    const r = await api('PUT', `/compliance/filings/${filingId}/mark-filed`);
    if (!r.ok) throw new Error(JSON.stringify(r.data));
  });

  await test('POST /compliance/contract-workers', async () => {
    const r = await api('POST', '/compliance/contract-workers', { name: 'Test Worker', contractor: 'ABC Contractors', role: 'Helper', daily_wage: 800, start_date: '2026-03-01' });
    if (!r.ok) throw new Error(JSON.stringify(r.data));
  });

  await test('GET /compliance/contract-workers', async () => {
    const r = await api('GET', '/compliance/contract-workers');
    if (!r.ok) throw new Error(JSON.stringify(r.data));
    if (!Array.isArray(r.data)) throw new Error('Expected array');
  });

  // --- Assets ---
  console.log('\n[Assets]');
  let assetId;
  await test('POST /assets (add)', async () => {
    const r = await api('POST', '/assets', { name: 'Dell Latitude 5520', type: 'Laptop', serial_number: 'DL-2026-001', purchase_date: '2026-01-15', purchase_cost: 65000, condition: 'New' });
    if (!r.ok) throw new Error(JSON.stringify(r.data));
    assetId = r.data.id;
  });

  await test('GET /assets', async () => {
    const r = await api('GET', '/assets');
    if (!r.ok) throw new Error(JSON.stringify(r.data));
    if (!Array.isArray(r.data)) throw new Error('Expected array');
  });

  await test('PUT /assets/:id/assign', async () => {
    if (!assetId) throw new Error('No asset to assign');
    const r = await api('PUT', `/assets/${assetId}/assign`, { emp_code: 'SSC002' });
    if (!r.ok) throw new Error(JSON.stringify(r.data));
  });

  await test('PUT /assets/:id/return', async () => {
    if (!assetId) throw new Error('No asset to return');
    const r = await api('PUT', `/assets/${assetId}/return`);
    if (!r.ok) throw new Error(JSON.stringify(r.data));
  });

  // --- Exit ---
  console.log('\n[Exit]');
  let exitId;
  await test('POST /exit (submit resignation)', async () => {
    const r = await api('POST', '/exit', { reason: 'Better Opportunity', remarks: 'Test resignation', preferred_lwd: '2026-06-12' });
    if (!r.ok) throw new Error(JSON.stringify(r.data));
    exitId = r.data.id;
  });

  await test('GET /exit', async () => {
    const r = await api('GET', '/exit');
    if (!r.ok) throw new Error(JSON.stringify(r.data));
    if (!Array.isArray(r.data)) throw new Error('Expected array');
  });

  await test('PUT /exit/:id/approve', async () => {
    if (!exitId) throw new Error('No exit to approve');
    const r = await api('PUT', `/exit/${exitId}/approve`);
    if (!r.ok) throw new Error(JSON.stringify(r.data));
  });

  await test('PUT /exit/:id/clearance', async () => {
    if (!exitId) throw new Error('No exit for clearance');
    const r = await api('PUT', `/exit/${exitId}/clearance`, {
      clearance: { 'IT & Systems': true, 'Finance': true, 'HR': true, 'Admin': true, 'Reporting Manager': true, 'Security': true }
    });
    if (!r.ok) throw new Error(JSON.stringify(r.data));
  });

  await test('PUT /exit/:id/complete', async () => {
    if (!exitId) throw new Error('No exit to complete');
    const r = await api('PUT', `/exit/${exitId}/complete`, { fnf_amount: 350000, fnf_details: { basic: 200000, gratuity: 150000 } });
    if (!r.ok) throw new Error(JSON.stringify(r.data));
  });

  // --- Announcements ---
  console.log('\n[Announcements]');
  let announceId;
  await test('POST /announcements (create)', async () => {
    const r = await api('POST', '/announcements', { title: 'Test Announcement', content: 'This is a test announcement', category: 'General', priority: 'Normal' });
    if (!r.ok) throw new Error(JSON.stringify(r.data));
    announceId = r.data.id;
  });

  await test('GET /announcements', async () => {
    const r = await api('GET', '/announcements');
    if (!r.ok) throw new Error(JSON.stringify(r.data));
    if (!Array.isArray(r.data)) throw new Error('Expected array');
  });

  await test('POST /announcements/:id/read', async () => {
    if (!announceId) throw new Error('No announcement to mark');
    const r = await api('POST', `/announcements/${announceId}/read`);
    if (!r.ok) throw new Error(JSON.stringify(r.data));
  });

  await test('DELETE /announcements/:id', async () => {
    if (!announceId) throw new Error('No announcement to delete');
    const r = await api('DELETE', `/announcements/${announceId}`);
    if (!r.ok) throw new Error(JSON.stringify(r.data));
  });

  // --- Summary ---
  console.log('\n' + '='.repeat(50));
  console.log(`Results: ${passed} PASS / ${failed} FAIL / ${passed + failed} total`);
  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter(r => r.status === 'FAIL').forEach(r => console.log(`  - ${r.name}: ${r.error}`));
  }
  console.log('');
}

run().catch(err => {
  console.error('Test runner error:', err.message);
  process.exit(1);
});
