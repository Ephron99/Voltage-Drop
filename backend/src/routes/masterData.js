const express = require('express');
const pool = require('../db/pool');
const { authenticateJWT } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateJWT);

router.get('/locations', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, address, governorate FROM locations ORDER BY name ASC'
    );

    return res.json({
      success: true,
      data: rows.map((row) => ({
        id: row.id,
        name: row.name,
        address: row.address,
        governorate: row.governorate,
      })),
    });
  } catch (err) {
    console.error('GET /master/locations error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error fetching locations.',
    });
  }
});

router.get('/lines', async (req, res) => {
  try {
    const { locationId } = req.query;
    let query = 'SELECT id, name, voltage_level, location_id FROM lines';
    const params = [];

    if (locationId) {
      query += ' WHERE location_id = ?';
      params.push(locationId);
    }

    query += ' ORDER BY name ASC';

    const [rows] = await pool.query(query, params);

    return res.json({
      success: true,
      data: rows.map((row) => ({
        id: row.id,
        name: row.name,
        voltageLevel: row.voltage_level,
        locationId: row.location_id,
      })),
    });
  } catch (err) {
    console.error('GET /master/lines error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error fetching lines.',
    });
  }
});

router.get('/transformers', async (req, res) => {
  try {
    const { lineId } = req.query;
    let query = 'SELECT id, name, serial_number, capacity_kva, line_id FROM transformers';
    const params = [];

    if (lineId) {
      query += ' WHERE line_id = ?';
      params.push(lineId);
    }

    query += ' ORDER BY name ASC';

    const [rows] = await pool.query(query, params);

    return res.json({
      success: true,
      data: rows.map((row) => ({
        id: row.id,
        name: row.name,
        serialNumber: row.serial_number,
        capacityKVA: row.capacity_kva,
        lineId: row.line_id,
      })),
    });
  } catch (err) {
    console.error('GET /master/transformers error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error fetching transformers.',
    });
  }
});

router.get('/location/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      'SELECT id, name, address, governorate FROM locations WHERE id = ? LIMIT 1',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Location not found.',
      });
    }

    const row = rows[0];

    return res.json({
      success: true,
      data: {
        id: row.id,
        name: row.name,
        address: row.address,
        governorate: row.governorate,
      },
    });
  } catch (err) {
    console.error('GET /master/location/:id error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error fetching location.',
    });
  }
});

module.exports = router;
