import { verifyToken, COOKIE_NAME } from './tokens.js';

export function requireAuth(req, res, next) {
  const token = req.cookies[COOKIE_NAME];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = {
      id: decoded.userId,
      username: decoded.username,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function optionalAuth(req, res, next) {
  const token = req.cookies[COOKIE_NAME];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = verifyToken(token);
    req.user = {
      id: decoded.userId,
      username: decoded.username,
    };
  } catch (err) {
    req.user = null;
  }

  next();
}