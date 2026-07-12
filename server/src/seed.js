import 'dotenv/config';
import { pool } from './db.js';

// Crop catalog — each crop's image keyword actually matches the crop, unlike
// the old frontend mock which cycled through 6 unrelated stock photos.
const CROPS = [
  { name: 'Alphonso Mangoes', category: 'Fruits', keyword: 'mango' },
  { name: 'Basmati Rice', category: 'Grains', keyword: 'rice-paddy' },
  { name: 'Red Chilli', category: 'Spices', keyword: 'red-chilli' },
  { name: 'Tur Dal', category: 'Pulses', keyword: 'lentils' },
  { name: 'Tomatoes', category: 'Vegetables', keyword: 'tomato' },
  { name: 'Groundnut', category: 'Oilseeds', keyword: 'peanut' },
  { name: 'Onions', category: 'Vegetables', keyword: 'onion' },
  { name: 'Turmeric', category: 'Spices', keyword: 'turmeric' },
  { name: 'Wheat', category: 'Grains', keyword: 'wheat-field' },
  { name: 'Sugarcane', category: 'Grains', keyword: 'sugarcane' },
  { name: 'Green Chilli', category: 'Vegetables', keyword: 'green-chilli' },
  { name: 'Bananas', category: 'Fruits', keyword: 'banana' },
  { name: 'Potatoes', category: 'Vegetables', keyword: 'potato' },
  { name: 'Chickpeas', category: 'Pulses', keyword: 'chickpeas' },
  { name: 'Cotton', category: 'Grains', keyword: 'cotton-field' },
];

const CATEGORY_IMAGE = {
  Vegetables: 'https://raw.githubusercontent.com/farmer-market-connect/assets/main/vegetables.svg',
  Fruits: 'https://raw.githubusercontent.com/farmer-market-connect/assets/main/fruits.svg',
  Grains: 'https://raw.githubusercontent.com/farmer-market-connect/assets/main/grains.svg',
  Pulses: 'https://raw.githubusercontent.com/farmer-market-connect/assets/main/pulses.svg',
  Spices: 'https://raw.githubusercontent.com/farmer-market-connect/assets/main/spices.svg',
  Oilseeds: 'https://raw.githubusercontent.com/farmer-market-connect/assets/main/oilseeds.svg',
};

const imageFor = (category) => CATEGORY_IMAGE[category] ?? CATEGORY_IMAGE.Vegetables;

const LOCATIONS = ['Nashik, MH', 'Guntur, AP', 'Karnal, HR', 'Erode, TN', 'Indore, MP', 'Kolar, KA'];
const FARMERS = [
  { name: 'Ramesh Patil', phone: '9876500001' },
  { name: 'Lakshmi Reddy', phone: '9876500002' },
  { name: 'Suresh Yadav', phone: '9876500003' },
  { name: 'Kavita Naik', phone: '9876500004' },
  { name: 'Arjun Singh', phone: '9876500005' },
  { name: 'Meena Devi', phone: '9876500006' },
];
const AVATAR_COLORS = ['#2E5E3E', '#C4871F', '#3E7A52', '#C1442E', '#1F3D2B', '#E2A33D'];

const PESTICIDES = [
  { name: 'Imidacloprid 17.8% SL', category: 'Vegetables', crops: ['Tomatoes', 'Onions', 'Potatoes'], price: 420, unit: 'litre' },
  { name: 'Chlorpyrifos 20% EC', category: 'Grains', crops: ['Wheat', 'Basmati Rice', 'Cotton'], price: 310, unit: 'litre' },
  { name: 'Mancozeb 75% WP', category: 'Fruits', crops: ['Alphonso Mangoes', 'Bananas'], price: 260, unit: 'kg' },
  { name: 'Copper Oxychloride 50% WP', category: 'Spices', crops: ['Red Chilli', 'Turmeric', 'Green Chilli'], price: 240, unit: 'kg' },
  { name: 'Carbendazim 50% WP', category: 'Pulses', crops: ['Tur Dal', 'Chickpeas'], price: 280, unit: 'kg' },
  { name: 'Neem Oil 1500 ppm', category: 'All', crops: ['Tomatoes', 'Onions', 'Alphonso Mangoes', 'Red Chilli'], price: 380, unit: 'litre' },
  { name: 'Glyphosate 41% SL', category: 'Grains', crops: ['Sugarcane', 'Cotton', 'Wheat'], price: 350, unit: 'litre' },
  { name: 'Thiamethoxam 25% WG', category: 'Oilseeds', crops: ['Groundnut', 'Sunflower Seeds'], price: 550, unit: 'kg' },
  { name: 'Propiconazole 25% EC', category: 'Grains', crops: ['Basmati Rice', 'Wheat'], price: 610, unit: 'litre' },
  { name: 'Sulphur 80% WDG', category: 'Fruits', crops: ['Alphonso Mangoes', 'Bananas', 'Potatoes'], price: 190, unit: 'kg' },
];

async function ensureAdmin() {
  const phone = process.env.SEED_ADMIN_PHONE || '6302350963';
  const name = process.env.SEED_ADMIN_NAME || 'Platform Admin';
  const existing = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
  if (existing.rows.length > 0) {
    if (existing.rows[0].role !== 'admin') {
      await pool.query('UPDATE users SET role = $1 WHERE phone = $2', ['admin', phone]);
      console.log(`🔧 Existing user ${phone} promoted to admin.`);
    } else {
      console.log(`✅ Admin ${phone} already exists.`);
    }
    return existing.rows[0].id;
  }
  const result = await pool.query(
    `INSERT INTO users (phone, name, role, location, avatar_color) VALUES ($1,$2,'admin',$3,$4) RETURNING id`,
    [phone, name, 'Hyderabad, TS', '#12241A']
  );
  console.log(`✅ Created admin account for +91 ${phone} (${name}).`);
  return result.rows[0].id;
}

async function ensureFarmers() {
  const ids = [];
  for (let i = 0; i < FARMERS.length; i++) {
    const f = FARMERS[i];
    const existing = await pool.query('SELECT id FROM users WHERE phone = $1', [f.phone]);
    if (existing.rows.length > 0) {
      ids.push(existing.rows[0].id);
      continue;
    }
    const result = await pool.query(
      `INSERT INTO users (phone, name, role, location, avatar_color) VALUES ($1,$2,'farmer',$3,$4) RETURNING id`,
      [f.phone, f.name, LOCATIONS[i % LOCATIONS.length], AVATAR_COLORS[i % AVATAR_COLORS.length]]
    );
    ids.push(result.rows[0].id);
  }
  console.log(`✅ ${ids.length} demo farmer accounts ready.`);
  return ids;
}

async function seedListings(farmerIds) {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM crop_listings');
  if (rows[0].count > 0) {
    console.log(`ℹ️  ${rows[0].count} listings already exist, skipping listing seed.`);
    return;
  }
  let created = 0;
  for (let i = 0; i < 48; i++) {
    const crop = CROPS[i % CROPS.length];
    const farmerId = farmerIds[i % farmerIds.length];
    const statuses = ['available', 'available', 'available', 'reserved', 'sold'];
    await pool.query(
      `INSERT INTO crop_listings
        (crop_name, category, quantity, unit, price_per_unit, harvest_date, location, status, image_url, description, farmer_id, interested_count)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        crop.name,
        crop.category,
        50 + ((i * 37) % 950),
        i % 3 === 0 ? 'ton' : 'kg',
        18 + ((i * 13) % 82),
        new Date(Date.now() - ((i * 5) % 60) * 86400000).toISOString().slice(0, 10),
        LOCATIONS[i % LOCATIONS.length],
        statuses[i % statuses.length],
        imageFor(crop.keyword),
        'Freshly harvested, sorted and graded. Available for immediate pickup or delivery within region.',
        farmerId,
        (i * 3) % 12,
      ]
    );
    created++;
  }
  console.log(`✅ Seeded ${created} crop listings with crop-matched images.`);
}

async function seedPesticides() {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM pesticide_prices');
  if (rows[0].count > 0) {
    console.log(`ℹ️  ${rows[0].count} pesticide entries already exist, skipping.`);
    return;
  }
  for (const p of PESTICIDES) {
    await pool.query(
      `INSERT INTO pesticide_prices (pesticide_name, crop_category, applicable_crops, price_per_unit, unit)
       VALUES ($1,$2,$3,$4,$5)`,
      [p.name, p.category, p.crops, p.price, p.unit]
    );
  }
  console.log(`✅ Seeded ${PESTICIDES.length} pesticide price entries.`);
}

async function main() {
  console.log('🌱 Seeding Farmer Market Connect database…');
  await ensureAdmin();
  const farmerIds = await ensureFarmers();
  await seedListings(farmerIds);
  await seedPesticides();
  console.log('🌾 Done.');
  await pool.end();
}

main().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
