const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db/pool');
const { authenticateJWT, requireRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/locations', authenticateJWT, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, address, governorate FROM locations ORDER BY name'
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

router.get('/lines', authenticateJWT, async (req, res, next) => {
  try {
    const { locationId } = req.query;
    let sql =
      'SELECT id, name, voltage_level AS voltageLevel, location_id AS locationId FROM `lines`';
    const params = [];
    if (locationId) {
      sql += ' WHERE location_id = ?';
      params.push(locationId);
    }
    sql += ' ORDER BY name';
    const [rows] = await pool.query(sql, params);
    return res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

router.get('/transformers', authenticateJWT, async (req, res, next) => {
  try {
    const { lineId } = req.query;
    let sql =
      'SELECT id, name, serial_number AS serialNumber, capacity_kva AS capacityKVA, line_id AS lineId FROM transformers';
    const params = [];
    if (lineId) {
      sql += ' WHERE line_id = ?';
      params.push(lineId);
    }
    sql += ' ORDER BY name';
    const [rows] = await pool.query(sql, params);
    return res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// LOCATIONS CRUD
// ============================================================

router.post('/locations', authenticateJWT, requireRoles('planning', 'trusted_admin'), async (req, res, next) => {
  try {
    const { name, address, governorate } = req.body;
    if (!name || !address || !governorate) {
      return res.status(400).json({ error: 'Name, address, and governorate are required' });
    }
    const id = uuidv4();
    await pool.query(
      'INSERT INTO locations (id, name, address, governorate) VALUES (?, ?, ?, ?)',
      [id, name, address, governorate]
    );
    const [rows] = await pool.query(
      'SELECT id, name, address, governorate FROM locations WHERE id = ?',
      [id]
    );
    return res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
});

router.patch('/locations/:id', authenticateJWT, requireRoles('planning', 'trusted_admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, address, governorate } = req.body;
    const [result] = await pool.query(
      `UPDATE locations SET
         name = COALESCE(?, name),
         address = COALESCE(?, address),
         governorate = COALESCE(?, governorate)
       WHERE id = ?`,
      [name || null, address || null, governorate || null, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }
    const [rows] = await pool.query(
      'SELECT id, name, address, governorate FROM locations WHERE id = ?',
      [id]
    );
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
});

router.delete('/locations/:id', authenticateJWT, requireRoles('planning', 'trusted_admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM locations WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }
    return res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// LINES CRUD
// ============================================================

router.post('/lines', authenticateJWT, requireRoles('planning', 'trusted_admin'), async (req, res, next) => {
  try {
    const { name, voltageLevel, locationId } = req.body;
    if (!name || !voltageLevel || !locationId) {
      return res.status(400).json({ error: 'Name, voltage level, and location ID are required' });
    }
    const id = uuidv4();
    await pool.query(
      'INSERT INTO `lines` (id, name, voltage_level, location_id) VALUES (?, ?, ?, ?)',
      [id, name, voltageLevel, locationId]
    );
    const [rows] = await pool.query(
      'SELECT id, name, voltage_level AS voltageLevel, location_id AS locationId FROM `lines` WHERE id = ?',
      [id]
    );
    return res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
});

router.patch('/lines/:id', authenticateJWT, requireRoles('planning', 'trusted_admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, voltageLevel, locationId } = req.body;
    const [result] = await pool.query(
      `UPDATE \`lines\` SET
         name = COALESCE(?, name),
         voltage_level = COALESCE(?, voltage_level),
         location_id = COALESCE(?, location_id)
       WHERE id = ?`,
      [name || null, voltageLevel || null, locationId ?? null, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Line not found' });
    }
    const [rows] = await pool.query(
      'SELECT id, name, voltage_level AS voltageLevel, location_id AS locationId FROM `lines` WHERE id = ?',
      [id]
    );
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
});

router.delete('/lines/:id', authenticateJWT, requireRoles('planning', 'trusted_admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM `lines` WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Line not found' });
    }
    return res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// TRANSFORMERS CRUD
// ============================================================

router.post('/transformers', authenticateJWT, requireRoles('planning', 'trusted_admin'), async (req, res, next) => {
  try {
    const { name, serialNumber, capacityKVA, lineId } = req.body;
    if (!name || !serialNumber || !capacityKVA || !lineId) {
      return res.status(400).json({ error: 'Name, serial number, capacity, and line ID are required' });
    }
    const id = uuidv4();
    await pool.query(
      'INSERT INTO transformers (id, name, serial_number, capacity_kva, line_id) VALUES (?, ?, ?, ?, ?)',
      [id, name, serialNumber, capacityKVA, lineId]
    );
    const [rows] = await pool.query(
      'SELECT id, name, serial_number AS serialNumber, capacity_kva AS capacityKVA, line_id AS lineId FROM transformers WHERE id = ?',
      [id]
    );
    return res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Serial number already exists' });
    }
    next(err);
  }
});

router.patch('/transformers/:id', authenticateJWT, requireRoles('planning', 'trusted_admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, serialNumber, capacityKVA, lineId } = req.body;
    const [result] = await pool.query(
      `UPDATE transformers SET
         name = COALESCE(?, name),
         serial_number = COALESCE(?, serial_number),
         capacity_kva = COALESCE(?, capacity_kva),
         line_id = COALESCE(?, line_id)
       WHERE id = ?`,
      [name || null, serialNumber || null, capacityKVA ?? null, lineId ?? null, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Transformer not found' });
    }
    const [rows] = await pool.query(
      'SELECT id, name, serial_number AS serialNumber, capacity_kva AS capacityKVA, line_id AS lineId FROM transformers WHERE id = ?',
      [id]
    );
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
});

router.delete('/transformers/:id', authenticateJWT, requireRoles('planning', 'trusted_admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM transformers WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Transformer not found' });
    }
    return res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
