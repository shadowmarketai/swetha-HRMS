/**
 * HRMS Database Seed Script
 * Seeds all 44 employees, credentials, leave balances, and departments.
 * Run once: node database/seed.js
 */
const API_BASE = process.env.API_BASE || 'http://localhost:3000/api';

const EMPLOYEES = [
  {code:'MD001',name:'Selvam',dept:'Admin',designation:'Managing Director',salary:0,bank:'',accNo:'',role:'MD',phone:'',doj:''},
  {code:'HR001',name:'HR Admin',dept:'Admin',designation:'HR Admin',salary:0,bank:'',accNo:'',role:'HR',phone:'',doj:''},
  {code:'SS001',name:'Sankar Guru P',dept:'Design',designation:'Designing',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:''},
  {code:'SS002',name:'Vishnukumar M',dept:'Marketing',designation:'Marketing',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:''},
  {code:'SS003',name:'Hariharan N',dept:'Execution',designation:'Execution',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:''},
  {code:'SS004',name:'Priyanka S',dept:'QS',designation:'Quantity Surveyor',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:''},
  {code:'SS005',name:'Vellaisamy Sankar',dept:'Execution',designation:'Execution',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:''},
  {code:'SS006',name:'Srinivasan',dept:'Marketing',designation:'Marketing',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:''},
  {code:'SS007',name:'Balasubramanian N',dept:'Marketing',designation:'Marketing',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:''},
  {code:'SS008',name:'Santhosh J',dept:'Execution',designation:'Execution',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:''},
  {code:'SS009',name:'Hariharan G',dept:'Design',designation:'Designing',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:''},
  {code:'SS010',name:'M Karthikeyan',dept:'Execution',designation:'Execution',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:''},
  {code:'SS011',name:'Govindaraj R',dept:'Marketing',designation:'Marketing',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:''},
  {code:'SS012',name:'Kamalesh Velusamy',dept:'Execution',designation:'Execution',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:''},
  {code:'SS013',name:'Santhoshkumar G',dept:'Production',designation:'Production',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:''},
  {code:'SS014',name:'Nithyaprabhu A',dept:'Execution',designation:'Execution',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:''},
  {code:'SS015',name:'Yuvaraj M',dept:'Execution',designation:'Execution',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:''},
  {code:'SS016',name:'S Sankavai',dept:'Design',designation:'Designing',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:''},
  {code:'SS017',name:'Kousikraja M',dept:'Marketing',designation:'Marketing',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:''},
  {code:'SS018',name:'Rajkumar R',dept:'Marketing',designation:'Marketing',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:''},
  {code:'SS019',name:'Sakthikumar S',dept:'Production',designation:'Production',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:''},
  {code:'SS020',name:'Shanmugasundaran G',dept:'Production',designation:'Production',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:''},
  {code:'SS021',name:'Govarthan S',dept:'Admin',designation:'Admin',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:''},
  {code:'SS022',name:'Devendaran Arivalagan',dept:'Production',designation:'Production',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:''},
  {code:'SS023',name:'Gowtham S',dept:'Production',designation:'Production',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:''},
  {code:'SS024',name:'Manikandan M',dept:'Production',designation:'Production',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:''},
  {code:'SS025',name:'Karthikeyan A',dept:'Production',designation:'Production',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:''},
  {code:'SS026',name:'Krishna Gowri Sankar',dept:'Production',designation:'Production',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:''},
  {code:'SS027',name:'Mahaganapathi Ponnusamy',dept:'Production',designation:'Production',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:''},
  {code:'SS028',name:'Dinesh Jayabal',dept:'Admin',designation:'Driver',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:''},
  {code:'SS029',name:'Depsingh R',dept:'Admin',designation:'Security',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:''},
  {code:'SS030',name:'Kathirvel N',dept:'Design',designation:'Designing',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:''},
  {code:'SS031',name:'Shiyam Raj E',dept:'Accounts',designation:'Accounts',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:''},
  {code:'SS032',name:'Dharmaraj',dept:'Design',designation:'Designing',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:''},
  {code:'SS033',name:'Sakthi Murugan',dept:'Execution',designation:'Execution',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:''},
  {code:'SS034',name:'Praveen Kumar J',dept:'Marketing',designation:'Marketing',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:''},
  {code:'SS035',name:'Dinesh',dept:'Design',designation:'Designing',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:''},
  {code:'SS036',name:'Lingeswaran Subramanian',dept:'Production',designation:'Production',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:''},
  {code:'SS037',name:'Udhayasankar',dept:'Production',designation:'Production',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:''},
  {code:'SS038',name:'Manikam',dept:'Execution',designation:'Execution',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:''},
  {code:'SS039',name:'Sarath',dept:'Execution',designation:'Execution',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:''},
  {code:'SS040',name:'Marimuthu',dept:'Execution',designation:'Execution',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:''},
  {code:'SS041',name:'Arunkumar',dept:'QS',designation:'Quantity Surveyor',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:''},
  {code:'SS042',name:'Mohan',dept:'Execution',designation:'Execution',salary:0,bank:'',accNo:'',role:'Employee',phone:'',doj:''}
];

// Build credentials: MD001=admin123, HR001=hr123, all SS employees=emp123
const CREDENTIALS = { 'MD001': {pass:'admin123', idx:0}, 'HR001': {pass:'hr123', idx:1} };
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

  // 8. Seed geofence sites
  console.log('\n8. Seeding geofence sites...');
  await fetch(API_BASE + '/geofence/sites', { method: 'POST', headers: authHeaders, body: JSON.stringify({ name: 'Head Office - Saravanampatti', lat: 11.085, lng: 76.996, radius: 200 }) });
  await fetch(API_BASE + '/geofence/sites', { method: 'POST', headers: authHeaders, body: JSON.stringify({ name: 'Factory - Sulur', lat: 11.0378, lng: 77.126, radius: 300 }) });
  await fetch(API_BASE + '/geofence/sites', { method: 'POST', headers: authHeaders, body: JSON.stringify({ name: 'Site - Porur', lat: 11.032, lng: 76.98, radius: 250 }) });
  await fetch(API_BASE + '/geofence/sites', { method: 'POST', headers: authHeaders, body: JSON.stringify({ name: 'PEB Unit - Kinathukadavu', lat: 10.81, lng: 76.97, radius: 250 }) });
  console.log('   Created 4 geofence sites');

  // 9. Seed projects with tasks, team, and materials
  console.log('\n9. Seeding projects...');
  const seedProjects = [
    { name:'Porur Villa Project', client:'Mr. Rajesh Kumar', location:'Porur, Chennai', budget:4500000, status:'In Progress', startDate:'2025-08-15', targetDate:'2026-04-30',
      tasks:[{title:'Foundation work',priority:'High',assignedTo:'SS003',status:'Done',dueDate:'2025-11-30'},{title:'Structural framing',priority:'High',assignedTo:'SS005',status:'Done',dueDate:'2026-01-15'},{title:'Brickwork & plastering',priority:'Medium',assignedTo:'SS008',status:'In Progress',dueDate:'2026-03-15'},{title:'Electrical & plumbing',priority:'Medium',assignedTo:'SS010',status:'Pending',dueDate:'2026-04-10'},{title:'Painting & finishing',priority:'Low',assignedTo:'SS008',status:'Pending',dueDate:'2026-04-25'}],
      team:['SS003','SS005','SS008','SS010'],
      materials:[{name:'TMT Steel Bars',unit:'MT',total:50,used:32,remaining:18},{name:'Cement Bags',unit:'Bags',total:500,used:340,remaining:160},{name:'Sand',unit:'Cu.ft',total:200,used:145,remaining:55},{name:'Bricks',unit:'Nos',total:10000,used:7200,remaining:2800}]
    },
    { name:'Tambaram Warehouse', client:'ABC Logistics', location:'Tambaram, Chennai', budget:8500000, status:'Delayed', startDate:'2025-06-01', targetDate:'2026-06-30',
      tasks:[{title:'Site clearing & excavation',priority:'High',assignedTo:'SS014',status:'Done',dueDate:'2025-08-15'},{title:'Foundation & base slab',priority:'High',assignedTo:'SS015',status:'Done',dueDate:'2025-11-30'},{title:'Steel structure erection',priority:'High',assignedTo:'SS033',status:'In Progress',dueDate:'2026-03-31'},{title:'Roofing & cladding',priority:'Medium',assignedTo:'SS015',status:'Pending',dueDate:'2026-05-30'}],
      team:['SS014','SS015','SS033'],
      materials:[{name:'TMT Steel Bars',unit:'MT',total:80,used:45,remaining:35},{name:'Cement Bags',unit:'Bags',total:800,used:520,remaining:280},{name:'Ready Mix Concrete',unit:'Cu.m',total:300,used:180,remaining:120}]
    },
    { name:'PEB Factory Extension', client:'Swetha Structures', location:'Coimbatore', budget:3200000, status:'On Track', startDate:'2025-10-01', targetDate:'2026-03-31',
      tasks:[{title:'Design & approval',priority:'High',assignedTo:'SS001',status:'Done',dueDate:'2025-11-15'},{title:'Foundation work',priority:'High',assignedTo:'SS013',status:'Done',dueDate:'2025-12-31'},{title:'PEB fabrication',priority:'High',assignedTo:'SS026',status:'Done',dueDate:'2026-02-15'},{title:'Erection & commissioning',priority:'Medium',assignedTo:'SS036',status:'In Progress',dueDate:'2026-03-25'}],
      team:['SS001','SS013','SS026','SS036'],
      materials:[{name:'MS Plates',unit:'MT',total:30,used:18,remaining:12},{name:'Welding Rods',unit:'Kg',total:200,used:140,remaining:60},{name:'Paint',unit:'Ltr',total:100,used:35,remaining:65}]
    },
    { name:'Guduvanchery Residence', client:'Mrs. Priya Sharma', location:'Guduvanchery', budget:6000000, status:'In Progress', startDate:'2026-01-10', targetDate:'2026-08-31',
      tasks:[{title:'Soil testing & survey',priority:'High',assignedTo:'SS004',status:'Done',dueDate:'2026-01-25'},{title:'Foundation excavation',priority:'High',assignedTo:'SS039',status:'In Progress',dueDate:'2026-03-15'},{title:'RCC structure',priority:'High',assignedTo:'SS040',status:'Pending',dueDate:'2026-05-30'},{title:'Brickwork',priority:'Medium',assignedTo:'SS042',status:'Pending',dueDate:'2026-07-15'},{title:'Finishing & handover',priority:'Low',assignedTo:'SS004',status:'Pending',dueDate:'2026-08-25'}],
      team:['SS004','SS039','SS040','SS042'],
      materials:[{name:'PEB Sections',unit:'MT',total:120,used:75,remaining:45},{name:'Roofing Sheets',unit:'Sqm',total:500,used:320,remaining:180},{name:'Bolts & Nuts',unit:'Sets',total:2000,used:1400,remaining:600}]
    }
  ];
  for (const sp of seedProjects) {
    const pRes = await fetch(API_BASE + '/projects', { method: 'POST', headers: authHeaders, body: JSON.stringify(sp) });
    const proj = await pRes.json();
    if (proj && proj.id) {
      for (const t of (sp.tasks || [])) {
        await fetch(API_BASE + '/projects/' + proj.id + '/tasks', { method: 'POST', headers: authHeaders, body: JSON.stringify(t) });
      }
      for (const code of (sp.team || [])) {
        await fetch(API_BASE + '/projects/' + proj.id + '/team', { method: 'POST', headers: authHeaders, body: JSON.stringify({ empCode: code }) });
      }
      if (sp.materials && sp.materials.length > 0) {
        await fetch(API_BASE + '/projects/' + proj.id + '/materials/bulk', { method: 'POST', headers: authHeaders, body: JSON.stringify({ materials: sp.materials }) });
      }
    }
  }
  console.log('   Created ' + seedProjects.length + ' projects with tasks, team, and materials');

  console.log('\nSeed complete! Database is ready.');
  console.log('Login credentials:');
  console.log('  MD:       MD001 / admin123');
  console.log('  HR:       HR001 / hr123');
  console.log('  Employee: SS001 / emp123');
  console.log('  All others: [code] / emp123');
}

seed().catch(err => {
  console.error('Seed error:', err.message);
  process.exit(1);
});
