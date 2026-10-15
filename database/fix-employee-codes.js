/**
 * Fix Employee Codes — rewrite codes stored in a non-canonical form
 * (lower case, stray spaces/tabs) to UPPER CASE with no whitespace.
 *
 * Why: login upper-cases the typed code and the DB compares case-insensitively,
 * so the password check passes, but the app then matches the code exactly and
 * logs the employee straight back out ("Employee not found in database").
 *
 * Every column with a foreign key to employees(code) is updated, plus
 * users.emp_code and employees.reporting_manager, in a single transaction.
 *
 * Run:   node database/fix-employee-codes.js           (dry run — shows what would change)
 *        node database/fix-employee-codes.js --apply   (performs the update)
 */
const path = require('path');
const serverDir = path.join(__dirname, '..', 'server');
const mysql = require(path.join(serverDir, 'node_modules', 'mysql2', 'promise'));
require(path.join(serverDir, 'node_modules', 'dotenv')).config({ path: path.join(serverDir, '.env') });

const APPLY = process.argv.includes('--apply');
// Strips whitespace incl. non-breaking space, plus zero-width chars from copy-paste
const canonical = (c) => String(c).replace(/[\s​-‍﻿]+/g, '').toUpperCase();
const VALID = /^[A-Z0-9_-]+$/;

async function fixEmployeeCodes() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hrms'
  });

  console.log(`Connected to MySQL. ${APPLY ? 'APPLYING fixes' : 'Dry run (pass --apply to write)'}...\n`);

  // BINARY comparison — the column collation is case-insensitive
  const [empRows] = await conn.query('SELECT code FROM employees');
  const [userRows] = await conn.query('SELECT emp_code FROM users');
  const renames = new Map();
  const manual = [];
  for (const c of [...empRows.map(r => r.code), ...userRows.map(r => r.emp_code)]) {
    const to = canonical(c);
    if (!VALID.test(to)) { manual.push(c); continue; }
    if (c !== to) renames.set(c, to);
  }
  if (manual.length) {
    console.log('Needs a manual fix (still invalid after cleaning — e.g. stray symbols):');
    for (const c of [...new Set(manual)]) console.log(`  ${JSON.stringify(c)}  hex=${Buffer.from(String(c)).toString('hex')}`);
    console.log('');
  }

  if (renames.size === 0) {
    console.log('All employee codes are already canonical. Nothing to do.');
    await conn.end();
    return;
  }

  // Refuse if the canonical code already belongs to a different employee
  for (const [from, to] of renames) {
    const clash = empRows.find(r => r.code === to && r.code !== from);
    if (clash) throw new Error(`Cannot rename ${JSON.stringify(from)} -> ${to}: ${to} already exists as another employee`);
  }

  const [refs] = await conn.query(
    `SELECT TABLE_NAME AS t, COLUMN_NAME AS c FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME = 'employees' AND REFERENCED_COLUMN_NAME = 'code'`
  );
  const columns = [{ t: 'employees', c: 'code' }, { t: 'employees', c: 'reporting_manager' }, { t: 'users', c: 'emp_code' }, ...refs];
  const seen = new Set();
  const targets = columns.filter(({ t, c }) => !seen.has(t + '.' + c) && seen.add(t + '.' + c));

  for (const [from, to] of renames) console.log(`  ${JSON.stringify(from)}  ->  ${to}`);
  console.log(`\nColumns to update: ${targets.map(x => x.t + '.' + x.c).join(', ')}\n`);

  if (!APPLY) {
    console.log('Dry run only. Re-run with --apply to perform these renames.');
    await conn.end();
    return;
  }

  await conn.beginTransaction();
  try {
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const [from, to] of renames) {
      for (const { t, c } of targets) {
        const [r] = await conn.query(`UPDATE \`${t}\` SET \`${c}\` = ? WHERE BINARY \`${c}\` = BINARY ?`, [to, from]);
        if (r.affectedRows) console.log(`  ${t}.${c}: ${r.affectedRows} row(s) ${JSON.stringify(from)} -> ${to}`);
      }
    }
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    await conn.query('SET FOREIGN_KEY_CHECKS = 1').catch(() => {});
    throw err;
  }

  await conn.end();
  console.log('\nDone. Affected employees can now log in with their code in capitals.');
}

fixEmployeeCodes().catch(err => {
  console.error('Failed:', err.message);
  process.exit(1);
});
