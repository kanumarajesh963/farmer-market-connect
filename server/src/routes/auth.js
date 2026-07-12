import { Router } from 'express';
import { pool } from '../db.js';
import { issueOtp, verifyOtp } from '../otpStore.js';
import { signToken, requireAuth } from '../middleware/auth.js';

const router = Router();

const PHONE_RE = /^[6-9]\d{9}$/;
const SELECTABLE_ROLES = ['farmer', 'buyer', 'mediator']; // 'admin' can never be self-selected at signup

const AVATAR_COLORS = ['#2E5E3E', '#C4871F', '#3E7A52', '#C1442E', '#1F3D2B', '#E2A33D'];
const colorFor = (phone) => AVATAR_COLORS[phone.charCodeAt(0) % AVATAR_COLORS.length];

router.post('/request-otp', async (req, res) => {
  const { phone } = req.body ?? {};
  if (typeof phone !== 'string' || !PHONE_RE.test(phone)) {
    return res.status(400).json({ error: 'Enter a valid 10-digit Indian mobile number.' });
  }
  const otp = issueOtp(phone);

  // No SMS gateway is configured yet (Twilio / MSG91 / etc). We log the OTP
  // server-side so you can watch it arrive in real time, and — only outside
  // production — echo it back in the response so the demo works end to end
  // without a paid SMS provider.
  console.log(`📲 OTP for +91 ${phone}: ${otp} (valid 5 min)`);

  res.json({
    sent: true,
    ...(process.env.NODE_ENV !== 'production' ? { devOtp: otp } : {}),
  });
});

router.post('/verify-otp', async (req, res) => {
  const { phone, otp, role, name } = req.body ?? {};
  if (typeof phone !== 'string' || !PHONE_RE.test(phone)) {
    return res.status(400).json({ error: 'Invalid phone number.' });
  }
  if (typeof otp !== 'string') {
    return res.status(400).json({ error: 'Enter the OTP.' });
  }

  const result = verifyOtp(phone, otp);
  if (!result.ok) return res.status(400).json({ error: result.reason });

  const existing = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);

  let user;
  if (existing.rows.length > 0) {
    user = existing.rows[0];
  } else {
    // New account. Role is whatever the signup form sent, but 'admin' can
    // never be granted this way — only an existing admin can promote someone.
    const safeRole = SELECTABLE_ROLES.includes(role) ? role : 'buyer';
    const created = await pool.query(
      `INSERT INTO users (phone, name, role, location, avatar_color)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [phone, name?.trim() || `User ${phone.slice(-4)}`, safeRole, '', colorFor(phone)]
    );
    user = created.rows[0];
  }

  const token = signToken(user);
  res.json({ token, user: toClientUser(user) });
});

router.get('/me', requireAuth, async (req, res) => {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.auth.sub]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });
  res.json({ user: toClientUser(result.rows[0]) });
});

export function toClientUser(row) {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    phone: row.phone,
    location: row.location,
    avatarColor: row.avatar_color,
  };
}

export default router;
