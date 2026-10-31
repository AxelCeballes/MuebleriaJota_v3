const crypto = require('node:crypto');

const attemptsByIp = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const TOKEN_TTL_SECONDS = 60 * 60 * 8;

function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function getSecret() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET debe tener al menos 32 caracteres.');
  }
  return process.env.JWT_SECRET;
}

function signToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: 'admin', iat: now, exp: now + TOKEN_TTL_SECONDS })).toString('base64url');
  const content = `${header}.${payload}`;
  const signature = crypto.createHmac('sha256', getSecret()).update(content).digest('base64url');
  return `${content}.${signature}`;
}

function verifyToken(token) {
  if (typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [headerPart, payloadPart, signature] = parts;
  const content = `${headerPart}.${payloadPart}`;
  const expected = crypto.createHmac('sha256', getSecret()).update(content).digest('base64url');
  if (!safeEqual(signature, expected)) return false;
  try {
    const header = JSON.parse(Buffer.from(headerPart, 'base64url').toString());
    const payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString());
    return header.alg === 'HS256' && payload.sub === 'admin' && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

function loginAdmin(request, response) {
  const configuredPassword = process.env.ADMIN_PASSWORD;
  if (!configuredPassword || configuredPassword.length < 12) {
    return response.status(503).json({ status: 'error', message: 'ADMIN_PASSWORD debe estar configurada y tener al menos 12 caracteres.' });
  }

  const now = Date.now();
  const ip = request.ip;
  const attempt = attemptsByIp.get(ip);
  if (attempt && now - attempt.startedAt < WINDOW_MS && attempt.count >= MAX_ATTEMPTS) {
    return response.status(429).json({ status: 'error', message: 'Demasiados intentos. Probá más tarde.' });
  }

  if (!request.body?.password || !safeEqual(request.body.password, configuredPassword)) {
    const current = attempt && now - attempt.startedAt < WINDOW_MS
      ? { startedAt: attempt.startedAt, count: attempt.count + 1 }
      : { startedAt: now, count: 1 };
    attemptsByIp.set(ip, current);
    return response.status(401).json({ status: 'error', message: 'Credenciales incorrectas.' });
  }

  attemptsByIp.delete(ip);
  try {
    return response.status(200).json({ token: signToken(), expiresIn: TOKEN_TTL_SECONDS });
  } catch (error) {
    return response.status(503).json({ status: 'error', message: error.message });
  }
}

function requireAdmin(request, response, next) {
  const token = request.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  try {
    if (verifyToken(token)) return next();
  } catch (error) {
    console.error('[Auth] No se pudo validar la configuración de autenticación:', error.message);
    return response.status(503).json({ status: 'error', message: 'Autenticación no configurada correctamente.' });
  }
  return response.status(401).json({ status: 'error', message: 'Autenticación requerida.' });
}

module.exports = { loginAdmin, requireAdmin };
