const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

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
  } catch (e) {
    console.error('[PEB-STORE] Migration:', e.message);
  }
})();

// ========================================
// DASHBOARD
// ========================================
router.get('/dashboard', verifyToken, requireRole('MD'), async (req, res) => {
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
router.get('/items', verifyToken, requireRole('MD'), async (req, res) => {
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

router.get('/items/:id', verifyToken, requireRole('MD'), async (req, res) => {
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

router.post('/items', verifyToken, requireRole('MD'), async (req, res) => {
  try {
    const { item_name, category, sub_category, unit, hsn_code, min_stock_level, max_stock_level, unit_price, location } = req.body;
    if (!item_name || !category || !unit) return res.status(400).json({ error: 'item_name, category, unit required' });
    const item_code = await generateSimpleCode('PEB-ITEM', 'peb_stock_items', 'item_code');
    const [result] = await db.query(
      'INSERT INTO peb_stock_items (item_code,item_name,category,sub_category,unit,hsn_code,min_stock_level,max_stock_level,unit_price,location,last_updated_by) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [item_code, item_name, category, sub_category||null, unit, hsn_code||null, min_stock_level||0, max_stock_level||0, unit_price||0, location||null, req.user.id]
    );
    res.status(201).json({ id: result.insertId, item_code, message: 'Stock item created' });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.put('/items/:id', verifyToken, requireRole('MD'), async (req, res) => {
  try {
    const [old] = await db.query('SELECT * FROM peb_stock_items WHERE id = ?', [req.params.id]);
    if (old.length === 0) return res.status(404).json({ error: 'Item not found' });
    const { item_name, category, sub_category, unit, hsn_code, min_stock_level, max_stock_level, unit_price, location } = req.body;
    await db.query(
      'UPDATE peb_stock_items SET item_name=?,category=?,sub_category=?,unit=?,hsn_code=?,min_stock_level=?,max_stock_level=?,unit_price=?,location=?,last_updated_by=? WHERE id=?',
      [item_name||old[0].item_name, category||old[0].category, sub_category??old[0].sub_category, unit||old[0].unit,
       hsn_code??old[0].hsn_code, min_stock_level??old[0].min_stock_level, max_stock_level??old[0].max_stock_level,
       unit_price??old[0].unit_price, location??old[0].location, req.user.id, req.params.id]
    );
    res.json({ message: 'Item updated' });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// ========================================
// STOCK TRANSACTIONS (manual entry)
// ========================================
router.post('/transactions', verifyToken, requireRole('MD'), async (req, res) => {
  try {
    const { type, item_id, quantity, unit_cost, notes } = req.body;
    if (!type || !item_id || quantity === undefined) return res.status(400).json({ error: 'type, item_id, quantity required' });

    const [result] = await db.query(
      'INSERT INTO peb_stock_transactions (type,item_id,quantity,unit_cost,notes,created_by) VALUES (?,?,?,?,?,?)',
      [type, item_id, quantity, unit_cost||0, notes||null, req.user.id]
    );

    // Update current_stock
    const inTypes = ['GRN','MRT','ADJ','OPB'];
    const stockChange = inTypes.includes(type) ? Math.abs(quantity) : -Math.abs(quantity);
    await db.query('UPDATE peb_stock_items SET current_stock = current_stock + ?, last_updated_by = ? WHERE id = ?', [stockChange, req.user.id, item_id]);

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
router.get('/grn', verifyToken, requireRole('MD'), async (req, res) => {
  try {
    const [grns] = await db.query(
      `SELECT g.*, v.company_name as vendor_name FROM peb_grn g
       LEFT JOIN peb_vendors v ON g.vendor_id = v.id ORDER BY g.created_at DESC`
    );
    res.json(grns);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/grn/:id', verifyToken, requireRole('MD'), async (req, res) => {
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

router.post('/grn', verifyToken, requireRole('MD'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { vendor_id, po_id, invoice_number, invoice_date, received_date, quality_status, quality_remarks, items } = req.body;
    if (!vendor_id || !received_date || !items || items.length === 0) return res.status(400).json({ error: 'vendor_id, received_date, items required' });

    const grn_number = await generateCode('GRN', 'peb_grn', 'grn_number');
    const [grnResult] = await conn.query(
      'INSERT INTO peb_grn (grn_number,po_id,vendor_id,invoice_number,invoice_date,received_date,quality_status,quality_remarks,created_by) VALUES (?,?,?,?,?,?,?,?,?)',
      [grn_number, po_id||null, vendor_id, invoice_number||null, invoice_date||null, received_date, quality_status||'PASSED', quality_remarks||null, req.user.id]
    );

    for (const item of items) {
      const accepted = item.accepted_qty || item.received_qty;
      await conn.query('INSERT INTO peb_grn_items (grn_id,item_id,po_qty,received_qty,accepted_qty,unit_cost,quality_status) VALUES (?,?,?,?,?,?,?)',
        [grnResult.insertId, item.item_id, item.po_qty||null, item.received_qty, accepted, item.unit_cost||0, item.quality_status||'PASSED']);

      // Add stock transaction + update stock
      await conn.query('INSERT INTO peb_stock_transactions (type,item_id,quantity,unit_cost,reference_id,reference_type,created_by) VALUES ("GRN",?,?,?,?,"grn",?)',
        [item.item_id, accepted, item.unit_cost||0, grnResult.insertId, req.user.id]);
      await conn.query('UPDATE peb_stock_items SET current_stock = current_stock + ?, last_updated_by = ? WHERE id = ?',
        [accepted, req.user.id, item.item_id]);
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
router.get('/material-requests', verifyToken, requireRole('MD'), async (req, res) => {
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

router.get('/material-requests/:id', verifyToken, requireRole('MD'), async (req, res) => {
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

router.post('/material-requests', verifyToken, requireRole('MD'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { site_name, project_name, required_by, urgency, purpose, items } = req.body;
    if (!site_name || !items || items.length === 0) return res.status(400).json({ error: 'site_name and items required' });

    const request_code = await generateCode('MRQ', 'peb_material_requests', 'request_code');
    const [result] = await conn.query(
      'INSERT INTO peb_material_requests (request_code,requested_by,site_name,project_name,required_by,urgency,purpose) VALUES (?,?,?,?,?,?,?)',
      [request_code, req.user.id, site_name, project_name||null, required_by||null, urgency||'NORMAL', purpose||null]
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
router.post('/material-requests/:id/approve', verifyToken, requireRole('MD'), async (req, res) => {
  try {
    const { action, remarks, items } = req.body;
    if (!['APPROVED','REJECTED'].includes(action)) return res.status(400).json({ error: 'action must be APPROVED or REJECTED' });

    await db.query('UPDATE peb_material_requests SET stage = ? WHERE id = ?', [action, req.params.id]);

    // Update approved quantities if provided
    if (action === 'APPROVED' && items) {
      for (const item of items) {
        await db.query('UPDATE peb_material_request_items SET approved_qty = ? WHERE id = ?', [item.approved_qty, item.id]);
      }
    }

    res.json({ message: `Request ${action.toLowerCase()}` });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// Dispatch — deducts stock
router.post('/material-requests/:id/dispatch', verifyToken, requireRole('MD'), async (req, res) => {
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
        [item.item_id, item.issued_qty, req.params.id, req.user.id]);
      await conn.query('UPDATE peb_stock_items SET current_stock = current_stock - ?, last_updated_by = ? WHERE id = ?',
        [item.issued_qty, req.user.id, item.item_id]);
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
router.get('/returns', verifyToken, requireRole('MD'), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM peb_material_returns ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/returns/:id', verifyToken, requireRole('MD'), async (req, res) => {
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

router.post('/returns', verifyToken, requireRole('MD'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { site_name, returned_by_name, return_date, items } = req.body;
    if (!site_name || !items || items.length === 0) return res.status(400).json({ error: 'site_name and items required' });

    const mrn_code = await generateCode('MRN', 'peb_material_returns', 'mrn_code');
    const [result] = await conn.query(
      'INSERT INTO peb_material_returns (mrn_code,site_name,returned_by,returned_by_name,return_date) VALUES (?,?,?,?,?)',
      [mrn_code, site_name, req.user.id, returned_by_name||null, return_date||new Date().toISOString().split('T')[0]]
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

// Verify return — restocks usable items
router.post('/returns/:id/verify', verifyToken, requireRole('MD'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [items] = await conn.query('SELECT * FROM peb_return_items WHERE mrn_id = ?', [req.params.id]);

    for (const item of items) {
      if (item.usable_qty > 0) {
        await conn.query('INSERT INTO peb_stock_transactions (type,item_id,quantity,reference_id,reference_type,created_by,notes) VALUES ("MRT",?,?,?,"material_return",?,"Return - usable")',
          [item.item_id, item.usable_qty, req.params.id, req.user.id]);
        await conn.query('UPDATE peb_stock_items SET current_stock = current_stock + ?, last_updated_by = ? WHERE id = ?',
          [item.usable_qty, req.user.id, item.item_id]);
      }
    }

    await conn.query('UPDATE peb_material_returns SET status = "VERIFIED", verified_by_store = ?, verified_at = NOW() WHERE id = ?',
      [req.user.id, req.params.id]);

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
router.get('/scrap', verifyToken, requireRole('MD'), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM peb_scrap_batches ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/scrap', verifyToken, requireRole('MD'), async (req, res) => {
  try {
    const { total_weight, items } = req.body;
    const batch_code = await generateCode('SCR', 'peb_scrap_batches', 'batch_code');
    let weight = total_weight || 0;

    const [result] = await db.query('INSERT INTO peb_scrap_batches (batch_code,total_weight,created_by) VALUES (?,?,?)',
      [batch_code, weight, req.user.id]);

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

// Sell scrap — MD only
router.post('/scrap/:id/sell', verifyToken, requireRole('MD'), async (req, res) => {
  try {
    const { sale_amount, receipt_number } = req.body;
    if (!sale_amount) return res.status(400).json({ error: 'sale_amount required' });
    await db.query("UPDATE peb_scrap_batches SET status='SOLD', sale_amount=?, sale_date=CURDATE(), receipt_number=? WHERE id=?",
      [sale_amount, receipt_number||null, req.params.id]);

    // Remove scrap from inventory
    const [scrapItems] = await db.query('SELECT * FROM peb_scrap_items WHERE batch_id = ?', [req.params.id]);
    for (const item of scrapItems) {
      if (item.item_id) {
        await db.query('INSERT INTO peb_stock_transactions (type,item_id,quantity,reference_id,reference_type,created_by,notes) VALUES ("SCP",?,?,?,"scrap",?,"Scrap sold")',
          [item.item_id, item.qty, req.params.id, req.user.id]);
      }
    }

    res.json({ message: 'Scrap sold and recorded' });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// Low stock alerts
router.get('/alerts', verifyToken, requireRole('MD'), async (req, res) => {
  try {
    const [items] = await db.query('SELECT * FROM peb_stock_items WHERE current_stock <= min_stock_level AND min_stock_level > 0 ORDER BY (current_stock / min_stock_level) ASC');
    res.json(items);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
