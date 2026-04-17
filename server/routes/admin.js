const router = require('express').Router();
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// Complete feature catalogue — every toggleable module in the app.
// category groups them visually in the SuperAdmin UI.
const FEATURES = [
  { key: 'attendance',    label: 'Attendance & Check-in',  category: 'Core' },
  { key: 'leaves',        label: 'Leave Management',       category: 'Core' },
  { key: 'advances',      label: 'Advance Requests',       category: 'Finance' },
  { key: 'expenses',      label: 'Expense Claims',         category: 'Finance' },
  { key: 'salary',        label: 'Salary Statement',       category: 'Finance' },
  { key: 'tax',           label: 'Form 16 & Tax',          category: 'Finance' },
  { key: 'projects',      label: 'Project Progress',       category: 'Operations' },
  { key: 'tasks',         label: 'Task Management',        category: 'Operations' },
  { key: 'peb_stock',     label: 'PEB Stock / Inventory',  category: 'PEB' },
  { key: 'peb_purchase',  label: 'PEB Procurement',        category: 'PEB' },
  { key: 'recruitment',   label: 'Recruitment',            category: 'HR' },
  { key: 'kpi',           label: 'KPI & Performance',      category: 'HR' },
  { key: 'shifts',        label: 'Shift Management',       category: 'HR' },
  { key: 'exit',          label: 'Exit & Full & Final',    category: 'HR' },
  { key: 'compliance',    label: 'Compliance & Filings',   category: 'HR' },
  { key: 'documents',     label: 'Documents',              category: 'General' },
  { key: 'assets',        label: 'Asset Management',       category: 'General' },
  { key: 'events',        label: 'Events & Awards',        category: 'General' },
  { key: 'announcements', label: 'Announcements',          category: 'General' },
  { key: 'geofence',      label: 'Geofence Sites',         category: 'Admin' },
  { key: 'reports',       label: 'Reports & Analytics',    category: 'Admin' },
  { key: 'admin_panel',   label: 'Admin Panel (Roles)',    category: 'Admin' },
  { key: 'settings',      label: 'Settings',               category: 'Admin' }
];

// Middleware: require SuperAdmin
function requireSuperAdmin(req, res, next) {
  if (!req.user || !req.user.isSuperAdmin) {
    return res.status(403).json({ error: 'SuperAdmin access required' });
  }
  next();
}

// GET /api/admin/features — list all features (catalogue)
router.get('/features', verifyToken, requireSuperAdmin, (req, res) => {
  res.json(FEATURES);
});

// GET /api/admin/access/:empCode — get feature access for one employee
router.get('/access/:empCode', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT feature_key, is_enabled, access_level FROM feature_access WHERE emp_code = ?',
      [req.params.empCode]
    );
    // Build a map: { feature_key: { enabled, level } }
    const map = {};
    rows.forEach(r => { map[r.feature_key] = { enabled: !!r.is_enabled, level: r.access_level }; });
    res.json(map);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/access/:empCode — set feature access for one employee (bulk upsert)
// Body: { features: { attendance: { enabled: true, level: 'edit' }, ... } }
router.put('/access/:empCode', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const { features } = req.body;
    if (!features || typeof features !== 'object') return res.status(400).json({ error: 'features object required' });

    const empCode = req.params.empCode;
    // Validate employee exists
    const [emp] = await pool.query('SELECT code FROM employees WHERE code = ?', [empCode]);
    if (emp.length === 0) return res.status(404).json({ error: 'Employee not found' });

    // Upsert each feature
    const validKeys = FEATURES.map(f => f.key);
    const values = [];
    for (const [key, val] of Object.entries(features)) {
      if (!validKeys.includes(key)) continue;
      const enabled = val.enabled ? 1 : 0;
      const level = val.level === 'edit' ? 'edit' : 'read';
      values.push([empCode, key, enabled, level]);
    }
    if (values.length > 0) {
      await pool.query(
        `INSERT INTO feature_access (emp_code, feature_key, is_enabled, access_level)
         VALUES ? ON DUPLICATE KEY UPDATE is_enabled = VALUES(is_enabled), access_level = VALUES(access_level)`,
        [values]
      );
    }
    res.json({ success: true, updated: values.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/my-access — get the logged-in user's own feature access (for frontend gating)
// Returns the same map format as /access/:empCode, but for the current user.
// Non-superadmin can call this.
router.get('/my-access', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT feature_key, is_enabled, access_level FROM feature_access WHERE emp_code = ?',
      [req.user.empCode]
    );
    const map = {};
    rows.forEach(r => { map[r.feature_key] = { enabled: !!r.is_enabled, level: r.access_level }; });
    res.json({ access: map, isSuperAdmin: !!req.user.isSuperAdmin });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
