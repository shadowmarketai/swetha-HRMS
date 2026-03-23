/**
 * HRMS Database Seed Script
 * Seeds all 46 employees, credentials, leave balances, and departments.
 * Run once: node database/seed.js
 */
const API_BASE = process.env.API_BASE || 'http://localhost:3000/api';

const EMPLOYEES = [
  {code:'MD001',name:'Selvam',dept:'Office',designation:'Managing Director',salary:200000,bank:'UOB',accNo:'2524***1001',role:'MD',phone:'9840000001',doj:'2015-01-01'},
  {code:'SSC001',name:'Lakshmi Priya',dept:'Office',designation:'Accounts Manager',salary:45000,bank:'UOB',accNo:'2524***1002',role:'Employee',phone:'9840000002',doj:'2019-03-15'},
  {code:'SSC002',name:'Ramesh Kumar',dept:'Office',designation:'Office Manager',salary:40000,bank:'UOB',accNo:'2524***1003',role:'Employee',phone:'9840000003',doj:'2018-07-10'},
  {code:'SSC003',name:'N.Hari Haran',dept:'Site',designation:'Site Supervisor',salary:50000,bank:'UOB',accNo:'2524***1004',role:'Employee',phone:'9840000004',doj:'2017-06-01'},
  {code:'SSC004',name:'Govindan',dept:'Office',designation:'Clerk',salary:25000,bank:'UOB',accNo:'2524***1005',role:'Employee',phone:'9840000005',doj:'2020-01-20'},
  {code:'SSC005',name:'Anitha Devi',dept:'Office',designation:'Receptionist',salary:22000,bank:'UOB',accNo:'2524***1006',role:'Employee',phone:'9840000006',doj:'2021-04-12'},
  {code:'SSC006',name:'Priyanka',dept:'Office',designation:'HR Manager',salary:55000,bank:'UOB',accNo:'2524***1007',role:'HR',phone:'9840000007',doj:'2019-08-01'},
  {code:'SSC007',name:'Dinesh Babu',dept:'Office',designation:'Accountant',salary:35000,bank:'UOB',accNo:'2524***1008',role:'Employee',phone:'9840000008',doj:'2020-06-15'},
  {code:'SSC008',name:'Karthik Rajan',dept:'Office',designation:'Billing Executive',salary:28000,bank:'UOB',accNo:'2524***1009',role:'Employee',phone:'9840000009',doj:'2021-02-28'},
  {code:'SSC009',name:'Sankar Guru.P',dept:'Office',designation:'Senior Architect',salary:45161,bank:'UOB',accNo:'2524***1010',role:'Employee',phone:'9840000010',doj:'2017-11-01'},
  {code:'SSC010',name:'Vellaisamy Sankar',dept:'Site',designation:'Foreman',salary:43548,bank:'UOB',accNo:'2524***1011',role:'Employee',phone:'9840000011',doj:'2018-03-20'},
  {code:'SSC011',name:'Vishnu Kumar',dept:'Office',designation:'Office Staff',salary:100000,bank:'UOB',accNo:'2524***2932',role:'Employee',phone:'9840000012',doj:'2019-05-01'},
  {code:'SSC012',name:'Murugan.S',dept:'Office',designation:'Peon',salary:18000,bank:'UOB',accNo:'2524***1013',role:'Employee',phone:'9840000013',doj:'2020-09-10'},
  {code:'SSC013',name:'Jayalakshmi',dept:'Office',designation:'Store Keeper',salary:24000,bank:'UOB',accNo:'2524***1014',role:'Employee',phone:'9840000014',doj:'2021-01-05'},
  {code:'SSC014',name:'Raghavan.T',dept:'Office',designation:'Driver',salary:22000,bank:'UOB',accNo:'2524***1015',role:'Employee',phone:'9840000015',doj:'2019-12-01'},
  {code:'SSC015',name:'Kavitha.R',dept:'Office',designation:'Data Entry',salary:20000,bank:'UOB',accNo:'2524***1016',role:'Employee',phone:'9840000016',doj:'2022-03-15'},
  {code:'SSC016',name:'Suresh.M',dept:'Office',designation:'Office Assistant',salary:18000,bank:'UOB',accNo:'2524***1017',role:'Employee',phone:'9840000017',doj:'2022-07-01'},
  {code:'SSC023',name:'Praveen',dept:'Office',designation:'Senior Staff',salary:47581,bank:'UOB',accNo:'2524***1018',role:'Employee',phone:'9840000018',doj:'2018-05-20'},
  {code:'SSC017',name:'Nithya Prabhu',dept:'Site',designation:'Site Engineer',salary:38000,bank:'SBI',accNo:'3847***2001',role:'Employee',phone:'9840000019',doj:'2019-09-01'},
  {code:'SSC018',name:'Arun Prasad',dept:'Site',designation:'Mason Head',salary:35000,bank:'SBI',accNo:'3847***2002',role:'Employee',phone:'9840000020',doj:'2018-11-15'},
  {code:'SSC019',name:'Bala Kumar',dept:'Site',designation:'Site Supervisor',salary:32000,bank:'SBI',accNo:'3847***2003',role:'Employee',phone:'9840000021',doj:'2020-02-01'},
  {code:'SSC020',name:'Dhanush.R',dept:'Site',designation:'Helper',salary:20000,bank:'SBI',accNo:'3847***2004',role:'Employee',phone:'9840000022',doj:'2021-06-20'},
  {code:'SSC021',name:'Ezhilarasan',dept:'Site',designation:'Electrician',salary:28000,bank:'SBI',accNo:'3847***2005',role:'Employee',phone:'9840000023',doj:'2020-04-10'},
  {code:'SSC022',name:'Balasubramaninam',dept:'Site',designation:'Labour Head',salary:30000,bank:'SBI',accNo:'3847***2006',role:'Employee',phone:'9840000024',doj:'2017-08-15'},
  {code:'SSC024',name:'Ganesh Kumar',dept:'Site',designation:'Plumber',salary:25000,bank:'SBI',accNo:'3847***2007',role:'Employee',phone:'9840000025',doj:'2021-03-01'},
  {code:'SSC025',name:'Harish.V',dept:'Site',designation:'Carpenter',salary:27000,bank:'SBI',accNo:'3847***2008',role:'Employee',phone:'9840000026',doj:'2020-10-15'},
  {code:'SSC026',name:'Ilango.P',dept:'Site',designation:'Welder',salary:26000,bank:'SBI',accNo:'3847***2009',role:'Employee',phone:'9840000027',doj:'2021-09-01'},
  {code:'SSC027',name:'Jeeva Rajan',dept:'Site',designation:'Helper',salary:18000,bank:'SBI',accNo:'3847***2010',role:'Employee',phone:'9840000028',doj:'2022-01-10'},
  {code:'SSC028',name:'Karthik.S',dept:'Site',designation:'Site Worker',salary:20000,bank:'SBI',accNo:'3847***2011',role:'Employee',phone:'9840000029',doj:'2022-05-01'},
  {code:'SSC029',name:'Loganathan',dept:'Site',designation:'Painter',salary:24000,bank:'SBI',accNo:'3847***2012',role:'Employee',phone:'9840000030',doj:'2021-11-15'},
  {code:'SSC030',name:'Manikandan.R',dept:'Site',designation:'Helper',salary:18000,bank:'SBI',accNo:'3847***2013',role:'Employee',phone:'9840000031',doj:'2022-08-01'},
  {code:'SSM001',name:'Shanmugam.G',dept:'Factory',designation:'Factory Supervisor',salary:38000,bank:'UOB',accNo:'2524***3001',role:'Employee',phone:'9840000032',doj:'2018-01-10'},
  {code:'SSM002',name:'Govarthanan',dept:'Factory',designation:'Welder',salary:30000,bank:'UOB',accNo:'2524***3002',role:'Employee',phone:'9840000033',doj:'2019-04-15'},
  {code:'SSM003',name:'Krishna Gowri Sankar.S',dept:'Factory',designation:'Senior Fabricator',salary:41829,bank:'UOB',accNo:'2524***3003',role:'Employee',phone:'9840000034',doj:'2017-09-01'},
  {code:'SSM004',name:'Karthikeyan',dept:'Factory',designation:'Machine Operator',salary:28000,bank:'UOB',accNo:'2524***3004',role:'Employee',phone:'9840000035',doj:'2020-07-20'},
  {code:'SSM005',name:'Vijaya Kumar',dept:'Factory',designation:'Welder',salary:25000,bank:'UOB',accNo:'2524***3005',role:'Employee',phone:'9840000036',doj:'2019-11-01'},
  {code:'SSM006',name:'Sakthi Kumar.S',dept:'Factory',designation:'Helper',salary:36129,bank:'UOB',accNo:'2524***3006',role:'Employee',phone:'9840000037',doj:'2020-03-10'},
  {code:'SSM007',name:'Lingeswaran',dept:'Factory',designation:'Fabricator',salary:26000,bank:'UOB',accNo:'2524***3007',role:'Employee',phone:'9840000038',doj:'2021-01-15'},
  {code:'SSM008',name:'Udhaya Shankar',dept:'Factory',designation:'Helper',salary:22000,bank:'UOB',accNo:'2524***3008',role:'Employee',phone:'9840000039',doj:'2021-08-01'},
  {code:'SSM009',name:'Raj Kumar.P',dept:'Factory',designation:'Painter',salary:24000,bank:'UOB',accNo:'2524***3009',role:'Employee',phone:'9840000040',doj:'2022-02-10'},
  {code:'SSM010',name:'Saravanan.K',dept:'Factory',designation:'Quality Check',salary:30000,bank:'UOB',accNo:'2524***3010',role:'Employee',phone:'9840000041',doj:'2020-09-15'},
  {code:'SSM011',name:'Manikandan (PEB)',dept:'PEB',designation:'PEB Supervisor',salary:20323,bank:'UOB',accNo:'2524***4001',role:'Employee',phone:'9840000042',doj:'2019-06-01'},
  {code:'SSM012',name:'Prakash.T',dept:'PEB',designation:'PEB Worker',salary:18000,bank:'UOB',accNo:'2524***4002',role:'Employee',phone:'9840000043',doj:'2020-12-01'},
  {code:'SSM013',name:'Senthil.R',dept:'PEB',designation:'PEB Fabricator',salary:22000,bank:'UOB',accNo:'2524***4003',role:'Employee',phone:'9840000044',doj:'2021-05-15'},
  {code:'SSM014',name:'Vignesh.M',dept:'PEB',designation:'PEB Helper',salary:16000,bank:'UOB',accNo:'2524***4004',role:'Employee',phone:'9840000045',doj:'2022-04-01'},
  {code:'SSG001',name:'Ramu',dept:'Garden',designation:'Gardener',salary:12000,bank:'Cash',accNo:'Cash',role:'Employee',phone:'9840000046',doj:'2018-06-01'},
  {code:'SSG002',name:'Selvi',dept:'Garden',designation:'Gardener',salary:10000,bank:'Cash',accNo:'Cash',role:'Employee',phone:'9840000047',doj:'2019-02-15'},
  {code:'SSG003',name:'Kumar.G',dept:'Garden',designation:'Security',salary:15000,bank:'SBI',accNo:'3847***5001',role:'Employee',phone:'9840000048',doj:'2017-12-01'},
  {code:'SSG004',name:'Lakshman',dept:'Garden',designation:'Security Night',salary:14000,bank:'SBI',accNo:'3847***5002',role:'Employee',phone:'9840000049',doj:'2020-05-10'},
  {code:'SSG005',name:'Devi.M',dept:'Garden',designation:'Cleaner',salary:8250,bank:'Cash',accNo:'Cash',role:'Employee',phone:'9840000050',doj:'2021-10-01'}
];

// Build credentials: MD001=admin123, SSC006=hr123, SSC011=emp123, all others=emp123
const CREDENTIALS = { 'MD001': {pass:'admin123', idx:0}, 'SSC006': {pass:'hr123', idx:6}, 'SSC011': {pass:'emp123', idx:11} };
EMPLOYEES.forEach((e, i) => { if (!CREDENTIALS[e.code]) CREDENTIALS[e.code] = {pass:'emp123', idx:i}; });

async function seed() {
  console.log('Seeding HRMS database...');
  console.log(`API: ${API_BASE}`);

  // 1. Seed employees + users via /api/auth/seed
  console.log('\n1. Seeding employees & users...');
  const seedRes = await fetch(API_BASE + '/auth/seed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employees: EMPLOYEES, credentials: CREDENTIALS })
  });
  const seedData = await seedRes.json();
  if (!seedRes.ok) throw new Error('Seed failed: ' + JSON.stringify(seedData));
  console.log('   ' + seedData.message);

  // 2. Login as MD to get token for subsequent API calls
  console.log('\n2. Logging in as MD...');
  const loginRes = await fetch(API_BASE + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ empCode: 'MD001', password: 'admin123' })
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok) throw new Error('Login failed: ' + JSON.stringify(loginData));
  const token = loginData.token;
  console.log('   Logged in as ' + loginData.user.name);

  const authHeaders = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };

  // 3. Seed leave balances (defaults: 12/20/6/3)
  console.log('\n3. Seeding leave balances...');
  for (const emp of EMPLOYEES) {
    await fetch(API_BASE + '/leaves/balance/' + emp.code, {
      method: 'GET',
      headers: authHeaders
    });
  }
  console.log('   Leave balances initialized for ' + EMPLOYEES.length + ' employees');

  // 4. Seed some sample advance requests
  console.log('\n4. Seeding sample advance requests...');
  const sampleAdvances = [
    { type: 'salary', amount: 50000, reason: 'Medical Emergency', details: 'Hospital bills', emiAmount: 10000, emiMonths: 5, urgency: 'high' },
    { type: 'site', amount: 25000, reason: 'Material Purchase', details: 'Cement & Steel', project: 'Velachery Villa', category: 'Materials', urgency: 'medium' },
    { type: 'travel', amount: 5000, reason: 'Client Visit', details: 'Site inspection', travelFrom: 'Chennai', travelTo: 'Coimbatore', vehicle: 'Bus', travelKm: 500, urgency: 'low' }
  ];
  for (const adv of sampleAdvances) {
    await fetch(API_BASE + '/advances', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(adv)
    });
  }
  console.log('   Created ' + sampleAdvances.length + ' sample advance requests');

  // 5. Seed sample announcements
  console.log('\n5. Seeding sample announcements...');
  const sampleAnnouncements = [
    { title: 'Welcome to HRMS Portal', content: 'New HR Management System is now live. Please explore all features.', category: 'General', priority: 'High' },
    { title: 'Pongal Holiday Notice', content: 'Office will remain closed from Jan 14-16, 2026 for Pongal celebrations.', category: 'Holiday', priority: 'Normal' },
    { title: 'Safety Training - March 2026', content: 'Mandatory safety training for all Factory & Site employees on March 20, 2026.', category: 'Training', priority: 'High' }
  ];
  for (const ann of sampleAnnouncements) {
    await fetch(API_BASE + '/announcements', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(ann)
    });
  }
  console.log('   Created ' + sampleAnnouncements.length + ' sample announcements');

  // 6. Seed sample assets
  console.log('\n6. Seeding sample assets...');
  const sampleAssets = [
    { name: 'Dell Latitude 5520', type: 'Laptop', serial_number: 'DL-2025-001', purchase_date: '2025-06-15', purchase_cost: 65000, condition: 'Good' },
    { name: 'HP LaserJet Pro', type: 'Printer', serial_number: 'HP-2025-001', purchase_date: '2025-03-10', purchase_cost: 25000, condition: 'Good' },
    { name: 'iPhone 14', type: 'Mobile', serial_number: 'IP-2025-001', purchase_date: '2025-08-01', purchase_cost: 79900, condition: 'New' }
  ];
  for (const asset of sampleAssets) {
    await fetch(API_BASE + '/assets', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(asset)
    });
  }
  console.log('   Created ' + sampleAssets.length + ' sample assets');

  // 7. Seed compliance filing deadlines
  console.log('\n7. Seeding compliance filings...');
  const sampleFilings = [
    { type: 'PF', period: '2026-02', due_date: '2026-03-15', description: 'PF Return Feb 2026' },
    { type: 'ESI', period: '2026-02', due_date: '2026-03-15', description: 'ESI Return Feb 2026' },
    { type: 'TDS', period: '2025-Q4', due_date: '2026-01-31', description: 'TDS Q4 FY2025-26' }
  ];
  for (const filing of sampleFilings) {
    await fetch(API_BASE + '/compliance/filings', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(filing)
    });
  }
  console.log('   Created ' + sampleFilings.length + ' sample compliance filings');

  console.log('\nSeed complete! Database is ready.');
  console.log('Login credentials:');
  console.log('  MD:       MD001 / admin123');
  console.log('  HR:       SSC006 / hr123');
  console.log('  Employee: SSC011 / emp123');
  console.log('  All others: [code] / emp123');
}

seed().catch(err => {
  console.error('Seed error:', err.message);
  process.exit(1);
});
