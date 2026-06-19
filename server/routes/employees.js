const router = require('express').Router();
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { verifyToken, requireRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { auditLog } = require('../middleware/audit');
const upload = require('../middleware/upload');

// GET /api/employees — list all (MD/HR gets full details, Employee gets directory + own full record)
router.get('/', verifyToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    if (['MD', 'HR'].includes(req.user.role)) {
      const [countResult] = await pool.query('SELECT COUNT(*) as total FROM employees');
      const total = (countResult && countResult[0]) ? countResult[0].total : 0;
      const [rows] = await pool.query('SELECT * FROM employees ORDER BY is_active DESC, dept, name LIMIT ? OFFSET ?', [limit, offset]);
      return res.json({ data: rows, total, page, limit });
    }
    const [countResult] = await pool.query('SELECT COUNT(*) as total FROM employees WHERE is_active = 1');
    const total = (countResult && countResult[0]) ? countResult[0].total : 0;
    // Employee: return all employees with public fields; own record gets full details
    const [pubRows] = await pool.query(
      'SELECT code, name, dept, designation, role, phone, doj, email, photo_url, is_active FROM employees WHERE is_active = 1 AND code != ? ORDER BY dept, name LIMIT ? OFFSET ?',
      [req.user.empCode, limit, offset]
    );
    const [selfRows] = await pool.query('SELECT * FROM employees WHERE code = ?', [req.user.empCode]);
    const rows = selfRows.concat(pubRows);
    res.json({ data: rows, total, page, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/employees/:code/lock-status — get profile section lock status for an employee
router.get('/:code/lock-status', verifyToken, async (req, res) => {
  try {
    if (req.user.empCode !== req.params.code && !['MD', 'HR'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const [empRows] = await pool.query('SELECT profile_sections_locked FROM employees WHERE code = ?', [req.params.code]);
    if (empRows.length === 0) return res.status(404).json({ error: 'Employee not found' });
    let locks = {};
    try { locks = JSON.parse(empRows[0].profile_sections_locked || '{}'); } catch (e) { locks = {}; }

    const [pendingReqs] = await pool.query(
      'SELECT id, section, reason, requested_at FROM document_edit_requests WHERE emp_code = ? AND status = ?',
      [req.params.code, 'pending']
    );
    const [approvedReqs] = await pool.query(
      'SELECT id, section, reason, reviewed_at FROM document_edit_requests WHERE emp_code = ? AND status = ?',
      [req.params.code, 'approved']
    );

    // Fetch uploaded documents for lockable sections
    const [docs] = await pool.query(
      "SELECT id, doc_type, doc_name, file_path, uploaded_at FROM documents WHERE emp_code = ? AND doc_type IN ('educational_cert','bank_passbook','experience_cert')",
      [req.params.code]
    );

    res.json({ locks, pending_requests: pendingReqs, approved_requests: approvedReqs, documents: docs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/employees/:code/request-edit — employee requests to edit a locked section
router.post('/:code/request-edit', verifyToken, async (req, res) => {
  try {
    if (req.user.empCode !== req.params.code) {
      return res.status(403).json({ error: 'You can only request edits for your own profile' });
    }
    const { section, reason } = req.body;
    const validSections = ['profile_details', 'educational_certs', 'bank_passbook', 'bank_details', 'experience_certs'];
    if (!validSections.includes(section)) {
      return res.status(400).json({ error: 'Invalid section' });
    }
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Reason is required' });
    }

    // Check for duplicate pending or approved request
    const [existing] = await pool.query(
      'SELECT id FROM document_edit_requests WHERE emp_code = ? AND section = ? AND status IN (?, ?)',
      [req.params.code, section, 'pending', 'approved']
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'You already have a pending or approved edit request for this section' });
    }

    await pool.query(
      'INSERT INTO document_edit_requests (emp_code, section, reason) VALUES (?, ?, ?)',
      [req.params.code, section, reason.trim()]
    );

    // Notify HR/MD
    const emp = await pool.query('SELECT name FROM employees WHERE code = ?', [req.params.code]);
    const empName = emp[0] && emp[0][0] ? emp[0][0].name : req.params.code;
    await pool.query(
      "INSERT INTO notifications (emp_code, title, message, type) SELECT code, ?, ?, 'general' FROM employees WHERE role IN ('MD','HR') AND is_active = 1",
      ['Profile Edit Request', empName + ' requested to edit ' + section.replace(/_/g, ' ')]
    ).catch(() => {});

    const io = req.app.get('io');
    if (io) {
      io.to('role:MD').to('role:HR').emit('notification', {
        title: 'Profile Edit Request',
        message: empName + ' requested to edit ' + section.replace(/_/g, ' '),
        type: 'info'
      });
    }

    res.json({ message: 'Edit request submitted for HR approval' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/employees/:code/documents — view employee documents (HR/MD or self)
router.get('/:code/documents', verifyToken, async (req, res) => {
  try {
    if (req.user.empCode !== req.params.code && !['MD', 'HR'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const [docs] = await pool.query(
      'SELECT id, doc_type, doc_name, file_path, file_size, mime_type, uploaded_at FROM documents WHERE emp_code = ? ORDER BY uploaded_at DESC',
      [req.params.code]
    );
    // Also include aadhaar/pan photo URLs from employees table
    const [empRows] = await pool.query('SELECT aadhaar_photo_url, pan_photo_url FROM employees WHERE code = ?', [req.params.code]);
    const idDocs = [];
    if (empRows.length > 0) {
      if (empRows[0].aadhaar_photo_url) idDocs.push({ doc_type: 'aadhaar_photo', doc_name: 'Aadhaar Card', file_path: empRows[0].aadhaar_photo_url });
      if (empRows[0].pan_photo_url) idDocs.push({ doc_type: 'pan_photo', doc_name: 'PAN Card', file_path: empRows[0].pan_photo_url });
    }
    res.json({ data: idDocs.concat(docs) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/employees/:code — IDOR protected
router.get('/:code', verifyToken, async (req, res) => {
  try {
    // Employees can only view their own record; MD/HR can view anyone
    if (!['MD', 'HR'].includes(req.user.role) && req.params.code !== req.user.empCode) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const [rows] = await pool.query('SELECT * FROM employees WHERE code = ?', [req.params.code]);
    if (rows.length === 0) return res.status(404).json({ error: 'Employee not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/employees — add new (MD/HR only)
router.post('/', verifyToken, requireRole('MD', 'HR'), [
  body('code').trim().notEmpty().withMessage('Employee code required'),
  body('name').trim().notEmpty().isLength({ max: 100 }).withMessage('Name required (max 100 chars)'),
  body('dept').trim().notEmpty().withMessage('Department required'),
  body('salary').optional().isNumeric()
], auditLog('create', 'employee'), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
  try {
    const { code, name, dept, designation, salary, bank, accNo, role, phone, doj,
            email, dob, gender, address, aadhaar, pan, ifscCode,
            emergencyContact, emergencyPhone } = req.body;
    if (!code || !name || !dept) {
      return res.status(400).json({ error: 'Code, name, and department required' });
    }
    await pool.query(
      `INSERT INTO employees (code, name, dept, designation, salary, bank, acc_no, role, phone, doj,
        email, dob, gender, address, aadhaar, pan, ifsc_code, emergency_contact, emergency_phone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [code, name, dept, designation || '', salary || 0, bank || '', accNo || '', role || 'Employee',
       phone || '', doj || null, email || '', dob || null, gender || '', address || '',
       aadhaar || '', pan || '', ifscCode || '', emergencyContact || '', emergencyPhone || '']
    );
    res.status(201).json({ message: 'Employee added', code });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Employee code already exists' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/employees/:code/self — employee self-update (personal fields only)
router.put('/:code/self', verifyToken, auditLog('update', 'employee'), async (req, res) => {
  try {
    if (req.user.empCode !== req.params.code) {
      return res.status(403).json({ error: 'You can only update your own record' });
    }
    const [existing] = await pool.query('SELECT * FROM employees WHERE code = ?', [req.params.code]);
    if (existing.length === 0) return res.status(404).json({ error: 'Employee not found' });
    const cur = existing[0];
    const b = req.body;
    // Helper: use new value if provided (non-empty), else keep current
    const v = (newVal, curVal) => (newVal !== undefined && newVal !== null && newVal !== '') ? newVal : curVal;
    // Check lock status — if profile is locked, block all changes unless approved
    let locks = {};
    try { locks = JSON.parse(cur.profile_sections_locked || '{}'); } catch (e) { locks = {}; }

    if (locks.profile_details) {
      const [approved] = await pool.query(
        "SELECT id FROM document_edit_requests WHERE emp_code = ? AND section = 'profile_details' AND status = 'approved' LIMIT 1",
        [req.params.code]
      );
      if (approved.length === 0) {
        return res.status(403).json({ error: 'Profile is locked after initial save. Request HR approval to edit.' });
      }
    }

    // Check bank_details lock separately — prevent bank field changes without explicit approval
    let bankEditable = true;
    if (locks.bank_details) {
      const [bankApproval] = await pool.query(
        "SELECT id FROM document_edit_requests WHERE emp_code = ? AND section = 'bank_details' AND status = 'approved' LIMIT 1",
        [req.params.code]
      );
      bankEditable = bankApproval.length > 0;
    }
    // If bank_details locked and no approval, preserve existing bank values
    const bk = (val) => bankEditable ? val : undefined;

    // Personal profile fields only — employees CANNOT change dept, designation, doj, salary, role
    await pool.query(
      `UPDATE employees SET phone=?, dob=?, email=?, blood_group=?, marital_status=?,
       present_address=?, permanent_address=?,
       father_name=?, father_mobile=?, mother_name=?, mother_mobile=?,
       spouse_name=?, spouse_mobile=?, emergency_contact=?, emergency_phone=?,
       bank=?, acc_no=?, pan=?, aadhaar=?, uan=?,
       qualification=?, institution=?, year_of_passing=?,
       previous_employer=?, previous_role=?, years_of_experience=?,
       ifsc_code=?, bank_branch=? WHERE code=?`,
      [
        v(b.phone, cur.phone), v(b.dob, cur.dob), v(b.email, cur.email),
        v(b.bloodGroup, cur.blood_group), v(b.maritalStatus, cur.marital_status),
        v(b.presentAddress, cur.present_address), v(b.permanentAddress, cur.permanent_address),
        v(b.fatherName, cur.father_name), v(b.fatherMobile, cur.father_mobile),
        v(b.motherName, cur.mother_name), v(b.motherMobile, cur.mother_mobile),
        v(b.spouseName, cur.spouse_name), v(b.spouseMobile, cur.spouse_mobile),
        v(b.emergencyContact, cur.emergency_contact), v(b.emergencyPhone, cur.emergency_phone),
        v(bk(b.bank), cur.bank), v(bk(b.accNo), cur.acc_no), v(bk(b.pan), cur.pan), v(bk(b.aadhaar), cur.aadhaar), v(bk(b.uan), cur.uan),
        v(b.qualification, cur.qualification), v(b.institution, cur.institution),
        v(b.yearOfPassing, cur.year_of_passing),
        v(b.previousEmployer, cur.previous_employer), v(b.previousRole, cur.previous_role),
        v(b.yearsOfExperience, cur.years_of_experience),
        v(bk(b.ifscCode), cur.ifsc_code), v(bk(b.bankBranch), cur.bank_branch), req.params.code
      ]
    );

    // After save: lock profile_details and bank_details sections
    locks.profile_details = true;
    locks.bank_details = true;
    await pool.query('UPDATE employees SET profile_sections_locked = ? WHERE code = ?', [JSON.stringify(locks), req.params.code]);
    // Mark approved edit requests as used
    await pool.query(
      "UPDATE document_edit_requests SET status = 'used' WHERE emp_code = ? AND section IN ('profile_details','bank_details') AND status = 'approved'",
      [req.params.code]
    ).catch(() => {});

    res.json({ message: 'Personal details updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/employees/upload-doc — generic document upload (returns URL)
router.post('/upload-doc', verifyToken, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = '/uploads/' + req.file.filename;
    // Optionally save to employee record if docType specified
    const { docType } = req.body || {};
    if (docType && req.user.empCode) {
      // Whitelist docType to prevent column injection
      if (docType === 'aadhaar_photo') {
        await pool.query('UPDATE employees SET aadhaar_photo_url = ? WHERE code = ?', [url, req.user.empCode]).catch(() => {});
      } else if (docType === 'pan_photo') {
        await pool.query('UPDATE employees SET pan_photo_url = ? WHERE code = ?', [url, req.user.empCode]).catch(() => {});
      } else if (['educational_cert', 'bank_passbook', 'experience_cert'].includes(docType)) {
        // Check lock status before allowing upload
        const sectionMap = { educational_cert: 'educational_certs', bank_passbook: 'bank_passbook', experience_cert: 'experience_certs' };
        const section = sectionMap[docType];
        const [empRows] = await pool.query('SELECT profile_sections_locked FROM employees WHERE code = ?', [req.user.empCode]);
        let locks = {};
        if (empRows.length > 0) {
          try { locks = JSON.parse(empRows[0].profile_sections_locked || '{}'); } catch (e) { locks = {}; }
        }
        if (locks[section]) {
          // Check for approved edit request
          const [approved] = await pool.query(
            'SELECT id FROM document_edit_requests WHERE emp_code = ? AND section = ? AND status = ?',
            [req.user.empCode, section, 'approved']
          );
          if (approved.length === 0) {
            return res.status(403).json({ error: 'This section is locked. Request HR approval to upload new documents.' });
          }
        }
        // Save to documents table
        const docName = req.body.docName || req.file.originalname || docType;
        await pool.query(
          'INSERT INTO documents (emp_code, doc_type, doc_name, file_path, file_size, mime_type) VALUES (?, ?, ?, ?, ?, ?)',
          [req.user.empCode, docType, docName, url, req.file.size || 0, req.file.mimetype || '']
        ).catch(() => {});

        // Lock the section after upload
        locks[section] = true;
        await pool.query('UPDATE employees SET profile_sections_locked = ? WHERE code = ?', [JSON.stringify(locks), req.user.empCode]).catch(() => {});
        // Mark approved edit requests as used
        await pool.query(
          "UPDATE document_edit_requests SET status = 'used' WHERE emp_code = ? AND section = ? AND status = 'approved'",
          [req.user.empCode, section]
        ).catch(() => {});

        // Notify HR/MD about document upload
        const [empInfo] = await pool.query('SELECT name FROM employees WHERE code = ?', [req.user.empCode]).catch(() => [[]]);
        const uploaderName = empInfo && empInfo[0] ? empInfo[0].name : req.user.empCode;
        const sectionLabel = section.replace(/_/g, ' ');
        await pool.query(
          "INSERT INTO notifications (emp_code, title, message, type) SELECT code, ?, ?, 'general' FROM employees WHERE role IN ('MD','HR') AND is_active = 1",
          ['Document Uploaded', uploaderName + ' uploaded a ' + sectionLabel + ' document']
        ).catch(() => {});
        const io = req.app.get('io');
        if (io) {
          io.to('role:MD').to('role:HR').emit('notification', {
            title: 'Document Uploaded',
            message: uploaderName + ' uploaded a ' + sectionLabel + ' document',
            type: 'info'
          });
        }
      }
    }
    res.json({ url, filename: req.file.filename, message: 'Document uploaded' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// POST /api/employees/:code/photo — upload profile photo
router.post('/:code/photo', verifyToken, upload.single('photo'), async (req, res) => {
  try {
    if (req.user.empCode !== req.params.code && req.user.role !== 'MD' && req.user.role !== 'HR') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (!req.file) return res.status(400).json({ error: 'No photo uploaded' });
    const photo_url = '/uploads/' + req.file.filename;
    await pool.query('UPDATE employees SET photo_url = ? WHERE code = ?', [photo_url, req.params.code]);
    res.json({ photo_url, message: 'Photo uploaded' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// PUT /api/employees/:code — update (partial updates supported, MD/HR only)
// Dynamically builds UPDATE query with only provided fields to avoid column-not-exists errors
router.put('/:code', verifyToken, requireRole('MD', 'HR'), auditLog('update', 'employee'), async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT * FROM employees WHERE code = ?', [req.params.code]);
    if (existing.length === 0) return res.status(404).json({ error: 'Employee not found' });
    const cur = existing[0];
    const b = req.body;

    // Map frontend camelCase keys to DB snake_case columns
    const fieldMap = {
      name: 'name', dept: 'dept', designation: 'designation', salary: 'salary',
      bank: 'bank', accNo: 'acc_no', role: 'role', phone: 'phone', doj: 'doj',
      email: 'email', address: 'address', dob: 'dob',
      presentAddress: 'present_address', permanentAddress: 'permanent_address',
      fatherName: 'father_name', fatherMobile: 'father_mobile',
      motherName: 'mother_name', motherMobile: 'mother_mobile',
      spouseName: 'spouse_name', spouseMobile: 'spouse_mobile',
      bloodGroup: 'blood_group', pan: 'pan', aadhaar: 'aadhaar', uan: 'uan',
      qualification: 'qualification', institution: 'institution',
      yearOfPassing: 'year_of_passing', previousEmployer: 'previous_employer',
      previousRole: 'previous_role', yearsOfExperience: 'years_of_experience',
      maritalStatus: 'marital_status', ifscCode: 'ifsc_code', bankBranch: 'bank_branch'
    };

    const setClauses = [];
    const values = [];
    for (const [jsKey, dbCol] of Object.entries(fieldMap)) {
      if (b[jsKey] !== undefined) {
        setClauses.push(`${dbCol} = ?`);
        values.push(b[jsKey]);
      }
    }

    // Handle status → is_active (0/1) separately since it needs value translation
    if (b.status !== undefined) {
      setClauses.push('is_active = ?');
      values.push(b.status === 'Active' ? 1 : 0);
    }

    if (setClauses.length === 0) return res.status(400).json({ error: 'No fields to update' });

    values.push(req.params.code);
    await pool.query(`UPDATE employees SET ${setClauses.join(', ')} WHERE code = ?`, values);

    // Sync role to users table if role changed
    if (b.role && b.role !== cur.role) {
      const defaultHash = await bcrypt.hash('emp123', 10);
      await pool.query(
        'INSERT INTO users (emp_code, password_hash, role) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE role = VALUES(role)',
        [req.params.code, defaultHash, b.role]
      );
    }
    res.json({ message: 'Employee updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/employees/:code — hard delete (permanently removes employee + auth + cascaded data)
// Allowed for MD or SuperAdmin
router.delete('/:code', verifyToken, auditLog('delete', 'employee'), async (req, res) => {
  if (!req.user || (req.user.role !== 'MD' && req.user.role !== 'HR' && !req.user.isSuperAdmin)) {
    return res.status(403).json({ error: 'Only MD, HR, or SuperAdmin can delete employees' });
  }
  const code = req.params.code;
  if (code === 'MD001' || code === 'SADMIN') {
    return res.status(400).json({ error: 'Cannot delete protected account' });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    // Tables without ON DELETE CASCADE FK to employees — clear manually
    await conn.query('DELETE FROM feature_access WHERE emp_code = ?', [code]);
    await conn.query('DELETE FROM users WHERE emp_code = ?', [code]);
    // Employees row — all related rows with ON DELETE CASCADE are removed automatically
    const [result] = await conn.query('DELETE FROM employees WHERE code = ?', [code]);
    await conn.commit();
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json({ message: 'Employee permanently deleted' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    conn.release();
  }
});

module.exports = router;
