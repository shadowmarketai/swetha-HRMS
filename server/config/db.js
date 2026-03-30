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
  } catch (err) {
    console.error('MySQL connection/init failed:', err.message);
    console.log('Server will continue without database — localStorage fallback active');
  } finally {
    if (conn) conn.release();
  }
}

initSchema();

module.exports = pool;
