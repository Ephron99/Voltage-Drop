const express = require('express');
const { pool } = require('../db/pool');
const { authenticateJWT } = require('../middleware/auth');

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

module.exports = router;