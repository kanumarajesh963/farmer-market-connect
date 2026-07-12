import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, optionalAuth, requireRole } from '../middleware/auth.js';

const router = Router();

function toClientListing(row) {
  return {
    id: row.id,
    cropName: row.crop_name,
    category: row.category,
    quantity: Number(row.quantity),
    unit: row.unit,
    pricePerUnit: Number(row.price_per_unit),
    harvestDate: row.harvest_date,
    location: row.location,
    status: row.status,
    imageUrl: row.image_url,
    description: row.description,
    farmerId: row.farmer_id,
    farmerName: row.farmer_name ?? row.name,
    interestedCount: row.interested_count,
    postedAt: row.posted_at,
  };
}

// GET /api/listings — public marketplace feed (any visitor can browse)
router.get('/', optionalAuth, async (req, res) => {
  const { search, category, minPrice, maxPrice, minQuantity } = req.query;
  const cursor = Number(req.query.cursor ?? 0);
  const pageSize = Math.min(Number(req.query.pageSize ?? 8), 50);

  const clauses = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    clauses.push(`(l.crop_name ILIKE $${params.length} OR l.location ILIKE $${params.length})`);
  }
  if (category && category !== 'All') {
    params.push(category);
    clauses.push(`l.category = $${params.length}`);
  }
  if (minPrice != null && minPrice !== '') {
    params.push(Number(minPrice));
    clauses.push(`l.price_per_unit >= $${params.length}`);
  }
  if (maxPrice != null && maxPrice !== '') {
    params.push(Number(maxPrice));
    clauses.push(`l.price_per_unit <= $${params.length}`);
  }
  if (minQuantity != null && minQuantity !== '') {
    params.push(Number(minQuantity));
    clauses.push(`l.quantity >= $${params.length}`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const countRes = await pool.query(`SELECT COUNT(*)::int AS total FROM crop_listings l ${where}`, params);
  const total = countRes.rows[0].total;

  params.push(pageSize, cursor);
  const rowsRes = await pool.query(
    `SELECT l.*, u.name AS farmer_name FROM crop_listings l
     JOIN users u ON u.id = l.farmer_id
     ${where}
     ORDER BY l.posted_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  const items = rowsRes.rows.map(toClientListing);
  const nextCursor = cursor + pageSize < total ? cursor + pageSize : null;
  res.json({ items, nextCursor, total });
});

// GET /api/listings/mine — farmer's own listings
router.get('/mine', requireAuth, requireRole('farmer', 'admin'), async (req, res) => {
  const result = await pool.query(
    `SELECT l.*, u.name AS farmer_name FROM crop_listings l
     JOIN users u ON u.id = l.farmer_id
     WHERE l.farmer_id = $1
     ORDER BY l.posted_at DESC`,
    [req.auth.sub]
  );
  res.json(result.rows.map(toClientListing));
});

// GET /api/listings/:id
router.get('/:id', optionalAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT l.*, u.name AS farmer_name FROM crop_listings l
     JOIN users u ON u.id = l.farmer_id
     WHERE l.id = $1`,
    [req.params.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Listing not found.' });
  res.json(toClientListing(result.rows[0]));
});

// POST /api/listings — only farmers (and admin, for support purposes) can post crops
router.post('/', requireAuth, requireRole('farmer', 'admin'), async (req, res) => {
  const { cropName, category, quantity, unit, pricePerUnit, harvestDate, location, imageUrl, description } =
    req.body ?? {};

  if (!cropName || !category || !quantity || !unit || !pricePerUnit || !harvestDate || !location || !imageUrl) {
    return res.status(400).json({ error: 'Missing required listing fields.' });
  }

  const result = await pool.query(
    `INSERT INTO crop_listings
      (crop_name, category, quantity, unit, price_per_unit, harvest_date, location, image_url, description, farmer_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [cropName, category, quantity, unit, pricePerUnit, harvestDate, location, imageUrl, description ?? null, req.auth.sub]
  );

  const farmerRes = await pool.query('SELECT name FROM users WHERE id = $1', [req.auth.sub]);
  const listing = toClientListing({ ...result.rows[0], farmer_name: farmerRes.rows[0]?.name });

  req.app.get('io').emit('listing:new', listing);
  res.status(201).json(listing);
});

// PATCH /api/listings/:id/status — owning farmer or admin only
router.patch('/:id/status', requireAuth, requireRole('farmer', 'admin'), async (req, res) => {
  const { status } = req.body ?? {};
  if (!['available', 'reserved', 'sold'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }

  const existing = await pool.query('SELECT farmer_id FROM crop_listings WHERE id = $1', [req.params.id]);
  if (existing.rows.length === 0) return res.status(404).json({ error: 'Listing not found.' });
  if (req.auth.role !== 'admin' && existing.rows[0].farmer_id !== req.auth.sub) {
    return res.status(403).json({ error: 'You can only update your own listings.' });
  }

  const result = await pool.query(
    `UPDATE crop_listings SET status = $1 WHERE id = $2 RETURNING *`,
    [status, req.params.id]
  );
  const farmerRes = await pool.query('SELECT name FROM users WHERE id = $1', [result.rows[0].farmer_id]);
  const listing = toClientListing({ ...result.rows[0], farmer_name: farmerRes.rows[0]?.name });

  req.app.get('io').emit('listing:updated', listing);
  res.json(listing);
});

// GET /api/listings/:id/interests
router.get('/:id/interests', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT bi.*, u.name AS buyer_name, u.role AS buyer_role FROM buyer_interests bi
     JOIN users u ON u.id = bi.buyer_id
     WHERE bi.listing_id = $1 ORDER BY bi.created_at DESC`,
    [req.params.id]
  );
  res.json(
    result.rows.map((r) => ({
      id: r.id,
      listingId: r.listing_id,
      buyerName: r.buyer_name,
      buyerRole: r.buyer_role,
      message: r.message,
      status: r.status,
      createdAt: r.created_at,
    }))
  );
});

// POST /api/listings/:id/interests — buyers & mediators only, not farmers/admin
router.post('/:id/interests', requireAuth, requireRole('buyer', 'mediator'), async (req, res) => {
  const { message } = req.body ?? {};
  if (!message || message.trim().length < 5) {
    return res.status(400).json({ error: 'Say a little about what you need.' });
  }

  const listingRes = await pool.query('SELECT farmer_id FROM crop_listings WHERE id = $1', [req.params.id]);
  if (listingRes.rows.length === 0) return res.status(404).json({ error: 'Listing not found.' });

  const result = await pool.query(
    `INSERT INTO buyer_interests (listing_id, buyer_id, message) VALUES ($1,$2,$3) RETURNING *`,
    [req.params.id, req.auth.sub, message.trim()]
  );
  await pool.query('UPDATE crop_listings SET interested_count = interested_count + 1 WHERE id = $1', [req.params.id]);

  const buyerRes = await pool.query('SELECT name, role FROM users WHERE id = $1', [req.auth.sub]);
  const interest = {
    id: result.rows[0].id,
    listingId: req.params.id,
    buyerName: buyerRes.rows[0].name,
    buyerRole: buyerRes.rows[0].role,
    message: result.rows[0].message,
    status: result.rows[0].status,
    createdAt: result.rows[0].created_at,
  };

  // Notify only the listing's farmer in realtime
  req.app.get('io').to(`user:${listingRes.rows[0].farmer_id}`).emit('interest:new', interest);
  res.status(201).json(interest);
});

export default router;
