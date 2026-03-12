/**
 * Fix HRMS Passwords — Direct MySQL re-hash
 * Fixes bcrypt hash corruption from seeding.
 * Run: node database/fix-passwords.js
 */
const path = require('path');
// Load modules from server/node_modules
const serverDir = path.join(__dirname, '..', 'server');
const mysql = require(path.join(serverDir, 'node_modules', 'mysql2', 'promise'));
const bcrypt = require(path.join(serverDir, 'node_modules', 'bcryptjs'));
require(path.join(serverDir, 'node_modules', 'dotenv')).config({ path: path.join(serverDir, '.env') });

const CREDENTIALS = {
  'MD001': 'admin123',
  'SSC006': 'hr123'
  // All others get emp123
};

async function fixPasswords() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hrms'
  });

  console.log('Connected to MySQL. Fixing passwords...\n');

  const [users] = await conn.query('SELECT emp_code FROM users');
  let updated = 0;

  for (const { emp_code } of users) {
    const plainPass = CREDENTIALS[emp_code] || 'emp123';
    const hash = await bcrypt.hash(plainPass, 10);
    await conn.query('UPDATE users SET password_hash = ? WHERE emp_code = ?', [hash, emp_code]);

    // Verify immediately
    const [rows] = await conn.query('SELECT password_hash FROM users WHERE emp_code = ?', [emp_code]);
    const ok = await bcrypt.compare(plainPass, rows[0].password_hash);
    if (!ok) {
      console.error(`FAIL: ${emp_code} — hash verification failed!`);
      process.exit(1);
    }
    updated++;
  }

  console.log(`All ${updated} passwords updated and verified successfully.`);
  console.log('\nCredentials:');
  console.log('  MD001    / admin123');
  console.log('  SSC006   / hr123');
  console.log('  All rest / emp123');

  await conn.end();
}

fixPasswords().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
