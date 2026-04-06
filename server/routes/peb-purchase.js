const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, requireRole, requireRoleOrDept } = require('../middleware/auth');
const SITE_DEPTS = ['Execution', 'Production'];

// Helpers
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
    await db.query(`CREATE TABLE IF NOT EXISTS peb_vendors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      vendor_code VARCHAR(30) UNIQUE NOT NULL,
      company_name VARCHAR(200) NOT NULL,
      contact_person VARCHAR(100),
      phone VARCHAR(20),
      email VARCHAR(100),
      address TEXT,
      gst_number VARCHAR(20),
      pan_number VARCHAR(15),
      payment_terms VARCHAR(100),
      rating DECIMAL(3,1) DEFAULT 0,
      status VARCHAR(20) DEFAULT 'ACTIVE',
      is_blacklisted BOOLEAN DEFAULT FALSE,
      blacklist_reason TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    // Purchase Indents (enhanced with 2-tier approval)
    await db.query(`CREATE TABLE IF NOT EXISTS peb_purchase_indents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      indent_code VARCHAR(30) UNIQUE NOT NULL,
      requested_by INT,
      requested_by_name VARCHAR(100),
      site_name VARCHAR(200),
      urgency VARCHAR(20) DEFAULT 'ROUTINE',
      required_by DATE,
      reason TEXT,
      project_reference VARCHAR(100),
      status VARCHAR(30) DEFAULT 'QUOTATION_PENDING',
      gm_approved_by INT,
      gm_approved_at TIMESTAMP NULL,
      gm_remarks TEXT,
      md_approved_by INT,
      md_approved_at TIMESTAMP NULL,
      md_remarks TEXT,
      selected_vendor_id INT,
      selection_justification TEXT,
      needs_special_approval BOOLEAN DEFAULT FALSE,
      adjusted_price DECIMAL(14,2),
      final_approved_price DECIMAL(14,2),
      rejection_reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    // Indent items
    await db.query(`CREATE TABLE IF NOT EXISTS peb_indent_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      indent_id INT NOT NULL,
      item_id INT NOT NULL,
      specification VARCHAR(200),
      qty DECIMAL(12,2) NOT NULL,
      estimated_cost DECIMAL(14,2),
      current_stock_qty DECIMAL(12,2),
      last_purchase_price DECIMAL(12,2)
    )`);

    // Vendor quotations (3 per indent, L1/L2/L3)
    await db.query(`CREATE TABLE IF NOT EXISTS peb_vendor_quotations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      indent_id INT NOT NULL,
      vendor_id INT NOT NULL,
      quotation_date DATE,
      valid_until DATE,
      delivery_lead_days INT,
      payment_terms VARCHAR(100),
      transport_included BOOLEAN DEFAULT FALSE,
      transport_cost DECIMAL(14,2) DEFAULT 0,
      total_value DECIMAL(14,2) DEFAULT 0,
      landed_cost DECIMAL(14,2) DEFAULT 0,
      document_url VARCHAR(500),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_indent_vendor (indent_id, vendor_id)
    )`);

    // Purchase Orders
    await db.query(`CREATE TABLE IF NOT EXISTS peb_purchase_orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      po_number VARCHAR(30) UNIQUE NOT NULL,
      indent_id INT,
      vendor_id INT,
      quotation_id INT,
      total_amount DECIMAL(14,2) DEFAULT 0,
      total_paid DECIMAL(14,2) DEFAULT 0,
      balance_due DECIMAL(14,2) DEFAULT 0,
      delivery_address VARCHAR(500),
      delivery_deadline DATE,
      payment_terms VARCHAR(100),
      special_instructions TEXT,
      status VARCHAR(20) DEFAULT 'DRAFT',
      approved_by_md BOOLEAN DEFAULT FALSE,
      approval_date DATE,
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    // PO items
    await db.query(`CREATE TABLE IF NOT EXISTS peb_po_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      po_id INT NOT NULL,
      item_id INT NOT NULL,
      qty DECIMAL(12,2) NOT NULL,
      unit_price DECIMAL(12,2) NOT NULL,
      total_price DECIMAL(14,2) DEFAULT 0,
      received_qty DECIMAL(12,2) DEFAULT 0
    )`);

    // PO payments
    await db.query(`CREATE TABLE IF NOT EXISTS peb_po_payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      po_id INT NOT NULL,
      amount DECIMAL(14,2) NOT NULL,
      payment_date DATE NOT NULL,
      mode VARCHAR(30) NOT NULL,
      reference VARCHAR(100),
      recorded_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Transport requests
    await db.query(`CREATE TABLE IF NOT EXISTS peb_transport_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      request_code VARCHAR(30) UNIQUE NOT NULL,
      requested_by INT,
      type VARCHAR(30) NOT NULL,
      origin_name VARCHAR(200),
      destination_name VARCHAR(200),
      scheduled_date DATE,
      urgency VARCHAR(20) DEFAULT 'NORMAL',
      vehicle_type VARCHAR(30),
      estimated_weight DECIMAL(12,2),
      reason TEXT,
      status VARCHAR(20) DEFAULT 'REQUESTED',
      approved_by INT,
      vehicle_number VARCHAR(30),
      driver_name VARCHAR(100),
      driver_phone VARCHAR(20),
      actual_km DECIMAL(10,2),
      transport_cost DECIMAL(14,2),
      delivery_condition VARCHAR(20),
      damage_notes TEXT,
      received_by INT,
      received_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    console.log('[PEB-PURCHASE] All tables ready');

    // Auto-seed if empty
    const [[{ cnt }]] = await db.query('SELECT COUNT(*) as cnt FROM peb_vendors');
    if (cnt === 0) {
      console.log('[PEB-PURCHASE] Empty tables — auto-seeding...');
      await db.query(`INSERT INTO peb_vendors (vendor_code,company_name,contact_person,phone,gst_number,pan_number,rating,status) VALUES
        ('VND-001','JSW Steel Dealers','Arun Kumar','9100000001','33AABCZ1234A1Z5','AABCZ1234A',4.5,'ACTIVE'),
        ('VND-002','Sri Balaji Hardware','Balaji S','9100000002','33ABCS5678B1Z9','ABCS5678B1',4.2,'ACTIVE'),
        ('VND-003','Metro Roofing Supplies','Venkat R','9100000003','33AABCM912C1Z3','AABCM912C1',3.8,'ACTIVE'),
        ('VND-004','Kumar Fasteners Pvt Ltd','Santhi K','9100000004','33AABCK345G1Z7','AABCK345G1',4.0,'ACTIVE'),
        ('VND-005','Chennai Welding Works','Prakash M','9100000005','33AABCT890E1Z1','AABCT890E1',3.5,'ACTIVE'),
        ('VND-006','Tata Structure Dealers','Ramesh N','9100000006','33AABCT111F1Z5','AABCT111F1',4.8,'ACTIVE')`);
      await db.query(`INSERT INTO peb_purchase_indents (indent_code,requested_by,requested_by_name,urgency,reason,status) VALUES
        ('PI-2026-0001',1,'Admin (MD)','URGENT','MS Angles running low','PO_CREATED'),
        ('PI-2026-0002',1,'Admin (MD)','ROUTINE','Regular restock of hardware','GM_APPROVED'),
        ('PI-2026-0003',1,'Admin (MD)','CRITICAL','Welding rods critically low','COMPARISON_READY'),
        ('PI-2026-0004',1,'Admin (MD)','ROUTINE','Insulation for roofing project','QUOTATION_PENDING')`).catch(()=>{});
      await db.query(`INSERT INTO peb_indent_items (indent_id,item_id,qty,specification,estimated_cost,current_stock_qty) VALUES
        (1,4,500,'50x50x6mm',32500,550),(1,5,300,'75x75x8mm',28500,420),
        (2,6,2000,'M16x50 Grade 8.8',24000,3700),(2,14,1000,'J Bolt 12x150',8000,850),
        (3,12,200,'E7018 4mm AWS',19000,45),(4,17,300,'50mm thick PUF',54000,45)`).catch(()=>{});
      await db.query(`INSERT INTO peb_vendor_quotations (indent_id,vendor_id,quotation_date,delivery_lead_days,payment_terms,total_value,transport_cost,landed_cost,transport_included) VALUES
        (3,5,CURDATE()-INTERVAL 5 DAY,7,'Net 15',19000,1500,20500,0),
        (3,1,CURDATE()-INTERVAL 5 DAY,10,'Net 30',18500,2000,20500,0),
        (3,4,CURDATE()-INTERVAL 5 DAY,5,'Advance',21000,0,21000,1)`).catch(()=>{});
      await db.query(`INSERT INTO peb_purchase_orders (po_number,indent_id,vendor_id,total_amount,total_paid,balance_due,status,created_by) VALUES
        ('PO-2026-0001',1,6,121000,50000,71000,'SENT',1),
        ('PO-2026-0002',NULL,1,85000,85000,0,'SENT',1)`).catch(()=>{});
      await db.query(`INSERT INTO peb_po_items (po_id,item_id,qty,unit_price,total_price) VALUES
        (1,4,500,65,32500),(1,5,300,95,28500),(1,1,200,85,17000),(1,2,500,72,36000),(1,13,100,70,7000),
        (2,2,1000,72,72000),(2,3,200,78,15600)`).catch(()=>{});
      await db.query(`INSERT INTO peb_po_payments (po_id,amount,payment_date,mode,reference,recorded_by) VALUES
        (1,50000,CURDATE()-INTERVAL 9 DAY,'BANK_TRANSFER','UTR-2026-001',1),
        (2,50000,CURDATE()-INTERVAL 12 DAY,'BANK_TRANSFER','UTR-2026-002',1),
        (2,35000,CURDATE()-INTERVAL 7 DAY,'UPI','UPI-TX-A001',1)`).catch(()=>{});
      await db.query(`INSERT INTO peb_transport_requests (request_code,requested_by,type,origin_name,destination_name,scheduled_date,vehicle_type,status,vehicle_number,driver_name,driver_phone,actual_km,transport_cost,delivery_condition) VALUES
        ('TRQ-2026-0001',1,'COMPANY_TO_SITE','Head Office Store','Site A - Kamarajar Port',CURDATE()-INTERVAL 5 DAY,'LORRY','DELIVERED','TN-01-AB-1234','Murugan','9876543210',45,3500,'GOOD'),
        ('TRQ-2026-0002',1,'SITE_TO_COMPANY','Site A - Kamarajar Port','Head Office Store',CURDATE()-INTERVAL 6 DAY,'MINI_TRUCK','IN_TRANSIT','TN-01-CD-5678','Ravi','9876543211',NULL,NULL,NULL),
        ('TRQ-2026-0003',1,'COMPANY_TO_SITE','Head Office Store','Site B - Ambattur',CURDATE()-INTERVAL 2 DAY,'LORRY','APPROVED','TN-09-EF-9012','Kumar','9876543212',NULL,NULL,NULL),
        ('TRQ-2026-0004',1,'SITE_TO_SITE','Site A - Kamarajar Port','Site D - Hosur',CURDATE()+INTERVAL 2 DAY,'TRAILER','REQUESTED',NULL,NULL,NULL,NULL,NULL,NULL),
        ('TRQ-2026-0005',1,'SITE_TO_SCRAP','Site A - Kamarajar Port','Chennai Scrap Yard',CURDATE()+INTERVAL 6 DAY,'PICKUP','REQUESTED',NULL,NULL,NULL,NULL,NULL,NULL)`).catch(()=>{});
      console.log('[PEB-PURCHASE] Auto-seed complete');
    }
  } catch (e) {
    console.error('[PEB-PURCHASE] Migration:', e.message);
  }
})();

// ========================================
// VENDORS
// ========================================
router.get('/vendors', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    const { search, qualified } = req.query;
    let q = 'SELECT * FROM peb_vendors WHERE is_active = TRUE';
    const p = [];
    if (search) { q += ' AND (company_name LIKE ? OR vendor_code LIKE ?)'; p.push(`%${search}%`, `%${search}%`); }
    if (qualified === 'true') { q += ' AND gst_number IS NOT NULL AND pan_number IS NOT NULL AND is_blacklisted = FALSE'; }
    q += ' ORDER BY company_name';
    const [rows] = await db.query(q, p);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/vendors', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    const { company_name, contact_person, phone, email, address, gst_number, pan_number, payment_terms, rating } = req.body;
    if (!company_name) return res.status(400).json({ error: 'Company name required' });
    if (!gst_number || !pan_number) return res.status(400).json({ error: 'GST Number and PAN are mandatory for vendor qualification' });
    const vendor_code = await generateSimpleCode('VND', 'peb_vendors', 'vendor_code');
    const [result] = await db.query(
      'INSERT INTO peb_vendors (vendor_code,company_name,contact_person,phone,email,address,gst_number,pan_number,payment_terms,rating) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [vendor_code, company_name, contact_person||null, phone||null, email||null, address||null, gst_number, pan_number, payment_terms||null, rating||0]
    );
    res.status(201).json({ id: result.insertId, vendor_code, message: 'Vendor created and qualified' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Vendor already exists' });
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/vendors/:id', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    const fields = ['company_name','contact_person','phone','email','address','gst_number','pan_number','payment_terms','rating','is_blacklisted','blacklist_reason','status'];
    const updates = [], values = [];
    for (const f of fields) { if (req.body[f] !== undefined) { updates.push(`${f} = ?`); values.push(req.body[f]); } }
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
    values.push(req.params.id);
    await db.query(`UPDATE peb_vendors SET ${updates.join(', ')} WHERE id = ?`, values);
    res.json({ message: 'Vendor updated' });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/vendors/:id', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    // Check if vendor has any linked POs or GRNs
    const [[{ poCount }]] = await db.query('SELECT COUNT(*) as poCount FROM peb_purchase_orders WHERE vendor_id = ?', [req.params.id]);
    if (poCount > 0) return res.status(400).json({ error: 'Cannot delete: vendor has ' + poCount + ' purchase orders' });
    await db.query('DELETE FROM peb_vendors WHERE id = ?', [req.params.id]);
    res.json({ message: 'Vendor deleted' });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// ========================================
// PURCHASE INDENTS — Full L1/L2/L3 workflow
// ========================================
router.get('/indents', verifyToken, requireRoleOrDept(['MD', 'HR'], SITE_DEPTS), async (req, res) => {
  try {
    const { status } = req.query;
    let q = `SELECT pi.*, (SELECT COUNT(*) FROM peb_vendor_quotations vq WHERE vq.indent_id = pi.id) as quotation_count FROM peb_purchase_indents pi WHERE 1=1`;
    const p = [];
    if (status) { q += ' AND pi.status = ?'; p.push(status); }
    q += ' ORDER BY pi.created_at DESC';
    const [rows] = await db.query(q, p);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/indents/:id', verifyToken, requireRoleOrDept(['MD', 'HR'], SITE_DEPTS), async (req, res) => {
  try {
    const [indent] = await db.query('SELECT * FROM peb_purchase_indents WHERE id = ?', [req.params.id]);
    if (indent.length === 0) return res.status(404).json({ error: 'Indent not found' });
    const [items] = await db.query(
      `SELECT ii.*, si.item_name, si.item_code, si.current_stock, si.unit
       FROM peb_indent_items ii LEFT JOIN peb_stock_items si ON ii.item_id = si.id WHERE ii.indent_id = ?`, [req.params.id]
    );
    const [quotations] = await db.query(
      `SELECT vq.*, v.company_name as vendor_name, v.gst_number as vendor_gst, v.rating as vendor_rating
       FROM peb_vendor_quotations vq LEFT JOIN peb_vendors v ON vq.vendor_id = v.id
       WHERE vq.indent_id = ? ORDER BY vq.landed_cost ASC`, [req.params.id]
    );
    quotations.forEach((q, idx) => { q.rank = `L${idx + 1}`; });
    res.json({ ...indent[0], items, quotations });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/indents', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { site_name, urgency, required_by, reason, project_reference, requested_by_name, items } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ error: 'items required' });
    if (!reason) return res.status(400).json({ error: 'reason required' });

    const indent_code = await generateCode('PI', 'peb_purchase_indents', 'indent_code');
    const [result] = await conn.query(
      "INSERT INTO peb_purchase_indents (indent_code,requested_by,requested_by_name,site_name,urgency,required_by,reason,project_reference,status) VALUES (?,?,?,?,?,?,?,?,'QUOTATION_PENDING')",
      [indent_code, req.user.empCode, requested_by_name||null, site_name||null, urgency||'ROUTINE', required_by||null, reason, project_reference||null]
    );

    for (const item of items) {
      const [stockInfo] = await conn.query('SELECT current_stock FROM peb_stock_items WHERE id = ?', [item.item_id]);
      const [lastPrice] = await conn.query("SELECT unit_cost FROM peb_stock_transactions WHERE item_id = ? AND type = 'GRN' ORDER BY created_at DESC LIMIT 1", [item.item_id]);
      await conn.query(
        'INSERT INTO peb_indent_items (indent_id,item_id,specification,qty,estimated_cost,current_stock_qty,last_purchase_price) VALUES (?,?,?,?,?,?,?)',
        [result.insertId, item.item_id, item.specification||null, item.qty, item.estimated_cost||null, stockInfo[0]?.current_stock||0, lastPrice[0]?.unit_cost||null]
      );
    }

    await conn.commit();
    res.status(201).json({ id: result.insertId, indent_code, message: 'Indent created. Collect 3 vendor quotations.' });
  } catch (err) { await conn.rollback(); res.status(500).json({ error: 'Server error' }); }
  finally { conn.release(); }
});

// ========================================
// VENDOR QUOTATIONS (3 required, auto-rank)
// ========================================
router.post('/quotations', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { indent_id, vendor_id, quotation_date, valid_until, delivery_lead_days, payment_terms, transport_included, transport_cost, total_value, document_url, notes } = req.body;
    if (!indent_id || !vendor_id) return res.status(400).json({ error: 'indent_id and vendor_id required' });

    // Validate vendor is qualified
    const [vendor] = await conn.query('SELECT * FROM peb_vendors WHERE id = ? AND is_active = TRUE', [vendor_id]);
    if (vendor.length === 0) return res.status(404).json({ error: 'Vendor not found' });
    if (!vendor[0].gst_number || !vendor[0].pan_number) return res.status(400).json({ error: 'Vendor not qualified. GST and PAN required.' });
    if (vendor[0].is_blacklisted) return res.status(400).json({ error: 'Cannot use blacklisted vendor' });

    // Check duplicate vendor for this indent
    const [existing] = await conn.query('SELECT id FROM peb_vendor_quotations WHERE indent_id = ? AND vendor_id = ?', [indent_id, vendor_id]);
    if (existing.length > 0) return res.status(409).json({ error: 'This vendor already has a quotation for this indent' });

    // Check max 3
    const [count] = await conn.query('SELECT COUNT(*) as cnt FROM peb_vendor_quotations WHERE indent_id = ?', [indent_id]);
    if (count[0].cnt >= 3) return res.status(400).json({ error: 'Maximum 3 quotations already collected' });

    const matCost = parseFloat(total_value) || 0;
    const transCost = transport_included ? 0 : (parseFloat(transport_cost) || 0);
    const landedCost = matCost + transCost;

    const [result] = await conn.query(
      'INSERT INTO peb_vendor_quotations (indent_id,vendor_id,quotation_date,valid_until,delivery_lead_days,payment_terms,transport_included,transport_cost,total_value,landed_cost,document_url,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      [indent_id, vendor_id, quotation_date||null, valid_until||null, delivery_lead_days||null, payment_terms||null, transport_included||false, transCost, matCost, landedCost, document_url||null, notes||null]
    );

    // Check if 3 quotations collected → auto update to COMPARISON_READY
    const [newCount] = await conn.query('SELECT COUNT(*) as cnt FROM peb_vendor_quotations WHERE indent_id = ?', [indent_id]);
    if (newCount[0].cnt >= 3) {
      await conn.query("UPDATE peb_purchase_indents SET status = 'COMPARISON_READY' WHERE id = ?", [indent_id]);
    }

    await conn.commit();
    res.status(201).json({
      id: result.insertId,
      quotations_collected: newCount[0].cnt,
      remaining: 3 - newCount[0].cnt,
      message: newCount[0].cnt >= 3 ? 'All 3 quotations collected! Ready for GM review.' : `${3 - newCount[0].cnt} more quotation(s) needed.`
    });
  } catch (err) { await conn.rollback(); res.status(500).json({ error: 'Server error' }); }
  finally { conn.release(); }
});

// L1/L2/L3 comparison
router.get('/comparison/:indentId', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    const [quotations] = await db.query(
      `SELECT vq.*, v.company_name, v.rating, v.gst_number as vendor_gst, v.pan_number as vendor_pan
       FROM peb_vendor_quotations vq LEFT JOIN peb_vendors v ON vq.vendor_id = v.id
       WHERE vq.indent_id = ? ORDER BY vq.landed_cost ASC`, [req.params.indentId]
    );
    if (quotations.length === 0) return res.json({ quotations: [], recommendation: null });

    const ranked = quotations.map((q, idx) => ({ ...q, rank: `L${idx + 1}`, is_lowest: idx === 0 }));
    const l1 = ranked[0];
    res.json({ quotations: ranked, l1_vendor: { name: l1.company_name, vendor_id: l1.vendor_id, landed_cost: l1.landed_cost }, recommendation: `L1: ${l1.company_name} — Landed cost: ${l1.landed_cost}` });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// GM Approval (Step 1)
router.post('/indents/:id/gm-approve', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    const { action, remarks, selected_vendor_id, selection_justification } = req.body;
    if (!['APPROVED','REJECTED'].includes(action)) return res.status(400).json({ error: 'action must be APPROVED or REJECTED' });

    const [indent] = await db.query('SELECT * FROM peb_purchase_indents WHERE id = ?', [req.params.id]);
    if (indent.length === 0) return res.status(404).json({ error: 'Indent not found' });

    if (action === 'REJECTED') {
      await db.query('UPDATE peb_purchase_indents SET status=?, rejection_reason=?, gm_approved_by=?, gm_approved_at=NOW() WHERE id=?',
        ['REJECTED', remarks||null, req.user.empCode, req.params.id]);
      return res.json({ message: 'Indent rejected' });
    }

    // Validate 3 quotations
    const [[{ cnt }]] = await db.query('SELECT COUNT(*) as cnt FROM peb_vendor_quotations WHERE indent_id = ?', [req.params.id]);
    if (cnt < 3) return res.status(400).json({ error: `Only ${cnt} quotation(s). Minimum 3 required.` });

    // Check non-L1 selection
    let needsSpecial = false, adjustedPrice = null;
    if (selected_vendor_id) {
      const [quots] = await db.query('SELECT * FROM peb_vendor_quotations WHERE indent_id = ? ORDER BY landed_cost ASC', [req.params.id]);
      const l1 = quots[0];
      const selected = quots.find(q => q.vendor_id === selected_vendor_id);
      if (selected && selected.id !== l1.id) {
        if (!selection_justification) return res.status(400).json({ error: 'Justification required for non-L1 vendor' });
        adjustedPrice = l1.landed_cost;
        needsSpecial = true;
      }
    }

    await db.query(
      'UPDATE peb_purchase_indents SET status="GM_APPROVED",gm_approved_by=?,gm_approved_at=NOW(),gm_remarks=?,selected_vendor_id=?,selection_justification=?,needs_special_approval=?,adjusted_price=? WHERE id=?',
      [req.user.empCode, remarks||null, selected_vendor_id||null, selection_justification||null, needsSpecial, adjustedPrice, req.params.id]
    );

    res.json({ message: 'GM approved. Forwarded to MD.' + (needsSpecial ? ' (SPECIAL APPROVAL: Non-L1 vendor)' : '') });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// MD Final Approval (Step 2)
router.post('/indents/:id/md-approve', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    const { action, remarks, override_price } = req.body;
    if (!['APPROVED','REJECTED'].includes(action)) return res.status(400).json({ error: 'action must be APPROVED or REJECTED' });

    const [indent] = await db.query('SELECT * FROM peb_purchase_indents WHERE id = ?', [req.params.id]);
    if (indent.length === 0) return res.status(404).json({ error: 'Not found' });
    if (indent[0].status !== 'GM_APPROVED') return res.status(400).json({ error: 'Must be GM approved first' });

    if (action === 'REJECTED') {
      await db.query('UPDATE peb_purchase_indents SET status=?,rejection_reason=?,md_approved_by=?,md_approved_at=NOW() WHERE id=?',
        ['REJECTED', remarks||null, req.user.empCode, req.params.id]);
      return res.json({ message: 'Indent rejected by MD' });
    }

    if (indent[0].needs_special_approval && !remarks) return res.status(400).json({ error: 'MD remarks required for special approval' });

    const finalPrice = override_price || indent[0].adjusted_price;
    await db.query('UPDATE peb_purchase_indents SET status="MD_APPROVED",md_approved_by=?,md_approved_at=NOW(),md_remarks=?,final_approved_price=? WHERE id=?',
      [req.user.empCode, remarks||null, finalPrice, req.params.id]);

    res.json({ message: 'MD approved. Ready for PO creation.' });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// ========================================
// PURCHASE ORDERS — with payment tracking
// ========================================
router.get('/orders', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    const { status } = req.query;
    let q = `SELECT po.*, v.company_name as vendor_name, pi.indent_code
       FROM peb_purchase_orders po LEFT JOIN peb_vendors v ON po.vendor_id = v.id
       LEFT JOIN peb_purchase_indents pi ON po.indent_id = pi.id WHERE 1=1`;
    const p = [];
    if (status) { q += ' AND po.status = ?'; p.push(status); }
    q += ' ORDER BY po.created_at DESC';
    const [rows] = await db.query(q, p);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/orders/:id', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    const [po] = await db.query(
      'SELECT po.*, v.company_name as vendor_name FROM peb_purchase_orders po LEFT JOIN peb_vendors v ON po.vendor_id = v.id WHERE po.id = ?', [req.params.id]
    );
    if (po.length === 0) return res.status(404).json({ error: 'PO not found' });
    const [items] = await db.query(
      'SELECT poi.*, si.item_name, si.unit FROM peb_po_items poi LEFT JOIN peb_stock_items si ON poi.item_id = si.id WHERE poi.po_id = ?', [req.params.id]
    );
    const [payments] = await db.query('SELECT * FROM peb_po_payments WHERE po_id = ? ORDER BY payment_date DESC', [req.params.id]);
    res.json({ ...po[0], items, payments });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/orders', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { indent_id, vendor_id, quotation_id, delivery_address, delivery_deadline, payment_terms, special_instructions, items } = req.body;
    if (!vendor_id || !items || items.length === 0) return res.status(400).json({ error: 'vendor_id and items required' });

    const po_number = await generateCode('PO', 'peb_purchase_orders', 'po_number');
    let totalAmount = 0;

    const [result] = await conn.query(
      'INSERT INTO peb_purchase_orders (po_number,indent_id,vendor_id,quotation_id,total_amount,delivery_address,delivery_deadline,payment_terms,special_instructions,balance_due,created_by) VALUES (?,?,?,?,0,?,?,?,?,0,?)',
      [po_number, indent_id||null, vendor_id, quotation_id||null, delivery_address||null, delivery_deadline||null, payment_terms||null, special_instructions||null, req.user.empCode]
    );

    for (const item of items) {
      const total = item.qty * item.unit_price;
      totalAmount += total;
      await conn.query('INSERT INTO peb_po_items (po_id,item_id,qty,unit_price,total_price) VALUES (?,?,?,?,?)',
        [result.insertId, item.item_id, item.qty, item.unit_price, total]);
    }

    await conn.query('UPDATE peb_purchase_orders SET total_amount=?, balance_due=? WHERE id=?', [totalAmount, totalAmount, result.insertId]);

    if (indent_id) {
      await conn.query("UPDATE peb_purchase_indents SET status='PO_CREATED' WHERE id=?", [indent_id]);
    }

    await conn.commit();
    res.status(201).json({ id: result.insertId, po_number, total_amount: totalAmount, message: 'PO created' });
  } catch (err) { await conn.rollback(); res.status(500).json({ error: 'Server error' }); }
  finally { conn.release(); }
});

// PO Approve
router.post('/orders/:id/approve', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    await db.query("UPDATE peb_purchase_orders SET approved_by_md=TRUE, approval_date=CURDATE(), status='SENT' WHERE id=?", [req.params.id]);
    res.json({ message: 'PO approved and sent' });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// PO Payment
router.post('/orders/:id/payment', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    const { amount, payment_date, mode, reference } = req.body;
    if (!amount || !payment_date || !mode) return res.status(400).json({ error: 'amount, payment_date, mode required' });
    await db.query('INSERT INTO peb_po_payments (po_id,amount,payment_date,mode,reference,recorded_by) VALUES (?,?,?,?,?,?)',
      [req.params.id, amount, payment_date, mode, reference||null, req.user.empCode]);
    await db.query('UPDATE peb_purchase_orders SET total_paid = total_paid + ?, balance_due = balance_due - ? WHERE id = ?', [amount, amount, req.params.id]);
    res.json({ message: 'Payment recorded' });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// ========================================
// TRANSPORT — full approve + complete
// ========================================
router.get('/transport', verifyToken, requireRole('MD', 'HR', 'Employee'), async (req, res) => {
  try {
    const { status } = req.query;
    let q = 'SELECT * FROM peb_transport_requests WHERE 1=1';
    const p = [];
    if (status) { q += ' AND status = ?'; p.push(status); }
    q += ' ORDER BY created_at DESC';
    const [rows] = await db.query(q, p);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/transport/:id', verifyToken, requireRole('MD', 'HR', 'Employee'), async (req, res) => {
  try {
    const [t] = await db.query('SELECT * FROM peb_transport_requests WHERE id = ?', [req.params.id]);
    if (t.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(t[0]);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/transport', verifyToken, requireRole('MD', 'HR', 'Employee'), async (req, res) => {
  try {
    const { type, origin_name, destination_name, scheduled_date, urgency, vehicle_type, estimated_weight, reason } = req.body;
    if (!type || !scheduled_date) return res.status(400).json({ error: 'type and scheduled_date required' });
    const request_code = await generateCode('TRQ', 'peb_transport_requests', 'request_code');
    const [result] = await db.query(
      'INSERT INTO peb_transport_requests (request_code,requested_by,type,origin_name,destination_name,scheduled_date,urgency,vehicle_type,estimated_weight,reason) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [request_code, req.user.empCode, type, origin_name||null, destination_name||null, scheduled_date, urgency||'NORMAL', vehicle_type||null, estimated_weight||null, reason||null]
    );
    res.status(201).json({ id: result.insertId, request_code, message: 'Transport request created' });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// Approve with vehicle/driver details
router.post('/transport/:id/approve', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    const { action, vehicle_number, driver_name, driver_phone } = req.body;
    if (!['APPROVED','REJECTED'].includes(action)) return res.status(400).json({ error: 'Invalid action' });
    const newStatus = action === 'APPROVED' ? 'APPROVED' : 'CANCELLED';
    await db.query('UPDATE peb_transport_requests SET status=?,approved_by=?,vehicle_number=?,driver_name=?,driver_phone=? WHERE id=?',
      [newStatus, req.user.empCode, vehicle_number||null, driver_name||null, driver_phone||null, req.params.id]);
    res.json({ message: `Transport ${action.toLowerCase()}` });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// Start transit
router.post('/transport/:id/start', verifyToken, requireRoleOrDept(['MD', 'HR'], SITE_DEPTS), async (req, res) => {
  try {
    await db.query("UPDATE peb_transport_requests SET status='IN_TRANSIT' WHERE id=?", [req.params.id]);
    res.json({ message: 'Transport in transit' });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// Complete with km/cost/condition
router.post('/transport/:id/complete', verifyToken, requireRoleOrDept(['MD', 'HR'], SITE_DEPTS), async (req, res) => {
  try {
    const { actual_km, transport_cost, delivery_condition, damage_notes } = req.body;
    await db.query("UPDATE peb_transport_requests SET status='DELIVERED',received_by=?,received_at=NOW(),actual_km=?,transport_cost=?,delivery_condition=?,damage_notes=? WHERE id=?",
      [req.user.empCode, actual_km||null, transport_cost||null, delivery_condition||'GOOD', damage_notes||null, req.params.id]);
    res.json({ message: 'Transport completed' });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// Summary for dashboard
router.get('/summary', verifyToken, requireRoleOrDept(['MD', 'HR'], SITE_DEPTS), async (req, res) => {
  try {
    const [[{ total_vendors }]] = await db.query('SELECT COUNT(*) as total_vendors FROM peb_vendors WHERE is_active = TRUE');
    const [[{ pending_indents }]] = await db.query("SELECT COUNT(*) as pending_indents FROM peb_purchase_indents WHERE status IN ('QUOTATION_PENDING','COMPARISON_READY','GM_APPROVED')");
    const [[{ active_pos }]] = await db.query("SELECT COUNT(*) as active_pos FROM peb_purchase_orders WHERE status NOT IN ('DELIVERED','CANCELLED')");
    const [[{ total_po_value }]] = await db.query("SELECT COALESCE(SUM(total_amount),0) as total_po_value FROM peb_purchase_orders WHERE status NOT IN ('CANCELLED')");
    res.json({ total_vendors, pending_indents, active_pos, total_po_value });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
