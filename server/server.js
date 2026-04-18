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


// Rate limiting on login (50 attempts per 15 min per IP — generous for office networks sharing one IP)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: IS_TEST ? 10000 : 50,
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/auth/login', loginLimiter);

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

// General read rate limiter (100 req/min on GET)
const readLimiter = rateLimit({
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
  windowMs: 60 * 1000,
  max: IS_TEST ? 10000 : 30,
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS'
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
    await pool.query("ALTER TABLE leave_applications MODIFY COLUMN status ENUM('pending','hr_accepted','approved','rejected') DEFAULT 'pending'").catch(() => {});
    // Add HR_Accepted to advance_requests status ENUM
    await pool.query("ALTER TABLE advance_requests MODIFY COLUMN status ENUM('Pending','HR_Accepted','Approved','Rejected') DEFAULT 'Pending'").catch(() => {});

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
    await pool.query("ALTER TABLE expense_reimbursements MODIFY COLUMN status ENUM('Pending','hr_accepted','Approved','Rejected') DEFAULT 'Pending'").catch(() => {});

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
      const [result] = await pool.query('UPDATE leave_balances SET permission = 1 WHERE permission < 1');
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
