/**
 * Creates ACC001 on the live server via the API (no SSH needed).
 * Run from your local machine: node database/create-acc001-live.js
 */
const API = process.env.API_BASE || 'https://hrms.swethastructures.com/api';

async function run() {
  console.log('Connecting to:', API);

  // Step 1: Login as MD to get auth token
  const loginRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ empCode: 'MD001', password: 'admin123' })
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok) {
    console.error('MD login failed:', loginData);
    process.exit(1);
  }
  const token = loginData.token;
  console.log('MD login successful.');

  // Step 2: Call seed endpoint with only ACC001
  const seedRes = await fetch(`${API}/auth/seed`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      employees: [
        { code: 'ACC001', name: 'Accounts Admin', dept: 'Accounts', designation: 'Accounts Admin', salary: 0, bank: '', accNo: '', role: 'Accounts', phone: '', doj: '' }
      ],
      credentials: {
        'ACC001': { pass: 'acc123', idx: 0 }
      }
    })
  });
  const seedData = await seedRes.json();
  if (!seedRes.ok) {
    console.error('Seed failed:', seedData);
    process.exit(1);
  }

  console.log('Success:', seedData.message);
  console.log('\nLogin with:  ACC001 / acc123');
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
