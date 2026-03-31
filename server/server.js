const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

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


// Rate limiting on login (5 attempts per 15 min per IP)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/auth/login', loginLimiter);

// Rate limiting on password change (3 attempts per 15 min)
const passwordChangeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { error: 'Too many password change attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/auth/change-password', passwordChangeLimiter);

// Rate limiting on forgot-password (3 attempts per 15 min)
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { error: 'Too many password reset attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/auth/forgot-password', forgotPasswordLimiter);

// Rate limiting on biometric endpoints (5 attempts per 15 min)
const biometricLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many biometric login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/auth/biometric-challenge', biometricLimiter);
app.use('/api/auth/biometric-login', biometricLimiter);

// General read rate limiter (100 req/min on GET)
const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method !== 'GET'
});
app.use('/api/', readLimiter);

// General mutation rate limiter (30 req/min on POST/PUT/PATCH/DELETE)
const mutationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
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

// Serve uploads — authenticated, force download, prevent path traversal
const { verifyToken: verifyUploadToken } = require('./middleware/auth');
app.use('/uploads', verifyUploadToken, (req, res) => {
  const requestedFile = path.basename(req.path);
  const uploadsDir = path.resolve(path.join(__dirname, 'uploads'));
  const filePath = path.resolve(path.join(uploadsDir, requestedFile));
  // Prevent path traversal
  if (!filePath.startsWith(uploadsDir)) {
    return res.status(400).json({ error: 'Invalid path' });
  }
  res.setHeader('Content-Disposition', 'attachment');
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
app.use('/api/geofence', require('./routes/geofence'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/sitetrack', require('./routes/sitetrack'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/peb/store', require('./routes/peb-store'));
app.use('/api/peb/purchase', require('./routes/peb-purchase'));
// Health check — verifies app + DB connectivity
app.get('/api/health', async (req, res) => {
  const health = { status: 'ok', timestamp: new Date().toISOString(), db: 'ok', uptime: process.uptime() };
  try {
    const pool = require('./config/db');
    await pool.query('SELECT 1');
  } catch (e) {
    health.status = 'degraded';
    health.db = 'unreachable';
  }
  const code = health.status === 'ok' ? 200 : 503;
  res.status(code).json(health);
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

    console.log('DB migrations applied');
  } catch (e) { console.error('Migration error (non-fatal):', e.message); }
})();

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

server.listen(PORT, () => {
  console.log(`HRMS Server running on port ${PORT}`);
  console.log(`Frontend: http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);
  console.log(`WebSocket: ws://localhost:${PORT}`);
});
