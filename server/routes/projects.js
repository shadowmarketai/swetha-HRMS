const router = require('express').Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET /api/projects — list all with nested tasks, team, materials
router.get('/', verifyToken, async (req, res) => {
  try {
    const [projects] = await pool.query('SELECT * FROM projects ORDER BY id');
    const [tasks] = await pool.query('SELECT * FROM project_tasks ORDER BY project_id, id');
    const [team] = await pool.query('SELECT * FROM project_team ORDER BY project_id');
    const [materials] = await pool.query('SELECT * FROM project_materials ORDER BY project_id, id');

    const result = projects.map(p => {
      p.tasks = tasks.filter(t => t.project_id === p.id);
      p.team = team.filter(t => t.project_id === p.id).map(t => t.emp_code);
      p.materials = materials.filter(m => m.project_id === p.id);
      return p;
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/projects — create (MD/HR)
router.post('/', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    const { name, client, location, budget, status, startDate, targetDate } = req.body;
    if (!name) return res.status(400).json({ error: 'Project name is required' });

    const [result] = await pool.query(
      `INSERT INTO projects (name, client, location, budget, status, start_date, target_date, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, client || null, location || null, budget || 0, status || 'Not Started',
       startDate || null, targetDate || null, req.user.empCode]
    );

    const [rows] = await pool.query('SELECT * FROM projects WHERE id = ?', [result.insertId]);
    const proj = rows[0];
    proj.tasks = [];
    proj.team = [];
    proj.materials = [];
    res.status(201).json(proj);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/projects/:id — update
router.put('/:id', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    const { name, client, location, budget, status, startDate, targetDate } = req.body;
    await pool.query(
      `UPDATE projects SET name = ?, client = ?, location = ?, budget = ?, status = ?,
       start_date = ?, target_date = ? WHERE id = ?`,
      [name, client || null, location || null, budget || 0, status || 'Not Started',
       startDate || null, targetDate || null, req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    res.json(rows[0] || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/projects/:id — delete (MD only)
router.delete('/:id', verifyToken, requireRole('MD'), async (req, res) => {
  try {
    // Cascade deletes handled by FK
    await pool.query('DELETE FROM project_materials WHERE project_id = ?', [req.params.id]);
    await pool.query('DELETE FROM project_team WHERE project_id = ?', [req.params.id]);
    await pool.query('DELETE FROM project_tasks WHERE project_id = ?', [req.params.id]);
    await pool.query('DELETE FROM projects WHERE id = ?', [req.params.id]);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/projects/:id/tasks — add task
router.post('/:id/tasks', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    const { title, description, priority, assignedTo, status, dueDate } = req.body;
    if (!title) return res.status(400).json({ error: 'Task title is required' });

    const [result] = await pool.query(
      `INSERT INTO project_tasks (project_id, title, description, priority, assigned_to, status, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.params.id, title, description || null, priority || 'Medium',
       assignedTo || null, status || 'Pending', dueDate || null]
    );

    const [rows] = await pool.query('SELECT * FROM project_tasks WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/projects/:id/tasks/:taskId — update task
router.put('/:id/tasks/:taskId', verifyToken, async (req, res) => {
  try {
    const { title, description, priority, assignedTo, status, dueDate } = req.body;
    const fields = [];
    const values = [];

    if (title !== undefined) { fields.push('title = ?'); values.push(title); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (priority !== undefined) { fields.push('priority = ?'); values.push(priority); }
    if (assignedTo !== undefined) { fields.push('assigned_to = ?'); values.push(assignedTo); }
    if (status !== undefined) { fields.push('status = ?'); values.push(status); }
    if (dueDate !== undefined) { fields.push('due_date = ?'); values.push(dueDate); }

    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

    values.push(req.params.taskId, req.params.id);
    await pool.query(`UPDATE project_tasks SET ${fields.join(', ')} WHERE id = ? AND project_id = ?`, values);

    const [rows] = await pool.query('SELECT * FROM project_tasks WHERE id = ?', [req.params.taskId]);
    res.json(rows[0] || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/projects/:id/tasks/:taskId — delete task
router.delete('/:id/tasks/:taskId', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    await pool.query('DELETE FROM project_tasks WHERE id = ? AND project_id = ?', [req.params.taskId, req.params.id]);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/projects/:id/team — add member
router.post('/:id/team', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    const { empCode } = req.body;
    if (!empCode) return res.status(400).json({ error: 'empCode is required' });

    await pool.query(
      'INSERT IGNORE INTO project_team (project_id, emp_code) VALUES (?, ?)',
      [req.params.id, empCode]
    );
    res.status(201).json({ message: 'Member added' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/projects/:id/team/:empCode — remove member
router.delete('/:id/team/:empCode', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM project_team WHERE project_id = ? AND emp_code = ?',
      [req.params.id, req.params.empCode]
    );
    res.json({ message: 'Member removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/projects/:id/materials/bulk — bulk save materials
router.post('/:id/materials/bulk', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    const { materials } = req.body;
    if (!Array.isArray(materials)) return res.status(400).json({ error: 'materials array required' });

    // Delete existing materials for this project and re-insert
    await pool.query('DELETE FROM project_materials WHERE project_id = ?', [req.params.id]);

    for (const m of materials) {
      await pool.query(
        `INSERT INTO project_materials (project_id, name, unit, total, used, remaining)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [req.params.id, m.name || '', m.unit || '', m.total || 0, m.used || 0, m.remaining || 0]
      );
    }

    const [rows] = await pool.query('SELECT * FROM project_materials WHERE project_id = ? ORDER BY id', [req.params.id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
