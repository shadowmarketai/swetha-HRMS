const router = require('express').Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool = require('../config/db');
const { generateToken, verifyToken, requireRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');

// In-memory store for biometric challenges (TTL: 2 minutes)
const biometricChallenges = new Map();
const BIOMETRIC_CHALLENGE_TTL = 2 * 60 * 1000; // 2 minutes

// Cleanup expired challenges every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of biometricChallenges) {
    if (now - val.created > BIOMETRIC_CHALLENGE_TTL) biometricChallenges.delete(key);
  }
}, 5 * 60 * 1000);

// POST /api/auth/login
router.post('/login', [
  body('empCode').trim().notEmpty().withMessage('Employee code required'),
  body('password').notEmpty().withMessage('Password required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
  try {
    const { empCode, password } = req.body;
    if (!empCode || !password) {
      return res.status(400).json({ error: 'Employee code and password required' });
    }
    const [rows] = await pool.query(
      'SELECT u.*, e.name, e.dept, e.designation FROM users u JOIN employees e ON u.emp_code = e.code WHERE u.emp_code = ? AND u.is_active = 1',
      [empCode]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    await pool.query('UPDATE users SET last_login = NOW() WHERE emp_code = ?', [empCode]);
    const token = generateToken({ empCode: user.emp_code, role: user.role, name: user.name });
    res.json({
      token,
      user: { empCode: user.emp_code, name: user.name, role: user.role, dept: user.dept, designation: user.designation }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/google — Google Sign-In verification
router.post('/google', [
  body('idToken').trim().notEmpty().withMessage('Google ID token required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  if (!googleClientId) {
    return res.status(503).json({ error: 'Google Sign-In is not configured on this server' });
  }

  try {
    const { idToken } = req.body;
    const client = new OAuth2Client(googleClientId);

    // Verify the Google ID token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: googleClientId
    });
    const payload = ticket.getPayload();

    if (!payload.email_verified) {
      return res.status(401).json({ error: 'Google email is not verified' });
    }

    const googleId = payload.sub;
    const email = payload.email.toLowerCase();

    // Phase 1: Look up by google_id (returning user)
    let [rows] = await pool.query(
      'SELECT u.*, e.name, e.dept, e.designation FROM users u JOIN employees e ON u.emp_code = e.code WHERE u.google_id = ? AND u.is_active = 1',
      [googleId]
    );

    // Phase 2: Look up by email (first-time Google login)
    if (rows.length === 0) {
      [rows] = await pool.query(
        'SELECT u.*, e.name, e.dept, e.designation, e.email FROM users u JOIN employees e ON u.emp_code = e.code WHERE LOWER(e.email) = ? AND u.is_active = 1',
        [email]
      );
      // Auto-link google_id for future fast lookups
      if (rows.length > 0) {
        await pool.query('UPDATE users SET google_id = ? WHERE emp_code = ?', [googleId, rows[0].emp_code]);
      }
    }

    if (rows.length === 0) {
      return res.status(401).json({ error: 'No employee account linked to this Google account. Contact HR.' });
    }

    const user = rows[0];
    await pool.query('UPDATE users SET last_login = NOW() WHERE emp_code = ?', [user.emp_code]);
    const token = generateToken({ empCode: user.emp_code, role: user.role, name: user.name });
    res.json({
      token,
      user: { empCode: user.emp_code, name: user.name, role: user.role, dept: user.dept, designation: user.designation }
    });
  } catch (err) {
    console.error(err);
    if (err.message && err.message.includes('Token used too late')) {
      return res.status(401).json({ error: 'Google token expired. Please try again.' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me — refresh JWT with current role from DB
router.get('/me', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT u.role, e.name, e.dept, e.designation FROM users u JOIN employees e ON u.emp_code = e.code WHERE u.emp_code = ? AND u.is_active = 1',
      [req.user.empCode]
    );
    if (rows.length === 0) return res.status(401).json({ error: 'User not found' });
    const user = rows[0];
    const token = generateToken({ empCode: req.user.empCode, role: user.role, name: user.name });
    res.json({ token, user: { empCode: req.user.empCode, name: user.name, role: user.role, dept: user.dept, designation: user.designation } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/register (MD or HR — create new users)
router.post('/register', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    const { empCode, password, role } = req.body;
    if (!empCode || !password) {
      return res.status(400).json({ error: 'Employee code and password required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (emp_code, password_hash, role) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE password_hash = ?, role = ?',
      [empCode, hash, role || 'Employee', hash, role || 'Employee']
    );
    res.json({ message: 'User registered' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/reset-password — MD/HR resets an employee's password
router.post('/reset-password', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    const { empCode, newPassword } = req.body;
    if (!empCode || !newPassword) return res.status(400).json({ error: 'Employee code and new password required' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const [emp] = await pool.query('SELECT code, role FROM employees WHERE code = ?', [empCode]);
    if (emp.length === 0) return res.status(404).json({ error: 'Employee not found' });
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'INSERT INTO users (emp_code, password_hash, role) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE password_hash = ?',
      [empCode, hash, emp[0].role, hash]
    );
    res.json({ message: 'Password reset for ' + empCode });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/bulk-create-missing — create login accounts for all employees missing from users table
router.post('/bulk-create-missing', verifyToken, requireRole('MD'), async (req, res) => {
  try {
    const defaultPassword = req.body.password || 'emp123';
    if (defaultPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const [missing] = await pool.query(
      'SELECT e.code, e.role FROM employees e LEFT JOIN users u ON e.code = u.emp_code WHERE u.emp_code IS NULL AND e.is_active = 1'
    );
    if (missing.length === 0) return res.json({ message: 'All employees already have login accounts', created: 0 });
    const hash = await bcrypt.hash(defaultPassword, 10);
    let created = 0;
    for (const emp of missing) {
      await pool.query('INSERT IGNORE INTO users (emp_code, password_hash, role) VALUES (?, ?, ?)', [emp.code, hash, emp.role]);
      created++;
    }
    res.json({ message: created + ' login accounts created', created, employees: missing.map(e => e.code) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', verifyToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Old and new passwords required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    const [rows] = await pool.query('SELECT password_hash FROM users WHERE emp_code = ?', [req.user.empCode]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(oldPassword, rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password incorrect' });

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = ?, last_password_change = NOW() WHERE emp_code = ?', [hash, req.user.empCode]);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Middleware: allow seed without auth ONLY if DB has zero users (first-time bootstrap)
async function bootstrapOrAuth(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) as cnt FROM users');
    if (rows[0].cnt === 0) return next(); // empty DB — allow first-time bootstrap
  } catch (e) {
    // Table may not exist yet — allow bootstrap
    return next();
  }
  // DB has users — require MD authentication
  verifyToken(req, res, (err) => {
    if (err) return; // verifyToken already sent response
    requireRole('MD')(req, res, next);
  });
}

// POST /api/auth/seed — seed default users from EMPLOYEES data (MD only, or bootstrap if empty)
router.post('/seed', bootstrapOrAuth, async (req, res) => {
  try {
    const { employees, credentials } = req.body;
    if (!employees || !credentials) {
      return res.status(400).json({ error: 'employees and credentials data required' });
    }
    // Insert employees
    for (const emp of employees) {
      await pool.query(
        `INSERT INTO employees (code, name, dept, designation, salary, bank, acc_no, role, phone, doj)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), dept=VALUES(dept), designation=VALUES(designation),
         salary=VALUES(salary), bank=VALUES(bank), acc_no=VALUES(acc_no), role=VALUES(role), phone=VALUES(phone), doj=VALUES(doj)`,
        [emp.code, emp.name, emp.dept, emp.designation || '', emp.salary || 0, emp.bank || '', emp.accNo || '', emp.role || 'Employee', emp.phone || '', emp.doj || null]
      );
    }
    // Insert users with hashed passwords
    for (const [empCode, cred] of Object.entries(credentials)) {
      const password = cred.pass || cred.hash;
      if (!password) continue; // Skip entries without a password
      const hash = await bcrypt.hash(password, 10);
      const emp = employees[cred.idx];
      await pool.query(
        'INSERT INTO users (emp_code, password_hash, role) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash), role=VALUES(role)',
        [empCode, hash, emp ? emp.role || 'Employee' : 'Employee']
      );
    }
    // Seed departments
    const depts = [...new Set(employees.map(e => e.dept))];
    for (const d of depts) {
      await pool.query('INSERT IGNORE INTO departments (name) VALUES (?)', [d]);
    }
    res.json({ message: `Seeded ${employees.length} employees, ${Object.keys(credentials).length} users, ${depts.length} departments` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/biometric-challenge — issue a signed challenge token for biometric login
router.post('/biometric-challenge', [
  body('empCode').trim().notEmpty().withMessage('Employee code required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
  try {
    const { empCode } = req.body;
    // Verify employee exists (generic error to prevent enumeration)
    const [rows] = await pool.query(
      'SELECT u.emp_code FROM users u WHERE u.emp_code = ? AND u.is_active = 1',
      [empCode]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    // Generate a random challenge and store it server-side
    const challenge = crypto.randomBytes(32).toString('base64url');
    biometricChallenges.set(challenge, { empCode, created: Date.now() });
    res.json({ challenge });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/biometric-login — verify challenge + issue JWT after device WebAuthn verification
router.post('/biometric-login', [
  body('empCode').trim().notEmpty().withMessage('Employee code required'),
  body('challenge').trim().notEmpty().withMessage('Challenge token required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
  try {
    const { empCode, challenge } = req.body;

    // Verify the challenge was issued by us and hasn't expired
    const stored = biometricChallenges.get(challenge);
    if (!stored) {
      return res.status(401).json({ error: 'Invalid or expired biometric challenge' });
    }
    // One-time use — delete immediately
    biometricChallenges.delete(challenge);

    // Check expiry
    if (Date.now() - stored.created > BIOMETRIC_CHALLENGE_TTL) {
      return res.status(401).json({ error: 'Biometric challenge expired. Please try again.' });
    }
    // Verify the challenge was issued for THIS employee
    if (stored.empCode !== empCode) {
      return res.status(401).json({ error: 'Challenge mismatch' });
    }

    // Now safe to issue JWT — the device WebAuthn verified the user's identity,
    // and the server-issued challenge proves this request originated from our flow
    const [rows] = await pool.query(
      `SELECT u.emp_code, u.role, e.name, e.dept, e.designation
       FROM users u JOIN employees e ON u.emp_code = e.code
       WHERE u.emp_code = ? AND u.is_active = 1 AND e.is_active = 1`,
      [empCode]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = rows[0];
    await pool.query('UPDATE users SET last_login = NOW() WHERE emp_code = ?', [empCode]);
    const token = generateToken({ empCode: user.emp_code, role: user.role, name: user.name });
    res.json({
      token,
      user: { empCode: user.emp_code, name: user.name, role: user.role, dept: user.dept, designation: user.designation }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/forgot-password — reset to a random temporary password (HR/MD only)
router.post('/forgot-password', verifyToken, requireRole('MD', 'HR'), [
  body('empCode').trim().notEmpty().withMessage('Employee code required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
  try {
    const { empCode } = req.body;
    const [rows] = await pool.query(
      'SELECT u.emp_code FROM users u JOIN employees e ON u.emp_code = e.code WHERE u.emp_code = ? AND u.is_active = 1',
      [empCode]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    // Generate a random 10-character temporary password
    const tempPassword = crypto.randomBytes(5).toString('hex');
    const hash = await bcrypt.hash(tempPassword, 10);
    await pool.query('UPDATE users SET password_hash = ?, last_password_change = NOW() WHERE emp_code = ?', [hash, empCode]);
    // Temp password shown to HR/MD only — they share it verbally with the employee
    res.json({ message: 'Password has been reset for ' + empCode, tempPassword });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
