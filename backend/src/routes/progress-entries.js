const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db/pool');
const { authenticateJWT, requireRoles } = require('../middleware/auth');
const {
  progressEntrySchema,
  progressEntryUpdateSchema,
  rejectSchema,
  validate,
} = require('../middleware/validators');

const router = express.Router();

router.use(authenticateJWT);

const ENTRY_SELECT = `
  pe.id, pe.entry_date, pe.location_id, pe.line_id, pe.voltage_level,
  pe.transformer_id, pe.completed_km, pe.transformers_installed,
  pe.transformers_terminated, pe.transformers_tested, pe.transformers_commissioned,
  pe.status, pe.site_engineer_id, pe.submitted_at, pe.branch_manager_id,
  pe.approved_at, pe.published_at, pe.rejection_comments,
  pe.created_at, pe.updated_at,
  se.full_name AS site_engineer_name,
  bm.full_name AS branch_manager_name,
  loc.name AS location_name,
  ln.name AS line_name,
  tr.name AS transformer_name
`;

function serializeEntry(row) {
  return {
    id: row.id,
    entryDate: row.entry_date,
    locationId: row.location_id,
    lineId: row.line_id,
    voltageLevel: row.voltage_level,
    transformerId: row.transformer_id,
    completedKm: Number(row.completed_km),
    transformersInstalled: row.transformers_installed,
    transformersTerminated: row.transformers_terminated,
    transformersTested: row.transformers_tested,
    transformersCommissioned: row.transformers_commissioned,
    status: row.status,
    siteEngineerId: row.site_engineer_id,
    siteEngineerName: row.site_engineer_name || undefined,
    submittedAt: row.submitted_at || undefined,
    branchManagerId: row.branch_manager_id || undefined,
    branchManagerName: row.branch_manager_name || undefined,
    approvedAt: row.approved_at || undefined,
    publishedAt: row.published_at || undefined,
    rejectionComments: row.rejection_comments || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function fetchEntryById(id) {
  const [rows] = await pool.query(
    `SELECT ${ENTRY_SELECT}
     FROM progress_entries pe
     LEFT JOIN users se ON pe.site_engineer_id = se.id
     LEFT JOIN users bm ON pe.branch_manager_id = bm.id
     LEFT JOIN locations loc ON pe.location_id = loc.id
     LEFT JOIN \`lines\` ln ON pe.line_id = ln.id
     LEFT JOIN transformers tr ON pe.transformer_id = tr.id
     WHERE pe.id = ? LIMIT 1`,
    [id]
  );
  return rows.length > 0 ? serializeEntry(rows[0]) : null;
}

// GET /progress - list entries with optional filters
router.get('/', async (req, res, next) => {
  try {
    const { status, engineerId, branch } = req.query;
    const { role, id: userId } = req.user;

    const conditions = [];
    const params = [];

    // Role-based scoping
    if (role === 'site_engineer') {
      conditions.push('pe.site_engineer_id = ?');
      params.push(userId);
    } else if (role === 'branch_manager') {
      const [userRows] = await pool.query(
        'SELECT branch FROM users WHERE id = ? LIMIT 1',
        [userId]
      );
      const userBranch = userRows[0]?.branch;
      if (userBranch) {
        conditions.push('se.branch = ?');
        params.push(userBranch);
      }
    }

    if (status) {
      conditions.push('pe.status = ?');
      params.push(status);
    }
    if (engineerId) {
      conditions.push('pe.site_engineer_id = ?');
      params.push(engineerId);
    }
    if (branch) {
      conditions.push('se.branch = ?');
      params.push(branch);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `SELECT ${ENTRY_SELECT}
       FROM progress_entries pe
       LEFT JOIN users se ON pe.site_engineer_id = se.id
       LEFT JOIN users bm ON pe.branch_manager_id = bm.id
       LEFT JOIN locations loc ON pe.location_id = loc.id
       LEFT JOIN \`lines\` ln ON pe.line_id = ln.id
       LEFT JOIN transformers tr ON pe.transformer_id = tr.id
       ${whereClause}
       ORDER BY pe.entry_date DESC, pe.created_at DESC`,
      params
    );

    return res.json({ success: true, data: rows.map(serializeEntry) });
  } catch (err) {
    next(err);
  }
});

// GET /progress/:id - single entry
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const entry = await fetchEntryById(id);
    if (!entry) {
      return res.status(404).json({ error: 'Progress entry not found' });
    }

    // Role-based access control
    const { role, id: userId } = req.user;
    if (role === 'site_engineer' && entry.siteEngineerId !== userId) {
      return res
        .status(403)
        .json({ error: 'Access denied. You can only view your own entries.' });
    }
    if (role === 'branch_manager') {
      const [userRows] = await pool.query(
        'SELECT branch FROM users WHERE id = ? LIMIT 1',
        [userId]
      );
      const userBranch = userRows[0]?.branch;
      if (userBranch) {
        const [engineerRows] = await pool.query(
          'SELECT branch FROM users WHERE id = ? LIMIT 1',
          [entry.siteEngineerId]
        );
        const engineerBranch = engineerRows[0]?.branch;
        if (engineerBranch !== userBranch) {
          return res
            .status(403)
            .json({ error: 'Access denied. You can only view entries from your branch.' });
        }
      }
    }

    return res.json({ success: true, data: entry });
  } catch (err) {
    next(err);
  }
});

// POST /progress - create entry (site_engineer / trusted_admin)
router.post(
  '/',
  requireRoles('site_engineer', 'trusted_admin'),
  validate(progressEntrySchema),
  async (req, res, next) => {
    try {
      const v = req.validated;
      const id = uuidv4();
      await pool.query(
        `INSERT INTO progress_entries (
          id, entry_date, location_id, line_id, voltage_level, transformer_id,
          completed_km, transformers_installed, transformers_terminated,
          transformers_tested, transformers_commissioned, status, site_engineer_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)`,
        [
          id, v.entryDate, v.locationId, v.lineId, v.voltageLevel, v.transformerId,
          v.completedKm, v.transformersInstalled, v.transformersTerminated,
          v.transformersTested, v.transformersCommissioned, req.user.id,
        ]
      );
      const entry = await fetchEntryById(id);
      return res.status(201).json({ success: true, data: entry });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /progress/:id - update entry (owner only, draft/rejected only)
router.patch('/:id', validate(progressEntryUpdateSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { id: userId, role } = req.user;

    const [existingRows] = await pool.query(
      'SELECT id, site_engineer_id, status FROM progress_entries WHERE id = ? LIMIT 1',
      [id]
    );
    if (existingRows.length === 0) {
      return res.status(404).json({ error: 'Progress entry not found' });
    }

    const entry = existingRows[0];
    const isOwner = entry.site_engineer_id === userId;
    const isAdmin = role === 'trusted_admin';

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ error: 'Access denied. Only the owner or admin can update this entry.' });
    }

    const editableStatuses = ['draft', 'rejected'];
    if (!editableStatuses.includes(entry.status)) {
      return res.status(400).json({
        error: `Entry cannot be updated while status is '${entry.status}'. Only 'draft' or 'rejected' entries can be modified.`,
      });
    }

    const v = req.validated;
    const fields = [];
    const params = [];

    if (v.entryDate !== undefined) { fields.push('entry_date = ?'); params.push(v.entryDate); }
    if (v.locationId !== undefined) { fields.push('location_id = ?'); params.push(v.locationId); }
    if (v.lineId !== undefined) { fields.push('line_id = ?'); params.push(v.lineId); }
    if (v.voltageLevel !== undefined) { fields.push('voltage_level = ?'); params.push(v.voltageLevel); }
    if (v.transformerId !== undefined) { fields.push('transformer_id = ?'); params.push(v.transformerId); }
    if (v.completedKm !== undefined) { fields.push('completed_km = ?'); params.push(v.completedKm); }
    if (v.transformersInstalled !== undefined) { fields.push('transformers_installed = ?'); params.push(v.transformersInstalled); }
    if (v.transformersTerminated !== undefined) { fields.push('transformers_terminated = ?'); params.push(v.transformersTerminated); }
    if (v.transformersTested !== undefined) { fields.push('transformers_tested = ?'); params.push(v.transformersTested); }
    if (v.transformersCommissioned !== undefined) { fields.push('transformers_commissioned = ?'); params.push(v.transformersCommissioned); }

    if (fields.length > 0) {
      fields.push('status = ?');
      params.push('draft');
      fields.push('updated_at = NOW()');
      params.push(id);
      await pool.query(`UPDATE progress_entries SET ${fields.join(', ')} WHERE id = ?`, params);
    }

    const updated = await fetchEntryById(id);
    return res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// POST /progress/:id/submit - submit for review
router.post('/:id/submit', requireRoles('site_engineer', 'trusted_admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { id: userId, role } = req.user;

    const [rows] = await pool.query(
      'SELECT id, site_engineer_id, status FROM progress_entries WHERE id = ? LIMIT 1',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Progress entry not found' });
    }

    const entry = rows[0];
    const isOwner = entry.site_engineer_id === userId;
    const isAdmin = role === 'trusted_admin';

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ error: 'Access denied. Only the owner or admin can submit this entry.' });
    }

    const submittableStatuses = ['draft', 'rejected'];
    if (!submittableStatuses.includes(entry.status)) {
      return res.status(400).json({
        error: `Cannot submit entry with status '${entry.status}'. Only 'draft' or 'rejected' entries can be submitted.`,
      });
    }

    await pool.query(
      "UPDATE progress_entries SET status = 'submitted', submitted_at = NOW(), updated_at = NOW() WHERE id = ?",
      [id]
    );

    const updated = await fetchEntryById(id);
    return res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// POST /progress/:id/approve - approve entry
router.post(
  '/:id/approve',
  requireRoles('branch_manager', 'trusted_admin'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { id: userId } = req.user;

      const [rows] = await pool.query(
        'SELECT id, status FROM progress_entries WHERE id = ? LIMIT 1',
        [id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Progress entry not found' });
      }

      if (rows[0].status !== 'submitted') {
        return res.status(400).json({
          error: `Cannot approve entry with status '${rows[0].status}'. Only 'submitted' entries can be approved.`,
        });
      }

      await pool.query(
        "UPDATE progress_entries SET status = 'approved', branch_manager_id = ?, approved_at = NOW(), updated_at = NOW() WHERE id = ?",
        [userId, id]
      );

      const updated = await fetchEntryById(id);
      return res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

// POST /progress/:id/reject - reject entry
router.post(
  '/:id/reject',
  requireRoles('branch_manager', 'trusted_admin'),
  validate(rejectSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { id: userId } = req.user;
      const { comments } = req.validated;

      const [rows] = await pool.query(
        'SELECT id, status FROM progress_entries WHERE id = ? LIMIT 1',
        [id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Progress entry not found' });
      }

      if (rows[0].status !== 'submitted') {
        return res.status(400).json({
          error: `Cannot reject entry with status '${rows[0].status}'. Only 'submitted' entries can be rejected.`,
        });
      }

      await pool.query(
        "UPDATE progress_entries SET status = 'rejected', rejection_comments = ?, branch_manager_id = ?, updated_at = NOW() WHERE id = ?",
        [comments, userId, id]
      );

      const updated = await fetchEntryById(id);
      return res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

// POST /progress/:id/publish - publish entry
router.post(
  '/:id/publish',
  requireRoles('branch_manager', 'trusted_admin'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { id: userId } = req.user;

      const [rows] = await pool.query(
        'SELECT id, status, branch_manager_id FROM progress_entries WHERE id = ? LIMIT 1',
        [id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Progress entry not found' });
      }

      const entry = rows[0];
      const publishableStatuses = ['submitted', 'approved'];
      if (!publishableStatuses.includes(entry.status)) {
        return res.status(400).json({
          error: `Cannot publish entry with status '${entry.status}'. Only 'submitted' or 'approved' entries can be published.`,
        });
      }

      const branchManagerId = entry.branch_manager_id || userId;
      await pool.query(
        "UPDATE progress_entries SET status = 'published', published_at = NOW(), branch_manager_id = ?, updated_at = NOW() WHERE id = ?",
        [branchManagerId, id]
      );

      const updated = await fetchEntryById(id);
      return res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /progress/:id - delete entry
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { id: userId, role } = req.user;

    const [rows] = await pool.query(
      'SELECT id, site_engineer_id, status FROM progress_entries WHERE id = ? LIMIT 1',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Progress entry not found' });
    }

    const entry = rows[0];
    const isAdmin = role === 'trusted_admin';
    const isOwner = entry.site_engineer_id === userId;
    const deletableStatuses = ['draft', 'rejected'];

    if (!isAdmin && !(isOwner && deletableStatuses.includes(entry.status))) {
      if (!isAdmin && !isOwner) {
        return res
          .status(403)
          .json({ error: 'Access denied. Only the owner or admin can delete this entry.' });
      }
      return res.status(400).json({
        error: `Entry cannot be deleted while status is '${entry.status}'. Only 'draft' or 'rejected' entries can be deleted.`,
      });
    }

    await pool.query('DELETE FROM progress_entries WHERE id = ?', [id]);
    return res.json({ success: true, data: { deleted: true, id } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;