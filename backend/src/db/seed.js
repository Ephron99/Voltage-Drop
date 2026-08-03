const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('./pool');
const env = require('../config/env');

const seedUsers = [
  { id: 'user-it-001', email: 'admin@it.com', name: 'Karim El-Sayed', role: 'it_engineer', branch: null },
  { id: 'user-sm-001', email: 'director@company.com', name: 'General. Tarek Mostafa', role: 'senior_management', branch: null },
  { id: 'user-bm-001', email: 'manager@branch.com', name: 'Theogene Tuyishime', role: 'branch_manager', branch: 'Cairo North' },
  { id: 'user-se-001', email: 'engineer@site.com', name: 'Ephron Manirakiza', role: 'site_engineer', branch: 'Cairo North' },
  { id: 'user-pl-001', email: 'planner@company.com', name: 'Ahmad Fathy', role: 'planning', branch: null },
  { id: 'user-sa-001', email: 'superadmin@company.com', name: 'Super Admin', role: 'trusted_admin', branch: null },
];

const seedLocations = [
  { id: 'loc-001', name: 'Cairo North Substation', address: 'Shubra El-Kheima, Cairo', governorate: 'Cairo' },
  { id: 'loc-002', name: 'Giza East Feeder Station', address: 'Dokki, Giza', governorate: 'Giza' },
];

const seedLines = [
  { id: 'line-001', name: 'Cairo North MV Feeder', voltageLevel: 'MV', locationId: 'loc-001' },
  { id: 'line-002', name: 'Cairo North LV Ring', voltageLevel: 'LV', locationId: 'loc-001' },
  { id: 'line-003', name: 'Giza East MV Feeder', voltageLevel: 'MV', locationId: 'loc-002' },
  { id: 'line-004', name: 'Giza East LV Distribution', voltageLevel: 'LV', locationId: 'loc-002' },
];

const seedTransformers = [
  { id: 'tr-001', name: 'TRF-CN-001', serialNumber: 'TRF-MV-0001', capacityKVA: 500, lineId: 'line-001' },
  { id: 'tr-002', name: 'TRF-CN-002', serialNumber: 'TRF-MV-0002', capacityKVA: 630, lineId: 'line-001' },
  { id: 'tr-003', name: 'TRF-CN-LV-001', serialNumber: 'TRF-LV-0001', capacityKVA: 250, lineId: 'line-002' },
  { id: 'tr-004', name: 'TRF-CN-LV-002', serialNumber: 'TRF-LV-0002', capacityKVA: 315, lineId: 'line-002' },
  { id: 'tr-005', name: 'TRF-GE-001', serialNumber: 'TRF-MV-0003', capacityKVA: 500, lineId: 'line-003' },
  { id: 'tr-006', name: 'TRF-GE-002', serialNumber: 'TRF-MV-0004', capacityKVA: 800, lineId: 'line-003' },
  { id: 'tr-007', name: 'TRF-GE-LV-001', serialNumber: 'TRF-LV-0003', capacityKVA: 400, lineId: 'line-004' },
];

function nowIso(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function dateOnly(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString().slice(0, 10);
}

async function runSchema(conn) {
  const sqlPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  for (const stmt of statements) {
    await conn.query(stmt);
  }
  console.log('[SEED] Schema initialized.');
}

async function seedUsersData(conn) {
  const password = 'password123';
  const hash = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
  let inserted = 0;
  let skipped = 0;
  for (const u of seedUsers) {
    // Check if user already exists by email (idempotent)
    const [existing] = await conn.query(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [u.email]
    );
    if (existing.length > 0) {
      u._uuid = existing[0].id;
      skipped++;
      continue;
    }
    const id = uuidv4();
    await conn.query(
      'INSERT INTO users (id, email, password_hash, full_name, role, branch) VALUES (?, ?, ?, ?, ?, ?)',
      [id, u.email, hash, u.name, u.role, u.branch]
    );
    u._uuid = id;
    inserted++;
  }
  console.log(`[SEED] Users: ${inserted} inserted, ${skipped} already existed (password: password123).`);
}

function findUserUuid(idKey) {
  const u = seedUsers.find((u) => u.id === idKey);
  return u ? u._uuid : null;
}

async function seedMasterData(conn) {
  let locInserted = 0;
  let locSkipped = 0;
  let lineInserted = 0;
  let lineSkipped = 0;
  let trInserted = 0;
  let trSkipped = 0;

  for (const l of seedLocations) {
    // Check if location already exists by name (idempotent)
    const [existing] = await conn.query(
      'SELECT id FROM locations WHERE name = ? LIMIT 1',
      [l.name]
    );
    if (existing.length > 0) {
      l._uuid = existing[0].id;
      locSkipped++;
      continue;
    }
    const id = uuidv4();
    await conn.query(
      'INSERT INTO locations (id, name, address, governorate) VALUES (?, ?, ?, ?)',
      [id, l.name, l.address, l.governorate]
    );
    l._uuid = id;
    locInserted++;
  }

  for (const ln of seedLines) {
    const loc = seedLocations.find((l) => l.id === ln.locationId);
    // Check if line already exists by name (idempotent)
    const [existing] = await conn.query(
      'SELECT id FROM `lines` WHERE name = ? LIMIT 1',
      [ln.name]
    );
    if (existing.length > 0) {
      ln._uuid = existing[0].id;
      lineSkipped++;
      continue;
    }
    const id = uuidv4();
    await conn.query(
      'INSERT INTO `lines` (id, name, voltage_level, location_id) VALUES (?, ?, ?, ?)',
      [id, ln.name, ln.voltageLevel, loc._uuid]
    );
    ln._uuid = id;
    lineInserted++;
  }

  for (const t of seedTransformers) {
    const ln = seedLines.find((l) => l.id === t.lineId);
    // Check if transformer already exists by serial_number (idempotent)
    const [existing] = await conn.query(
      'SELECT id FROM transformers WHERE serial_number = ? LIMIT 1',
      [t.serialNumber]
    );
    if (existing.length > 0) {
      t._uuid = existing[0].id;
      trSkipped++;
      continue;
    }
    const id = uuidv4();
    await conn.query(
      'INSERT INTO transformers (id, name, serial_number, capacity_kva, line_id) VALUES (?, ?, ?, ?, ?)',
      [id, t.name, t.serialNumber, t.capacityKVA, ln._uuid]
    );
    t._uuid = id;
    trInserted++;
  }
  console.log(`[SEED] Master data: locations ${locInserted} inserted/${locSkipped} existed, lines ${lineInserted} inserted/${lineSkipped} existed, transformers ${trInserted} inserted/${trSkipped} existed.`);
}

async function seedProgressEntries(conn) {
  const seUuid = findUserUuid('user-se-001');
  const bmUuid = findUserUuid('user-bm-001');

  const loc1 = seedLocations.find((l) => l.id === 'loc-001');
  const loc2 = seedLocations.find((l) => l.id === 'loc-002');
  const ln1 = seedLines.find((l) => l.id === 'line-001');
  const ln2 = seedLines.find((l) => l.id === 'line-003');
  const ln3 = seedLines.find((l) => l.id === 'line-002');
  const tr1 = seedTransformers.find((t) => t.id === 'tr-001');
  const tr2 = seedTransformers.find((t) => t.id === 'tr-005');
  const tr3 = seedTransformers.find((t) => t.id === 'tr-003');

  const entries = [
    {
      id: uuidv4(),
      entry_date: dateOnly(4),
      location_id: loc1._uuid,
      line_id: ln1._uuid,
      voltage_level: 'MV',
      transformer_id: tr1._uuid,
      completed_km: 4.2,
      transformers_installed: 2,
      transformers_terminated: 2,
      transformers_tested: 2,
      transformers_commissioned: 2,
      status: 'published',
      site_engineer_id: seUuid,
      branch_manager_id: bmUuid,
      submitted_at: nowIso(5),
      approved_at: nowIso(4.2),
      published_at: nowIso(4),
      rejection_comments: null,
    },
    {
      id: uuidv4(),
      entry_date: dateOnly(1),
      location_id: loc2._uuid,
      line_id: ln2._uuid,
      voltage_level: 'MV',
      transformer_id: tr2._uuid,
      completed_km: 2.1,
      transformers_installed: 1,
      transformers_terminated: 1,
      transformers_tested: 0,
      transformers_commissioned: 0,
      status: 'submitted',
      site_engineer_id: seUuid,
      branch_manager_id: null,
      submitted_at: nowIso(1),
      approved_at: null,
      published_at: null,
      rejection_comments: null,
    },
    {
      id: uuidv4(),
      entry_date: dateOnly(2),
      location_id: loc1._uuid,
      line_id: ln3._uuid,
      voltage_level: 'LV',
      transformer_id: tr3._uuid,
      completed_km: 0.8,
      transformers_installed: 0,
      transformers_terminated: 0,
      transformers_tested: 0,
      transformers_commissioned: 0,
      status: 'draft',
      site_engineer_id: seUuid,
      branch_manager_id: null,
      submitted_at: null,
      approved_at: null,
      published_at: null,
      rejection_comments: null,
    },
  ];

  let peInserted = 0;
  let peSkipped = 0;
  for (const e of entries) {
    // Check if progress entry already exists by entry_date + location + line + engineer (idempotent)
    const [existing] = await conn.query(
      `SELECT id FROM progress_entries
       WHERE entry_date = ? AND location_id = ? AND line_id = ? AND site_engineer_id = ?
       LIMIT 1`,
      [e.entry_date, e.location_id, e.line_id, e.site_engineer_id]
    );
    if (existing.length > 0) {
      peSkipped++;
      continue;
    }
    await conn.query(
      `INSERT INTO progress_entries (
        id, entry_date, location_id, line_id, voltage_level, transformer_id,
        completed_km, transformers_installed, transformers_terminated, transformers_tested, transformers_commissioned,
        status, site_engineer_id, branch_manager_id, submitted_at, approved_at, published_at, rejection_comments
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        e.id, e.entry_date, e.location_id, e.line_id, e.voltage_level, e.transformer_id,
        e.completed_km, e.transformers_installed, e.transformers_terminated, e.transformers_tested, e.transformers_commissioned,
        e.status, e.site_engineer_id, e.branch_manager_id, e.submitted_at, e.approved_at, e.published_at, e.rejection_comments,
      ]
    );
    peInserted++;
  }
  console.log(`[SEED] Progress entries: ${peInserted} inserted, ${peSkipped} already existed (1 published, 1 submitted, 1 draft).`);
}

async function main() {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log('[SEED] Running schema + seed...');
    await runSchema(conn);
    await seedUsersData(conn);
    await seedMasterData(conn);
    await seedProgressEntries(conn);
    console.log('[SEED] All done successfully.');
  } catch (err) {
    console.error('[SEED] Fatal error:', err);
    process.exitCode = 1;
  } finally {
    if (conn) conn.release();
    await pool.end();
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };