import { pool } from './db.js';

// Every tick, nudge a handful of pesticide prices up/down a little and
// broadcast the change — this is what makes the "realtime pesticide prices"
// screen on the frontend actually move without anyone touching the DB.
export function startPesticideSimulator(io, intervalMs = 6000) {
  const tick = async () => {
    try {
      const { rows } = await pool.query('SELECT id FROM pesticide_prices ORDER BY random() LIMIT 3');
      for (const row of rows) {
        // +/- up to 3% drift, floor at 1 so prices never go to 0 or negative
        const result = await pool.query(
          `UPDATE pesticide_prices
           SET price_per_unit = GREATEST(1, ROUND(price_per_unit * (1 + (random() * 0.06 - 0.03)), 2)),
               updated_at = now()
           WHERE id = $1
           RETURNING *`,
          [row.id]
        );
        const p = result.rows[0];
        io.emit('pesticide:update', {
          id: p.id,
          name: p.pesticide_name,
          cropCategory: p.crop_category,
          applicableCrops: p.applicable_crops,
          pricePerUnit: Number(p.price_per_unit),
          unit: p.unit,
          updatedAt: p.updated_at,
        });
      }
    } catch (err) {
      console.error('Pesticide simulator tick failed:', err.message);
    }
  };

  const timer = setInterval(tick, intervalMs);
  return () => clearInterval(timer);
}
