const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, requireRole, requireRoleOrDept } = require('../middleware/auth');
const SITE_DEPTS = ['Site Engineer']; // Departments with PEB store access (stock, material request, returns, scrap, transport)
const ADMIN_DEPTS = ['Admin', 'Site Engineer', 'Accounts']; // Departments with full PEB access (dashboard, inventory, procurement)

// ========================================
// HELPERS (ported from PEB utils)
// ========================================
async function generateCode(prefix, table, column) {
  const yr = new Date().getFullYear();
  const pat = `${prefix}-${yr}-%`;
  const [rows] = await db.query(`SELECT ${column} FROM ${table} WHERE ${column} LIKE ? ORDER BY id DESC LIMIT 1`, [pat]);
  if (rows.length === 0) return `${prefix}-${yr}-0001`;
  const n = parseInt(rows[0][column].split('-').pop(), 10);
  return `${prefix}-${yr}-${String(n + 1).padStart(4, '0')}`;
}
async function generateSimpleCode(prefix, table, column) {
  const [rows] = await db.query(`SELECT ${column} FROM ${table} ORDER BY id DESC LIMIT 1`);
  if (rows.length === 0) return `${prefix}-001`;
  const n = parseInt(rows[0][column].split('-').pop(), 10);
  return `${prefix}-${String(n + 1).padStart(3, '0')}`;
}

// ========================================
// AUTO-MIGRATE
// ========================================
(async function migrate() {
  try {
    // Stock items master
    await db.query(`CREATE TABLE IF NOT EXISTS peb_stock_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      item_code VARCHAR(30) UNIQUE NOT NULL,
      item_name VARCHAR(150) NOT NULL,
      category VARCHAR(50) NOT NULL,
      sub_category VARCHAR(100),
      unit VARCHAR(20) NOT NULL,
      hsn_code VARCHAR(20),
      current_stock DECIMAL(12,2) DEFAULT 0,
      min_stock_level DECIMAL(12,2) DEFAULT 0,
      max_stock_level DECIMAL(12,2) DEFAULT 0,
      unit_price DECIMAL(12,2) DEFAULT 0,
      location VARCHAR(100),
      last_updated_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    // Stock transactions ledger
    await db.query(`CREATE TABLE IF NOT EXISTS peb_stock_transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      type VARCHAR(10) NOT NULL,
      item_id INT NOT NULL,
      quantity DECIMAL(12,2) NOT NULL,
      unit_cost DECIMAL(12,2) DEFAULT 0,
      site_id INT,
      reference_id INT,
      reference_type VARCHAR(50),
      notes TEXT,
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // GRN header
    await db.query(`CREATE TABLE IF NOT EXISTS peb_grn (
      id INT AUTO_INCREMENT PRIMARY KEY,
      grn_number VARCHAR(30) UNIQUE NOT NULL,
      po_id INT,
      vendor_id INT,
      invoice_number VARCHAR(50),
      invoice_date DATE,
      received_date DATE,
      quality_status VARCHAR(20) DEFAULT 'PASSED',
      quality_remarks TEXT,
      invoice_photo_url VARCHAR(500),
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // GRN items
    await db.query(`CREATE TABLE IF NOT EXISTS peb_grn_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      grn_id INT NOT NULL,
      item_id INT NOT NULL,
      po_qty DECIMAL(12,2),
      received_qty DECIMAL(12,2) NOT NULL,
      accepted_qty DECIMAL(12,2),
      unit_cost DECIMAL(12,2) DEFAULT 0,
      quality_status VARCHAR(20) DEFAULT 'PASSED'
    )`);

    // Material request header
    await db.query(`CREATE TABLE IF NOT EXISTS peb_material_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      request_code VARCHAR(30) UNIQUE NOT NULL,
      requested_by INT,
      site_id INT,
      site_name VARCHAR(200),
      project_name VARCHAR(200),
      required_by DATE,
      urgency VARCHAR(20) DEFAULT 'NORMAL',
      purpose TEXT,
      stage VARCHAR(30) DEFAULT 'REQUESTED',
      store_remarks TEXT,
      dispatched_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    // Material request items
    await db.query(`CREATE TABLE IF NOT EXISTS peb_material_request_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      request_id INT NOT NULL,
      item_id INT NOT NULL,
      requested_qty DECIMAL(12,2) NOT NULL,
      approved_qty DECIMAL(12,2),
      issued_qty DECIMAL(12,2) DEFAULT 0,
      batch_no VARCHAR(50)
    )`);

    // Material return notes
    await db.query(`CREATE TABLE IF NOT EXISTS peb_material_returns (
      id INT AUTO_INCREMENT PRIMARY KEY,
      mrn_code VARCHAR(30) UNIQUE NOT NULL,
      site_id INT,
      site_name VARCHAR(200),
      returned_by INT,
      returned_by_name VARCHAR(100),
      return_date DATE,
      status VARCHAR(20) DEFAULT 'PENDING',
      verified_by_store INT,
      verified_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Return items with condition
    await db.query(`CREATE TABLE IF NOT EXISTS peb_return_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      mrn_id INT NOT NULL,
      item_id INT NOT NULL,
      returned_qty DECIMAL(12,2) NOT NULL,
      usable_qty DECIMAL(12,2) DEFAULT 0,
      scrap_qty DECIMAL(12,2) DEFAULT 0,
      \`condition\` VARCHAR(20) DEFAULT 'GOOD',
      condition_notes TEXT
    )`);

    // Scrap batches
    await db.query(`CREATE TABLE IF NOT EXISTS peb_scrap_batches (
      id INT AUTO_INCREMENT PRIMARY KEY,
      batch_code VARCHAR(30) UNIQUE NOT NULL,
      total_weight DECIMAL(12,2) DEFAULT 0,
      status VARCHAR(20) DEFAULT 'COLLECTED',
      sale_amount DECIMAL(14,2) DEFAULT 0,
      sale_date DATE,
      receipt_number VARCHAR(50),
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    // Scrap items
    await db.query(`CREATE TABLE IF NOT EXISTS peb_scrap_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      batch_id INT NOT NULL,
      item_id INT,
      qty DECIMAL(12,2) DEFAULT 0,
      weight DECIMAL(12,2) DEFAULT 0,
      estimated_value DECIMAL(14,2) DEFAULT 0
    )`);

    console.log('[PEB-STORE] All tables ready');

    // Auto-seed if empty
    const [[{ cnt }]] = await db.query('SELECT COUNT(*) as cnt FROM peb_stock_items');
    if (cnt === 0) {
      console.log('[PEB-STORE] Empty tables — auto-seeding...');
      await db.query(`INSERT INTO peb_stock_items (item_code,item_name,category,unit,current_stock,min_stock_level,max_stock_level,unit_price,location) VALUES
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
      await db.query(`INSERT INTO peb_stock_transactions (type,item_id,quantity,unit_cost,notes,created_by,created_at) VALUES
        ('GRN',1,200,85,'From JSW Steel',1,NOW()-INTERVAL 5 DAY),('GRN',2,500,72,'From Tata Steel',1,NOW()-INTERVAL 5 DAY),
        ('MIS',6,150,12,'Issued to Site A',1,NOW()-INTERVAL 4 DAY),('MIS',7,80,18,'Issued to Site B',1,NOW()-INTERVAL 4 DAY),
        ('GRN',12,100,95,'Welding rod restock',1,NOW()-INTERVAL 3 DAY),('MIS',4,100,65,'Site C requirement',1,NOW()-INTERVAL 3 DAY),
        ('MIS',8,25,45,'Grinding disc for Site A',1,NOW()-INTERVAL 2 DAY),('MRT',1,50,85,'Excess return from Site B',1,NOW()-INTERVAL 2 DAY)`);
      await db.query(`INSERT INTO peb_grn (grn_number,vendor_id,invoice_number,received_date,quality_status,created_by) VALUES
        ('GRN-2026-0001',1,'INV-JSW-4523',CURDATE()-INTERVAL 18 DAY,'PASSED',1),
        ('GRN-2026-0002',2,'INV-SBH-1102',CURDATE()-INTERVAL 14 DAY,'PASSED',1),
        ('GRN-2026-0003',4,'INV-KF-7788',CURDATE()-INTERVAL 10 DAY,'PARTIAL',1),
        ('GRN-2026-0004',6,'INV-TATA-3303',CURDATE()-INTERVAL 7 DAY,'PASSED',1)`).catch(()=>{});
      await db.query(`INSERT INTO peb_grn_items (grn_id,item_id,received_qty,accepted_qty,unit_cost) VALUES
        (1,1,200,200,85),(1,4,100,100,65),(2,6,500,500,12),(2,7,300,300,18),(3,14,1000,950,8),(4,2,1000,1000,72)`).catch(()=>{});
      await db.query(`INSERT INTO peb_material_requests (request_code,requested_by,site_name,urgency,stage,purpose) VALUES
        ('MRQ-2026-0001',1,'Site A - Kamarajar Port','URGENT','DISPATCHED','Roofing material for bay 3'),
        ('MRQ-2026-0002',1,'Site B - Ambattur','NORMAL','APPROVED','Foundation bolts'),
        ('MRQ-2026-0003',1,'Site B - Ambattur','URGENT','DISPATCHED','Emergency welding rods'),
        ('MRQ-2026-0004',1,'Site C - Sriperumbudur','NORMAL','REQUESTED','Insulation sheets'),
        ('MRQ-2026-0005',1,'Site A - Kamarajar Port','NORMAL','CLOSED','Safety equipment')`).catch(()=>{});
      await db.query(`INSERT INTO peb_material_request_items (request_id,item_id,requested_qty,approved_qty,issued_qty) VALUES
        (1,2,200,200,200),(1,13,50,50,50),(2,6,500,500,0),(2,14,200,200,0),(3,12,50,50,50),(4,17,100,NULL,0),(5,19,5,5,5)`).catch(()=>{});
      await db.query(`INSERT INTO peb_material_returns (mrn_code,site_name,returned_by,returned_by_name,return_date,status) VALUES
        ('MRN-2026-0001','Site A',1,'Supervisor A',CURDATE()-INTERVAL 5 DAY,'VERIFIED'),
        ('MRN-2026-0002','Site B',1,'Supervisor B',CURDATE()-INTERVAL 4 DAY,'PENDING')`).catch(()=>{});
      await db.query(`INSERT INTO peb_scrap_batches (batch_code,total_weight,status,sale_amount,created_by) VALUES
        ('SCR-2026-0001',250,'COLLECTED',0,1),('SCR-2026-0002',180,'SOLD',14400,1)`).catch(()=>{});
      console.log('[PEB-STORE] Auto-seed complete');
    }
  } catch (e) {
    console.error('[PEB-STORE] Migration:', e.message);
  }
})();

// ========================================
// DASHBOARD
// ========================================
router.get('/dashboard', verifyToken, requireRoleOrDept(['MD', 'HR'], ADMIN_DEPTS), async (req, res) => {
  try {
    const [[{ totalItems }]] = await db.query('SELECT COUNT(*) as totalItems FROM peb_stock_items');
    const [[{ lowStock }]] = await db.query('SELECT COUNT(*) as lowStock FROM peb_stock_items WHERE current_stock <= min_stock_level AND min_stock_level > 0');
    const [[{ pendingRequests }]] = await db.query("SELECT COUNT(*) as pendingRequests FROM peb_material_requests WHERE stage IN ('REQUESTED','APPROVED')");
    const [[{ pendingTransport }]] = await db.query("SELECT COUNT(*) as pendingTransport FROM peb_transport_requests WHERE status = 'REQUESTED'");
    const [pendingTransportList] = await db.query("SELECT * FROM peb_transport_requests WHERE status = 'REQUESTED' ORDER BY created_at DESC LIMIT 10");
    const [lowStockItems] = await db.query('SELECT item_name, item_code, current_stock, min_stock_level, unit FROM peb_stock_items WHERE current_stock <= min_stock_level AND min_stock_level > 0 ORDER BY (current_stock / min_stock_level) ASC LIMIT 10');
    const [recentTransactions] = await db.query(
      `SELECT st.type, st.quantity, st.unit_cost, st.created_at, si.item_name, si.unit
       FROM peb_stock_transactions st LEFT JOIN peb_stock_items si ON st.item_id = si.id
       ORDER BY st.created_at DESC LIMIT 10`
    );
    const [categoryBreakdown] = await db.query('SELECT category, COUNT(*) as count, SUM(current_stock) as total_stock FROM peb_stock_items GROUP BY category');
    res.json({ totalItems, lowStock, pendingRequests, pendingTransport, pendingTransportList, lowStockItems, recentTransactions, categoryBreakdown });
  } catch (err) {
    console.error('[PEB] Dashboard error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ========================================
// STOCK ITEMS
// ========================================
router.get('/items', verifyToken, requireRole('MD', 'HR', 'Employee'), async (req, res) => {
  try {
    const { category, search, low_stock } = req.query;
    let q = 'SELECT * FROM peb_stock_items WHERE 1=1';
    const p = [];
    if (category) { q += ' AND category = ?'; p.push(category); }
    if (search) { q += ' AND (item_name LIKE ? OR item_code LIKE ?)'; p.push(`%${search}%`, `%${search}%`); }
    if (low_stock === 'true') { q += ' AND current_stock <= min_stock_level AND min_stock_level > 0'; }
    q += ' ORDER BY item_name';
    const [items] = await db.query(q, p);
    res.json(items);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/items/:id', verifyToken, requireRole('MD', 'HR', 'Employee'), async (req, res) => {
  try {
    const [item] = await db.query('SELECT * FROM peb_stock_items WHERE id = ?', [req.params.id]);
    if (item.length === 0) return res.status(404).json({ error: 'Item not found' });
    const [ledger] = await db.query(
      `SELECT st.*, si.item_name FROM peb_stock_transactions st
       LEFT JOIN peb_stock_items si ON st.item_id = si.id
       WHERE st.item_id = ? ORDER BY st.created_at DESC`, [req.params.id]
    );
    res.json({ ...item[0], ledger });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/items', verifyToken, requireRoleOrDept(['MD', 'HR'], ADMIN_DEPTS), async (req, res) => {
  try {
    const { item_name, category, sub_category, unit, hsn_code, current_stock, min_stock_level, max_stock_level, unit_price, location } = req.body;
    if (!item_name || !category || !unit) return res.status(400).json({ error: 'item_name, category, unit required' });
    const item_code = await generateSimpleCode('PEB-ITEM', 'peb_stock_items', 'item_code');
    const stockQty = current_stock || 0;
    const [result] = await db.query(
      'INSERT INTO peb_stock_items (item_code,item_name,category,sub_category,unit,hsn_code,current_stock,min_stock_level,max_stock_level,unit_price,location,last_updated_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      [item_code, item_name, category, sub_category||null, unit, hsn_code||null, stockQty, min_stock_level||0, max_stock_level||0, unit_price||0, location||null, req.user.empCode]
    );
    // Log opening balance transaction if stock > 0
    if (stockQty > 0) {
      await db.query(
        'INSERT INTO peb_stock_transactions (item_id,type,quantity,notes,created_by) VALUES (?,?,?,?,?)',
        [result.insertId, 'OPB', stockQty, 'Opening balance on item creation', req.user.empCode]
      );
    }
    res.status(201).json({ id: result.insertId, item_code, message: 'Stock item created' });
  } catch (err) {
    console.error('[PEB-STORE] Item creation error:', err.message);
    const msg = err.code === 'ER_DUP_ENTRY' ? 'Item with this code already exists' : 'Failed to create stock item';
    res.status(500).json({ error: msg });
  }
});

router.put('/items/:id', verifyToken, requireRoleOrDept(['MD', 'HR'], ADMIN_DEPTS), async (req, res) => {
  try {
    const [old] = await db.query('SELECT * FROM peb_stock_items WHERE id = ?', [req.params.id]);
    if (old.length === 0) return res.status(404).json({ error: 'Item not found' });
    const { item_name, category, sub_category, unit, hsn_code, current_stock, min_stock_level, max_stock_level, unit_price, location } = req.body;
    await db.query(
      'UPDATE peb_stock_items SET item_name=?,category=?,sub_category=?,unit=?,hsn_code=?,current_stock=?,min_stock_level=?,max_stock_level=?,unit_price=?,location=?,last_updated_by=? WHERE id=?',
      [item_name||old[0].item_name, category||old[0].category, sub_category??old[0].sub_category, unit||old[0].unit,
       hsn_code??old[0].hsn_code, current_stock??old[0].current_stock, min_stock_level??old[0].min_stock_level, max_stock_level??old[0].max_stock_level,
       unit_price??old[0].unit_price, location??old[0].location, req.user.empCode, req.params.id]
    );
    // Log adjustment if stock was manually changed
    if (current_stock !== undefined && current_stock !== null && Number(current_stock) !== Number(old[0].current_stock)) {
      const diff = Number(current_stock) - Number(old[0].current_stock);
      await db.query(
        'INSERT INTO peb_stock_transactions (item_id,type,quantity,notes,created_by) VALUES (?,?,?,?,?)',
        [req.params.id, 'ADJ', diff, 'Manual stock adjustment via edit (was ' + old[0].current_stock + ', now ' + current_stock + ')', req.user.empCode]
      );
    }
    res.json({ message: 'Item updated' });
  } catch (err) {
    console.error('[PEB-STORE] Item update error:', err.message);
    res.status(500).json({ error: 'Failed to update stock item' });
  }
});

// ========================================
// STOCK TRANSACTIONS (manual entry)
// ========================================
router.post('/transactions', verifyToken, requireRoleOrDept(['MD', 'HR'], SITE_DEPTS), async (req, res) => {
  try {
    const { type, item_id, quantity, unit_cost, notes } = req.body;
    if (!type || !item_id || quantity === undefined) return res.status(400).json({ error: 'type, item_id, quantity required' });

    const [result] = await db.query(
      'INSERT INTO peb_stock_transactions (type,item_id,quantity,unit_cost,notes,created_by) VALUES (?,?,?,?,?,?)',
      [type, item_id, quantity, unit_cost||0, notes||null, req.user.empCode]
    );

    // Update current_stock
    const inTypes = ['GRN','MRT','ADJ','OPB'];
    const stockChange = inTypes.includes(type) ? Math.abs(quantity) : -Math.abs(quantity);
    await db.query('UPDATE peb_stock_items SET current_stock = current_stock + ?, last_updated_by = ? WHERE id = ?', [stockChange, req.user.empCode, item_id]);

    const [item] = await db.query('SELECT * FROM peb_stock_items WHERE id = ?', [item_id]);
    res.status(201).json({ id: result.insertId, message: 'Transaction recorded', new_stock: item[0]?.current_stock });
  } catch (err) {
    console.error('[PEB-STORE] Transaction error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ========================================
// GRN (Goods Receipt Note) — TRANSACTIONAL
// ========================================
router.get('/grn', verifyToken, requireRoleOrDept(['MD', 'HR'], ADMIN_DEPTS), async (req, res) => {
  try {
    const [grns] = await db.query(
      `SELECT g.*, v.company_name as vendor_name FROM peb_grn g
       LEFT JOIN peb_vendors v ON g.vendor_id = v.id ORDER BY g.created_at DESC`
    );
    res.json(grns);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/grn/:id', verifyToken, requireRoleOrDept(['MD', 'HR'], ADMIN_DEPTS), async (req, res) => {
  try {
    const [grn] = await db.query(
      `SELECT g.*, v.company_name as vendor_name FROM peb_grn g LEFT JOIN peb_vendors v ON g.vendor_id = v.id WHERE g.id = ?`, [req.params.id]
    );
    if (grn.length === 0) return res.status(404).json({ error: 'GRN not found' });
    const [items] = await db.query(
      `SELECT gi.*, si.item_name, si.item_code, si.unit FROM peb_grn_items gi LEFT JOIN peb_stock_items si ON gi.item_id = si.id WHERE gi.grn_id = ?`, [req.params.id]
    );
    res.json({ ...grn[0], items });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/grn', verifyToken, requireRoleOrDept(['MD', 'HR'], ADMIN_DEPTS), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { vendor_id, po_id, invoice_number, invoice_date, received_date, quality_status, quality_remarks, invoice_photo_url, items } = req.body;
    if (!vendor_id || !received_date || !items || items.length === 0) return res.status(400).json({ error: 'vendor_id, received_date, items required' });

    const grn_number = await generateCode('GRN', 'peb_grn', 'grn_number');
    const [grnResult] = await conn.query(
      'INSERT INTO peb_grn (grn_number,po_id,vendor_id,invoice_number,invoice_date,received_date,quality_status,quality_remarks,invoice_photo_url,created_by) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [grn_number, po_id||null, vendor_id, invoice_number||null, invoice_date||null, received_date, quality_status||'PASSED', quality_remarks||null, invoice_photo_url||null, req.user.empCode]
    );

    for (const item of items) {
      const accepted = item.accepted_qty || item.received_qty;
      await conn.query('INSERT INTO peb_grn_items (grn_id,item_id,po_qty,received_qty,accepted_qty,unit_cost,quality_status) VALUES (?,?,?,?,?,?,?)',
        [grnResult.insertId, item.item_id, item.po_qty||null, item.received_qty, accepted, item.unit_cost||0, item.quality_status||'PASSED']);

      // Add stock transaction + update stock
      await conn.query('INSERT INTO peb_stock_transactions (type,item_id,quantity,unit_cost,reference_id,reference_type,created_by) VALUES ("GRN",?,?,?,?,"grn",?)',
        [item.item_id, accepted, item.unit_cost||0, grnResult.insertId, req.user.empCode]);
      await conn.query('UPDATE peb_stock_items SET current_stock = current_stock + ?, last_updated_by = ? WHERE id = ?',
        [accepted, req.user.empCode, item.item_id]);
    }

    await conn.commit();
    res.status(201).json({ id: grnResult.insertId, grn_number, message: 'GRN created and stock updated' });
  } catch (err) {
    await conn.rollback();
    console.error('[PEB-STORE] GRN error:', err);
    res.status(500).json({ error: 'Server error' });
  } finally { conn.release(); }
});

// ========================================
// MATERIAL REQUESTS — Full workflow
// ========================================
router.get('/material-requests', verifyToken, requireRole('MD', 'HR', 'Employee'), async (req, res) => {
  try {
    const { status } = req.query;
    let q = 'SELECT * FROM peb_material_requests WHERE 1=1';
    const p = [];
    if (status) { q += ' AND stage = ?'; p.push(status); }
    q += ' ORDER BY created_at DESC';
    const [rows] = await db.query(q, p);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/material-requests/:id', verifyToken, requireRole('MD', 'HR', 'Employee'), async (req, res) => {
  try {
    const [req_] = await db.query('SELECT * FROM peb_material_requests WHERE id = ?', [req.params.id]);
    if (req_.length === 0) return res.status(404).json({ error: 'Not found' });
    const [items] = await db.query(
      `SELECT mri.*, si.item_name, si.item_code, si.current_stock, si.unit
       FROM peb_material_request_items mri LEFT JOIN peb_stock_items si ON mri.item_id = si.id
       WHERE mri.request_id = ?`, [req.params.id]
    );
    res.json({ ...req_[0], items });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/material-requests', verifyToken, requireRole('MD', 'HR', 'Employee'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { site_name, project_name, required_by, urgency, purpose, items } = req.body;
    if (!site_name || !items || items.length === 0) return res.status(400).json({ error: 'site_name and items required' });

    const request_code = await generateCode('MRQ', 'peb_material_requests', 'request_code');
    const [result] = await conn.query(
      'INSERT INTO peb_material_requests (request_code,requested_by,site_name,project_name,required_by,urgency,purpose) VALUES (?,?,?,?,?,?,?)',
      [request_code, req.user.empCode, site_name, project_name||null, required_by||null, urgency||'NORMAL', purpose||null]
    );

    for (const item of items) {
      await conn.query('INSERT INTO peb_material_request_items (request_id,item_id,requested_qty) VALUES (?,?,?)',
        [result.insertId, item.item_id, item.requested_qty]);
    }

    await conn.commit();
    res.status(201).json({ id: result.insertId, request_code, message: 'Material request created' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: 'Server error' });
  } finally { conn.release(); }
});

// Approve material request
// Admin accepts material request → forwards to MD for final approval
router.post('/material-requests/:id/admin-accept', verifyToken, requireRoleOrDept(['HR'], ADMIN_DEPTS), async (req, res) => {
  try {
    const { remarks, items } = req.body;
    const [rows] = await db.query('SELECT * FROM peb_material_requests WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Request not found' });
    if (rows[0].stage !== 'REQUESTED') return res.status(400).json({ error: 'Request is already ' + rows[0].stage });

    await db.query('UPDATE peb_material_requests SET stage = "ADMIN_ACCEPTED", store_remarks = ? WHERE id = ?', [remarks || null, req.params.id]);

    if (items) {
      for (const item of items) {
        await db.query('UPDATE peb_material_request_items SET approved_qty = ? WHERE id = ?', [item.approved_qty, item.id]);
      }
    }

    const io = req.app.get('io');
    if (io) {
      io.to('role:MD').emit('materialRequest:pendingApproval', { id: parseInt(req.params.id), code: rows[0].request_code });
    }

    res.json({ message: 'Request accepted by Admin, forwarded to MD for approval' });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// MD gives final approval for material request
router.post('/material-requests/:id/approve', verifyToken, requireRoleOrDept(['MD'], []), async (req, res) => {
  try {
    const { action, remarks, items } = req.body;
    if (!['APPROVED','REJECTED'].includes(action)) return res.status(400).json({ error: 'action must be APPROVED or REJECTED' });

    const [rows] = await db.query('SELECT * FROM peb_material_requests WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Request not found' });
    if (rows[0].stage !== 'ADMIN_ACCEPTED') return res.status(400).json({ error: 'Admin must accept this request first (current: ' + rows[0].stage + ')' });

    await db.query('UPDATE peb_material_requests SET stage = ? WHERE id = ?', [action, req.params.id]);

    if (action === 'APPROVED' && items) {
      for (const item of items) {
        await db.query('UPDATE peb_material_request_items SET approved_qty = ? WHERE id = ?', [item.approved_qty, item.id]);
      }
    }

    const io = req.app.get('io');
    if (io) {
      io.to('role:HR').to('all').emit('materialRequest:approved', { id: parseInt(req.params.id), action });
    }

    res.json({ message: `Request ${action.toLowerCase()} by MD` });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// Dispatch — deducts stock (MD only after admin acceptance)
router.post('/material-requests/:id/dispatch', verifyToken, requireRoleOrDept(['MD'], ADMIN_DEPTS), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { items, store_remarks } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ error: 'items with issued_qty required' });

    const [request] = await conn.query('SELECT * FROM peb_material_requests WHERE id = ?', [req.params.id]);
    if (request.length === 0) return res.status(404).json({ error: 'Not found' });

    for (const item of items) {
      // Validate stock
      const [stock] = await conn.query('SELECT current_stock, item_name FROM peb_stock_items WHERE id = ?', [item.item_id]);
      if (stock.length > 0 && stock[0].current_stock < item.issued_qty) {
        await conn.rollback();
        return res.status(400).json({ error: `Insufficient stock for ${stock[0].item_name}: available ${stock[0].current_stock}, requested ${item.issued_qty}` });
      }

      await conn.query('UPDATE peb_material_request_items SET issued_qty = ? WHERE id = ?', [item.issued_qty, item.id]);

      // Deduct stock
      await conn.query('INSERT INTO peb_stock_transactions (type,item_id,quantity,reference_id,reference_type,created_by) VALUES ("MIS",?,?,?,"material_request",?)',
        [item.item_id, item.issued_qty, req.params.id, req.user.empCode]);
      await conn.query('UPDATE peb_stock_items SET current_stock = current_stock - ?, last_updated_by = ? WHERE id = ?',
        [item.issued_qty, req.user.empCode, item.item_id]);
    }

    await conn.query('UPDATE peb_material_requests SET stage = "DISPATCHED", store_remarks = ?, dispatched_at = NOW() WHERE id = ?',
      [store_remarks||null, req.params.id]);

    await conn.commit();
    res.json({ message: 'Materials dispatched and stock updated' });
  } catch (err) {
    await conn.rollback();
    console.error('[PEB-STORE] Dispatch error:', err);
    res.status(500).json({ error: 'Server error' });
  } finally { conn.release(); }
});

// ========================================
// MATERIAL RETURNS — with verification + restocking
// ========================================
router.get('/returns', verifyToken, requireRole('MD', 'HR', 'Employee'), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM peb_material_returns ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/returns/:id', verifyToken, requireRole('MD', 'HR', 'Employee'), async (req, res) => {
  try {
    const [ret] = await db.query('SELECT * FROM peb_material_returns WHERE id = ?', [req.params.id]);
    if (ret.length === 0) return res.status(404).json({ error: 'Not found' });
    const [items] = await db.query(
      `SELECT ri.*, si.item_name, si.item_code, si.unit FROM peb_return_items ri
       LEFT JOIN peb_stock_items si ON ri.item_id = si.id WHERE ri.mrn_id = ?`, [req.params.id]
    );
    res.json({ ...ret[0], items });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/returns', verifyToken, requireRoleOrDept(['MD', 'HR'], SITE_DEPTS), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { site_name, returned_by_name, return_date, items } = req.body;
    if (!site_name || !items || items.length === 0) return res.status(400).json({ error: 'site_name and items required' });

    const mrn_code = await generateCode('MRN', 'peb_material_returns', 'mrn_code');
    const [result] = await conn.query(
      'INSERT INTO peb_material_returns (mrn_code,site_name,returned_by,returned_by_name,return_date) VALUES (?,?,?,?,?)',
      [mrn_code, site_name, req.user.empCode, returned_by_name||null, return_date||new Date().toISOString().split('T')[0]]
    );

    for (const item of items) {
      await conn.query(
        'INSERT INTO peb_return_items (mrn_id,item_id,returned_qty,usable_qty,scrap_qty,`condition`,condition_notes) VALUES (?,?,?,?,?,?,?)',
        [result.insertId, item.item_id, item.returned_qty, item.usable_qty||0, item.scrap_qty||0, item.condition||'GOOD', item.condition_notes||null]
      );
    }

    await conn.commit();
    res.status(201).json({ id: result.insertId, mrn_code, message: 'Return note created' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: 'Server error' });
  } finally { conn.release(); }
});

// Admin accepts return — forwards to MD
router.post('/returns/:id/admin-accept', verifyToken, requireRoleOrDept(['HR'], ADMIN_DEPTS), async (req, res) => {
  try {
    const [ret] = await db.query('SELECT * FROM peb_material_returns WHERE id = ?', [req.params.id]);
    if (ret.length === 0) return res.status(404).json({ error: 'Return not found' });
    if (ret[0].status === 'VERIFIED' || ret[0].status === 'ADMIN_ACCEPTED') return res.status(400).json({ error: 'Already processed' });
    await db.query('UPDATE peb_material_returns SET status = "ADMIN_ACCEPTED" WHERE id = ?', [req.params.id]);
    const io = req.app.get('io');
    if (io) io.to('role:MD').emit('return:pendingApproval', { id: parseInt(req.params.id) });
    res.json({ message: 'Return accepted by Admin, forwarded to MD' });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// MD verifies return — restocks usable items
router.post('/returns/:id/verify', verifyToken, requireRoleOrDept(['MD'], []), async (req, res) => {
  const conn = await db.getConnection();
  try {
    // Verify status is ADMIN_ACCEPTED before proceeding
    const [ret] = await conn.query('SELECT status FROM peb_material_returns WHERE id = ?', [req.params.id]);
    if (ret.length === 0) { conn.release(); return res.status(404).json({ error: 'Return not found' }); }
    if (ret[0].status !== 'ADMIN_ACCEPTED') { conn.release(); return res.status(400).json({ error: 'Admin must accept this return first (current: ' + ret[0].status + ')' }); }
    await conn.beginTransaction();
    const [items] = await conn.query('SELECT * FROM peb_return_items WHERE mrn_id = ?', [req.params.id]);

    for (const item of items) {
      if (item.usable_qty > 0) {
        await conn.query('INSERT INTO peb_stock_transactions (type,item_id,quantity,reference_id,reference_type,created_by,notes) VALUES ("MRT",?,?,?,"material_return",?,"Return - usable")',
          [item.item_id, item.usable_qty, req.params.id, req.user.empCode]);
        await conn.query('UPDATE peb_stock_items SET current_stock = current_stock + ?, last_updated_by = ? WHERE id = ?',
          [item.usable_qty, req.user.empCode, item.item_id]);
      }
    }

    await conn.query('UPDATE peb_material_returns SET status = "VERIFIED", verified_by_store = ?, verified_at = NOW() WHERE id = ?',
      [req.user.empCode, req.params.id]);

    await conn.commit();
    res.json({ message: 'Return verified, usable items restocked' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: 'Server error' });
  } finally { conn.release(); }
});

// ========================================
// SCRAP BATCHES
// ========================================
router.get('/scrap', verifyToken, requireRole('MD', 'HR', 'Employee'), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM peb_scrap_batches ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/scrap', verifyToken, requireRoleOrDept(['MD', 'HR'], SITE_DEPTS), async (req, res) => {
  try {
    const { total_weight, items } = req.body;
    const batch_code = await generateCode('SCR', 'peb_scrap_batches', 'batch_code');
    let weight = total_weight || 0;

    const [result] = await db.query('INSERT INTO peb_scrap_batches (batch_code,total_weight,created_by) VALUES (?,?,?)',
      [batch_code, weight, req.user.empCode]);

    if (items) {
      for (const item of items) {
        weight += item.weight || 0;
        await db.query('INSERT INTO peb_scrap_items (batch_id,item_id,qty,weight,estimated_value) VALUES (?,?,?,?,?)',
          [result.insertId, item.item_id||null, item.qty||0, item.weight||0, item.estimated_value||0]);
      }
      if (!total_weight) await db.query('UPDATE peb_scrap_batches SET total_weight = ? WHERE id = ?', [weight, result.insertId]);
    }

    res.status(201).json({ id: result.insertId, batch_code, message: 'Scrap batch created' });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// Admin accepts scrap for sale — forwards to MD
router.post('/scrap/:id/admin-accept', verifyToken, requireRoleOrDept(['HR'], ADMIN_DEPTS), async (req, res) => {
  try {
    const [batch] = await db.query('SELECT * FROM peb_scrap_batches WHERE id = ?', [req.params.id]);
    if (batch.length === 0) return res.status(404).json({ error: 'Batch not found' });
    if (batch[0].status === 'SOLD' || batch[0].status === 'ADMIN_ACCEPTED') return res.status(400).json({ error: 'Already processed' });
    await db.query("UPDATE peb_scrap_batches SET status = 'ADMIN_ACCEPTED' WHERE id = ?", [req.params.id]);
    const io = req.app.get('io');
    if (io) io.to('role:MD').emit('scrap:pendingApproval', { id: parseInt(req.params.id), code: batch[0].batch_code });
    res.json({ message: 'Scrap accepted by Admin, forwarded to MD for sale approval' });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// Sell scrap — MD only (after Admin acceptance)
router.post('/scrap/:id/sell', verifyToken, requireRoleOrDept(['MD'], []), async (req, res) => {
  try {
    const { sale_amount, receipt_number } = req.body;
    if (!sale_amount) return res.status(400).json({ error: 'sale_amount required' });
    // Verify Admin has accepted before MD can sell
    const [batch] = await db.query('SELECT status FROM peb_scrap_batches WHERE id = ?', [req.params.id]);
    if (batch.length === 0) return res.status(404).json({ error: 'Batch not found' });
    if (batch[0].status !== 'ADMIN_ACCEPTED') return res.status(400).json({ error: 'Admin must accept this batch first (current: ' + batch[0].status + ')' });
    await db.query("UPDATE peb_scrap_batches SET status='SOLD', sale_amount=?, sale_date=CURDATE(), receipt_number=? WHERE id=?",
      [sale_amount, receipt_number||null, req.params.id]);

    // Remove scrap from inventory
    const [scrapItems] = await db.query('SELECT * FROM peb_scrap_items WHERE batch_id = ?', [req.params.id]);
    for (const item of scrapItems) {
      if (item.item_id) {
        await db.query('INSERT INTO peb_stock_transactions (type,item_id,quantity,reference_id,reference_type,created_by,notes) VALUES ("SCP",?,?,?,"scrap",?,"Scrap sold")',
          [item.item_id, item.qty, req.params.id, req.user.empCode]);
      }
    }

    res.json({ message: 'Scrap sold and recorded' });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// Low stock alerts
router.get('/alerts', verifyToken, requireRoleOrDept(['MD', 'HR'], SITE_DEPTS), async (req, res) => {
  try {
    const [items] = await db.query('SELECT * FROM peb_stock_items WHERE current_stock <= min_stock_level AND min_stock_level > 0 ORDER BY (current_stock / min_stock_level) ASC');
    res.json(items);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
