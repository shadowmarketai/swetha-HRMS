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
  {code:'MD001',name:'Selvam',dept:'Admin',designation:'Managing Director',salary:0,role:'MD',phone:'',doj:'',email:'selvam@swethastructures.com'},
  {code:'HR001',name:'HR Admin',dept:'Admin',designation:'HR Admin',salary:0,role:'HR',phone:'',doj:'',email:''},
  {code:'SS001',name:'Sankar Guru P',dept:'Design',designation:'Designing',salary:0,role:'Employee',phone:'',doj:'',email:'sankarguru182@gmail.com'},
  {code:'SS002',name:'Vishnukumar M',dept:'Marketing',designation:'Marketing',salary:0,role:'Employee',phone:'',doj:'',email:'vishnum991@gmail.com'},
  {code:'SS003',name:'Hariharan N',dept:'Execution',designation:'Execution',salary:0,role:'Employee',phone:'',doj:'',email:'hariharan0335@gmail.com'},
  {code:'SS004',name:'Priyanka S',dept:'QS',designation:'Quantity Surveyor',salary:0,role:'Employee',phone:'',doj:'',email:'priyankaskcivil@gmail.com'},
  {code:'SS005',name:'Vellaisamy Sankar',dept:'Execution',designation:'Execution',salary:0,role:'Employee',phone:'',doj:'',email:'vellaisamysankar88@yahoo.com'},
  {code:'SS006',name:'Srinivasan',dept:'Marketing',designation:'Marketing',salary:0,role:'Employee',phone:'',doj:'',email:'lsssrinisan@gmail.com'},
  {code:'SS007',name:'Balasubramanian N',dept:'Marketing',designation:'Marketing',salary:0,role:'Employee',phone:'',doj:'',email:'baluvspl@gmail.com'},
  {code:'SS008',name:'Santhosh J',dept:'Execution',designation:'Execution',salary:0,role:'Employee',phone:'',doj:'',email:'santhosej0210@gmail.com'},
  {code:'SS009',name:'Hariharan G',dept:'Design',designation:'Designing',salary:0,role:'Employee',phone:'',doj:'',email:'josephharigmw@gmail.com'},
  {code:'SS010',name:'M Karthikeyan',dept:'Execution',designation:'Execution',salary:0,role:'Employee',phone:'',doj:'',email:'karthikmanoharan19@gmail.com'},
  {code:'SS011',name:'Govindaraj R',dept:'Marketing',designation:'Marketing',salary:0,role:'Employee',phone:'',doj:'',email:'govindganga0208@gmail.com'},
  {code:'SS012',name:'Kamalesh Velusamy',dept:'Execution',designation:'Execution',salary:0,role:'Employee',phone:'',doj:'',email:'vkamaleshkamalesh60306@gmail.com'},
  {code:'SS013',name:'Santhoshkumar G',dept:'Production',designation:'Production',salary:0,role:'Employee',phone:'',doj:'',email:'santhoshganesan0556@gmail.com'},
  {code:'SS014',name:'Nithyaprabhu A',dept:'Execution',designation:'Execution',salary:0,role:'Employee',phone:'',doj:'',email:'nithyaprabhu00@gmail.com'},
  {code:'SS015',name:'Yuvaraj M',dept:'Execution',designation:'Execution',salary:0,role:'Employee',phone:'',doj:'',email:'yuvamarimuthu1085@gmail.com'},
  {code:'SS016',name:'S Sankavai',dept:'Design',designation:'Designing',salary:0,role:'Employee',phone:'',doj:'',email:'sankavaisanthosh@gmail.com'},
  {code:'SS017',name:'Kousikraja M',dept:'Marketing',designation:'Marketing',salary:0,role:'Employee',phone:'',doj:'',email:'kousik622@gmail.com'},
  {code:'SS018',name:'Rajkumar R',dept:'Marketing',designation:'Marketing',salary:0,role:'Employee',phone:'',doj:'',email:'Rajthelegend4058@gmail.com'},
  {code:'SS019',name:'Sakthikumar S',dept:'Production',designation:'Production',salary:0,role:'Employee',phone:'',doj:'',email:'sakthikumar250289@gmail.com'},
  {code:'SS020',name:'Shanmugasundaran G',dept:'Production',designation:'Production',salary:0,role:'Employee',phone:'',doj:'',email:'shanmugashanmuga90@gmail.com'},
  {code:'SS021',name:'Govarthan S',dept:'Admin',designation:'Admin',salary:0,role:'Employee',phone:'',doj:'',email:'govarthansakthi@gmail.com'},
  {code:'SS022',name:'Devendaran Arivalagan',dept:'Production',designation:'Production',salary:0,role:'Employee',phone:'',doj:'',email:'devendaran96@gmail.com'},
  {code:'SS023',name:'Gowtham S',dept:'Production',designation:'Production',salary:0,role:'Employee',phone:'',doj:'',email:'gowthamautomech1995@gmail.com'},
  {code:'SS024',name:'Manikandan M',dept:'Production',designation:'Production',salary:0,role:'Employee',phone:'',doj:'',email:'manikandansurya914@gmail.com'},
  {code:'SS025',name:'Karthikeyan A',dept:'Production',designation:'Production',salary:0,role:'Employee',phone:'',doj:'',email:'karthikabk28@gmail.com'},
  {code:'SS026',name:'Krishna Gowri Sankar',dept:'Production',designation:'Production',salary:0,role:'Employee',phone:'',doj:'',email:'krishnagowrisankar1@gmail.com'},
  {code:'SS027',name:'Mahaganapathi Ponnusamy',dept:'Production',designation:'Production',salary:0,role:'Employee',phone:'',doj:'',email:'Mahaganapathi529717@gmail.com'},
  {code:'SS028',name:'Dinesh Jayabal',dept:'Admin',designation:'Driver',salary:0,role:'Employee',phone:'',doj:'',email:'dineshindira2024@gmail.com'},
  {code:'SS029',name:'Depsingh R',dept:'Admin',designation:'Security',salary:0,role:'Employee',phone:'',doj:'',email:'depsinghrokaya@gmail.com'},
  {code:'SS030',name:'Kathirvel N',dept:'Design',designation:'Designing',salary:0,role:'Employee',phone:'',doj:'',email:'kathirveln2588@gmail.com'},
  {code:'SS031',name:'Shiyam Raj E',dept:'Accounts',designation:'Accounts',salary:0,role:'Employee',phone:'',doj:'',email:'shiyam0905@gmail.com'},
  {code:'SS032',name:'Dharmaraj',dept:'Design',designation:'Designing',salary:0,role:'Employee',phone:'',doj:'',email:'thedharmarajm@gmail.com'},
  {code:'SS033',name:'Sakthi Murugan',dept:'Execution',designation:'Execution',salary:0,role:'Employee',phone:'',doj:'',email:'sakthi252636@gmail.com'},
  {code:'SS034',name:'Praveen Kumar J',dept:'Marketing',designation:'Marketing',salary:0,role:'Employee',phone:'',doj:'',email:'forpraveenvideos@gmail.com'},
  {code:'SS035',name:'Dinesh',dept:'Design',designation:'Designing',salary:0,role:'Employee',phone:'',doj:'',email:'Dineshvj5315@gmail.com'},
  {code:'SS036',name:'Lingeswaran Subramanian',dept:'Production',designation:'Production',salary:0,role:'Employee',phone:'',doj:'',email:'linges1993@gmail.com'},
  {code:'SS037',name:'Udhayasankar',dept:'Production',designation:'Production',salary:0,role:'Employee',phone:'',doj:'',email:'udhayask14@gmail.com'},
  {code:'SS038',name:'Manikam',dept:'Execution',designation:'Execution',salary:0,role:'Employee',phone:'',doj:'',email:'mkguys2010@gmail.com'},
  {code:'SS039',name:'Sarath',dept:'Execution',designation:'Execution',salary:0,role:'Employee',phone:'',doj:'',email:'sarathcivil42@gmail.com'},
  {code:'SS040',name:'Marimuthu',dept:'Execution',designation:'Execution',salary:0,role:'Employee',phone:'',doj:'',email:'marimuthu04071990@gmail.com'},
  {code:'SS041',name:'Arunkumar',dept:'QS',designation:'Quantity Surveyor',salary:0,role:'Employee',phone:'',doj:'',email:'aruntec16@gmail.com'},
  {code:'SS042',name:'Mohan',dept:'Execution',designation:'Execution',salary:0,role:'Employee',phone:'',doj:'',email:'perumalmohan666@gmail.com'}
];

const PASSWORDS = {
  'MD001': 'admin123',
  'HR001': 'hr123'
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
        `INSERT IGNORE INTO employees (code, name, dept, designation, salary, role, phone, doj, email)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [emp.code, emp.name, emp.dept, emp.designation, emp.salary, emp.role, emp.phone, emp.doj || null, emp.email]
      );
    }
    console.log('Employees seeded.');

    // Seed users with bcrypt passwords
    for (const emp of EMPLOYEES) {
      const password = PASSWORDS[emp.code] || DEFAULT_PASSWORD;
      const hash = await bcrypt.hash(password, 10);
      await conn.execute(
        `INSERT IGNORE INTO users (emp_code, password_hash, role)
         VALUES (?, ?, ?)`,
        [emp.code, hash, emp.role]
      );
    }
    console.log('Users seeded with hashed passwords.');

    // Seed leave balances
    for (const emp of EMPLOYEES) {
      await conn.execute(
        `INSERT IGNORE INTO leave_balances (emp_code, casual, earned, sick, comp)
         VALUES (?, 12, 20, 6, 3)`,
        [emp.code]
      );
    }
    console.log('Leave balances seeded.');

    console.log('\nProduction database initialized successfully!');
    console.log('Default passwords: MD001=admin123, HR001=hr123, all others=emp123');
  } finally {
    await conn.end();
  }
}

seed().catch(e => { console.error('Seed failed:', e.message); process.exit(1); });
