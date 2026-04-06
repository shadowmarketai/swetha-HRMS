const router = require('express').Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');

// GET /api/tasks — list tasks (paginated)
router.get('/', verifyToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const offset = (page - 1) * limit;
    let query = 'SELECT t.*, e.name as assignee_name FROM tasks t LEFT JOIN employees e ON t.assigned_to = e.code';
    if (!['MD', 'HR'].includes(req.user.role)) {
      query += ' WHERE t.assigned_to = ?';
      const [rows] = await pool.query(query + ' ORDER BY t.due_date LIMIT ? OFFSET ?', [req.user.empCode, limit, offset]);
      return res.json(rows);
    }
    const [rows] = await pool.query(query + ' ORDER BY t.due_date LIMIT ? OFFSET ?', [limit, offset]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tasks — create task
router.post('/', verifyToken, requireRole('MD', 'HR'), auditLog('create', 'task'), async (req, res) => {
  try {
    const { title, description, type, assignedTo, dueDate, priority, note } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
    const [result] = await pool.query(
      'INSERT INTO tasks (title, description, type, assigned_to, assigned_by, due_date, priority, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [title, description || '', type || 'routine', assignedTo || null, req.user.empCode, dueDate || null, priority || 'medium', note || '']
    );
    const io = req.app.get('io');
    if (io) {
      io.to('role:MD').to('role:HR').emit('task:created', { id: result.insertId, title, assignedTo: assignedTo || null });
      if (assignedTo) {
        io.to('user:' + assignedTo).emit('task:created', { id: result.insertId, title });
      }
    }
    res.status(201).json({ message: 'Task created', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/tasks/:id/toggle — toggle task done/undone
router.patch('/:id/toggle', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT done, assigned_to, created_by FROM tasks WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    // Only task assignee, creator, or MD/HR can toggle
    if (!['MD', 'HR'].includes(req.user.role) && rows[0].assigned_to !== req.user.empCode && rows[0].assigned_to !== 'ALL' && rows[0].created_by !== req.user.empCode) {
      return res.status(403).json({ error: 'You can only toggle your own tasks' });
    }
    const newDone = rows[0].done ? 0 : 1;
    const newStatus = newDone ? 'done' : 'pending';
    await pool.query('UPDATE tasks SET done = ?, status = ? WHERE id = ?', [newDone, newStatus, req.params.id]);
    const io = req.app.get('io');
    if (io) {
      io.to('role:MD').to('role:HR').emit('task:toggled', { id: parseInt(req.params.id), done: !!newDone, status: newStatus });
    }
    res.json({ message: 'Task toggled', done: !!newDone });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/tasks/:id/assign — reassign task
router.patch('/:id/assign', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    const { assignedTo } = req.body;
    await pool.query('UPDATE tasks SET assigned_to = ? WHERE id = ?', [assignedTo, req.params.id]);
    res.json({ message: 'Task reassigned' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/tasks/:id — update task (only creator, assignee, or HR/MD)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT assigned_to, assigned_by FROM tasks WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Task not found' });
    const task = existing[0];
    if (!['MD', 'HR'].includes(req.user.role) && task.assigned_to !== req.user.empCode && task.assigned_by !== req.user.empCode) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const { title, description, type, dueDate, priority, note } = req.body;
    await pool.query(
      'UPDATE tasks SET title=?, description=?, type=?, due_date=?, priority=?, note=? WHERE id=?',
      [title, description, type, dueDate, priority, note, req.params.id]
    );
    const io = req.app.get('io');
    if (io) {
      io.to('role:MD').to('role:HR').emit('task:updated', { id: parseInt(req.params.id), title });
      if (task.assigned_to) {
        io.to('user:' + task.assigned_to).emit('task:updated', { id: parseInt(req.params.id), title });
      }
    }
    res.json({ message: 'Task updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', verifyToken, requireRole('MD', 'HR'), auditLog('delete', 'task'), async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id = ?', [req.params.id]);
    const io = req.app.get('io');
    if (io) {
      io.to('role:MD').to('role:HR').emit('task:deleted', { id: parseInt(req.params.id) });
    }
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
