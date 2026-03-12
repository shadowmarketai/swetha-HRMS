/**
 * Production Database Initializer
 * Seeds employees + fixes passwords in one step.
 * Run: node database/init-production.js
 *
 * Waits for MySQL to be ready, then seeds data.
 * Safe to run multiple times (uses INSERT IGNORE).
 */
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'server', '.env') });

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'hrms2026',
  database: process.env.DB_NAME || 'hrms',
  multipleStatements: true
};

const EMPLOYEES = [
  {code:'MD001',name:'Selvam',dept:'Office',designation:'Managing Director',salary:200000,role:'MD',phone:'9840000001',doj:'2015-01-01',email:'selvam@swethastructures.com'},
  {code:'SSC001',name:'Lakshmi Priya',dept:'Office',designation:'Accounts Manager',salary:45000,role:'Employee',phone:'9840000002',doj:'2019-03-15',email:'lakshmi.priya@swethastructures.com'},
  {code:'SSC002',name:'Ramesh Kumar',dept:'Office',designation:'Office Manager',salary:40000,role:'Employee',phone:'9840000003',doj:'2018-07-10',email:'ramesh.kumar@swethastructures.com'},
  {code:'SSC003',name:'N.Hari Haran',dept:'Site',designation:'Site Supervisor',salary:50000,role:'Employee',phone:'9840000004',doj:'2017-06-01',email:'hari.haran@swethastructures.com'},
  {code:'SSC004',name:'Govindan',dept:'Office',designation:'Clerk',salary:25000,role:'Employee',phone:'9840000005',doj:'2020-01-20',email:'govindan@swethastructures.com'},
  {code:'SSC005',name:'Anitha Devi',dept:'Office',designation:'Receptionist',salary:22000,role:'Employee',phone:'9840000006',doj:'2021-04-12',email:'anitha.devi@swethastructures.com'},
  {code:'SSC006',name:'Priyanka',dept:'Office',designation:'HR Manager',salary:55000,role:'HR',phone:'9840000007',doj:'2019-08-01',email:'priyanka@swethastructures.com'},
  {code:'SSC007',name:'Dinesh Babu',dept:'Office',designation:'Accountant',salary:35000,role:'Employee',phone:'9840000008',doj:'2020-06-15',email:'dinesh.babu@swethastructures.com'},
  {code:'SSC008',name:'Karthik Rajan',dept:'Office',designation:'Billing Executive',salary:28000,role:'Employee',phone:'9840000009',doj:'2021-02-28',email:'karthik.rajan@swethastructures.com'},
  {code:'SSC009',name:'Sankar Guru.P',dept:'Office',designation:'Senior Architect',salary:45161,role:'Employee',phone:'9840000010',doj:'2017-11-01',email:'sankar.guru@swethastructures.com'},
  {code:'SSC010',name:'Vellaisamy Sankar',dept:'Site',designation:'Foreman',salary:43548,role:'Employee',phone:'9840000011',doj:'2018-03-20',email:'vellaisamy.sankar@swethastructures.com'},
  {code:'SSC011',name:'Vishnu Kumar',dept:'Office',designation:'Office Staff',salary:100000,role:'Employee',phone:'9840000012',doj:'2019-05-01',email:'vishnu.kumar@swethastructures.com'},
  {code:'SSC006',name:'Priyanka',dept:'Office',designation:'HR Manager',salary:55000,role:'HR',phone:'9840000007',doj:'2019-08-01',email:'priyanka@swethastructures.com'}
];

const PASSWORDS = {
  'MD001': 'admin123',
  'SSC006': 'hr123'
};
const DEFAULT_PASSWORD = 'emp123';

async function waitForDB(retries = 30) {
  for (let i = 0; i < retries; i++) {
    try {
      const conn = await mysql.createConnection(DB_CONFIG);
      await conn.ping();
      await conn.end();
      console.log('Database is ready.');
      return;
    } catch (e) {
      console.log(`Waiting for database... (${i + 1}/${retries})`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  throw new Error('Database not available after ' + retries + ' attempts');
}

async function seed() {
  await waitForDB();
  const conn = await mysql.createConnection(DB_CONFIG);

  try {
    // Seed employees
    for (const emp of EMPLOYEES) {
      await conn.execute(
        `INSERT IGNORE INTO employees (emp_code, name, department, designation, basic_salary, role, phone, date_of_joining, email, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')`,
        [emp.code, emp.name, emp.dept, emp.designation, emp.salary, emp.role, emp.phone, emp.doj, emp.email]
      );
    }
    console.log('Employees seeded.');

    // Seed users with bcrypt passwords
    for (const emp of EMPLOYEES) {
      const password = PASSWORDS[emp.code] || DEFAULT_PASSWORD;
      const hash = await bcrypt.hash(password, 10);
      await conn.execute(
        `INSERT IGNORE INTO users (emp_code, password_hash, role, email)
         VALUES (?, ?, ?, ?)`,
        [emp.code, hash, emp.role, emp.email]
      );
    }
    console.log('Users seeded with hashed passwords.');

    // Seed leave balances
    const leaveTypes = ['Casual Leave', 'Sick Leave', 'Earned Leave', 'Comp Off'];
    const balances = [12, 6, 15, 3];
    for (const emp of EMPLOYEES) {
      for (let i = 0; i < leaveTypes.length; i++) {
        await conn.execute(
          `INSERT IGNORE INTO leave_balances (emp_code, leave_type, total, used, balance, year)
           VALUES (?, ?, ?, 0, ?, 2026)`,
          [emp.code, leaveTypes[i], balances[i], balances[i]]
        );
      }
    }
    console.log('Leave balances seeded.');

    console.log('\nProduction database initialized successfully!');
    console.log('Default passwords: MD001=admin123, SSC006=hr123, all others=emp123');
  } finally {
    await conn.end();
  }
}

seed().catch(e => { console.error('Seed failed:', e.message); process.exit(1); });
