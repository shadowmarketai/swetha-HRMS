-- Swetha Structures HRMS Database Schema
CREATE DATABASE IF NOT EXISTS hrms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hrms;

-- Users / Authentication
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  emp_code VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('MD','HR','Manager','Employee') DEFAULT 'Employee',
  is_active TINYINT(1) DEFAULT 1,
  last_login DATETIME,
  biometric_credential_id VARCHAR(500),
  last_password_change DATETIME,
  google_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Employees
CREATE TABLE IF NOT EXISTS employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  dept VARCHAR(50) NOT NULL,
  designation VARCHAR(100),
  salary DECIMAL(12,2) DEFAULT 0,
  bank VARCHAR(100),
  acc_no VARCHAR(50),
  role ENUM('MD','HR','Manager','Employee') DEFAULT 'Employee',
  phone VARCHAR(20),
  doj DATE,
  email VARCHAR(100),
  address TEXT,
  emergency_contact VARCHAR(100),
  emergency_phone VARCHAR(20),
  photo_url VARCHAR(255),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Departments
CREATE TABLE IF NOT EXISTS departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  head_emp_code VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- KPI Scores
CREATE TABLE IF NOT EXISTS kpi_scores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  emp_code VARCHAR(20) NOT NULL,
  period VARCHAR(20) NOT NULL,
  target_name VARCHAR(100) NOT NULL,
  target_value DECIMAL(10,2),
  actual_value DECIMAL(10,2),
  score DECIMAL(5,2),
  weight DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (emp_code) REFERENCES employees(code) ON DELETE CASCADE
);

-- KPI Self Ratings
CREATE TABLE IF NOT EXISTS kpi_self_ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  emp_code VARCHAR(20) NOT NULL,
  period VARCHAR(20) NOT NULL,
  category VARCHAR(50) NOT NULL,
  rating DECIMAL(3,1),
  comments TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (emp_code) REFERENCES employees(code) ON DELETE CASCADE
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  type ENUM('routine','emergency','one-time') DEFAULT 'routine',
  assigned_to VARCHAR(20),
  assigned_by VARCHAR(20),
  due_date DATE,
  priority ENUM('low','medium','high') DEFAULT 'medium',
  status ENUM('pending','in_progress','done') DEFAULT 'pending',
  done TINYINT(1) DEFAULT 0,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_to) REFERENCES employees(code) ON DELETE SET NULL
);

-- Advance Requests
CREATE TABLE IF NOT EXISTS advance_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('site','salary','travel') NOT NULL,
  emp_code VARCHAR(20) NOT NULL,
  emp_name VARCHAR(100),
  dept VARCHAR(50),
  amount DECIMAL(12,2) NOT NULL,
  reason TEXT,
  details TEXT,
  project VARCHAR(100),
  category VARCHAR(50),
  travel_from VARCHAR(100),
  travel_to VARCHAR(100),
  vehicle VARCHAR(50),
  travel_km DECIMAL(10,2),
  emi_amount DECIMAL(12,2),
  emi_months INT,
  urgency ENUM('low','medium','high','normal') DEFAULT 'medium',
  status ENUM('Pending','HR_Accepted','Approved','Rejected') DEFAULT 'Pending',
  applied_date DATE,
  reviewed_by VARCHAR(20),
  review_date DATE,
  reject_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (emp_code) REFERENCES employees(code) ON DELETE CASCADE
);

-- Job Postings
CREATE TABLE IF NOT EXISTS job_postings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  dept VARCHAR(50),
  location VARCHAR(100),
  type ENUM('Full-time','Part-time','Contract') DEFAULT 'Full-time',
  experience VARCHAR(50),
  salary_range VARCHAR(50),
  description TEXT,
  requirements TEXT,
  status ENUM('Open','Closed','On Hold') DEFAULT 'Open',
  posted_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Candidates
CREATE TABLE IF NOT EXISTS candidates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(20),
  job_id INT,
  stage ENUM('Applied','Screening','Interview','Offer','Hired','Rejected') DEFAULT 'Applied',
  rating DECIMAL(3,1),
  resume_url VARCHAR(255),
  notes TEXT,
  applied_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES job_postings(id) ON DELETE SET NULL
);

-- Documents
CREATE TABLE IF NOT EXISTS documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  emp_code VARCHAR(20) NOT NULL,
  doc_type VARCHAR(50) NOT NULL,
  doc_name VARCHAR(200) NOT NULL,
  file_path VARCHAR(500),
  file_size INT,
  mime_type VARCHAR(100),
  is_generated TINYINT(1) DEFAULT 0,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (emp_code) REFERENCES employees(code) ON DELETE CASCADE
);

-- Events
CREATE TABLE IF NOT EXISTS events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_type ENUM('meeting','celebration','training','holiday','other') DEFAULT 'other',
  location VARCHAR(100),
  created_by VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Awards
CREATE TABLE IF NOT EXISTS awards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  emp_code VARCHAR(20) NOT NULL,
  emp_name VARCHAR(100),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  award_date DATE,
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (emp_code) REFERENCES employees(code) ON DELETE CASCADE
);

-- Hot Seat Sessions
CREATE TABLE IF NOT EXISTS hot_seat_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  emp_code VARCHAR(20) NOT NULL,
  emp_name VARCHAR(100),
  session_date DATE,
  goals TEXT,
  challenges TEXT,
  wins TEXT,
  feedback TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (emp_code) REFERENCES employees(code) ON DELETE CASCADE
);

-- Temperament Results
CREATE TABLE IF NOT EXISTS temperament_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  emp_code VARCHAR(20) NOT NULL,
  profile_type VARCHAR(50),
  scores JSON,
  taken_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (emp_code) REFERENCES employees(code) ON DELETE CASCADE
);

-- Skill Ratings
CREATE TABLE IF NOT EXISTS skill_ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  emp_code VARCHAR(20) NOT NULL,
  category VARCHAR(50) NOT NULL,
  skill_name VARCHAR(100) NOT NULL,
  self_rating DECIMAL(3,1),
  manager_rating DECIMAL(3,1),
  peer_feedback TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (emp_code) REFERENCES employees(code) ON DELETE CASCADE,
  UNIQUE KEY unique_skill (emp_code, category, skill_name)
);

-- Personal Visions
CREATE TABLE IF NOT EXISTS personal_visions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  emp_code VARCHAR(20) NOT NULL,
  vision_text TEXT,
  goals JSON,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (emp_code) REFERENCES employees(code) ON DELETE CASCADE
);

-- Attendance Logs
CREATE TABLE IF NOT EXISTS attendance_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  emp_code VARCHAR(20) NOT NULL,
  check_in DATETIME,
  check_in_lat DECIMAL(10,7),
  check_in_lng DECIMAL(10,7),
  check_out DATETIME,
  check_out_lat DECIMAL(10,7),
  check_out_lng DECIMAL(10,7),
  status ENUM('Present','Absent','Half Day','Leave') DEFAULT 'Present',
  log_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (emp_code) REFERENCES employees(code) ON DELETE CASCADE,
  UNIQUE KEY unique_attendance (emp_code, log_date)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  emp_code VARCHAR(20) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT,
  type VARCHAR(50),
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (emp_code) REFERENCES employees(code) ON DELETE CASCADE
);

-- User Settings
CREATE TABLE IF NOT EXISTS user_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  emp_code VARCHAR(20) UNIQUE NOT NULL,
  push_notifications TINYINT(1) DEFAULT 1,
  email_notifications TINYINT(1) DEFAULT 1,
  theme VARCHAR(20) DEFAULT 'light',
  language VARCHAR(10) DEFAULT 'en',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (emp_code) REFERENCES employees(code) ON DELETE CASCADE
);

-- Leave Applications
CREATE TABLE IF NOT EXISTS leave_applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  emp_code VARCHAR(20) NOT NULL,
  emp_name VARCHAR(100),
  dept VARCHAR(50),
  leave_type ENUM('casual','earned','sick','comp') NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  days INT NOT NULL,
  reason TEXT,
  status ENUM('pending','hr_accepted','approved','rejected') DEFAULT 'pending',
  reviewed_by VARCHAR(20),
  review_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (emp_code) REFERENCES employees(code) ON DELETE CASCADE
);

-- Leave Balances
CREATE TABLE IF NOT EXISTS leave_balances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  emp_code VARCHAR(20) UNIQUE NOT NULL,
  casual INT DEFAULT 12,
  earned INT DEFAULT 20,
  sick INT DEFAULT 6,
  comp INT DEFAULT 3,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (emp_code) REFERENCES employees(code) ON DELETE CASCADE
);

-- Notification Preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  emp_code VARCHAR(20) UNIQUE NOT NULL,
  salary TINYINT(1) DEFAULT 1,
  leave_alert TINYINT(1) DEFAULT 1,
  advance TINYINT(1) DEFAULT 1,
  payroll TINYINT(1) DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (emp_code) REFERENCES employees(code) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_emp_code ON kpi_scores(emp_code);
CREATE INDEX idx_task_assigned ON tasks(assigned_to);
CREATE INDEX idx_advance_emp ON advance_requests(emp_code);
CREATE INDEX idx_advance_status ON advance_requests(status);
CREATE INDEX idx_attendance_date ON attendance_logs(log_date);
CREATE INDEX idx_attendance_emp ON attendance_logs(emp_code);
CREATE INDEX idx_notification_emp ON notifications(emp_code);
CREATE INDEX idx_notification_read ON notifications(is_read);
CREATE INDEX idx_candidate_job ON candidates(job_id);
CREATE INDEX idx_document_emp ON documents(emp_code);
CREATE INDEX idx_leave_emp ON leave_applications(emp_code);
CREATE INDEX idx_leave_status ON leave_applications(status);

-- =====================================================
-- NEW FEATURE TABLES (11 Features)
-- =====================================================

-- F1: Shift Assignments
CREATE TABLE IF NOT EXISTS shift_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  emp_code VARCHAR(20) NOT NULL,
  shift_code VARCHAR(10) NOT NULL DEFAULT 'GEN',
  is_eligible TINYINT(1) DEFAULT 1,
  assigned_by VARCHAR(20),
  effective_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (emp_code) REFERENCES employees(code) ON DELETE CASCADE,
  UNIQUE KEY unique_shift (emp_code)
);

-- F2: Expense Reimbursements
CREATE TABLE IF NOT EXISTS expense_reimbursements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  emp_code VARCHAR(20) NOT NULL,
  emp_name VARCHAR(100),
  category VARCHAR(50) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  receipt_url VARCHAR(500),
  status ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
  reviewed_by VARCHAR(20),
  review_date DATE,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (emp_code) REFERENCES employees(code) ON DELETE CASCADE
);

-- F3: Self Service Documents
CREATE TABLE IF NOT EXISTS self_service_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  emp_code VARCHAR(20) NOT NULL,
  doc_name VARCHAR(200) NOT NULL,
  doc_type VARCHAR(50),
  file_path VARCHAR(500),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (emp_code) REFERENCES employees(code) ON DELETE CASCADE
);

-- F4: Geofence Attendance Logs (extends attendance_logs with geofence status)
CREATE TABLE IF NOT EXISTS geofence_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  emp_code VARCHAR(20) NOT NULL,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  nearest_site VARCHAR(100),
  distance_m DECIMAL(10,2),
  is_within_geofence TINYINT(1) DEFAULT 0,
  action ENUM('check_in','check_out') NOT NULL,
  logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (emp_code) REFERENCES employees(code) ON DELETE CASCADE
);

-- F5: Tax Declarations
CREATE TABLE IF NOT EXISTS tax_declarations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  emp_code VARCHAR(20) NOT NULL,
  fy VARCHAR(10) NOT NULL DEFAULT '2025-26',
  section_80c DECIMAL(12,2) DEFAULT 0,
  section_80d DECIMAL(12,2) DEFAULT 0,
  hra_exemption DECIMAL(12,2) DEFAULT 0,
  home_loan_interest DECIMAL(12,2) DEFAULT 0,
  annual_income DECIMAL(14,2) DEFAULT 0,
  total_deductions DECIMAL(14,2) DEFAULT 0,
  taxable_income DECIMAL(14,2) DEFAULT 0,
  tax_liability DECIMAL(14,2) DEFAULT 0,
  monthly_tds DECIMAL(12,2) DEFAULT 0,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (emp_code) REFERENCES employees(code) ON DELETE CASCADE,
  UNIQUE KEY unique_tax_fy (emp_code, fy)
);

-- F6: Compliance Filings
CREATE TABLE IF NOT EXISTS compliance_filings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  filing_type VARCHAR(50) NOT NULL,
  period VARCHAR(20) NOT NULL,
  due_date DATE NOT NULL,
  filed_date DATE,
  status ENUM('pending','filed','overdue') DEFAULT 'pending',
  filed_by VARCHAR(20),
  authority VARCHAR(50),
  reference_no VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- F6: Contract Workers (CLRA Register)
CREATE TABLE IF NOT EXISTS contract_workers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  contractor VARCHAR(100),
  dept VARCHAR(50),
  daily_wage DECIMAL(10,2),
  start_date DATE,
  end_date DATE,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- F7: Asset Inventory
CREATE TABLE IF NOT EXISTS asset_inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  asset_name VARCHAR(200) NOT NULL,
  asset_type VARCHAR(50) NOT NULL,
  serial_no VARCHAR(100),
  purchase_date DATE,
  purchase_cost DECIMAL(12,2) DEFAULT 0,
  asset_condition ENUM('New','Good','Fair','Poor','Disposed') DEFAULT 'New',
  status ENUM('Available','Assigned','Under Repair','Disposed') DEFAULT 'Available',
  assigned_to VARCHAR(20),
  assigned_date DATE,
  assigned_by VARCHAR(20),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_to) REFERENCES employees(code) ON DELETE SET NULL
);

-- F8: Exit Requests & Full & Final
CREATE TABLE IF NOT EXISTS exit_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  emp_code VARCHAR(20) NOT NULL,
  emp_name VARCHAR(100),
  reason VARCHAR(100) NOT NULL,
  remarks TEXT,
  preferred_lwd DATE,
  actual_lwd DATE,
  status ENUM('Pending','Approved','Rejected','Clearance','FnF','Completed') DEFAULT 'Pending',
  reviewed_by VARCHAR(20),
  review_date DATE,
  clearance JSON,
  fnf_amount DECIMAL(14,2),
  fnf_details JSON,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (emp_code) REFERENCES employees(code) ON DELETE CASCADE
);

-- F10: Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'General',
  priority ENUM('Normal','High') DEFAULT 'Normal',
  created_by VARCHAR(20),
  author_name VARCHAR(100),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- F10: Announcement Read Status
CREATE TABLE IF NOT EXISTS announcement_reads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  announcement_id INT NOT NULL,
  emp_code VARCHAR(20) NOT NULL,
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
  FOREIGN KEY (emp_code) REFERENCES employees(code) ON DELETE CASCADE,
  UNIQUE KEY unique_read (announcement_id, emp_code)
);

-- Google Sign-In: add google_id column to users (if upgrading existing DB)
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);
CREATE INDEX idx_users_google_id ON users(google_id);

-- F11: Employee DOB / Anniversary (extends employees table)
-- DOB stored in employees table, adding column if not exists
ALTER TABLE employees ADD COLUMN IF NOT EXISTS dob DATE AFTER doj;

-- Extended Notification Preferences (6 new categories)
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS expense TINYINT(1) DEFAULT 1,
  ADD COLUMN IF NOT EXISTS exit_alert TINYINT(1) DEFAULT 1,
  ADD COLUMN IF NOT EXISTS celebration TINYINT(1) DEFAULT 1,
  ADD COLUMN IF NOT EXISTS compliance TINYINT(1) DEFAULT 1,
  ADD COLUMN IF NOT EXISTS announcement TINYINT(1) DEFAULT 1,
  ADD COLUMN IF NOT EXISTS asset TINYINT(1) DEFAULT 1;

-- Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  emp_code VARCHAR(20),
  action VARCHAR(50) NOT NULL,
  entity VARCHAR(50) NOT NULL,
  entity_id VARCHAR(50),
  old_value JSON,
  new_value JSON,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_emp (emp_code),
  INDEX idx_audit_entity (entity),
  INDEX idx_audit_date (created_at)
);

-- Indexes for new tables
CREATE INDEX idx_shift_emp ON shift_assignments(emp_code);
CREATE INDEX idx_expense_emp ON expense_reimbursements(emp_code);
CREATE INDEX idx_expense_status ON expense_reimbursements(status);
CREATE INDEX idx_geofence_emp ON geofence_logs(emp_code);
CREATE INDEX idx_tax_emp ON tax_declarations(emp_code);
CREATE INDEX idx_compliance_type ON compliance_filings(filing_type);
CREATE INDEX idx_compliance_due ON compliance_filings(due_date);
CREATE INDEX idx_asset_status ON asset_inventory(status);
CREATE INDEX idx_asset_assigned ON asset_inventory(assigned_to);
CREATE INDEX idx_exit_emp ON exit_requests(emp_code);
CREATE INDEX idx_exit_status ON exit_requests(status);
CREATE INDEX idx_announce_active ON announcements(is_active);
CREATE INDEX idx_announce_read_emp ON announcement_reads(emp_code);

-- Composite indexes for common query patterns
CREATE INDEX idx_employees_dept ON employees(dept);
CREATE INDEX idx_leave_app_emp_status ON leave_applications(emp_code, status);
CREATE INDEX idx_notif_emp_read ON notifications(emp_code, is_read);

-- Employee profile extended columns
ALTER TABLE employees ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS present_address TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS permanent_address TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS father_name VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS father_mobile VARCHAR(20);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS mother_name VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS mother_mobile VARCHAR(20);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS spouse_name VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS spouse_mobile VARCHAR(20);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS blood_group VARCHAR(5);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS pan VARCHAR(20);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS aadhaar VARCHAR(20);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS uan VARCHAR(30);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS qualification VARCHAR(200);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS institution VARCHAR(200);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS year_of_passing VARCHAR(10);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS previous_employer VARCHAR(200);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS previous_role VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS years_of_experience DECIMAL(4,1);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS marital_status VARCHAR(20);

-- Attendance logs — geofence columns
ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS location_name VARCHAR(200);
ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS remark TEXT;
ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS is_within_geofence TINYINT(1) DEFAULT 1;
ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS accuracy DECIMAL(10,2);

-- Geofence Sites
CREATE TABLE IF NOT EXISTS geofence_sites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  lat DECIMAL(10,7) NOT NULL,
  lng DECIMAL(10,7) NOT NULL,
  radius INT NOT NULL DEFAULT 200,
  is_active TINYINT(1) DEFAULT 1,
  created_by VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
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
);

CREATE TABLE IF NOT EXISTS project_tasks (
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
);

CREATE TABLE IF NOT EXISTS project_team (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  emp_code VARCHAR(20) NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE KEY unique_project_member (project_id, emp_code)
);

CREATE TABLE IF NOT EXISTS project_materials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  name VARCHAR(200) NOT NULL DEFAULT '',
  unit VARCHAR(50) DEFAULT '',
  total DECIMAL(12,2) DEFAULT 0,
  used DECIMAL(12,2) DEFAULT 0,
  remaining DECIMAL(12,2) DEFAULT 0,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- SiteTrack: Add new columns to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS contractor_name VARCHAR(255) DEFAULT 'Swetha Structures Pvt Ltd';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS site_location VARCHAR(500);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_lead VARCHAR(100);

-- SiteTrack: WBS Tasks (hierarchical work breakdown structure)
CREATE TABLE IF NOT EXISTS wbs_tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  wbs_code VARCHAR(50) NOT NULL,
  level INT DEFAULT 1,
  task_name VARCHAR(500) NOT NULL,
  lead VARCHAR(255),
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
);

-- SiteTrack: BOQ Sheets (civil, peb, mezzanine_civil, mezzanine_peb)
CREATE TABLE IF NOT EXISTS boq_sheets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  sheet_type VARCHAR(30) NOT NULL,
  title VARCHAR(500) NOT NULL,
  area_sqft FLOAT, quoted_rate_per_sqft FLOAT,
  total_planned_amount FLOAT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX ix_boq_proj (project_id)
);

-- SiteTrack: BOQ Items (line items within sheets)
CREATE TABLE IF NOT EXISTS boq_items (
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
);

-- SiteTrack: Usage Logs (material usage per BOQ item)
CREATE TABLE IF NOT EXISTS usage_logs (
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
);

-- SiteTrack: Daily Work Logs
CREATE TABLE IF NOT EXISTS daily_work_logs (
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
  FOREIGN KEY (task_id) REFERENCES wbs_tasks(id) ON DELETE SET NULL,
  INDEX ix_dl_proj_date (project_id, log_date)
);

-- Document Edit Requests (HR approval for locked profile sections)
CREATE TABLE IF NOT EXISTS document_edit_requests (
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
);

-- Employee profile lock + bank extended columns
ALTER TABLE employees ADD COLUMN IF NOT EXISTS ifsc_code VARCHAR(20);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS bank_branch VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS profile_sections_locked JSON DEFAULT (JSON_OBJECT());
