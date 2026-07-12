// Simple in-memory OTP store (fine for a single-instance dev/demo server).
// For production with multiple server instances, swap this for Redis.

const otps = new Map(); // phone -> { otp, expiresAt, attempts }
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;

function generateOtp() {
  return String(Math.floor(1000 + Math.random() * 9000)); // 4-digit, never leading 0
}

export function issueOtp(phone) {
  const otp = generateOtp();
  otps.set(phone, { otp, expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 });
  return otp;
}

export function verifyOtp(phone, submitted) {
  const record = otps.get(phone);
  if (!record) return { ok: false, reason: 'No OTP was requested for this number. Request a new one.' };
  if (Date.now() > record.expiresAt) {
    otps.delete(phone);
    return { ok: false, reason: 'This OTP has expired. Request a new one.' };
  }
  record.attempts += 1;
  if (record.attempts > MAX_ATTEMPTS) {
    otps.delete(phone);
    return { ok: false, reason: 'Too many incorrect attempts. Request a new OTP.' };
  }
  if (record.otp !== submitted) {
    return { ok: false, reason: 'Incorrect OTP.' };
  }
  otps.delete(phone);
  return { ok: true };
}
