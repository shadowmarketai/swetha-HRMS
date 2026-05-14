/**
 * Add permanent ACC001 Accounts Admin user to the live database.
 * Run inside the app container: node database/add-acc001.js
 */
const path = require('path');
const serverDir = path.join(__dirname, '..', 'server');
const mysql  = require(path.join(serverDir, 'node_modules', 'mysql2', 'promise'));
const bcrypt = require(path.join(serverDir, 'node_modules', 'bcryptjs'));
require(path.join(serverDir, 'node_modules', 'dotenv')).config({ path: path.join(serverDir, '.env') });

async function run() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'hrms'
  });

  console.log('Connected to MySQL.\n');

  // 1. Insert employee record (skip if already exists)
  await conn.query(
    `INSERT IGNORE INTO employees (code, name, dept, designation, salary, bank, acc_no, role, phone, doj)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['ACC001', 'Accounts Admin', 'Accounts', 'Accounts Admin', 0, '', '', 'Accounts', '', null]
  );
  console.log('Employee ACC001 inserted (or already existed).');

  // 2. Hash password and insert user record
  const hash = await bcrypt.hash('acc123', 10);
  await conn.query(
    `INSERT INTO users (emp_code, password_hash, role)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = VALUES(role)`,
    ['ACC001', hash, 'Accounts']
  );
  console.log('User ACC001 created with password: acc123');

  await conn.end();
  console.log('\nDone. Login with:  ACC001 / acc123');
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
