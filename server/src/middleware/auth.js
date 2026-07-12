import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'insecure-dev-secret';

export function signToken(user) {
  return jwt.sign({ sub: user.id, phone: user.phone, role: user.role }, JWT_SECRET, {
    expiresIn: '7d',
  });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

// Attaches req.auth = { sub, phone, role } if a valid bearer token is present.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Sign in required.' });
  try {
    req.auth = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
  }
}

// Optional auth: attaches req.auth if present, but never blocks the request.
export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      req.auth = verifyToken(token);
    } catch {
      // ignore invalid token on optional routes
    }
  }
  next();
}

// Role-based access control — only listed roles may proceed.
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.auth) return res.status(401).json({ error: 'Sign in required.' });
    if (!roles.includes(req.auth.role)) {
      return res.status(403).json({ error: `This action is only available to: ${roles.join(', ')}.` });
    }
    next();
  };
}
