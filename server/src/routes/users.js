import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { toClientUser } from './auth.js';

const router = Router();

// All routes below require an authenticated admin.
router.use(requireAuth, requireRole('admin'));

// GET /api/admin/users — list everyone, for role management
router.get('/', async (_req, res) => {
  const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
  res.json(result.rows.map(toClientUser));
});

// PATCH /api/admin/users/:id/role — only an admin can grant/revoke the admin role
router.patch('/:id/role', async (req, res) => {
  const { role } = req.body ?? {};
  if (!['farmer', 'buyer', 'mediator', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role.' });
  }
  const result = await pool.query('UPDATE users SET role = $1 WHERE id = $2 RETURNING *', [role, req.params.id]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });

  const user = toClientUser(result.rows[0]);
  // Tell that specific user's open sessions their role changed, in realtime
  req.app.get('io').to(`user:${user.id}`).emit('role:changed', user);
  res.json(user);
});

export default router;
