const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

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
  strictTransportSecurity: false
}));

// CORS whitelist
app.use(cors({
  origin: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:3000'],
  credentials: true
}));


// Rate limiting on password change (3 attempts per 15 min)
const passwordChangeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { error: 'Too many password change attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/auth/change-password', passwordChangeLimiter);

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

// Request logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files (frontend)
const STATIC_DIR = process.env.STATIC_DIR || path.join(__dirname, '..');
console.log('Serving static files from:', STATIC_DIR);
app.use(express.static(STATIC_DIR));

// Serve uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
app.use('/api/orgchart', require('./routes/orgchart'));

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

// Fallback to frontend
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
    console.log('DB migrations applied');
  } catch (e) { console.error('Migration error (non-fatal):', e.message); }
})();

app.listen(PORT, () => {
  console.log(`HRMS Server running on port ${PORT}`);
  console.log(`Frontend: http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);
});
