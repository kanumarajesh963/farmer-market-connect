import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

function toClient(row) {
  return {
    id: row.id,
    name: row.pesticide_name,
    cropCategory: row.crop_category,
    applicableCrops: row.applicable_crops,
    pricePerUnit: Number(row.price_per_unit),
    unit: row.unit,
    updatedAt: row.updated_at,
  };
}

// GET /api/pesticides?crop=Tomatoes — realtime-priced pesticide list, optionally
// filtered to the crop or category a farmer is asking about.
router.get('/', async (req, res) => {
  const { crop } = req.query;
  if (crop && crop !== 'All') {
    const pattern = `%${crop}%`;
    const result = await pool.query(
      `SELECT * FROM pesticide_prices
       WHERE crop_category ILIKE $1
          OR EXISTS (SELECT 1 FROM unnest(applicable_crops) c WHERE c ILIKE $1)
       ORDER BY pesticide_name`,
      [pattern]
    );
    return res.json(result.rows.map(toClient));
  }
  const result = await pool.query('SELECT * FROM pesticide_prices ORDER BY crop_category, pesticide_name');
  res.json(result.rows.map(toClient));
});

export default router;
