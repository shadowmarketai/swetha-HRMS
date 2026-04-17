const jwt = require('jsonwebtoken');

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set. Exiting.');
  process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
  console.error('WARNING: JWT_SECRET should be at least 32 characters for security.');
}
const SECRET = process.env.JWT_SECRET;
const EXPIRY = process.env.JWT_EXPIRY || '24h';

function generateToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRY });
}

function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(header.split(' ')[1], SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    // Manager has same backend access as HR
    const effectiveRole = req.user.role === 'Manager' && roles.includes('HR') ? 'HR' : req.user.role;
    if (!roles.includes(effectiveRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

// Allow access if user has one of the specified roles OR belongs to one of the specified departments
function requireRoleOrDept(roles, depts) {
  return async (req, res, next) => {
    if (!req.user) return res.status(403).json({ error: 'Insufficient permissions' });
    const effectiveRole = req.user.role === 'Manager' && roles.includes('HR') ? 'HR' : req.user.role;
    if (roles.includes(effectiveRole)) return next();
    // Check department
    if (depts && depts.length > 0) {
      try {
        const pool = require('../config/db');
        const [rows] = await pool.query('SELECT dept FROM employees WHERE code = ? AND is_active = 1', [req.user.empCode]);
        if (rows.length > 0 && depts.some(d => rows[0].dept && rows[0].dept.toLowerCase() === d.toLowerCase())) {
          return next();
        }
      } catch (e) { /* fall through to denied */ }
    }
    return res.status(403).json({ error: 'Insufficient permissions' });
  };
}

// Allow access if user has an explicit feature_access grant OR passes the role/dept check.
// featureKey: key in feature_access table; roles/depts: fallback role and dept checks.
function requireFeatureAccess(featureKey, roles, depts) {
  depts = depts || [];
  return async (req, res, next) => {
    if (!req.user) return res.status(403).json({ error: 'Insufficient permissions' });
    // 1. Check explicit feature_access grant from SuperAdmin
    try {
      const pool = require('../config/db');
      const [rows] = await pool.query(
        'SELECT is_enabled FROM feature_access WHERE emp_code = ? AND feature_key = ?',
        [req.user.empCode, featureKey]
      );
      if (rows.length > 0 && rows[0].is_enabled) return next();
    } catch (e) { /* fall through to role check */ }
    // 2. Fall back to role check
    const effectiveRole = req.user.role === 'Manager' && roles.includes('HR') ? 'HR' : req.user.role;
    if (roles.includes(effectiveRole)) return next();
    // 3. Fall back to dept check
    if (depts.length > 0) {
      try {
        const pool = require('../config/db');
        const [rows] = await pool.query('SELECT dept FROM employees WHERE code = ? AND is_active = 1', [req.user.empCode]);
        if (rows.length > 0 && depts.some(d => rows[0].dept && rows[0].dept.toLowerCase() === d.toLowerCase())) {
          return next();
        }
      } catch (e) { /* fall through */ }
    }
    return res.status(403).json({ error: 'Insufficient permissions' });
  };
}

module.exports = { generateToken, verifyToken, requireRole, requireRoleOrDept, requireFeatureAccess };
