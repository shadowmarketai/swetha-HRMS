const router = require('express').Router();
const pool = require('../config/db');
const path = require('path');
const { verifyToken, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

// GET /api/documents — list all docs (MD/HR) or own docs (Employee)
router.get('/', verifyToken, async (req, res) => {
  try {
    let query, params;
    if (['MD', 'HR'].includes(req.user.role)) {
      query = 'SELECT d.*, e.name as emp_name FROM documents d JOIN employees e ON d.emp_code = e.code ORDER BY d.uploaded_at DESC';
      params = [];
    } else {
      query = 'SELECT * FROM documents WHERE emp_code = ? ORDER BY uploaded_at DESC';
      params = [req.user.empCode];
    }
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/documents/download/:id — MUST be before /:empCode
router.get('/download/:id', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM documents WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Document not found' });
    const doc = rows[0];
    // Ownership check: employees can only download their own documents
    if (doc.emp_code !== req.user.empCode && req.user.role === 'Employee') {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (doc.file_path && doc.file_path.includes('/uploads/')) {
      // Path traversal protection
      const uploadsDir = path.resolve(path.join(__dirname, '..', 'uploads'));
      const resolvedPath = path.resolve(doc.file_path);
      if (!resolvedPath.startsWith(uploadsDir)) {
        return res.status(403).json({ error: 'Invalid file path' });
      }
      return res.download(resolvedPath, doc.doc_name);
    }
    res.json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/documents/:empCode — employees can only view own docs, MD/HR can view anyone
router.get('/:empCode', verifyToken, async (req, res) => {
  try {
    if (!['MD', 'HR'].includes(req.user.role) && req.params.empCode !== req.user.empCode) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const [rows] = await pool.query('SELECT * FROM documents WHERE emp_code = ? ORDER BY uploaded_at DESC', [req.params.empCode]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/documents/upload — upload document (employees can only upload for themselves)
router.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { empCode, docType, docName } = req.body;
    // Employees can only upload for themselves; MD/HR can upload for anyone
    const code = (!['MD', 'HR'].includes(req.user.role)) ? req.user.empCode : (empCode || req.user.empCode);
    await pool.query(
      'INSERT INTO documents (emp_code, doc_type, doc_name, file_path, file_size, mime_type) VALUES (?, ?, ?, ?, ?, ?)',
      [code, docType || 'general', docName || req.file.originalname, req.file.path, req.file.size, req.file.mimetype]
    );
    const io = req.app.get('io');
    if (io) {
      io.to('role:MD').to('role:HR').emit('document:uploaded', { empCode: code, docType: docType || 'general', docName: docName || req.file.originalname });
      io.to('user:' + code).emit('document:uploaded', { empCode: code, docType: docType || 'general', docName: docName || req.file.originalname });
    }
    res.status(201).json({ message: 'Document uploaded', filename: req.file.filename });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/documents/generate — generate a document (offer letter, etc.)
router.post('/generate', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    const { empCode, docType, docName, content } = req.body;
    if (!empCode || !docType) return res.status(400).json({ error: 'empCode and docType required' });
    await pool.query(
      'INSERT INTO documents (emp_code, doc_type, doc_name, file_path, is_generated) VALUES (?, ?, ?, ?, 1)',
      [empCode, docType, docName || docType, content || '']
    );
    res.json({ message: 'Document generated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/documents/:id
router.delete('/:id', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    await pool.query('DELETE FROM documents WHERE id = ?', [req.params.id]);
    const io = req.app.get('io');
    if (io) {
      io.to('role:MD').to('role:HR').emit('document:deleted', { id: parseInt(req.params.id) });
    }
    res.json({ message: 'Document deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
