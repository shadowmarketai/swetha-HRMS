/**
 * Fix Accounts Role — Promote SS031 (Shiyam Raj E) to Accounts role
 * Updates both `users` and `employees` tables so the approval flow works.
 * Run: node database/fix-accounts-role.js
 */
const path = require('path');
const serverDir = path.join(__dirname, '..', 'server');
const mysql = require(path.join(serverDir, 'node_modules', 'mysql2', 'promise'));
require(path.join(serverDir, 'node_modules', 'dotenv')).config({ path: path.join(serverDir, '.env') });

async function fixAccountsRole() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hrms'
  });

  console.log('Connected to MySQL. Fixing Accounts role for SS031...\n');

  // Update users table
  const [userResult] = await conn.query(
    "UPDATE users SET role = 'Accounts' WHERE emp_code = 'SS031'"
  );
  console.log(`users table: ${userResult.affectedRows} row(s) updated`);

  // Update employees table (if it has a role column)
  try {
    const [empResult] = await conn.query(
      "UPDATE employees SET role = 'Accounts' WHERE code = 'SS031'"
    );
    console.log(`employees table: ${empResult.affectedRows} row(s) updated`);
  } catch (e) {
    console.log('employees table: skipped (no role column or not applicable)');
  }

  // Verify
  const [rows] = await conn.query(
    "SELECT emp_code, role FROM users WHERE emp_code = 'SS031'"
  );
  if (rows.length) {
    console.log(`\nVerified: SS031 role is now "${rows[0].role}"`);
  } else {
    console.log('\nWarning: SS031 not found in users table');
  }

  await conn.end();
  console.log('\nDone.');
}

fixAccountsRole().catch(err => {
  console.error('Failed:', err.message);
  process.exit(1);
});
