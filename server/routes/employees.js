const router = require('express').Router();
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { verifyToken, requireRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { auditLog } = require('../middleware/audit');

// GET /api/employees — list all (MD/HR gets full details, Employee gets directory + own full record)
router.get('/', verifyToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM employees WHERE is_active = 1');
    if (['MD', 'HR'].includes(req.user.role)) {
      const [rows] = await pool.query('SELECT * FROM employees WHERE is_active = 1 ORDER BY dept, name LIMIT ? OFFSET ?', [limit, offset]);
      return res.json({ data: rows, total, page, limit });
    }
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

// GET /api/employees/:code — IDOR protected
router.get('/:code', verifyToken, async (req, res) => {
  try {
    // Employees can only view their own record; MD/HR can view anyone
    if (req.user.role === 'Employee' && req.params.code !== req.user.empCode) {
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
    const { code, name, dept, designation, salary, bank, accNo, role, phone, doj } = req.body;
    if (!code || !name || !dept) {
      return res.status(400).json({ error: 'Code, name, and department required' });
    }
    await pool.query(
      'INSERT INTO employees (code, name, dept, designation, salary, bank, acc_no, role, phone, doj) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [code, name, dept, designation || '', salary || 0, bank || '', accNo || '', role || 'Employee', phone || '', doj || null]
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
    // All profile fields
    await pool.query(
      `UPDATE employees SET phone=?, dob=?, email=?, blood_group=?, marital_status=?,
       present_address=?, permanent_address=?,
       father_name=?, father_mobile=?, mother_name=?, mother_mobile=?,
       spouse_name=?, spouse_mobile=?, emergency_contact=?, emergency_phone=?,
       dept=?, designation=?, doj=?, salary=?,
       bank=?, acc_no=?, pan=?, aadhaar=?, uan=?,
       qualification=?, institution=?, year_of_passing=?,
       previous_employer=?, previous_role=?, years_of_experience=? WHERE code=?`,
      [
        v(b.phone, cur.phone), v(b.dob, cur.dob), v(b.email, cur.email),
        v(b.bloodGroup, cur.blood_group), v(b.maritalStatus, cur.marital_status),
        v(b.presentAddress, cur.present_address), v(b.permanentAddress, cur.permanent_address),
        v(b.fatherName, cur.father_name), v(b.fatherMobile, cur.father_mobile),
        v(b.motherName, cur.mother_name), v(b.motherMobile, cur.mother_mobile),
        v(b.spouseName, cur.spouse_name), v(b.spouseMobile, cur.spouse_mobile),
        v(b.emergencyContact, cur.emergency_contact), v(b.emergencyPhone, cur.emergency_phone),
        v(b.dept, cur.dept), v(b.designation, cur.designation), v(b.doj, cur.doj), v(b.salary, cur.salary),
        v(b.bank, cur.bank), v(b.accNo, cur.acc_no), v(b.pan, cur.pan), v(b.aadhaar, cur.aadhaar), v(b.uan, cur.uan),
        v(b.qualification, cur.qualification), v(b.institution, cur.institution),
        v(b.yearOfPassing, cur.year_of_passing),
        v(b.previousEmployer, cur.previous_employer), v(b.previousRole, cur.previous_role),
        v(b.yearsOfExperience, cur.years_of_experience), req.params.code
      ]
    );
    res.json({ message: 'Personal details updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/employees/:code/photo — upload profile photo
const upload = require('../middleware/upload');
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
      maritalStatus: 'marital_status'
    };

    const setClauses = [];
    const values = [];
    for (const [jsKey, dbCol] of Object.entries(fieldMap)) {
      if (b[jsKey] !== undefined) {
        setClauses.push(`${dbCol} = ?`);
        values.push(b[jsKey]);
      }
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

// DELETE /api/employees/:code — soft delete
router.delete('/:code', verifyToken, requireRole('MD'), auditLog('delete', 'employee'), async (req, res) => {
  try {
    await pool.query('UPDATE employees SET is_active = 0 WHERE code = ?', [req.params.code]);
    res.json({ message: 'Employee deactivated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
