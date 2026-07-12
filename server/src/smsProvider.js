// Sends the OTP as a real SMS via Fast2SMS's "Quick SMS" route (route=q),
// which works without DLT template registration — good for getting started
// for free. If FAST2SMS_API_KEY isn't set, falls back to logging the OTP to
// the console so local/dev testing keeps working without any account at all.
//
// Get a free API key: https://www.fast2sms.com  (Dashboard → Dev API →
// copy your Authorization key). New accounts start with free credit.

const FAST2SMS_URL = 'https://www.fast2sms.com/dev/bulkV2';

export async function sendOtpSms(phone, otp) {
  const apiKey = process.env.FAST2SMS_API_KEY;

  if (!apiKey) {
    console.log(`📲 [no SMS provider configured] OTP for +91 ${phone}: ${otp} (valid 5 min)`);
    return { delivered: false, reason: 'no-provider' };
  }

  const params = new URLSearchParams({
    authorization: apiKey,
    route: 'q', // Quick SMS — no DLT template required
    message: `Your Farmer Market Connect OTP is ${otp}. Valid for 5 minutes. Do not share it with anyone.`,
    language: 'english',
    flash: '0',
    numbers: phone,
  });

  try {
    const res = await fetch(`${FAST2SMS_URL}?${params.toString()}`, { method: 'GET' });
    const data = await res.json();
    if (data.return !== true) {
      console.error(`⚠️ Fast2SMS did not confirm delivery for +91 ${phone}:`, data);
      console.log(`📲 [fallback] OTP for +91 ${phone}: ${otp}`);
      return { delivered: false, reason: 'provider-error', detail: data };
    }
    console.log(`✅ OTP SMS sent to +91 ${phone} via Fast2SMS (request id: ${data.request_id ?? 'n/a'})`);
    return { delivered: true };
  } catch (err) {
    console.error(`⚠️ Fast2SMS request failed for +91 ${phone}:`, err.message);
    console.log(`📲 [fallback] OTP for +91 ${phone}: ${otp}`);
    return { delivered: false, reason: 'network-error' };
  }
}
