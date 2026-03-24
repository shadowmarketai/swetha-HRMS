const router = require('express').Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET /api/geofence/sites — all active sites
router.get('/sites', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM geofence_sites WHERE is_active = 1 ORDER BY name'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/geofence/sites — create site (MD/HR)
router.post('/sites', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    const { name, lat, lng, radius } = req.body;
    if (!name || lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'name, lat, and lng are required' });
    }
    const [result] = await pool.query(
      'INSERT INTO geofence_sites (name, lat, lng, radius, created_by) VALUES (?, ?, ?, ?, ?)',
      [name, lat, lng, radius || 200, req.user.empCode]
    );
    const [rows] = await pool.query('SELECT * FROM geofence_sites WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/geofence/sites/:id — update site (MD/HR)
router.put('/sites/:id', verifyToken, requireRole('MD', 'HR'), async (req, res) => {
  try {
    const { name, lat, lng, radius } = req.body;
    await pool.query(
      'UPDATE geofence_sites SET name = ?, lat = ?, lng = ?, radius = ? WHERE id = ?',
      [name, lat, lng, radius || 200, req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM geofence_sites WHERE id = ?', [req.params.id]);
    res.json(rows[0] || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/geofence/sites/:id — soft delete (MD only)
router.delete('/sites/:id', verifyToken, requireRole('MD'), async (req, res) => {
  try {
    await pool.query('UPDATE geofence_sites SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Site deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
