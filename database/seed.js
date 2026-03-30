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

  // 10. Seed SiteTrack WBS tasks for project 1
  console.log('\n10. Seeding SiteTrack WBS tasks...');
  // Get project 1 ID (first created project)
  var projListRes = await fetch(API_BASE + '/projects', { method: 'GET', headers: authHeaders });
  var projList = await projListRes.json();
  var firstProjId = projList && projList.length > 0 ? projList[0].id : null;

  if (firstProjId) {
    var wbsTasks = [
      { wbsCode: '1', level: 1, taskName: 'Site Preparation', lead: 'SS003', startDate: '2025-08-15', endDate: '2025-09-30', plannedDays: 45, progressPct: 100, status: 'completed' },
      { wbsCode: '1.1', level: 2, taskName: 'Land Survey & Marking', lead: 'SS004', startDate: '2025-08-15', endDate: '2025-08-30', plannedDays: 15, progressPct: 100, status: 'completed' },
      { wbsCode: '1.2', level: 2, taskName: 'Excavation & Leveling', lead: 'SS005', startDate: '2025-09-01', endDate: '2025-09-30', plannedDays: 30, progressPct: 100, status: 'completed' },
      { wbsCode: '2', level: 1, taskName: 'Structure & Framing', lead: 'SS008', startDate: '2025-10-01', endDate: '2026-02-28', plannedDays: 150, progressPct: 65, status: 'in_progress' },
      { wbsCode: '2.1', level: 2, taskName: 'Foundation & Plinth', lead: 'SS010', startDate: '2025-10-01', endDate: '2025-12-15', plannedDays: 75, progressPct: 100, status: 'completed', actualStart: '2025-10-05', actualEnd: '2025-12-20' },
      { wbsCode: '2.2', level: 2, taskName: 'RCC Columns & Beams', lead: 'SS008', startDate: '2025-12-16', endDate: '2026-02-28', plannedDays: 75, progressPct: 40, status: 'in_progress', actualStart: '2025-12-22' }
    ];
    for (var wt of wbsTasks) {
      await fetch(API_BASE + '/sitetrack/projects/' + firstProjId + '/wbs', {
        method: 'POST', headers: authHeaders, body: JSON.stringify(wt)
      });
    }
    console.log('   Created 6 WBS tasks for project: ' + projList[0].name);

    // 11. Seed BOQ sheet + items for project 1
    console.log('\n11. Seeding BOQ sheet & items...');
    var boqSheetRes = await fetch(API_BASE + '/sitetrack/projects/' + firstProjId + '/boq', {
      method: 'POST', headers: authHeaders,
      body: JSON.stringify({ sheetType: 'civil', title: 'Civil Works - Porur Villa', areaSqft: 2400, quotedRate: 1875 })
    });
    var boqSheet = await boqSheetRes.json();
    if (boqSheet && boqSheet.id) {
      var boqItems = [
        { itemNo: 'A', description: 'EARTH WORK', isCategory: true },
        { itemNo: '1', description: 'Excavation for foundation', unit: 'Cu.m', plannedQty: 120, rate: 350 },
        { itemNo: '2', description: 'Sand filling in foundation', unit: 'Cu.m', plannedQty: 80, rate: 950 },
        { itemNo: 'B', description: 'CONCRETE WORK', isCategory: true },
        { itemNo: '3', description: 'PCC 1:4:8 for bed concrete', unit: 'Cu.m', plannedQty: 25, rate: 4500 },
        { itemNo: '4', description: 'RCC M25 for footings', unit: 'Cu.m', plannedQty: 45, rate: 6800 },
        { itemNo: '5', description: 'RCC M25 for columns', unit: 'Cu.m', plannedQty: 35, rate: 7200 }
      ];
      for (var bi of boqItems) {
        await fetch(API_BASE + '/sitetrack/boq/' + boqSheet.id + '/items', {
          method: 'POST', headers: authHeaders, body: JSON.stringify(bi)
        });
      }
      console.log('   Created 1 BOQ sheet with 7 items');
    }

    // 12. Seed daily work logs for project 1
    console.log('\n12. Seeding daily work logs...');
    var dailyLogs = [
      { logDate: '2026-03-22', weather: 'Sunny', workersCount: 12, workDescription: 'RCC column casting for ground floor - 4 columns completed. Steel binding for next set started.', materialsNote: '8 bags cement, 2MT steel used' },
      { logDate: '2026-03-23', weather: 'Cloudy', workersCount: 15, workDescription: 'Beam formwork installation for first floor. Electrical conduit placement in progress.', materialsNote: 'Plywood sheets for shuttering, PVC conduits', remarks: 'Minor delay due to material delivery' }
    ];
    for (var dl of dailyLogs) {
      await fetch(API_BASE + '/sitetrack/projects/' + firstProjId + '/daily-logs', {
        method: 'POST', headers: authHeaders, body: JSON.stringify(dl)
      });
    }
    console.log('   Created 2 daily work logs');
  }

  // ========================================
  // 13. Seed PEB Module Data (Store, Procurement)
  // ========================================
  console.log('\n13. Seeding PEB module data...');
  try {
    const mysql = require('mysql2/promise');
    const pebConn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hrms',
      multipleStatements: true
    });

    // Wait for auto-migration to create tables (server must be running)
    await new Promise(r => setTimeout(r, 2000));

    // Stock Items (20)
    await pebConn.query("ALTER TABLE peb_stock_items MODIFY COLUMN category VARCHAR(50) NOT NULL").catch(() => {});
    await pebConn.query(`INSERT IGNORE INTO peb_stock_items (item_code,item_name,category,unit,current_stock,min_stock_level,max_stock_level,unit_price,location) VALUES
      ('PEB-ITEM-001','C Purlin 150x65','RAW MATERIAL','METER',650,100,1000,85,'Warehouse A'),
      ('PEB-ITEM-002','GI Sheet 0.5mm','RAW MATERIAL','KG',2000,500,5000,72,'Warehouse A'),
      ('PEB-ITEM-003','GI Sheet 0.8mm','RAW MATERIAL','KG',1500,100,3000,78,'Warehouse A'),
      ('PEB-ITEM-004','MS Angle 50x50x6','RAW MATERIAL','METER',550,200,2000,65,'Warehouse B'),
      ('PEB-ITEM-005','MS Angle 75x75x8','RAW MATERIAL','METER',420,150,1500,95,'Warehouse B'),
      ('PEB-ITEM-006','Hex Bolt M16x50','HARDWARE','PIECE',3700,500,10000,12,'Rack H1'),
      ('PEB-ITEM-007','Hex Bolt M20x60','HARDWARE','PIECE',80,300,5000,18,'Rack H1'),
      ('PEB-ITEM-008','Grinding Disc 4in','TOOL','PIECE',125,50,200,45,'Tool Room'),
      ('PEB-ITEM-009','Cutting Disc 14in','TOOL','PIECE',55,20,100,120,'Tool Room'),
      ('PEB-ITEM-010','Polycarbonate Sheet 6mm','RAW MATERIAL','SQ_METER',65,30,200,250,'Warehouse C'),
      ('PEB-ITEM-011','Primer Paint 20L','CONSUMABLE','PIECE',12,10,50,1200,'Store'),
      ('PEB-ITEM-012','Welding Rod E7018 4mm','CONSUMABLE','KG',45,80,300,95,'Store'),
      ('PEB-ITEM-013','Ridge Cap Flashing','RAW MATERIAL','METER',180,50,500,110,'Warehouse A'),
      ('PEB-ITEM-014','J Bolt 12x150','HARDWARE','PIECE',850,200,5000,8,'Rack H2'),
      ('PEB-ITEM-015','Self Drilling Screw 12x35','HARDWARE','PIECE',5200,1000,20000,3,'Rack H3'),
      ('PEB-ITEM-016','Turbo Ventilator 24in','OTHER','PIECE',8,5,20,2800,'Warehouse C'),
      ('PEB-ITEM-017','Insulation Sheet 50mm','RAW MATERIAL','SQ_METER',45,100,500,180,'Warehouse B'),
      ('PEB-ITEM-018','Gutter PVC 6in','OTHER','METER',60,40,200,320,'Warehouse C'),
      ('PEB-ITEM-019','Safety Harness Full Body','SAFETY','PIECE',15,10,50,1500,'Safety Store'),
      ('PEB-ITEM-020','Base Plate 300x300x12','RAW MATERIAL','PIECE',30,50,200,420,'Warehouse B')`);

    // Stock Transactions
    await pebConn.query(`INSERT IGNORE INTO peb_stock_transactions (type,item_id,quantity,unit_cost,notes,created_by,created_at) VALUES
      ('GRN',1,200,85,'From JSW Steel',1,'2026-03-25 10:00:00'),
      ('GRN',2,500,72,'From Tata Steel',1,'2026-03-25 11:00:00'),
      ('MIS',6,150,12,'Issued to Site A',1,'2026-03-26 09:00:00'),
      ('MIS',7,80,18,'Issued to Site B',1,'2026-03-26 10:00:00'),
      ('GRN',12,100,95,'Welding rod restock',1,'2026-03-27 08:30:00'),
      ('MIS',4,100,65,'Site C requirement',1,'2026-03-27 14:00:00'),
      ('MIS',8,25,45,'Grinding disc for Site A',1,'2026-03-28 09:00:00'),
      ('MRT',1,50,85,'Excess return from Site B',1,'2026-03-28 16:00:00')`);

    // Vendors (6)
    await pebConn.query("ALTER TABLE peb_vendors ADD COLUMN status VARCHAR(20) DEFAULT 'ACTIVE'").catch(() => {});
    await pebConn.query(`INSERT IGNORE INTO peb_vendors (vendor_code,company_name,contact_person,phone,gst_number,pan_number,rating,status) VALUES
      ('VND-001','JSW Steel Dealers','Arun Kumar','9100000001','33AABCZ1234A1Z5','AABCZ1234A',4.5,'ACTIVE'),
      ('VND-002','Sri Balaji Hardware','Balaji S','9100000002','33ABCS5678B1Z9','ABCS5678B1',4.2,'ACTIVE'),
      ('VND-003','Metro Roofing Supplies','Venkat R','9100000003','33AABCM912C1Z3','AABCM912C1',3.8,'ACTIVE'),
      ('VND-004','Kumar Fasteners Pvt Ltd','Santhi K','9100000004','33AABCK345G1Z7','AABCK345G1',4.0,'ACTIVE'),
      ('VND-005','Chennai Welding Works','Prakash M','9100000005','33AABCT890E1Z1','AABCT890E1',3.5,'ACTIVE'),
      ('VND-006','Tata Structure Dealers','Ramesh N','9100000006','33AABCT111F1Z5','AABCT111F1',4.8,'ACTIVE')`);

    // GRN
    await pebConn.query(`INSERT IGNORE INTO peb_grn (grn_number,vendor_id,invoice_number,received_date,quality_status,created_by) VALUES
      ('GRN-2026-0001',1,'INV-JSW-4523','2026-03-12','PASSED',1),
      ('GRN-2026-0002',2,'INV-SBH-1102','2026-03-16','PASSED',1),
      ('GRN-2026-0003',4,'INV-KF-7788','2026-03-20','PARTIAL',1),
      ('GRN-2026-0004',6,'INV-TATA-3303','2026-03-23','PASSED',1)`);
    await pebConn.query(`INSERT IGNORE INTO peb_grn_items (grn_id,item_id,received_qty,accepted_qty,unit_cost) VALUES
      (1,1,200,200,85),(1,4,100,100,65),(2,6,500,500,12),(2,7,300,300,18),(3,14,1000,950,8),(4,2,1000,1000,72)`);

    // Material Requests
    await pebConn.query(`INSERT IGNORE INTO peb_material_requests (request_code,requested_by,site_name,urgency,stage,purpose) VALUES
      ('MRQ-2026-0001',1,'Site A - Kamarajar Port','URGENT','DISPATCHED','Roofing material for bay 3'),
      ('MRQ-2026-0002',1,'Site B - Ambattur','NORMAL','APPROVED','Foundation bolts'),
      ('MRQ-2026-0003',1,'Site B - Ambattur','URGENT','DISPATCHED','Emergency welding rods'),
      ('MRQ-2026-0004',1,'Site C - Sriperumbudur','NORMAL','REQUESTED','Insulation sheets'),
      ('MRQ-2026-0005',1,'Site A - Kamarajar Port','NORMAL','CLOSED','Safety equipment')`);
    await pebConn.query(`INSERT IGNORE INTO peb_material_request_items (request_id,item_id,requested_qty,approved_qty,issued_qty) VALUES
      (1,2,200,200,200),(1,13,50,50,50),(2,6,500,500,0),(2,14,200,200,0),(3,12,50,50,50),(4,17,100,NULL,0),(5,19,5,5,5)`);

    // Material Returns
    await pebConn.query(`INSERT IGNORE INTO peb_material_returns (mrn_code,site_name,returned_by,returned_by_name,return_date,status) VALUES
      ('MRN-2026-0001','Site A - Kamarajar Port',1,'Site Supervisor A','2026-03-25','VERIFIED'),
      ('MRN-2026-0002','Site B - Ambattur',1,'Site Supervisor B','2026-03-26','PENDING')`);

    // Scrap
    await pebConn.query(`INSERT IGNORE INTO peb_scrap_batches (batch_code,total_weight,status,sale_amount,created_by) VALUES
      ('SCR-2026-0001',250,'COLLECTED',0,1),('SCR-2026-0002',180,'SOLD',14400,1)`);

    // Purchase Indents
    await pebConn.query(`INSERT IGNORE INTO peb_purchase_indents (indent_code,requested_by,requested_by_name,urgency,reason,status) VALUES
      ('PI-2026-0001',1,'Admin (MD)','URGENT','MS Angles running low','PO_CREATED'),
      ('PI-2026-0002',1,'Admin (MD)','ROUTINE','Regular restock of hardware','GM_APPROVED'),
      ('PI-2026-0003',1,'Admin (MD)','CRITICAL','Welding rods critically low','COMPARISON_READY'),
      ('PI-2026-0004',1,'Admin (MD)','ROUTINE','Insulation for roofing project','QUOTATION_PENDING')`);
    await pebConn.query(`INSERT IGNORE INTO peb_indent_items (indent_id,item_id,qty,specification,estimated_cost,current_stock_qty) VALUES
      (1,4,500,'50x50x6mm',32500,550),(1,5,300,'75x75x8mm',28500,420),
      (2,6,2000,'M16x50 Grade 8.8',24000,3700),(2,14,1000,'J Bolt 12x150',8000,850),
      (3,12,200,'E7018 4mm AWS',19000,45),(4,17,300,'50mm thick PUF',54000,45)`);

    // Vendor Quotations for indent 3
    await pebConn.query(`INSERT IGNORE INTO peb_vendor_quotations (indent_id,vendor_id,quotation_date,delivery_lead_days,payment_terms,total_value,transport_cost,landed_cost,transport_included) VALUES
      (3,5,'2026-03-25',7,'Net 15',19000,1500,20500,0),
      (3,1,'2026-03-25',10,'Net 30',18500,2000,20500,0),
      (3,4,'2026-03-25',5,'Advance',21000,0,21000,1)`);

    // Purchase Orders
    await pebConn.query(`INSERT IGNORE INTO peb_purchase_orders (po_number,indent_id,vendor_id,total_amount,total_paid,balance_due,status,created_by) VALUES
      ('PO-2026-0001',1,6,121000,50000,71000,'SENT',1),
      ('PO-2026-0002',NULL,1,85000,85000,0,'SENT',1)`);
    await pebConn.query(`INSERT IGNORE INTO peb_po_items (po_id,item_id,qty,unit_price,total_price) VALUES
      (1,4,500,65,32500),(1,5,300,95,28500),(1,1,200,85,17000),(1,2,500,72,36000),(1,13,100,70,7000),
      (2,2,1000,72,72000),(2,3,200,78,15600)`);
    await pebConn.query(`INSERT IGNORE INTO peb_po_payments (po_id,amount,payment_date,mode,reference,recorded_by) VALUES
      (1,50000,'2026-03-21','BANK_TRANSFER','UTR-2026-001',1),
      (2,50000,'2026-03-18','BANK_TRANSFER','UTR-2026-002',1),
      (2,35000,'2026-03-23','UPI','UPI-TX-A001',1)`);

    // Transport
    await pebConn.query(`INSERT IGNORE INTO peb_transport_requests (request_code,requested_by,type,origin_name,destination_name,scheduled_date,vehicle_type,status,vehicle_number,driver_name,driver_phone,actual_km,transport_cost,delivery_condition) VALUES
      ('TRQ-2026-0001',1,'COMPANY_TO_SITE','Head Office Store','Site A - Kamarajar Port','2026-03-25','LORRY','DELIVERED','TN-01-AB-1234','Murugan','9876543210',45,3500,'GOOD'),
      ('TRQ-2026-0002',1,'SITE_TO_COMPANY','Site A - Kamarajar Port','Head Office Store','2026-03-24','MINI_TRUCK','IN_TRANSIT','TN-01-CD-5678','Ravi','9876543211',NULL,NULL,NULL),
      ('TRQ-2026-0003',1,'COMPANY_TO_SITE','Head Office Store','Site B - Ambattur','2026-03-28','LORRY','APPROVED','TN-09-EF-9012','Kumar','9876543212',NULL,NULL,NULL),
      ('TRQ-2026-0004',1,'SITE_TO_SITE','Site A - Kamarajar Port','Site D - Hosur','2026-04-01','TRAILER','REQUESTED',NULL,NULL,NULL,NULL,NULL,NULL),
      ('TRQ-2026-0005',1,'SITE_TO_SCRAP','Site A - Kamarajar Port','Chennai Scrap Yard','2026-04-05','PICKUP','REQUESTED',NULL,NULL,NULL,NULL,NULL,NULL)`);

    await pebConn.end();
    console.log('   PEB data seeded: 20 stock items, 6 vendors, 4 GRNs, 5 material requests, 4 indents, 2 POs, 5 transport requests');
  } catch (pebErr) {
    console.log('   PEB seed skipped (tables may not exist yet):', pebErr.message.substring(0, 80));
  }

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
