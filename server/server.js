const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const IS_TEST = process.env.NODE_ENV === 'test' || process.env.PLAYWRIGHT === '1';

// Trust reverse proxy (Traefik/Nginx) for rate limiting + IP detection
app.set('trust proxy', 1);

// Security headers with CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net", "https://accounts.google.com", "https://apis.google.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://accounts.google.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://*.googleusercontent.com"],
      connectSrc: ["'self'", "https://accounts.google.com", "https://www.googleapis.com", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
      workerSrc: ["'self'"],
      frameSrc: ["https://accounts.google.com"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: null
    }
  },
  crossOriginEmbedderPolicy: false,
  strictTransportSecurity: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS whitelist
app.use(cors({
  origin: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:3000'],
  credentials: true
}));


// Rate limiting on login. Password guessing is limited per account (10 tries
// per 15 min for one employee code from one IP). The IP-wide cap is sized for
// the whole office signing in on the shared Wi-Fi each morning — at 50 per IP
// the 51st employee at 9:00 was locked out for 15 minutes.
const loginAccountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: IS_TEST ? 10000 : 10,
  message: { error: 'Too many login attempts for this employee code. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only failed attempts count against the account
  keyGenerator: (req) => {
    const code = String((req.body && req.body.empCode) || '').replace(/\s+/g, '').toUpperCase().slice(0, 30);
    return 'login:' + code + ':' + rateLimit.ipKeyGenerator(req.ip);
  }
});
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: IS_TEST ? 10000 : 400,
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});
// Parse the body here so the per-account limiter can read the employee code
app.use('/api/auth/login', express.json({ limit: '10kb' }), loginLimiter, loginAccountLimiter);

// Rate limiting on password change (3 attempts per 15 min)
const passwordChangeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: IS_TEST ? 10000 : 3,
  message: { error: 'Too many password change attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/auth/change-password', passwordChangeLimiter);

// Rate limiting on forgot-password (3 attempts per 15 min)
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: IS_TEST ? 10000 : 3,
  message: { error: 'Too many password reset attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/auth/forgot-password', forgotPasswordLimiter);

// Rate limiting on biometric endpoints (5 attempts per 15 min)
const biometricLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: IS_TEST ? 10000 : 5,
  message: { error: 'Too many biometric login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/auth/biometric-challenge', biometricLimiter);
app.use('/api/auth/biometric-login', biometricLimiter);

// The general limits count per signed-in employee, not per IP. The whole
// office shares one Wi-Fi IP, so at 9:00 a few dozen people opening the app
// (about 23 requests each) and punching used up one shared allowance and got
// "Too many requests" — sometimes on the geofence-site list, which then made
// everyone look "outside geofence". Unsigned or invalid requests still count
// per IP. The token is verified, so a forged one cannot dodge the limit.
const jwtForLimits = require('jsonwebtoken');
const { ipKeyGenerator } = rateLimit;
function limitKey(req) {
  const h = req.headers.authorization || '';
  if (h.startsWith('Bearer ') && process.env.JWT_SECRET) {
    try {
      const d = jwtForLimits.verify(h.slice(7), process.env.JWT_SECRET);
      if (d && d.empCode) return 'emp:' + String(d.empCode).toUpperCase();
    } catch (e) { /* fall through to IP */ }
  }
  return 'ip:' + (ipKeyGenerator ? ipKeyGenerator(req.ip) : req.ip);
}

// General read rate limiter (100 req/min on GET)
const readLimiter = rateLimit({
  keyGenerator: limitKey,
  windowMs: 60 * 1000,
  max: IS_TEST ? 10000 : 100,
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method !== 'GET'
});
app.use('/api/', readLimiter);

// General mutation rate limiter (30 req/min on POST/PUT/PATCH/DELETE)
const mutationLimiter = rateLimit({
  keyGenerator: limitKey,
  windowMs: 60 * 1000,
  max: IS_TEST ? 10000 : 30,
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  // Login has its own limiters above; counting it here too meant 30 sign-ins
  // a minute from the office IP and everyone after got "Too many requests".
  skip: (req) => req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS' || req.path === '/auth/login'
});
app.use('/api/', mutationLimiter);

// Request logging — redact JWT tokens from access logs
app.use(morgan('combined', {
  stream: {
    write: (message) => {
      process.stdout.write(message.replace(/Bearer [A-Za-z0-9\-_\.]+/g, 'Bearer [REDACTED]'));
    }
  }
}));

// Body parsing — 100kb default sufficient for all form data
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files (frontend)
const STATIC_DIR = process.env.STATIC_DIR || path.join(__dirname, '..');
console.log('Serving static files from:', STATIC_DIR);
app.use(express.static(STATIC_DIR));

// Serve uploads — authenticated (header OR query param token), inline images, prevent path traversal
const { verifyToken: verifyUploadToken } = require('./middleware/auth');
const jwtLib = require('jsonwebtoken');
app.use('/uploads', (req, res, next) => {
  // Accept JWT from Authorization header OR ?token= query param
  if (!req.headers.authorization && req.query.token) {
    req.headers.authorization = 'Bearer ' + req.query.token;
  }
  verifyUploadToken(req, res, next);
}, (req, res) => {
  const requestedFile = path.basename(req.path);
  const uploadsDir = path.resolve(path.join(__dirname, 'uploads'));
  const filePath = path.resolve(path.join(uploadsDir, requestedFile));
  // Prevent path traversal
  if (!filePath.startsWith(uploadsDir)) {
    return res.status(400).json({ error: 'Invalid path' });
  }
  // Serve images inline, everything else as download
  const ext = path.extname(requestedFile).toLowerCase();
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
  if (imageExts.includes(ext)) {
    res.setHeader('Content-Disposition', 'inline');
  } else {
    res.setHeader('Content-Disposition', 'attachment');
  }
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.sendFile(filePath, (err) => {
    if (err && !res.headersSent) res.status(404).json({ error: 'File not found' });
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/kpi', require('./routes/kpi'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/advances', require('./routes/advances'));
app.use('/api/recruitment', require('./routes/recruitment'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/events', require('./routes/events'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/leaves', require('./routes/leaves'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/salary', require('./routes/salary'));
app.use('/api/shifts', require('./routes/shifts'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/tax', require('./routes/tax'));
app.use('/api/compliance', require('./routes/compliance'));
app.use('/api/assets', require('./routes/assets'));
app.use('/api/exit', require('./routes/exit'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/holidays', require('./routes/holidays'));
app.use('/api/geofence', require('./routes/geofence'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/sitetrack', require('./routes/sitetrack'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/peb/store', require('./routes/peb-store'));
app.use('/api/peb/purchase', require('./routes/peb-purchase'));
app.use('/api/edit-requests', require('./routes/edit-requests'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/admin', require('./routes/admin'));
// Health check — always responds 200 quickly so Traefik keeps routing during slow DB migrations.
// DB status is reported in the payload for observability but never fails the check.
app.get('/api/health', async (req, res) => {
  const health = { status: 'ok', timestamp: new Date().toISOString(), db: 'unknown', uptime: process.uptime() };
  try {
    const pool = require('./config/db');
    // Race the DB ping against a 2s timeout so the check never hangs
    const ping = pool.query('SELECT 1');
    const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('db timeout')), 2000));
    await Promise.race([ping, timeout]);
    health.db = 'ok';
  } catch (e) {
    health.db = 'unreachable';
  }
  res.status(200).json(health);
});

// 404 for missing uploads — don't serve index.html for file requests
app.use('/uploads', (req, res) => {
  res.status(404).json({ error: 'File not found' });
});

// Fallback to frontend (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(STATIC_DIR, 'index.html'));
});

// Run DB migrations on startup
(async function runMigrations() {
  try {
    const pool = require('./config/db');
    // Add hr_accepted to leave_applications status ENUM
    // Must include 'cancelled' (used by leave cancellation) — leaving it out
    // removed it on every restart and made cancelling a leave fail.
    await pool.query("ALTER TABLE leave_applications MODIFY COLUMN status ENUM('pending','hr_accepted','approved','rejected','cancelled') DEFAULT 'pending'").catch(() => {});
    // Add HR_Accepted to advance_requests status ENUM. Must list every status in
    // use: an older shorter list here dropped Paid/Accounts_Accepted on each
    // restart, depending on which startup step ran last.
    await pool.query("ALTER TABLE advance_requests MODIFY COLUMN status ENUM('Pending','Accounts_Accepted','HR_Accepted','Approved','Paid','Rejected') DEFAULT 'Pending'").catch(() => {});

    // Phase 0: Employee extended columns (may not exist from initial schema)
    await pool.query("ALTER TABLE employees ADD COLUMN dob DATE").catch(() => {});
    await pool.query("ALTER TABLE employees ADD COLUMN present_address TEXT").catch(() => {});
    await pool.query("ALTER TABLE employees ADD COLUMN permanent_address TEXT").catch(() => {});
    await pool.query("ALTER TABLE employees ADD COLUMN father_name VARCHAR(100)").catch(() => {});
    await pool.query("ALTER TABLE employees ADD COLUMN father_mobile VARCHAR(20)").catch(() => {});
    await pool.query("ALTER TABLE employees ADD COLUMN mother_name VARCHAR(100)").catch(() => {});
    await pool.query("ALTER TABLE employees ADD COLUMN mother_mobile VARCHAR(20)").catch(() => {});
    await pool.query("ALTER TABLE employees ADD COLUMN spouse_name VARCHAR(100)").catch(() => {});
    await pool.query("ALTER TABLE employees ADD COLUMN spouse_mobile VARCHAR(20)").catch(() => {});
    await pool.query("ALTER TABLE employees ADD COLUMN blood_group VARCHAR(5)").catch(() => {});
    await pool.query("ALTER TABLE employees ADD COLUMN pan VARCHAR(20)").catch(() => {});
    await pool.query("ALTER TABLE employees ADD COLUMN aadhaar VARCHAR(20)").catch(() => {});
    await pool.query("ALTER TABLE employees ADD COLUMN uan VARCHAR(30)").catch(() => {});
    await pool.query("ALTER TABLE employees ADD COLUMN aadhaar_photo_url VARCHAR(255)").catch(() => {});
    await pool.query("ALTER TABLE employees ADD COLUMN pan_photo_url VARCHAR(255)").catch(() => {});
    await pool.query("ALTER TABLE employees ADD COLUMN qualification VARCHAR(200)").catch(() => {});
    await pool.query("ALTER TABLE employees ADD COLUMN institution VARCHAR(200)").catch(() => {});
    await pool.query("ALTER TABLE employees ADD COLUMN year_of_passing VARCHAR(10)").catch(() => {});
    await pool.query("ALTER TABLE employees ADD COLUMN previous_employer VARCHAR(200)").catch(() => {});
    await pool.query("ALTER TABLE employees ADD COLUMN previous_role VARCHAR(100)").catch(() => {});
    await pool.query("ALTER TABLE employees ADD COLUMN years_of_experience DECIMAL(4,1)").catch(() => {});
    await pool.query("ALTER TABLE employees ADD COLUMN marital_status VARCHAR(20)").catch(() => {});
    await pool.query("ALTER TABLE employees ADD COLUMN ifsc_code VARCHAR(20)").catch(() => {});
    await pool.query("ALTER TABLE employees ADD COLUMN bank_branch VARCHAR(100)").catch(() => {});
    await pool.query("ALTER TABLE employees ADD COLUMN profile_sections_locked JSON DEFAULT (JSON_OBJECT())").catch(() => {});

    // Document edit requests table
    await pool.query(`CREATE TABLE IF NOT EXISTS document_edit_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      emp_code VARCHAR(20) NOT NULL,
      section ENUM('profile_details','educational_certs','bank_passbook','bank_details','experience_certs') NOT NULL,
      reason TEXT,
      status ENUM('pending','approved','rejected','used') DEFAULT 'pending',
      requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      reviewed_by VARCHAR(20),
      reviewed_at DATETIME,
      review_note TEXT,
      FOREIGN KEY (emp_code) REFERENCES employees(code) ON DELETE CASCADE,
      INDEX idx_doc_edit_emp (emp_code),
      INDEX idx_doc_edit_status (status)
    )`).catch(() => {});

    // Phase A: Attendance logs — add geofence columns
    await pool.query("ALTER TABLE attendance_logs ADD COLUMN location_name VARCHAR(200)").catch(() => {});
    await pool.query("ALTER TABLE attendance_logs ADD COLUMN remark TEXT").catch(() => {});
    await pool.query("ALTER TABLE attendance_logs ADD COLUMN is_within_geofence TINYINT(1) DEFAULT 1").catch(() => {});
    await pool.query("ALTER TABLE attendance_logs ADD COLUMN accuracy DECIMAL(10,2)").catch(() => {});

    // Phase B: Geofence sites table
    await pool.query(`CREATE TABLE IF NOT EXISTS geofence_sites (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      lat DECIMAL(10,7) NOT NULL,
      lng DECIMAL(10,7) NOT NULL,
      radius INT NOT NULL DEFAULT 200,
      is_active TINYINT(1) DEFAULT 1,
      created_by VARCHAR(20),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`).catch(() => {});
    // Seed default sites if empty
    const [geoCount] = await pool.query('SELECT COUNT(*) as cnt FROM geofence_sites').catch(() => [[]]);
    if (geoCount && geoCount[0] && geoCount[0].cnt === 0) {
      await pool.query(`INSERT INTO geofence_sites (name, lat, lng, radius) VALUES
        ('Head Office - Saravanampatti', 11.0850000, 76.9960000, 200),
        ('Factory - Sulur', 11.0378000, 77.1260000, 300),
        ('Site - Porur', 11.0320000, 76.9800000, 250),
        ('PEB Unit - Kinathukadavu', 10.8100000, 76.9700000, 250)`).catch(() => {});
    }

    // Phase D: Project tables
    await pool.query(`CREATE TABLE IF NOT EXISTS projects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      client VARCHAR(200),
      location VARCHAR(200),
      budget DECIMAL(14,2) DEFAULT 0,
      status VARCHAR(50) DEFAULT 'Not Started',
      start_date DATE,
      target_date DATE,
      created_by VARCHAR(20),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`).catch(() => {});
    await pool.query(`CREATE TABLE IF NOT EXISTS project_tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      priority VARCHAR(20) DEFAULT 'Medium',
      assigned_to VARCHAR(20),
      status VARCHAR(30) DEFAULT 'Pending',
      due_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )`).catch(() => {});
    await pool.query(`CREATE TABLE IF NOT EXISTS project_team (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      emp_code VARCHAR(20) NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      UNIQUE KEY unique_project_member (project_id, emp_code)
    )`).catch(() => {});
    await pool.query(`CREATE TABLE IF NOT EXISTS project_materials (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      name VARCHAR(200) NOT NULL DEFAULT '',
      unit VARCHAR(50) DEFAULT '',
      total DECIMAL(12,2) DEFAULT 0,
      used DECIMAL(12,2) DEFAULT 0,
      remaining DECIMAL(12,2) DEFAULT 0,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )`).catch(() => {});

    // Phase E0: Expense bill attachment column
    await pool.query("ALTER TABLE expense_reimbursements ADD COLUMN bill_url VARCHAR(500)").catch(() => {});

    // Phase E: Expense reimbursements — add expense_type + travel fields + dual approval
    await pool.query("ALTER TABLE expense_reimbursements ADD COLUMN expense_type VARCHAR(30) DEFAULT NULL").catch(() => {});
    await pool.query("ALTER TABLE expense_reimbursements ADD COLUMN project VARCHAR(200) DEFAULT NULL").catch(() => {});
    await pool.query("ALTER TABLE expense_reimbursements ADD COLUMN travel_from VARCHAR(200) DEFAULT NULL").catch(() => {});
    await pool.query("ALTER TABLE expense_reimbursements ADD COLUMN travel_to VARCHAR(200) DEFAULT NULL").catch(() => {});
    await pool.query("ALTER TABLE expense_reimbursements ADD COLUMN vehicle VARCHAR(100) DEFAULT NULL").catch(() => {});
    await pool.query("ALTER TABLE expense_reimbursements ADD COLUMN travel_km INT DEFAULT NULL").catch(() => {});
    await pool.query("ALTER TABLE expense_reimbursements ADD COLUMN travel_days INT DEFAULT NULL").catch(() => {});
    await pool.query("ALTER TABLE expense_reimbursements ADD COLUMN expense_date DATE DEFAULT NULL").catch(() => {});
    // Full status list — see the advance_requests note above
    await pool.query("ALTER TABLE expense_reimbursements MODIFY COLUMN status ENUM('Pending','accounts_accepted','hr_accepted','Approved','Paid','Rejected') DEFAULT 'Pending'").catch(() => {});

    // Phase F: SiteTrack tables
    await pool.query("ALTER TABLE projects ADD COLUMN contractor_name VARCHAR(255) DEFAULT 'Swetha Structures Pvt Ltd'").catch(() => {});
    await pool.query("ALTER TABLE projects ADD COLUMN site_location VARCHAR(500)").catch(() => {});
    await pool.query("ALTER TABLE projects ADD COLUMN project_lead VARCHAR(100)").catch(() => {});

    await pool.query(`CREATE TABLE IF NOT EXISTS wbs_tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      wbs_code VARCHAR(50) NOT NULL,
      \`level\` INT DEFAULT 1,
      task_name VARCHAR(2000) NOT NULL,
      \`lead\` VARCHAR(255),
      predecessor VARCHAR(50),
      start_date DATE, end_date DATE,
      actual_start DATE, actual_end DATE,
      planned_days INT, work_days INT,
      progress_pct FLOAT DEFAULT 0,
      status ENUM('pending','in_progress','completed') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      INDEX ix_wbs_proj_code (project_id, wbs_code)
    )`).catch(function(e) { console.error('wbs_tasks migration error:', e.message); });

    // Widen task_name for long BOQ category descriptions
    await pool.query("ALTER TABLE wbs_tasks MODIFY COLUMN task_name VARCHAR(2000) NOT NULL").catch(() => {});

    await pool.query(`CREATE TABLE IF NOT EXISTS boq_sheets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      sheet_type VARCHAR(30) NOT NULL,
      title VARCHAR(500) NOT NULL,
      area_sqft FLOAT, quoted_rate_per_sqft FLOAT,
      total_planned_amount FLOAT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      INDEX ix_boq_proj (project_id)
    )`).catch(() => {});

    await pool.query(`CREATE TABLE IF NOT EXISTS boq_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      boq_sheet_id INT NOT NULL,
      project_id INT NOT NULL,
      item_no VARCHAR(50), is_category TINYINT(1) DEFAULT 0,
      description VARCHAR(2000), unit VARCHAR(50),
      planned_qty FLOAT DEFAULT 0, rate FLOAT DEFAULT 0,
      planned_amount FLOAT DEFAULT 0,
      actual_qty_used FLOAT DEFAULT 0,
      is_pending TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (boq_sheet_id) REFERENCES boq_sheets(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      INDEX ix_boqi_sheet (boq_sheet_id), INDEX ix_boqi_proj (project_id)
    )`).catch(() => {});

    await pool.query(`CREATE TABLE IF NOT EXISTS usage_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      boq_item_id INT NOT NULL,
      project_id INT NOT NULL,
      qty_used FLOAT NOT NULL,
      note VARCHAR(1000),
      logged_by VARCHAR(20),
      logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (boq_item_id) REFERENCES boq_items(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      INDEX ix_usage_item (boq_item_id)
    )`).catch(() => {});

    await pool.query(`CREATE TABLE IF NOT EXISTS daily_work_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      task_id INT,
      log_date DATE NOT NULL,
      logged_by VARCHAR(100) NOT NULL,
      workers_count INT, weather VARCHAR(50),
      work_description TEXT NOT NULL,
      materials_note TEXT, progress_update FLOAT, remarks TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      INDEX ix_dl_proj_date (project_id, log_date)
    )`).catch(function(e) { console.error('daily_work_logs migration error:', e.message); });

    // Phase F2: Form 12B columns on tax_declarations
    await pool.query("ALTER TABLE tax_declarations ADD COLUMN prev_employer VARCHAR(200)").catch(() => {});
    await pool.query("ALTER TABLE tax_declarations ADD COLUMN prev_from DATE").catch(() => {});
    await pool.query("ALTER TABLE tax_declarations ADD COLUMN prev_to DATE").catch(() => {});
    await pool.query("ALTER TABLE tax_declarations ADD COLUMN prev_gross DECIMAL(14,2) DEFAULT 0").catch(() => {});
    await pool.query("ALTER TABLE tax_declarations ADD COLUMN prev_tds DECIMAL(14,2) DEFAULT 0").catch(() => {});
    await pool.query("ALTER TABLE tax_declarations ADD COLUMN form12b_submitted_at DATE").catch(() => {});

    // Phase F2b: Permission leave type
    await pool.query("ALTER TABLE leave_balances ADD COLUMN permission INT DEFAULT 1").catch(() => {});
    await pool.query("ALTER TABLE leave_applications MODIFY COLUMN leave_type ENUM('casual','earned','sick','comp','permission') NOT NULL").catch(() => {});
    // Reset permission balance monthly (set to 1 on 1st of each month)
    await pool.query("UPDATE leave_balances SET permission = 1 WHERE permission IS NULL").catch(() => {});

    // Phase F3: Leave is_lop column
    await pool.query("ALTER TABLE leave_applications ADD COLUMN is_lop BOOLEAN DEFAULT FALSE").catch(() => {});

    // Phase F4: CL accrual tracking + permission as decimal
    await pool.query("ALTER TABLE leave_balances ADD COLUMN cl_accrued_month VARCHAR(7) DEFAULT NULL").catch(() => {});
    await pool.query("ALTER TABLE leave_balances MODIFY COLUMN permission DECIMAL(4,2) DEFAULT 2").catch(() => {});

    // Phase G1: Missed attendance requests table
    await pool.query(`CREATE TABLE IF NOT EXISTS missed_attendance_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      emp_code VARCHAR(20) NOT NULL,
      request_date DATE NOT NULL,
      reason TEXT NOT NULL,
      proof_url VARCHAR(500),
      status ENUM('pending','approved','rejected') DEFAULT 'pending',
      reviewed_by VARCHAR(20),
      reviewed_at DATETIME,
      review_note TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (emp_code) REFERENCES employees(code) ON DELETE CASCADE,
      INDEX idx_missed_att_emp (emp_code),
      INDEX idx_missed_att_status (status)
    )`).catch(() => {});

    // Phase G2: Selfie columns for attendance
    await pool.query("ALTER TABLE attendance_logs ADD COLUMN selfie_checkin_url VARCHAR(500)").catch(() => {});
    await pool.query("ALTER TABLE attendance_logs ADD COLUMN selfie_checkout_url VARCHAR(500)").catch(() => {});

    // Phase G: Shift types table
    await pool.query(`CREATE TABLE IF NOT EXISTS shift_types (
      code VARCHAR(10) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      start_time VARCHAR(10) NOT NULL DEFAULT '09:00',
      end_time VARCHAR(10) NOT NULL DEFAULT '18:00',
      color VARCHAR(10) DEFAULT '#2563EB',
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`).catch(function(e) { console.error('shift_types migration error:', e.message); });

    // Seed default shift types if empty
    const [stRows] = await pool.query('SELECT COUNT(*) as cnt FROM shift_types').catch(() => [[]]);
    if (stRows && stRows[0] && stRows[0].cnt === 0) {
      await pool.query(`INSERT IGNORE INTO shift_types (code, name, start_time, end_time, color) VALUES
        ('GEN', 'General Shift', '09:00', '18:00', '#2563EB'),
        ('2ND', 'Second Shift', '14:00', '22:00', '#D97706'),
        ('3RD', 'Third Shift (Night)', '22:00', '06:00', '#7C3AED')
      `).catch(() => {});
    }

    // Ensure profile_details is in the section ENUM (for existing tables)
    await pool.query("ALTER TABLE document_edit_requests MODIFY COLUMN section ENUM('profile_details','educational_certs','bank_passbook','bank_details','experience_certs') NOT NULL").catch(() => {});

    // Phase H: Accounts role + new approval flow for expenses & advances
    // 1. Add 'Accounts' to role ENUMs (idempotent — re-running is a no-op)
    await pool.query("ALTER TABLE users MODIFY COLUMN role ENUM('MD','HR','Manager','Employee','Accounts') DEFAULT 'Employee'").catch((e) => { console.error('users.role enum migration:', e.message); });
    await pool.query("ALTER TABLE employees MODIFY COLUMN role ENUM('MD','HR','Manager','Employee','Accounts') DEFAULT 'Employee'").catch((e) => { console.error('employees.role enum migration:', e.message); });

    // 2. Expense reimbursements — add accounts_accepted, Paid statuses + paid_by, paid_date columns
    await pool.query("ALTER TABLE expense_reimbursements MODIFY COLUMN status ENUM('Pending','accounts_accepted','hr_accepted','Approved','Paid','Rejected') DEFAULT 'Pending'").catch((e) => { console.error('expense.status enum migration:', e.message); });
    await pool.query("ALTER TABLE expense_reimbursements ADD COLUMN paid_by VARCHAR(20)").catch(() => {});
    await pool.query("ALTER TABLE expense_reimbursements ADD COLUMN paid_date DATE").catch(() => {});
    // Migrate any legacy hr_accepted rows to the new accounts_accepted state
    await pool.query("UPDATE expense_reimbursements SET status = 'accounts_accepted' WHERE status = 'hr_accepted'").catch(() => {});

    // 3. Advance requests — same treatment (note: ENUM is case-sensitive on values, keep existing casing)
    await pool.query("ALTER TABLE advance_requests MODIFY COLUMN status ENUM('Pending','Accounts_Accepted','HR_Accepted','Approved','Paid','Rejected') DEFAULT 'Pending'").catch((e) => { console.error('advance.status enum migration:', e.message); });
    await pool.query("ALTER TABLE advance_requests ADD COLUMN paid_by VARCHAR(20)").catch(() => {});
    await pool.query("ALTER TABLE advance_requests ADD COLUMN paid_date DATE").catch(() => {});
    await pool.query("UPDATE advance_requests SET status = 'Accounts_Accepted' WHERE status = 'HR_Accepted'").catch(() => {});

    // Public Holidays — managed by HR/MD, shown on every employee's calendar + announcement feed
    await pool.query(`CREATE TABLE IF NOT EXISTS public_holidays (
      id INT AUTO_INCREMENT PRIMARY KEY,
      holiday_date DATE NOT NULL,
      name VARCHAR(200) NOT NULL,
      description VARCHAR(500),
      created_by VARCHAR(20),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_holiday_date (holiday_date),
      INDEX idx_holiday_date (holiday_date)
    )`).catch((e) => { console.error('public_holidays migration:', e.message); });

    // Phase I: SuperAdmin + Feature Access Management
    await pool.query("ALTER TABLE users ADD COLUMN is_superadmin TINYINT(1) DEFAULT 0").catch(() => {});

    // Feature access per-employee overrides (SuperAdmin manages these)
    await pool.query(`CREATE TABLE IF NOT EXISTS feature_access (
      id INT AUTO_INCREMENT PRIMARY KEY,
      emp_code VARCHAR(20) NOT NULL,
      feature_key VARCHAR(50) NOT NULL,
      is_enabled TINYINT(1) DEFAULT 1,
      access_level ENUM('read','edit') DEFAULT 'read',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_emp_feature (emp_code, feature_key),
      INDEX idx_fa_emp (emp_code)
    )`).catch((e) => { console.error('feature_access migration:', e.message); });

    // Seed default SuperAdmin account (emp_code: SADMIN, password: Swetha@Super2026)
    // Only creates if SADMIN doesn't exist yet. Password can be changed via Settings.
    const bcrypt = require('bcryptjs');
    const [saCheck] = await pool.query("SELECT id FROM users WHERE emp_code = 'SADMIN'").catch(() => [[]]);
    if (!saCheck || saCheck.length === 0) {
      const saHash = await bcrypt.hash('Swetha@Super2026', 12);
      await pool.query(
        "INSERT IGNORE INTO employees (code, name, dept, designation, role, is_active) VALUES ('SADMIN', 'Super Admin', 'Administration', 'System Administrator', 'MD', 1)"
      ).catch(() => {});
      await pool.query(
        "INSERT IGNORE INTO users (emp_code, password_hash, role, is_active, is_superadmin) VALUES ('SADMIN', ?, 'MD', 1, 1)",
        [saHash]
      ).catch(() => {});
      console.log('[SUPERADMIN] Default SuperAdmin account created (SADMIN / Swetha@Super2026)');
    }

    // Migrate old broad PEB feature keys to new granular keys
    const pebMigrations = [
      { old: 'peb_stock',    newKeys: ['peb_stock_items','peb_grn','peb_material_requests','peb_returns'] },
      { old: 'peb_purchase', newKeys: ['peb_vendors','peb_purchase_indents','peb_purchase_orders','peb_transport'] }
    ];
    for (const m of pebMigrations) {
      const [oldRows] = await pool.query('SELECT emp_code, is_enabled, access_level FROM feature_access WHERE feature_key = ?', [m.old]).catch(() => [[]]);
      for (const row of (oldRows || [])) {
        for (const nk of m.newKeys) {
          await pool.query(
            'INSERT IGNORE INTO feature_access (emp_code, feature_key, is_enabled, access_level) VALUES (?, ?, ?, ?)',
            [row.emp_code, nk, row.is_enabled, row.access_level]
          ).catch(() => {});
        }
      }
    }

    // Ensure SS031 (Accounts dept) has the Accounts role — force update every startup
    await pool.query("UPDATE users SET role = 'Accounts' WHERE emp_code = 'SS031'").catch(() => {});
    await pool.query("UPDATE employees SET role = 'Accounts' WHERE code = 'SS031'").catch(() => {});
    const [ss031Check] = await pool.query("SELECT role FROM users WHERE emp_code = 'SS031'").catch(() => [[]]);
    console.log('[migration] SS031 role is now:', ss031Check.length ? ss031Check[0].role : 'NOT FOUND');

    console.log('DB migrations applied');
  } catch (e) { console.error('Migration error (non-fatal):', e.message); }
})();

// =====================================================
// MONTHLY PERMISSION RESET — Reset 2-hour permission balance on 1st of month
// =====================================================
async function resetMonthlyPermissions() {
  try {
    const pool = require('./config/db');
    const today = new Date();
    if (today.getDate() === 1) {
      const [result] = await pool.query('UPDATE leave_balances SET permission = 2 WHERE permission < 2');
      if (result.affectedRows > 0) console.log('[PERM-RESET] Reset permission balance for ' + result.affectedRows + ' employees');
    }
  } catch (e) { console.error('[PERM-RESET] Error:', e.message); }
}
setTimeout(resetMonthlyPermissions, 15000);
setInterval(resetMonthlyPermissions, 24 * 60 * 60 * 1000); // Check daily

// =====================================================
// SELFIE CLEANUP — Delete selfie photos older than 7 days
// =====================================================
const fs = require('fs');
const pathLib = require('path');

async function cleanupOldSelfies() {
  try {
    const pool = require('./config/db');
    // Find selfie URLs older than 7 days
    const [rows] = await pool.query(
      `SELECT id, selfie_checkin_url, selfie_checkout_url FROM attendance_logs
       WHERE log_date < DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       AND (selfie_checkin_url IS NOT NULL OR selfie_checkout_url IS NOT NULL)`
    );
    if (rows.length === 0) return;

    let deleted = 0;
    const uploadsDir = pathLib.resolve(pathLib.join(__dirname, 'uploads'));
    for (const row of rows) {
      // Delete check-in selfie file
      if (row.selfie_checkin_url) {
        const filename = pathLib.basename(row.selfie_checkin_url);
        const filePath = pathLib.join(uploadsDir, filename);
        try { fs.unlinkSync(filePath); } catch (e) { /* file may already be gone */ }
      }
      // Delete check-out selfie file
      if (row.selfie_checkout_url) {
        const filename = pathLib.basename(row.selfie_checkout_url);
        const filePath = pathLib.join(uploadsDir, filename);
        try { fs.unlinkSync(filePath); } catch (e) { /* file may already be gone */ }
      }
      deleted++;
    }
    // Clear URLs in DB
    await pool.query(
      `UPDATE attendance_logs SET selfie_checkin_url = NULL, selfie_checkout_url = NULL
       WHERE log_date < DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       AND (selfie_checkin_url IS NOT NULL OR selfie_checkout_url IS NOT NULL)`
    );
    if (deleted > 0) console.log('[SELFIE-CLEANUP] Deleted selfies from ' + deleted + ' attendance records (older than 7 days)');
  } catch (e) { console.error('[SELFIE-CLEANUP] Error:', e.message); }
}

// Run cleanup on startup and then every hour
setTimeout(cleanupOldSelfies, 10000);
setInterval(cleanupOldSelfies, 60 * 60 * 1000);

// =====================================================
// AUTO-CHECKOUT — At 9 PM, auto-checkout anyone who forgot
// =====================================================
async function autoCheckoutStale() {
  try {
    const pool = require('./config/db');
    // Close any attendance log where check_in exists, check_out is NULL,
    // and check_in was more than 18 hours ago.
    // Sets check_out = check_in + 8 hours (credited work time), not 9 PM,
    // so past "Active" entries get properly closed with a reasonable duration.
    const [result] = await pool.query(
      `UPDATE attendance_logs
       SET check_out = DATE_ADD(check_in, INTERVAL 8 HOUR),
           check_out_lat = check_in_lat, check_out_lng = check_in_lng
       WHERE check_in IS NOT NULL AND check_out IS NULL
         AND check_in < DATE_SUB(NOW(), INTERVAL 18 HOUR)`
    );
    if (result.affectedRows > 0) {
      console.log('[AUTO-CHECKOUT] Closed ' + result.affectedRows + ' stale checkout(s) (check_in > 18h ago, set check_out = check_in + 8h)');
    }
  } catch (e) { console.error('[AUTO-CHECKOUT] Error:', e.message); }
}
// Run on startup (catch any stale from previous days) and then every 30 minutes
setTimeout(autoCheckoutStale, 20000);
setInterval(autoCheckoutStale, 30 * 60 * 1000);

// =====================================================
// BIKE RATE Rs.3.25 -> Rs.3.50/km WITH EFFECT FROM 1 OCT 2026 (one-time)
// =====================================================
// The app worked out claim amounts at Rs.3.25/km until 28 Oct. Bike claims for
// travel from 1 Oct that are not yet paid are recalculated at Rs.3.50/km. Paid
// claims are left exactly as paid; HR and MD get a notification listing each
// employee's difference so Accounts can pay it as arrears. A claim is only
// changed if its amount is what the old rate gave (km × 3.25, with or without
// paise), so an amount someone typed in by hand is never overwritten. Runs
// once; the record in one_time_jobs stops it running again.
const BIKE_RATE_FROM_OCT_2026 = { from: '2026-10-01', oldRate: 3.25, newRate: 3.50 };
async function applyBikeRateFromOct2026() {
  const JOB = 'bike_rate_3_50_from_2026_10_01';
  const pool = require('./config/db');
  const { from, oldRate, newRate } = BIKE_RATE_FROM_OCT_2026;
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS one_time_jobs (
      name VARCHAR(100) PRIMARY KEY, ran_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, result TEXT)`);
    const [already] = await pool.query('SELECT name FROM one_time_jobs WHERE name = ?', [JOB]);
    if (already.length) return;

    const oldAmt = (t) => `(amount = ROUND(${t}.travel_km * ${oldRate}, 2) OR amount = FLOOR(${t}.travel_km * ${oldRate}))`;
    const conn = await pool.getConnection();
    let summary;
    try {
      await conn.beginTransaction();
      // Claim the job inside the transaction, so two starting containers can't both run it
      await conn.query('INSERT INTO one_time_jobs (name) VALUES (?)', [JOB]);

      // Travel expense bills — dated by the actual travel date
      const [exp] = await conn.query(
        `SELECT id, emp_code, emp_name, travel_km, amount, status FROM expense_reimbursements e
         WHERE LOWER(vehicle) = 'bike' AND expense_date >= ? AND travel_km > 0 AND status <> 'Rejected' AND ${oldAmt('e')}`,
        [from]);
      // Travel advances — no travel date on the form, so dated by application
      const [adv] = await conn.query(
        `SELECT a.id, a.emp_code, e.name AS emp_name, a.travel_km, a.amount, a.status FROM advance_requests a
         LEFT JOIN employees e ON e.code = a.emp_code
         WHERE a.type = 'travel' AND LOWER(a.vehicle) = 'bike' AND a.applied_date >= ? AND a.travel_km > 0
           AND a.status <> 'Rejected' AND ${oldAmt('a')}`,
        [from]);

      let updated = 0;
      const arrears = {}; // emp_code -> { name, amount, claims }
      for (const [table, rows] of [['expense_reimbursements', exp], ['advance_requests', adv]]) {
        for (const r of rows) {
          const newAmount = Math.round(Number(r.travel_km) * newRate * 100) / 100;
          if (r.status === 'Paid') {
            const diff = Math.round((newAmount - Number(r.amount)) * 100) / 100;
            if (diff <= 0) continue;
            const a = arrears[r.emp_code] || (arrears[r.emp_code] = { name: r.emp_name || r.emp_code, amount: 0, claims: 0 });
            a.amount = Math.round((a.amount + diff) * 100) / 100; a.claims++;
          } else {
            await conn.query(`UPDATE ${table} SET amount = ? WHERE id = ?`, [newAmount, r.id]);
            updated++;
          }
        }
      }

      const lines = Object.keys(arrears).sort().map(c =>
        `${arrears[c].name} (${c}): Rs.${arrears[c].amount.toFixed(2)} on ${arrears[c].claims} paid claim(s)`);
      summary = `Bike rate Rs.${newRate.toFixed(2)}/km from ${from}: ${updated} unpaid claim(s) recalculated. ` +
        (lines.length ? `Arrears due on paid claims — ${lines.join('; ')}.` : 'No paid claims need arrears.');
      await conn.query('UPDATE one_time_jobs SET result = ? WHERE name = ?', [summary, JOB]);

      // Tell HR and MD in the app
      const [admins] = await conn.query("SELECT code FROM employees WHERE role IN ('MD','HR') AND is_active = 1");
      for (const a of admins) {
        await conn.query('INSERT INTO notifications (emp_code, title, message, type) VALUES (?, ?, ?, ?)',
          [a.code, 'Bike travel rate updated from 1 Oct', summary, 'expense']);
      }
      await conn.commit();
    } catch (e) {
      await conn.rollback().catch(() => {});
      throw e;
    } finally {
      conn.release();
    }
    console.log('[BIKE-RATE] ' + summary);
  } catch (e) {
    console.error('[BIKE-RATE] Error:', e.message);
  }
}
setTimeout(applyBikeRateFromOct2026, 25000);

// =====================================================
// SOCKET.IO — Real-time updates
// =====================================================
const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000'];
const io = new Server(server, { cors: { origin: corsOrigins, credentials: true } });

// Track connected users: { empCode: socketId }
const connectedUsers = {};
const jwt = require('jsonwebtoken');

// Socket.IO JWT authentication middleware — verify token on handshake
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) return next(new Error('Authentication required'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Identity comes from verified JWT, not from client data
    socket.empCode = decoded.empCode;
    socket.empRole = decoded.role;
    socket.empName = decoded.name;
    next();
  } catch (err) {
    next(new Error('Invalid or expired token'));
  }
});

io.on('connection', (socket) => {
  // Identity already verified via JWT middleware — join rooms based on verified role
  connectedUsers[socket.empCode] = socket.id;
  socket.join('role:' + socket.empRole);
  socket.join('user:' + socket.empCode);
  socket.join('all');
  io.to('role:MD').to('role:HR').emit('user:online', { empCode: socket.empCode, name: socket.empName, time: new Date().toISOString() });
  console.log(`[WS] ${socket.empCode} connected (${socket.empRole})`);

  // Legacy 'auth' event — ignored since identity is from JWT, but kept for client compat
  socket.on('auth', () => {});

  socket.on('disconnect', () => {
    if (socket.empCode) {
      delete connectedUsers[socket.empCode];
      io.to('role:MD').to('role:HR').emit('user:offline', { empCode: socket.empCode, time: new Date().toISOString() });
      console.log(`[WS] ${socket.empCode} disconnected`);
    }
  });
});

// Make io accessible in routes
app.set('io', io);

server.listen(PORT, HOST, () => {
  console.log(`HRMS Server running on ${HOST}:${PORT}`);
  console.log(`Frontend: http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);
  console.log(`WebSocket: ws://localhost:${PORT}`);
});
