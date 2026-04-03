const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hrms',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Run idempotent migrations on existing databases (with retry for deadlocks)
async function runMigrations(conn) {
  const migrations = [
    {
      name: 'add_manager_role_to_users',
      sql: "ALTER TABLE users MODIFY COLUMN role ENUM('MD','HR','Manager','Employee') DEFAULT 'Employee'"
    },
    {
      name: 'add_manager_role_to_employees',
      sql: "ALTER TABLE employees MODIFY COLUMN role ENUM('MD','HR','Manager','Employee') DEFAULT 'Employee'"
    },
    {
      name: 'add_ifsc_code_to_employees',
      sql: "ALTER TABLE employees ADD COLUMN ifsc_code VARCHAR(20)"
    },
    {
      name: 'add_bank_branch_to_employees',
      sql: "ALTER TABLE employees ADD COLUMN bank_branch VARCHAR(100)"
    },
    {
      name: 'add_profile_sections_locked_to_employees',
      sql: "ALTER TABLE employees ADD COLUMN profile_sections_locked JSON DEFAULT (JSON_OBJECT())"
    },
    {
      name: 'add_bill_url_to_expense_reimbursements',
      sql: "ALTER TABLE expense_reimbursements ADD COLUMN bill_url VARCHAR(500)"
    },
    {
      name: 'add_expense_type_to_expense_reimbursements',
      sql: "ALTER TABLE expense_reimbursements ADD COLUMN expense_type VARCHAR(50)"
    },
    {
      name: 'add_project_to_expense_reimbursements',
      sql: "ALTER TABLE expense_reimbursements ADD COLUMN project VARCHAR(100)"
    },
    {
      name: 'add_travel_from_to_expense_reimbursements',
      sql: "ALTER TABLE expense_reimbursements ADD COLUMN travel_from VARCHAR(100)"
    },
    {
      name: 'add_travel_to_to_expense_reimbursements',
      sql: "ALTER TABLE expense_reimbursements ADD COLUMN travel_to VARCHAR(100)"
    },
    {
      name: 'add_vehicle_to_expense_reimbursements',
      sql: "ALTER TABLE expense_reimbursements ADD COLUMN vehicle VARCHAR(50)"
    },
    {
      name: 'add_travel_km_to_expense_reimbursements',
      sql: "ALTER TABLE expense_reimbursements ADD COLUMN travel_km DECIMAL(10,2)"
    },
    {
      name: 'add_travel_days_to_expense_reimbursements',
      sql: "ALTER TABLE expense_reimbursements ADD COLUMN travel_days INT"
    },
    {
      name: 'add_expense_date_to_expense_reimbursements',
      sql: "ALTER TABLE expense_reimbursements ADD COLUMN expense_date DATE"
    },
    {
      name: 'update_expense_status_enum',
      sql: "ALTER TABLE expense_reimbursements MODIFY COLUMN status ENUM('Pending','hr_accepted','Approved','Rejected') DEFAULT 'Pending'"
    },
    {
      name: 'add_dob_to_employees',
      sql: "ALTER TABLE employees ADD COLUMN dob DATE"
    },
    {
      name: 'add_gender_to_employees',
      sql: "ALTER TABLE employees ADD COLUMN gender VARCHAR(10)"
    },
    {
      name: 'add_aadhaar_to_employees',
      sql: "ALTER TABLE employees ADD COLUMN aadhaar VARCHAR(12)"
    },
    {
      name: 'add_pan_to_employees',
      sql: "ALTER TABLE employees ADD COLUMN pan VARCHAR(10)"
    },
    {
      name: 'create_document_edit_requests',
      sql: `CREATE TABLE IF NOT EXISTS document_edit_requests (
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
      )`
    }
  ];
  let applied = 0;
  for (const m of migrations) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await conn.query(m.sql);
        applied++;
        break;
      } catch (err) {
        if (err.errno === 1146) break; // table doesn't exist yet
        if (err.errno === 1213 && attempt < 3) {
          // Deadlock — wait and retry
          await new Promise(r => setTimeout(r, 1000 * attempt));
          continue;
        }
        console.error('Migration "' + m.name + '" error:', err.message);
        break;
      }
    }
  }
  if (applied > 0) console.log('Migrations: ' + applied + ' applied');
}

// Seed new SS*** employees + users if missing (one-time migration from SSC to SS codes)
async function seedNewEmployees(conn) {
  const bcrypt = require('bcryptjs');
  const employees = [
    {code:'MD001',name:'Selvam',dept:'Admin',designation:'Managing Director',salary:0,role:'MD',phone:'',doj:null,email:'selvam@swethastructures.com'},
    {code:'HR001',name:'HR Admin',dept:'Admin',designation:'HR Admin',salary:0,role:'HR',phone:'',doj:null,email:''},
    {code:'SS001',name:'Sankar Guru P',dept:'Design',designation:'Designing',salary:0,role:'Employee',phone:'',doj:null,email:'sankarguru182@gmail.com'},
    {code:'SS002',name:'Vishnukumar M',dept:'Marketing',designation:'Marketing',salary:0,role:'Employee',phone:'',doj:null,email:'vishnum991@gmail.com'},
    {code:'SS003',name:'Hariharan N',dept:'Execution',designation:'Execution',salary:0,role:'Employee',phone:'',doj:null,email:'hariharan0335@gmail.com'},
    {code:'SS004',name:'Priyanka S',dept:'QS',designation:'Quantity Surveyor',salary:0,role:'Employee',phone:'',doj:null,email:'priyankaskcivil@gmail.com'},
    {code:'SS005',name:'Vellaisamy Sankar',dept:'Execution',designation:'Execution',salary:0,role:'Employee',phone:'',doj:null,email:'vellaisamysankar88@yahoo.com'},
    {code:'SS006',name:'Srinivasan',dept:'Marketing',designation:'Marketing',salary:0,role:'Employee',phone:'',doj:null,email:'lsssrinisan@gmail.com'},
    {code:'SS007',name:'Balasubramanian N',dept:'Marketing',designation:'Marketing',salary:0,role:'Employee',phone:'',doj:null,email:'baluvspl@gmail.com'},
    {code:'SS008',name:'Santhosh J',dept:'Execution',designation:'Execution',salary:0,role:'Employee',phone:'',doj:null,email:'santhosej0210@gmail.com'},
    {code:'SS009',name:'Hariharan G',dept:'Design',designation:'Designing',salary:0,role:'Employee',phone:'',doj:null,email:'josephharigmw@gmail.com'},
    {code:'SS010',name:'M Karthikeyan',dept:'Execution',designation:'Execution',salary:0,role:'Employee',phone:'',doj:null,email:'karthikmanoharan19@gmail.com'},
    {code:'SS011',name:'Govindaraj R',dept:'Marketing',designation:'Marketing',salary:0,role:'Employee',phone:'',doj:null,email:'govindganga0208@gmail.com'},
    {code:'SS012',name:'Kamalesh Velusamy',dept:'Execution',designation:'Execution',salary:0,role:'Employee',phone:'',doj:null,email:'vkamaleshkamalesh60306@gmail.com'},
    {code:'SS013',name:'Santhoshkumar G',dept:'Production',designation:'Production',salary:0,role:'Employee',phone:'',doj:null,email:'santhoshganesan0556@gmail.com'},
    {code:'SS014',name:'Nithyaprabhu A',dept:'Execution',designation:'Execution',salary:0,role:'Employee',phone:'',doj:null,email:'nithyaprabhu00@gmail.com'},
    {code:'SS015',name:'Yuvaraj M',dept:'Execution',designation:'Execution',salary:0,role:'Employee',phone:'',doj:null,email:'yuvamarimuthu1085@gmail.com'},
    {code:'SS016',name:'S Sankavai',dept:'Design',designation:'Designing',salary:0,role:'Employee',phone:'',doj:null,email:'sankavaisanthosh@gmail.com'},
    {code:'SS017',name:'Kousikraja M',dept:'Marketing',designation:'Marketing',salary:0,role:'Employee',phone:'',doj:null,email:'kousik622@gmail.com'},
    {code:'SS018',name:'Rajkumar R',dept:'Marketing',designation:'Marketing',salary:0,role:'Employee',phone:'',doj:null,email:'Rajthelegend4058@gmail.com'},
    {code:'SS019',name:'Sakthikumar S',dept:'Production',designation:'Production',salary:0,role:'Employee',phone:'',doj:null,email:'sakthikumar250289@gmail.com'},
    {code:'SS020',name:'Shanmugasundaran G',dept:'Production',designation:'Production',salary:0,role:'Employee',phone:'',doj:null,email:'shanmugashanmuga90@gmail.com'},
    {code:'SS021',name:'Govarthan S',dept:'Admin',designation:'Admin',salary:0,role:'Employee',phone:'',doj:null,email:'govarthansakthi@gmail.com'},
    {code:'SS022',name:'Devendaran Arivalagan',dept:'Production',designation:'Production',salary:0,role:'Employee',phone:'',doj:null,email:'devendaran96@gmail.com'},
    {code:'SS023',name:'Gowtham S',dept:'Production',designation:'Production',salary:0,role:'Employee',phone:'',doj:null,email:'gowthamautomech1995@gmail.com'},
    {code:'SS024',name:'Manikandan M',dept:'Production',designation:'Production',salary:0,role:'Employee',phone:'',doj:null,email:'manikandansurya914@gmail.com'},
    {code:'SS025',name:'Karthikeyan A',dept:'Production',designation:'Production',salary:0,role:'Employee',phone:'',doj:null,email:'karthikabk28@gmail.com'},
    {code:'SS026',name:'Krishna Gowri Sankar',dept:'Production',designation:'Production',salary:0,role:'Employee',phone:'',doj:null,email:'krishnagowrisankar1@gmail.com'},
    {code:'SS027',name:'Mahaganapathi Ponnusamy',dept:'Production',designation:'Production',salary:0,role:'Employee',phone:'',doj:null,email:'Mahaganapathi529717@gmail.com'},
    {code:'SS028',name:'Dinesh Jayabal',dept:'Admin',designation:'Driver',salary:0,role:'Employee',phone:'',doj:null,email:'dineshindira2024@gmail.com'},
    {code:'SS029',name:'Depsingh R',dept:'Admin',designation:'Security',salary:0,role:'Employee',phone:'',doj:null,email:'depsinghrokaya@gmail.com'},
    {code:'SS030',name:'Kathirvel N',dept:'Design',designation:'Designing',salary:0,role:'Employee',phone:'',doj:null,email:'kathirveln2588@gmail.com'},
    {code:'SS031',name:'Shiyam Raj E',dept:'Accounts',designation:'Accounts',salary:0,role:'Employee',phone:'',doj:null,email:'shiyam0905@gmail.com'},
    {code:'SS032',name:'Dharmaraj',dept:'Design',designation:'Designing',salary:0,role:'Employee',phone:'',doj:null,email:'thedharmarajm@gmail.com'},
    {code:'SS033',name:'Sakthi Murugan',dept:'Execution',designation:'Execution',salary:0,role:'Employee',phone:'',doj:null,email:'sakthi252636@gmail.com'},
    {code:'SS034',name:'Praveen Kumar J',dept:'Marketing',designation:'Marketing',salary:0,role:'Employee',phone:'',doj:null,email:'forpraveenvideos@gmail.com'},
    {code:'SS035',name:'Dinesh',dept:'Design',designation:'Designing',salary:0,role:'Employee',phone:'',doj:null,email:'Dineshvj5315@gmail.com'},
    {code:'SS036',name:'Lingeswaran Subramanian',dept:'Production',designation:'Production',salary:0,role:'Employee',phone:'',doj:null,email:'linges1993@gmail.com'},
    {code:'SS037',name:'Udhayasankar',dept:'Production',designation:'Production',salary:0,role:'Employee',phone:'',doj:null,email:'udhayask14@gmail.com'},
    {code:'SS038',name:'Manikam',dept:'Execution',designation:'Execution',salary:0,role:'Employee',phone:'',doj:null,email:'mkguys2010@gmail.com'},
    {code:'SS039',name:'Sarath',dept:'Execution',designation:'Execution',salary:0,role:'Employee',phone:'',doj:null,email:'sarathcivil42@gmail.com'},
    {code:'SS040',name:'Marimuthu',dept:'Execution',designation:'Execution',salary:0,role:'Employee',phone:'',doj:null,email:'marimuthu04071990@gmail.com'},
    {code:'SS041',name:'Arunkumar',dept:'QS',designation:'Quantity Surveyor',salary:0,role:'Employee',phone:'',doj:null,email:'aruntec16@gmail.com'},
    {code:'SS042',name:'Mohan',dept:'Execution',designation:'Execution',salary:0,role:'Employee',phone:'',doj:null,email:'perumalmohan666@gmail.com'}
  ];
  const passwords = { 'MD001': 'admin123', 'HR001': 'hr123' };
  const defaultPass = 'emp123';
  let seeded = 0;
  for (const emp of employees) {
    try {
      await conn.query(
        'INSERT IGNORE INTO employees (code, name, dept, designation, salary, role, phone, doj, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [emp.code, emp.name, emp.dept, emp.designation, emp.salary, emp.role, emp.phone, emp.doj, emp.email]
      );
      const pass = passwords[emp.code] || defaultPass;
      const hash = await bcrypt.hash(pass, 10);
      await conn.query(
        'INSERT INTO users (emp_code, password_hash, role) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = VALUES(role)',
        [emp.code, hash, emp.role]
      );
      seeded++;
    } catch (e) { /* ignore duplicates */ }
  }
  // Deactivate old SSC*** employees that are not in the new list
  await conn.query("UPDATE employees SET is_active = 0 WHERE code LIKE 'SSC%'").catch(() => {});
  await conn.query("UPDATE users SET is_active = 0 WHERE emp_code LIKE 'SSC%'").catch(() => {});
  // Auto-fix: create login accounts for any employees missing from users table
  try {
    const [missing] = await conn.query(
      'SELECT e.code, e.role FROM employees e LEFT JOIN users u ON e.code = u.emp_code WHERE u.emp_code IS NULL AND e.is_active = 1'
    );
    if (missing.length > 0) {
      const fixHash = await bcrypt.hash(defaultPass, 10);
      for (const m of missing) {
        await conn.query(
          'INSERT INTO users (emp_code, password_hash, role) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = VALUES(role)',
          [m.code, fixHash, m.role]
        );
      }
      console.log('[AUTO-FIX] Created login accounts for', missing.length, 'employees:', missing.map(m => m.code).join(', '));
    }
  } catch (e) { console.error('[AUTO-FIX] Error:', e.message); }
  // Seed departments
  const depts = [...new Set(employees.map(e => e.dept))];
  for (const d of depts) {
    await conn.query('INSERT IGNORE INTO departments (name) VALUES (?)', [d]).catch(() => {});
  }
  console.log('Employee seed: ' + seeded + ' processed, old SSC codes deactivated');
}

// One-time: import stock from JSON seed data (runs only if SSF-CON-WEL-001 not found)
async function seedStockAndClearMock(conn) {
  try {
    // Check if peb_stock_items table exists
    const [tables] = await conn.query("SHOW TABLES LIKE 'peb_stock_items'");
    if (tables.length === 0) { console.log('[STOCK-SEED] peb_stock_items table not found, skipping'); return; }

    // Check if Excel data already imported by looking for a known Excel item code
    const [[{ cnt }]] = await conn.query("SELECT COUNT(*) as cnt FROM peb_stock_items WHERE item_code = 'SSF-CON-WEL-001'");
    console.log('[STOCK-SEED] Excel item check (SSF-CON-WEL-001):', cnt);
    if (cnt > 0) { console.log('[STOCK-SEED] Excel data already imported, skipping'); return; }

    console.log('[STOCK-SEED] Importing stock data from seed file...');
    const seedPath = path.join(__dirname, '..', 'stock-seed-data.json');
    if (!fs.existsSync(seedPath)) {
      console.log('[STOCK-SEED] seed file not found at', seedPath, '— skipping');
      return;
    }
    const items = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

    // Clear existing stock tables
    const stockTables = [
      'peb_scrap_items', 'peb_scrap_batches', 'peb_return_items',
      'peb_material_returns', 'peb_material_request_items', 'peb_material_requests',
      'peb_grn_items', 'peb_grn', 'peb_stock_transactions', 'peb_stock_items'
    ];
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const t of stockTables) {
      await conn.query('DELETE FROM ' + t).catch(() => {});
    }
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    // Insert all stock items
    let inserted = 0;
    for (const item of items) {
      try {
        await conn.query(
          'INSERT INTO peb_stock_items (item_code, item_name, category, sub_category, unit, current_stock, min_stock_level, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [item.item_code, item.item_name, item.category, item.sub_category, item.unit, item.current_stock, item.min_stock, 'Factory Store']
        );
        inserted++;
      } catch (e) {
        if (e.code !== 'ER_DUP_ENTRY') console.error('[STOCK-SEED] Error:', item.item_code, e.message);
      }
    }
    console.log('[STOCK-SEED] Inserted', inserted, 'stock items');

    // NEVER delete from production tables like attendance_logs, leave_applications, etc.
    // Previous code here wiped real production data on deploy — removed permanently.
    console.log('[STOCK-SEED] Stock seeding complete. No other tables touched.');
  } catch (e) {
    console.error('[STOCK-SEED] Error:', e.message);
  }
}

// Auto-initialize schema if tables are missing
async function initSchema() {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log('MySQL connected successfully');

    // Check if tables exist
    const [tables] = await conn.query('SHOW TABLES');
    if (tables.length === 0) {
      console.log('No tables found — auto-initializing schema...');
      const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        let sql = fs.readFileSync(schemaPath, 'utf8');
        // Remove CREATE DATABASE / USE statements (pool already targets the DB)
        sql = sql.replace(/CREATE DATABASE.*?;\s*/gi, '');
        sql = sql.replace(/USE\s+\w+;\s*/gi, '');

        // Split and execute statements individually to handle index-exists errors gracefully
        const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
        let success = 0, skipped = 0;
        for (const stmt of statements) {
          try {
            await conn.query(stmt);
            success++;
          } catch (stmtErr) {
            // Ignore duplicate index/key errors (1061), already exists errors
            if (stmtErr.errno === 1061 || stmtErr.code === 'ER_DUP_KEYNAME') {
              skipped++;
            } else {
              console.error('Schema statement error:', stmtErr.message);
              console.error('Statement:', stmt.substring(0, 100) + '...');
            }
          }
        }
        console.log('Schema init: ' + success + ' statements executed, ' + skipped + ' skipped (already exist)');
        console.log('Schema initialized successfully (' + tables.length + ' → check SHOW TABLES)');

        // Verify
        const [newTables] = await conn.query('SHOW TABLES');
        console.log('Tables created:', newTables.length);
      } else {
        console.log('schema.sql not found at', schemaPath, '— skipping auto-init');
      }
    } else {
      console.log('Database has', tables.length, 'tables — schema OK');
    }

    // Run pending migrations (idempotent)
    await runMigrations(conn);
    // Seed new SS*** employees if missing (migration from SSC to SS codes)
    await seedNewEmployees(conn);
    // Import stock data from JSON + clear mock data (one-time)
    await seedStockAndClearMock(conn);

    // Debug: log attendance record counts
    try {
      const [[{ total }]] = await conn.query('SELECT COUNT(*) as total FROM attendance_logs');
      const [[{ today }]] = await conn.query("SELECT COUNT(*) as today FROM attendance_logs WHERE log_date = CURDATE()");
      const [[{ thisMonth }]] = await conn.query("SELECT COUNT(*) as thisMonth FROM attendance_logs WHERE log_date LIKE CONCAT(DATE_FORMAT(NOW(),'%Y-%m'),'%')");
      console.log('[DEBUG-ATTENDANCE] Total records:', total, '| Today:', today, '| This month:', thisMonth);
      if (total > 0) {
        const [sample] = await conn.query('SELECT emp_code, log_date, check_in, check_out FROM attendance_logs ORDER BY log_date DESC, check_in DESC LIMIT 5');
        console.log('[DEBUG-ATTENDANCE] Latest 5 records:', JSON.stringify(sample));
      }
    } catch (e) { console.log('[DEBUG-ATTENDANCE] Error:', e.message); }
  } catch (err) {
    console.error('MySQL connection/init failed:', err.message);
    console.log('Server will continue without database — localStorage fallback active');
  } finally {
    if (conn) conn.release();
  }
}

initSchema();

module.exports = pool;
