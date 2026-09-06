const crypto = require('crypto');
const prisma = require('../config/prisma');

const isProduction = process.env.NODE_ENV === 'production';
let sessionSecret = process.env.SESSION_SECRET || process.env.ADMIN_TOKEN;

if (!sessionSecret || (isProduction && sessionSecret === 'shop_session_secret_key_2026')) {
  if (isProduction) {
    console.warn('⚠️ [SECURITE PRODUCTION] Clé SESSION_SECRET absente ou trop faible dans .env ! Génération d\'une clé éphémère sécurisée.');
    sessionSecret = crypto.randomBytes(32).toString('hex');
  } else {
    sessionSecret = 'shop_session_secret_key_2026';
  }
}

const SESSION_SECRET = sessionSecret;

// Active in-memory caches for high-speed lookups
const AUTH_CODES = new Map();
const AUTH_SESSIONS = new Map();

/**
 * Creates a cryptographically signed session token resilient to server restarts.
 */
function createSession(email) {
  const cleanEmail = email.toLowerCase().trim();
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days validity
  const payload = `${cleanEmail}:${expiresAt}`;
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  const token = Buffer.from(`${payload}:${signature}`).toString('base64url');
  
  AUTH_SESSIONS.set(token, { email: cleanEmail, expiresAt });
  return token;
}

/**
 * Validates a user session token (checks in-memory cache and HMAC signature fallback).
 */
function validateSession(token, email) {
  if (!token || !email) return false;
  const cleanEmail = email.toLowerCase().trim();

  // Fast path: in-memory cache
  const cached = AUTH_SESSIONS.get(token);
  if (cached) {
    if (Date.now() > cached.expiresAt) {
      AUTH_SESSIONS.delete(token);
      return false;
    }
    return cached.email === cleanEmail;
  }

  // Stateless HMAC fallback (recovers session after server restart)
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 3) return false;

    const [tokenEmail, expiresAtStr, signature] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);

    if (Date.now() > expiresAt) return false;
    if (tokenEmail !== cleanEmail) return false;

    const payload = `${tokenEmail}:${expiresAtStr}`;
    const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');

    const sigBuf = Buffer.from(signature, 'utf8');
    const expectedSigBuf = Buffer.from(expectedSignature, 'utf8');

    if (sigBuf.length !== expectedSigBuf.length) return false;

    const isValid = crypto.timingSafeEqual(sigBuf, expectedSigBuf);

    if (isValid) {
      AUTH_SESSIONS.set(token, { email: tokenEmail, expiresAt });
    }
    return isValid;
  } catch (e) {
    return false;
  }
}

function invalidateSession(token) {
  if (token) AUTH_SESSIONS.delete(token);
}

/**
 * Persist OTP Auth Code in SQLite via Prisma (with in-memory fallback).
 */
async function saveAuthCodeAsync(email, code, expiresAt, isRegister, metadata = {}) {
  const cleanEmail = email.toLowerCase().trim();
  
  // Update memory cache
  AUTH_CODES.set(cleanEmail, {
    code,
    expiresAt,
    isRegister: !!isRegister,
    name: metadata.name || '',
    address: metadata.address || ''
  });

  try {
    // Delete any old pending code for this email
    await prisma.authCode.deleteMany({
      where: { email: cleanEmail }
    });

    // Create new code in SQLite
    await prisma.authCode.create({
      data: {
        email: cleanEmail,
        code,
        expiresAt: new Date(expiresAt),
        isRegister: !!isRegister
      }
    });
  } catch (err) {
    console.error('Erreur Prisma saveAuthCodeAsync:', err.message);
  }
}

/**
 * Retrieve OTP Auth Code from DB or Memory.
 */
async function getAuthCodeAsync(email) {
  const cleanEmail = email.toLowerCase().trim();
  
  // Check memory cache first
  const memoryCode = AUTH_CODES.get(cleanEmail);
  if (memoryCode) {
    return memoryCode;
  }

  // Check Prisma SQLite database
  try {
    const dbRecord = await prisma.authCode.findFirst({
      where: { email: cleanEmail },
      orderBy: { createdAt: 'desc' }
    });

    if (dbRecord) {
      const authData = {
        code: dbRecord.code,
        expiresAt: dbRecord.expiresAt.getTime(),
        isRegister: dbRecord.isRegister,
        name: '',
        address: ''
      };
      AUTH_CODES.set(cleanEmail, authData);
      return authData;
    }
  } catch (err) {
    console.error('Erreur Prisma getAuthCodeAsync:', err.message);
  }

  return null;
}

/**
 * Delete Auth Code once verified.
 */
async function deleteAuthCodeAsync(email) {
  const cleanEmail = email.toLowerCase().trim();
  AUTH_CODES.delete(cleanEmail);

  try {
    await prisma.authCode.deleteMany({
      where: { email: cleanEmail }
    });
  } catch (err) {
    console.error('Erreur Prisma deleteAuthCodeAsync:', err.message);
  }
}

async function getUsersAsync() {
  try {
    return await prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' }
    });
  } catch (err) {
    console.error('Erreur Prisma getUsers:', err);
    return [];
  }
}

async function findUserByEmailAsync(email) {
  if (!email) return null;
  const cleanEmail = email.toLowerCase().trim();
  try {
    return await prisma.user.findFirst({
      where: { email: cleanEmail, deletedAt: null }
    });
  } catch (err) {
    console.error('Erreur Prisma findUserByEmail:', err);
    return null;
  }
}

async function saveUserAsync(user) {
  const cleanEmail = user.email.toLowerCase().trim();
  try {
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return await prisma.user.update({
        where: { email: cleanEmail },
        data: {
          name: user.name,
          address: user.address,
          deletedAt: null // Restore account if re-registering
        }
      });
    }

    return await prisma.user.create({
      data: {
        email: cleanEmail,
        name: user.name || cleanEmail.split('@')[0],
        address: user.address || ''
      }
    });
  } catch (err) {
    console.error('Erreur Prisma saveUser:', err);
    return null;
  }
}

async function deleteUserAsync(email) {
  const cleanEmail = email.toLowerCase().trim();
  try {
    const user = await prisma.user.findFirst({
      where: { email: cleanEmail, deletedAt: null }
    });
    if (!user) return { success: false, error: 'Utilisateur non trouvé' };

    // Check if there are active orders in progress within the last 30 days (delivery / return window)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeOrder = await prisma.order.findFirst({
      where: {
        customerEmail: cleanEmail,
        status: { in: ['paid', 'shipped', 'pending'] },
        createdAt: { gte: thirtyDaysAgo },
        deletedAt: null
      }
    });

    if (activeOrder) {
      return {
        success: false,
        hasActiveOrders: true,
        error: `Impossible de supprimer votre compte : la commande ${activeOrder.orderId} est actuellement en cours (${activeOrder.status === 'shipped' ? 'expédiée' : 'en préparation'}). Veuillez patienter jusqu'à sa livraison et la fin du délai de rétractation (30 jours).`
      };
    }

    // Soft delete user account to preserve order history and referential integrity
    await prisma.user.update({
      where: { id: user.id },
      data: { deletedAt: new Date() }
    });
    return { success: true };
  } catch (err) {
    console.error('Erreur Prisma deleteUser (Soft Delete):', err);
    return { success: false, error: 'Erreur interne lors de la suppression' };
  }
}

module.exports = {
  AUTH_CODES,
  AUTH_SESSIONS,
  createSession,
  validateSession,
  invalidateSession,
  saveAuthCodeAsync,
  getAuthCodeAsync,
  deleteAuthCodeAsync,
  getUsersAsync,
  findUserByEmailAsync,
  saveUserAsync,
  deleteUserAsync
};
