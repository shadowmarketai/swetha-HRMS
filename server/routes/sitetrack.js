const router = require('express').Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');

// Multer setup for Excel upload (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: function(req, file, cb) {
    var ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.xlsx' || ext === '.xls') {
      cb(null, true);
    } else {
      cb(new Error('Only .xlsx and .xls files are allowed'));
    }
  }
});

// Helper: recalculate sheet total from items
async function recalcSheetTotal(sheetId) {
  var [rows] = await pool.query(
    'SELECT SUM(planned_amount) as total FROM boq_items WHERE boq_sheet_id = ? AND is_category = 0',
    [sheetId]
  );
  var total = (rows[0] && rows[0].total) || 0;
  await pool.query('UPDATE boq_sheets SET total_planned_amount = ? WHERE id = ?', [total, sheetId]);
  return total;
}

// Helper: recalculate actual_qty_used on item from usage_logs
async function recalcItemUsage(itemId) {
  var [rows] = await pool.query(
    'SELECT SUM(qty_used) as total FROM usage_logs WHERE boq_item_id = ?',
    [itemId]
  );
  var total = (rows[0] && rows[0].total) || 0;
  await pool.query('UPDATE boq_items SET actual_qty_used = ? WHERE id = ?', [total, itemId]);
  return total;
}

// =====================================================
// WBS TASKS
// =====================================================

// GET /projects/:pid/wbs — List WBS tasks
router.get('/projects/:pid/wbs', verifyToken, async function(req, res) {
  try {
    var [rows] = await pool.query(
      'SELECT * FROM wbs_tasks WHERE project_id = ? ORDER BY wbs_code',
      [req.params.pid]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /projects/:pid/wbs — Create WBS task (MD/HR)
router.post('/projects/:pid/wbs', verifyToken, requireRole('MD', 'HR'), async function(req, res) {
  try {
    var b = req.body;
    if (!b.wbsCode || !b.taskName) return res.status(400).json({ error: 'wbsCode and taskName are required' });

    var [result] = await pool.query(
      "INSERT INTO wbs_tasks (project_id, wbs_code, `level`, task_name, `lead`, predecessor, start_date, end_date, actual_start, actual_end, planned_days, work_days, progress_pct, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [req.params.pid, b.wbsCode, b.level || 1, b.taskName, b.lead || null,
       b.predecessor || null, b.startDate || null, b.endDate || null,
       b.actualStart || null, b.actualEnd || null,
       b.plannedDays || null, b.workDays || null,
       b.progressPct || 0, b.status || 'pending']
    );

    var [rows] = await pool.query('SELECT * FROM wbs_tasks WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /wbs/:id — Update WBS task
router.put('/wbs/:id', verifyToken, async function(req, res) {
  try {
    var b = req.body;
    var fields = [];
    var values = [];

    if (b.wbsCode !== undefined) { fields.push('wbs_code = ?'); values.push(b.wbsCode); }
    if (b.level !== undefined) { fields.push('`level` = ?'); values.push(b.level); }
    if (b.taskName !== undefined) { fields.push('task_name = ?'); values.push(b.taskName); }
    if (b.lead !== undefined) { fields.push('`lead` = ?'); values.push(b.lead); }
    if (b.predecessor !== undefined) { fields.push('predecessor = ?'); values.push(b.predecessor); }
    if (b.startDate !== undefined) { fields.push('start_date = ?'); values.push(b.startDate || null); }
    if (b.endDate !== undefined) { fields.push('end_date = ?'); values.push(b.endDate || null); }
    if (b.actualStart !== undefined) { fields.push('actual_start = ?'); values.push(b.actualStart || null); }
    if (b.actualEnd !== undefined) { fields.push('actual_end = ?'); values.push(b.actualEnd || null); }
    if (b.plannedDays !== undefined) { fields.push('planned_days = ?'); values.push(b.plannedDays); }
    if (b.workDays !== undefined) { fields.push('work_days = ?'); values.push(b.workDays); }
    if (b.progressPct !== undefined) { fields.push('progress_pct = ?'); values.push(b.progressPct); }
    if (b.status !== undefined) { fields.push('status = ?'); values.push(b.status); }

    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

    values.push(req.params.id);
    await pool.query('UPDATE wbs_tasks SET ' + fields.join(', ') + ' WHERE id = ?', values);

    var [rows] = await pool.query('SELECT * FROM wbs_tasks WHERE id = ?', [req.params.id]);
    res.json(rows[0] || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /wbs/:id/progress — Update progress + auto-status
router.patch('/wbs/:id/progress', verifyToken, async function(req, res) {
  try {
    var pct = parseFloat(req.body.progressPct);
    if (isNaN(pct) || pct < 0 || pct > 100) return res.status(400).json({ error: 'progressPct must be 0-100' });

    var status = 'pending';
    if (pct >= 100) status = 'completed';
    else if (pct > 0) status = 'in_progress';

    await pool.query(
      'UPDATE wbs_tasks SET progress_pct = ?, status = ? WHERE id = ?',
      [pct, status, req.params.id]
    );

    var [rows] = await pool.query('SELECT * FROM wbs_tasks WHERE id = ?', [req.params.id]);
    res.json(rows[0] || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /wbs/:id — Delete WBS task (MD/HR)
router.delete('/wbs/:id', verifyToken, requireRole('MD', 'HR'), async function(req, res) {
  try {
    await pool.query('DELETE FROM wbs_tasks WHERE id = ?', [req.params.id]);
    res.json({ message: 'WBS task deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =====================================================
// BOQ SHEETS & ITEMS
// =====================================================

// GET /projects/:pid/boq — List sheets with items
router.get('/projects/:pid/boq', verifyToken, async function(req, res) {
  try {
    var [sheets] = await pool.query(
      'SELECT * FROM boq_sheets WHERE project_id = ? ORDER BY id',
      [req.params.pid]
    );
    var [items] = await pool.query(
      'SELECT * FROM boq_items WHERE project_id = ? ORDER BY boq_sheet_id, id',
      [req.params.pid]
    );

    sheets.forEach(function(s) {
      s.items = items.filter(function(i) { return i.boq_sheet_id === s.id; });
    });

    res.json(sheets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /projects/:pid/boq — Create sheet (MD/HR)
router.post('/projects/:pid/boq', verifyToken, requireRole('MD', 'HR'), async function(req, res) {
  try {
    var b = req.body;
    if (!b.sheetType || !b.title) return res.status(400).json({ error: 'sheetType and title are required' });

    var [result] = await pool.query(
      `INSERT INTO boq_sheets (project_id, sheet_type, title, area_sqft, quoted_rate_per_sqft, total_planned_amount)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.params.pid, b.sheetType, b.title, b.areaSqft || null, b.quotedRate || null, b.totalPlannedAmount || 0]
    );

    var [rows] = await pool.query('SELECT * FROM boq_sheets WHERE id = ?', [result.insertId]);
    var sheet = rows[0];
    sheet.items = [];
    res.status(201).json(sheet);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /boq/:sheetId — Get sheet with items
router.get('/boq/:sheetId', verifyToken, async function(req, res) {
  try {
    var [sheets] = await pool.query('SELECT * FROM boq_sheets WHERE id = ?', [req.params.sheetId]);
    if (!sheets.length) return res.status(404).json({ error: 'Sheet not found' });
    var sheet = sheets[0];
    var [items] = await pool.query('SELECT * FROM boq_items WHERE boq_sheet_id = ? ORDER BY id', [req.params.sheetId]);
    sheet.items = items;
    res.json(sheet);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /boq/:sheetId — Update sheet
router.put('/boq/:sheetId', verifyToken, requireRole('MD', 'HR'), async function(req, res) {
  try {
    var b = req.body;
    var fields = [];
    var values = [];
    if (b.title !== undefined) { fields.push('title = ?'); values.push(b.title); }
    if (b.sheetType !== undefined) { fields.push('sheet_type = ?'); values.push(b.sheetType); }
    if (b.areaSqft !== undefined) { fields.push('area_sqft = ?'); values.push(b.areaSqft); }
    if (b.quotedRate !== undefined) { fields.push('quoted_rate_per_sqft = ?'); values.push(b.quotedRate); }

    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });
    values.push(req.params.sheetId);
    await pool.query('UPDATE boq_sheets SET ' + fields.join(', ') + ' WHERE id = ?', values);

    var [rows] = await pool.query('SELECT * FROM boq_sheets WHERE id = ?', [req.params.sheetId]);
    res.json(rows[0] || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /boq/:sheetId — Delete sheet (MD/HR)
router.delete('/boq/:sheetId', verifyToken, requireRole('MD', 'HR'), async function(req, res) {
  try {
    await pool.query('DELETE FROM boq_sheets WHERE id = ?', [req.params.sheetId]);
    res.json({ message: 'BOQ sheet deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /boq/:sheetId/items — Create item
router.post('/boq/:sheetId/items', verifyToken, async function(req, res) {
  try {
    var b = req.body;
    // Look up the sheet to get project_id
    var [sheets] = await pool.query('SELECT project_id FROM boq_sheets WHERE id = ?', [req.params.sheetId]);
    if (!sheets.length) return res.status(404).json({ error: 'Sheet not found' });
    var projectId = sheets[0].project_id;

    var plannedAmount = (parseFloat(b.plannedQty) || 0) * (parseFloat(b.rate) || 0);
    if (b.plannedAmount !== undefined) plannedAmount = parseFloat(b.plannedAmount) || 0;

    var [result] = await pool.query(
      `INSERT INTO boq_items (boq_sheet_id, project_id, item_no, is_category, description, unit,
        planned_qty, rate, planned_amount, actual_qty_used, is_pending)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.params.sheetId, projectId, b.itemNo || null, b.isCategory ? 1 : 0,
       b.description || null, b.unit || null,
       parseFloat(b.plannedQty) || 0, parseFloat(b.rate) || 0,
       plannedAmount, 0, 0]
    );

    await recalcSheetTotal(req.params.sheetId);

    var [rows] = await pool.query('SELECT * FROM boq_items WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /boq-items/:id — Update item
router.put('/boq-items/:id', verifyToken, async function(req, res) {
  try {
    var b = req.body;
    var fields = [];
    var values = [];

    if (b.itemNo !== undefined) { fields.push('item_no = ?'); values.push(b.itemNo); }
    if (b.isCategory !== undefined) { fields.push('is_category = ?'); values.push(b.isCategory ? 1 : 0); }
    if (b.description !== undefined) { fields.push('description = ?'); values.push(b.description); }
    if (b.unit !== undefined) { fields.push('unit = ?'); values.push(b.unit); }
    if (b.plannedQty !== undefined) { fields.push('planned_qty = ?'); values.push(parseFloat(b.plannedQty) || 0); }
    if (b.rate !== undefined) { fields.push('rate = ?'); values.push(parseFloat(b.rate) || 0); }
    if (b.plannedAmount !== undefined) { fields.push('planned_amount = ?'); values.push(parseFloat(b.plannedAmount) || 0); }
    if (b.isPending !== undefined) { fields.push('is_pending = ?'); values.push(b.isPending ? 1 : 0); }

    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

    // Auto-calculate planned_amount if qty/rate provided
    if (b.plannedQty !== undefined || b.rate !== undefined) {
      var [existing] = await pool.query('SELECT * FROM boq_items WHERE id = ?', [req.params.id]);
      if (existing.length) {
        var qty = b.plannedQty !== undefined ? parseFloat(b.plannedQty) : existing[0].planned_qty;
        var rate = b.rate !== undefined ? parseFloat(b.rate) : existing[0].rate;
        if (b.plannedAmount === undefined) {
          fields.push('planned_amount = ?');
          values.push(qty * rate);
        }
      }
    }

    values.push(req.params.id);
    await pool.query('UPDATE boq_items SET ' + fields.join(', ') + ' WHERE id = ?', values);

    // Recalc sheet total
    var [item] = await pool.query('SELECT boq_sheet_id FROM boq_items WHERE id = ?', [req.params.id]);
    if (item.length) await recalcSheetTotal(item[0].boq_sheet_id);

    var [rows] = await pool.query('SELECT * FROM boq_items WHERE id = ?', [req.params.id]);
    res.json(rows[0] || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /boq-items/:id — Delete item
router.delete('/boq-items/:id', verifyToken, requireRole('MD', 'HR'), async function(req, res) {
  try {
    var [item] = await pool.query('SELECT boq_sheet_id FROM boq_items WHERE id = ?', [req.params.id]);
    await pool.query('DELETE FROM boq_items WHERE id = ?', [req.params.id]);
    if (item.length) await recalcSheetTotal(item[0].boq_sheet_id);
    res.json({ message: 'BOQ item deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /boq-items/:id/pending — Toggle is_pending
router.patch('/boq-items/:id/pending', verifyToken, async function(req, res) {
  try {
    var [existing] = await pool.query('SELECT is_pending FROM boq_items WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: 'Item not found' });
    var newVal = existing[0].is_pending ? 0 : 1;
    await pool.query('UPDATE boq_items SET is_pending = ? WHERE id = ?', [newVal, req.params.id]);
    var [rows] = await pool.query('SELECT * FROM boq_items WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =====================================================
// USAGE LOGS
// =====================================================

// POST /boq-items/:id/usage — Log usage
router.post('/boq-items/:id/usage', verifyToken, async function(req, res) {
  try {
    var b = req.body;
    var qtyUsed = parseFloat(b.qtyUsed);
    if (!qtyUsed || qtyUsed <= 0) return res.status(400).json({ error: 'qtyUsed must be positive' });

    var [item] = await pool.query('SELECT project_id FROM boq_items WHERE id = ?', [req.params.id]);
    if (!item.length) return res.status(404).json({ error: 'Item not found' });

    await pool.query(
      'INSERT INTO usage_logs (boq_item_id, project_id, qty_used, note, logged_by) VALUES (?, ?, ?, ?, ?)',
      [req.params.id, item[0].project_id, qtyUsed, b.note || null, req.user.empCode]
    );

    await recalcItemUsage(req.params.id);

    var [rows] = await pool.query('SELECT * FROM boq_items WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /boq-items/:id/usage — Get usage history
router.get('/boq-items/:id/usage', verifyToken, async function(req, res) {
  try {
    var [rows] = await pool.query(
      'SELECT * FROM usage_logs WHERE boq_item_id = ? ORDER BY logged_at DESC',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =====================================================
// AGGREGATION ENDPOINTS
// =====================================================

// GET /projects/:pid/usage-summary — All items with planned vs actual
router.get('/projects/:pid/usage-summary', verifyToken, async function(req, res) {
  try {
    var [rows] = await pool.query(
      `SELECT bi.*, bs.sheet_type, bs.title as sheet_title
       FROM boq_items bi
       JOIN boq_sheets bs ON bi.boq_sheet_id = bs.id
       WHERE bi.project_id = ? AND bi.is_category = 0
       ORDER BY bs.id, bi.id`,
      [req.params.pid]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /projects/:pid/pending-works — All pending items
router.get('/projects/:pid/pending-works', verifyToken, async function(req, res) {
  try {
    var [rows] = await pool.query(
      `SELECT bi.*, bs.sheet_type, bs.title as sheet_title
       FROM boq_items bi
       JOIN boq_sheets bs ON bi.boq_sheet_id = bs.id
       WHERE bi.project_id = ? AND bi.is_pending = 1
       ORDER BY bs.id, bi.id`,
      [req.params.pid]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /projects/:pid/boq-summary — Per-sheet totals + grand total
router.get('/projects/:pid/boq-summary', verifyToken, async function(req, res) {
  try {
    var [sheets] = await pool.query(
      'SELECT id, sheet_type, title, area_sqft, quoted_rate_per_sqft, total_planned_amount FROM boq_sheets WHERE project_id = ? ORDER BY id',
      [req.params.pid]
    );
    var grandTotal = sheets.reduce(function(sum, s) { return sum + (s.total_planned_amount || 0); }, 0);
    res.json({ sheets: sheets, grandTotal: grandTotal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =====================================================
// DAILY WORK LOGS
// =====================================================

// GET /projects/:pid/daily-logs — List logs (newest first)
router.get('/projects/:pid/daily-logs', verifyToken, async function(req, res) {
  try {
    var [rows] = await pool.query(
      `SELECT dl.*, wt.task_name, wt.wbs_code
       FROM daily_work_logs dl
       LEFT JOIN wbs_tasks wt ON dl.task_id = wt.id
       WHERE dl.project_id = ?
       ORDER BY dl.log_date DESC, dl.created_at DESC`,
      [req.params.pid]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /projects/:pid/daily-logs — Create log
router.post('/projects/:pid/daily-logs', verifyToken, async function(req, res) {
  try {
    var b = req.body;
    if (!b.workDescription) return res.status(400).json({ error: 'workDescription is required' });

    var logDate = b.logDate || new Date().toISOString().split('T')[0];
    var loggedBy = b.loggedBy || req.user.empCode;

    var [result] = await pool.query(
      `INSERT INTO daily_work_logs (project_id, task_id, log_date, logged_by, workers_count,
        weather, work_description, materials_note, progress_update, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.params.pid, b.taskId || null, logDate, loggedBy,
       b.workersCount || null, b.weather || null,
       b.workDescription, b.materialsNote || null,
       b.progressUpdate || null, b.remarks || null]
    );

    // Auto-update task progress if provided
    if (b.taskId && b.progressUpdate !== undefined && b.progressUpdate !== null) {
      var pct = parseFloat(b.progressUpdate);
      if (!isNaN(pct) && pct >= 0 && pct <= 100) {
        var taskStatus = pct >= 100 ? 'completed' : pct > 0 ? 'in_progress' : 'pending';
        await pool.query(
          'UPDATE wbs_tasks SET progress_pct = ?, status = ? WHERE id = ?',
          [pct, taskStatus, b.taskId]
        );
      }
    }

    var [rows] = await pool.query(
      `SELECT dl.*, wt.task_name, wt.wbs_code
       FROM daily_work_logs dl
       LEFT JOIN wbs_tasks wt ON dl.task_id = wt.id
       WHERE dl.id = ?`,
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =====================================================
// EXCEL BOQ IMPORT
// =====================================================

// Sheet name mapping
var SHEET_MAP = {
  civil: ['ABSTRACT-CIVIL', 'ABSTRACT CIVIL', 'CIVIL'],
  peb: ['ABSTRACT-PEB', 'ABSTRACT PEB', 'PEB'],
  mezzanine_civil: ['ABSTRACT-MEZZ-CIVIL', 'ABSTRACT MEZZ CIVIL', 'MEZZ CIVIL', 'MEZZ-CIVIL'],
  mezzanine_peb: ['ABSTRACT-MEZZ-PEB', 'ABSTRACT MEZZ PEB', 'MEZZ PEB', 'MEZZ-PEB']
};

var SHEET_TITLES = {
  civil: 'Industrial Building \u2013 Civil Works',
  peb: 'Industrial Building \u2013 PEB Works',
  mezzanine_civil: 'Mezzanine Floor \u2013 Civil Works',
  mezzanine_peb: 'Mezzanine Floor \u2013 PEB Works'
};

function findWorksheet(wb, candidates) {
  var upperMap = {};
  wb.SheetNames.forEach(function(n) { upperMap[n.toUpperCase()] = n; });
  for (var i = 0; i < candidates.length; i++) {
    var key = candidates[i].toUpperCase();
    if (upperMap[key]) return wb.Sheets[upperMap[key]];
  }
  return null;
}

function toFloat(v) {
  if (v === null || v === undefined) return null;
  var n = parseFloat(String(v).replace(/,/g, ''));
  return isNaN(n) ? null : n;
}

function parseSummarySheet(wb) {
  var ws = findWorksheet(wb, ['SUMMARY', 'SUMMARY SHEET']);
  var result = {};
  if (!ws) return result;

  var data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
  data.forEach(function(row) {
    if (!row || !row.length) return;
    var sno = row[0];
    if (sno !== 1 && sno !== 2 && sno !== 3 && sno !== 4 &&
        sno !== '1' && sno !== '2' && sno !== '3' && sno !== '4') return;
    sno = parseInt(sno, 10);
    var desc = String(row[1] || '').trim();
    if (desc) {
      result[sno] = {
        description: desc,
        area_sqft: toFloat(row[2]),
        rate: toFloat(row[3]),
        amount: toFloat(row[4])
      };
    }
  });
  return result;
}

function parseAbstractSheet(ws) {
  if (!ws) return [];
  var data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
  if (!data.length) return [];

  // Find header row
  var headerIdx = -1;
  for (var r = 0; r < data.length; r++) {
    var text = data[r].map(function(c) { return String(c || '').toUpperCase(); }).join(' ');
    if (text.indexOf('ITEM') !== -1 && (text.indexOf('UNIT') !== -1 || text.indexOf('QTY') !== -1 || text.indexOf('QUANTITY') !== -1 || text.indexOf('RATE') !== -1)) {
      headerIdx = r;
      break;
    }
  }
  if (headerIdx === -1) headerIdx = 0;

  // Detect column positions (flexible matching)
  var colItemNo = 0, colDesc = 1, colUnit = 2, colQty = 3, colRate = -1, colAmount = -1;
  var colMaterialRate = -1, colLabourRate = -1, colMaterialAmount = -1, colLabourAmount = -1;
  var headerRow = data[headerIdx] || [];
  headerRow.forEach(function(cell, idx) {
    var txt = String(cell || '').toUpperCase().trim();
    if (['ITEM NO', 'ITEM', 'S.NO', 'SL NO', 'S NO'].indexOf(txt) !== -1) colItemNo = idx;
    else if (txt.indexOf('DESC') !== -1) colDesc = idx;
    else if (txt === 'UNIT') colUnit = idx;
    else if (txt === 'QUANTITY' || txt === 'QTY') colQty = idx;
    else if (txt.indexOf('MATERIAL') !== -1 && txt.indexOf('RATE') !== -1) colMaterialRate = idx;
    else if (txt.indexOf('LABOUR') !== -1 && txt.indexOf('RATE') !== -1) colLabourRate = idx;
    else if (txt.indexOf('MATERIAL') !== -1 && txt.indexOf('AMOUNT') !== -1) colMaterialAmount = idx;
    else if (txt.indexOf('LABOUR') !== -1 && txt.indexOf('AMOUNT') !== -1) colLabourAmount = idx;
    else if (txt.indexOf('RATE') !== -1 && colRate === -1) colRate = idx;
    else if ((txt.indexOf('AMOUNT') !== -1 || txt === 'AMT') && colAmount === -1) colAmount = idx;
  });

  // If no single rate/amount column found, use material columns as primary
  var hasSplitCols = colMaterialRate !== -1 || colLabourRate !== -1;
  if (colRate === -1) colRate = colMaterialRate !== -1 ? colMaterialRate : 4;
  if (colAmount === -1) colAmount = colMaterialAmount !== -1 ? colMaterialAmount : 5;

  var items = [];
  for (var i = headerIdx + 1; i < data.length; i++) {
    var row = data[i];
    if (!row || !row.some(function(c) { return c !== null && c !== ''; })) continue;

    var itemNo = String(row[colItemNo] || '').trim();
    var desc = String(row[colDesc] || '').trim();
    if (!itemNo && !desc) continue;

    var descUp = desc.toUpperCase();
    var itemUp = itemNo.toUpperCase();
    // Stop at final summary rows
    if (descUp.indexOf('GRAND TOTAL') !== -1 || itemUp.indexOf('GRAND TOTAL') !== -1) break;
    if (descUp.indexOf('QUOTED RATE') !== -1 || descUp.indexOf('SAY RS') !== -1 || descUp.indexOf('SAY RUPEES') !== -1) break;
    // Skip total/estimated/area rows
    if (descUp.indexOf('TOTAL') !== -1 || itemUp.indexOf('TOTAL') !== -1) continue;
    if (descUp.indexOf('AREA OF THE BUILDING') !== -1 || descUp.indexOf('RATE/ SQFT') !== -1 || descUp.indexOf('RATE/SQFT') !== -1) continue;

    var qty = toFloat(row[colQty]);

    // Handle split Material Rate + Labour Rate columns
    var rate, amount;
    if (hasSplitCols) {
      var matRate = colMaterialRate !== -1 ? (toFloat(row[colMaterialRate]) || 0) : 0;
      var labRate = colLabourRate !== -1 ? (toFloat(row[colLabourRate]) || 0) : 0;
      rate = matRate + labRate;
      var matAmt = colMaterialAmount !== -1 ? (toFloat(row[colMaterialAmount]) || 0) : 0;
      var labAmt = colLabourAmount !== -1 ? (toFloat(row[colLabourAmount]) || 0) : 0;
      amount = (matAmt + labAmt) || null;
    } else {
      rate = toFloat(row[colRate]);
      amount = toFloat(row[colAmount]);
    }

    var isCategory = (qty === null || qty === 0) && (rate === null || rate === 0);
    if (amount === null && qty && rate) amount = Math.round(qty * rate * 100) / 100;

    items.push({
      item_no: itemNo || desc.substring(0, 20),
      description: desc,
      unit: String(row[colUnit] || '').trim() || null,
      planned_qty: qty || 0,
      rate: rate || 0,
      planned_amount: amount || 0,
      is_category: isCategory ? 1 : 0,
      is_pending: 0,
      actual_qty_used: 0
    });
  }
  return items;
}

// Auto-detect sheet type from name
function detectSheetType(name) {
  var upper = name.toUpperCase();
  if (upper.indexOf('MEZZ') !== -1 && upper.indexOf('PEB') !== -1) return 'mezzanine_peb';
  if (upper.indexOf('MEZZ') !== -1 && upper.indexOf('CIVIL') !== -1) return 'mezzanine_civil';
  if (upper.indexOf('MEZZ') !== -1) return 'mezzanine_civil';
  if (upper.indexOf('CIVIL') !== -1) return 'civil';
  return 'peb';
}

// Discover all abstract/BOQ sheets in workbook
function discoverAbstractSheets(wb) {
  var sheets = [];
  wb.SheetNames.forEach(function(name) {
    var upper = name.toUpperCase();
    if (upper.indexOf('ABSTRACT') !== -1 || upper.indexOf('BOQ') !== -1) {
      sheets.push({
        name: name,
        type: detectSheetType(name),
        ws: wb.Sheets[name]
      });
    }
  });
  return sheets;
}

// POST /projects/:pid/import-boq — Upload Excel
router.post('/projects/:pid/import-boq', verifyToken, requireRole('MD', 'HR'), upload.single('file'), async function(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Check project exists
    var [proj] = await pool.query('SELECT id FROM projects WHERE id = ?', [req.params.pid]);
    if (!proj.length) return res.status(404).json({ error: 'Project not found' });

    var wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    var summaryData = parseSummarySheet(wb);

    // Delete existing BOQ data for this project
    await pool.query('DELETE FROM boq_items WHERE project_id = ?', [req.params.pid]);
    await pool.query('DELETE FROM boq_sheets WHERE project_id = ?', [req.params.pid]);
    // Also clear existing WBS tasks (will be regenerated from BOQ categories)
    await pool.query('DELETE FROM daily_work_logs WHERE project_id = ? AND task_id IN (SELECT id FROM wbs_tasks WHERE project_id = ?)', [req.params.pid, req.params.pid]).catch(function(){});
    await pool.query('DELETE FROM wbs_tasks WHERE project_id = ?', [req.params.pid]);

    // Auto-discover all abstract sheets from the workbook
    var abstractSheets = discoverAbstractSheets(wb);

    // If no abstract sheets found, try the 4 predefined types as fallback
    if (abstractSheets.length === 0) {
      var snoToType = { 1: 'civil', 2: 'peb', 3: 'mezzanine_civil', 4: 'mezzanine_peb' };
      for (var sno = 1; sno <= 4; sno++) {
        var ws = findWorksheet(wb, SHEET_MAP[snoToType[sno]]);
        if (ws) abstractSheets.push({ name: snoToType[sno], type: snoToType[sno], ws: ws });
      }
    }

    var imported = [];
    var wbsParentNum = 0;
    for (var si = 0; si < abstractSheets.length; si++) {
      var sheetInfo = abstractSheets[si];
      var sheetType = sheetInfo.type;
      // Use sheet name as title (clean up parentheses notation)
      var title = sheetInfo.name.replace(/^ABSTRACT[\s-]*/i, '').trim() || (SHEET_TITLES[sheetType] || sheetInfo.name);
      if (!title) title = sheetInfo.name;

      // Match summary data by position or type
      var pkg = summaryData[si + 1] || {};

      var itemsData = parseAbstractSheet(sheetInfo.ws);
      if (!itemsData.length) continue;

      var [sheetResult] = await pool.query(
        'INSERT INTO boq_sheets (project_id, sheet_type, title, area_sqft, quoted_rate_per_sqft, total_planned_amount) VALUES (?, ?, ?, ?, ?, ?)',
        [req.params.pid, sheetType, title, pkg.area_sqft || null, pkg.rate || null, pkg.amount || 0]
      );
      var sheetId = sheetResult.insertId;

      // Create level-1 WBS parent for this sheet
      wbsParentNum++;
      var parentCode = String(wbsParentNum);
      await pool.query(
        "INSERT INTO wbs_tasks (project_id, wbs_code, `level`, task_name, status) VALUES (?, ?, 1, ?, 'pending')",
        [req.params.pid, parentCode, title]
      );

      // Insert BOQ items + create level-2 WBS tasks from categories
      var catNum = 0;
      for (var j = 0; j < itemsData.length; j++) {
        var it = itemsData[j];
        await pool.query(
          'INSERT INTO boq_items (boq_sheet_id, project_id, item_no, is_category, description, unit, planned_qty, rate, planned_amount, actual_qty_used, is_pending) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [sheetId, req.params.pid, it.item_no, it.is_category, it.description, it.unit,
           it.planned_qty, it.rate, it.planned_amount, 0, 0]
        );

        // Each BOQ category becomes a level-2 WBS task
        if (it.is_category && it.description) {
          catNum++;
          var childCode = parentCode + '.' + catNum;
          var taskName = it.description.length > 1990 ? it.description.substring(0, 1990) + '...' : it.description;
          await pool.query(
            "INSERT INTO wbs_tasks (project_id, wbs_code, `level`, task_name, status) VALUES (?, ?, 2, ?, 'pending')",
            [req.params.pid, childCode, taskName]
          );
        }
      }

      // Recalc total from items
      await recalcSheetTotal(sheetId);

      imported.push({
        sheetType: sheetType,
        title: title,
        items: itemsData.length,
        total: pkg.amount || 0
      });
    }

    // Fetch generated WBS count for response
    var [wbsRows] = await pool.query('SELECT COUNT(*) as cnt FROM wbs_tasks WHERE project_id = ?', [req.params.pid]);
    var wbsCount = wbsRows[0] ? wbsRows[0].cnt : 0;

    res.json({ sheetsImported: imported.length, sheets: imported, wbsTasksCreated: wbsCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
